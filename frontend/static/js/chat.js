document.addEventListener("DOMContentLoaded", function () {
    /* ==============================
       요소 선택
    ============================== */

    const $ = (id) => document.getElementById(id);

    const chatSidebar = $("chatSidebar");
    const sidebarToggle = $("sidebarToggle");
    const newChatBtn = $("newChatBtn");

    const historyList = $("historyList");
    const historyMoreBtn = $("historyMoreBtn");
    const historyDeleteBtn = $("historyDeleteBtn");

    const recommendSection = $("recommendSection");
    const recommendList = $("recommendList");

    const chatInput = $("chatInput");
    const sendMessageBtn = $("sendMessageBtn");
    const micBtn = $("micBtn");

    const chatMessageArea = $("chatMessageArea");
    const chatScrollArea = $("chatScrollArea");
    const chatIntro = $("chatIntro");
    const textCount = $("textCount");

    const voiceRecordModal = $("voiceRecordModal");
    const voiceRecordTimer = $("voiceRecordTimer");

    const currentChatTitle = $("currentChatTitle");
    const chatTitleBar = currentChatTitle ? currentChatTitle.closest(".chat-title-bar") : null;

    const settingsBtn = $("settingsBtn");
    const settingsPanel = $("settingsPanel");
    const settingsMenu = $("settingsMenu");
    const myInfoMenu = $("myInfoMenu");
    const openMyInfoBtn = $("openMyInfoBtn");
    const backSettingsBtn = $("backSettingsBtn");

    const logoutLink = $("logoutLink");
    const passwordChangeLink = $("passwordChangeLink");
    const withdrawLink = $("withdrawLink");

    const passwordChangeModal = $("passwordChangeModal");
    const passwordChangeCloseBtn = $("passwordChangeCloseBtn");
    const passwordChangeSubmitBtn = $("passwordChangeSubmitBtn");

    const currentPasswordInput = $("currentPasswordInput");
    const currentPasswordCheckBtn = $("currentPasswordCheckBtn");
    const currentPasswordRow = $("currentPasswordRow");
    const currentPasswordError = $("currentPasswordError");
    const currentPasswordSuccessIcon = $("currentPasswordSuccessIcon");

    const changeNewPasswordInput = $("changeNewPasswordInput");
    const changeNewPasswordCheckInput = $("changeNewPasswordCheckInput");
    const changeNewPasswordToggle = $("changeNewPasswordToggle");
    const changeNewPasswordCheckToggle = $("changeNewPasswordCheckToggle");
    const changeNewPasswordRow = $("changeNewPasswordRow");
    const changeNewPasswordCheckRow = $("changeNewPasswordCheckRow");
    const changePasswordRuleMessage = $("changePasswordRuleMessage");
    const changePasswordMatchError = $("changePasswordMatchError");

    /* ==============================
       기본 데이터 / 상태
    ============================== */

    const recommendQuestions = [
        "2026년에 달라진 규정이 뭔가요?",
        "지금 시즌 1위 드라이버가 누구야?",
        "더블 웨이브 옐로우가 나온 구간에서 예선 랩을 계속 밀어붙이면 어떻게 되나요?",
        "개최 국가에 전쟁이나 유사한 상황이 발생하면 경기가 취소되나요? 비슷한 사례가 있나요?",
        "F1 타이어 색깔마다 무슨 차이가 있어?",
        "세이프티카와 버추얼 세이프티카 차이가 뭐야?",
        "피트스톱은 왜 하는 거야?",
        "스프린트 레이스가 뭐야?",
        "폴 포지션은 무슨 뜻이야?",
        "각 플래그 별 의미가 뭐야?",
        "파워유닛 교체 페널티는 어떻게 적용돼?"
    ];

    const temporaryCurrentPassword = "test1234!";
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    let chatStore = {};
    let chatOrder = [];
    let activeChatId = null;
    let chatSeq = 0;

    let isCurrentPasswordVerified = false;
    let isNewPasswordVisible = false;
    let isNewPasswordCheckVisible = false;

    let recognition = null;
    let isVoiceListening = false;
    let voiceBaseText = "";
    let originalInputPlaceholder = "";
    let voiceTimerId = null;
    let voiceElapsedSeconds = 0;

    /* ==============================
       공통 유틸
    ============================== */

    function makeChatId() {
        chatSeq += 1;
        return `chat-${chatSeq}`;
    }

    function makeShortTitle(text) {
        if (!text) return "새 채팅";

        const trimmedText = text.trim();
        return trimmedText.length > 24 ? `${trimmedText.slice(0, 24)}...` : trimmedText;
    }

    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");

        return `${hours}:${minutes}`;
    }

    function shuffleArray(array) {
        return [...array].sort(function () {
            return Math.random() - 0.5;
        });
    }

    function moveToPage(button, fallbackUrl) {
        if (!button) return;

        const url = button.dataset.url || fallbackUrl;

        if (url) {
            window.location.href = url;
        }
    }

    function showToast(id, className, message, duration = 1300) {
        let toast = document.getElementById(id);

        if (!toast) {
            toast = document.createElement("div");
            toast.id = id;
            toast.className = className;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(function () {
            toast.classList.remove("show");
        }, duration);
    }

    /* ==============================
       채팅 제목 / 추천 질문
    ============================== */

    function showCurrentChatTitle(title) {
        if (!currentChatTitle || !chatTitleBar) return;

        currentChatTitle.textContent = title || "새 채팅";
        chatTitleBar.classList.remove("hidden");
    }

    function hideCurrentChatTitle() {
        if (!currentChatTitle || !chatTitleBar) return;

        currentChatTitle.textContent = "";
        chatTitleBar.classList.add("hidden");
    }

    function showRecommendSection() {
        if (recommendSection) {
            recommendSection.classList.remove("hidden");
        }
    }

    function hideRecommendSection() {
        if (recommendSection) {
            recommendSection.classList.add("hidden");
        }
    }

    function renderRandomRecommendations() {
        if (!recommendList) return;

        const selectedQuestions = shuffleArray(recommendQuestions).slice(0, 3);

        recommendList.innerHTML = "";

        selectedQuestions.forEach(function (question) {
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = question;

            button.addEventListener("click", function () {
                createChatFromQuestion(question);
            });

            recommendList.appendChild(button);
        });
    }

    function updateTextCount() {
        if (!chatInput || !textCount) return;

        textCount.textContent = `${chatInput.value.length}/300`;
    }

    /* ==============================
       채팅 메시지
    ============================== */

    function scrollToBottom() {
        const scrollTarget = chatScrollArea || chatMessageArea;

        if (!scrollTarget) return;

        scrollTarget.scrollTop = scrollTarget.scrollHeight;
    }

    function addMessageElement(type, text) {
        if (!chatMessageArea) return;

        const message = document.createElement("div");
        const textSpan = document.createElement("span");
        const timeSpan = document.createElement("span");

        message.className = `chat-message ${type}`;

        textSpan.className = "chat-message-text";
        textSpan.textContent = text;

        timeSpan.className = "chat-message-time";
        timeSpan.textContent = getCurrentTime();

        message.appendChild(textSpan);
        message.appendChild(timeSpan);

        chatMessageArea.appendChild(message);
        scrollToBottom();
    }

    function renderMessages(chatId) {
        if (!chatMessageArea) return;

        const chat = chatStore[chatId];

        chatMessageArea.innerHTML = "";

        if (!chat || chat.messages.length === 0) {
            if (chatIntro) {
                chatIntro.classList.remove("hidden");
            }

            hideCurrentChatTitle();
            showRecommendSection();
            return;
        }

        if (chatIntro) {
            chatIntro.classList.add("hidden");
        }

        showCurrentChatTitle(chat.title);
        hideRecommendSection();

        chat.messages.forEach(function (message) {
            addMessageElement(message.type, message.text);
        });

        scrollToBottom();
    }

    function clearChatScreen() {
        activeChatId = null;

        if (chatIntro) {
            chatIntro.classList.remove("hidden");
        }

        if (chatMessageArea) {
            chatMessageArea.innerHTML = "";
        }

        if (chatInput) {
            chatInput.value = "";
        }

        hideCurrentChatTitle();
        showRecommendSection();
        renderRandomRecommendations();
        updateTextCount();
        renderHistory();
    }

    function createNewChat() {
        clearChatScreen();

        if (historyList) {
            historyList.classList.remove("delete-mode");
        }

        if (historyDeleteBtn) {
            historyDeleteBtn.classList.add("hidden");
        }

        if (chatInput) {
            chatInput.focus();
        }
    }

    function createChatFromQuestion(question) {
        const chatId = makeChatId();
        const title = makeShortTitle(question);

        chatStore[chatId] = {
            title,
            messages: [
                {
                    type: "user",
                    text: question
                }
            ]
        };

        chatOrder.unshift(chatId);
        activeChatId = chatId;

        showCurrentChatTitle(title);
        renderHistory();
        renderMessages(chatId);

        setTimeout(function () {
            if (!chatStore[chatId]) return;

            chatStore[chatId].messages.push({
                type: "bot",
                text: "질문을 확인했어요. 현재는 화면 테스트용 응답입니다.\n\n실제 답변은 추후 백엔드 연결 후 F1 규정과 데이터에 기반해 제공될 예정입니다."
            });

            if (activeChatId === chatId) {
                renderMessages(chatId);
            }
        }, 350);

        if (chatInput) {
            chatInput.value = "";
        }

        updateTextCount();
    }

    function sendCurrentMessage() {
        if (!chatInput) return;

        const message = chatInput.value.trim();

        if (!message) return;

        let chatId = activeChatId;

        if (!chatId || !chatStore[chatId]) {
            chatId = makeChatId();

            chatStore[chatId] = {
                title: makeShortTitle(message),
                messages: []
            };

            chatOrder.unshift(chatId);
            activeChatId = chatId;
        }

        chatStore[chatId].messages.push({
            type: "user",
            text: message
        });

        if (!chatStore[chatId].title || chatStore[chatId].title === "새 채팅") {
            chatStore[chatId].title = makeShortTitle(message);
        }

        showCurrentChatTitle(chatStore[chatId].title);

        chatInput.value = "";
        updateTextCount();

        renderHistory();
        renderMessages(chatId);

        setTimeout(function () {
            if (!chatStore[chatId]) return;

            chatStore[chatId].messages.push({
                type: "bot",
                text: "질문을 확인했어요. 실제 답변 연결 전까지는 화면 테스트용 응답입니다."
            });

            if (activeChatId === chatId) {
                renderMessages(chatId);
            }
        }, 350);
    }

    /* ==============================
       히스토리
    ============================== */

    function seedInitialHistory() {
        if (!historyList) return;

        const initialTitles = [];

        historyList.querySelectorAll(".history-title").forEach(function (button) {
            const title = button.textContent.trim();

            if (title && title !== "대화 기록이 없습니다.") {
                initialTitles.push(title);
            }
        });

        initialTitles.forEach(function (title) {
            const chatId = makeChatId();

            chatStore[chatId] = {
                title,
                messages: [
                    {
                        type: "user",
                        text: title
                    },
                    {
                        type: "bot",
                        text: "이전 대화 예시입니다. 실제 저장 대화는 백엔드 연결 후 불러올 수 있습니다."
                    }
                ]
            };

            chatOrder.push(chatId);
        });

        renderHistory();
    }

    function renderEmptyHistory() {
        if (!historyList) return;

        const emptyItem = document.createElement("li");
        const emptyButton = document.createElement("button");

        emptyButton.type = "button";
        emptyButton.className = "history-title";
        emptyButton.textContent = "대화 기록이 없습니다.";
        emptyButton.disabled = true;

        emptyItem.appendChild(emptyButton);
        historyList.appendChild(emptyItem);
    }

    function renderHistoryItem(chatId) {
        const chat = chatStore[chatId];

        if (!chat || !historyList) return;

        const li = document.createElement("li");
        const titleButton = document.createElement("button");
        const checkbox = document.createElement("input");

        li.dataset.chatId = chatId;

        titleButton.type = "button";
        titleButton.className = "history-title";
        titleButton.textContent = chat.title;

        if (chatId === activeChatId) {
            titleButton.classList.add("active");
        }

        checkbox.type = "checkbox";
        checkbox.className = "history-check";

        titleButton.addEventListener("click", function () {
            if (historyList.classList.contains("delete-mode")) {
                checkbox.checked = !checkbox.checked;
                return;
            }

            openChat(chatId);
        });

        li.appendChild(titleButton);
        li.appendChild(checkbox);
        historyList.appendChild(li);
    }

    function renderHistory() {
        if (!historyList) return;

        const isDeleteMode = historyList.classList.contains("delete-mode");

        historyList.innerHTML = "";

        if (chatOrder.length === 0) {
            renderEmptyHistory();
            return;
        }

        chatOrder.forEach(renderHistoryItem);

        if (isDeleteMode) {
            historyList.classList.add("delete-mode");
        }
    }

    function openChat(chatId) {
        if (!chatStore[chatId]) return;

        activeChatId = chatId;

        renderHistory();
        renderMessages(chatId);

        if (chatInput) {
            chatInput.value = "";
        }

        showCurrentChatTitle(chatStore[chatId].title);
        updateTextCount();
    }

    function toggleHistoryDeleteMode() {
        if (!historyList || !historyDeleteBtn) return;

        const isDeleteMode = historyList.classList.toggle("delete-mode");

        historyDeleteBtn.classList.toggle("hidden", !isDeleteMode);
    }

    function deleteCheckedHistoryItems() {
        if (!historyList || !historyDeleteBtn) return;

        const checkedItems = historyList.querySelectorAll(".history-check:checked");
        const deletedChatIds = [];

        checkedItems.forEach(function (checkbox) {
            const item = checkbox.closest("li");

            if (!item) return;

            const chatId = item.dataset.chatId;

            if (chatId) {
                deletedChatIds.push(chatId);
                delete chatStore[chatId];
            }
        });

        chatOrder = chatOrder.filter(function (chatId) {
            return !deletedChatIds.includes(chatId);
        });

        if (deletedChatIds.includes(activeChatId)) {
            clearChatScreen();
        }

        historyList.classList.remove("delete-mode");
        historyDeleteBtn.classList.add("hidden");

        renderHistory();
    }

    /* ==============================
       음성 입력
    ============================== */

    function showVoiceToast(message) {
        showToast("voiceToast", "voice-toast", message);
    }

    function updateVoiceRecordTimer() {
        if (!voiceRecordTimer) return;

        voiceRecordTimer.textContent = `${voiceElapsedSeconds}s`;
    }

    function showVoiceRecordModal() {
        if (!voiceRecordModal) return;

        clearInterval(voiceTimerId);

        voiceElapsedSeconds = 0;
        updateVoiceRecordTimer();

        voiceRecordModal.classList.remove("hidden");

        voiceTimerId = setInterval(function () {
            voiceElapsedSeconds += 1;
            updateVoiceRecordTimer();
        }, 1000);
    }

    function hideVoiceRecordModal() {
        if (!voiceRecordModal) return;

        voiceRecordModal.classList.add("hidden");

        clearInterval(voiceTimerId);
        voiceTimerId = null;

        voiceElapsedSeconds = 0;
        updateVoiceRecordTimer();
    }

    function setMicListeningState(isListening) {
        isVoiceListening = isListening;

        if (!micBtn || !chatInput) return;

        if (isListening) {
            originalInputPlaceholder = chatInput.placeholder;
            chatInput.placeholder = "음성을 듣는 중입니다...";

            micBtn.classList.add("listening");
            micBtn.setAttribute("aria-label", "음성 입력 중지");

            showVoiceRecordModal();
            return;
        }

        chatInput.placeholder = originalInputPlaceholder || "질문을 입력해 주세요.";

        micBtn.classList.remove("listening");
        micBtn.setAttribute("aria-label", "음성 입력");

        hideVoiceRecordModal();
    }

    function initSpeechRecognition() {
        if (!SpeechRecognition) return null;

        const speechRecognition = new SpeechRecognition();

        speechRecognition.lang = "ko-KR";
        speechRecognition.continuous = false;
        speechRecognition.interimResults = true;
        speechRecognition.maxAlternatives = 1;

        speechRecognition.onstart = function () {
            setMicListeningState(true);
        };

        speechRecognition.onresult = function (event) {
            let transcript = "";

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                transcript += event.results[i][0].transcript;
            }

            const nextText = voiceBaseText
                ? `${voiceBaseText} ${transcript}`.trim()
                : transcript.trim();

            if (chatInput) {
                chatInput.value = nextText.slice(0, 300);
                updateTextCount();
            }
        };

        speechRecognition.onerror = function (event) {
            setMicListeningState(false);

            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                showVoiceToast("마이크 권한을 허용해주세요.");
                return;
            }

            if (event.error === "no-speech") {
                showVoiceToast("음성이 감지되지 않았습니다.");
                return;
            }

            showVoiceToast("음성 입력을 다시 시도해주세요.");
        };

        speechRecognition.onend = function () {
            setMicListeningState(false);
        };

        return speechRecognition;
    }

    function toggleVoiceInput() {
        if (!chatInput) return;

        if (!SpeechRecognition) {
            showVoiceToast("이 브라우저는 음성 입력을 지원하지 않습니다.");
            return;
        }

        if (!recognition) {
            recognition = initSpeechRecognition();
        }

        if (!recognition) {
            showVoiceToast("음성 입력을 사용할 수 없습니다.");
            return;
        }

        if (isVoiceListening) {
            recognition.stop();
            setMicListeningState(false);
            return;
        }

        voiceBaseText = chatInput.value.trim();

        try {
            recognition.start();
        } catch (error) {
            showVoiceToast("음성 입력을 다시 시도해주세요.");
        }
    }

    /* ==============================
       설정 메뉴
    ============================== */

    function openSettingsMenu() {
        if (settingsPanel) {
            settingsPanel.classList.remove("hidden");

            if (settingsMenu) {
                settingsMenu.classList.remove("hidden");
            }

            return;
        }

        if (settingsMenu) {
            settingsMenu.classList.remove("hidden");
        }
    }

    function closeSettingsMenu() {
        if (settingsPanel) {
            settingsPanel.classList.add("hidden");
        } else if (settingsMenu) {
            settingsMenu.classList.add("hidden");
        }

        if (myInfoMenu) {
            myInfoMenu.classList.add("hidden");
        }
    }

    function toggleSettingsMenu() {
        if (settingsPanel) {
            settingsPanel.classList.toggle("hidden");

            if (!settingsPanel.classList.contains("hidden")) {
                if (settingsMenu) {
                    settingsMenu.classList.remove("hidden");
                }

                if (myInfoMenu) {
                    myInfoMenu.classList.add("hidden");
                }
            }

            return;
        }

        if (settingsMenu) {
            settingsMenu.classList.toggle("hidden");

            if (!settingsMenu.classList.contains("hidden") && myInfoMenu) {
                myInfoMenu.classList.add("hidden");
            }
        }
    }

    /* ==============================
       비밀번호 변경
    ============================== */

    function validatePasswordRule(password) {
        const hasLength = password.length >= 10 && password.length <= 16;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasNoSpace = !/\s/.test(password);

        return hasLength && hasUpper && hasLower && hasNumber && hasNoSpace;
    }

    function resetPasswordIcons(toggleButton, isVisible) {
        if (!toggleButton) return;

        const eyeOff = toggleButton.querySelector(".eye-off");
        const eyeOpen = toggleButton.querySelector(".eye-open");
        const checkIcon = toggleButton.querySelector(".password-match-check");

        if (checkIcon) {
            checkIcon.classList.remove("active");
        }

        if (isVisible) {
            if (eyeOff) eyeOff.classList.remove("active");
            if (eyeOpen) eyeOpen.classList.add("active");
            return;
        }

        if (eyeOpen) eyeOpen.classList.remove("active");
        if (eyeOff) eyeOff.classList.add("active");
    }

    function showPasswordCheckIcons() {
        [changeNewPasswordToggle, changeNewPasswordCheckToggle].forEach(function (toggleButton) {
            if (!toggleButton) return;

            const eyeOff = toggleButton.querySelector(".eye-off");
            const eyeOpen = toggleButton.querySelector(".eye-open");
            const checkIcon = toggleButton.querySelector(".password-match-check");

            if (eyeOff) eyeOff.classList.remove("active");
            if (eyeOpen) eyeOpen.classList.remove("active");
            if (checkIcon) checkIcon.classList.add("active");
        });
    }

    function updatePasswordChangeState() {
        const newPassword = changeNewPasswordInput ? changeNewPasswordInput.value.trim() : "";
        const newPasswordCheck = changeNewPasswordCheckInput ? changeNewPasswordCheckInput.value.trim() : "";

        const isRuleValid = validatePasswordRule(newPassword);
        const isMatched =
            newPassword !== "" &&
            newPasswordCheck !== "" &&
            newPassword === newPasswordCheck &&
            isRuleValid;

        if (changeNewPasswordRow) {
            changeNewPasswordRow.classList.remove("error");
        }

        if (changeNewPasswordCheckRow) {
            changeNewPasswordCheckRow.classList.remove("error");
        }

        if (changePasswordMatchError) {
            changePasswordMatchError.classList.add("hidden");
        }

        if (newPassword !== "" && !isRuleValid) {
            if (changeNewPasswordRow) {
                changeNewPasswordRow.classList.add("error");
            }

            if (changePasswordRuleMessage) {
                changePasswordRuleMessage.classList.remove("hidden");
            }
        }

        if (newPasswordCheck !== "" && newPassword !== newPasswordCheck) {
            if (changeNewPasswordCheckRow) {
                changeNewPasswordCheckRow.classList.add("error");
            }

            if (changePasswordMatchError) {
                changePasswordMatchError.classList.remove("hidden");
            }
        }

        if (isMatched) {
            showPasswordCheckIcons();
            return;
        }

        resetPasswordIcons(changeNewPasswordToggle, isNewPasswordVisible);
        resetPasswordIcons(changeNewPasswordCheckToggle, isNewPasswordCheckVisible);
    }

    function resetCurrentPasswordCheckState() {
        isCurrentPasswordVerified = false;

        if (currentPasswordRow) {
            currentPasswordRow.classList.remove("success", "error");
        }

        if (currentPasswordError) {
            currentPasswordError.classList.add("hidden");
        }

        if (currentPasswordCheckBtn) {
            currentPasswordCheckBtn.classList.remove("hidden");
        }

        if (currentPasswordSuccessIcon) {
            currentPasswordSuccessIcon.classList.add("hidden");
            currentPasswordSuccessIcon.classList.remove("active");
        }
    }

    function verifyCurrentPassword() {
        const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : "";

        if (currentPassword === temporaryCurrentPassword) {
            isCurrentPasswordVerified = true;

            if (currentPasswordRow) {
                currentPasswordRow.classList.remove("error");
                currentPasswordRow.classList.add("success");
            }

            if (currentPasswordError) {
                currentPasswordError.classList.add("hidden");
            }

            if (currentPasswordCheckBtn) {
                currentPasswordCheckBtn.classList.add("hidden");
            }

            if (currentPasswordSuccessIcon) {
                currentPasswordSuccessIcon.classList.remove("hidden");
                currentPasswordSuccessIcon.classList.add("active");
            }

            return;
        }

        isCurrentPasswordVerified = false;

        if (currentPasswordRow) {
            currentPasswordRow.classList.remove("success");
            currentPasswordRow.classList.add("error");
        }

        if (currentPasswordError) {
            currentPasswordError.textContent = "× 비밀번호가 일치하지 않습니다.";
            currentPasswordError.classList.remove("hidden");
        }

        if (currentPasswordCheckBtn) {
            currentPasswordCheckBtn.classList.remove("hidden");
        }

        if (currentPasswordSuccessIcon) {
            currentPasswordSuccessIcon.classList.add("hidden");
            currentPasswordSuccessIcon.classList.remove("active");
        }
    }

    function resetPasswordChangeModal() {
        isCurrentPasswordVerified = false;
        isNewPasswordVisible = false;
        isNewPasswordCheckVisible = false;

        if (currentPasswordInput) {
            currentPasswordInput.value = "";
            currentPasswordInput.type = "password";
        }

        if (changeNewPasswordInput) {
            changeNewPasswordInput.value = "";
            changeNewPasswordInput.type = "password";
        }

        if (changeNewPasswordCheckInput) {
            changeNewPasswordCheckInput.value = "";
            changeNewPasswordCheckInput.type = "password";
        }

        resetCurrentPasswordCheckState();
        resetPasswordIcons(changeNewPasswordToggle, false);
        resetPasswordIcons(changeNewPasswordCheckToggle, false);

        if (changeNewPasswordRow) {
            changeNewPasswordRow.classList.remove("error");
        }

        if (changeNewPasswordCheckRow) {
            changeNewPasswordCheckRow.classList.remove("error");
        }

        if (changePasswordMatchError) {
            changePasswordMatchError.classList.add("hidden");
        }

        if (changePasswordRuleMessage) {
            changePasswordRuleMessage.classList.remove("hidden");
        }
    }

    function openPasswordChangeModal() {
        if (!passwordChangeModal) return;

        resetPasswordChangeModal();
        passwordChangeModal.classList.remove("hidden");
        closeSettingsMenu();

        setTimeout(function () {
            if (currentPasswordInput) {
                currentPasswordInput.focus();
            }
        }, 0);
    }

    function closePasswordChangeModal() {
        if (!passwordChangeModal) return;

        passwordChangeModal.classList.add("hidden");
        resetPasswordChangeModal();
    }

    function showPasswordChangeCompleteToast() {
        showToast(
            "passwordChangeCompleteToast",
            "password-change-complete-toast",
            "비밀번호가 변경되었습니다."
        );
    }

    function togglePasswordVisibility(input, toggleButton, visibleStateName) {
        if (!input || !toggleButton) return;

        const checkIcon = toggleButton.querySelector(".password-match-check");

        if (checkIcon && checkIcon.classList.contains("active")) {
            return;
        }

        if (visibleStateName === "new") {
            isNewPasswordVisible = !isNewPasswordVisible;
            input.type = isNewPasswordVisible ? "text" : "password";
            resetPasswordIcons(toggleButton, isNewPasswordVisible);
            return;
        }

        isNewPasswordCheckVisible = !isNewPasswordCheckVisible;
        input.type = isNewPasswordCheckVisible ? "text" : "password";
        resetPasswordIcons(toggleButton, isNewPasswordCheckVisible);
    }

    function submitPasswordChange() {
        const newPassword = changeNewPasswordInput ? changeNewPasswordInput.value.trim() : "";
        const newPasswordCheck = changeNewPasswordCheckInput ? changeNewPasswordCheckInput.value.trim() : "";

        if (!isCurrentPasswordVerified) {
            verifyCurrentPassword();
            return;
        }

        if (!validatePasswordRule(newPassword)) {
            if (changeNewPasswordRow) {
                changeNewPasswordRow.classList.add("error");
            }

            if (changePasswordRuleMessage) {
                changePasswordRuleMessage.classList.remove("hidden");
            }

            updatePasswordChangeState();
            return;
        }

        if (newPassword !== newPasswordCheck) {
            if (changeNewPasswordCheckRow) {
                changeNewPasswordCheckRow.classList.add("error");
            }

            if (changePasswordMatchError) {
                changePasswordMatchError.classList.remove("hidden");
            }

            updatePasswordChangeState();
            return;
        }

        showPasswordChangeCompleteToast();
        closePasswordChangeModal();

        sessionStorage.setItem("openLoginModalAfterPasswordChange", "true");

        setTimeout(function () {
            const logoutUrl = logoutLink && logoutLink.dataset.url
                ? logoutLink.dataset.url
                : "/logout/";

            window.location.href = logoutUrl;
        }, 900);
    }

    /* ==============================
       이벤트 연결
    ============================== */

    if (sidebarToggle && chatSidebar) {
        sidebarToggle.addEventListener("click", function () {
            chatSidebar.classList.toggle("collapsed");
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener("click", createNewChat);
    }

    if (historyMoreBtn) {
        historyMoreBtn.addEventListener("click", toggleHistoryDeleteMode);
    }

    if (historyDeleteBtn) {
        historyDeleteBtn.addEventListener("click", deleteCheckedHistoryItems);
    }

    if (chatInput) {
        chatInput.addEventListener("input", updateTextCount);

        chatInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                sendCurrentMessage();
            }
        });
    }

    if (sendMessageBtn) {
        sendMessageBtn.addEventListener("click", sendCurrentMessage);
    }

    if (micBtn) {
        micBtn.addEventListener("click", function (event) {
            event.preventDefault();
            toggleVoiceInput();
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleSettingsMenu();
        });
    }

    if (openMyInfoBtn && myInfoMenu) {
        openMyInfoBtn.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            openSettingsMenu();
            myInfoMenu.classList.toggle("hidden");
        });
    }

    if (backSettingsBtn && myInfoMenu) {
        backSettingsBtn.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            openSettingsMenu();
            myInfoMenu.classList.add("hidden");
        });
    }

    [settingsPanel, settingsMenu, myInfoMenu].forEach(function (menu) {
        if (!menu) return;

        menu.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    });

    if (logoutLink) {
        logoutLink.addEventListener("click", function (event) {
            event.preventDefault();
            moveToPage(logoutLink, "/logout/");
        });
    }

    if (passwordChangeLink) {
        passwordChangeLink.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            openPasswordChangeModal();
        });
    }

    if (withdrawLink) {
        withdrawLink.addEventListener("click", function (event) {
            event.preventDefault();
            moveToPage(withdrawLink, "/withdraw/");
        });
    }

    if (currentPasswordCheckBtn) {
        currentPasswordCheckBtn.addEventListener("click", verifyCurrentPassword);
    }

    if (currentPasswordInput) {
        currentPasswordInput.addEventListener("input", resetCurrentPasswordCheckState);

        currentPasswordInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                verifyCurrentPassword();
            }
        });
    }

    if (changeNewPasswordInput) {
        changeNewPasswordInput.addEventListener("input", updatePasswordChangeState);
    }

    if (changeNewPasswordCheckInput) {
        changeNewPasswordCheckInput.addEventListener("input", updatePasswordChangeState);
    }

    if (changeNewPasswordToggle) {
        changeNewPasswordToggle.addEventListener("click", function () {
            togglePasswordVisibility(changeNewPasswordInput, changeNewPasswordToggle, "new");
        });
    }

    if (changeNewPasswordCheckToggle) {
        changeNewPasswordCheckToggle.addEventListener("click", function () {
            togglePasswordVisibility(changeNewPasswordCheckInput, changeNewPasswordCheckToggle, "check");
        });
    }

    if (passwordChangeCloseBtn) {
        passwordChangeCloseBtn.addEventListener("click", closePasswordChangeModal);
    }

    if (passwordChangeModal) {
        passwordChangeModal.addEventListener("click", function (event) {
            if (event.target === passwordChangeModal) {
                closePasswordChangeModal();
            }
        });
    }

    if (passwordChangeSubmitBtn) {
        passwordChangeSubmitBtn.addEventListener("click", submitPasswordChange);
    }

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;

        closePasswordChangeModal();

        if (isVoiceListening && recognition) {
            recognition.stop();
        }
    });

    document.addEventListener("click", function (event) {
        const isSettingsArea =
            event.target.closest("#settingsBtn") ||
            event.target.closest("#settingsPanel") ||
            event.target.closest("#settingsMenu") ||
            event.target.closest("#myInfoMenu") ||
            event.target.closest("#openMyInfoBtn") ||
            event.target.closest("#backSettingsBtn");

        if (!isSettingsArea) {
            closeSettingsMenu();
        }
    });

    /* ==============================
       초기 실행
    ============================== */

    seedInitialHistory();
    clearChatScreen();
    updateTextCount();
});