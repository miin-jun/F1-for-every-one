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

// 회원가입
async function signup(e) {
    e.preventDefault();
    e.stopPropagation(); 
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    console.log('이메일:', email);
    console.log('비밀번호:', password);

    if (!email || !password) {  
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
        const response = await fetch('/accounts/signup/', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.ok) {
            alert('회원가입 완료!');

            // 1. 회원가입 모달 닫기
            const signupFormModal = document.getElementById('signupFormModal');
            if (signupFormModal) {
                signupFormModal.classList.add('hidden');
            }
            
            // 2. 로그인 모달 열기
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.remove('hidden');
            }
            
            // 3. 로그인 이메일란에 방금 가입한 이메일 자동 입력
            const loginEmailInput = document.getElementById('loginEmail');
            if (loginEmailInput) {
                loginEmailInput.value = email;
            }
            
        } else {
            alert('회원가입 실패: ' + data.error);
        }
    } catch (error) {
        console.error('회원가입 에러:', error);
        alert('회원가입 중 오류가 발생했습니다.');
    }
}
// 페이지 로드 후 버튼 연결
document.addEventListener('DOMContentLoaded', () => {
    console.log('auth.js 로드됨!');
    
    // 회원가입 버튼 연결
    const signupBtn = document.getElementById('signupSubmitBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', signup);  // signup이 e를 받음
        console.log('회원가입 버튼 연결됨!');
    } else {
        console.log('회원가입 버튼을 찾을 수 없음!');
    }
});