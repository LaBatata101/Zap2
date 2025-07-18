from typing import override

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework import serializers

from .models import ChatRoom, Membership, Message, MessageMedia, Profile


class ProfileSerializer(serializers.ModelSerializer[Profile]):
    class Meta:
        model = Profile
        fields = ("bio", "avatar_img")


class UserSerializer(serializers.ModelSerializer[User]):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ("id", "username", "profile")


class RepliedMessageSerializer(serializers.ModelSerializer[Message]):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "user", "content")


class MessageMediaSerializer(serializers.ModelSerializer[MessageMedia]):
    class Meta:
        model = MessageMedia
        fields = ("id", "file")

    def validate_file(self, value):
        if value.size > 10 * 1024 * 1024:  # 10MB
            raise serializers.ValidationError("File exceeded the 10MB limit.")
        return value


class MessageSerializer(serializers.ModelSerializer[Message]):
    user = UserSerializer(read_only=True)
    reply_to = RepliedMessageSerializer(read_only=True)
    reply_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    media = MessageMediaSerializer(many=True, read_only=True)
    media_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Message
        fields = ["id", "room", "user", "content", "timestamp", "reply_to", "reply_to_id", "media", "media_ids"]
        read_only_fields = ("user", "reply_to", "media")

    def validate(self, data):
        content = data.get("content")
        media_ids = data.get("media_ids")

        if not content and not media_ids:
            raise serializers.ValidationError("Message must have content or at least one media file.")
        return data

    @override
    def create(self, validated_data):
        reply_to_id = validated_data.pop("reply_to_id", None)
        media_ids = validated_data.pop("media_ids", [])

        if reply_to_id:
            try:
                reply_to_message = Message.objects.get(id=reply_to_id)
                validated_data["reply_to"] = reply_to_message
            except Message.DoesNotExist:
                raise serializers.ValidationError({"reply_to_id": "Referenced message does not exist."})

        message = super().create(validated_data)

        if media_ids:
            media = MessageMedia.objects.filter(id__in=media_ids, message__isnull=True)
            media.update(message=message)

        return message

    @override
    def update(self, instance, validated_data):
        reply_to_id = validated_data.pop("reply_to_id", None)
        media_ids = validated_data.pop("media_ids", [])

        if reply_to_id:
            try:
                reply_to_message = Message.objects.get(id=reply_to_id)
                validated_data["reply_to"] = reply_to_message
            except Message.DoesNotExist:
                raise serializers.ValidationError({"reply_to_id": "Referenced message does not exist."})
        elif reply_to_id is None:
            validated_data["reply_to"] = None

        message = super().update(instance, validated_data)

        if media_ids:
            media = MessageMedia.objects.filter(id__in=media_ids, message__isnull=True)
            media.update(message=message)

        return message


class ChatRoomSerializer(serializers.ModelSerializer[ChatRoom]):
    owner = serializers.ReadOnlyField(source="owner.username")
    members = serializers.StringRelatedField(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    last_message_timestamp = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = (
            "id",
            "name",
            "is_private",
            "owner",
            "members",
            "last_message",
            "last_message_timestamp",
            "unread_count",
        )

    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if not last_message:
            return None

        media_exists = last_message.media.exists()
        if media_exists and last_message.content:
            return f"📷 {last_message.content}"
        elif media_exists:
            return "📷 Media"
        else:
            return last_message.content

    def get_last_message_timestamp(self, obj):
        last_message = obj.messages.last()
        return last_message.timestamp if last_message else None

    def get_unread_count(self, obj: ChatRoom) -> int:
        user = self.context["request"].user
        if not user.is_authenticated:
            return 0

        try:
            membership = Membership.objects.get(user=user, room=obj)
            last_read = membership.last_read_timestamp
            return Message.objects.filter(room=obj, timestamp__gt=last_read).exclude(user=user).count()
        except Membership.DoesNotExist:
            return 0


class RegisterSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ("username", "password", "email")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"], password=validated_data["password"], email=validated_data["email"]
        )
