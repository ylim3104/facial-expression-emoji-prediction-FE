const stickersData = [
    { file: "1.png", x: 50, y: 180, size: 180 },
    // { file: "2.png", x: 300, y: 200, size: 80 },
    { file: "3.png", x: 50, y: 690, size: 120 },
    { file: "4.png", x: 220, y: 30, size: 90 },
    { file: "5.png", x: 450, y: 700, size: 300 },
    { file: "6.png", x: 500, y: 250, size: 100 },
    { file: "7.png", x: 600, y: 450, size: 110 },
    // { file: "8.png", x: 700, y: 400, size: 130 },
    { file: "9.png", x: 230, y: 780, size: 145 },
    { file: "10.png", x: 300, y: 700, size: 120 }
];

const wrapper = document.querySelector('.stickers-wrapper');

stickersData.forEach(data => {
    const sticker = document.createElement('img');  // <img> instead of <div>
    sticker.className = 'sticker';
    sticker.src = `stickers/${data.file}`;
    sticker.style.width = data.size + 'px';
    sticker.style.height = data.size + 'px';
    sticker.style.left = data.x + 'px';
    sticker.style.top = data.y + 'px';
    wrapper.appendChild(sticker);
});
