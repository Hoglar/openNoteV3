import unicodedata
from functools import wraps

from allauth.headless.socialaccount.views import RedirectToProviderView
from django.conf import settings
from django.contrib.auth import logout
from django.db import DatabaseError, connection
from django.http import HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_POST
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response


def user_payload(user):
    return {'id': str(user.pk), 'displayName': user.display_name,
            'needsDisplayName': not bool(user.display_name)}


@require_GET
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
    except DatabaseError:
        return JsonResponse({'status': 'unavailable'}, status=503)
    return JsonResponse({'status': 'ok'})


@require_GET
def session(request):
    return JsonResponse({
        'user': user_payload(request.user) if request.user.is_authenticated else None,
        'csrfToken': get_token(request),
        'providers': [{'id': p, 'name': name, 'enabled': bool(settings.SOCIALACCOUNT_PROVIDERS[p].get('APP'))}
                      for p, name in [('google', 'Google'), ('github', 'GitHub')]],
    })


@require_POST
@csrf_protect
def sign_out(request):
    logout(request)
    return JsonResponse({'user': None, 'csrfToken': get_token(request)})


class ProfileSerializer(serializers.Serializer):
    displayName = serializers.CharField(min_length=2, max_length=40, trim_whitespace=True)

    def to_internal_value(self, data):
        if isinstance(data, dict) and set(data) - {'displayName'}:
            raise serializers.ValidationError({'non_field_errors': ['Bare visningsnavn kan endres.']})
        return super().to_internal_value(data)

    def validate_displayName(self, value):
        if any(unicodedata.category(c).startswith('C') for c in value):
            raise serializers.ValidationError('Navnet kan ikke inneholde kontrolltegn.')
        return value


@api_view(['POST'])
def profile(request):
    serializer = ProfileSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    request.user.display_name = serializer.validated_data['displayName']
    request.user.save(update_fields=['display_name'])
    return Response({'user': user_payload(request.user)})


class LoginRedirectView(RedirectToProviderView):
    def post(self, request, *args, **kwargs):
        if (request.POST.get('process') != 'login'
                or request.POST.get('callback_url') != '/login'
                or request.POST.get('provider') not in ('google', 'github')):
            return JsonResponse({'error': 'Ugyldig innlogging.'}, status=400)
        if not settings.SOCIALACCOUNT_PROVIDERS[request.POST['provider']].get('APP'):
            return JsonResponse({'error': 'Innlogging er ikke konfigurert.'}, status=503)
        return super().post(request, *args, **kwargs)


def configured_callback(provider, callback):
    @wraps(callback)
    def view(request, *args, **kwargs):
        if not settings.SOCIALACCOUNT_PROVIDERS[provider].get('APP'):
            return HttpResponseRedirect('/login?error=provider')
        return callback(request, *args, **kwargs)
    return view
