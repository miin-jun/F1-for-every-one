import json

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import Chat, ChatLog


@login_required
def chat_index(request):
    return render(request, 'chat/chat_main.html')


@csrf_exempt
@require_POST
@login_required
def create_message(request):
    '''채팅 저장'''
    content = request.POST.get('content', '').strip()
    chat_id = request.POST.get('chat_id')
    
    if not content:
        return JsonResponse({"ok": False, "error": "메시지를 입력해주세요."}, status=400)
    
    # 채팅방 가져오기 또는 생성
    if chat_id:
        try:
            chat = Chat.objects.get(chat_id=chat_id, user=request.user)
        except Chat.DoesNotExist:
            return JsonResponse({"ok": False, "error": "채팅방을 찾을 수 없습니다."}, status=404)
    else:
        # 새 채팅방 생성
        title = content[:30]
        chat = Chat.objects.create(
            user=request.user,
            chat_title=title
        )
    
    # 사용자 채팅 저장
    user_message = ChatLog.objects.create(
        chat=chat,
        role='user',
        content=content
    )
    
    # 응답 생성
    assistant_content = "안녕하세요! F1 규정에 대해 물어보세요."
    
    assistant_message = ChatLog.objects.create(
        chat=chat,
        role='system',
        content=assistant_content
    )
    
    return JsonResponse({
        "ok": True,
        "chat_id": chat.chat_id,
        "chat_title": chat.chat_title,
        "user_message": {
            "message_id": user_message.message_id,
            "content": user_message.content,
            "created_at": user_message.created_at.isoformat()
        },
        "assistant_message": {
            "message_id": assistant_message.message_id,
            "content": assistant_message.content,
            "created_at": assistant_message.created_at.isoformat()
        }
    })


@csrf_exempt
@require_POST
@login_required
def delete_chats(request):
    '''채팅방 삭제'''    
    try:
        data = json.loads(request.body)
        chat_ids = data.get('chat_ids', [])
        
        if not chat_ids:
            return JsonResponse({"ok": False, "error": "삭제할 채팅방을 선택해주세요."}, status=400)
        
        # 본인 채팅방만 삭제
        deleted_count = Chat.objects.filter(
            chat_id__in=chat_ids,
            user=request.user
        ).delete()[0]
        
        return JsonResponse({
            "ok": True,
            "deleted_count": deleted_count
        })
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)