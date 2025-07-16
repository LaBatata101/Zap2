from typing import override

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import generics, permissions, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import ChatRoom, Membership, Message
from .permissions import IsOwnerOrReadOnly
from .serializers import (ChatRoomSerializer, MessageSerializer,
                          RegisterSerializer, UserSerializer)


def get_csrf(request):
    return JsonResponse({"csrf_token": get_token(request)})


class CheckUsernameView(views.APIView):
    """
    Endpoint to check if a username already exists.

    Allows any user to check if a username is taken.
    Returns a JSON response with a single key "exists" that is true if the username exists, false otherwise.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, _, username):
        if User.objects.filter(username=username).exists():
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


class UserDetailView(generics.RetrieveAPIView[User]):
    """
    A view to retrieve user information by username.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "username"


class UserRegisterView(generics.CreateAPIView[User]):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    @override
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        authenticated_user = authenticate(
            username=serializer.validated_data["username"], password=serializer.validated_data["password"]
        )
        if authenticated_user:
            login(request, authenticated_user)
            return Response(
                {
                    "user": {
                        "id": authenticated_user.id,
                        "username": authenticated_user.username,
                        "is_admin": authenticated_user.is_superuser,
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response({"error": "Failed to authenticate user after registration"}, status=status.HTTP_400_BAD_REQUEST)


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
    parser_classes = (MultiPartParser, FormParser)

    @override
    def get_queryset(self):
        queryset = super().get_queryset()
        room_id = self.request.query_params.get("room")
        if room_id is not None:
            queryset = queryset.filter(room__id=room_id)
        return queryset

    @override
    def perform_create(self, serializer):
        message = serializer.save(user=self.request.user)
        channel_layer = get_channel_layer()
        room_id = message.room.id
        serialized_message = MessageSerializer(message, context={"request": self.request}).data

        async_to_sync(channel_layer.group_send)(
            f"chat_{room_id}",
            {
                "type": "chat.message",
                "message": serialized_message,
            },
        )

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
