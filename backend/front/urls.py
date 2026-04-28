from django.urls import path
from . import views

app_name = "front"

urlpatterns = [
    path("", views.index, name="index"),
    path("chat/", views.chat_main, name="chat_main"),
    path("chat/text-voice/", views.chat_text_voice, name="chat_text_voice"),
    path("withdraw/", views.withdraw, name="withdraw"),
    path("withdraw/done/", views.withdraw_done, name="withdraw_done"),
]