from typing import final, override

from django.contrib.auth.models import User
from django.core.serializers import serialize
from rest_framework import serializers
from rest_framework.fields import valid_datetime

from .models import ChatRoom, Membership, Message, Profile


class ProfileSerializer(serializers.ModelSerializer[Profile]):
    class Meta:
        model = Profile
        fields = ("bio", "avatar_img")


class UserSerializer(serializers.ModelSerializer[User]):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ("id", "username", "profile")


class RepliedMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "user", "content")


class MessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    reply_to = RepliedMessageSerializer(read_only=True)
    reply_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Message
        fields = ["id", "room", "user", "content", "timestamp", "reply_to", "reply_to_id"]
        read_only_fields = ("user", "reply_to")

    @override
    def create(self, validated_data):
        reply_to_id = validated_data.pop("reply_to_id", None)
        if reply_to_id:
            try:
                reply_to_message = Message.objects.get(id=reply_to_id)
                validated_data["reply_to"] = reply_to_message
            except Message.DoesNotExist:
                raise serializers.ValidationError({"reply_to_id": "Referenced message does not exist."})

        return super().create(validated_data)

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
        return last_message.content if last_message else None

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
            return Message.objects.filter(room=obj, timestamp__gt=last_read).count()
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
