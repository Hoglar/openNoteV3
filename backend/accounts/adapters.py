from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.core.exceptions import ImmediateHttpResponse
from django.http import HttpResponseRedirect


class AccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return False  # Only verified social signups, below.


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def is_open_for_signup(self, request, sociallogin):
        return True

    def pre_social_login(self, request, sociallogin):
        # Provider subclasses already removed profiles before the DB lookup.
        sociallogin.token = None
        sociallogin.email_addresses = []
        if sociallogin.state.get('process', 'login') != 'login':
            raise ImmediateHttpResponse(HttpResponseRedirect('/login?error=provider'))

    def on_authentication_error(self, request, provider, **kwargs):
        # Do not expose upstream exception messages or identity data to the browser.
        raise ImmediateHttpResponse(HttpResponseRedirect('/login?error=provider'))
