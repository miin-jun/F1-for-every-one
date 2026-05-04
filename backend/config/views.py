from django.shortcuts import render

def index(request):
    return render(request, "start/index.html")

def chat_main(request):
    return render(request, "chat/chat_main.html")

def chat_text_voice(request):
    return render(request, "chat/chat_text_voice.html")

def withdraw(request):
    return render(request, "withdraw/withdraw.html")

def withdraw_done(request):
    return render(request, "withdraw/withdraw_done.html")