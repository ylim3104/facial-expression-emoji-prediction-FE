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
const MIN_DELAY = 400;

let lastFaceBox = null;
let detecting = false;

/* ================= FACE DETECTION ================= */
const faceDetection = new FaceDetection.FaceDetection({
    locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
});

faceDetection.setOptions({
    model: "short",
    minDetectionConfidence: 0.5
});

faceDetection.onResults(results => {
    if (results.detections && results.detections.length > 0) {
        lastFaceBox = results.detections[0].boundingBox;
    } else {
        lastFaceBox = null;
    }
});

/* ================= UI STATES ================= */
function setUIState(state) {
    webcamElement.classList.add("hidden");
    previewContainer.classList.add("hidden");
    videoPreviewContainer.classList.add("hidden");

    liveButtons.classList.add("hidden");
    reviewButtons.classList.add("hidden");
    videoReviewButtons.classList.add("hidden");

    if (state === "live") {
        webcamElement.classList.remove("hidden");
        liveButtons.classList.remove("hidden");
        photoBtn.disabled = false;
        videoBtn.disabled = false;
        statusText.innerText = "Webcam active!";
        resultEl.innerText = "";
    }

    if (state === "photo-review") {
        previewContainer.classList.remove("hidden");
        reviewButtons.classList.remove("hidden");
        statusText.innerText = "Review your photo";
    }

    if (state === "video-review") {
        videoPreviewContainer.classList.remove("hidden");
        videoReviewButtons.classList.remove("hidden");
        statusText.innerText = "Review your video";
    }
}

/* ================= START WEBCAM ================= */
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        webcamElement.srcObject = stream;
        await webcamElement.play();

        statusText.innerText = "Webcam active!";
        requestAnimationFrame(predictLoop);
    } catch (error) {
        statusText.innerText = "Failed to open webcam 😢";
        console.error("Webcam error:", error);
        alert("Camera access failed. Check permissions and HTTPS.");
    }
}

/* ================= MAIN PREDICTION LOOP ================= */
async function predictLoop() {
    requestAnimationFrame(predictLoop);

    if (webcamElement.classList.contains("hidden")) return;
    if (!webcamElement.videoWidth) return;

    const now = Date.now();
    if (now - lastSent < MIN_DELAY) return;

    if (detecting) return;
    detecting = true;

    try {
        await faceDetection.send({ image: webcamElement });
    } catch (err) {
        console.warn("Face detection error:", err);
        detecting = false;
        return;
    }

    detecting = false;

    if (!lastFaceBox) {
        resultEl.innerText = "No face detected";
        return;
    }

    lastSent = now;

    const vw = webcamElement.videoWidth;
    const vh = webcamElement.videoHeight;

    let x = lastFaceBox.xCenter * vw - (lastFaceBox.width * vw) / 2;
    let y = lastFaceBox.yCenter * vh - (lastFaceBox.height * vh) / 2;
    let w = lastFaceBox.width * vw;
    let h = lastFaceBox.height * vh;

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
            const conf =
                data.confidence <= 1
                    ? data.confidence * 100
                    : data.confidence;
            resultEl.innerText = `${data.emotion} (${conf.toFixed(1)}%)`;
        }
    } catch (err) {
        console.error("Prediction error:", err);
    }
}

/* ================= PHOTO WORKFLOW ================= */
function takePicture() {
    const canvas = document.createElement("canvas");
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    canvas.getContext("2d").drawImage(webcamElement, 0, 0);

    capturedPhoto.src = canvas.toDataURL("image/png");
    setUIState("photo-review");
}

function savePicture() {
    const link = document.createElement("a");
    link.href = capturedPhoto.src;
    link.download = `Mood-o-Meter_Photo_${Date.now()}.png`;
    link.click();
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
            setUIState("video-review");
        };

        mediaRecorder.start();
        isRecording = true;
        videoBtn.innerText = "⏹️ Stop Recording";
        photoBtn.disabled = true;
        statusText.innerText = "🎥 Recording...";
    } else {
        mediaRecorder.stop();
        isRecording = false;
        videoBtn.innerText = "🎥 Record Video";
    }
}

/* ================= EVENTS ================= */
photoBtn.addEventListener("click", takePicture);
retakeBtn.addEventListener("click", () => setUIState("live"));
saveBtn.addEventListener("click", savePicture);

videoBtn.addEventListener("click", toggleRecording);
retakeVideoBtn.addEventListener("click", () => setUIState("live"));

saveVideoBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = capturedVideo.src;
    link.download = `Mood-o-Meter_Video_${Date.now()}.webm`;
    link.click();
    setUIState("live");
});

document.getElementById("back-btn").addEventListener("click", () => {
    const stream = webcamElement.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    window.location.href = "index.html";
});

/* ================= INIT ================= */
startWebcam();
