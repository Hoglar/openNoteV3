from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from accounts.models import User
from common.api import AuthorSerializer, Pagination, PublicReadOwnerWrite
from .models import Star, Placement, Connection, Practice
from .serializers import StarSerializer, StarSummarySerializer, ConnectionSerializer
from .services import add_to_map, exercise_digest, lock_map


class StarViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicReadOwnerWrite]
    pagination_class = Pagination
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = Star.objects.select_related('owner').order_by('-updated_at', 'id')
        if self.action == 'list':
            queryset = queryset.filter(title__icontains=self.request.query_params.get('q', '')[:120])
        return queryset

    def get_serializer_class(self):
        return StarSummarySerializer if self.action == 'list' else StarSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        lock_map(self.request.user)
        star = serializer.save(owner=self.request.user)
        add_to_map(self.request.user, star)

    @action(detail=True, methods=['get', 'post'], permission_classes=[PublicReadOwnerWrite])
    @transaction.atomic
    def practice(self, request, pk=None):
        # Shared stars are public, but progress belongs exclusively to the reader.
        if not request.user.is_authenticated:
            return Response({'detail': 'Logg inn for å se egen øving.'}, status=403)
        star = get_object_or_404(Star, pk=pk)
        lock_map(request.user)
        records = Practice.objects.filter(owner=request.user, star=star)
        if request.method == 'POST':
            serializers.DictField().run_validation(request.data)
            if not Placement.objects.filter(owner=request.user, star=star, active=True).exists():
                raise serializers.ValidationError('Legg stjernen i kartet ditt før du registrerer øving.')
            if request.data == {'reset': True}:
                records.update(done=False)
            else:
                if set(request.data) != {'exercise_id', 'revision'}:
                    raise serializers.ValidationError('Send exercise_id og revision, eller reset.')
                if serializers.DateTimeField().run_validation(request.data['revision']) != star.updated_at:
                    raise serializers.ValidationError('Stjernen er endret siden du åpnet den. Last siden på nytt før du registrerer øvingen.')
                exercise = next((item for item in star.exercises if item['id'] == request.data['exercise_id']), None)
                if not exercise:
                    raise serializers.ValidationError('Oppgaven finnes ikke lenger. Last stjernen på nytt.')
                digest = exercise_digest(exercise)
                record, created = records.get_or_create(owner=request.user, star=star, exercise_id=exercise['id'], defaults={
                    'digest': digest, 'completed_at': timezone.now(),
                })
                if not created and (not record.done or record.digest != digest):
                    record.done, record.digest = True, digest
                    record.repetitions += 1
                    record.completed_at = timezone.now()
                    record.save()
        current = {item['id']: exercise_digest(item) for item in star.exercises}
        return Response({'completed': [r.exercise_id for r in records if r.done and current.get(r.exercise_id) == r.digest],
                         'repetitions': sum(r.repetitions for r in records),
                         'last_practiced': max((r.completed_at for r in records), default=None)})


@api_view(['GET'])
@permission_classes([PublicReadOwnerWrite])
def owners(request):
    queryset = User.objects.filter(placement__active=True).distinct().order_by('display_name', 'id')
    queryset = queryset.filter(display_name__icontains=request.query_params.get('q', '')[:40])
    paginator = Pagination()
    return paginator.get_paginated_response(AuthorSerializer(paginator.paginate_queryset(queryset, request), many=True).data)


@api_view(['GET', 'POST'])
@permission_classes([PublicReadOwnerWrite])
@transaction.atomic
def sky(request):
    if request.method == 'POST':
        serializers.DictField().run_validation(request.data)
        star_id = serializers.UUIDField().run_validation(request.data.get('star'))
        lock_map(request.user)
        star = get_object_or_404(Star, pk=star_id)
        add_to_map(request.user, star)
        owner = request.user
    else:
        owner_id = request.query_params.get('owner')
        if not owner_id:
            if not request.user.is_authenticated:
                return Response({'owner': None, 'entries': [], 'connections': []})
            owner = request.user
        else:
            owner = get_object_or_404(User, pk=serializers.UUIDField().run_validation(owner_id))
    entries = Placement.objects.filter(owner=owner, active=True).select_related('star__owner').order_by('id')
    return Response({'owner': AuthorSerializer(owner).data,
                     'entries': [{'star': StarSummarySerializer(p.star).data, 'x': p.x, 'y': p.y} for p in entries],
                     'connections': ConnectionSerializer(Connection.objects.filter(owner=owner), many=True).data})


@api_view(['DELETE'])
@permission_classes([PublicReadOwnerWrite])
@transaction.atomic
def remove_from_sky(request, star_id):
    lock_map(request.user)
    placement = get_object_or_404(Placement, owner=request.user, star_id=star_id, active=True)
    placement.active = False
    placement.save(update_fields=['active'])
    Connection.objects.filter(owner=request.user).filter(Q(source_id=star_id) | Q(target_id=star_id)).delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([PublicReadOwnerWrite])
@transaction.atomic
def connect(request):
    serializers.DictField().run_validation(request.data)
    source = serializers.UUIDField().run_validation(request.data.get('source'))
    target = serializers.UUIDField().run_validation(request.data.get('target'))
    lock_map(request.user)
    if source == target or Placement.objects.filter(owner=request.user, active=True, star_id__in=[source, target]).count() != 2:
        raise serializers.ValidationError('Velg to forskjellige stjerner i ditt eget kart.')
    source, target = sorted([source, target])
    connection, _ = Connection.objects.get_or_create(owner=request.user, source_id=source, target_id=target)
    return Response(ConnectionSerializer(connection).data)


@api_view(['DELETE'])
@permission_classes([PublicReadOwnerWrite])
@transaction.atomic
def disconnect(request, pk):
    lock_map(request.user)
    get_object_or_404(Connection, pk=pk, owner=request.user).delete()
    return Response(status=204)
