from typing import Any, override

from django.contrib.auth.models import User
from rest_framework import serializers

from chat.utils.image import crop_avatar_img

from .models import ChatRoom, Membership, Message, MessageMedia, Profile


class ProfileSerializer(serializers.ModelSerializer[Profile]):
    class Meta:
        model = Profile
        fields = ("bio", "avatar_img")

    def validate_avatar_img(self, value):
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError("File exceeded the 5MB limit.")
        return value


class UserSerializer(serializers.ModelSerializer[User]):
    profile = ProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ("id", "username", "is_superuser", "profile")

    @override
    def update(self, instance, validated_data: dict[Any, Any]):
        if "is_superuser" in validated_data and not instance.is_superuser:
            raise serializers.ValidationError(
                {"is_superuser": "User doesn't have the necessary permission to change this field"}
            )

        instance.username = validated_data.get("username", instance.username)
        request = self.context.get("request")

        profile_data = validated_data.pop("profile")
        if profile_data:
            request = self.context.get("request")

            profile = instance.profile
            profile.bio = profile_data.get("bio", profile.bio)
            if "crop_x" in request.data and "avatar_img" in profile_data:
                crop_data = {
                    "x": float(request.data.get("crop_x")),
                    "y": float(request.data.get("crop_y")),
                    "scale": float(request.data.get("crop_scale")),
                    "crop_size": int(request.data.get("crop_size")),
                    "container_width": int(request.data.get("crop_container_width")),
                    "container_height": int(request.data.get("crop_container_height")),
                }
                profile.avatar_img = crop_avatar_img(
                    profile_data.get("avatar_img"), f"avatar_{request.data.get("username")}", crop_data
                )
            else:
                profile.avatar_img = profile_data.get("avatar_img", profile.avatar_img)

        instance.save()

        return instance


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
            "unread_count",
        )

    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if not last_message:
            return None

        content = ""
        media_exists = last_message.media.exists()
        if media_exists and last_message.content:
            content = f"📷 {last_message.content}"
        elif media_exists:
            content = "📷 Media"
        else:
            content = last_message.content

        return {"username": last_message.user.username, "message": content, "timestamp": last_message.timestamp}

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
