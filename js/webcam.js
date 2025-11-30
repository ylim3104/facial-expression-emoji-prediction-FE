// webcam.js

const webcamElement = document.getElementById("webcam");
const statusText = document.getElementById("status");
const resultEl = document.getElementById("result");

// Portrait camera constraints
const videoConstraints = {
    video: {
        width: { ideal: 480 },
        height: { ideal: 640 }
    }
};

// Start webcam
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        webcamElement.srcObject = stream;
        statusText.innerText = "Webcam active!";
    } catch (error) {
        statusText.innerText = "Failed to open webcam 😢";
        console.error(error);
    }
}

startWebcam();

// Only start loop when video data is ready
webcamElement.onloadeddata = () => {
    loop();
};

// Buttons
document.getElementById("photo-btn").addEventListener("click", () => {
    statusText.innerText = "📸 Taking picture... (not implemented)";
});

document.getElementById("video-btn").addEventListener("click", () => {
    statusText.innerText = "🎥 Recording... (not implemented)";
});

document.getElementById("back-btn").addEventListener("click", () => {
    const stream = webcamElement.srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());
    window.location.href = "index.html";
});

// Prediction loop
async function loop() {
    if (!webcamElement.videoWidth) return setTimeout(loop, 200);  // Skip if video not ready

    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(webcamElement, 0, 0, 48, 48);

    // Strip data URL prefix for pure base64
    let base64 = canvas.toDataURL("image/jpeg");
    base64 = base64.split(',')[1];  // Remove "data:image/jpeg;base64,"

    try {
        const response = await fetch("https://keras-api-y42tkoflha-uc.a.run.app/predict-cnn", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ image: base64 })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data && data.emotion && data.confidence !== undefined) {
            resultEl.innerText = `${data.emotion} (${data.confidence.toFixed(1)}%)`;
        } else {
            resultEl.innerText = "Invalid response from server";
        }
    } catch (err) {
        console.error("Prediction failed:", err);
        resultEl.innerText = "Prediction error 😞";  // Graceful fallback
    }

    setTimeout(loop, 200);
}
