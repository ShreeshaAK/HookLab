from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
 
urlpatterns = [
    path('admin/', admin.site.urls),
 
    # JWT login endpoint — React calls POST /api/token/ with {username, password}
    # and gets back {access, refresh} tokens
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
 
    # All your core app routes (dashboard, videos, hooks)
    path('', include('core.urls')),
]
 