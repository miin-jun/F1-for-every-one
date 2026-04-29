// CSRF 토큰 가져오기 (Django 보안)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// 1. 이메일 중복 확인
async function checkEmail() {
    console.log('checkEmail 함수 실행됨!');
    
    const emailInput = document.querySelector('input[name="signupEmail"]');
    console.log('찾은 input:', emailInput);
    console.log('입력된 email:', emailInput?.value);
    
    const email = emailInput?.value;
    
    if (!email) {
        alert('이메일을 입력해주세요.');
        return;
    }

    const formData = new FormData();
    formData.append('email', email);

    console.log('백엔드로 전송:', email);

    const response = await fetch('/accounts/check-email/', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    console.log('백엔드 응답:', data);
    
    if (data.ok) {
        alert('사용 가능한 이메일입니다.');
        return true;
    } else {
        alert('중복된 이메일입니다.');
        return false;
    }
}

// 2. 인증코드 전송
async function sendCode() {
    console.log('sendCode 함수 실행됨!');
    
    const email = document.querySelector('input[name="signupEmail"]').value;
    
    if (!email) {
        alert('이메일을 먼저 입력해주세요.');
        return;
    }

    const formData = new FormData();
    formData.append('email', email);

    const response = await fetch('/accounts/send-code/', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    console.log('인증코드 전송 응답:', data);
    
    if (data.ok) {
        alert('인증코드가 전송되었습니다.');
    } else {
        alert('인증코드 전송 실패: ' + data.error);
    }
}

// 3. 회원가입
async function signup() {
    console.log('signup 함수 실행됨!');
    
    const email = document.querySelector('input[name="signupEmail"]').value;
    const password = document.querySelector('input[name="signupPassword"]').value;
    const code = document.querySelector('input[name="signupCode"]').value;

    console.log('입력값:', { email, password, code });

    if (!email || !password || !code) {
        alert('모든 항목을 입력해주세요.');
        return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('code', code);

    const response = await fetch('/accounts/signup/', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    console.log('회원가입 응답:', data);
    
    if (data.ok) {
        alert('회원가입이 완료되었습니다!');
        // closeModal(); // 모달 닫기 함수가 있으면 주석 해제
        // openModal('loginModal'); // 로그인 모달 열기
    } else {
        alert('회원가입 실패: ' + data.error);
    }
}

// 페이지 로드 후 버튼에 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
    console.log('auth.js 로드됨!');
    
    // 회원가입 버튼 - ID로 찾기
    const signupBtn = document.getElementById('signupSubmitBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', signup);
        console.log('회원가입 버튼 연결됨!');
    } else {
        console.log('회원가입 버튼을 찾을 수 없음!');
    }

    // 중복확인 버튼, 전송 버튼도 ID로 찾도록 수정 필요
    // HTML에 ID가 있으면 여기에 추가
});