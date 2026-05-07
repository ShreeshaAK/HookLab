from django.contrib import admin
from .models import VideoIdea, HookVariant

# This allows you to add hooks directly on the VideoIdea page in the admin!
class HookVariantInline(admin.TabularInline):
    model = HookVariant
    extra = 1 # Shows one empty row by default

@admin.register(VideoIdea)
class VideoIdeaAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'created_at', 'get_hook_count')
    list_filter = ('status', 'created_at')
    search_fields = ('title',)
    inlines = [HookVariantInline]

    # Custom column to show how many hooks a video has
    def get_hook_count(self, obj):
        return obj.hooks.count()
    get_hook_count.short_description = 'Number of Hooks'

@admin.register(HookVariant)
class HookVariantAdmin(admin.ModelAdmin):
    list_display = ('hook_text', 'video', 'predicted_score', 'actual_views', 'is_winner')
    list_filter = ('is_winner', 'video')
    list_editable = ('actual_views', 'is_winner') # Edit these directly from the list view!