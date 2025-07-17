import json
from typing import override

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from chat.serializers import MessageSerializer

from .models import ChatRoom, Message


class UserChatConsumer(AsyncWebsocketConsumer):
    @override
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        # TODO
        # has_access = await self.check_room_access(self.user, self.room_id)
        # if not has_access:
        #     await self.close(code=403)
        #     return

        await self.accept()

        chat_rooms = await self.get_user_chat_rooms(self.user)
        for room in chat_rooms:
            await self.channel_layer.group_add(f"chat_{room.id}", self.channel_name)

    @override
    async def disconnect(self, code):
        chat_rooms = await self.get_user_chat_rooms(self.user)
        for room in chat_rooms:
            await self.channel_layer.group_discard(f"chat_{room.id}", self.channel_name)

    @override
    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        message_content = data["message"]
        room_id = data["room_id"]
        reply_to_id = data.get("reply_to_id")

        if not self.user.is_authenticated:
            return

        new_message = await self.save_message(self.user, room_id, message_content, reply_to_id)
        if not new_message:
            return None

        serialized_message = await self.serialize_message(new_message)
        await self.channel_layer.group_send(
            f"chat_{room_id}",
            {
                "type": "chat.message",  # call the `chat_message` method
                "message": serialized_message,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    @database_sync_to_async
    def get_user_chat_rooms(self, user):
        # return list(ChatRoom.objects.filter(members=user))
        return list(ChatRoom.objects.all())  # FIX: only return the rooms which the user is member of

    @database_sync_to_async
    def serialize_message(self, message):
        return MessageSerializer(message).data

    @database_sync_to_async
    def save_message(self, user, room_id, message_content, reply_to_id=None):
        try:
            room = ChatRoom.objects.get(id=room_id)
            # TODO:
            # if user not in room.members.all():
            #     return None

            message_data = {"room": room, "user": user, "content": message_content}
            if reply_to_id:
                reply_to_message = Message.objects.get(id=reply_to_id, room=room)
                message_data["reply_to"] = reply_to_message

            return Message.objects.create(**message_data)
        except (ChatRoom.DoesNotExist, Message.DoesNotExist):
            return None

    @database_sync_to_async
    def check_room_access(self, user, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
            if room.is_private:
                # If room is private, check if user is member of it
                return user in room.members.all()
            # If room is public, every user has access to it
            return True
        except ChatRoom.DoesNotExist:
            return False
