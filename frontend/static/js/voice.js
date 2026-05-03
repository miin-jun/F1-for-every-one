const micBtn = document.querySelector('.mic-btn');
const voiceMicCenter = document.querySelector('.voice-mic-center');
const voiceModal = document.getElementById('voiceModal');
const voiceTimer = document.getElementById('voiceTimer');
const voiceError = document.getElementById('voiceError');
const voiceBackBtn = document.getElementById('voiceBackBtn');
const chatInputArea = document.querySelector('.chat-input-area');

let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let timerInterval = null;
let isVoiceMode = false;
let currentStream = null;
let silenceTimeout = null; 
let audioContext = null; 
let analyser = null;
let silenceDetectionInterval = null;
let currentAudio = null; 
let shouldProcessSTT = true;  // STT 처리 여부 플래그
let hasSpoken = false;  // 한 번이라도 말했는지 플래그 

function stopRecordingAndCleanup() {
    const circleAnimation = document.querySelector('.voice-circle-animation');
    if (circleAnimation) {
        circleAnimation.classList.remove('recording');
    }

    shouldProcessSTT = false;

    if (currentAudio) {
        // currentAudio.pause();
        // currentAudio.currentTime = 0;
        // currentAudio = null;
        try {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio.src = '';
            currentAudio.load();
        } catch (e) {
            console.log('Audio cleanup error:', e);
        }
        currentAudio = null;
    }

    if (silenceTimeout) {
        clearTimeout(silenceTimeout);
        silenceTimeout = null;
    }
    
    if (silenceDetectionInterval) {
        clearInterval(silenceDetectionInterval);
        silenceDetectionInterval = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
        analyser = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }

    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    resetTimer();
    hideError();

    audioChunks = [];
    isVoiceMode = false;
}

window.stopVoiceRecording = stopRecordingAndCleanup;

if (voiceBackBtn) {
    voiceBackBtn.addEventListener('click', function () {
        stopRecordingAndCleanup();
        closeVoiceModal();
    });
}

// 아래 입력창 마이크 버튼 - 항상 음성 모드 시작
if (micBtn) {
    micBtn.addEventListener('click', function() {
        if (!voiceModal.classList.contains('hidden')) {
            return;
        }
        openVoiceModal();
    });
}

// 가운데 원형 마이크 버튼
if (voiceMicCenter) {
    voiceMicCenter.addEventListener('click', function() {
        // 녹음 중 -> 중지하고 STT 처리
        if (mediaRecorder && mediaRecorder.state === 'recording') {

            const circleAnimation = document.querySelector('.voice-circle-animation');
            if (circleAnimation) {
                circleAnimation.classList.remove('recording');
            }
            
            // ⭐ 타이머 즉시 정지
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
            // ⭐ "처리 중" 표시
            // if (voiceTimer) {
            //     voiceTimer.textContent = '처리 중...';
            // }

            stopRecordingAndSend();
        } else {
            // 재시작
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
                currentStream = null;
            }
            if (audioContext) {
                audioContext.close();
                audioContext = null;
                analyser = null;
            }
            if (silenceDetectionInterval) {
                clearInterval(silenceDetectionInterval);
                silenceDetectionInterval = null;
            }

            hideError();
            resetTimer();
            startRecording();
        }
    });
}

function openVoiceModal() {
    if (voiceModal && chatInputArea) {
        isVoiceMode = true;
        chatInputArea.classList.add('hidden');

        const chatScrollArea = document.getElementById('chatScrollArea');
        if (chatScrollArea) {
            chatScrollArea.classList.add('hidden');
        }

        const recommendSection = document.getElementById('recommendSection');
        if (recommendSection) {
            recommendSection.classList.add('hidden');
        }

        voiceModal.classList.remove('hidden');
        
        const chatPreview = document.getElementById('voiceChatPreview');
        const chatMessageArea = document.getElementById('chatMessageArea');
        
        if (chatPreview && chatMessageArea) {
            chatPreview.innerHTML = chatMessageArea.innerHTML;

            setTimeout(() => {
                chatPreview.scrollTop = chatPreview.scrollHeight;
            }, 100);
        }
        
        resetTimer();
        hideError();
        startRecording();
    }
}

