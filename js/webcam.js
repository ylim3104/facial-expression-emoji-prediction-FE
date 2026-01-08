/* ================= DOM ELEMENTS ================= */
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

/* ================= GLOBAL STATE ================= */
let mediaRecorder;
let recordedChunks = [];
let videoBlob = null;
let isRecording = false;

let lastSent = 0;
const MIN_DELAY = 350;
let capturedDataURL = null;

let processing = false;

/* ================= FACE DETECTION ================= */
const faceDetection = new FaceDetection.FaceDetection({
    locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
});

faceDetection.setOptions({
    model: "short",
    minDetectionConfidence: 0.6
});

/* ================= WEBCAM CONSTRAINTS ================= */
const videoConstraints = {
    video: {
        width: { ideal: 480 },
        height: { ideal: 640 },
        facingMode: "user"
    }
};

/* ================= UI STATES ================= */
function setUIState(state) {
    if (state === "live") {
        webcamElement.classList.remove("hidden");
        previewContainer.classList.add("hidden");
        videoPreviewContainer.classList.add("hidden");

        liveButtons.classList.remove("hidden");
        reviewButtons.classList.add("hidden");
        videoReviewButtons.classList.add("hidden");

        photoBtn.disabled = false;
        videoBtn.disabled = false;

        statusText.innerText = "Webcam active!";
        requestAnimationFrame(loop);
    }
}

/* ================= START WEBCAM ================= */
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        webcamElement.srcObject = stream;
        setUIState("live");
    } catch {
        statusText.innerText = "Failed to open webcam 😢";
    }
}

/* ================= PREDICTION LOOP ================= */
async function loop() {
    if (
        webcamElement.classList.contains("hidden") ||
        processing ||
        !webcamElement.videoWidth
    ) {
        return requestAnimationFrame(loop);
    }

    const now = Date.now();
    if (now - lastSent < MIN_DELAY) {
        return requestAnimationFrame(loop);
    }
    lastSent = now;

    try {
        processing = true;
        await faceDetection.send({ image: webcamElement });
    } catch (err) {
        console.warn("Face detection error:", err);
    } finally {
        processing = false;
    }

    requestAnimationFrame(loop);
}

/* ================= FACE CROP + SEND ================= */
faceDetection.onResults(results => {
    if (webcamElement.classList.contains("hidden")) return;

    if (!results.detections || results.detections.length === 0) {
        resultEl.innerText = "No face detected";
        return;
    }

    const face = results.detections[0].boundingBox;
    const vw = webcamElement.videoWidth;
    const vh = webcamElement.videoHeight;

    let x = face.xCenter * vw - (face.width * vw) / 2;
    let y = face.yCenter * vh - (face.height * vh) / 2;
    let w = face.width * vw;
    let h = face.height * vh;

    x = Math.max(0, x);
    y = Math.max(0, y);
    w = Math.min(vw - x, w);
    h = Math.min(vh - y, h);

    if (w <= 0 || h <= 0) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(webcamElement, x, y, w, h, 0, 0, 48, 48);

    // Convert to grayscale
    const imgData = ctx.getImageData(0, 0, 48, 48);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const gray =
            imgData.data[i] * 0.299 +
            imgData.data[i + 1] * 0.587 +
            imgData.data[i + 2] * 0.114;
        imgData.data[i] =
        imgData.data[i + 1] =
        imgData.data[i + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
    sendToBackend(base64);
});

/* ================= BACKEND CALL ================= */
async function sendToBackend(base64) {
    try {
        const response = await fetch(
            "https://emotion-backend-47ip.onrender.com/predict-cnn",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64 })
            }
        );

        const data = await response.json();
        if (data.emotion) {
            const conf =
                data.confidence <= 1
                    ? data.confidence * 100
                    : data.confidence;
            resultEl.innerText = `${data.emotion} (${conf.toFixed(1)}%)`;
        }
    } catch {
        resultEl.innerText = "Prediction error 😞";
    }
}

/* ================= PHOTO WORKFLOW ================= */
function takePicture() {
    const canvas = document.createElement("canvas");
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    canvas.getContext("2d").drawImage(webcamElement, 0, 0);

    capturedDataURL = canvas.toDataURL("image/png");
    capturedPhoto.src = capturedDataURL;

    webcamElement.classList.add("hidden");
    previewContainer.classList.remove("hidden");
    liveButtons.classList.add("hidden");
    reviewButtons.classList.remove("hidden");

    statusText.innerText = "Review your photo.";
}

function savePicture() {
    const link = document.createElement("a");
    link.href = capturedDataURL;
    link.download = `Mood-o-Meter_Photo_${new Date().toISOString()}.png`;
    link.click();

    capturedDataURL = null;
    setUIState("live");
}

/* ================= VIDEO WORKFLOW ================= */
function toggleRecording() {
    if (!isRecording) {
        mediaRecorder = new MediaRecorder(webcamElement.srcObject, {
            mimeType: "video/webm"
        });
        recordedChunks = [];

        mediaRecorder.ondataavailable = e => {
            if (e.data.size) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            videoBlob = new Blob(recordedChunks, { type: "video/webm" });
            capturedVideo.src = URL.createObjectURL(videoBlob);

            webcamElement.classList.add("hidden");
            liveButtons.classList.add("hidden");

            videoPreviewContainer.classList.remove("hidden");
            videoReviewButtons.classList.remove("hidden");

            isRecording = false;
            videoBtn.innerText = "🎥 Record Video";
        };

        mediaRecorder.start();
        isRecording = true;
        videoBtn.innerText = "⏹️ Stop Recording";
        photoBtn.disabled = true;
        statusText.innerText = "🎥 Recording...";
    } else {
        mediaRecorder.stop();
    }
}

/* ================= VIDEO SAVE / RETAKE ================= */
saveVideoBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(videoBlob);
    link.download = `Mood-o-Meter_Video_${new Date().toISOString()}.webm`;
    link.click();

    videoBlob = null;
    setUIState("live");
});

retakeVideoBtn.addEventListener("click", () => {
    videoBlob = null;
    setUIState("live");
});

/* ================= EVENTS ================= */
startWebcam();

photoBtn.addEventListener("click", takePicture);
retakeBtn.addEventListener("click", () => setUIState("live"));
saveBtn.addEventListener("click", savePicture);
videoBtn.addEventListener("click", toggleRecording);

document.getElementById("back-btn").addEventListener("click", () => {
    const stream = webcamElement.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    window.location.href = "index.html";
});
