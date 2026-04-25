/* ================================================
   JEICI VIEIRA NAILS - REGISTRO DO SERVICE WORKER
   JavaScript para registro do PWA offline
   ================================================ */

/* ----------------------------------------
   VARIÁVEIS GLOBAIS
   ---------------------------------------- */
let eventoInstalacao;
const bannerPWA = document.getElementById('bannerInstalacaoPWA');
const btnInstalar = document.getElementById('btnInstalarPWA');
const btnFecharBanner = document.getElementById('btnFecharPWA');

/* ----------------------------------------
   REGISTRAR SERVICE WORKER
   Registra o SW para funcionar offline
   ---------------------------------------- */
function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('assets/js/sw.js')
                .then(function(registro) {
                    console.log('[PWA] Service Worker registrado com sucesso:', registro.scope);
                })
                .catch(function(erro) {
                    console.error('[PWA] Erro ao registrar Service Worker:', erro);
                });
        });
    }
}

/* ----------------------------------------
   LIDAR COM PROMPT DE INSTALAÇÃO
   Escuta o evento beforeinstallprompt
   ---------------------------------------- */
function configurarPromptInstalacao() {
    window.addEventListener('beforeinstallprompt', function(e) {
        // Previne o prompt padrão do navegador
        e.preventDefault();
        // Salva o evento para ser disparado depois
        eventoInstalacao = e;
        
        // Mostra o nosso banner personalizado após um curto atraso
        setTimeout(function() {
            if (bannerPWA) {
                bannerPWA.style.display = 'block';
            }
        }, 1500);
    });
}

/* ----------------------------------------
   AÇÃO DO BOTÃO INSTALAR
   Função para instalar o app
   ---------------------------------------- */
function configurarBotaoInstalar() {
    if (btnInstalar) {
        btnInstalar.addEventListener('click', async function() {
            if (!eventoInstalacao) {
                return;
            }
            // Mostra o prompt nativo de instalação
            eventoInstalacao.prompt();
            // Espera pela resposta do usuário
            const userChoice = await eventoInstalacao.userChoice;
            console.log('[PWA] Escolha do usuário: ' + userChoice.outcome);
            
            // Limpa o evento e esconde o banner
            eventoInstalacao = null;
            bannerPWA.style.display = 'none';
        });
    }
}

/* ----------------------------------------
   AÇÃO DO BOTÃO FECHAR
   Função para fechar o banner manualmente
   ---------------------------------------- */
function configurarBotaoFechar() {
    if (btnFecharBanner) {
        btnFecharBanner.addEventListener('click', function() {
            bannerPWA.style.display = 'none';
        });
    }
}

/* ----------------------------------------
   ESCUTAR INSTALAÇÃO
   Quando o app for instalado
   ---------------------------------------- */
function configurarInstalacaoFeita() {
    window.addEventListener('appinstalled', function() {
        if (bannerPWA) {
            bannerPWA.style.display = 'none';
        }
        eventoInstalacao = null;
        console.log('[PWA] Aplicativo instalado com sucesso.');
    });
}

/* ----------------------------------------
   INICIALIZAÇÃO
   Configura todas as funções PWA
   ---------------------------------------- */
function inicializarPWA() {
    registrarServiceWorker();
    configurarPromptInstalacao();
    configurarBotaoInstalar();
    configurarBotaoFechar();
    configurarInstalacaoFeita();
}

/* ----------------------------------------
   INICIALIZAÇÃO AUTOMÁTICA
   Inicia quando o DOM estiver pronto
   ---------------------------------------- */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPWA);
} else {
    inicializarPWA();
}