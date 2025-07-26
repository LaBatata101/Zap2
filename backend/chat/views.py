from typing import override

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import permissions, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import ChatRoom, Membership, Message, MessageMedia
from .permissions import IsOwnerOrReadOnly, UserPermissions
from .serializers import (ChatRoomSerializer, MessageMediaSerializer,
                          MessageSerializer, UserSerializer)


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
    def exists(self, _, username=None):
        return (
            Response(status=status.HTTP_200_OK)
            if User.objects.filter(username=username).exists()
            else Response(status=status.HTTP_404_NOT_FOUND)
        )

    @action(detail=True, methods=["POST"], url_path="start-dm")
    def start_dm(self, request, username=None):
        try:
            target_user = self.get_object()
            current_user = request.user

            if target_user == current_user:
                return Response(
                    {"error": "You cannot start a DM with yourself."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Look for an existing DM room between the two users
            dm_room = (
                ChatRoom.objects.filter(is_dm=True, members=current_user)
                .filter(members=target_user)
                .annotate(num_members=Count("members"))
                .filter(num_members=2)
                .first()
            )

            if dm_room:
                serializer = ChatRoomSerializer(dm_room, context={"request": request})
                return Response(serializer.data, status=status.HTTP_200_OK)

            # If no room exists, create a new one
            room_name = f"dm_{current_user.id}_{target_user.id}"
            dm_room = ChatRoom.objects.create(name=room_name, is_dm=True, is_private=True)
            dm_room.members.add(current_user, target_user)

            serializer = ChatRoomSerializer(dm_room, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class UserLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        authenticated_user = authenticate(username=request.data["username"], password=request.data["password"])
        if authenticated_user:
            login(request, authenticated_user)
            user_data = UserSerializer(authenticated_user, context={"request": request}).data
            return Response(
                {"user": user_data},
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
    parser_classes = [MultiPartParser, FormParser]

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
                    membership = Membership.objects.get(user=request.user, room=room)
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
