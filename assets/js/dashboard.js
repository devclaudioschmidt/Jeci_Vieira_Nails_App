/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO DASHBOARD
   JavaScript para página do cliente logado
   ================================================ */

/* ================================================
   DADOS MOCK / ESTADO GLOBAL
   ================================================ */
const dadosMock = {
    proximoAgendamento: null,
    servicos: [],
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

/* ================================================
   INICIALIZAÇÃO DO DASHBOARD
   Verifica autenticação e exibe dados do usuário
   ================================================ */
function inicializarDashboard() {
    const status = document.getElementById('status');
    
    firebase.auth().onAuthStateChanged(async (usuario) => {
        console.log('[DEBUG] Estado auth alterado, usuário:', usuario);
        
        try {
            if (!usuario) {
                status.textContent = 'Usuário não está logado. Redirecionando...';
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                return;
            }
            
            /* Buscar dados do usuário no Firestore */
            const doc = await firebase.firestore().collection('usuarios').doc(usuario.uid).get();
            let dados = doc.data();
            
            if (!dados) {
                dados = { nome: 'Cliente' };
            }
            
            /* Redireciona se for admin */
            if (dados.role === 'admin') {
                status.textContent = 'Redirecionando para área admin...';
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                return;
            }

            /* BUSCA DADOS REAIS DO BANCO */
            status.textContent = 'Carregando configurações...';
            await carregarDadosGlobais();
            
            status.textContent = 'Buscando seus agendamentos...';
            await carregarProximoAgendamento(usuario.uid);
            
            /* Exibe dashboard com dados reais */
            await exibirDashboard(dados);
            
        } catch (erro) {
            console.error('[DEBUG] Erro na inicialização:', erro);
            await exibirDashboard({ nome: 'Cliente' });
        }
    });
}

/* ================================================
   BUSCAR DADOS DO FIRESTORE (AVISOS, CONFIGS, SERVIÇOS)
   ================================================ */
async function carregarDadosGlobais() {
    try {
        // 1. Carregar Aviso Ativo
        const avisoSnap = await firebase.firestore().collection('avisos')
            .where('ativo', '==', true)
            .limit(1)
            .get();
        
        if (!avisoSnap.empty) {
            dadosMock.aviso = avisoSnap.docs[0].data().mensagem;
        } else {
            dadosMock.aviso = null;
        }

        // 2. Carregar Configurações do Salão
        const configSnap = await firebase.firestore().collection('configuracoes').doc('salao').get();
        if (configSnap.exists) {
            dadosMock.configuracoes = { ...dadosMock.configuracoes, ...configSnap.data() };
        }

        // 3. Carregar Serviços Ativos
        const servicosSnap = await firebase.firestore().collection('servicos')
            .where('ativo', '==', true)
            .get();
        
        if (!servicosSnap.empty) {
            dadosMock.servicos = servicosSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

    } catch (erro) {
        console.error('[DEBUG] Erro ao carregar dados globais:', erro);
    }
}

/* ================================================
   BUSCAR PRÓXIMO AGENDAMENTO DO CLIENTE
   ================================================ */
async function carregarProximoAgendamento(uid) {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        const snap = await firebase.firestore().collection('agendamentos')
            .where('clienteId', '==', uid)
            .where('status', 'in', ['pendente', 'confirmado'])
            .get();
            
        if (!snap.empty) {
            const agendamentos = snap.docs.map(doc => doc.data());
            
            // Filtrar apenas datas futuras ou hoje
            const futuros = agendamentos.filter(a => a.data >= hoje);
            
            if (futuros.length > 0) {
                // Ordenar por data e horário para pegar o mais próximo
                const proximo = futuros.sort((a, b) => 
                    a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)
                )[0];
                
                dadosMock.proximoAgendamento = {
                    servico: proximo.servicoNome,
                    data: formatarDataBR(proximo.data),
                    horario: proximo.horario
                };
            } else {
                dadosMock.proximoAgendamento = null;
            }
        } else {
            dadosMock.proximoAgendamento = null;
        }
    } catch (erro) {
        console.error('[DEBUG] Erro ao carregar agendamento:', erro);
        dadosMock.proximoAgendamento = null;
    }
}

/* ================================================
   UTILITÁRIO: FORMATAR DATA PARA BR
   ================================================ */
function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const parts = dataStr.split('-');
    if (parts.length !== 3) return dataStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
   SAUDAÇÃO POR PERÍODO
   Retorna boa manhã/tarde/noite conforme horário
   ================================================ */
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

/* ================================================
   CRIAR ESTRUTURA HTML DA DASHBOARD
   Gera todo o HTML da página
   ================================================ */
function criarEstruturaDashboard(dados) {
    return `
        <!-- Header fixo -->
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
        
        <!-- Container principal -->
        <main class="container-dashboard">
            
            <!-- Boas-vindas -->
            <section class="boas-vindas">
                <h1 class="titulo-boas-vindas">${getSaudacao()}, ${dados.nome}!</h1>
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
            
            <!-- Rodapé com informações em card -->
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
                        <span>Domingo e Feriados: ${dadosMock.configuracoes.domingoFechado ? 'Fechado' : 'Aberto'}</span>
                    </div>
                </div>
            </footer>
            
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
   Gera o HTML dos cards de serviços
   ================================================ */
function criarGridServicos() {
    const servicos = dadosMock.servicos;
    
    if (servicos.length === 0) {
        return '<p class="texto-vazio" style="text-align: center; padding: 20px;">Nenhum serviço disponível no momento.</p>';
    }

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

/* ================================================
   INICIALIZAR EVENTOS DA DASHBOARD
   Configura cliques dos botões
   ================================================ */
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
    
    const cardsServico = document.querySelectorAll('.card-servico');
    cardsServico.forEach(card => {
        card.addEventListener('click', () => {
            const servicoId = card.dataset.id;
            console.log('[DEBUG] Selecionar serviço:', servicoId);
            window.location.href = `agendamento.html?servico=${servicoId}`;
        });
    });
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarDashboard);
} else {
    inicializarDashboard();
}