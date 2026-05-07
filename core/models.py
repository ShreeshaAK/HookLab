from django.db import models
from django.contrib.auth.models import User

class VideoIdea(models.Model):
    # ADD THIS LINE: Ties the video to a specific logged-in creator
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos', null=True)
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCRIPTING', 'Scripting'),
        ('READY', 'Ready to Shoot'),
        ('PUBLISHED', 'Published'),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

# (Keep your HookVariant model exactly the same)

class HookVariant(models.Model):
    # The ForeignKey creates the One-to-Many relationship
    # related_name='hooks' allows us to do `video.hooks.all()` later in the views!
    video = models.ForeignKey(VideoIdea, on_delete=models.CASCADE, related_name='hooks')
    
    hook_text = models.CharField(max_length=255, help_text="The actual 3-second hook script")
    predicted_score = models.IntegerField(default=50, help_text="AI or manual gut-check score (1-100)")
    actual_views = models.IntegerField(default=0, help_text="Views populated after A/B testing")
    is_winner = models.BooleanField(default=False, help_text="Mark true if this hook performed the best")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.video.title} - Hook: {self.hook_text[:30]}..."
