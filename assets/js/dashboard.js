const dadosMock = {
    proximoAgendamento: null,
    aviso: null,
    configuracoes: {
        segundaAbertura: '09:00',
        segundaIntervaloInicio: '12:00',
        segundaIntervaloFim: '13:00',
        segundaFechamento: '19:00',
        sabadoAbertura: '09:00',
        sabadoFechamento: '17:00',
        domingoFechado: true,
        telefone: '',
        endereco: ''
    }
};

function inicializarDashboard() {
    const status = document.getElementById('status');

    firebase.auth().onAuthStateChanged(async (usuario) => {
        console.log('[Dashboard] Estado auth alterado, usuario:', usuario ? usuario.uid : null);

        try {
            if (!usuario) {
                status.textContent = 'Usuário não está logado. Redirecionando...';
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                return;
            }

            const usuarioResult = await firestoreService.carregarUsuario(usuario.uid);
            let dados = usuarioResult.success ? usuarioResult.data : null;

            if (!dados) {
                dados = { nome: 'Cliente' };
            }

            if (dados.role === 'admin') {
                status.textContent = 'Redirecionando para área admin...';
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                return;
            }

            status.textContent = 'Carregando configurações...';
            await carregarDadosGlobais();

            status.textContent = 'Buscando seus agendamentos...';
            await carregarProximoAgendamento(usuario.uid);

            await exibirDashboard(dados);

        } catch (erro) {
            console.error('[Dashboard] Erro na inicializacao:', erro);
            await exibirDashboard({ nome: 'Cliente' });
        }
    });
}

async function carregarDadosGlobais() {
    const [avisoResult, configResult] = await Promise.all([
        firestoreService.carregarAvisoAtivo(),
        firestoreService.carregarConfiguracoes()
    ]);

    if (avisoResult.success) {
        dadosMock.aviso = avisoResult.data;
    } else {
        dadosMock.aviso = null;
        console.error('[Dashboard] Erro ao carregar aviso:', avisoResult.error?.message);
    }

    if (configResult.success) {
        dadosMock.configuracoes = configResult.data;
    } else {
        console.error('[Dashboard] Erro ao carregar configuracoes:', configResult.error?.message);
    }
}

async function carregarProximoAgendamento(uid) {
    const resultado = await firestoreService.carregarProximoAgendamento(uid);

    if (resultado.success && resultado.data) {
        dadosMock.proximoAgendamento = {
            servico: resultado.data.servico,
            data: formatarDataBR(resultado.data.data),
            horario: resultado.data.horario
        };
    } else {
        dadosMock.proximoAgendamento = null;
        if (!resultado.success) {
            console.error('[Dashboard] Erro ao carregar proximo agendamento:', resultado.error?.message);
        }
    }
}

function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const parts = dataStr.split('-');
    if (parts.length !== 3) return dataStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function exibirDashboard(dados) {
    document.body.innerHTML = criarEstruturaDashboard(dados);

    inicializarMenuHamburger();
    inicializarEventosDashboard();

    inicializarRefreshDashboard();
}

async function inicializarRefreshDashboard() {
    await inicializarRefresh('dashboard', refreshDashboardCompleto);

    document.removeEventListener('visibilitychange', globalRefreshPage);
    document.addEventListener('visibilitychange', globalRefreshPage);

    window.globalRefreshPage = refreshDashboardCompleto;

    const header = document.querySelector('.header-dashboard');
    if (header) {
        let wrapper = header.querySelector('.botoes-header');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'botoes-header';

            const logoHeader = header.querySelector('.logo-header');
            const botaoMenu = header.querySelector('#btn-menu');

            if (logoHeader && botaoMenu) {
                header.insertBefore(wrapper, logoHeader.nextSibling);
                wrapper.appendChild(botaoMenu);
            }
        }

        adicionarBotaoRefreshHeader(header, refreshDashboardCompleto);
    }
}

