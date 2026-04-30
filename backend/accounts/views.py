
import random
import string

from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import User

def _get_cache_key(email):
    return f"signup_code:{email}"

@csrf_exempt
@require_POST
def login_index(request):
    email = request.POST.get('email', '').strip()
    password = request.POST.get('password', '').strip()
    
    print(f"=== 로그인 시도 ===")
    print(f"Email: '{email}'")
    print(f"Password: '{password}'")
    print(f"Email length: {len(email)}")
    print(f"Password length: {len(password)}")
    
    if not email or not password:
        return JsonResponse({"ok": False, "error": "이메일과 비밀번호를 입력해주세요."}, status=400)
    
    user = authenticate(request, username=email, password=password)
    
    print(f"User: {user}")

    if user is not None:
        login(request, user)
        return JsonResponse({"ok": True, "redirect": "/chat/"}) 
    else:
        return JsonResponse({"ok": False, "error": "이메일 또는 비밀번호가 일치하지 않습니다."})


@csrf_exempt
@require_POST
def logout_index(request):
    if request.user.is_authenticated:
        logout(request)
        return JsonResponse({"ok": True, "redirect": "/"})
    
    return JsonResponse({"ok": False, "error": "로그인 상태가 아닙니다."}, status=400)

@csrf_exempt
@require_POST
def check_email(request):
    email = request.POST.get("email", "").strip()
    if not email:
        return JsonResponse({"ok": False, "error": "이메일을 입력해주세요."}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({"ok": False, "error": "duplicate"})
    return JsonResponse({"ok": True})


@csrf_exempt
@require_POST
def send_code(request):
    email = request.POST.get("email", "").strip()
    if not email:
        return JsonResponse({"ok": False, "error": "이메일을 입력해주세요."}, status=400)

    code = "".join(random.choices(string.digits, k=6))
    cache.set(_get_cache_key(email), code, timeout=180)

    send_mail(
        subject="[For everyOne] 인증코드 안내",
        message=f"인증코드: {code}\n\n인증코드는 3분간 유효합니다.",
        from_email=None,
        recipient_list=[email],
    )

    return JsonResponse({"ok": True})


@csrf_exempt
@require_POST
def signup(request):
    email = request.POST.get("email", "").strip()
    password = request.POST.get("password", "").strip()

    if not email or not password:
        return JsonResponse({"ok": False, "error": "이메일과 비밀번호를 입력해주세요."}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"ok": False, "error": "이미 가입된 이메일입니다."})

    User.objects.create_user(email=email, password=password)

    return JsonResponse({"ok": True}, status=201)


@csrf_exempt
@require_POST
def verify_current_password(request):
    """현재 비밀번호 확인"""
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "로그인이 필요합니다."}, status=401)
    
    current_password = request.POST.get("current_password", "").strip()

    if not current_password:
        return JsonResponse({"ok": False, "error": "현재 비밀번호를 입력해주세요."}, status=400)
    
    if request.user.check_password(current_password):
        return JsonResponse({"ok": True})
    else:
        return JsonResponse({"ok": False, "error": "현재 비밀번호가 일치하지 않습니다."})
    
@csrf_exempt
@require_POST
def change_password(request):
    """비밀번호 변경"""
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "로그인이 필요합니다."}, status=401)
    
    current_password = request.POST.get("current_password", "").strip()
    new_password = request.POST.get("new_password", "").strip()
    
    if not current_password or not new_password:
        return JsonResponse({"ok": False, "error": "모든 항목을 입력해주세요."}, status=400)
    
    
    if not request.user.check_password(current_password):
        return JsonResponse({"ok": False, "error": "현재 비밀번호가 일치하지 않습니다."})
    
    # 새 비밀번호로 변경
    request.user.set_password(new_password)
    request.user.save()
    
    logout(request)

    return JsonResponse({"ok": True})

@csrf_exempt
@require_POST
def change_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "로그인이 필요합니다."}, status=401)
    
    current_password = request.POST.get("current_password", "").strip()
    new_password = request.POST.get("new_password", "").strip()
    
    if not current_password or not new_password:
        return JsonResponse({"ok": False, "error": "모든 항목을 입력해주세요."}, status=400)
    
    if not request.user.check_password(current_password):
        return JsonResponse({"ok": False, "error": "현재 비밀번호가 일치하지 않습니다."})
    
    request.user.set_password(new_password)
    request.user.save()
    logout(request)
    
    return JsonResponse({"ok": True})

