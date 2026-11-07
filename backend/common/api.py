from rest_framework import permissions, serializers
from rest_framework.pagination import PageNumberPagination


class PublicReadOwnerWrite(permissions.BasePermission):
    message = 'Logg inn og velg visningsnavn før du lagrer innhold.'

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS or (
            request.user.is_authenticated and bool(request.user.display_name)
        )

    def has_object_permission(self, request, view, obj):
        return request.method in permissions.SAFE_METHODS or obj.owner_id == request.user.pk


class Pagination(PageNumberPagination):
    page_size = 20


class StrictSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError({'non_field_errors': ['Forventet et objekt.']})
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({'non_field_errors': ['Ukjente felt: ' + ', '.join(sorted(unknown))]})
        return super().to_internal_value(data)


class AuthorSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    displayName = serializers.CharField(source='display_name', read_only=True)
