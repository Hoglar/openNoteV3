import json
import os
from pathlib import Path
import subprocess
import sys

from django.test import Client, SimpleTestCase, TestCase, override_settings


class ProductionSettingsTests(SimpleTestCase):
    def test_proxy_trust_is_explicit_and_only_for_production(self):
        # Import fresh settings without reading real credentials or development .env.
        env = {**os.environ, 'PYTHON_DOTENV_DISABLED': '1',
               'DJANGO_SECRET_KEY': 'isolated-settings-check-' * 4,
               'GOOGLE_CLIENT_ID': '', 'GOOGLE_CLIENT_SECRET': '',
               'GITHUB_CLIENT_ID': '', 'GITHUB_CLIENT_SECRET': ''}
        code = (
            'import json; from config import settings as s; '
            'print(json.dumps([s.DEBUG, s.SECURE_PROXY_SSL_HEADER, '
            's.SECURE_SSL_REDIRECT, s.SESSION_COOKIE_SECURE, s.CSRF_COOKIE_SECURE]))'
        )
        for mode, trust, expected in [
            ('local', 'true', [False, None, False, False, False]),
            ('production', 'false', [False, None, True, True, True]),
            ('production', 'true', [False, ['HTTP_X_FORWARDED_PROTO', 'https'], True, True, True]),
        ]:
            with self.subTest(mode=mode, trust=trust):
                result = subprocess.run(
                    [sys.executable, '-c', code], check=True, capture_output=True, text=True,
                    cwd=Path(__file__).resolve().parents[2],
                    env={**env, 'DJANGO_ENV': mode, 'DJANGO_DEBUG': 'false', 'DJANGO_TRUST_PROXY': trust},
                )
                self.assertEqual(json.loads(result.stdout), expected)


@override_settings(
    SECURE_SSL_REDIRECT=True,
    SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO', 'https'),
    SESSION_COOKIE_SECURE=True,
    CSRF_COOKIE_SECURE=True,
    SECURE_HSTS_SECONDS=31536000,
)
class ProductionRequestTests(TestCase):
    def test_https_proxy_preserves_csrf_and_secure_cookie(self):
        client = Client(enforce_csrf_checks=True)
        response = client.get('/api/auth/session/', HTTP_X_FORWARDED_PROTO='https')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.cookies['csrftoken']['secure'])
        self.assertTrue(response.cookies['csrftoken']['httponly'])
        self.assertIn('no-store', response['Cache-Control'])
        self.assertIn('max-age=31536000', response['Strict-Transport-Security'])
        headers = {'HTTP_X_FORWARDED_PROTO': 'https', 'HTTP_HOST': 'testserver',
                   'HTTP_ORIGIN': 'https://testserver'}
        self.assertEqual(client.post('/api/auth/logout/', **headers).status_code, 403)
        headers['HTTP_X_CSRFTOKEN'] = response.json()['csrfToken']
        self.assertEqual(client.post('/api/auth/logout/', **headers).status_code, 200)
        headers['HTTP_ORIGIN'] = 'https://evil.example'
        self.assertEqual(client.post('/api/auth/logout/', **headers).status_code, 403)

    def test_plain_http_redirects_and_untrusted_header_is_ignored(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 301)
        self.assertEqual(response.url, 'https://testserver/api/health/')
        with override_settings(SECURE_PROXY_SSL_HEADER=None):
            self.assertEqual(self.client.get('/api/health/', HTTP_X_FORWARDED_PROTO='https').status_code, 301)
