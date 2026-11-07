import json
import re

from rest_framework import serializers

from common.api import AuthorSerializer, StrictSerializer
from .models import Star, Connection


def validate_exercises(value):
    if not isinstance(value, list) or len(value) > 50:
        raise serializers.ValidationError('Bruk en liste med høyst 50 oppgaver.')
    seen = set()
    for exercise in value:
        if not isinstance(exercise, dict) or set(exercise) != {'id', 'prompt', 'answer'}:
            raise serializers.ValidationError('Hver oppgave må ha id, prompt og answer.')
        key = exercise['id']
        if not isinstance(key, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,64}', key) or key in seen:
            raise serializers.ValidationError('Oppgave-ID må være unik og bruke bokstaver, tall, _ eller - (1–64 tegn).')
        seen.add(key)
        for field in ['prompt', 'answer']:
            text = exercise[field]
            if not isinstance(text, str) or len(text) > 10000 or (field == 'prompt' and not text.strip()):
                raise serializers.ValidationError('Oppgaver trenger tekst; oppgave og fasit kan ha høyst 10 000 tegn hver.')
    if len(json.dumps(value).encode()) > 150000:
        raise serializers.ValidationError('Oppgavene er for store (maks 150 kB).')
    return value


class StarSerializer(StrictSerializer):
    owner = AuthorSerializer(read_only=True)
    title = serializers.CharField(max_length=120)
    theory = serializers.CharField(max_length=50000)
    exercises = serializers.JSONField(validators=[validate_exercises])

    class Meta:
        model = Star
        fields = ['id', 'owner', 'title', 'theory', 'exercises', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class StarSummarySerializer(serializers.ModelSerializer):
    owner = AuthorSerializer(read_only=True)
    exercise_count = serializers.SerializerMethodField()

    def get_exercise_count(self, obj):
        return len(obj.exercises)

    class Meta:
        model = Star
        fields = ['id', 'owner', 'title', 'exercise_count', 'updated_at']


class ConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connection
        fields = ['id', 'source', 'target']
