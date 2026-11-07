import hashlib
import json
import secrets

from rest_framework.exceptions import ValidationError

from accounts.models import User
from .models import Placement


def lock_map(user):
    # Serialize map mutations and progress changes for this user in a transaction.
    User.objects.select_for_update().get(pk=user.pk)


def add_to_map(user, star):
    existing = Placement.objects.filter(owner=user, star=star).first()
    if existing and existing.active:
        return existing
    points = list(Placement.objects.filter(owner=user, active=True).values_list('x', 'y'))
    if len(points) >= 200:
        raise ValidationError('Første versjon støtter inntil 200 stjerner i hvert kart.')
    if existing:
        existing.active = True
        existing.save(update_fields=['active'])
        return existing
    rng = secrets.SystemRandom()
    candidates = [(rng.uniform(6, 94), rng.uniform(8, 92)) for _ in range(80)]
    x, y = max(candidates, key=lambda p: min(((p[0]-a)**2 + (p[1]-b)**2 for a, b in points), default=1))
    return Placement.objects.create(owner=user, star=star, x=x, y=y)


def exercise_digest(exercise):
    return hashlib.sha256(json.dumps(exercise, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
