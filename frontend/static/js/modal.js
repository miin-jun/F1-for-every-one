// 모달 열기/닫기 기능

document.addEventListener("DOMContentLoaded", function () {
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal"); // 약관 동의 모달
    const signupFormModal = document.getElementById("signupFormModal"); // 회원가입 입력 모달
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
        closeModal(signupFormModal);
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

    // 이메일 형식 검사 함수
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // ==============================
    // 로그인 이메일/비밀번호 검사
    // ==============================

    const loginEmailInput = document.getElementById("loginEmail");
    const loginEmailError = document.getElementById("loginEmailError");
    const loginPasswordError = document.getElementById("loginPasswordError");
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");

    const passwordDisplay = document.getElementById("loginPasswordDisplay");
    const passwordReal = document.getElementById("loginPasswordReal");
    const passwordToggle = document.getElementById("loginPasswordToggle");

    let realPasswordValue = "";
    let isPasswordVisible = false;

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

    function getLoginPasswordValue() {
        if (passwordReal && passwordReal.value.trim() !== "") {
            return passwordReal.value.trim();
        }

        if (realPasswordValue.trim() !== "") {
            return realPasswordValue.trim();
        }

        if (passwordDisplay && isPasswordVisible) {
            return passwordDisplay.value.trim();
        }

        return "";
    }

    

    if (loginEmailInput) {
        loginEmailInput.addEventListener("input", function () {
            hideLoginEmailError();
        });
    }

    // 로그인 비밀번호 별표 마스킹 + 눈 아이콘 전환
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
                if (eyeOff) eyeOff.classList.remove("active");
                if (eyeOpen) eyeOpen.classList.add("active");
            } else {
                if (eyeOpen) eyeOpen.classList.remove("active");
                if (eyeOff) eyeOff.classList.add("active");
            }

            updatePasswordView(realPasswordValue.length);
        });
    }

    // ==============================
    // 회원가입 약관 동의
    // ==============================

    const agreeTerms = document.getElementById("agreeTerms");
    const agreePrivacy = document.getElementById("agreePrivacy");
    const agreeAll = document.getElementById("agreeAll");
    const termsError = document.getElementById("termsError");
    const goSignupFormBtn = document.getElementById("goSignupFormBtn");

    function hideTermsError() {
        if (termsError) {
            termsError.classList.add("hidden");
        }
    }

    function updateAgreeAllState() {
        if (!agreeTerms || !agreePrivacy || !agreeAll) return;

        agreeAll.checked = agreeTerms.checked && agreePrivacy.checked;
    }

    if (agreeAll) {
        agreeAll.addEventListener("change", function () {
            if (agreeTerms) {
                agreeTerms.checked = agreeAll.checked;
            }

            if (agreePrivacy) {
                agreePrivacy.checked = agreeAll.checked;
            }

            hideTermsError();
        });
    }

    if (agreeTerms) {
        agreeTerms.addEventListener("change", function () {
            updateAgreeAllState();
            hideTermsError();
        });
    }

    if (agreePrivacy) {
        agreePrivacy.addEventListener("change", function () {
            updateAgreeAllState();
            hideTermsError();
        });
    }

    if (goSignupFormBtn) {
        goSignupFormBtn.addEventListener("click", function () {
            if (!agreeTerms || !agreePrivacy || !signupFormModal) return;

            if (!agreeTerms.checked || !agreePrivacy.checked) {
                if (termsError) {
                    termsError.classList.remove("hidden");
                }
                return;
            }

            closeAllModals();
            openModal(signupFormModal);
        });
    }

    // ==============================
    // 회원가입 입력 폼 처리
    // ==============================

    const signupEmailInput = document.getElementById("signupEmail");
    const signupEmailCheckBtn = document.getElementById("signupEmailCheckBtn");
    const signupEmailFormatError = document.getElementById("signupEmailFormatError");
    const signupEmailDuplicateError = document.getElementById("signupEmailDuplicateError");
    const signupEmailAvailableMessage = document.getElementById("signupEmailAvailableMessage");

    const signupPassword = document.getElementById("signupPassword");
    const signupPasswordCheck = document.getElementById("signupPasswordCheck");
    const signupPasswordMatchError = document.getElementById("signupPasswordMatchError");

    const signupCodeInput = document.getElementById("signupCode");
    const signupCodeSendBtn = document.getElementById("signupCodeSendBtn");
    const signupCodeSendMessage = document.getElementById("signupCodeSendMessage");
    const signupCodeError = document.getElementById("signupCodeError");
    const signupCodeExpiredError = document.getElementById("signupCodeExpiredError");
    const signupCodeTimer = document.getElementById("signupCodeTimer");
    const signupSubmitBtn = document.getElementById("signupSubmitBtn");

    const testSignupCode = "123456";
    const duplicateEmails = ["helloworld@gmail.com", "test@gmail.com"];

    let isSignupEmailChecked = false;
    let signupTimerId = null;
    let signupRemainSeconds = 0;

    function hideSignupEmailMessages() {
        if (!signupEmailInput) return;

        signupEmailInput.classList.remove("input-error-active");

        if (signupEmailFormatError) signupEmailFormatError.classList.add("hidden");
        if (signupEmailDuplicateError) signupEmailDuplicateError.classList.add("hidden");
        if (signupEmailAvailableMessage) signupEmailAvailableMessage.classList.add("hidden");
    }

    function showSignupEmailFormatError() {
        hideSignupEmailMessages();

        if (signupEmailInput) signupEmailInput.classList.add("input-error-active");
        if (signupEmailFormatError) signupEmailFormatError.classList.remove("hidden");
    }

    function showSignupEmailDuplicateError() {
        hideSignupEmailMessages();

        if (signupEmailInput) signupEmailInput.classList.add("input-error-active");
        if (signupEmailDuplicateError) signupEmailDuplicateError.classList.remove("hidden");
    }

    function showSignupEmailAvailable() {
        hideSignupEmailMessages();

        if (signupEmailAvailableMessage) signupEmailAvailableMessage.classList.remove("hidden");
    }

    function hideSignupCodeMessages() {
        if (signupCodeInput) signupCodeInput.classList.remove("input-error-active");
        if (signupCodeError) signupCodeError.classList.add("hidden");
        if (signupCodeExpiredError) signupCodeExpiredError.classList.add("hidden");
    }

    function showSignupCodeError() {
        if (!signupCodeInput || !signupCodeError) return;

        signupCodeInput.classList.add("input-error-active");

        if (signupCodeSendMessage) signupCodeSendMessage.classList.add("hidden");
        if (signupCodeExpiredError) signupCodeExpiredError.classList.add("hidden");

        signupCodeError.classList.remove("hidden");
    }

    function showSignupCodeExpiredError() {
        if (!signupCodeInput || !signupCodeExpiredError) return;

        signupCodeInput.classList.add("input-error-active");

        if (signupCodeSendMessage) signupCodeSendMessage.classList.add("hidden");
        if (signupCodeError) signupCodeError.classList.add("hidden");

        signupCodeExpiredError.classList.remove("hidden");
    }

    function updateSignupCodeTimerText() {
        if (!signupCodeTimer) return;

        const minutes = Math.floor(signupRemainSeconds / 60);
        const seconds = signupRemainSeconds % 60;

        signupCodeTimer.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;

        if (signupRemainSeconds <= 0) {
            signupCodeTimer.classList.add("expired");
        } else {
            signupCodeTimer.classList.remove("expired");
        }
    }

    function startSignupCodeTimer() {
        if (!signupCodeTimer) return;

        clearInterval(signupTimerId);

        signupRemainSeconds = 180;
        signupCodeTimer.classList.remove("hidden");
        updateSignupCodeTimerText();

        signupTimerId = setInterval(function () {
            signupRemainSeconds -= 1;
            updateSignupCodeTimerText();

            if (signupRemainSeconds <= 0) {
                clearInterval(signupTimerId);
                signupRemainSeconds = 0;
                updateSignupCodeTimerText();
                showSignupCodeExpiredError();
            }
        }, 1000);
    }

    function isValidSignupPassword(password) {
        const hasLength = password.length >= 10 && password.length <= 16;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasNoSpace = !/\s/.test(password);

        return hasLength && hasUpper && hasLower && hasNumber && hasNoSpace;
    }

    function resetSignupPasswordIcons() {
        const passwordToggle = signupPassword
            ? signupPassword.parentElement.querySelector(".signup-password-toggle")
            : null;

        const passwordCheckToggle = signupPasswordCheck
            ? signupPasswordCheck.parentElement.querySelector(".signup-password-toggle")
            : null;

        [passwordToggle, passwordCheckToggle].forEach(function (button) {
            if (!button) return;

            const checkIcon = button.querySelector(".password-match-check");
            const eyeOff = button.querySelector(".eye-off");
            const eyeOpen = button.querySelector(".eye-open");

            if (checkIcon) checkIcon.classList.remove("active");

            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);

            if (input && input.type === "text") {
                if (eyeOff) eyeOff.classList.remove("active");
                if (eyeOpen) eyeOpen.classList.add("active");
            } else {
                if (eyeOpen) eyeOpen.classList.remove("active");
                if (eyeOff) eyeOff.classList.add("active");
            }
        });
    }

    function showBothPasswordCheckIcons() {
        const passwordToggle = signupPassword
            ? signupPassword.parentElement.querySelector(".signup-password-toggle")
            : null;

        const passwordCheckToggle = signupPasswordCheck
            ? signupPasswordCheck.parentElement.querySelector(".signup-password-toggle")
            : null;

        [passwordToggle, passwordCheckToggle].forEach(function (button) {
            if (!button) return;

            const eyeOff = button.querySelector(".eye-off");
            const eyeOpen = button.querySelector(".eye-open");
            const checkIcon = button.querySelector(".password-match-check");

            if (eyeOff) eyeOff.classList.remove("active");
            if (eyeOpen) eyeOpen.classList.remove("active");
            if (checkIcon) checkIcon.classList.add("active");
        });
    }

    function validateSignupPasswordMatch() {
        if (!signupPassword || !signupPasswordCheck || !signupPasswordMatchError) return;

        const password = signupPassword.value;
        const checkPassword = signupPasswordCheck.value;

        signupPassword.parentElement.classList.remove("error");
        signupPasswordCheck.parentElement.classList.remove("error");
        signupPasswordMatchError.classList.add("hidden");

        resetSignupPasswordIcons();

        if (checkPassword === "") return;

        if (password !== checkPassword) {
            signupPassword.parentElement.classList.add("error");
            signupPasswordCheck.parentElement.classList.add("error");
            signupPasswordMatchError.classList.remove("hidden");
            return;
        }

        if (password === checkPassword && isValidSignupPassword(password)) {
            showBothPasswordCheckIcons();
        }
    }

    function showSignupCompleteToast() {
        let toast = document.getElementById("signupCompleteToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "signupCompleteToast";
            toast.className = "signup-complete-toast";
            toast.textContent = "회원가입이 완료되었습니다.";
            document.body.appendChild(toast);
        }

        toast.classList.add("show");

        setTimeout(function () {
            toast.classList.remove("show");
        }, 1300);
    }

    if (signupEmailCheckBtn && signupEmailInput) {
        signupEmailCheckBtn.addEventListener("click", async function () {
            const email = signupEmailInput.value.trim();

            isSignupEmailChecked = false;

            if (!isValidEmail(email)) {
                showSignupEmailFormatError();
                return;
            }

            // if (duplicateEmails.includes(email)) {
            //     showSignupEmailDuplicateError();
            //     return;
            // }
            try {
                const formData = new FormData();
                formData.append('email', email);

                const response = await fetch('/accounts/check-email/', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.ok) {
                    // 사용 가능
                    isSignupEmailChecked = true;
                    showSignupEmailAvailable();
                } else {
                    // 중복
                    showSignupEmailDuplicateError();
                }
            } catch (error) {
                console.error('이메일 확인 에러:', error);
                alert('이메일 확인 중 오류가 발생했습니다.');
            }

            // isSignupEmailChecked = true;
            // showSignupEmailAvailable();
        });
    }

    if (signupEmailInput) {
        signupEmailInput.addEventListener("input", function () {
            isSignupEmailChecked = false;
            hideSignupEmailMessages();
        });
    }

    if (signupPassword) {
        signupPassword.addEventListener("input", validateSignupPasswordMatch);
    }

    if (signupPasswordCheck) {
        signupPasswordCheck.addEventListener("input", validateSignupPasswordMatch);
    }

    document.querySelectorAll(".signup-password-toggle").forEach(function (button) {
        button.addEventListener("click", function () {
            const checkIcon = button.querySelector(".password-match-check");

            if (checkIcon && checkIcon.classList.contains("active")) {
                return;
            }

            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);

            if (!input) return;

            const eyeOff = button.querySelector(".eye-off");
            const eyeOpen = button.querySelector(".eye-open");

            if (input.type === "password") {
                input.type = "text";
                if (eyeOff) eyeOff.classList.remove("active");
                if (eyeOpen) eyeOpen.classList.add("active");
            } else {
                input.type = "password";
                if (eyeOpen) eyeOpen.classList.remove("active");
                if (eyeOff) eyeOff.classList.add("active");
            }
        });
    });

    if (signupCodeSendBtn) {
        signupCodeSendBtn.addEventListener("click", async function () {
            const email = signupEmailInput ? signupEmailInput.value.trim() : "";

            if (!isValidEmail(email)) {
                showSignupEmailFormatError();
                return;
            }

            hideSignupCodeMessages();

            try {
                const formData = new FormData();
                formData.append('email', email);

                const response = await fetch('/accounts/send-code/', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.ok) {
                    if (signupCodeSendMessage) {
                        signupCodeSendMessage.classList.remove("hidden");
                    }
                    signupCodeSendBtn.textContent = "재전송";
                    startSignupCodeTimer();
                } else {
                    alert(data.error || '인증코드 전송에 실패했습니다.');
                }
            } catch (error) {
                console.error('인증코드 전송 에러:', error);
                alert('인증코드 전송 중 오류가 발생했습니다.');
            }
        });
    }
    
    if (signupCodeInput) {
        signupCodeInput.addEventListener("input", function () {
            hideSignupCodeMessages();
        });
    }

    if (signupSubmitBtn) {
    signupSubmitBtn.addEventListener("click", async function () {
        signupSubmitBtn.disabled = true;

        try {
            const email = signupEmailInput ? signupEmailInput.value.trim() : "";
            const password = signupPassword ? signupPassword.value.trim() : "";
            const passwordCheck = signupPasswordCheck ? signupPasswordCheck.value.trim() : "";
            const code = signupCodeInput ? signupCodeInput.value.trim() : "";

            if (!isValidEmail(email)) { showSignupEmailFormatError(); return; }
            if (!isSignupEmailChecked) { showSignupEmailDuplicateError(); return; }
            if (!isValidSignupPassword(password)) {
                if (signupPassword) signupPassword.parentElement.classList.add("error");
                return;
            }
            if (password !== passwordCheck) {
                if (signupPassword) signupPassword.parentElement.classList.add("error");
                if (signupPasswordCheck) signupPasswordCheck.parentElement.classList.add("error");
                if (signupPasswordMatchError) signupPasswordMatchError.classList.remove("hidden");
                return;
            }
            if (signupRemainSeconds <= 0) { showSignupCodeExpiredError(); return; }

            const formData = new FormData();
            formData.append('email', email);
            formData.append('code', code);

            const verifyResponse = await fetch('/accounts/verify-code/', { method: 'POST', body: formData });
            const verifyData = await verifyResponse.json();
            if (!verifyData.ok) { showSignupCodeError(); return; }

            const signupFormData = new FormData();
            signupFormData.append('email', email);
            signupFormData.append('password', password);

            const signupResponse = await fetch('/accounts/signup/', { method: 'POST', body: signupFormData });
            const signupData = await signupResponse.json();

            if (signupData.ok) {
                hideSignupCodeMessages();
                showSignupCompleteToast();

                if (signupEmailInput) signupEmailInput.value = "";
                if (signupPassword) signupPassword.value = "";
                if (signupPasswordCheck) signupPasswordCheck.value = "";
                if (signupCodeInput) signupCodeInput.value = "";

                isSignupEmailChecked = false;
                signupRemainSeconds = 0;
                if (signupCodeTimer) signupCodeTimer.classList.add("hidden");

                setTimeout(function () {
                    closeAllModals();
                    openModal(loginModal);
                    signupSubmitBtn.disabled = false;
                }, 900);
                return;  // finally 건너뜀
            } else {
                alert(signupData.error || '회원가입에 실패했습니다.');
            }

        } catch (error) {
            console.error('회원가입 에러:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            signupSubmitBtn.disabled = false;  // 실패/에러 시에만 실행됨
        }
    });
}
    // ==============================
    // 비밀번호 찾기 - 이메일 인증 처리
    // ==============================

    const resetEmailInput = document.getElementById("resetEmailInput");
    const resetEmailSendBtn = document.getElementById("resetEmailSendBtn");
    const resetEmailError = document.getElementById("resetEmailError");
    const resetEmailSuccess = document.getElementById("resetEmailSuccess");

    const resetCodeInput = document.getElementById("resetCodeInput");
    const resetCodeTimer = document.getElementById("resetCodeTimer");
    const resetCodeError = document.getElementById("resetCodeError");
    const resetCodeExpiredError = document.getElementById("resetCodeExpiredError");
    const resetConfirmBtn = document.getElementById("resetConfirmBtn");

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
    resetEmailSendBtn.addEventListener("click", async function () {
        const email = resetEmailInput.value.trim();

        hideResetCodeMessages();

        if (!isValidEmail(email)) {
            showResetEmailError();
            return;
        }

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('purpose', 'reset');  // 비밀번호 찾기용

            const response = await fetch('/accounts/send-code/', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.ok) {
                showResetEmailSuccess();
                resetEmailSendBtn.textContent = "재전송";
                startResetCodeTimer();
            } else {
                showResetEmailError();  // 가입되지 않은 이메일 등
            }
        } catch (error) {
            console.error('인증코드 전송 에러:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        }
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
    resetConfirmBtn.addEventListener("click", async function () {
        const email = resetEmailInput ? resetEmailInput.value.trim() : "";
        const code = resetCodeInput ? resetCodeInput.value.trim() : "";

        if (resetRemainSeconds <= 0) {
            showResetCodeExpiredError();
            return;
        }

        // 백엔드에서 인증코드 검증
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('code', code);

            const response = await fetch('/accounts/verify-code/', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (!data.ok) {
                showResetCodeError();
                return;
            }

            // 인증 성공 → 비밀번호 재설정 모달로 이동
            hideResetCodeMessages();
            closeAllModals();
            openModal(passwordResetModal);

        } catch (error) {
            console.error('인증코드 확인 에러:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        }
    });
}

    // ==============================
    // 새 비밀번호 설정
    // ==============================

    const newPasswordDisplay = document.getElementById("newPasswordDisplay");
    const newPasswordReal = document.getElementById("newPasswordReal");
    const newPasswordToggle = document.getElementById("newPasswordToggle");

    const newPasswordCheckDisplay = document.getElementById("newPasswordCheckDisplay");
    const newPasswordCheckReal = document.getElementById("newPasswordCheckReal");
    const newPasswordCheckToggle = document.getElementById("newPasswordCheckToggle");

    const newPasswordMatchError = document.getElementById("newPasswordMatchError");
    const passwordResetConfirmBtn = document.getElementById("passwordResetConfirmBtn");

    let newPasswordValue = "";
    let newPasswordCheckValue = "";
    let isNewPasswordVisible = false;
    let isNewPasswordCheckVisible = false;

    function isValidNewPassword(password) {
        const hasLength = password.length >= 10 && password.length <= 16;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasNoSpace = !/\s/.test(password);

        return hasLength && hasUpper && hasLower && hasNumber && hasNoSpace;
    }

    function updateResetPasswordIcons() {
        const isMatched =
            newPasswordValue !== "" &&
            newPasswordCheckValue !== "" &&
            newPasswordValue === newPasswordCheckValue &&
            isValidNewPassword(newPasswordValue);

        const newPasswordEyeOff = newPasswordToggle ? newPasswordToggle.querySelector(".reset-eye-off") : null;
        const newPasswordEyeOpen = newPasswordToggle ? newPasswordToggle.querySelector(".reset-eye-open") : null;
        const newPasswordCheckIcon = newPasswordToggle ? newPasswordToggle.querySelector(".reset-check-icon") : null;

        const checkEyeOff = newPasswordCheckToggle ? newPasswordCheckToggle.querySelector(".reset-eye-off") : null;
        const checkEyeOpen = newPasswordCheckToggle ? newPasswordCheckToggle.querySelector(".reset-eye-open") : null;
        const checkIcon = newPasswordCheckToggle ? newPasswordCheckToggle.querySelector(".reset-check-icon") : null;

        if (isMatched) {
            if (newPasswordEyeOff) newPasswordEyeOff.classList.remove("active");
            if (newPasswordEyeOpen) newPasswordEyeOpen.classList.remove("active");
            if (newPasswordCheckIcon) newPasswordCheckIcon.classList.add("active");

            if (checkEyeOff) checkEyeOff.classList.remove("active");
            if (checkEyeOpen) checkEyeOpen.classList.remove("active");
            if (checkIcon) checkIcon.classList.add("active");

            return;
        }

        if (newPasswordCheckIcon) newPasswordCheckIcon.classList.remove("active");
        if (checkIcon) checkIcon.classList.remove("active");

        if (newPasswordEyeOff && newPasswordEyeOpen) {
            if (isNewPasswordVisible) {
                newPasswordEyeOff.classList.remove("active");
                newPasswordEyeOpen.classList.add("active");
            } else {
                newPasswordEyeOpen.classList.remove("active");
                newPasswordEyeOff.classList.add("active");
            }
        }

        if (checkEyeOff && checkEyeOpen) {
            if (isNewPasswordCheckVisible) {
                checkEyeOff.classList.remove("active");
                checkEyeOpen.classList.add("active");
            } else {
                checkEyeOpen.classList.remove("active");
                checkEyeOff.classList.add("active");
            }
        }
    }

    function updateResetPasswordView(target, cursorPosition) {
        const isFirst = target === "new";
        const display = isFirst ? newPasswordDisplay : newPasswordCheckDisplay;
        const real = isFirst ? newPasswordReal : newPasswordCheckReal;
        const value = isFirst ? newPasswordValue : newPasswordCheckValue;
        const visible = isFirst ? isNewPasswordVisible : isNewPasswordCheckVisible;

        if (!display || !real) return;

        if (visible) {
            display.value = value;
        } else {
            display.value = "*".repeat(value.length);
        }

        real.value = value;

        requestAnimationFrame(function () {
            display.setSelectionRange(cursorPosition, cursorPosition);
        });

        updateResetPasswordIcons();
    }

    function handlePasswordTyping(event, target) {
        const isFirst = target === "new";
        const display = isFirst ? newPasswordDisplay : newPasswordCheckDisplay;

        if (!display) return;

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

        if (newPasswordMatchError) {
            newPasswordMatchError.classList.add("hidden");
        }

        if (newPasswordDisplay) {
            newPasswordDisplay.parentElement.classList.remove("error");
        }

        if (newPasswordCheckDisplay) {
            newPasswordCheckDisplay.parentElement.classList.remove("error");
        }

        const start = display.selectionStart;
        const end = display.selectionEnd;

        let value = isFirst ? newPasswordValue : newPasswordCheckValue;
        let nextCursor = start;

        if (event.key === "Backspace") {
            if (start === end && start > 0) {
                value = value.slice(0, start - 1) + value.slice(end);
                nextCursor = start - 1;
            } else {
                value = value.slice(0, start) + value.slice(end);
                nextCursor = start;
            }
        } else if (event.key === "Delete") {
            if (start === end) {
                value = value.slice(0, start) + value.slice(start + 1);
            } else {
                value = value.slice(0, start) + value.slice(end);
            }

            nextCursor = start;
        } else if (event.key.length === 1) {
            value = value.slice(0, start) + event.key + value.slice(end);
            nextCursor = start + 1;
        }

        if (isFirst) {
            newPasswordValue = value;
        } else {
            newPasswordCheckValue = value;
        }

        updateResetPasswordView(target, nextCursor);
    }

    function handlePasswordPaste(event, target) {
        event.preventDefault();

        const isFirst = target === "new";
        const display = isFirst ? newPasswordDisplay : newPasswordCheckDisplay;

        if (!display) return;

        const pasteText = event.clipboardData.getData("text");
        const start = display.selectionStart;
        const end = display.selectionEnd;

        let value = isFirst ? newPasswordValue : newPasswordCheckValue;

        value = value.slice(0, start) + pasteText + value.slice(end);

        if (isFirst) {
            newPasswordValue = value;
        } else {
            newPasswordCheckValue = value;
        }

        updateResetPasswordView(target, start + pasteText.length);
    }

    if (newPasswordDisplay) {
        newPasswordDisplay.addEventListener("keydown", function (event) {
            handlePasswordTyping(event, "new");
        });

        newPasswordDisplay.addEventListener("paste", function (event) {
            handlePasswordPaste(event, "new");
        });
    }

    if (newPasswordCheckDisplay) {
        newPasswordCheckDisplay.addEventListener("keydown", function (event) {
            handlePasswordTyping(event, "check");
        });

        newPasswordCheckDisplay.addEventListener("paste", function (event) {
            handlePasswordPaste(event, "check");
        });
    }

    if (newPasswordToggle) {
        newPasswordToggle.addEventListener("click", function () {
            if (
                newPasswordValue !== "" &&
                newPasswordCheckValue !== "" &&
                newPasswordValue === newPasswordCheckValue &&
                isValidNewPassword(newPasswordValue)
            ) {
                return;
            }

            isNewPasswordVisible = !isNewPasswordVisible;
            updateResetPasswordView("new", newPasswordValue.length);
        });
    }

    if (newPasswordCheckToggle) {
        newPasswordCheckToggle.addEventListener("click", function () {
            if (
                newPasswordValue !== "" &&
                newPasswordCheckValue !== "" &&
                newPasswordValue === newPasswordCheckValue &&
                isValidNewPassword(newPasswordValue)
            ) {
                return;
            }

            isNewPasswordCheckVisible = !isNewPasswordCheckVisible;
            updateResetPasswordView("check", newPasswordCheckValue.length);
        });
    }

    // 비밀번호 변경 완료 팝업
    function showPasswordChangeToast() {
        let toast = document.getElementById("passwordChangeToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "passwordChangeToast";
            toast.className = "password-change-toast";
            toast.textContent = "비밀번호가 변경되었습니다.";
            document.body.appendChild(toast);
        }

        toast.classList.add("show");

        setTimeout(function () {
            toast.classList.remove("show");
        }, 1300);
    }

    if (passwordResetConfirmBtn) {
    passwordResetConfirmBtn.addEventListener("click", async function () {
        const isRuleValid = isValidNewPassword(newPasswordValue);
        const isMatched = newPasswordValue === newPasswordCheckValue && newPasswordCheckValue !== "";

        if (!isRuleValid) {
            if (newPasswordDisplay) newPasswordDisplay.parentElement.classList.add("error");
            if (newPasswordMatchError) newPasswordMatchError.classList.add("hidden");
            updateResetPasswordIcons();
            return;
        }

        if (!isMatched) {
            if (newPasswordDisplay) newPasswordDisplay.parentElement.classList.add("error");
            if (newPasswordCheckDisplay) newPasswordCheckDisplay.parentElement.classList.add("error");
            if (newPasswordMatchError) newPasswordMatchError.classList.remove("hidden");
            updateResetPasswordIcons();
            return;
        }

        // 백엔드 API 호출
        try {
            const email = resetEmailInput ? resetEmailInput.value.trim() : "";

            const formData = new FormData();
            formData.append('email', email);
            formData.append('new_password', newPasswordValue);

            const response = await fetch('/accounts/reset-password/', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.ok) {
                updateResetPasswordIcons();
                showPasswordChangeToast();

                newPasswordValue = "";
                newPasswordCheckValue = "";
                isNewPasswordVisible = false;
                isNewPasswordCheckVisible = false;

                if (newPasswordDisplay) newPasswordDisplay.value = "";
                if (newPasswordReal) newPasswordReal.value = "";
                if (newPasswordCheckDisplay) newPasswordCheckDisplay.value = "";
                if (newPasswordCheckReal) newPasswordCheckReal.value = "";

                setTimeout(function () {
                    closeAllModals();
                    openModal(loginModal);
                }, 900);
            } else {
                alert(data.error || '비밀번호 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('비밀번호 재설정 에러:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        }
    });
}
});