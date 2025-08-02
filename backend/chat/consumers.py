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
        msg_type = data["type"]

        if not self.user.is_authenticated:
            return

        match msg_type:
            case "send_message":
                room = data["message"]["room"]
                await self.channel_layer.group_send(
                    f"chat_{room}",
                    {
                        "type": "chat.message",  # call the `chat_message` method
                        "message": text_data,
                    },
                )
            case "delete_message":
                await self.channel_layer.group_send(
                    f"chat_{data["room"]}",
                    {
                        "type": "chat.delete.message",  # call the `chat_delete_message` method
                        "message_id": data["message_id"],
                        "room": data["room"],
                    },
                )
            case "edit_message":
                await self.channel_layer.group_send(
                    f"chat_{data["message"]["room"]}", {"type": "chat.edit.message", "updated_message": text_data}
                )
            case t:
                raise Exception(f"Message type not handled: {t}")

    async def chat_message(self, event):
        await self.send(text_data=event["message"])

    async def chat_edit_message(self, event):
        await self.send(text_data=event["updated_message"])

    async def chat_delete_message(self, event):
        response_data = {
            "type": "delete_message",
            "message_id": event["message_id"],
            "room": event["room"],
        }

        is_last_message = await self.is_last_message_in_room(event["message_id"], event["room"])
        if is_last_message:
            last_msg = await self.get_prev_message_of_id(event["message_id"], event["room"])
            if last_msg:
                response_data["last_message"] = {
                    "username": last_msg["user"]["username"],
                    "content": last_msg["content"],
                    "timestamp": last_msg["timestamp"],
                    "room": last_msg["room"],
                }

        await self.send(text_data=json.dumps(response_data))

    @database_sync_to_async
    def is_last_message_in_room(self, message_id, room):
        try:
            msg = Message.objects.get(id=message_id)
            last_message = Message.objects.filter(room=room).order_by("-timestamp").first()
            return last_message and msg.id == last_message.id
        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def get_prev_message_of_id(self, message_id, room):
        try:
            msg = Message.objects.get(id=message_id)
            prev_message = Message.objects.filter(room=room, timestamp__lt=msg.timestamp).order_by("-timestamp").first()
            return MessageSerializer(prev_message).data if prev_message else None
        except Message.DoesNotExist:
            raise Exception(f"Message with {message_id=} not found in {room=}")

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
