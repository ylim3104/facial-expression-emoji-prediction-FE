const stickersData = [
    { file: "1.png", x: 0, y: 150, size: 110 },
    // { file: "2.png", x: 300, y: 200, size: 80 },
    { file: "3.png", x: 50, y: 2, size: 120 },
    { file: "4.png", x: 400, y: 0, size: 90 },
    { file: "5.png", x: 350, y: 200, size: 200 },
    { file: "6.png", x: 200, y: 150, size: 110 },
    { file: "7.png", x: 20, y: 485, size: 130 },
    // { file: "8.png", x: 700, y: 400, size: 130 },
    { file: "9.png", x: 210, y: 540, size: 160 },
    { file: "10.png", x: 320, y: 470, size: 155 }
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
