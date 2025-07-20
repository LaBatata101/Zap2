from typing import override

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import generics, permissions, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import ChatRoom, Membership, Message, MessageMedia
from .permissions import IsOwnerOrReadOnly, UserPermissions
from .serializers import (ChatRoomSerializer, MessageMediaSerializer,
                          MessageSerializer, RegisterSerializer,
                          UserSerializer)


def get_csrf(request):
    return JsonResponse({"csrf_token": get_token(request)})


class UserViewSet(viewsets.ModelViewSet[User]):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [UserPermissions]
    lookup_field = "username"

    @action(
        methods=["get"],
        detail=False,
        url_path=r"exists/(?P<username>[^/.]+)",
        permission_classes=[permissions.AllowAny],
    )
    def exists(self, request, username=None):
        return (
            Response(status=status.HTTP_200_OK)
            if User.objects.filter(username=username).exists()
            else Response(status=status.HTTP_404_NOT_FOUND)
        )


class UserLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        authenticated_user = authenticate(username=request.data["username"], password=request.data["password"])
        if authenticated_user:
            login(request, authenticated_user)
            return Response(
                {
                    "user": {
                        "id": authenticated_user.id,
                        "username": authenticated_user.username,
                        "is_admin": authenticated_user.is_superuser,
                    }
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response({"error": "Invalid crendentials"}, status=status.HTTP_401_UNAUTHORIZED)


class UserLogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class ChatRoomViewSet(viewsets.ModelViewSet[ChatRoom]):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(Q(is_private=False) | Q(members=user)).distinct()

    @override
    def perform_create(self, serializer):
        room = serializer.save(owner=self.request.user)
        room.members.add(self.request.user)

    @action(detail=True, methods=["POST"], permission_classes=[IsOwnerOrReadOnly])
    def invite(self, request, pk=None):
        room = self.get_object()
        username = request.data.get("username")
        if not username:
            return Response({"error": "User not provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_to_invite = User.objects.get(username=username)
            if user_to_invite in room.members.all():
                return Response({"message": f"User {username} is already member"}, status=status.HTTP_200_OK)

            room.members.add(user_to_invite)
            return Response({"message": "User invited successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class MessageViewSet(viewsets.ModelViewSet[Message]):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    @override
    def get_queryset(self):
        queryset = super().get_queryset()
        room_id = self.request.query_params.get("room")
        if room_id is not None:
            queryset = queryset.filter(room__id=room_id)
        return queryset.order_by("-timestamp")

    @override
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @override
    def list(self, request: Request, *args, **kwargs):
        room_id = request.query_params.get("room")
        if room_id:
            try:
                room = ChatRoom.objects.get(id=room_id)
                if not room.is_private:
                    # For public rooms, create membership if it doesn’t exist
                    membership, created = Membership.objects.get_or_create(user=request.user, room=room)
                    membership.last_read_timestamp = timezone.now()
                    membership.save()
                else:
                    # For private rooms, update only if user is a member
                    try:
                        membership = Membership.objects.get(user=request.user, room=room)
                        membership.last_read_timestamp = timezone.now()
                        membership.save()
                    except Membership.DoesNotExist:
                        pass  # User isn’t a member of this private room
            except ChatRoom.DoesNotExist:
                pass  # Room doesn’t exist, proceed with default response

        return super().list(request, *args, **kwargs)


class MessageMediaViewSet(viewsets.ModelViewSet[MessageMedia]):
    queryset = MessageMedia.objects.all()
    serializer_class = MessageMediaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser,)

    def perform_create(self, serializer):
        serializer.save()