function closeVoiceModal() {
    if (voiceModal && chatInputArea) {
        voiceModal.classList.add('hidden');
        chatInputArea.classList.remove('hidden');

        const chatScrollArea = document.getElementById('chatScrollArea');
        if (chatScrollArea) {
            chatScrollArea.classList.remove('hidden');
        }
        
        stopRecordingAndCleanup();
    }
}

function stopRecordingAndSend() {
    // 최소 녹음 시간 체크 (1초 이상)
    const recordingDuration = Date.now() - recordingStartTime;
    if (recordingDuration < 1000) {
        console.warn('⚠️ 녹음 시간이 너무 짧습니다:', recordingDuration + 'ms');
        resetTimer();
        showError('녹음 시간이 너무 짧습니다. 최소 1초 이상 녹음해주세요.');
        return;
    }
    
    // if (timerInterval) {
    //     clearInterval(timerInterval);
    //     timerInterval = null;
    // }
    
    if (silenceDetectionInterval) {
        clearInterval(silenceDetectionInterval);
        silenceDetectionInterval = null;
    }

    hideError();

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

function startRecording() {
    shouldProcessSTT = true;
    hasSpoken = false;
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            currentStream = stream; 

            const circleAnimation = document.querySelector('.voice-circle-animation');
            if (circleAnimation) {
                circleAnimation.classList.add('recording');
            }

            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                if (!shouldProcessSTT) {
                    console.log('⏭️ STT 건너뛰기 (페이지 전환)');
                    audioChunks = [];
                    if (currentStream) {
                        currentStream.getTracks().forEach(track => track.stop());
                        currentStream = null;
                    }
                    return;
                }
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = [];
                
                // STT 처리
                await transcribeAudio(audioBlob);

                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                    currentStream = null;
                }
            };
            
            // 무음 감지 설정
            setupSilenceDetection(stream);
            mediaRecorder.start();
            startTimer();
        })
        .catch(error => {
            console.error('마이크 접근 오류:', error);
            showError('마이크 권한을 허용해주세요.');
        });
}

function setupSilenceDetection(stream) {
    // Web Audio API 설정
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let lastSoundTime = Date.now();
    const SILENCE_THRESHOLD = 30;
    const SILENCE_DURATION = 5000; // 5초
    
    // 100ms마다 오디오 레벨 체크
    silenceDetectionInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        
        // 평균 볼륨 계산
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        
        if (average > SILENCE_THRESHOLD) {
            hasSpoken = true;
            lastSoundTime = Date.now();

            if (silenceTimeout) {
                clearTimeout(silenceTimeout);
                silenceTimeout = null;
            }
        } else {
            const silenceDuration = Date.now() - lastSoundTime;

            if (silenceDuration >= SILENCE_DURATION && !silenceTimeout && !hasSpoken) {
                console.log('5초 무음 감지, 자동 종료');
                
                const circleAnimation = document.querySelector('.voice-circle-animation');
                if (circleAnimation) {
                    circleAnimation.classList.remove('recording');
                }

                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }

                if (silenceDetectionInterval) {
                    clearInterval(silenceDetectionInterval);
                    silenceDetectionInterval = null;
                }

                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.onstop = null;
                    mediaRecorder.stop();
                    audioChunks = [];
                }
                
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                    currentStream = null;
                }

                if (audioContext) {
                    audioContext.close();
                    audioContext = null;
                    analyser = null;
                }
                resetTimer();
                showError('음성이 감지되지 않았습니다. 다시 시도해주세요.');
            }
        }
    }, 100);
}

function startTimer() {
    recordingStartTime = Date.now();
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        if (voiceTimer) {
            // 60초 이상이면 "분m 초s" 형식, 60초 미만이면 "초s" 형식
            if (elapsed >= 60) {
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                voiceTimer.textContent = `${minutes}m ${seconds}s`;
            } else {
                voiceTimer.textContent = `${elapsed}s`;
            }
        }
    }, 1000);
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (voiceTimer) {
        voiceTimer.textContent = '0s';
    }
}

function showError(message) {
    if (voiceError) {
        const errorText = voiceError.querySelector('p');
        if (errorText) {
            errorText.textContent = message;
        }
        voiceError.classList.remove('hidden');

        if (voiceTimer) {
            voiceTimer.classList.add('hidden');
        }
    }
}

function hideError() {
    if (voiceError) {
        voiceError.classList.add('hidden');

        if (voiceTimer) {
            voiceTimer.classList.remove('hidden');
        }
    }
}

