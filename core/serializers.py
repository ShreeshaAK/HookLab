class HookVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = HookVariant
        fields = '__all__'

class VideoIdeaSerializer(serializers.ModelSerializer):
    hooks = HookVariantSerializer(many=True, read_only=True)
    hook_count = serializers.SerializerMethodField()

    def get_hook_count(self, obj):
        return obj.hooks.count()

    class Meta:
        model = VideoIdea
        fields = ['id','title','status','hook_count','hooks','created_at']