async function refreshDashboardCompleto() {
    const botao = document.getElementById('btn-header-refresh');

    try {
        mostrarFeedbackRefresh(true, 'refresh');
        if (botao) {
            botao.classList.add('animando');
        }

        const usuario = await firebase.auth().currentUser;
        if (!usuario) {
            window.location.href = '../index.html';
            return;
        }

        dadosMock.proximoAgendamento = null;
        dadosMock.aviso = null;
        await carregarDadosGlobais();
        await carregarProximoAgendamento(usuario.uid);

        const usuarioResult = await firestoreService.carregarUsuario(usuario.uid);
        const dados = usuarioResult.success ? usuarioResult.data : { nome: 'Cliente' };

        document.body.innerHTML = criarEstruturaDashboard(dados);
        inicializarMenuHamburger();
        inicializarEventosDashboard();
        inicializarRefreshDashboard();

        if (botao) {
            setTimeout(() => {
                botao.classList.remove('animando');
            }, 1000);
        }

        mostrarAlertaRefresh('Atualizado', 'Dados recarregados com sucesso!', 'sucesso');

    } catch (erro) {
        console.error('[Dashboard] Erro no refresh:', erro);
        mostrarAlertaRefresh('Erro', 'Falha ao recarregar dados.', 'erro');
    } finally {
        mostrarFeedbackRefresh(false);
    }
}

function getSaudacao() {
    const hora = new Date().getHours();

    if (hora >= 5 && hora < 12) {
        return 'Bom dia';
    } else if (hora >= 12 && hora < 18) {
        return 'Boa tarde';
    } else {
        return 'Boa noite';
    }
}

function criarEstruturaDashboard(dados) {
    return `
        <header class="header-dashboard">
            <div class="logo-header">
                <img src="../data/img/Logo_JeciVieira_NailsDesigner.svg" alt="Jeci Vieira Nails" class="imagem-logo-topo">
            </div>
            <button class="botao-menu" id="btn-menu" aria-label="Abrir menu">
                <span class="linha-menu"></span>
                <span class="linha-menu"></span>
                <span class="linha-menu"></span>
            </button>
        </header>

        <main class="container-dashboard">

            <section class="boas-vindas">
                <h1 class="titulo-boas-vindas">${getSaudacao()}, ${dados.nome || 'Cliente'}!</h1>
                <p class="subtitulo-boas-vindas">Pronto para um momento de beleza?</p>
            </section>

            <section class="card-proximo-section">
                ${criarCardProximoAgendamento()}
            </section>
            <button class="botao-agendar-agora" id="btn-agendar-agora">
                Agendar agora
            </button>

            <section class="secao-avisos" id="secao-avisos">
                ${criarBannerAviso()}
            </section>

        </main>

        <footer class="rodape">
            <div class="card-rodape">
                <span class="titulo-card-rodape">Dados do Salão</span>
                <div class="card-rodape-linha">
                    <span class="icone-rodape">📍</span>
                    <span>${dadosMock.configuracoes.endereco || 'Endereço não informado'}</span>
                </div>
                <div class="card-rodape-linha">
                    <span class="icone-rodape">📞</span>
                    <span>${dadosMock.configuracoes.telefone || 'Telefone não informado'}</span>
                </div>
                <div class="card-rodape-divisor"></div>
                <div class="card-rodape-horarios">
                    <span class="titulo-rodape">Horários de Funcionamento</span>
                    <span>Seg à Sex: ${dadosMock.configuracoes.segundaAbertura || '09:00'} - ${dadosMock.configuracoes.segundaIntervaloInicio || '12:00'} / ${dadosMock.configuracoes.segundaIntervaloFim || '13:00'} - ${dadosMock.configuracoes.segundaFechamento || '19:00'}</span>
                    <span>Sábado: ${dadosMock.configuracoes.sabadoAbertura || '09:00'} - ${dadosMock.configuracoes.sabadoFechamento || '17:00'}</span>
                    <span>Domingo e Feriados: ${dadosMock.configuracoes.domingoFechado !== false ? 'Fechado' : 'Aberto'}</span>
                </div>
            </div>
        </footer>

        <div class="menu-overlay" id="menu-overlay"></div>

        <nav class="menu-hamburger" id="menu-hamburger">
            <div class="cabecalho-menu">
                <span class="titulo-menu">Menu</span>
                <button class="botao-fechar-menu" id="btn-fechar-menu" aria-label="Fechar menu">
                    ✕
                </button>
            </div>
            <div class="lista-menu">
                <a href="dashboard.html" class="item-menu">
                    <span class="icone-menu">🏠</span>
                    <span>Início</span>
                </a>
                <a href="#" class="item-menu" id="menu-agendar">
                    <span class="icone-menu">📅</span>
                    <span>Agendar Serviço</span>
                </a>
                <a href="historico.html" class="item-menu" id="menu-agendamentos">
                    <span class="icone-menu">📋</span>
                    <span>Meus Agendamentos</span>
                </a>
                <a href="perfil.html" class="item-menu" id="menu-perfil">
                    <span class="icone-menu">👤</span>
                    <span>Meu Perfil</span>
                </a>
                <a href="#" class="item-menu sair" id="menu-sair">
                    <span class="icone-menu">🚪</span>
                    <span>Sair</span>
                </a>
            </div>
        </nav>
    `;
}

