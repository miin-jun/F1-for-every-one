import io, json, os

from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from django.conf import settings
from dotenv import load_dotenv
from gtts import gTTS
import openai


from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST

from .models import Chat, ChatLog

load_dotenv()


def _build_model_history(chat):
    """ChatLog에서 LLM에 넘길 대화 히스토리를 구성한다."""
    logs = ChatLog.objects.filter(chat=chat).order_by('created_at')
    history = []
    for log in logs:
        role = 'assistant' if log.role == 'system' else log.role
        history.append({'role': role, 'content': log.content})
    return history

def _request_model_answer(content, chat, history):
    model_server_url = getattr(settings, 'MODEL_SERVER_URL', 'https://mgdi3hs7bpdqs9-8000.proxy.runpod.net/').rstrip('/')
    timeout = getattr(settings, 'MODEL_SERVER_TIMEOUT', 60)
    payload = {
        'message': content,
        'session_id': str(chat.chat_id),
        'history': history,
    }

    request = Request(
        f'{model_server_url}/ai/chat',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    with urlopen(request, timeout=timeout) as response:
        data = json.loads(response.read().decode('utf-8'))

    answer = data.get('answer', '').strip()
    if not answer:
        raise ValueError('Model server returned an empty answer.')

    return answer


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
            chat_title=title,
        )
    
    model_history = _build_model_history(chat)

    # 사용자 채팅 저장
    user_message = ChatLog.objects.create(
        chat=chat,
        role='user',
        content=content,
    )
    
    # 응답 생성
    try:
        assistant_content = _request_model_answer(content, chat, model_history)
    except HTTPError as e:
        error_body = e.read().decode('utf-8', errors='replace')
        return JsonResponse({
            "ok": False,
            "error": f"Model server error: {e.code} {error_body}",
        }, status=502)
    except (URLError, TimeoutError, ValueError) as e:
        return JsonResponse({
            "ok": False,
            "error": f"Cannot connect to model server: {str(e)}",
        }, status=502)

    assistant_message = ChatLog.objects.create(
        chat=chat,
        role='system',
        content=assistant_content,
    )

    chat.updated_at = timezone.now()
    chat.save(update_fields=['updated_at'])
    
    return JsonResponse({
        "ok": True,
        "chat_id": chat.chat_id,
        "chat_title": chat.chat_title,
        "user_message": {
            "message_id": user_message.message_id,
            "content": user_message.content,
            "created_at": user_message.created_at.isoformat(),
        },
        "assistant_message": {
            "message_id": assistant_message.message_id,
            "content": assistant_message.content,
            "created_at": assistant_message.created_at.isoformat(),
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
            "deleted_count": deleted_count,
        })
    
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)
    

@login_required
def get_chats(request):
    '''채팅 목록 조회'''
    chats = Chat.objects.filter(user=request.user).order_by('-updated_at')

    chat_list = []

    for chat in chats:
        chat_list.append({
            'chat_id': chat.chat_id,
            'chat_title': chat.chat_title,
            'created_at': chat.created_at.isoformat(),
            'updated_at': chat.updated_at.isoformat(),
        })
    
    return JsonResponse({
        'ok': True,
        'chats': chat_list,
    })


@login_required
def get_chat_messages(request, chat_id):
    '''상세 채팅 조회'''
    try:
        chat = Chat.objects.get(chat_id=chat_id, user=request.user)

    except Chat.DoesNotExist:
        return JsonResponse({
            'ok': False,
            'error': '채팅방을 찾을 수 없습니다.'
        })
    
    messages = ChatLog.objects.filter(chat=chat).order_by('created_at')

    messages_list = []

    for message in messages:
        messages_list.append({
            'message_id': message.message_id,
            'role': message.role,
            'content': message.content,
            'created_at': message.created_at.isoformat()
        })
    
    return JsonResponse({
        'ok': True,
        'chat_id': chat.chat_id,
        'chat_title': chat.chat_title,
        'messages': messages_list,
    })


@login_required
def chat_detail(request, chat_id):
    try:
        chat = Chat.objects.get(chat_id=chat_id, user=request.user)
    except Chat.DoesNotExist:
        return render(request, '404.html', status=404)

    return render(request, 'chat/chat_main.html', {
        'initial_chat_id': chat.chat_id,
    })


@require_http_methods(["POST"])
@login_required
def transcribe_audio(request):
    """STT - OpenAI Whisper API"""
    try:
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return JsonResponse({'ok': False, 'error': '오디오 파일이 없습니다.'})

        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        

        audio_file.seek(0)

        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=(audio_file.name, audio_file.file, audio_file.content_type),
            language="ko"
        )
        
        return JsonResponse({
            'ok': True,
            'text': transcription.text
        })
        
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})


@require_http_methods(["POST"])
@login_required
def text_to_speech(request):
    """TTS - gTTS"""
    try:
        import json
        data = json.loads(request.body)
        text = data.get('text', '')
        
        if not text:
            return JsonResponse({'ok': False, 'error': '텍스트가 없습니다.'})

        tts = gTTS(text=text, lang='ko')

        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        from django.http import HttpResponse
        response = HttpResponse(audio_buffer.read(), content_type='audio/mpeg')
        response['Content-Disposition'] = 'inline; filename="speech.mp3"'
        
        return response
        
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})

