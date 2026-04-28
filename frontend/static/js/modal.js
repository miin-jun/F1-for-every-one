// 모달 열기/닫기 기능

document.addEventListener("DOMContentLoaded", function () {
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");
    const passwordEmailModal = document.getElementById("passwordEmailModal");
    const passwordResetModal = document.getElementById("passwordResetModal");

    const openLoginBtn = document.getElementById("openLoginModal");
    const openSignupBtn = document.getElementById("openSignupModal");
    const openPasswordBtn = document.getElementById("openPasswordModal");
    const moveSignupBtn = document.getElementById("moveSignupModal");

    const closeButtons = document.querySelectorAll(".modal-close");

    function openModal(modal) {
        if (modal) {
            modal.classList.remove("hidden");
            document.body.classList.add("modal-open");
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.classList.add("hidden");
        }
    }

    function closeAllModals() {
        closeModal(loginModal);
        closeModal(signupModal);
        closeModal(passwordEmailModal);
        closeModal(passwordResetModal);

        document.body.classList.remove("modal-open");
    }

    if (openLoginBtn) {
        openLoginBtn.addEventListener("click", function () {
            closeAllModals();
            openModal(loginModal);
        });
    }

    if (openSignupBtn) {
        openSignupBtn.addEventListener("click", function () {
            closeAllModals();
            openModal(signupModal);
        });
    }

    if (openPasswordBtn) {
        openPasswordBtn.addEventListener("click", function () {
            closeAllModals();
            openModal(passwordEmailModal);
        });
    }

    if (moveSignupBtn) {
        moveSignupBtn.addEventListener("click", function () {
            closeAllModals();
            openModal(signupModal);
        });
    }

    closeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            closeAllModals();
        });
    });

    document.querySelectorAll(".modal").forEach(function (modal) {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeAllModals();
            }
        });
    });

    // 이메일 형식 검사 함수
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // 로그인 이메일/비밀번호 요소
    const loginEmailInput = document.getElementById("loginEmail");
    const loginEmailError = document.getElementById("loginEmailError");
    const loginPasswordError = document.getElementById("loginPasswordError");
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");

    const passwordDisplay = document.getElementById("loginPasswordDisplay");
    const passwordReal = document.getElementById("loginPasswordReal");
    const passwordToggle = document.getElementById("loginPasswordToggle");

    function showLoginEmailError() {
        if (!loginEmailInput || !loginEmailError) return;

        loginEmailInput.classList.add("input-error-active");
        loginEmailError.classList.remove("hidden");
    }

    function hideLoginEmailError() {
        if (!loginEmailInput || !loginEmailError) return;

        loginEmailInput.classList.remove("input-error-active");
        loginEmailError.classList.add("hidden");
    }

    function showLoginPasswordError() {
        if (!passwordDisplay || !loginPasswordError) return;

        passwordDisplay.parentElement.classList.add("error");
        loginPasswordError.classList.remove("hidden");
    }

    function hideLoginPasswordError() {
        if (!passwordDisplay || !loginPasswordError) return;

        passwordDisplay.parentElement.classList.remove("error");
        loginPasswordError.classList.add("hidden");
    }

    // 로그인 버튼 클릭 시 이메일/비밀번호 검사
    if (loginSubmitBtn && loginEmailInput) {
        loginSubmitBtn.addEventListener("click", function () {
            const email = loginEmailInput.value.trim();
            const password = passwordReal ? passwordReal.value.trim() : "";

            if (!isValidEmail(email)) {
                showLoginEmailError();
                hideLoginPasswordError();
                return;
            }

            hideLoginEmailError();

            /*
                임시 테스트용 비밀번호 검사
                나중에 백엔드 로그인 API 연결 시 이 조건은 삭제하고,
                로그인 실패 응답이 왔을 때 showLoginPasswordError() 실행
            */
            if (password !== "test1234!") {
                showLoginPasswordError();
                return;
            }

            hideLoginPasswordError();

            console.log("로그인 성공 테스트:", email);
        });
    }

    if (loginEmailInput) {
        loginEmailInput.addEventListener("input", function () {
            hideLoginEmailError();
        });
    }

    // 회원가입 이메일 에러 메시지 처리
    const signupEmailInput = document.getElementById("signupEmail");
    const signupEmailFormatError = document.getElementById("signupEmailFormatError");
    const signupEmailDuplicateError = document.getElementById("signupEmailDuplicateError");

    const duplicateEmails = [
        "helloworld@gmail.com",
        "test@gmail.com"
    ];

    function hideSignupEmailErrors() {
        if (!signupEmailInput || !signupEmailFormatError || !signupEmailDuplicateError) return;

        signupEmailInput.classList.remove("input-error-active");
        signupEmailFormatError.classList.add("hidden");
        signupEmailDuplicateError.classList.add("hidden");
    }

    function showSignupEmailFormatError() {
        if (!signupEmailInput || !signupEmailFormatError || !signupEmailDuplicateError) return;

        signupEmailInput.classList.add("input-error-active");
        signupEmailFormatError.classList.remove("hidden");
        signupEmailDuplicateError.classList.add("hidden");
    }

    function showSignupEmailDuplicateError() {
        if (!signupEmailInput || !signupEmailFormatError || !signupEmailDuplicateError) return;

        signupEmailInput.classList.add("input-error-active");
        signupEmailFormatError.classList.add("hidden");
        signupEmailDuplicateError.classList.remove("hidden");
    }

    if (signupEmailInput) {
        signupEmailInput.addEventListener("blur", function () {
            const email = signupEmailInput.value.trim();

            if (email === "") {
                hideSignupEmailErrors();
                return;
            }

            if (!isValidEmail(email)) {
                showSignupEmailFormatError();
                return;
            }

            if (duplicateEmails.includes(email)) {
                showSignupEmailDuplicateError();
                return;
            }

            hideSignupEmailErrors();
        });

        signupEmailInput.addEventListener("input", function () {
            hideSignupEmailErrors();
        });
    }

    // 로그인 비밀번호 별표 마스킹 + 눈 아이콘 전환
    let realPasswordValue = "";
    let isPasswordVisible = false;

    function updatePasswordView(cursorPosition) {
        if (!passwordDisplay || !passwordReal) {
            return;
        }

        if (isPasswordVisible) {
            passwordDisplay.value = realPasswordValue;
        } else {
            passwordDisplay.value = "*".repeat(realPasswordValue.length);
        }

        passwordReal.value = realPasswordValue;

        requestAnimationFrame(function () {
            passwordDisplay.setSelectionRange(cursorPosition, cursorPosition);
        });
    }

    if (passwordDisplay && passwordReal) {
        passwordDisplay.addEventListener("keydown", function (event) {
            const allowedKeys = [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Tab",
                "Home",
                "End",
                "Enter"
            ];

            if (allowedKeys.includes(event.key)) {
                return;
            }

            if (event.ctrlKey || event.metaKey) {
                return;
            }

            event.preventDefault();

            hideLoginPasswordError();

            const start = passwordDisplay.selectionStart;
            const end = passwordDisplay.selectionEnd;
            let nextCursor = start;

            if (event.key === "Backspace") {
                if (start === end && start > 0) {
                    realPasswordValue =
                        realPasswordValue.slice(0, start - 1) +
                        realPasswordValue.slice(end);

                    nextCursor = start - 1;
                } else {
                    realPasswordValue =
                        realPasswordValue.slice(0, start) +
                        realPasswordValue.slice(end);

                    nextCursor = start;
                }
            } else if (event.key === "Delete") {
                if (start === end) {
                    realPasswordValue =
                        realPasswordValue.slice(0, start) +
                        realPasswordValue.slice(start + 1);
                } else {
                    realPasswordValue =
                        realPasswordValue.slice(0, start) +
                        realPasswordValue.slice(end);
                }

                nextCursor = start;
            } else if (event.key.length === 1) {
                realPasswordValue =
                    realPasswordValue.slice(0, start) +
                    event.key +
                    realPasswordValue.slice(end);

                nextCursor = start + 1;
            }

            updatePasswordView(nextCursor);
        });

        passwordDisplay.addEventListener("paste", function (event) {
            event.preventDefault();

            hideLoginPasswordError();

            const pasteText = event.clipboardData.getData("text");
            const start = passwordDisplay.selectionStart;
            const end = passwordDisplay.selectionEnd;

            realPasswordValue =
                realPasswordValue.slice(0, start) +
                pasteText +
                realPasswordValue.slice(end);

            updatePasswordView(start + pasteText.length);
        });
    }

    if (passwordToggle) {
        passwordToggle.addEventListener("click", function () {
            isPasswordVisible = !isPasswordVisible;

            const eyeOff = passwordToggle.querySelector(".eye-off");
            const eyeOpen = passwordToggle.querySelector(".eye-open");

            if (isPasswordVisible) {
                eyeOff.classList.remove("active");
                eyeOpen.classList.add("active");
            } else {
                eyeOpen.classList.remove("active");
                eyeOff.classList.add("active");
            }

            updatePasswordView(realPasswordValue.length);
        });
    }

    // 비밀번호 찾기 - 이메일 인증 처리
    const resetEmailInput = document.getElementById("resetEmailInput");
    const resetEmailSendBtn = document.getElementById("resetEmailSendBtn");
    const resetEmailError = document.getElementById("resetEmailError");
    const resetEmailSuccess = document.getElementById("resetEmailSuccess");

    const resetCodeInput = document.getElementById("resetCodeInput");
    const resetCodeTimer = document.getElementById("resetCodeTimer");
    const resetCodeError = document.getElementById("resetCodeError");
    const resetCodeExpiredError = document.getElementById("resetCodeExpiredError");
    const resetConfirmBtn = document.getElementById("resetConfirmBtn");

    // 화면 테스트용 인증코드
    // 나중에 백엔드 인증코드 응답과 비교하면 됨
    const testResetCode = "7adF12F";

    let resetTimerId = null;
    let resetRemainSeconds = 0;

    function hideResetEmailMessages() {
        if (!resetEmailInput || !resetEmailError || !resetEmailSuccess) return;

        resetEmailInput.classList.remove("input-error-active");
        resetEmailError.classList.add("hidden");
        resetEmailSuccess.classList.add("hidden");
    }

    function showResetEmailError() {
        if (!resetEmailInput || !resetEmailError || !resetEmailSuccess) return;

        resetEmailInput.classList.add("input-error-active");
        resetEmailError.classList.remove("hidden");
        resetEmailSuccess.classList.add("hidden");
    }

    function showResetEmailSuccess() {
        if (!resetEmailInput || !resetEmailError || !resetEmailSuccess) return;

        resetEmailInput.classList.remove("input-error-active");
        resetEmailError.classList.add("hidden");
        resetEmailSuccess.classList.remove("hidden");
    }

    function hideResetCodeMessages() {
        if (!resetCodeInput || !resetCodeError || !resetCodeExpiredError) return;

        resetCodeInput.classList.remove("input-error-active");
        resetCodeError.classList.add("hidden");
        resetCodeExpiredError.classList.add("hidden");
    }

    function showResetCodeError() {
        if (!resetCodeInput || !resetCodeError || !resetCodeExpiredError) return;

        resetCodeInput.classList.add("input-error-active");
        resetCodeError.classList.remove("hidden");
        resetCodeExpiredError.classList.add("hidden");
    }

    function showResetCodeExpiredError() {
        if (!resetCodeInput || !resetCodeError || !resetCodeExpiredError) return;

        resetCodeInput.classList.add("input-error-active");
        resetCodeError.classList.add("hidden");
        resetCodeExpiredError.classList.remove("hidden");
    }

    function updateResetTimerText() {
        if (!resetCodeTimer) return;

        const minutes = Math.floor(resetRemainSeconds / 60);
        const seconds = resetRemainSeconds % 60;

        resetCodeTimer.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;

        if (resetRemainSeconds <= 0) {
            resetCodeTimer.classList.add("expired");
        } else {
            resetCodeTimer.classList.remove("expired");
        }
    }

    function startResetCodeTimer() {
        if (!resetCodeTimer) return;

        clearInterval(resetTimerId);

        resetRemainSeconds = 180;
        resetCodeTimer.classList.remove("hidden");
        updateResetTimerText();

        resetTimerId = setInterval(function () {
            resetRemainSeconds -= 1;
            updateResetTimerText();

            if (resetRemainSeconds <= 0) {
                clearInterval(resetTimerId);
                resetRemainSeconds = 0;
                updateResetTimerText();
            }
        }, 1000);
    }

    if (resetEmailSendBtn && resetEmailInput) {
        resetEmailSendBtn.addEventListener("click", function () {
            const email = resetEmailInput.value.trim();

            hideResetCodeMessages();

            if (!isValidEmail(email)) {
                showResetEmailError();
                return;
            }

            showResetEmailSuccess();

            resetEmailSendBtn.textContent = "재전송";

            startResetCodeTimer();

            console.log("비밀번호 찾기 인증코드 발송:", email);
        });
    }

    if (resetEmailInput) {
        resetEmailInput.addEventListener("input", function () {
            hideResetEmailMessages();
        });
    }

    if (resetCodeInput) {
        resetCodeInput.addEventListener("input", function () {
            hideResetCodeMessages();
        });
    }

    if (resetConfirmBtn) {
        resetConfirmBtn.addEventListener("click", function () {
            const code = resetCodeInput ? resetCodeInput.value.trim() : "";

            if (resetRemainSeconds <= 0) {
                showResetCodeExpiredError();
                return;
            }

            if (code !== testResetCode) {
                showResetCodeError();
                return;
            }

            hideResetCodeMessages();

            closeAllModals();
            openModal(passwordResetModal);
        });
    }
});