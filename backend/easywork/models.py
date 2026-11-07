import uuid

from django.conf import settings
from django.db import models


class Star(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=120)
    theory = models.TextField()
    exercises = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Placement(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    star = models.ForeignKey(Star, on_delete=models.CASCADE)
    x = models.FloatField()
    y = models.FloatField()
    active = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['owner', 'star'], name='unique_map_star')]


class Connection(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    source = models.ForeignKey(Star, on_delete=models.CASCADE, related_name='+')
    target = models.ForeignKey(Star, on_delete=models.CASCADE, related_name='+')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['owner', 'source', 'target'], name='unique_map_connection'),
            models.CheckConstraint(condition=models.Q(source__lt=models.F('target')), name='ordered_connection'),
        ]


class Practice(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    star = models.ForeignKey(Star, on_delete=models.CASCADE)
    exercise_id = models.CharField(max_length=64)
    digest = models.CharField(max_length=64)
    done = models.BooleanField(default=True)
    repetitions = models.PositiveIntegerField(default=1)
    completed_at = models.DateTimeField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['owner', 'star', 'exercise_id'], name='unique_exercise_progress')]
