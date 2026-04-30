from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('', views.chat_index, name='index'),
    path('api/message/', views.create_message, name='create_message'),
    path('api/delete/', views.delete_chats, name='delete_chats'),
    path('api/list/', views.get_chats, name="get_chats"),
    path('api/message/<int:chat_id>', views.get_chat_messages, name="get_chat_messages")
]