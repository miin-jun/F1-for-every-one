// 모달 열기/닫기 기능

document.addEventListener("DOMContentLoaded", function () {
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");
    const passwordEmailModal = document.getElementById("passwordEmailModal");
    const passwordResetModal = document.getElementById("passwordResetModal");

    const openLoginBtn = document.getElementById("openLoginModal");
    const openSignupBtn = document.getElementById("openSignupModal");
    const openPasswordBtn = document.getElementById("openPasswordModal");
    const openPasswordResetBtn = document.getElementById("openPasswordResetModal");
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

    if (openPasswordResetBtn) {
        openPasswordResetBtn.addEventListener("click", function () {
            closeAllModals();
            openModal(passwordResetModal);
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

    // 로그인 이메일 형식 검사
    const loginEmailInput = document.getElementById("loginEmail");
    const loginEmailError = document.getElementById("loginEmailError");
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");

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

    if (loginSubmitBtn && loginEmailInput) {
        loginSubmitBtn.addEventListener("click", function () {
            const email = loginEmailInput.value.trim();

            if (!isValidEmail(email)) {
                showLoginEmailError();
                return;
            }

            hideLoginEmailError();

            // 나중에 백엔드 로그인 API 연결할 자리
            console.log("로그인 요청 가능:", email);
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

    // 테스트용 중복 이메일
    // 나중에는 백엔드 API로 중복 여부 확인해야 함
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
    const passwordDisplay = document.getElementById("loginPasswordDisplay");
    const passwordReal = document.getElementById("loginPasswordReal");
    const passwordToggle = document.getElementById("loginPasswordToggle");

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
});