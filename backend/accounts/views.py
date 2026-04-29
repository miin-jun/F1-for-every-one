
import random
import string

from django.core.cache import cache
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from .models import User


def _get_cache_key(email):
    return f"signup_code:{email}"


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
    code = request.POST.get("code", "").strip()

    if not email or not password or not code:
        return JsonResponse({"ok": False, "error": "모든 항목을 입력해주세요."}, status=400)

    saved_code = cache.get(_get_cache_key(email))
    if saved_code is None:
        return JsonResponse({"ok": False, "error": "expired"})
    if saved_code != code:
        return JsonResponse({"ok": False, "error": "invalid_code"})

    if User.objects.filter(email=email).exists():
        return JsonResponse({"ok": False, "error": "duplicate"})

    User.objects.create_user(email=email, password=password)
    cache.delete(_get_cache_key(email))

    return JsonResponse({"ok": True}, status=201)

