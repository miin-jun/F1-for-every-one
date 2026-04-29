from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    path("check-email/", views.check_email, name="check_email"),
    path("send-code/", views.send_code, name="send_code"),
    path("signup/", views.signup, name="signup"),
]
