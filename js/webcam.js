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
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(webcamElement, 0, 0, 48, 48);

    const base64 = canvas.toDataURL("image/jpeg");

    try {
        const response = await fetch("https://keras-api-732861493831.us-central1.run.app/predict-cnn", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ image: base64 })
        });

        const data = await response.json();
        resultEl.innerText = `${data.emotion} (${data.confidence.toFixed(1)}%)`;
    } catch (err) {
        console.log("Server not reachable:", err);
    }

    setTimeout(loop, 200);
}
