document.addEventListener("DOMContentLoaded", function () {
    const $ = (id) => document.getElementById(id);

    const withdrawForm = $("withdrawForm");
    const withdrawPassword = $("withdrawPassword");
    const withdrawPasswordRow = $("withdrawPasswordRow");
    const withdrawPasswordError = $("withdrawPasswordError");
    const withdrawPasswordToggle = $("withdrawPasswordToggle");

    const TEST_CURRENT_PASSWORD = "test1234!";

    function showElement(element) {
        if (element) {
            element.classList.remove("hidden");
        }
    }

    function hideElement(element) {
        if (element) {
            element.classList.add("hidden");
        }
    }

    function setPasswordError(isError) {
        if (withdrawPasswordRow) {
            withdrawPasswordRow.classList.toggle("error", isError);
        }

        if (isError) {
            showElement(withdrawPasswordError);
            return;
        }

        hideElement(withdrawPasswordError);
    }

    function setEyeIconState(isVisible) {
        if (!withdrawPasswordToggle) return;

        const eyeOff = withdrawPasswordToggle.querySelector(".eye-off");
        const eyeOpen = withdrawPasswordToggle.querySelector(".eye-open");

        if (eyeOff) {
            eyeOff.classList.toggle("active", !isVisible);
        }

        if (eyeOpen) {
            eyeOpen.classList.toggle("active", isVisible);
        }
    }

    function togglePasswordVisibility() {
        if (!withdrawPassword) return;

        const isVisible = withdrawPassword.type === "password";

        withdrawPassword.type = isVisible ? "text" : "password";
        setEyeIconState(isVisible);
    }

    function submitWithdrawPassword(event) {
        event.preventDefault();

        const password = withdrawPassword ? withdrawPassword.value.trim() : "";

        if (password !== TEST_CURRENT_PASSWORD) {
            setPasswordError(true);
            return;
        }

        setPasswordError(false);
        window.location.href = "/withdraw/confirm/";
    }

    if (withdrawPassword) {
        withdrawPassword.addEventListener("input", function () {
            setPasswordError(false);
        });
    }

    if (withdrawPasswordToggle) {
        withdrawPasswordToggle.addEventListener("click", togglePasswordVisibility);
    }

    if (withdrawForm) {
        withdrawForm.addEventListener("submit", submitWithdrawPassword);
    }
});