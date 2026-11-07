from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import serializers, viewsets

from common.api import Pagination, PublicReadOwnerWrite
from .models import Note, Comment
from .serializers import NoteSerializer, NoteSummarySerializer, CommentSerializer


class NoteViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicReadOwnerWrite]
    pagination_class = Pagination
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = Note.objects.select_related('owner').prefetch_related('stars__owner').order_by('-updated_at', 'id')
        if self.action == 'list':
            q = self.request.query_params.get('q', '')[:160]
            queryset = queryset.filter(Q(title__icontains=q) | Q(body__icontains=q))
            for tag in self.request.query_params.getlist('tag')[:10]:
                queryset = queryset.filter(tags__contains=[' '.join(tag.lower().split())])
            if star := self.request.query_params.get('star'):
                queryset = queryset.filter(stars=serializers.UUIDField().run_validation(star))
        return queryset

    def get_serializer_class(self):
        return NoteSummarySerializer if self.action == 'list' else NoteSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        serializer.save()


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [PublicReadOwnerWrite]
    pagination_class = Pagination
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        get_object_or_404(Note, pk=self.kwargs['note_id'])
        return Comment.objects.filter(note_id=self.kwargs['note_id']).select_related('owner').order_by('created_at', 'id')

    def perform_create(self, serializer):
        note = get_object_or_404(Note, pk=self.kwargs['note_id'])
        serializer.save(owner=self.request.user, note=note)
