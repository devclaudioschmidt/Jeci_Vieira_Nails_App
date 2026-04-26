/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO DASHBOARD
   JavaScript para página do cliente logado
   ================================================ */

/* ================================================
   DADOS MOCK (Serão substituídos pelo backend)
   ================================================ */
const dadosMock = {
    /* Dados do usuário logado */
    usuario: {
        nome: "Cliente",
        uid: "mock-uid-123"
    },
    
    /* Próximo agendamento do cliente */
    proximoAgendamento: null,
    
    /* Serviços disponíveis (serão lidos do Firestore) */
    servicos: [
        {
            id: "servico-01",
            nome: "Manicure",
            descricao: "Esmaltação e cuidado das unhas",
            preco: 50,
            duracao: 60,
            icone: "💅"
        },
        {
            id: "servico-02",
            nome: "Pedicure",
            descricao: "Tratamento completo dos pés",
            preco: 45,
            duracao: 60,
            icone: "🦶"
        },
        {
            id: "servico-03",
            nome: "Unhas Decoradas",
            descricao: "Arte personalizada nas unhas",
            preco: 120,
            duracao: 90,
            icone: "✨"
        },
        {
            id: "servico-04",
           Nome: "Spa dos Pés",
            descricao: "Relaxamento e hidratação",
            preco: 80,
            duracao: 45,
            icone: "🌸"
        }
    ],
    
    /* Aviso do administrador (será configurado no painel admin) */
    aviso: null,
    
    /* Configurações do salão (serão configuradas no admin) */
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

/* ================================================
   INICIALIZAÇÃO DO DASHBOARD
   Verifica autenticação e exibe dados do usuário
   ================================================ */
function inicializarDashboard() {
    const status = document.getElementById('status');
    
    /* Usa onAuthStateChanged para esperar Firebase iniciar */
    firebase.auth().onAuthStateChanged(async (usuario) => {
        console.log('[DEBUG] Estado auth alterado, usuário:', usuario);
        
        /* BACKEND IGNORADO - Usando dados mock temporariamente */
        /* Quando o backend estiverready, descomentar a lógica abaixo */
        
        /*
        try {
            if (!usuario) {
                status.textContent = 'Usuário não está logado. Redirecionando...';
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                return;
            }
            
            const doc = await firebase.firestore().collection('usuarios').doc(usuario.uid).get();
            const dados = doc.data();
            
            if (!dados) {
                status.textContent = 'Dados do usuário não encontrados.';
                return;
            }
            
            if (dados.role === 'admin') {
                status.textContent = 'Redirecionando para área admin...';
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                return;
            }
            
            // Exibe dashboard com dados reais
            await exibirDashboard(dados);
            
        } catch (erro) {
            console.error('[DEBUG] Erro:', erro);
            status.textContent = 'Erro ao carregar: ' + erro.message;
        }
        */
       
        /* Usando dados mock para desenvolvimento frontend */
        const dadosCliente = dadosMock.usuario;
        await exibirDashboard(dadosCliente);
    });
}

/* ================================================
   EXIBIR DASHBOARD
   Renderiza a página com dados do usuário
   ================================================ */
async function exibirDashboard(dados) {
    /* Substitui o card de carregamento pela dashboard */
    document.body.innerHTML = criarEstruturaDashboard(dados);
    
    /* Inicializa os componentes */
    inicializarMenuHamburger();
    inicializarEventosDashboard();
}

/* ================================================
   CRIAR ESTRUTURA HTML DA DASHBOARD
   Gera todo o HTML da página
   ================================================ */
function criarEstruturaDashboard(dados) {
    return `
        <!-- ================================================
             STRUTURA DA DASHBOARD
             ================================================ -->
        
        <!-- Header fixo -->
        <header class="header-dashboard">
            <div class="logo-header">
                <img src="../data/img/favicon.svg" alt="Jeci Vieira Nails">
                <span class="texto-logo">Jeci Nails</span>
            </div>
            <button class="botao-menu" id="btn-menu" aria-label="Abrir menu">
                <span class="linha-menu"></span>
                <span class="linha-menu"></span>
                <span class="linha-menu"></span>
            </button>
        </header>
        
        <!-- Container principal -->
        <main class="container-dashboard">
            
            <!-- Boas-vindas -->
            <section class="boas-vindas">
                <h1 class="titulo-boas-vindas">Olá, ${dados.nome}!</h1>
                <p class="subtitulo-boas-vindas">Pronto para um momento de beleza?</p>
            </section>
            
            <!-- Card Próximo Agendamento -->
            <section class="card-proximo-section">
                ${criarCardProximoAgendamento()}
            </section>
            
            <!-- Serviços Disponíveis -->
            <section class="secao-servicos">
                <h2 class="titulo-secao">Serviços Disponíveis</h2>
                ${criarGridServicos()}
                <button class="botao-ver-todos" id="btn-ver-servicos">
                    Ver todos os serviços
                </button>
            </section>
            
            <!-- Área de Avisos -->
            <section class="secao-avisos" id="secao-avisos">
                ${criarBannerAviso()}
            </section>
            
            <!-- Informações Adicionais -->
            <section class="secao-info">
                <h2 class="titulo-info">Informações</h2>
                <div class="lista-info">
                    <div class="item-info">
                        <span class="icone-info">📍</span>
                        <span class="texto-info">${dadosMock.configuracoes.endereco}</span>
                    </div>
                    <div class="item-info">
                        <span class="icone-info">📞</span>
                        <span class="texto-info">${dadosMock.configuracoes.telefone}</span>
                    </div>
                    <div class="item-info">
                        <span class="icone-info">📅</span>
                        <span class="texto-info">
                            ${dadosMock.configuracoes.domingoFechado ? 'Domingo: Fechado' : 
                            `Domingo: ${dadosMock.configuracoes.domingoAbertura || ''} às ${dadosMock.configuracoes.domingoFechamento || ''}`}
                        </span>
                    </div>
                    <div class="item-info">
                        <span class="icone-info">🕐</span>
                        <span class="texto-info">
                            Seg à Sex: ${dadosMock.configuracoes.segundaAbertura} às ${dadosMock.configuracoes.segundaIntervaloInicio} / ${dadosMock.configuracoes.segundaIntervaloFim} às ${dadosMock.configuracoes.segundaFechamento}
                        </span>
                    </div>
                    <div class="item-info">
                        <span class="icone-info">🕐</span>
                        <span class="texto-info">
                            Sábado: ${dadosMock.configuracoes.sabadoAbertura} às ${dadosMock.configuracoes.sabadoFechamento}
                        </span>
                    </div>
                </div>
            </section>
            
        </main>
        
        <!-- Overlay do menu -->
        <div class="menu-overlay" id="menu-overlay"></div>
        
        <!-- Menu hamburger -->
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
                <a href="#" class="item-menu" id="menu-agendamentos">
                    <span class="icone-menu">📋</span>
                    <span>Meus Agendamentos</span>
                </a>
                <a href="#" class="item-menu" id="menu-historico">
                    <span class="icone-menu">📜</span>
                    <span>Histórico</span>
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

/* ================================================
   CRIAR CARD PRÓXIMO AGENDAMENTO
   Gera o HTML do card ou mensagem vazia
   ================================================ */
function criarCardProximoAgendamento() {
    const proximo = dadosMock.proximoAgendamento;
    
    if (!proximo) {
        return `
            <div class="card-proximo-vazio">
                <p class="texto-proximo-vazio">
                    Você não tem nenhum agendamento agendado.
                </p>
                <button class="botao-agendar-agora" id="btn-agendar-agora">
                    Agendar agora
                </button>
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

/* ================================================
   CRIAR GRID DE SERVIÇOS
   Gera oHTML dos cards de serviços
   ================================================ */
function criarGridServicos() {
    const servicos = dadosMock.servicos;
    let html = '<div class="grid-servicos">';
    
    servicos.forEach(servico => {
        html += `
            <div class="card-servico" data-id="${servico.id}">
                <span class="icone-servico">${servico.icone}</span>
                <p class="nome-servico">${servico.nome}</p>
                <p class="preco-servico">R$ ${servico.preco}</p>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/* ================================================
   CRIAR BANNER DE AVISO
   Gera o HTML do banner de avisos
   ================================================ */
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

/* ================================================
   INICIALIZAR MENU HAMBURGER
   Configura eventos do menu lateral
   ================================================ */
function inicializarMenuHamburger() {
    const botaoMenu = document.getElementById('btn-menu');
    const botaoFechar = document.getElementById('btn-fechar-menu');
    const overlay = document.getElementById('menu-overlay');
    const menu = document.getElementById('menu-hamburger');
    
    /* Abre o menu */
    botaoMenu.addEventListener('click', () => {
        menu.classList.add('aberto');
        overlay.classList.add('aberto');
    });
    
    /* Fecha o menu ao clicar no overlay */
    overlay.addEventListener('click', () => {
        menu.classList.remove('aberto');
        overlay.classList.remove('aberto');
    });
    
    /* Fecha o menu ao clicar no botão fechar */
    botaoFechar.addEventListener('click', () => {
        menu.classList.remove('aberto');
        overlay.classList.remove('aberto');
    });
}

/* ================================================
   INICIALIZAR EVENTOS DA DASHBOARD
   Configura cliques dos botões
   ================================================ */
function inicializarEventosDashboard() {
    /* Botão Agendar agora */
    const btnAgendarAgora = document.getElementById('btn-agendar-agora');
    if (btnAgendarAgora) {
        btnAgendarAgora.addEventListener('click', () => {
            window.location.href = 'agendamento.html';
        });
    }
    
    /* Menu Agendar */
    const menuAgendar = document.getElementById('menu-agendar');
    if (menuAgendar) {
        menuAgendar.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'agendamento.html';
        });
    }
    
    /* Menu Sair */
    const menuSair = document.getElementById('menu-sair');
    if (menuSair) {
        menuSair.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('[DEBUG] Fazendo logout...');
            
            /* BACKEND IGNORADO - Simulação de logout */
            /* Quando ofirebaseestiverready, descomentar: */
            // await firebase.auth().signOut();
            
            window.location.href = '../index.html';
        });
    }
    
    /* Cards de serviços (clique para agendar) */
    const cardsServico = document.querySelectorAll('.card-servico');
    cardsServico.forEach(card => {
        card.addEventListener('click', () => {
            const servicoId = card.dataset.id;
            console.log('[DEBUG] Selecionar serviço:', servicoId);
            // Futuro: redirecionar para agendamento com serviço selecionado
        });
    });
}