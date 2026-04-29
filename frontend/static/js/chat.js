document.addEventListener("DOMContentLoaded", function () {
    const chatSidebar = document.getElementById("chatSidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const newChatBtn = document.getElementById("newChatBtn");

    const historyList = document.getElementById("historyList");
    const historyMoreBtn = document.getElementById("historyMoreBtn");
    const historyDeleteBtn = document.getElementById("historyDeleteBtn");

    const recommendList = document.getElementById("recommendList");
    const chatInput = document.getElementById("chatInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const chatMessageArea = document.getElementById("chatMessageArea");
    const chatIntro = document.getElementById("chatIntro");
    const textCount = document.getElementById("textCount");

    const settingsBtn = document.getElementById("settingsBtn");
    const settingsMenu = document.getElementById("settingsMenu");
    const myInfoMenu = document.getElementById("myInfoMenu");
    const openMyInfoBtn = document.getElementById("openMyInfoBtn");
    const backSettingsBtn = document.getElementById("backSettingsBtn");

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

    // 프론트에서만 임시로 관리하는 채팅 저장소
    let chatStore = {};
    let chatOrder = [];
    let activeChatId = null;
    let chatSeq = 0;

    function makeChatId() {
        chatSeq += 1;
        return `chat-${chatSeq}`;
    }

    function makeShortTitle(text) {
        if (!text) return "새 채팅";
        return text.length > 22 ? text.slice(0, 22) + "..." : text;
    }

    function shuffleArray(array) {
        return [...array].sort(function () {
            return Math.random() - 0.5;
        });
    }

    function updateTextCount() {
        if (!chatInput || !textCount) return;

        textCount.textContent = `${chatInput.value.length}/300`;
    }

    function clearChatScreen() {
        if (chatIntro) {
            chatIntro.classList.remove("hidden");
        }

        if (chatMessageArea) {
            chatMessageArea.innerHTML = "";
        }

        if (chatInput) {
            chatInput.value = "";
        }

        updateTextCount();
    }

    function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

function addMessageElement(type, text) {
    if (!chatMessageArea) return;

    const message = document.createElement("div");
    message.className = `chat-message ${type}`;

    const textSpan = document.createElement("span");
    textSpan.className = "chat-message-text";
    textSpan.textContent = text;

    const timeSpan = document.createElement("span");
    timeSpan.className = "chat-message-time";
    timeSpan.textContent = getCurrentTime();

    message.appendChild(textSpan);
    message.appendChild(timeSpan);

    chatMessageArea.appendChild(message);
    chatMessageArea.scrollTop = chatMessageArea.scrollHeight;
}

    function renderMessages(chatId) {
        if (!chatMessageArea) return;

        const chat = chatStore[chatId];

        chatMessageArea.innerHTML = "";

        if (!chat || chat.messages.length === 0) {
            if (chatIntro) {
                chatIntro.classList.remove("hidden");
            }
            return;
        }

        if (chatIntro) {
            chatIntro.classList.add("hidden");
        }

        chat.messages.forEach(function (message) {
            addMessageElement(message.type, message.text);
        });
    }

    function renderHistory() {
        if (!historyList) return;

        const isDeleteMode = historyList.classList.contains("delete-mode");

        historyList.innerHTML = "";

        if (chatOrder.length === 0) {
            const emptyItem = document.createElement("li");
            const emptyButton = document.createElement("button");

            emptyButton.type = "button";
            emptyButton.className = "history-title";
            emptyButton.textContent = "대화 기록이 없습니다.";
            emptyButton.disabled = true;

            emptyItem.appendChild(emptyButton);
            historyList.appendChild(emptyItem);

            return;
        }

        chatOrder.forEach(function (chatId) {
            const chat = chatStore[chatId];

            if (!chat) return;

            const li = document.createElement("li");
            li.dataset.chatId = chatId;

            const titleButton = document.createElement("button");
            titleButton.type = "button";
            titleButton.className = "history-title";
            titleButton.textContent = chat.title;

            if (chatId === activeChatId) {
                titleButton.classList.add("active");
            }

            const checkbox = document.createElement("input");
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
        });

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

        updateTextCount();
    }

    function createNewChat() {
        activeChatId = null;

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

        chatStore[chatId] = {
            title: makeShortTitle(question),
            messages: [
                {
                    type: "user",
                    text: question
                }
            ]
        };

        chatOrder.unshift(chatId);
        activeChatId = chatId;

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

        renderRandomRecommendations();

        if (chatInput) {
            chatInput.value = "";
        }

        updateTextCount();
    }

    function sendCurrentMessage() {
        if (!chatInput) return;

        const message = chatInput.value.trim();

        if (message === "") {
            return;
        }

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
                title: title,
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

    // 1-1 사이드바 열기/닫기
    if (sidebarToggle && chatSidebar) {
        sidebarToggle.addEventListener("click", function () {
            chatSidebar.classList.toggle("collapsed");
        });
    }

    // 닫힌 상태의 + 버튼도 새 채팅으로 연결
    if (newChatBtn) {
        newChatBtn.addEventListener("click", function () {
            createNewChat();
        });
    }

    // 2 대화기록 삭제 모드
    if (historyMoreBtn && historyDeleteBtn && historyList) {
        historyMoreBtn.addEventListener("click", function () {
            historyList.classList.toggle("delete-mode");
            historyDeleteBtn.classList.toggle("hidden");
        });
    }

    if (historyDeleteBtn && historyList) {
        historyDeleteBtn.addEventListener("click", function () {
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
                activeChatId = null;
                clearChatScreen();
            }

            historyList.classList.remove("delete-mode");
            historyDeleteBtn.classList.add("hidden");

            renderHistory();
        });
    }

    // 3 추천 질문 랜덤 생성
    renderRandomRecommendations();

    // 직접 입력
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

    // 4 설정 메뉴
    if (settingsBtn && settingsMenu && myInfoMenu) {
        settingsBtn.addEventListener("click", function (event) {
            event.stopPropagation();

            settingsMenu.classList.toggle("hidden");
            myInfoMenu.classList.add("hidden");
        });
    }

    if (openMyInfoBtn && settingsMenu && myInfoMenu) {
        openMyInfoBtn.addEventListener("click", function () {
            settingsMenu.classList.add("hidden");
            myInfoMenu.classList.remove("hidden");
        });
    }

    if (backSettingsBtn && settingsMenu && myInfoMenu) {
        backSettingsBtn.addEventListener("click", function () {
            myInfoMenu.classList.add("hidden");
            settingsMenu.classList.remove("hidden");
        });
    }

    document.addEventListener("click", function (event) {
        const isSettingsArea =
            event.target.closest("#settingsBtn") ||
            event.target.closest("#settingsMenu") ||
            event.target.closest("#myInfoMenu");

        if (!isSettingsArea) {
            if (settingsMenu) settingsMenu.classList.add("hidden");
            if (myInfoMenu) myInfoMenu.classList.add("hidden");
        }
    });

    seedInitialHistory();
    clearChatScreen();
    updateTextCount();
});