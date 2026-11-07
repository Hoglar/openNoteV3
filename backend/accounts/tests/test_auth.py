from copy import deepcopy
import json
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlparse

from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount, SocialToken
from django.conf import settings
from django.contrib.sessions.models import Session
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from accounts.models import User


PROVIDERS = deepcopy(settings.SOCIALACCOUNT_PROVIDERS)
for config in PROVIDERS.values():
    config['APP'] = {'client_id': 'test-client', 'secret': 'test-secret', 'key': ''}


@override_settings(SOCIALACCOUNT_PROVIDERS=PROVIDERS)
class AuthTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)

    def csrf(self):
        return self.client.get('/api/auth/session/').json()['csrfToken']

    def start_login(self, provider='google', **extra):
        return self.client.post('/_allauth/browser/v1/auth/provider/redirect', {
            'provider': provider, 'process': 'login', 'callback_url': '/login',
            'csrfmiddlewaretoken': self.csrf(), **extra,
        })

    def login(self, provider='google', uid='provider-123'):
        redirect = self.start_login(provider)
        self.assertEqual(redirect.status_code, 302)
        query = parse_qs(urlparse(redirect.url).query)
        self.assertTrue(query['state'][0])
        self.assertEqual(query['code_challenge_method'], ['S256'])
        scope = query.get('scope', [''])[0]
        self.assertEqual(scope, 'openid' if provider == 'google' else '')
        upstream = {'sub': uid, 'id': uid, 'login': 'PRIVATE-username',
                    'name': 'PRIVATE-name', 'email': 'private@example.org',
                    'email_verified': True, 'picture': 'https://private.example/avatar',
                    'emails': [{'email': 'private@example.org', 'verified': True, 'primary': True}]}
        http = Mock()
        http.get.return_value.json.return_value = upstream
        http.__enter__ = Mock(return_value=http)
        http.__exit__ = Mock(return_value=False)
        with patch('allauth.socialaccount.providers.oauth2.client.OAuth2Client.get_access_token',
                   return_value={'access_token': 'PRIVATE-access-token', 'refresh_token': 'PRIVATE-refresh-token'}), \
             patch('allauth.socialaccount.providers.google.views.GoogleOAuth2Adapter._fetch_user_info', return_value=upstream), \
             patch('allauth.socialaccount.adapter.DefaultSocialAccountAdapter.get_requests_session', return_value=http):
            result = self.client.get(f'/accounts/{provider}/login/callback/', {
                'code': 'test-code', 'state': query['state'][0],
            })
        self.assertEqual(result.status_code, 302)
        self.assertEqual(result.url, '/login')
        self.assertIsNotNone(self.client.get('/api/auth/session/').json()['user'])
        return query['state'][0]

    def assert_minimal_data(self):
        self.assertFalse(EmailAddress.objects.exists())
        self.assertFalse(SocialToken.objects.exists())
        for account in SocialAccount.objects.all():
            self.assertEqual(account.extra_data, {})
        for user in User.objects.all():
            self.assertFalse(user.has_usable_password())
            self.assertFalse(hasattr(user, 'email'))
        for stored in Session.objects.all():
            content = json.dumps(stored.get_decoded())
            self.assertNotIn('PRIVATE-', content)
            self.assertNotIn('private@example.org', content)

    def test_first_and_repeat_login_minimize_data_for_both_providers(self):
        for provider in ('google', 'github'):
            with self.subTest(provider=provider):
                self.client = Client(enforce_csrf_checks=True)
                self.login(provider)
                user_id = self.client.get('/api/auth/session/').json()['user']['id']
                self.assert_minimal_data()
                self.client.post('/api/auth/logout/', HTTP_X_CSRFTOKEN=self.csrf())
                self.login(provider)
                self.assertEqual(self.client.get('/api/auth/session/').json()['user']['id'], user_id)
                self.assert_minimal_data()
        # Same upstream ID/email/name on different providers MUST NOT merge accounts.
        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(SocialAccount.objects.count(), 2)

    def test_session_profile_and_logout(self):
        self.login()
        initial = self.client.get('/api/auth/session/').json()
        self.assertTrue(initial['user']['needsDisplayName'])
        other = User.objects.create_user(display_name='Annen')
        self.assertEqual(self.client.post('/api/auth/profile/', {'displayName': 'Navn'}, content_type='application/json').status_code, 403)
        csrf = self.csrf()
        for data in [{'displayName': 'X'}, {'displayName': 'a' * 41}, {'displayName': 'ab\u0000cd'},
                     {'displayName': 'Navn', 'id': str(other.pk)}]:
            result = self.client.post('/api/auth/profile/', data, content_type='application/json', HTTP_X_CSRFTOKEN=csrf)
            self.assertEqual(result.status_code, 400)
        result = self.client.post('/api/auth/profile/', {'displayName': '  Månestjerne  '}, content_type='application/json', HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(result.json()['user']['displayName'], 'Månestjerne')
        other.refresh_from_db()
        self.assertEqual(other.display_name, 'Annen')
        key = self.client.cookies[settings.SESSION_COOKIE_NAME].value
        fresh_browser = Client()
        fresh_browser.cookies = self.client.cookies.copy()
        self.assertEqual(fresh_browser.get('/api/auth/session/').json()['user']['displayName'], 'Månestjerne')
        stored = Session.objects.get(session_key=key)
        self.assertLessEqual((stored.expire_date - timezone.now()).total_seconds(), 7 * 86400)
        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 403)
        self.assertEqual(self.client.get('/api/auth/logout/').status_code, 405)
        self.assertEqual(self.client.post('/api/auth/logout/', HTTP_X_CSRFTOKEN=csrf).status_code, 200)
        self.assertFalse(Session.objects.filter(session_key=key).exists())
        self.assertIsNone(fresh_browser.get('/api/auth/session/').json()['user'])

    def test_unauthenticated_profile_and_unexposed_routes(self):
        self.assertEqual(self.client.post('/api/auth/profile/', {'displayName': 'Navn'}, content_type='application/json', HTTP_X_CSRFTOKEN=self.csrf()).status_code, 403)
        for path in ['/accounts/login/', '/accounts/signup/', '/_allauth/browser/v1/account/providers', '/_allauth/browser/v1/auth/login']:
            self.assertEqual(self.client.get(path).status_code, 404)

    def test_invalid_state_cancel_replay_and_redirect(self):
        self.assertEqual(self.client.post('/_allauth/browser/v1/auth/provider/redirect', {'provider': 'google'}).status_code, 403)
        self.assertEqual(self.start_login(process='connect').status_code, 400)
        self.assertEqual(self.start_login(callback_url='https://evil.example').status_code, 400)
        self.assertEqual(self.start_login(provider='unknown').status_code, 400)
        with patch('allauth.socialaccount.providers.oauth2.client.OAuth2Client.get_access_token') as exchange:
            response = self.client.get('/accounts/google/login/callback/?state=invalid&code=code')
            self.assertEqual(response.url, '/login?error=provider')
            exchange.assert_not_called()
        start = self.start_login()
        state = parse_qs(urlparse(start.url).query)['state'][0]
        self.assertEqual(self.client.get('/accounts/google/login/callback/', {'state': state, 'error': 'access_denied'}).url, '/login?error=provider')
        self.assertIsNone(self.client.get('/api/auth/session/').json()['user'])
        used_state = self.login()
        self.assertEqual(self.client.get('/accounts/google/login/callback/', {'state': used_state, 'code': 'code'}).url, '/login?error=provider')

    @override_settings(SOCIALACCOUNT_PROVIDERS={k: {p: v for p, v in config.items() if p != 'APP'} for k, config in PROVIDERS.items()})
    def test_missing_credentials_and_no_private_fields(self):
        response = self.client.get('/api/auth/session/')
        self.assertIn('no-store', response['Cache-Control'])
        self.assertFalse(any(p['enabled'] for p in response.json()['providers']))
        self.assertIsNone(response.json()['user'])
        self.assertNotIn('secret', response.content.decode())
        self.assertEqual(self.start_login().status_code, 503)
        for provider in ('google', 'github'):
            response = self.client.get(f'/accounts/{provider}/login/callback/?code=unexpected')
            self.assertEqual(response.url, '/login?error=provider')

    def test_profile_requires_an_object(self):
        self.login()
        for invalid in [[], ['bad'], 123, None]:
            response = self.client.post('/api/auth/profile/', json.dumps(invalid),
                                        content_type='application/json', HTTP_X_CSRFTOKEN=self.csrf())
            self.assertEqual(response.status_code, 400)

    def test_health(self):
        self.assertEqual(self.client.get('/api/health/').json(), {'status': 'ok'})
