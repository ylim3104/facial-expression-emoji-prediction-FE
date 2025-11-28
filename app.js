const stickersData = [
    { file: "1.png", x: 0, y: 150, size: 110 },
    { file: "2.png", x: 280, y: 0, size: 80 },
    { file: "3.png", x: 50, y: 2, size: 120 },
    { file: "4.png", x: 210, y: 0, size: 90 },
    { file: "5.png", x: 350, y: 200, size: 200 },
    { file: "6.png", x: 170, y: 130, size: 110 },
    { file: "7.png", x: 20, y: 485, size: 130 },
    { file: "8.png", x: 310, y: 380, size: 70 },
    { file: "9.png", x: 210, y: 540, size: 160 },
    { file: "10.png", x: 295, y: 450, size: 155 },
    { file: "11.png", x: 10, y: 598, size: 85 },
    { file: "12.png", x: 150, y:405, size: 80 }
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
