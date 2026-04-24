const images = [
    '../data/img/login/img_login_01.png',
    '../data/img/login/img_login_02.png'
];
const randomIndex = Math.floor(Math.random() * images.length);
document.documentElement.style.setProperty('--login-bg-image', `url('${images[randomIndex]}')`);