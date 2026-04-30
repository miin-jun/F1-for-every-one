from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", views.login_index, name="login"),
    path("logout/", views.logout_index, name="logout"),
    path("check-email/", views.check_email, name="check_email"),
    path("send-code/", views.send_code, name="send_code"),
    path("signup/", views.signup, name="signup"),
    path("verify-current-password/", views.verify_current_password, name="verify_current_password"),
    path("change-password/", views.change_password, name="change_password"),
]