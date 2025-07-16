from typing import final, override

from django.contrib.auth.models import User
from django.core.serializers import serialize
from rest_framework import serializers
from rest_framework.fields import valid_datetime

from .models import ChatRoom, Media, Membership, Message, Profile


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


class MediaSerializer(serializers.ModelSerializer[Media]):
    class Meta:
        model = Media
        fields = ("id", "file", "file_type")


class MessageSerializer(serializers.ModelSerializer[Message]):
    user = UserSerializer(read_only=True)
    reply_to = RepliedMessageSerializer(read_only=True)
    reply_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    media = MediaSerializer(many=True, read_only=True)
    media_files = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)

    class Meta:
        model = Message
        fields = ["id", "room", "user", "content", "timestamp", "reply_to", "reply_to_id", "media", "media_files"]
        read_only_fields = ("user", "reply_to", "media")

    def validate(self, data):
        content = data.get("content")
        media_files = self.context["request"].FILES.getlist("media_files")

        if not content and not media_files:
            raise serializers.ValidationError("Message must have content or at least one media file.")
        return data

    @override
    def create(self, validated_data):
        reply_to_id = validated_data.pop("reply_to_id", None)
        media_files = validated_data.pop("media_files", [])

        if reply_to_id:
            try:
                reply_to_message = Message.objects.get(id=reply_to_id)
                validated_data["reply_to"] = reply_to_message
            except Message.DoesNotExist:
                raise serializers.ValidationError({"reply_to_id": "Referenced message does not exist."})

        message = super().create(validated_data)

        for file in media_files:
            Media.objects.create(message=message, file=file, file_type=file.content_type)

        return message

    @override
    def update(self, instance, validated_data):
        reply_to_id = validated_data.pop("reply_to_id", None)

        if reply_to_id:
            try:
                reply_to_message = Message.objects.get(id=reply_to_id)
                validated_data["reply_to"] = reply_to_message
            except Message.DoesNotExist:
                raise serializers.ValidationError({"reply_to_id": "Referenced message does not exist."})
        elif reply_to_id is None:
            validated_data["reply_to"] = None

        return super().update(instance, validated_data)


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
        if last_message.media.exists():
            return "📷 Media"
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
