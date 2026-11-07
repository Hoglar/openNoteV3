from allauth.headless.constants import Client
from allauth.socialaccount.providers.google.views import oauth2_callback as google_callback
from allauth.socialaccount.providers.github.views import oauth2_callback as github_callback
from django.urls import include, path
from rest_framework.routers import SimpleRouter

from accounts import views
from notes.views import NoteViewSet, CommentViewSet
from easywork import views as easywork

router = SimpleRouter()
router.register('notes', NoteViewSet, basename='note')
router.register('stars', easywork.StarViewSet, basename='star')
comments = CommentViewSet.as_view({'get': 'list', 'post': 'create'})
comment = CommentViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})

# Only expose the flows the product supports. No password or account-link routes.
urlpatterns = [
    path('api/', include(router.urls)),
    path('api/notes/<uuid:note_id>/comments/', comments),
    path('api/notes/<uuid:note_id>/comments/<uuid:pk>/', comment),
    path('api/map-owners/', easywork.owners),
    path('api/map/', easywork.sky),
    path('api/map/<uuid:star_id>/', easywork.remove_from_sky),
    path('api/connections/', easywork.connect),
    path('api/connections/<int:pk>/', easywork.disconnect),
    path('api/health/', views.health),
    path('api/auth/session/', views.session),
    path('api/auth/profile/', views.profile),
    path('api/auth/logout/', views.sign_out),
    path('_allauth/browser/v1/auth/provider/redirect',
         views.LoginRedirectView.as_api_view(client=Client.BROWSER)),
    path('accounts/google/login/callback/', views.configured_callback('google', google_callback), name='google_callback'),
    path('accounts/github/login/callback/', views.configured_callback('github', github_callback), name='github_callback'),
]
