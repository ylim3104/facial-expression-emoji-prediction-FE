// Get elements
const video = document.getElementById("cam");
const resultEl = document.getElementById("result");

// Start camera
navigator.mediaDevices.getUserMedia({video: true})
    .then(stream => video.srcObject = stream);

// Real-time camera
async function loop() {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 48, 48);
    
    const base64 = canvas.toDataURL("image/jpeg");
    try {
        const response = await fetch("", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringyfy({image: base64})
        });

        const data = await response.json();
        resultEl.innerText = `${data.emotion} (${data.confidence.toFixed(1)}%)`;
    } catch(err) {
        console.log("Server not reachable:", err);
    }

    setTimeout(loop, 200);
}

setTimeout(loop, 1000);