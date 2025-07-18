from typing import final, override

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


@final
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=128, blank=True)
    avatar_img = models.ImageField(null=True, blank=True)

    def __str__(self):
        return self.user.username


class Membership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey("ChatRoom", on_delete=models.CASCADE)
    last_read_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "room")


@final
class ChatRoom(models.Model):
    name = models.CharField(max_length=255, unique=True)
    is_private = models.BooleanField(default=False)
    owner = models.ForeignKey(User, related_name="owned_rooms", on_delete=models.SET_NULL, null=True, blank=True)
    members = models.ManyToManyField(User, related_name="chat_rooms", blank=True, through=Membership)

    @override
    def __str__(self):
        return f"{self.name} (${"Private" if self.is_private else "Public"})"


@final
class Message(models.Model):
    room = models.ForeignKey(ChatRoom, related_name="messages", on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    reply_to = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="replies")

    @final
    class Meta:
        ordering = ("timestamp",)

    @override
    def __str__(self):
        return (
            f"Message(user={self.user}, content={self.content}, timestamp={self.timestamp}, reply_to={self.reply_to})"
        )


@final
class MessageMedia(models.Model):
    message = models.ForeignKey(Message, related_name="media", on_delete=models.CASCADE, null=True, blank=True)
    file = models.ImageField(upload_to="chat_media/")

    def __str__(self):
        return f"Media for Message {self.message.id}: {self.file.name}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create a profile automatically when a new user is created.
    """
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the profile automatically when an user is saved."""
    instance.profile.save()
