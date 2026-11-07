from allauth.socialaccount.providers.github.provider import GitHubProvider
from allauth.socialaccount.providers.google.provider import GoogleProvider


class MinimalProfile:
    # Filter BEFORE SocialLogin.lookup(), which saves extra_data on repeat login.
    def extract_common_fields(self, data):
        return {}

    def extract_extra_data(self, data):
        return {}

    def extract_email_addresses(self, data):
        return []


class MinimalGoogleProvider(MinimalProfile, GoogleProvider):
    package = 'allauth.socialaccount.providers.google'


class MinimalGitHubProvider(MinimalProfile, GitHubProvider):
    package = 'allauth.socialaccount.providers.github'
