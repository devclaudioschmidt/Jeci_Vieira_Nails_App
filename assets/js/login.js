/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO LOGIN
   JavaScript para seleção aleatória de imagem
   ================================================ */

/* ----------------------------------------
   LISTA DE IMAGENS DO LOGIN
   Array contendo os caminhos das imagens
   disponíveis para o fundo da tela de login
   ---------------------------------------- */
const listaDeImagens = [
    '../data/img/login/img_login_01.png',
    '../data/img/login/img_login_02.png',
    '../data/img/login/img_login_03.png'
];

/* ----------------------------------------
   SELEÇÃO ALEATÓRIA DA IMAGEM
   Gera um índice aleatório baseado no tamanho
   da lista de imagens e define como imagem
   de fundo do login
   ---------------------------------------- */
const indiceAleatorio = Math.floor(Math.random() * listaDeImagens.length);
document.documentElement.style.setProperty('--imagem-fundo-login', `url('${listaDeImagens[indiceAleatorio]}')`);