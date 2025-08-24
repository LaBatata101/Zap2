from typing import override

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import permissions, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import (ChatRoom, ChatRoomInvitation, Membership, Message,
                     MessageMedia, MessageReaction)
from .permissions import IsOwnerOrReadOnly, UserPermissions
from .serializers import (ChatRoomInvitationSerializer, ChatRoomSerializer,
                          MessageMediaSerializer, MessageReactionSerializer,
                          MessageSerializer, UserSerializer)


def get_csrf(request):
    return JsonResponse({"csrf_token": get_token(request)})


class UserViewSet(viewsets.ModelViewSet[User]):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [UserPermissions]

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_field)

        # Try to interpret as integer ID first
        if lookup_value.isdigit():
            return get_object_or_404(User, id=int(lookup_value))
        # Fallback to username
        return get_object_or_404(User, username=lookup_value)

    @action(
        methods=["get"],
        detail=False,
        url_path=r"exists/(?P<username>[^/.]+)",
        permission_classes=[permissions.AllowAny],
    )
    def exists(self, _, username=None):
        return (
            Response(status=status.HTTP_302_FOUND)
            if User.objects.filter(username=username).exists()
            else Response(status=status.HTTP_404_NOT_FOUND)
        )

    @action(detail=True, methods=["POST"], url_path="start-dm")
    def start_dm(self, request, **kwargs):
        try:
            target_user = self.get_object()
            current_user = request.user

            room_name = f"dm_{current_user.id}_{target_user.id}"
            # Look for an existing DM room between the two users
            try:
                dm_room = ChatRoom.objects.get(is_dm=True, name=room_name)

                serializer = ChatRoomSerializer(dm_room, context={"request": request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            except ChatRoom.DoesNotExist:
                # If no room exists, create a new one
                dm_room = ChatRoom.objects.create(name=room_name, is_dm=True, is_private=True)
                dm_room.members.add(current_user, target_user)

            serializer = ChatRoomSerializer(dm_room, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)


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
            return Response({"detail": "Invalid crendentials"}, status=status.HTTP_401_UNAUTHORIZED)


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

    @action(
        detail=True,
        methods=["POST"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def invite(self, request, pk=None):
        room = self.get_object()
        current_user = request.user

        try:
            requester_membership = Membership.objects.get(user=current_user, room=room)
        except Membership.DoesNotExist:
            return Response({"detail": "You are not a member of this room."}, status=status.HTTP_403_FORBIDDEN)

        if current_user != room.owner and not requester_membership.is_admin and not current_user.is_superuser:
            return Response(
                {"detail": "Only the group owner or admins can create invitations."}, status=status.HTTP_403_FORBIDDEN
            )

        invitation = ChatRoomInvitation.objects.create(room=room, created_by=request.user)
        serializer = ChatRoomInvitationSerializer(invitation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["GET"], permission_classes=[permissions.IsAuthenticated], url_path="members")
    def list_members(self, request, pk=None):
        room = self.get_object()
        memberships = Membership.objects.filter(room=room).select_related("user")
        data = []
        if room.is_dm:
            for membership in memberships:
                data.append(
                    UserSerializer(membership.user, context=self.get_serializer_context()).data,
                )
        else:
            for membership in memberships:
                data.append(
                    {
                        **UserSerializer(membership.user, context=self.get_serializer_context()).data,
                        "is_admin": membership.is_admin,
                    }
                )
        return Response(data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["POST"],
        url_path="update-admin",
        permission_classes=[permissions.IsAuthenticated],
        parser_classes=[JSONParser],
    )
    def update_admin(self, request, pk=None):
        room = self.get_object()
        current_user = request.user

        if room.is_dm:
            return Response({"detail": "DM chats don't have admins."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            requester_membership = Membership.objects.get(user=current_user, room=room)
        except Membership.DoesNotExist:
            return Response({"detail": "You are not a member of this room."}, status=status.HTTP_403_FORBIDDEN)

        if room.owner != current_user and not requester_membership.is_admin and not current_user.is_superuser:
            return Response(
                {"detail": "You are not allowed to update admin status."}, status=status.HTTP_401_UNAUTHORIZED
            )

        username = request.data.get("username")
        is_admin = request.data.get("is_admin")

        if username is None or is_admin is None:
            return Response(
                {"detail": "Both 'username' and 'is_admin' are required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_user = User.objects.get(username=username)
            membership = Membership.objects.get(user=target_user, room=room)
        except User.DoesNotExist:
            return Response({"detail": f"User '{username}' not found."}, status=status.HTTP_404_NOT_FOUND)
        except Membership.DoesNotExist:
            return Response(
                {"detail": f"User '{username}' is not a member of the room."}, status=status.HTTP_400_BAD_REQUEST
            )

        membership.is_admin = is_admin
        membership.save()

        return Response(
            {
                **UserSerializer(target_user, context=self.get_serializer_context()).data,
                "is_admin": membership.is_admin,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["POST"],
        url_path="leave",
        permission_classes=[permissions.IsAuthenticated],
        parser_classes=[JSONParser],
    )
    def leave(self, request, pk=None):
        room = self.get_object()
        current_user = request.user

        if room.is_dm:
            return Response({"detail": "Operation only permitted in chat groups."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            membership = Membership.objects.get(user=current_user, room=room)
        except Membership.DoesNotExist:
            return Response({"detail": "You are not a member of this room."}, status=status.HTTP_403_FORBIDDEN)

        new_owner = None
        if room.owner == current_user:
            other_members = Membership.objects.filter(room=room).exclude(user=current_user)
            if other_members.exists():
                # Promote the first admin found, or the oldest member
                new_owner_membership = (
                    other_members.filter(is_admin=True).first() or other_members.order_by("id").first()
                )
                new_owner = new_owner_membership.user
                room.owner = new_owner_membership.user
                room.save()
            else:
                # If the owner is the last person, delete the room
                room.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)

        membership.delete()

        return (
            Response(
                {"new_onwer": UserSerializer(new_owner, context=self.get_serializer_context()).data},
                status=status.HTTP_200_OK,
            )
            if new_owner
            else Response(status=status.HTTP_204_NO_CONTENT)
        )


class InvitationViewSet(viewsets.GenericViewSet):
    queryset = ChatRoomInvitation.objects.all()
    lookup_field = "token"

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def details(self, request, token=None):
        invitation = self.get_object()
        if invitation.is_expired():
            return Response({"detail": "Invitation has expired."}, status=status.HTTP_410_GONE)

        serializer = ChatRoomSerializer(invitation.room, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, token=None):
        invitation = self.get_object()
        if invitation.is_expired():
            return Response({"detail": "Invitation has expired."}, status=status.HTTP_410_GONE)

        room = invitation.room
        user = request.user

        if user in room.members.all():
            serializer = ChatRoomSerializer(room, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        room.members.add(user)
        serializer = ChatRoomSerializer(room, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


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
                membership = Membership.objects.get(user=request.user, room=room)
                membership.last_read_timestamp = timezone.now()
                membership.save()
            except ChatRoom.DoesNotExist:
                pass  # Room doesn’t exist, proceed with default response

        return super().list(request, *args, **kwargs)

    @override
    def destroy(self, request: Request, *args, **kwargs) -> Response:
        target_message = self.get_object()
        room = target_message.room
        membership = Membership.objects.get(room=room, user=request.user)
        if (
            request.user != target_message.user
            and not request.user.is_superuser
            and room.owner != request.user
            and not membership.is_admin
        ):
            return Response(
                {
                    "detail": (
                        f"{request.user.username} doesn't have enough privileges to delete {target_message.user.username}'s message"
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return super().destroy(request, *args, **kwargs)

    @override
    def update(self, request: Request, *args, **kwargs) -> Response:
        target_message = self.get_object()
        if request.user != target_message.user and not request.user.is_superuser:
            return Response(
                {"detail": f"{request.user.username} can only edit its own messages."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return super().update(request, *args, **kwargs)


class MessageReactionViewSet(viewsets.ModelViewSet[MessageReaction]):
    serializer_class = MessageReactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MessageReaction.objects.filter(message_id=self.kwargs["message_pk"])

    def perform_create(self, serializer):
        message = get_object_or_404(Message, pk=self.kwargs["message_pk"])
        serializer.save(user=self.request.user, message=message)

    @override
    def destroy(self, request: Request, *args, **kwargs) -> Response:
        target_message_reaction = self.get_object()
        if request.user != target_message_reaction.user and not request.user.is_superuser:
            return Response(
                {
                    "detail": (
                        f"{request.user.username} doesn't have enough"
                        f" privileges to delete {target_message_reaction.user.username}'s message reaction"
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return super().destroy(request, *args, **kwargs)

    @override
    def update(self, request: Request, *args, **kwargs) -> Response:
        target_message_reaction = self.get_object()
        if request.user != target_message_reaction.user and not request.user.is_superuser:
            return Response(
                {"detail": f"{request.user.username} can only update its own messages reactions."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return super().update(request, *args, **kwargs)


class MessageMediaViewSet(viewsets.ModelViewSet[MessageMedia]):
    queryset = MessageMedia.objects.all()
    serializer_class = MessageMediaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser,)

    def perform_create(self, serializer):
        serializer.save()
