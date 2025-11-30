const webcamElement = document.getElementById("webcam");
const statusText = document.getElementById("status");
const resultEl = document.getElementById("result");

// Buttons
const photoBtn = document.getElementById("photo-btn");
const videoBtn = document.getElementById("video-btn");

// UI state (photo)
const previewContainer = document.getElementById("preview-container");
const capturedPhoto = document.getElementById("captured-photo");
const liveButtons = document.getElementById("live-buttons");
const reviewButtons = document.getElementById("review-buttons");
const retakeBtn = document.getElementById("retake-btn");
const saveBtn = document.getElementById("save-btn");

// UI state (video)
const capturedVideo = document.getElementById("captured-video");
const videoPreviewContainer = document.getElementById("video-preview-container");
const videoReviewButtons = document.getElementById("video-review-buttons");
const retakeVideoBtn = document.getElementById("retake-video-btn");
const saveVideoBtn = document.getElementById("save-video-btn");

let mediaRecorder;
let recordedChunks = [];
let videoBlob = null;
let isRecording = false;

let lastSent = 0;
const MIN_DELAY = 350;
let capturedDataURL = null;

// Webcam constraints
const videoConstraints = {
    video: {
        width: { ideal: 480 },
        height: { ideal: 640 },
        facingMode: "user"
    }
};

/* ========== UI States ========== */
function setUIState(state) {
    if (state === 'live') {
        webcamElement.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        videoPreviewContainer.classList.add('hidden');

        liveButtons.classList.remove('hidden');
        reviewButtons.classList.add('hidden');
        videoReviewButtons.classList.add('hidden');

        // IMPORTANT FIX
        photoBtn.disabled = false;
        videoBtn.disabled = false;

        statusText.innerText = "Webcam active!";
        requestAnimationFrame(loop);
    }
}

function setVideoUIState(state) {
    if (state === 'review') {
        webcamElement.classList.add('hidden');
        liveButtons.classList.add('hidden');

        videoPreviewContainer.classList.remove('hidden');
        videoReviewButtons.classList.remove('hidden');

        statusText.innerText = "Review your video. Click save to download.";
    } else {
        // Back to live
        setUIState('live');
    }
}

/* ========== Start Webcam ========== */
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        webcamElement.srcObject = stream;
        setUIState('live');
    } catch (err) {
        statusText.innerText = "Failed to open webcam 😢";
    }
}

/* ========== Prediction Loop ========== */
async function loop() {
    if (webcamElement.classList.contains("hidden")) return;

    const now = Date.now();
    if (now - lastSent < MIN_DELAY) return requestAnimationFrame(loop);
    lastSent = now;

    if (!webcamElement.videoWidth) return requestAnimationFrame(loop);

    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(webcamElement, 0, 0, 48, 48);

    let base64 = canvas.toDataURL("image/jpeg").split(",")[1];

    try {
        const response = await fetch(
            "https://keras-api-y42tkoflha-uc.a.run.app/predict-cnn",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64 })
            }
        );
        const data = await response.json();

        if (data.emotion) {
            let conf = data.confidence <= 1 ? data.confidence * 100 : data.confidence;
            resultEl.innerText = `${data.emotion} (${conf.toFixed(1)}%)`;
        }
    } catch (err) {
        resultEl.innerText = "Prediction error 😞";
    }

    requestAnimationFrame(loop);
}

/* ========== PHOTO WORKFLOW (unchanged) ========== */
function takePicture() {
    if (isRecording && mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        isRecording = false;
        videoBtn.innerText = "🎥 Record Video";
    }

    const width = webcamElement.videoWidth;
    const height = webcamElement.videoHeight;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(webcamElement, 0, 0, width, height);

    capturedDataURL = canvas.toDataURL("image/png");
    capturedPhoto.src = capturedDataURL;

    webcamElement.classList.add("hidden");
    previewContainer.classList.remove("hidden");
    liveButtons.classList.add("hidden");
    reviewButtons.classList.remove("hidden");

    statusText.innerText = "Review your photo. Click save to download.";
}

function savePicture() {
    const link = document.createElement("a");
    link.href = capturedDataURL;
    link.download = `Mood-o-Meter_Photo_${new Date().toISOString()}.png`;
    link.click();

    capturedDataURL = null;
    setUIState("live");
}

/* ========== VIDEO WORKFLOW (enhanced) ========== */
function toggleRecording() {
    if (!isRecording) {
        const stream = webcamElement.srcObject;
        mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        recordedChunks = [];

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
        // Build Blob
        videoBlob = new Blob(recordedChunks, { type: "video/webm" });
        capturedVideo.src = URL.createObjectURL(videoBlob);

        // Switch UI to video review mode
        webcamElement.classList.add("hidden");
        liveButtons.classList.add("hidden");
        reviewButtons.classList.add("hidden");

        videoPreviewContainer.classList.remove("hidden");
        videoReviewButtons.classList.remove("hidden");

        photoBtn.disabled = true;
        videoBtn.disabled = true;

        statusText.innerText = "Review your video. Click save to download.";

        // Reset state
        isRecording = false;
        videoBtn.innerText = "🎥 Record Video";
    };

        mediaRecorder.start();
        isRecording = true;

        videoBtn.innerText = "⏹️ Stop Recording";
        photoBtn.disabled = true;
        statusText.innerText = "🎥 Recording...";
    }

    else if (mediaRecorder.state === "recording") {
        // If currently recording → STOP completely
        mediaRecorder.stop();
        return; // Stop here because UI switching happens in onstop()
    }

    else if (mediaRecorder.state === "paused") {
        mediaRecorder.resume();
        videoBtn.innerText = "⏹️ Stop Recording";
        statusText.innerText = "🎥 Recording...";
    }
}

/* ========== VIDEO Save / Retake ========== */
saveVideoBtn.addEventListener("click", () => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Mood-o-Meter_Video_${new Date().toISOString()}.webm`;
    link.click();

    URL.revokeObjectURL(url);
    videoBlob = null;

    // Return to live mode
    videoPreviewContainer.classList.add("hidden");
    videoReviewButtons.classList.add("hidden");

    setUIState("live");
});

retakeVideoBtn.addEventListener("click", () => {
    videoBlob = null;

    videoPreviewContainer.classList.add("hidden");
    videoReviewButtons.classList.add("hidden");

    setUIState("live");
});

/* ========== Events ========== */
startWebcam();
webcamElement.onloadeddata = () => loop();

photoBtn.addEventListener("click", takePicture);
retakeBtn.addEventListener("click", () => setUIState("live"));
saveBtn.addEventListener("click", savePicture);

videoBtn.addEventListener("click", toggleRecording);

document.getElementById("back-btn").addEventListener("click", () => {
    const stream = webcamElement.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    window.location.href = "index.html";
});
