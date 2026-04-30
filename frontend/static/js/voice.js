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


function toggleVoiceRecording() {
    if (!voiceModal) return;

    if (!voiceModal.classList.contains('hidden')) {
        stopRecordingAndSend();
    } else {
        openVoiceModal();
    }
}

if (voiceBackBtn) {
    voiceBackBtn.addEventListener('click', function () {
        isVoiceMode = false;
        closeVoiceModal();
    });
}

// 아래 입력창 마이크 버튼
if (micBtn) {
    micBtn.addEventListener('click', toggleVoiceRecording);
}

// 가운데 원형 마이크 버튼
if (voiceMicCenter) {
    voiceMicCenter.addEventListener('click', toggleVoiceRecording);
}

function openVoiceModal() {
    if (voiceModal && chatInputArea) {
        isVoiceMode = true;
        chatInputArea.classList.add('hidden');
        voiceModal.classList.remove('hidden');
        startRecording();
    }
}

function closeVoiceModal() {
    if (voiceModal && chatInputArea) {
        voiceModal.classList.add('hidden');
        chatInputArea.classList.remove('hidden');
        resetTimer();
        hideError();
    }
}

function stopRecordingAndSend() {
    hideError();
    resetTimer();

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = [];
                
                await transcribeAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            startTimer();
        })
        .catch(error => {
            console.error('마이크 접근 오류:', error);
            showError('마이크 권한을 허용해주세요.');
        });
}

function startTimer() {
    recordingStartTime = Date.now();
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        if (voiceTimer) {
            voiceTimer.textContent = `${elapsed}s`;
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
        voiceError.querySelector('p').textContent = message;
        voiceError.classList.remove('hidden');
    }
}

function hideError() {
    if (voiceError) {
        voiceError.classList.add('hidden');
    }
}
async function transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob);

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
            if (chatInput) {
                chatInput.value = data.text;
                if (typeof updateTextCount === 'function') {
                    updateTextCount();
                }
            }

            closeVoiceModal();

            if (typeof sendCurrentMessage === 'function') {
                sendCurrentMessage();
            }
        } else {
            showError('음성 인식에 실패했습니다. 다시 시도해주세요.');
        }
    } catch (error) {
        console.error('음성 인식 오류:', error);
        showError('음성 인식에 실패했습니다. 다시 시도해주세요.');
    }
}

async function playTTS(text) {
    if (!isVoiceMode) {
        return;
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
            
            audio.onended = () => {
                isVoiceMode = false;
            };
            
            audio.play();
        }
    } catch (error) {
        console.error('TTS 오류:', error);
        isVoiceMode = false;
    }
}