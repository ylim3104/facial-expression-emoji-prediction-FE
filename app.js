const stickersData = [
    { file: "1.png", x: 0, y: 150, size: 110 },
    { file: "2.png", x: 280, y: 0, size: 80 },
    // { file: "3.png", x: 50, y: 2, size: 120 },
    { file: "4.png", x: 10, y: 0, size: 70 },
    { file: "5.png", x: 340, y: 200, size: 150 },
    { file: "6.png", x: 170, y: 170, size: 90 },
    // { file: "7.png", x: 20, y: 485, size: 130 },
    { file: "8.png", x: 310, y: 580, size: 70 },
    { file: "9.png", x: 20, y: 540, size: 160 },
    { file: "10.png", x: 295, y: 450, size: 155 },
    { file: "11.png", x: 10, y: 420, size: 85 },
    { file: "12.png", x: 150, y:460, size: 100 }
];

// const wrapper = document.querySelector('.stickers-wrapper');

// stickersData.forEach(data => {
//     const sticker = document.createElement('img');  // <img> instead of <div>
//     sticker.className = 'sticker';
//     sticker.src = `stickers/${data.file}`;
//     sticker.style.width = data.size + 'px';
//     sticker.style.height = data.size + 'px';
//     sticker.style.left = data.x + 'px';
//     sticker.style.top = data.y + 'px';
//     wrapper.appendChild(sticker);
// });

const REF_WIDTH = 400;
const REF_HEIGHT = 650;


const wrapper = document.querySelector('.stickers-wrapper');

stickersData.forEach(data => {
    const sticker = document.createElement('img');
    sticker.className = 'sticker';
    sticker.src = `stickers/${data.file}`;

    // --- Core change: Convert pixels to percentages and VW/VH ---

    // 1. Calculate percentage position relative to the wrapper
    const leftPercent = (data.x / REF_WIDTH) * 100;
    const topPercent = (data.y / REF_HEIGHT) * 100;

    // 2. Use a responsive unit for size (Viewport Width for size)
    // Using a unit like `vw` (viewport width) makes the sticker size scale.
    // We base the size on the reference width.
    const sizeVW = (data.size / REF_WIDTH) * 100;


    sticker.style.width = sizeVW + 'vw';    // Sticker width scales with the viewport width
    sticker.style.height = sizeVW + 'vw';   // Maintain aspect ratio by using the same unit
    sticker.style.left = leftPercent + '%'; // Position scales with the wrapper width
    sticker.style.top = topPercent + '%';   // Position scales with the wrapper height

    wrapper.appendChild(sticker);
});

document.getElementById("start-btn").addEventListener("click", () => {
    window.location.href = "webcam.html";
});
