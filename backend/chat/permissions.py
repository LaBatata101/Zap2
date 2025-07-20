from typing import override

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView


class UserPermissions(permissions.BasePermission):
    @override
    def has_object_permission(self, request: Request, view, obj) -> bool:
        if not request.user.is_authenticated:
            return False

        if view.action in ("destroy", "update", "partial_update"):
            return obj.owner == request.user or request.user.is_superuser
        else:
            return True


class IsOwnerOrReadOnly(permissions.BasePermission):
    @override
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user
