document.addEventListener("DOMContentLoaded", function () {
    const chatSidebar = document.getElementById("chatSidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const newChatBtn = document.getElementById("newChatBtn");

    const historyList = document.getElementById("historyList");
    const historyMoreBtn = document.getElementById("historyMoreBtn");
    const historyDeleteBtn = document.getElementById("historyDeleteBtn");

    const recommendSection = document.getElementById("recommendSection");
    const recommendList = document.getElementById("recommendList");

    const chatInput = document.getElementById("chatInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const chatMessageArea = document.getElementById("chatMessageArea");
    const chatScrollArea = document.getElementById("chatScrollArea");
    const chatIntro = document.getElementById("chatIntro");
    const textCount = document.getElementById("textCount");

    const settingsBtn = document.getElementById("settingsBtn");
    const settingsPanel = document.getElementById("settingsPanel");
    const settingsMenu = document.getElementById("settingsMenu");
    const myInfoMenu = document.getElementById("myInfoMenu");
    const openMyInfoBtn = document.getElementById("openMyInfoBtn");
    const backSettingsBtn = document.getElementById("backSettingsBtn");

    const logoutLink = document.getElementById("logoutLink");
    const passwordChangeLink = document.getElementById("passwordChangeLink");
    const withdrawLink = document.getElementById("withdrawLink");

    const passwordChangeModal = document.getElementById("passwordChangeModal");



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

    function showRecommendSection() {
        if (!recommendSection) return;
        recommendSection.classList.remove("hidden");
    }

    function hideRecommendSection() {
        if (!recommendSection) return;
        recommendSection.classList.add("hidden");
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

        showRecommendSection();
        renderRandomRecommendations();
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

        const scrollTarget = chatScrollArea || chatMessageArea;
        scrollTarget.scrollTop = scrollTarget.scrollHeight;
    }

    function renderMessages(chatId) {
        if (!chatMessageArea) return;

        const chat = chatStore[chatId];

        chatMessageArea.innerHTML = "";

        if (!chat || chat.messages.length === 0) {
            if (chatIntro) {
                chatIntro.classList.remove("hidden");
            }

            showRecommendSection();
            return;
        }

        if (chatIntro) {
            chatIntro.classList.add("hidden");
        }

        hideRecommendSection();

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

        if (chatInput) {
            chatInput.value = "";
        }

        updateTextCount();
    }

    // function sendCurrentMessage() {
    //     if (!chatInput) return;

    //     const message = chatInput.value.trim();

    //     if (message === "") {
    //         return;
    //     }

    //     let chatId = activeChatId;

    //     if (!chatId || !chatStore[chatId]) {
    //         chatId = makeChatId();

    //         chatStore[chatId] = {
    //             title: makeShortTitle(message),
    //             messages: []
    //         };

    //         chatOrder.unshift(chatId);
    //         activeChatId = chatId;
    //     }

    //     chatStore[chatId].messages.push({
    //         type: "user",
    //         text: message
    //     });

    //     if (!chatStore[chatId].title || chatStore[chatId].title === "새 채팅") {
    //         chatStore[chatId].title = makeShortTitle(message);
    //     }

    //     chatInput.value = "";
    //     updateTextCount();

    //     renderHistory();
    //     renderMessages(chatId);

    //     setTimeout(function () {
    //         if (!chatStore[chatId]) return;

    //         chatStore[chatId].messages.push({
    //             type: "bot",
    //             text: "질문을 확인했어요. 실제 답변 연결 전까지는 화면 테스트용 응답입니다."
    //         });

    //         if (activeChatId === chatId) {
    //             renderMessages(chatId);
    //         }
    //     }, 350);
    // }


    async function sendCurrentMessage() {
        if (!chatInput) return;

        const message = chatInput.value.trim();
        if (message === "") return;

        let chatId = activeChatId;

        // 백엔드로 전송
        try {
            const formData = new URLSearchParams();
            formData.append('content', message);
            if (chatId && chatStore[chatId] && chatStore[chatId].backendChatId) {
                formData.append('chat_id', chatStore[chatId].backendChatId);
            }

            const response = await fetch('/chat/api/message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            const data = await response.json();

            if (data.ok) {
                // 새 채팅방이면 로컬 chatStore 생성
                if (!chatId || !chatStore[chatId]) {
                    chatId = makeChatId();
                    chatStore[chatId] = {
                        title: data.chat_title,
                        messages: [],
                        backendChatId: data.chat_id  // 서버 chat_id 저장
                    };
                    chatOrder.unshift(chatId);
                    activeChatId = chatId;
                }

                // 메시지 추가
                chatStore[chatId].messages.push({
                    type: "user",
                    text: data.user_message.content
                });

                chatStore[chatId].messages.push({
                    type: "bot",
                    text: data.assistant_message.content
                });

                chatInput.value = "";
                updateTextCount();

                renderHistory();
                renderMessages(chatId);
            } else {
                alert(data.error || '메시지 전송 실패');
            }
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            alert('메시지 전송 중 오류가 발생했습니다.');
        }
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

    function moveToPage(button, fallbackUrl) {
        if (!button) return;

        const url = button.dataset.url || fallbackUrl;

        if (!url) return;

        window.location.href = url;
    }

    function openPasswordChangeModal() {
        // 설정 패널 닫기
        if (settingsPanel) {
            settingsPanel.classList.add('hidden');
        }
        
        // 비밀번호 변경 모달 열기
        if (passwordChangeModal) {
            passwordChangeModal.classList.remove('hidden');
    }
}

    if (sidebarToggle && chatSidebar) {
        sidebarToggle.addEventListener("click", function () {
            chatSidebar.classList.toggle("collapsed");
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener("click", function () {
            createNewChat();
        });
    }

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

    if (settingsPanel) {
        settingsPanel.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }

    if (settingsMenu) {
        settingsMenu.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }

    if (myInfoMenu) {
        myInfoMenu.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }

    if (logoutLink) {
        logoutLink.addEventListener("click", function (event) {
            event.preventDefault();
            moveToPage(logoutLink, "/logout/");
        });
    }

    if (passwordChangeLink) {
        passwordChangeLink.addEventListener("click", function (event) {
            event.preventDefault();
            openPasswordChangeModal();
        });
    }

    if (withdrawLink) {
        withdrawLink.addEventListener("click", function (event) {
            event.preventDefault();
            moveToPage(withdrawLink, "/withdraw/");
        });
    }

    // if (passwordChangeLink) {
    // passwordChangeLink.addEventListener('click', function() {
    //     console.log('비밀번호 변경 버튼 클릭!');
        
    //     // 설정 패널 닫기
    //     const settingsPanel = document.getElementById('settingsPanel');
    //     if (settingsPanel) {
    //         settingsPanel.classList.add('hidden');
    //     }
        
    //     // 비밀번호 변경 모달 열기
    //     if (passwordChangeModal) {
    //         passwordChangeModal.classList.remove('hidden');
    //     }
    // });

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

    seedInitialHistory();
    clearChatScreen();
    updateTextCount();


    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });
    const currentPasswordToggle = document.getElementById('currentPasswordToggle');
    const currentPasswordDisplay = document.getElementById('currentPasswordDisplay');

    const newPasswordToggle = document.getElementById('newPasswordToggle');
    const newPasswordDisplay = document.getElementById('newPasswordDisplay');

    const newPasswordCheckToggle = document.getElementById('newPasswordCheckToggle');
    const newPasswordCheckDisplay = document.getElementById('newPasswordCheckDisplay');

    // 현재 비밀번호 눈 아이콘
    if (currentPasswordToggle && currentPasswordDisplay) {
        currentPasswordToggle.addEventListener('click', function() {
            if (currentPasswordDisplay.type === 'password') {
                currentPasswordDisplay.type = 'text';
            } else {
                currentPasswordDisplay.type = 'password';
            }
            
            const eyeOff = this.querySelector('.reset-eye-off');
            const eyeOpen = this.querySelector('.reset-eye-open');
            
            if (eyeOff && eyeOpen) {
                eyeOff.classList.toggle('active');
                eyeOpen.classList.toggle('active');
            }
        });
    }

    // 새 비밀번호 눈 아이콘
    if (newPasswordToggle && newPasswordDisplay) {
        newPasswordToggle.addEventListener('click', function() {
            if (newPasswordDisplay.type === 'password') {
                newPasswordDisplay.type = 'text';
            } else {
                newPasswordDisplay.type = 'password';
            }
            
            const eyeOff = this.querySelector('.reset-eye-off');
            const eyeOpen = this.querySelector('.reset-eye-open');
            
            if (eyeOff && eyeOpen) {
                eyeOff.classList.toggle('active');
                eyeOpen.classList.toggle('active');
            }
        });
    }

    // 새 비밀번호 확인 눈 아이콘
    if (newPasswordCheckToggle && newPasswordCheckDisplay) {
        newPasswordCheckToggle.addEventListener('click', function() {
            if (newPasswordCheckDisplay.type === 'password') {
                newPasswordCheckDisplay.type = 'text';
            } else {
                newPasswordCheckDisplay.type = 'password';
            }
            
            const eyeOff = this.querySelector('.reset-eye-off');
            const eyeOpen = this.querySelector('.reset-eye-open');
            
            if (eyeOff && eyeOpen) {
                eyeOff.classList.toggle('active');
                eyeOpen.classList.toggle('active');
            }
        });
    }


    // 비밀번호 변경 모달 - 현재 비밀번호 확인
    const verifyCurrentPasswordBtn = document.getElementById('verifyCurrentPasswordBtn');
    const currentPasswordError = document.getElementById('currentPasswordError');
    const newPasswordSection = document.getElementById('newPasswordSection');

    if (verifyCurrentPasswordBtn) {
        verifyCurrentPasswordBtn.addEventListener('click', function() {
            const currentPassword = document.getElementById('currentPasswordDisplay').value.trim();
            
            if (!currentPassword) {
                if (currentPasswordError) {
                    currentPasswordError.textContent = '× 현재 비밀번호를 입력해주세요.';
                    currentPasswordError.classList.remove('hidden');
                }
                return;
            }
            
            // CSRF 토큰 가져오기
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                             document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
            
            // 백엔드 API 호출
            fetch('/accounts/verify-current-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrftoken
                },
                credentials: 'same-origin',
                body: new URLSearchParams({
                    'current_password': currentPassword
                })
            })
            .then(response => {
                console.log('Response status:', response.status); // 디버깅용
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data); // 디버깅용
                
                if (data.ok) {
                    // 성공
                    if (currentPasswordError) {
                        currentPasswordError.classList.add('hidden');
                    }
                    if (newPasswordSection) {
                        newPasswordSection.style.display = 'block';
                    }
                    verifyCurrentPasswordBtn.style.display = 'none';
                } else {
                    // 실패
                    if (currentPasswordError) {
                        currentPasswordError.textContent = '× 비밀번호가 일치하지 않습니다.';
                        currentPasswordError.classList.remove('hidden');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error); // 디버깅용
                if (currentPasswordError) {
                    currentPasswordError.textContent = '× 오류가 발생했습니다. 다시 시도해주세요.';
                    currentPasswordError.classList.remove('hidden');
                }
            });
        });
    }

    // 비밀번호 변경 모달 - 새 비밀번호 변경
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const newPasswordRuleMessage = document.getElementById('newPasswordRuleMessage');
    const newPasswordMatchError = document.getElementById('newPasswordMatchError');

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            const currentPassword = document.getElementById('currentPasswordDisplay').value.trim();
            const newPassword = document.getElementById('newPasswordDisplay').value.trim();
            const newPasswordCheck = document.getElementById('newPasswordCheckDisplay').value.trim();
            
            // 입력 확인
            if (!newPassword || !newPasswordCheck) {
                if (newPasswordRuleMessage) {
                    newPasswordRuleMessage.textContent = '× 모든 항목을 입력해주세요.';
                    newPasswordRuleMessage.classList.remove('hidden');
                }
                return;
            }
            
            // 비밀번호 규칙 검증 (10-16자, 대소문자+숫자 필수)
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{10,16}$/;
            if (!passwordRegex.test(newPassword)) {
                if (newPasswordRuleMessage) {
                    newPasswordRuleMessage.textContent = '× 10자~16자 / 영문 대소문자, 숫자 필수 포함 / 공백 미포함';
                    newPasswordRuleMessage.classList.remove('hidden');
                }
                return;
            }
            
            // 비밀번호 일치 확인
            if (newPassword !== newPasswordCheck) {
                if (newPasswordMatchError) {
                    newPasswordMatchError.textContent = '× 비밀번호가 일치하지 않습니다.';
                    newPasswordMatchError.classList.remove('hidden');
                }
                return;
            }
            
            // 에러 메시지 숨기기
            if (newPasswordRuleMessage) {
                newPasswordRuleMessage.classList.add('hidden');
            }
            if (newPasswordMatchError) {
                newPasswordMatchError.classList.add('hidden');
            }
            
            // CSRF 토큰 가져오기
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                             document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
            
            // 백엔드 API 호출
            fetch('/accounts/change_password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrftoken
                },
                credentials: 'same-origin',
                body: new URLSearchParams({
                    'current_password': currentPassword,
                    'new_password': newPassword
                })
            })
            .then(response => {
                console.log('비밀번호 변경 응답:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('비밀번호 변경 결과:', data);
                
                if (data.ok) {
                    // 성공: 모달 닫고 알림 표시
                    if (passwordChangeModal) {
                        passwordChangeModal.classList.add('hidden');
                    }
                    
                    alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
                    
                    // 로그인 페이지로 이동
                    window.location.href = '/';
                } else {
                    // 실패: 에러 메시지 표시
                    if (newPasswordRuleMessage) {
                        newPasswordRuleMessage.textContent = '× ' + (data.error || '비밀번호 변경에 실패했습니다.');
                        newPasswordRuleMessage.classList.remove('hidden');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (newPasswordRuleMessage) {
                    newPasswordRuleMessage.textContent = '× 오류가 발생했습니다. 다시 시도해주세요.';
                    newPasswordRuleMessage.classList.remove('hidden');
                }
            });
        });
    }
}); 