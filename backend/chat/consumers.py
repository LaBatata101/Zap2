import json
from typing import override

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from chat.serializers import MessageSerializer

from .models import ChatRoom, Message, MessageMedia


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
        room = data["room"]

        if not self.user.is_authenticated:
            return

        await self.channel_layer.group_send(
            f"chat_{room}",
            {
                "type": "chat.message",  # call the `chat_message` method
                "message": text_data,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=event["message"])

    @database_sync_to_async
    def get_user_chat_rooms(self, user):
        # return list(ChatRoom.objects.filter(members=user))
        return list(ChatRoom.objects.all())  # FIX: only return the rooms which the user is member of

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
