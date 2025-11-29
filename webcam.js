const webcamElement = document.getElementById("webcam");
const statusText = document.getElementById("status");

// Open webcam
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    window.location.href = "index.html";
});
