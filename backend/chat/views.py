from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def chat_index(request):
    return render(request, 'chat/chat_main.html')