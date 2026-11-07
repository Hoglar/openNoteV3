from rest_framework import serializers

from common.api import AuthorSerializer, StrictSerializer
from easywork.models import Star
from easywork.serializers import StarSummarySerializer
from .models import Note, Comment


class NoteSerializer(StrictSerializer):
    owner = AuthorSerializer(read_only=True)
    title = serializers.CharField(max_length=160)
    body = serializers.CharField(max_length=50000)
    tags = serializers.ListField(child=serializers.CharField(max_length=40), max_length=10, default=list)
    star_ids = serializers.PrimaryKeyRelatedField(source='stars', queryset=Star.objects.all(), many=True, write_only=True, required=False)
    stars = StarSummarySerializer(many=True, read_only=True)

    def validate_tags(self, values):
        return list(dict.fromkeys(' '.join(value.lower().split()) for value in values))

    def validate_star_ids(self, values):
        if len(values) > 10:
            raise serializers.ValidationError('Et notat kan kobles til høyst 10 stjerner.')
        return values

    class Meta:
        model = Note
        fields = ['id', 'owner', 'title', 'body', 'tags', 'stars', 'star_ids', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class NoteSummarySerializer(serializers.ModelSerializer):
    owner = AuthorSerializer(read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'owner', 'title', 'tags', 'updated_at']


class CommentSerializer(StrictSerializer):
    owner = AuthorSerializer(read_only=True)
    body = serializers.CharField(max_length=10000)

    class Meta:
        model = Comment
        fields = ['id', 'owner', 'body', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
