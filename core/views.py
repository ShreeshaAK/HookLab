from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.generic import ListView, DetailView
from django.contrib.auth.models import User
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response          
from .models import VideoIdea, HookVariant
import json
# FIX 1: Removed stray @csrf_exempt that was sitting above @api_view.
# DRF's @api_view handles CSRF internally — the extra decorator was breaking
# the decorator chain and could cause unexpected behavior.
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def creator_dashboard(request):
    user_videos = VideoIdea.objects.filter(creator=request.user)

    # Status filter — GET /api/dashboard/?status=READY
    status_filter = request.query_params.get('status')
    if status_filter:
        user_videos = user_videos.filter(status=status_filter)

    if request.method == 'POST':
        new_video = VideoIdea.objects.create(
            creator=request.user,
            title=request.data.get('title'),
            status=request.data.get('status', 'DRAFT')
        )
        return Response({"message": "Video created!", "id": new_video.id}, status=201)

    total_views = HookVariant.objects.filter(
        video__in=user_videos
    ).aggregate(Sum('actual_views'))['actual_views__sum'] or 0

    total_hooks = HookVariant.objects.filter(video__in=user_videos).count()

    data = {
        "creator": request.user.username,
        "analytics": {
            "total_videos": user_videos.count(),
            "total_views": total_views,
            "total_hooks_tested": total_hooks,
        },
        "pipeline": [
            {
                "id": v.id,
                "title": v.title,
                "status": v.status,
                "hook_count": v.hooks.count(),
            }
            for v in user_videos
        ],
    }
    return Response(data)


class DashboardView(ListView):
    model = VideoIdea
    template_name = 'core/dashboard.html'
    context_object_name = 'videos'
    ordering = ['-created_at']


class VideoDetailView(DetailView):
    model = VideoIdea
    template_name = 'core/video_detail.html'
    context_object_name = 'video'


def api_hook_performance(request, video_id):
    video = get_object_or_404(VideoIdea, id=video_id)
    hooks = video.hooks.all().order_by('-actual_views')

    data = {
        "video_title": video.title,
        "hook_ids": [h.id for h in hooks],
        "labels": [f"{h.hook_text[:20]}..." for h in hooks],
        "views": [h.actual_views for h in hooks],
        "scores": [h.predicted_score for h in hooks],
    }
    return JsonResponse(data)


# FIX 2: Added @api_view and @permission_classes to api_add_hook.
# Previously it had no auth check — any anonymous user could POST hooks
# to any video. Now only authenticated users can add hooks.
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_hook(request, video_id):
    video = get_object_or_404(VideoIdea, id=video_id)

    # FIX 2b: Also added an ownership check so a user can only add hooks
    # to their OWN videos, not someone else's.
    if video.creator != request.user:
        return Response({"error": "Not your video."}, status=403)

    HookVariant.objects.create(
        video=video,
        hook_text=request.data.get('hook_text'),
        predicted_score=request.data.get('predicted_score', 50),
        actual_views=0,
    )
    return Response({"status": "success", "message": "Hook added!"}, status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_video(request, pk):
    video = get_object_or_404(VideoIdea, id=pk, creator=request.user)

    if request.method == 'PATCH':
        new_status = request.data.get('status')
        if new_status:
            video.status = new_status
            video.save()
            return Response({"message": "Status updated successfully"})
        return Response({"error": "No status provided."}, status=400)

    elif request.method == 'DELETE':
        video.delete()
        return Response({"message": "Video deleted entirely"})


# FIX 3: Added missing @api_view and @permission_classes decorators.
# Without these, request.data didn't exist (it's a DRF attribute),
# so any PATCH would crash with an AttributeError.
# Also added an ownership check via video__creator=request.user.
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_hook(request, pk):
    hook = get_object_or_404(HookVariant, id=pk, video__creator=request.user)

    if request.method == 'PATCH':
        views_data = request.data.get('actual_views')
        if views_data is not None:
            hook.actual_views = int(views_data)
            hook.save()
            return Response({"status": "success", "new_views": hook.actual_views})
        return Response({"error": "No actual_views provided."}, status=400)

    elif request.method == 'DELETE':
        hook.delete()
        return Response({"status": "deleted"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_ab_test(request, video_id):
    video = get_object_or_404(VideoIdea, id=video_id,
                              creator=request.user)
    total_views = int(request.data.get('total_views', 10000))
    hooks = video.hooks.all()
    total_score = sum(h.predicted_score for h in hooks) or 1

    for hook in hooks:
        weight = hook.predicted_score / total_score
        # add gaussian noise for realism
        import random
        noise = random.gauss(1.0, 0.15)
        hook.actual_views = int(total_views * weight * noise)
        hook.save()

    return Response({"message": "Simulation complete"})

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"error": "Username and password required."}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken."}, status=400)

    if len(password) < 6:
        return Response({"error": "Password must be at least 6 characters."}, status=400)

    user = User.objects.create_user(username=username, password=password)
    return Response({"message": f"Account created for {user.username}!"}, status=201)