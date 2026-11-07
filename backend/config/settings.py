import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / '.env')
LOCAL = os.environ.get('DJANGO_ENV', 'production') == 'local'
DEBUG = LOCAL and os.environ.get('DJANGO_DEBUG', 'false') == 'true'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if len(SECRET_KEY) < 50:
    raise ImproperlyConfigured('DJANGO_SECRET_KEY må ha minst 50 tegn. Se README.')

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')
CSRF_TRUSTED_ORIGINS = [s for s in os.environ.get('DJANGO_CSRF_TRUSTED_ORIGINS', '').split(',') if s]
INSTALLED_APPS = [
    'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions',
    'django.contrib.messages', 'django.contrib.staticfiles',
    'rest_framework', 'accounts', 'notes', 'easywork', 'allauth', 'allauth.account',
    'allauth.socialaccount', 'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.github', 'allauth.headless',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'accounts.middleware.PrivateAuthResponsesMiddleware',
]
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates', 'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': os.environ.get('POSTGRES_DB', 'opennote'),
    'USER': os.environ.get('POSTGRES_USER', 'opennote'),
    'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),
    'HOST': os.environ.get('POSTGRES_HOST', '127.0.0.1'),
    'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    'CONN_MAX_AGE': 60,
    'OPTIONS': {'connect_timeout': 5},
}}
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'accounts.User'
AUTHENTICATION_BACKENDS = ['allauth.account.auth_backends.AuthenticationBackend']
LANGUAGE_CODE = 'nb'
TIME_ZONE = 'UTC'
USE_TZ = True
STATIC_URL = '/static/'
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 7 * 24 * 60 * 60
SESSION_SAVE_EVERY_REQUEST = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = not LOCAL
CSRF_COOKIE_SECURE = not LOCAL
CSRF_COOKIE_HTTPONLY = True  # The frontend receives a masked token via session API.
SECURE_SSL_REDIRECT = not LOCAL
SECURE_HSTS_SECONDS = 31536000 if not LOCAL else 0
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
DATA_UPLOAD_MAX_MEMORY_SIZE = 512 * 1024

ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_USER_MODEL_EMAIL_FIELD = None
ACCOUNT_SIGNUP_FIELDS = ['email']  # Optional library field; no signup form is exposed.
ACCOUNT_LOGIN_METHODS = {'email'}  # Inactive: SOCIALACCOUNT_ONLY, no password routes.
# allauth cross-checks password login against signup even in social-only mode.
SILENCED_SYSTEM_CHECKS = ['account.W001']
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_ADAPTER = 'accounts.adapters.AccountAdapter'
ACCOUNT_USER_DISPLAY = 'accounts.models.user_display'
SOCIALACCOUNT_ONLY = True
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_QUERY_EMAIL = False
SOCIALACCOUNT_EMAIL_REQUIRED = False
SOCIALACCOUNT_STORE_TOKENS = False
SOCIALACCOUNT_EMAIL_AUTHENTICATION = False
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = False
SOCIALACCOUNT_ADAPTER = 'accounts.adapters.SocialAccountAdapter'
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'provider_class': 'accounts.providers.MinimalGoogleProvider',
        'SCOPE': ['openid'], 'AUTH_PARAMS': {'access_type': 'online'},
        'OAUTH_PKCE_ENABLED': True,
    },
    'github': {
        'provider_class': 'accounts.providers.MinimalGitHubProvider',
        'SCOPE': [], 'OAUTH_PKCE_ENABLED': True,
    },
}
for provider, config in SOCIALACCOUNT_PROVIDERS.items():
    client_id = os.environ.get(f'{provider.upper()}_CLIENT_ID', '')
    secret = os.environ.get(f'{provider.upper()}_CLIENT_SECRET', '')
    if bool(client_id) != bool(secret):
        raise ImproperlyConfigured(f'{provider}: både client ID og secret kreves.')
    if client_id and secret:
        config['APP'] = {'client_id': client_id, 'secret': secret, 'key': ''}

HEADLESS_ONLY = True
HEADLESS_CLIENTS = ('browser',)
HEADLESS_FRONTEND_URLS = {
    'account_signup': '/login', 'socialaccount_signup': '/login',
    'socialaccount_login_error': '/login?error=provider',
    'account_login': '/login',
}
LOGIN_REDIRECT_URL = '/login'
ACCOUNT_LOGOUT_REDIRECT_URL = '/'
REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': ['common.parsers.BoundedJSONParser'],
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.SessionAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}
# Request URLs can contain OAuth codes. Do not persist development access logs.
LOGGING = {
    'version': 1, 'disable_existing_loggers': False,
    'handlers': {'discard': {'class': 'logging.NullHandler'}},
    'loggers': {'django.server': {'handlers': ['discard'], 'propagate': False}},
}