function criarCardProximoAgendamento() {
    const proximo = dadosMock.proximoAgendamento;

    if (!proximo) {
        return `
            <div class="card-proximo-vazio">
                <p class="texto-proximo-vazio">
                    Você não tem nenhum agendamento agendado.
                </p>
            </div>
        `;
    }

    return `
        <div class="card-proximo">
            <p class="rotulo-proximo">Próximo Agendamento</p>
            <h3 class="servico-proximo">${proximo.servico}</h3>
            <div class="detalhes-proximo">
                <span class="detalhe-proximo">
                    <span class="icone-detalhe">📅</span>
                    <span>${proximo.data}</span>
                </span>
                <span class="detalhe-proximo">
                    <span class="icone-detalhe">🕐</span>
                    <span>${proximo.horario}</span>
                </span>
            </div>
        </div>
    `;
}

function criarBannerAviso() {
    const aviso = dadosMock.aviso;

    if (!aviso) {
        return '';
    }

    return `
        <div class="banner-aviso visivel">
            <p class="rotulo-aviso">Aviso</p>
            <p class="texto-aviso">${aviso}</p>
        </div>
    `;
}

function inicializarMenuHamburger() {
    const botaoMenu = document.getElementById('btn-menu');
    const botaoFechar = document.getElementById('btn-fechar-menu');
    const overlay = document.getElementById('menu-overlay');
    const menu = document.getElementById('menu-hamburger');

    if (botaoMenu) {
        botaoMenu.addEventListener('click', () => {
            menu.classList.add('aberto');
            overlay.classList.add('aberto');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            menu.classList.remove('aberto');
            overlay.classList.remove('aberto');
        });
    }

    if (botaoFechar) {
        botaoFechar.addEventListener('click', () => {
            menu.classList.remove('aberto');
            overlay.classList.remove('aberto');
        });
    }
}

function inicializarEventosDashboard() {
    const btnAgendarAgora = document.getElementById('btn-agendar-agora');
    if (btnAgendarAgora) {
        btnAgendarAgora.addEventListener('click', () => {
            window.location.href = 'agendamento.html';
        });
    }

    const menuAgendar = document.getElementById('menu-agendar');
    if (menuAgendar) {
        menuAgendar.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'agendamento.html';
        });
    }

    const menuPerfil = document.getElementById('menu-perfil');
    if (menuPerfil) {
        menuPerfil.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'perfil.html';
        });
    }

    const menuSair = document.getElementById('menu-sair');
    if (menuSair) {
        menuSair.addEventListener('click', async (e) => {
            e.preventDefault();
            await firebase.auth().signOut();
            window.location.href = '../index.html';
        });
    }

}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarDashboard);
} else {
    inicializarDashboard();
}
