document.addEventListener("DOMContentLoaded", function () {
    /* ==============================
       요소 선택 / 공통 유틸
    ============================== */

    const $ = (id) => document.getElementById(id);
    const $$ = (selector) => document.querySelectorAll(selector);

    const loginModal = $("loginModal");
    const signupModal = $("signupModal");
    const signupFormModal = $("signupFormModal");
    const passwordEmailModal = $("passwordEmailModal");
    const passwordResetModal = $("passwordResetModal");

    const modalList = [
        loginModal,
        signupModal,
        signupFormModal,
        passwordEmailModal,
        passwordResetModal
    ];

    const openLoginBtn = $("openLoginModal");
    const openSignupBtn = $("openSignupModal");
    const openPasswordBtn = $("openPasswordModal");
    const moveSignupBtn = $("moveSignupModal");

    const TEST_LOGIN_PASSWORD = "test1234!";
    const TEST_SIGNUP_CODE = "7adF12F";
    const TEST_RESET_CODE = "7adF12F";
    const TIMER_SECONDS = 180;

    const duplicateEmails = ["helloworld@gmail.com", "test@gmail.com"];

    function addHidden(element) {
        if (element) element.classList.add("hidden");
    }

    function removeHidden(element) {
        if (element) element.classList.remove("hidden");
    }

    function openModal(modal) {
        if (!modal) return;

        modal.classList.remove("hidden");
        document.body.classList.add("modal-open");
    }

    function closeModal(modal) {
        if (!modal) return;

        modal.classList.add("hidden");
    }

    function closeAllModals() {
        modalList.forEach(closeModal);
        document.body.classList.remove("modal-open");
    }

    function moveModal(targetModal) {
        closeAllModals();
        openModal(targetModal);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPassword(password) {
        const hasLength = password.length >= 10 && password.length <= 16;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasNoSpace = !/\s/.test(password);

        return hasLength && hasUpper && hasLower && hasNumber && hasNoSpace;
    }

    function showToast(id, className, message, duration = 1300) {
        let toast = $(id);

        if (!toast) {
            toast = document.createElement("div");
            toast.id = id;
            toast.className = className;
            toast.textContent = message;
            document.body.appendChild(toast);
        }

        toast.classList.add("show");

        setTimeout(function () {
            toast.classList.remove("show");
        }, duration);
    }

    function setInputError(input, errorElement, isError) {
        if (input) {
            input.classList.toggle("input-error-active", isError);
            input.classList.toggle("error", isError);
        }

        if (errorElement) {
            errorElement.classList.toggle("hidden", !isError);
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const restSeconds = seconds % 60;

        return `${minutes}:${String(restSeconds).padStart(2, "0")}`;
    }

    function startTimer(state, timerElement, onExpire) {
        if (!timerElement) return;

        clearInterval(state.timerId);

        state.remaining = TIMER_SECONDS;
        timerElement.classList.remove("hidden", "expired");
        timerElement.textContent = formatTime(state.remaining);

        state.timerId = setInterval(function () {
            state.remaining -= 1;

            timerElement.textContent = formatTime(Math.max(state.remaining, 0));
            timerElement.classList.toggle("expired", state.remaining <= 0);

            if (state.remaining <= 0) {
                clearInterval(state.timerId);
                state.timerId = null;

                if (typeof onExpire === "function") {
                    onExpire();
                }
            }
        }, 1000);
    }

    function stopTimer(state, timerElement) {
        clearInterval(state.timerId);

        state.timerId = null;
        state.remaining = 0;

        if (timerElement) {
            timerElement.classList.add("hidden");
            timerElement.classList.remove("expired");
        }
    }

    function getEyeOff(toggleButton) {
        return toggleButton
            ? toggleButton.querySelector(".eye-off, .reset-eye-off, .signup-eye-off")
            : null;
    }

    function getEyeOpen(toggleButton) {
        return toggleButton
            ? toggleButton.querySelector(".eye-open, .reset-eye-open, .signup-eye-open")
            : null;
    }

    function getCheckIcon(toggleButton) {
        return toggleButton
            ? toggleButton.querySelector(".password-match-check, .reset-check-icon, .signup-check-icon")
            : null;
    }

    function setEyeIconState(toggleButton, isVisible) {
        const eyeOff = getEyeOff(toggleButton);
        const eyeOpen = getEyeOpen(toggleButton);
        const checkIcon = getCheckIcon(toggleButton);

        if (checkIcon) checkIcon.classList.remove("active");

        if (isVisible) {
            if (eyeOff) eyeOff.classList.remove("active");
            if (eyeOpen) eyeOpen.classList.add("active");
            return;
        }

        if (eyeOpen) eyeOpen.classList.remove("active");
        if (eyeOff) eyeOff.classList.add("active");
    }

    function showCheckIcon(toggleButton) {
        const eyeOff = getEyeOff(toggleButton);
        const eyeOpen = getEyeOpen(toggleButton);
        const checkIcon = getCheckIcon(toggleButton);

        if (eyeOff) eyeOff.classList.remove("active");
        if (eyeOpen) eyeOpen.classList.remove("active");
        if (checkIcon) checkIcon.classList.add("active");
    }

    function toggleNormalPasswordInput(input, toggleButton) {
        if (!input || !toggleButton) return;

        const checkIcon = getCheckIcon(toggleButton);

        if (checkIcon && checkIcon.classList.contains("active")) {
            return;
        }

        const isVisible = input.type === "password";

        input.type = isVisible ? "text" : "password";
        setEyeIconState(toggleButton, isVisible);
    }

    function createMaskedPasswordController(options) {
        const displayInput = options.displayInput;
        const realInput = options.realInput;
        const toggleButton = options.toggleButton;
        const onChange = options.onChange;
        const shouldPreventToggle = options.shouldPreventToggle;

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

        let value = "";
        let isVisible = false;

        function updateView(cursorPosition) {
            if (!displayInput || !realInput) return;

            displayInput.value = isVisible ? value : "*".repeat(value.length);
            realInput.value = value;

            requestAnimationFrame(function () {
                displayInput.setSelectionRange(cursorPosition, cursorPosition);
            });

            setEyeIconState(toggleButton, isVisible);

            if (typeof onChange === "function") {
                onChange(value);
            }
        }

        function handleKeydown(event) {
            if (allowedKeys.includes(event.key)) {
                return;
            }

            if (event.ctrlKey || event.metaKey) {
                return;
            }

            event.preventDefault();

            const start = displayInput.selectionStart;
            const end = displayInput.selectionEnd;
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

            updateView(nextCursor);
        }

        function handlePaste(event) {
            event.preventDefault();

            const pasteText = event.clipboardData.getData("text");
            const start = displayInput.selectionStart;
            const end = displayInput.selectionEnd;

            value = value.slice(0, start) + pasteText + value.slice(end);

            updateView(start + pasteText.length);
        }

        function toggleVisibility() {
            if (typeof shouldPreventToggle === "function" && shouldPreventToggle()) {
                return;
            }

            isVisible = !isVisible;
            updateView(value.length);
        }

        function reset() {
            value = "";
            isVisible = false;

            if (displayInput) displayInput.value = "";
            if (realInput) realInput.value = "";

            setEyeIconState(toggleButton, false);
        }

        if (displayInput && realInput) {
            displayInput.addEventListener("keydown", handleKeydown);
            displayInput.addEventListener("paste", handlePaste);
        }

        if (toggleButton) {
            toggleButton.addEventListener("click", toggleVisibility);
        }

        return {
            getValue: function () {
                return value.trim();
            },
            getRawValue: function () {
                return value;
            },
            reset,
            updateView,
            setCheckIcon: function () {
                showCheckIcon(toggleButton);
            },
            setEyeIcon: function () {
                setEyeIconState(toggleButton, isVisible);
            }
        };
    }

    /* ==============================
       모달 열기 / 닫기
    ============================== */

    if (openLoginBtn) {
        openLoginBtn.addEventListener("click", function () {
            moveModal(loginModal);
        });
    }

    if (openSignupBtn) {
        openSignupBtn.addEventListener("click", function () {
            moveModal(signupModal);
        });
    }

    if (openPasswordBtn) {
        openPasswordBtn.addEventListener("click", function () {
            moveModal(passwordEmailModal);
        });
    }

    if (moveSignupBtn) {
        moveSignupBtn.addEventListener("click", function () {
            moveModal(signupModal);
        });
    }

    $$(".modal-close").forEach(function (button) {
        button.addEventListener("click", closeAllModals);
    });

    /* ==============================
       로그인
    ============================== */

    const loginEmailInput = $("loginEmail");
    const loginEmailError = $("loginEmailError");
    const loginPasswordError = $("loginPasswordError");
    const loginSubmitBtn = $("loginSubmitBtn");

    const loginPasswordDisplay = $("loginPasswordDisplay");
    const loginPasswordReal = $("loginPasswordReal");
    const loginPasswordToggle = $("loginPasswordToggle");

    const loginPasswordController = createMaskedPasswordController({
        displayInput: loginPasswordDisplay,
        realInput: loginPasswordReal,
        toggleButton: loginPasswordToggle,
        onChange: function () {
            hideLoginPasswordError();
        }
    });

    function showLoginEmailError() {
        setInputError(loginEmailInput, loginEmailError, true);
    }

    function hideLoginEmailError() {
        setInputError(loginEmailInput, loginEmailError, false);
    }

    function showLoginPasswordError() {
        if (loginPasswordDisplay && loginPasswordDisplay.parentElement) {
            loginPasswordDisplay.parentElement.classList.add("error");
        }

        removeHidden(loginPasswordError);
    }

    function hideLoginPasswordError() {
        if (loginPasswordDisplay && loginPasswordDisplay.parentElement) {
            loginPasswordDisplay.parentElement.classList.remove("error");
        }

        addHidden(loginPasswordError);
    }

    function submitLogin() {
        const email = loginEmailInput ? loginEmailInput.value.trim() : "";
        const password = loginPasswordController.getValue();

        if (!isValidEmail(email)) {
            showLoginEmailError();
            hideLoginPasswordError();
            return;
        }

        hideLoginEmailError();

        if (password !== TEST_LOGIN_PASSWORD) {
            showLoginPasswordError();
            return;
        }

        hideLoginPasswordError();
        window.location.assign("/chat/");
    }

    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener("click", function (event) {
            event.preventDefault();
            submitLogin();
        });
    }

    if (loginEmailInput) {
        loginEmailInput.addEventListener("input", hideLoginEmailError);

        loginEmailInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                submitLogin();
            }
        });
    }

    if (loginPasswordDisplay) {
        loginPasswordDisplay.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                submitLogin();
            }
        });
    }

    /* ==============================
       회원가입 약관 동의
    ============================== */

    const agreeTerms = $("agreeTerms");
    const agreePrivacy = $("agreePrivacy");
    const agreeAll = $("agreeAll");
    const termsError = $("termsError");
    const goSignupFormBtn = $("goSignupFormBtn");

    function hideTermsError() {
        addHidden(termsError);
    }

    function updateAgreeAllState() {
        if (!agreeTerms || !agreePrivacy || !agreeAll) return;

        agreeAll.checked = agreeTerms.checked && agreePrivacy.checked;
    }

    if (agreeAll) {
        agreeAll.addEventListener("change", function () {
            if (agreeTerms) agreeTerms.checked = agreeAll.checked;
            if (agreePrivacy) agreePrivacy.checked = agreeAll.checked;

            hideTermsError();
        });
    }

    [agreeTerms, agreePrivacy].forEach(function (checkbox) {
        if (!checkbox) return;

        checkbox.addEventListener("change", function () {
            updateAgreeAllState();
            hideTermsError();
        });
    });

    if (goSignupFormBtn) {
        goSignupFormBtn.addEventListener("click", function () {
            if (!agreeTerms || !agreePrivacy) return;

            if (!agreeTerms.checked || !agreePrivacy.checked) {
                removeHidden(termsError);
                return;
            }

            moveModal(signupFormModal);
        });
    }

    /* ==============================
       회원가입 입력 폼
    ============================== */

    const signupEmailInput = $("signupEmail");
    const signupEmailCheckBtn = $("signupEmailCheckBtn");
    const signupEmailFormatError = $("signupEmailFormatError");
    const signupEmailDuplicateError = $("signupEmailDuplicateError");
    const signupEmailAvailableMessage = $("signupEmailAvailableMessage");

    const signupPassword = $("signupPassword");
    const signupPasswordCheck = $("signupPasswordCheck");
    const signupPasswordMatchError = $("signupPasswordMatchError");

    const signupCodeInput = $("signupCode");
    const signupCodeSendBtn = $("signupCodeSendBtn");
    const signupCodeSendMessage = $("signupCodeSendMessage");
    const signupCodeError = $("signupCodeError");
    const signupCodeExpiredError = $("signupCodeExpiredError");
    const signupCodeTimer = $("signupCodeTimer");
    const signupSubmitBtn = $("signupSubmitBtn");

    const signupTimerState = {
        timerId: null,
        remaining: 0
    };

    let isSignupEmailChecked = false;

    function hideSignupEmailMessages() {
        if (signupEmailInput) {
            signupEmailInput.classList.remove("input-error-active");
        }

        addHidden(signupEmailFormatError);
        addHidden(signupEmailDuplicateError);
        addHidden(signupEmailAvailableMessage);
    }

    function showSignupEmailFormatError() {
        hideSignupEmailMessages();

        if (signupEmailInput) signupEmailInput.classList.add("input-error-active");
        removeHidden(signupEmailFormatError);
    }

    function showSignupEmailDuplicateError() {
        hideSignupEmailMessages();

        if (signupEmailInput) signupEmailInput.classList.add("input-error-active");
        removeHidden(signupEmailDuplicateError);
    }

    function showSignupEmailAvailable() {
        hideSignupEmailMessages();
        removeHidden(signupEmailAvailableMessage);
    }

    function hideSignupCodeMessages() {
        if (signupCodeInput) {
            signupCodeInput.classList.remove("input-error-active");
        }

        addHidden(signupCodeError);
        addHidden(signupCodeExpiredError);
    }

    function showSignupCodeError() {
        if (signupCodeInput) signupCodeInput.classList.add("input-error-active");

        addHidden(signupCodeSendMessage);
        addHidden(signupCodeExpiredError);
        removeHidden(signupCodeError);
    }

    function showSignupCodeExpiredError() {
        if (signupCodeInput) signupCodeInput.classList.add("input-error-active");

        addHidden(signupCodeSendMessage);
        addHidden(signupCodeError);
        removeHidden(signupCodeExpiredError);
    }

    function resetSignupPasswordIcons() {
        const toggles = [
            signupPassword ? signupPassword.parentElement.querySelector(".signup-password-toggle") : null,
            signupPasswordCheck ? signupPasswordCheck.parentElement.querySelector(".signup-password-toggle") : null
        ];

        toggles.forEach(function (button) {
            if (!button) return;

            const targetId = button.getAttribute("data-target");
            const input = $(targetId);

            setEyeIconState(button, input && input.type === "text");
        });
    }

    function showSignupPasswordCheckIcons() {
        const toggles = [
            signupPassword ? signupPassword.parentElement.querySelector(".signup-password-toggle") : null,
            signupPasswordCheck ? signupPasswordCheck.parentElement.querySelector(".signup-password-toggle") : null
        ];

        toggles.forEach(showCheckIcon);
    }

    function validateSignupPasswordMatch() {
        if (!signupPassword || !signupPasswordCheck || !signupPasswordMatchError) return;

        const password = signupPassword.value;
        const passwordCheck = signupPasswordCheck.value;

        signupPassword.parentElement.classList.remove("error");
        signupPasswordCheck.parentElement.classList.remove("error");
        signupPasswordMatchError.classList.add("hidden");

        resetSignupPasswordIcons();

        if (!passwordCheck) return;

        if (password !== passwordCheck) {
            signupPassword.parentElement.classList.add("error");
            signupPasswordCheck.parentElement.classList.add("error");
            signupPasswordMatchError.classList.remove("hidden");
            return;
        }

        if (isValidPassword(password)) {
            showSignupPasswordCheckIcons();
        }
    }

    function resetSignupForm() {
        if (signupEmailInput) signupEmailInput.value = "";
        if (signupPassword) signupPassword.value = "";
        if (signupPasswordCheck) signupPasswordCheck.value = "";
        if (signupCodeInput) signupCodeInput.value = "";

        isSignupEmailChecked = false;

        hideSignupEmailMessages();
        hideSignupCodeMessages();
        addHidden(signupCodeSendMessage);
        addHidden(signupPasswordMatchError);

        if (signupPassword) signupPassword.parentElement.classList.remove("error");
        if (signupPasswordCheck) signupPasswordCheck.parentElement.classList.remove("error");

        stopTimer(signupTimerState, signupCodeTimer);

        if (signupCodeSendBtn) {
            signupCodeSendBtn.textContent = "전송";
        }

        resetSignupPasswordIcons();
    }

    if (signupEmailCheckBtn && signupEmailInput) {
        signupEmailCheckBtn.addEventListener("click", function () {
            const email = signupEmailInput.value.trim();

            isSignupEmailChecked = false;

            if (!isValidEmail(email)) {
                showSignupEmailFormatError();
                return;
            }

            if (duplicateEmails.includes(email)) {
                showSignupEmailDuplicateError();
                return;
            }

            isSignupEmailChecked = true;
            showSignupEmailAvailable();
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

    $$(".signup-password-toggle").forEach(function (button) {
        button.addEventListener("click", function () {
            const targetId = button.getAttribute("data-target");
            const input = $(targetId);

            toggleNormalPasswordInput(input, button);
        });
    });

    if (signupCodeSendBtn) {
        signupCodeSendBtn.addEventListener("click", function () {
            hideSignupCodeMessages();
            removeHidden(signupCodeSendMessage);

            signupCodeSendBtn.textContent = "재전송";

            startTimer(signupTimerState, signupCodeTimer, function () {
                showSignupCodeExpiredError();
            });
        });
    }

    if (signupCodeInput) {
        signupCodeInput.addEventListener("input", hideSignupCodeMessages);
    }

    if (signupSubmitBtn) {
        signupSubmitBtn.addEventListener("click", function () {
            const email = signupEmailInput ? signupEmailInput.value.trim() : "";
            const password = signupPassword ? signupPassword.value.trim() : "";
            const passwordCheck = signupPasswordCheck ? signupPasswordCheck.value.trim() : "";
            const code = signupCodeInput ? signupCodeInput.value.trim() : "";

            if (!isValidEmail(email)) {
                showSignupEmailFormatError();
                return;
            }

            if (!isSignupEmailChecked) {
                showSignupEmailDuplicateError();
                return;
            }

            if (!isValidPassword(password)) {
                if (signupPassword) signupPassword.parentElement.classList.add("error");
                return;
            }

            if (password !== passwordCheck) {
                if (signupPassword) signupPassword.parentElement.classList.add("error");
                if (signupPasswordCheck) signupPasswordCheck.parentElement.classList.add("error");
                removeHidden(signupPasswordMatchError);
                return;
            }

            if (signupTimerState.remaining <= 0) {
                showSignupCodeExpiredError();
                return;
            }

            if (code !== TEST_SIGNUP_CODE) {
                showSignupCodeError();
                return;
            }

            hideSignupCodeMessages();

            showToast(
                "signupCompleteToast",
                "signup-complete-toast",
                "회원가입이 완료되었습니다."
            );

            resetSignupForm();

            setTimeout(function () {
                moveModal(loginModal);
            }, 900);
        });
    }

    /* ==============================
       비밀번호 찾기 - 이메일 인증
    ============================== */

    const resetEmailInput = $("resetEmailInput");
    const resetEmailSendBtn = $("resetEmailSendBtn");
    const resetEmailError = $("resetEmailError");
    const resetEmailSuccess = $("resetEmailSuccess");

    const resetCodeInput = $("resetCodeInput");
    const resetCodeTimer = $("resetCodeTimer");
    const resetCodeError = $("resetCodeError");
    const resetCodeExpiredError = $("resetCodeExpiredError");
    const resetConfirmBtn = $("resetConfirmBtn");

    const resetTimerState = {
        timerId: null,
        remaining: 0
    };

    function hideResetEmailMessages() {
        if (resetEmailInput) resetEmailInput.classList.remove("input-error-active");

        addHidden(resetEmailError);
        addHidden(resetEmailSuccess);
    }

    function showResetEmailError() {
        if (resetEmailInput) resetEmailInput.classList.add("input-error-active");

        removeHidden(resetEmailError);
        addHidden(resetEmailSuccess);
    }

    function showResetEmailSuccess() {
        if (resetEmailInput) resetEmailInput.classList.remove("input-error-active");

        addHidden(resetEmailError);
        removeHidden(resetEmailSuccess);
    }

    function hideResetCodeMessages() {
        if (resetCodeInput) resetCodeInput.classList.remove("input-error-active");

        addHidden(resetCodeError);
        addHidden(resetCodeExpiredError);
    }

    function showResetCodeError() {
        if (resetCodeInput) resetCodeInput.classList.add("input-error-active");

        removeHidden(resetCodeError);
        addHidden(resetCodeExpiredError);
    }

    function showResetCodeExpiredError() {
        if (resetCodeInput) resetCodeInput.classList.add("input-error-active");

        addHidden(resetCodeError);
        removeHidden(resetCodeExpiredError);
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

            startTimer(resetTimerState, resetCodeTimer);
        });
    }

    if (resetEmailInput) {
        resetEmailInput.addEventListener("input", hideResetEmailMessages);
    }

    if (resetCodeInput) {
        resetCodeInput.addEventListener("input", hideResetCodeMessages);
    }

    if (resetConfirmBtn) {
        resetConfirmBtn.addEventListener("click", function () {
            const code = resetCodeInput ? resetCodeInput.value.trim() : "";

            if (resetTimerState.remaining <= 0) {
                showResetCodeExpiredError();
                return;
            }

            if (code !== TEST_RESET_CODE) {
                showResetCodeError();
                return;
            }

            hideResetCodeMessages();
            moveModal(passwordResetModal);
        });
    }

    /* ==============================
       새 비밀번호 설정
    ============================== */

    const newPasswordDisplay = $("newPasswordDisplay");
    const newPasswordReal = $("newPasswordReal");
    const newPasswordToggle = $("newPasswordToggle");

    const newPasswordCheckDisplay = $("newPasswordCheckDisplay");
    const newPasswordCheckReal = $("newPasswordCheckReal");
    const newPasswordCheckToggle = $("newPasswordCheckToggle");

    const newPasswordMatchError = $("newPasswordMatchError");
    const passwordResetConfirmBtn = $("passwordResetConfirmBtn");

    let newPasswordController;
    let newPasswordCheckController;

    function getNewPasswordValues() {
        return {
            password: newPasswordController ? newPasswordController.getRawValue() : "",
            passwordCheck: newPasswordCheckController ? newPasswordCheckController.getRawValue() : ""
        };
    }

    function isResetPasswordMatched() {
        const values = getNewPasswordValues();

        return (
            values.password !== "" &&
            values.passwordCheck !== "" &&
            values.password === values.passwordCheck &&
            isValidPassword(values.password)
        );
    }

    function clearResetPasswordErrors() {
        if (newPasswordDisplay && newPasswordDisplay.parentElement) {
            newPasswordDisplay.parentElement.classList.remove("error");
        }

        if (newPasswordCheckDisplay && newPasswordCheckDisplay.parentElement) {
            newPasswordCheckDisplay.parentElement.classList.remove("error");
        }

        addHidden(newPasswordMatchError);
    }

    function updateResetPasswordIcons() {
        if (isResetPasswordMatched()) {
            if (newPasswordController) newPasswordController.setCheckIcon();
            if (newPasswordCheckController) newPasswordCheckController.setCheckIcon();
            return;
        }

        if (newPasswordController) newPasswordController.setEyeIcon();
        if (newPasswordCheckController) newPasswordCheckController.setEyeIcon();
    }

    newPasswordController = createMaskedPasswordController({
        displayInput: newPasswordDisplay,
        realInput: newPasswordReal,
        toggleButton: newPasswordToggle,
        shouldPreventToggle: isResetPasswordMatched,
        onChange: function () {
            clearResetPasswordErrors();
            updateResetPasswordIcons();
        }
    });

    newPasswordCheckController = createMaskedPasswordController({
        displayInput: newPasswordCheckDisplay,
        realInput: newPasswordCheckReal,
        toggleButton: newPasswordCheckToggle,
        shouldPreventToggle: isResetPasswordMatched,
        onChange: function () {
            clearResetPasswordErrors();
            updateResetPasswordIcons();
        }
    });

    function resetNewPasswordForm() {
        if (newPasswordController) newPasswordController.reset();
        if (newPasswordCheckController) newPasswordCheckController.reset();

        clearResetPasswordErrors();
        updateResetPasswordIcons();
    }

    if (passwordResetConfirmBtn) {
        passwordResetConfirmBtn.addEventListener("click", function () {
            const values = getNewPasswordValues();
            const isRuleValid = isValidPassword(values.password);
            const isMatched =
                values.password !== "" &&
                values.password === values.passwordCheck;

            if (!isRuleValid) {
                if (newPasswordDisplay && newPasswordDisplay.parentElement) {
                    newPasswordDisplay.parentElement.classList.add("error");
                }

                if (newPasswordCheckDisplay && newPasswordCheckDisplay.parentElement) {
                    newPasswordCheckDisplay.parentElement.classList.remove("error");
                }

                addHidden(newPasswordMatchError);
                updateResetPasswordIcons();
                return;
            }

            if (!isMatched) {
                if (newPasswordDisplay && newPasswordDisplay.parentElement) {
                    newPasswordDisplay.parentElement.classList.add("error");
                }

                if (newPasswordCheckDisplay && newPasswordCheckDisplay.parentElement) {
                    newPasswordCheckDisplay.parentElement.classList.add("error");
                }

                removeHidden(newPasswordMatchError);
                updateResetPasswordIcons();
                return;
            }

            clearResetPasswordErrors();
            updateResetPasswordIcons();

            showToast(
                "passwordChangeToast",
                "password-change-toast",
                "비밀번호가 변경되었습니다."
            );

            resetNewPasswordForm();

            setTimeout(function () {
                moveModal(loginModal);
            }, 900);
        });
    }

    /* ==============================
       비밀번호 변경 후 로그인 모달 자동 오픈
    ============================== */

    const shouldOpenLoginModal = sessionStorage.getItem("openLoginModalAfterPasswordChange");

    if (shouldOpenLoginModal === "true") {
        sessionStorage.removeItem("openLoginModalAfterPasswordChange");

        closeAllModals();
        openModal(loginModal);
    }
});