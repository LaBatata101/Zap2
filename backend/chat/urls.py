from django.urls import include, path
from rest_framework_nested.routers import DefaultRouter, NestedDefaultRouter

from .views import (ChatRoomViewSet, InvitationViewSet, MessageMediaViewSet,
                    MessageReactionViewSet, MessageViewSet, UserLoginView,
                    UserLogoutView, UserViewSet, get_csrf)

router = DefaultRouter()
router.register("rooms", ChatRoomViewSet, basename="room")
router.register("invitations", InvitationViewSet, basename="invitation")
router.register("messages", MessageViewSet, basename="messsage")
router.register("media", MessageMediaViewSet)
router.register("user", UserViewSet)

messages_router = NestedDefaultRouter(router, "messages", lookup="message")
messages_router.register("reactions", MessageReactionViewSet, basename="message-reactions")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(messages_router.urls)),
    path("csrf/", get_csrf),
    path("login/", UserLoginView.as_view(), name="login"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
]
