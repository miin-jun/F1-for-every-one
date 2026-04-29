from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from . import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', views.index, name='index'),
    path("", include("front.urls")),
    path('accounts/', include('accounts.urls')),
    path('chat/', include('chat.urls')),
]