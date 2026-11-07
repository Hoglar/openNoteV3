from django.utils.cache import patch_cache_control


class PrivateAuthResponsesMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith(('/api/', '/accounts/', '/_allauth/')):
            patch_cache_control(response, private=True, no_store=True)
            response['Referrer-Policy'] = 'no-referrer'
        return response
