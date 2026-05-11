/* ================================================
   JEICI VIEIRA NAILS - SISTEMA DE REFRESH
   Utilitário centralizado para refresh de dados
   ================================================ */

/* ================================================
   MOSTRAR/ESCONDER FEEDBACK VISUAL
   ================================================ */
function mostrarFeedbackRefresh(mostrar, tipo = 'refresh') {
    let indicador = document.getElementById('indicador-refresh');
    
    if (mostrar) {
        if (!indicador) {
            indicador = document.createElement('div');
            indicador.id = 'indicador-refresh';
            indicador.className = 'indicador-refresh';
            indicador.innerHTML = '<span class="spinner-refresh">🔄</span> Atualizando...';
            document.body.appendChild(indicador);
        }
        indicador.style.display = 'flex';
        indicador.querySelector('.spinner-refresh').style.animation = 'spin 1s linear infinite';
    } else {
        if (indicador) {
            indicador.style.display = 'none';
        }
    }
}

/* ================================================
   ESCUTAR VOLTA À PÁGINA (VISIBILITY API)
   ================================================ */
let tempoUltimoRefresh = 0;
const INTERVALO_MINIMO_REFRESH = 30000; // 30 segundos entre refreshs automáticos

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        const agora = Date.now();
        if (agora - tempoUltimoRefresh >= INTERVALO_MINIMO_REFRESH) {
            tempoUltimoRefresh = agora;
            console.log('[DEBUG] Página ficou visível - refresh automático');
            
            if (typeof globalRefreshPage === 'function') {
                await globalRefreshPage();
            }
        }
    }
});

/* ================================================
   BOTÃO GENÉRICO DE REFRESH NO HEADER
   Adiciona botão de refresh a páginas existentes
   ================================================ */
function adicionarBotaoRefreshHeader(container, callback) {
    const botaoExistente = document.getElementById('btn-header-refresh');
    if (botaoExistente) {
        botaoExistente.remove();
    }

    if (!container) return;

    // Encontrar wrapper existente
    const wrapper = container.querySelector('.botoes-header');
    if (!wrapper) {
        console.log('[DEBUG-REFRESH] Wrapper não encontrado!');
        return;
    }

    console.log('[DEBUG-REFRESH] Wrapper encontrado:', wrapper);

    const botao = document.createElement('button');
    botao.id = 'btn-header-refresh';
    botao.className = 'botao-header-refresh';
    botao.setAttribute('aria-label', 'Atualizar dados');
    botao.innerHTML = `
        <svg class="icone-refresh" viewBox="0 0 24 24">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
        </svg>
        <span class="texto-botao">Atualizar</span>
    `;

    botao._callbackRefresh = async () => {
        botao.classList.add('animando');
        if (callback && typeof callback === 'function') {
            await callback();
        }
        setTimeout(() => {
            botao.classList.remove('animando');
        }, 1000);
    };

    botao.addEventListener('click', botao._callbackRefresh);

    // Inserir no wrapper (não antes)
    wrapper.appendChild(botao);

    console.log('[DEBUG-REFRESH] Botão inserido! Wrapper:', wrapper.innerHTML);

    return botao;
}

/* ================================================
   INICIALIZAR SISTEMA DE REFRESH
   Detecta página atual e inicializa recursos
   ================================================ */
async function inicializarRefresh(pagina, callbackRefresh) {
    console.log('[DEBUG] Inicializando sistema de refresh para:', pagina);

    const existingStyle = document.getElementById('refresh-styles');
    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'refresh-styles';
    style.textContent = `
        /* Wrapper do header para alinhamento */
        .botoes-header {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        /* Botão de refresh estilizado */
        .botao-header-refresh {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 18px;
            padding: 8px 14px;
            cursor: pointer;
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            font-weight: 500;
            color: white;
            transition: all 0.3s ease;
        }

        .botao-header-refresh:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.25);
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(201, 139, 139, 0.25);
        }

        .botao-header-refresh:active {
            transform: translateY(0);
        }

        /* Ícone SVG */
        .botao-header-refresh .icone-refresh {
            width: 16px;
            height: 16px;
            stroke: white;
            stroke-width: 2.5;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
            transition: transform 0.3s ease;
        }

        .botao-header-refresh .texto-botao {
            transition: opacity 0.3s ease;
        }

        /* Animação de spin */
        .botao-header-refresh.animando .icone-refresh {
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Responsive: Mobile */
        @media (max-width: 479px) {
            .botao-header-refresh {
                padding: 8px 10px;
                border-radius: 50%;
            }

            .botao-header-refresh .texto-botao {
                display: none;
            }
        }

        /* Feedback visual global */
        .indicador-refresh {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--cor-principal, #C98B8B);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            font-weight: 500;
            display: none;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .spinner-refresh {
            display: inline-block;
            font-size: 18px;
        }
    `;
    document.head.appendChild(style);
    
    tempoUltimoRefresh = Date.now();
}

/* ================================================
   ALERTA CUSTOMIZADO GENÉRICO
   ================================================ */
async function mostrarAlertaRefresh(titulo, mensagem, tipo) {
    let overlay = document.querySelector('.alerta-overlay-refresh');
    
    if (overlay) {
        overlay.remove();
    }
    
    overlay = document.createElement('div');
    overlay.className = 'alerta-overlay-refresh';
    overlay.innerHTML = `
        <div class="alerta-card-refresh" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px 32px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            text-align: center;
            z-index: 10001;
            min-width: 280px;
        ">
            <div style="font-size: 32px; margin-bottom: 12px;">
                ${tipo === 'sucesso' ? '✅' : tipo === 'erro' ? '❌' : 'ℹ️'}
            </div>
            <h3 style="margin: 0 0 8px; font-family: 'Playfair Display', serif; color: #333;">
                ${titulo}
            </h3>
            <p style="margin: 0 0 16px; color: #666; font-family: 'Montserrat', sans-serif; font-size: 14px;">
                ${mensagem}
            </p>
            <button onclick="this.closest('.alerta-overlay-refresh').remove()" style="
                background: #C98B8B;
                color: white;
                border: none;
                padding: 10px 24px;
                border-radius: 6px;
                font-family: 'Montserrat', sans-serif;
                font-weight: 500;
                cursor: pointer;
            ">OK</button>
        </div>
        <div onclick="this.parentElement.remove()" style="
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.3);
            z-index: 10000;
        "></div>
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 3000);
}