async function transcribeAudio(audioBlob) {
    console.log('🎤 STT 시작:', {
        size: audioBlob.size,
        type: audioBlob.type
    });
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                     document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    try {
        const response = await fetch('/chat/api/transcribe/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            },
            body: formData
        });

        const data = await response.json();

        if (data.ok) {
            console.log('✅ STT 성공! 텍스트:', data.text);

            if (!data.text || data.text.trim() === '') {
                resetTimer();
                showError('음성이 인식되지 않았습니다. 다시 시도해주세요.');
                return;
            }
            
            // 1. 유저 메시지 UI 표시
            const userTimestamp = new Date().toISOString();
            console.log('1️⃣ 유저 메시지 표시 시작');
            addMessageElement('user', data.text, userTimestamp);
            console.log('2️⃣ 유저 메시지 표시 완료');

            if (chatIntro) {
                chatIntro.classList.add('hidden');
            }
            
            const recommendSection = document.getElementById('recommendSection');
            if (recommendSection) {
                recommendSection.classList.add('hidden');
            }

            // 2. 봇 "답변 생성 중..." 표시
            const tempBotId = 'temp-bot-' + Date.now();
            console.log('3️⃣ 봇 메시지 표시 시작');
            addMessageElement('bot', '답변 생성 중...', userTimestamp, tempBotId);
            console.log('4️⃣ 봇 메시지 표시 완료');

            const chatPreview = document.getElementById('voiceChatPreview');
            const chatMessageArea = document.getElementById('chatMessageArea');
            if (chatPreview && chatMessageArea) {
                chatPreview.innerHTML = chatMessageArea.innerHTML;
                chatPreview.scrollTop = chatPreview.scrollHeight;
            }

            await new Promise(resolve => setTimeout(resolve, 50));  // 브라우저에게 화면 업데이트 기회 줌 => 모델 연결 후 50을 0으로 교체할 것
            console.log('화면 업데이트 대기 완료');

            // 3. 백엔드 요청
            isVoiceMode = true;
            console.log('5️⃣ 백엔드 요청 시작');
            await sendMessageWithoutUI(data.text, tempBotId);
            console.log('6️⃣ 백엔드 응답 완료');
            
        } else {
            console.error('❌ STT 실패:', data.error);
            resetTimer();
            showError('음성 인식에 실패했습니다. 다시 시도해주세요.');
        }
    } catch (error) {
        console.error('❌ 음성 인식 오류:', error);
        resetTimer();
        showError('음성 인식에 실패했습니다. 다시 시도해주세요.');
    }
}

async function playTTS(text) {
    if (!isVoiceMode) {
        return;
    }

    if (currentAudio) {
        try {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio.src = '';
            currentAudio.load();
        } catch (e) {
            console.log('Audio cleanup error:', e);
        }
        currentAudio = null;
    }

    console.log('🔊 TTS 시작:', text);
    
    const circleAnimation = document.querySelector('.voice-circle-animation');
    if (circleAnimation) {
        circleAnimation.classList.remove('recording');
    }
    
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                     document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    
    try {
        const response = await fetch('/chat/api/tts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ text: text })
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudio = audio;
             
            audio.playbackRate = 1.3; // 1.3배속

            audio.onended = () => {
                console.log('✅ TTS 재생 완료');
                currentAudio = null;

                if (!isVoiceMode) {
                    return;
                }

                const chatPreview = document.getElementById('voiceChatPreview');
                const chatMessageArea = document.getElementById('chatMessageArea');
                
                if (chatPreview && chatMessageArea && isVoiceMode) {
                    chatPreview.innerHTML = chatMessageArea.innerHTML;
                    chatPreview.scrollTop = chatPreview.scrollHeight;
                }
                resetTimer();

                isVoiceMode = true;
            };
            
            audio.onerror = (e) => {
                console.error('❌ TTS 재생 오류:', e);
                currentAudio = null;
                resetTimer();
            };

            if (!isVoiceMode) {
                return;
            }
            
            await audio.play();
            console.log('🔊 TTS 재생 중...');
        } else {
            console.error('❌ TTS API 실패:', response.status);
            resetTimer();
        }
    } catch (error) {
        console.error('❌ TTS 오류:', error);
        resetTimer();
    }
}