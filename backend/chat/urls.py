from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (ChatRoomViewSet, CheckUsernameView, MessageViewSet,
                    UserDetailView, UserLoginView, UserLogoutView,
                    UserRegisterView, get_csrf)

router = DefaultRouter()
router.register("rooms", ChatRoomViewSet, basename="room")
router.register("messages", MessageViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("csrf/", get_csrf),
    path("register/", UserRegisterView.as_view(), name="register"),
    path("login/", UserLoginView.as_view(), name="login"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
    path("user/<str:username>/", UserDetailView.as_view(), name="user-detail"),
    path("user/exists/<str:username>/", CheckUsernameView.as_view(), name="check-username"),
]
