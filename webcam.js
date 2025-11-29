// webcam.js

const webcamElement = document.getElementById("webcam");
const statusText = document.getElementById("status");

// --- New configuration for a PORTRAIT stream (e.g., 9:16 ratio) ---
const videoConstraints = {
    video: {
        // Request a specific resolution that is taller than it is wide
        width: { ideal: 480 },  // Width preference
        height: { ideal: 640 }  // Height preference
    }
};

// Open webcam
async function startWebcam() {
    try {
        // Use the new constraints
        const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        webcamElement.srcObject = stream;
        statusText.innerText = "Webcam active!";
    } catch (error) {
        statusText.innerText = "Failed to open webcam 😢";
        console.error(error);
    }
}

startWebcam();

// Button actions (temporary placeholders)
document.getElementById("photo-btn").addEventListener("click", () => {
    statusText.innerText = "📸 Taking picture... (not implemented)";
});

document.getElementById("video-btn").addEventListener("click", () => {
    statusText.innerText = "🎥 Recording... (not implemented)";
});

document.getElementById("back-btn").addEventListener("click", () => {
    // Stop the video track before navigating away
    const stream = webcamElement.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    window.location.href = "index.html";
});