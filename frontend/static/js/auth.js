//로그인 , 회원가입, 비밀번호

// 로그인
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginSubmitBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPasswordReal').value;
            
            // 에러 메시지 초기화
            document.getElementById('loginPasswordError').classList.add('hidden');
            
            if (!email || !password) {
                document.getElementById('loginPasswordError').textContent = '× 이메일과 비밀번호를 입력해주세요.';
                document.getElementById('loginPasswordError').classList.remove('hidden');
                return;
            }
            
            try {
                const response = await fetch('/accounts/login/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({ email, password })
                });
                
                const data = await response.json();
                
                if (data.ok) {
                    window.location.href = data.redirect;
                } else {
                    document.getElementById('loginPasswordError').textContent = '× 비밀번호가 일치하지 않습니다.';
                    document.getElementById('loginPasswordError').classList.remove('hidden');
                }
            } catch (error) {
                console.error('로그인 에러:', error);
                document.getElementById('loginPasswordError').textContent = '× 로그인 중 오류가 발생했습니다.';
                document.getElementById('loginPasswordError').classList.remove('hidden');
            }
        });
    }
});
