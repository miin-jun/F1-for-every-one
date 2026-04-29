from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages

# from django.conf import settings

def login_index(request):
    '''로그인'''
    if request.user.is_authenticated:
        return redirect('chat:index')
    
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        user = authenticate(request, username=email, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, f'{email}님 환영합니다.')
            return redirect('chat:index')
        else:
            messages.error(request, '로그인에 실패했습니다.')

    return render(request, 'start/index.html')
        
def logout_index(request):
    '''로그아웃'''
    logout(request)
    print('로그아웃되었습니다.')
    return redirect('login')