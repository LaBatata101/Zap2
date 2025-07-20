from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (ChatRoomViewSet, MessageMediaViewSet, MessageViewSet,
                    UserLoginView, UserLogoutView, UserViewSet, get_csrf)

router = DefaultRouter()
router.register("rooms", ChatRoomViewSet, basename="room")
router.register("messages", MessageViewSet)
router.register("media", MessageMediaViewSet)
router.register("user", UserViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("csrf/", get_csrf),
    path("login/", UserLoginView.as_view(), name="login"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
]
