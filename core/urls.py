from django.urls import path
from . import views
 
urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('video/<int:pk>/', views.VideoDetailView.as_view(), name='video_detail'),
    path('api/dashboard/', views.creator_dashboard, name='creator_dashboard'),
    path('api/video/<int:video_id>/performance/', views.api_hook_performance, name='api_hook_performance'),
    path('api/video/<int:video_id>/add-hook/', views.api_add_hook, name='api_add_hook'),
    path('api/video/<int:pk>/manage/', views.manage_video, name='manage_video'),
    path('api/hook/<int:pk>/manage/', views.manage_hook, name='manage_hook'),
    path('api/video/<int:video_id>/simulate/',
     views.simulate_ab_test),
    path('api/signup/', views.signup, name='signup'),
]
 