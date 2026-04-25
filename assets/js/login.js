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
    '../data/img/login/img_login_02.png'
];

/* ----------------------------------------
   SELEÇÃO ALEATÓRIA DA IMAGEM
   Gera um índice aleatório baseado no tamanho
   da lista de imagens e define como imagem
   de fundo do login
   ---------------------------------------- */
const indiceAleatorio = Math.floor(Math.random() * listaDeImagens.length);
document.documentElement.style.setProperty('--imagem-fundo-login', `url('${listaDeImagens[indiceAleatorio]}')`);

/* ----------------------------------------
   LÓGICA DO PROMPT DE INSTALAÇÃO PWA
   Controla a exibição do banner para
   adicionar o app à tela inicial
   ---------------------------------------- */
let eventoInstalacao;
const bannerPWA = document.getElementById('bannerInstalacaoPWA');
const btnInstalar = document.getElementById('btnInstalarPWA');
const btnFecharBanner = document.getElementById('btnFecharPWA');

// Escuta o evento antes de instalar
window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o prompt padrão do navegador
    e.preventDefault();
    // Salva o evento para ser disparado depois
    eventoInstalacao = e;
    
    // Mostra o nosso banner personalizado após um curto atraso
    setTimeout(() => {
        if (bannerPWA) {
            bannerPWA.style.display = 'block';
        }
    }, 1500);
});

// Ação do botão de instalar
if (btnInstalar) {
    btnInstalar.addEventListener('click', async () => {
        if (!eventoInstalacao) {
            return;
        }
        // Mostra o prompt nativo de instalação
        eventoInstalacao.prompt();
        // Espera pela resposta do usuário
        const { outcome } = await eventoInstalacao.userChoice;
        console.log(`[PWA] Escolha do usuário: ${outcome}`);
        
        // Limpa o evento e esconde o banner
        eventoInstalacao = null;
        bannerPWA.style.display = 'none';
    });
}

// Ação para fechar o banner manualmente
if (btnFecharBanner) {
    btnFecharBanner.addEventListener('click', () => {
        bannerPWA.style.display = 'none';
    });
}

// Escuta se o app já foi instalado pelo usuário para garantir que o banner feche
window.addEventListener('appinstalled', () => {
    if (bannerPWA) {
        bannerPWA.style.display = 'none';
    }
    eventoInstalacao = null;
    console.log('[PWA] Aplicativo instalado com sucesso.');
});