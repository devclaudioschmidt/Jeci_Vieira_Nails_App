/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO ADMIN
   Painel administrativo completo
   ================================================ */

/* ================================================
   SAUDAÇÃO POR PERÍODO
   Retorna bom dia/boa tarde/boa noite conforme horário
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
   WHATSAPP HELPER
   ================================================ */
function gerarLinkWhatsApp(telefone, mensagem) {
    if (!telefone) return null;
    const numero = telefone.replace(/\D/g, '');
    const numeroCompleto = numero.startsWith('55') ? numero : '55' + numero;
    const texto = encodeURIComponent(mensagem);
    return `https://wa.me/${numeroCompleto}?text=${texto}`;
}


/* ================================================
   VARIÁVEIS GLOBAIS
   ================================================ */
let dadosAdmin = {};
let servicos = [];
let configuracoes = {};
let avisoAtivo = null;
let servicoEditando = null;
let clientes = [];
let clientesFiltrados = [];
let horariosBloqueados = [];

/* Variáveis do Calendário */
let dataAtual = new Date();
let dataSelecionada = new Date();
let agendamentos = [];
let diasComAgendamentos = [];

/* ================================================
   SISTEMA DE VERIFICAÇÃO AUTOMÁTICA (POLLING)
   Verifica novos agendamentos pendentes automaticamente
   ================================================ */
let ultimoCheck = null;
let intervaloCheck = 30000; // 30 segundos
let jaNotificou = false;

function iniciarVerificacaoAutomatica() {
    ultimoCheck = Date.now();
    
    // Iniciar verificação periódica
    setInterval(verificarNovosAgendamentos, intervaloCheck);
    console.log('[DEBUG] Verificação automática iniciada a cada 30s');
}

async function verificarNovosAgendamentos() {
    try {
        const db = firebase.firestore();
        
        // Buscar agendamentos criados desde o último check
        const timestampAnterior = new Date(ultimoCheck);
        
        const snapshot = await db.collection('agendamentos')
            .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(timestampAnterior))
            .where('status', 'in', ['pendente', null])
            .get();
        
        if (!snapshot.empty) {
            const novos = snapshot.docs.filter(doc => {
                const data = doc.data();
                const created = data.createdAt ? data.createdAt.toMillis() : 0;
                return created > ultimoCheck;
            });
            
            if (novos.length > 0 && !jaNotificou) {
                // Atualizar badge
                atualizarBadgePendentes();
                
                // Mostrar notificação visual
                mostrarNotificacaoNova(novos.length);
                
                jaNotificou = true;
                
                // Reset após 5 minutos para permitir nova notificação
                setTimeout(() => {
                    jaNotificou = false;
                }, 300000);
            }
        }
        
        // Atualizar timestamp
        ultimoCheck = Date.now();
        
    } catch (erro) {
        console.error('[DEBUG] Erro na verificação automática:', erro);
    }
}

/* ================================================
   FUNÇÕES UTILITÁRIAS
   ================================================ */
// Pegar ID do elemento pai (card)
function pegarIdDoPai(evento, seletor) {
    const elemento = evento.target.closest(seletor);
    return elemento ? elemento.dataset.id : null;
}

// Pegar índice do elemento pai
function pegarIndiceDoPai(evento, seletor) {
    const elemento = evento.target.closest(seletor);
    return elemento ? parseInt(elemento.dataset.index) : null;
}

/* ================================================
   SISTEMA DE MODAIS
   ================================================ */
function criarModal() {
    const existing = document.getElementById('modal-customizado');
    if (existing) return existing;
    
    const modal = document.createElement('div');
    modal.id = 'modal-customizado';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-card">
            <span class="modal-icon"></span>
            <h3 class="modal-titulo"></h3>
            <p class="modal-mensagem"></p>
            <div class="modal-botoes"></div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (modal.dataset.clickOutside !== 'false') {
                modal.classList.remove('ativo');
            }
        }
    });
    
    return modal;
}

function mostrarAlerta(titulo, mensagem, tipo = 'info') {
    return new Promise((resolve) => {
        const modal = criarModal();
        
        const icons = {
            sucesso: '✅',
            erro: '❌',
            alerta: '⚠️',
            info: 'ℹ️',
            bloq: '🔒'
        };
        
        const btnStyles = {
            sucesso: 'primario',
            erro: 'danger',
            alerta: 'secundario',
            info: 'primario',
            bloq: 'primario'
        };
        
        modal.querySelector('.modal-icon').textContent = icons[tipo] || icons.info;
        modal.querySelector('.modal-titulo').textContent = titulo;
        modal.querySelector('.modal-mensagem').innerHTML = mensagem;
        modal.querySelector('.modal-botoes').innerHTML = `
            <button class="modal-botao ${btnStyles[tipo] || 'primario'}" id="modal-ok">OK</button>
        `;
        
        modal.dataset.clickOutside = 'false';
        modal.classList.add('ativo');
        
        document.getElementById('modal-ok').addEventListener('click', () => {
            modal.classList.remove('ativo');
            resolve(true);
        });
    });
}

function mostrarConfirm(titulo, mensagem, tipo = 'alerta') {
    return new Promise((resolve) => {
        const modal = criarModal();
        
        const icons = {
            sucesso: '✅',
            alerta: '⚠️',
            erro: '❌',
            bloque: '🔒',
            danger: '⚠️'
        };
        
        const primaryBtn = tipo === 'danger' || tipo === 'bloque' ? 'danger' : 'primario';
        
        modal.querySelector('.modal-icon').textContent = icons[tipo] || icons.alerta;
        modal.querySelector('.modal-titulo').textContent = titulo;
        modal.querySelector('.modal-mensagem').innerHTML = mensagem;
        modal.querySelector('.modal-botoes').innerHTML = `
            <button class="modal-botao secundario" id="modal-cancelar">Cancelar</button>
            <button class="modal-botao ${primaryBtn}" id="modal-confirmar">Confirmar</button>
        `;
        
        modal.dataset.clickOutside = 'false';
        modal.classList.add('ativo');
        
        const btnCancelar = document.getElementById('modal-cancelar');
        const btnConfirmar = document.getElementById('modal-confirmar');
        
        const cleanup = () => {
            modal.classList.remove('ativo');
        };
        
        btnCancelar.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });
        
        btnConfirmar.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });
    });
}

/* Nomes dos meses */
const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/* Nomes dos dias da semana */
const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/* ================================================
   ABRIR MODAL DE DETALHES DO AGENDAMENTO
   ================================================ */
async function abrirModalDetalhesAgendamento(id) {
    const agendamento = agendamentos.find(a => a.id === id);
    if (!agendamento) return;
    
    const clienteObj = clientes.find(c => c.id === agendamento.userId);
    const nomeCliente = clienteObj ? clienteObj.nome : (agendamento.clienteNome || 'Cliente');
    const telefoneCliente = clienteObj ? clienteObj.telefone : '';
    const emailCliente = clienteObj ? clienteObj.email : '';
    
    const statusTexto = agendamento.status === 'confirmado' ? 'Confirmado' :
                        agendamento.status === 'cancelado' ? 'Cancelado' : 'Pendente';
    const statusClass = agendamento.status === 'confirmado' ? '#27ae60' :
                        agendamento.status === 'cancelado' ? '#e74c3c' : '#f39c12';
    
    const modal = criarModal();
    
    modal.querySelector('.modal-icon').textContent = '📅';
    modal.querySelector('.modal-titulo').textContent = 'Detalhes do Agendamento';
    modal.querySelector('.modal-mensagem').innerHTML = `
        <div style="text-align: left; font-size: 0.9rem;">
            <p><strong>Cliente:</strong> ${nomeCliente}</p>
            <p><strong>Telefone:</strong> ${telefoneCliente || 'Não informado'}</p>
            <p><strong>Email:</strong> ${emailCliente || 'Não informado'}</p>
            <hr style="margin: 12px 0; border: none; border-top: 1px solid #eee;">
            <p><strong>Serviço:</strong> ${agendamento.servico || agendamento.servicoNome}</p>
            <p><strong>Data:</strong> ${formatarData(agendamento.data)}</p>
            <p><strong>Horário:</strong> ${agendamento.horario} (${agendamento.duracao || 60} min)</p>
            <p><strong>Valor:</strong> R$ ${parseFloat(agendamento.preco || 0).toFixed(2).replace('.', ',')}</p>
            <p><strong>Status:</strong> <span style="color: ${statusClass}; font-weight: 600;">${statusTexto}</span></p>
            ${agendamento.observacoes ? `<p><strong>Observações:</strong> ${agendamento.observacoes}</p>` : ''}
        </div>
    `;
    
    const ehCancelado = agendamento.status === 'cancelado';
    const ehPassado = agendamento.data < new Date().toISOString().split('T')[0];
    
    modal.querySelector('.modal-botoes').innerHTML = `
        <button class="modal-botao secundario" id="modal-fechar-detalhes">Fechar</button>
        ${!ehCancelado && !ehPassado ? `
        <button class="modal-botao danger" id="modal-cancelar-agend">Cancelar</button>
        ` : ''}
    `;
    
    modal.classList.add('ativo');
    
    // Evento Fechar
    document.getElementById('modal-fechar-detalhes').addEventListener('click', () => {
        modal.classList.remove('ativo');
    });
    
    // Evento Cancelar
    const btnCancelar = document.getElementById('modal-cancelar-agend');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', async () => {
            modal.classList.remove('ativo');
            await cancelarAgendamento(id);
        });
    }
}

/* ================================================
   FORMATAR DATA
   ================================================ */
function formatarData(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

/* ================================================
   INICIALIZAÇÃO DO ADMIN
   Verifica autenticação e carrega dados
   ================================================ */
function inicializarAdmin() {
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
            
            console.log('[DEBUG] UID do usuário:', usuario.uid);
            
            const doc = await firebase.firestore().collection('usuarios').doc(usuario.uid).get();
            const dados = doc.data();
            
            console.log('[DEBUG] Dados do usuário:', dados);
            
            if (!doc.exists || !dados) {
                console.error('[DEBUG] Documento do usuário não encontrado');
                status.textContent = 'Dados do usuário não encontrados.请联系 o suporte.';
                return;
            }
            
            if (dados.role !== 'admin') {
                console.warn('[DEBUG] Usuário não é admin. Role:', dados.role);
                status.textContent = 'Acesso restrito. Redirecionando...';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                return;
            }
            
            dadosAdmin = dados;
            
            await carregarDadosFirestore();
            exibirAdmin(dados);
            
        } catch (erro) {
            console.error('[DEBUG] Erro:', erro);
            status.textContent = 'Erro ao carregar: ' + erro.message;
        }
    });
}

/* ================================================
   CARREGAR DADOS DO FIRESTORE
   Carrega serviços, configurações e avisos
   ================================================ */
async function carregarDadosFirestore() {
    try {
        console.log('[DEBUG] Carregando dados do Firestore...');
        
        const servicosSnap = await firebase.firestore()
            .collection('servicos')
            .orderBy('nome')
            .get();
        
        servicos = servicosSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('[DEBUG] Serviços carregados:', servicos.length);
        
        const configSnap = await firebase.firestore()
            .collection('configuracoes')
            .doc('salao')
            .get();
        
        configuracoes = configSnap.data() || {
            segundaAbertura: '09:00',
            segundaIntervaloInicio: '12:00',
            segundaIntervaloFim: '13:00',
            segundaFechamento: '19:00',
            sabadoAbertura: '09:00',
            sabadoFechamento: '17:00',
            domingoFechado: true,
            telefone: '',
            endereco: '',
            tempoEntreAgendamentos: 15,
            horariosBloqueados: []
        };
        
        horariosBloqueados = configuracoes.horariosBloqueados || [];
        
        console.log('[DEBUG] Configurações carregadas:', configuracoes);
        console.log('[DEBUG] Horários bloqueados carregados:', horariosBloqueados);
        
        const avisoSnap = await firebase.firestore()
            .collection('avisos')
            .where('ativo', '==', true)
            .limit(1)
            .get();
        
        if (!avisoSnap.empty) {
            avisoAtivo = {
                id: avisoSnap.docs[0].id,
                ...avisoSnap.docs[0].data()
            };
        } else {
            avisoAtivo = null;
        }
        
        console.log('[DEBUG] Aviso ativo:', avisoAtivo);
        
        const clientesSnap = await firebase.firestore()
            .collection('usuarios')
            .where('role', '==', 'cliente')
            .orderBy('nome')
            .get();
        
        clientes = clientesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        clientesFiltrados = [...clientes];
        console.log('[DEBUG] Clientes carregados:', clientes.length);
        
        // Carregar agendamentos (últimos 50 - regras-firestore.md)
        try {
            const dataInicio = new Date();
            dataInicio.setMonth(dataInicio.getMonth() - 2);
            const dataStrInicio = dataInicio.toISOString().split('T')[0];
            
            const agendamentosSnap = await firebase.firestore()
                .collection('agendamentos')
                .where('data', '>=', dataStrInicio)
                .orderBy('data', 'desc')
                .limit(50)
                .get();
            
            agendamentos = agendamentosSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenar localmente para evitar obrigatoriedade de Índice Composto
            agendamentos.sort((a, b) => {
                if (a.data === b.data) {
                    return a.horario.localeCompare(b.horario);
                }
                return a.data.localeCompare(b.data);
            });
            
            // Criar lista de dias com agendamentos
            diasComAgendamentos = [...new Set(agendamentos.map(a => a.data))];
            console.log('[DEBUG] Agendamentos carregados:', agendamentos.length);
        } catch (e) {
            console.error('[DEBUG] Erro ao carregar agendamentos:', e);
            agendamentos = [];
            diasComAgendamentos = [];
        }
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao carregar dados:', erro);
        servicos = [];
        configuracoes = {
            segundaAbertura: '09:00',
            segundaIntervaloInicio: '12:00',
            segundaIntervaloFim: '13:00',
            segundaFechamento: '19:00',
            sabadoAbertura: '09:00',
            sabadoFechamento: '17:00',
            domingoFechado: true,
            telefone: '',
            endereco: '',
            tempoEntreAgendamentos: 15
        };
        avisoAtivo = null;
        clientes = [];
        clientesFiltrados = [];
    }
}

/* ================================================
   EXIBIR ADMIN
   Renderiza o painel completo
   ================================================ */
function exibirAdmin(dados) {
    document.body.innerHTML = criarEstruturaAdmin(dados);
    inicializarMenuHamburger();
    inicializarEventos();
    inicializarCalendario();
    renderizarCalendario();
    renderizarSolicitacoes();
    renderizarConfirmacoes();
    renderizarListaServicos();
    renderizarConfiguracoes();
    renderizarAviso();
    renderizarListaClientes();
}

/* ================================================
   CRIAR ESTRUTURA HTML
   ================================================ */
function criarEstruturaAdmin(dados) {
    return `
        <!-- Header fixo -->
        <header class="header-admin">
            <div class="logo-header">
                <img src="../data/img/Logo_JeciVieira_NailsDesigner.svg" alt="Jeci Vieira Nails" class="imagem-logo-topo">
            </div>
            <div class="botoes-header">
                <button class="botao-atualizar" id="btn-atualizar" aria-label="Atualizar dados">🔄</button>
                <button class="botao-menu" id="btn-menu" aria-label="Abrir menu">
                    <span class="linha-menu"></span>
                    <span class="linha-menu"></span>
                    <span class="linha-menu"></span>
                </button>
            </div>
        </header>
        
        <!-- Container principal -->
        <main class="container-admin">
            
            <!-- Boas-vindas -->
            <section class="boas-vindas-admin">
                <span class="badge-admin">ADMINISTRADOR</span>
                <h1 class="titulo-boas-vindas">${getSaudacao()}, ${dados.nome}!</h1>
                <p class="subtitulo-boas-vindas">Gerencie os dados do salão</p>
</section>
            
            <!-- Área de conteúdo (exibe a seção selecionada) -->
            <main class="conteudo-admin" id="conteudo-admin">
                
                <!-- Seção Solicitações -->
                <section class="secao" id="secao-solicitacoes">
                    <h2 class="titulo-secao">Solicitações Pendentes</h2>
                    <div class="lista-agendamentos" id="lista-solicitacoes">
                        <!-- Solicitações serão renderizadas aqui -->
                    </div>
                </section>

                <!-- Seção Confirmações -->
                <section class="secao" id="secao-confirmacoes">
                    <h2 class="titulo-secao">Confirmações - Próximo Dia</h2>
                    <p style="color: var(--cor-texto-suave); margin-bottom: 16px;">Agendamentos dos próximos dias que precisam de confirmação de presença.</p>
                    <div class="lista-agendamentos" id="lista-confirmacoes">
                        <!-- Confirmações serão renderizadas aqui -->
                    </div>
                </section>

                <!-- Seção Agenda (padrão) -->
                <section class="secao ativa" id="secao-agenda">
                    <h2 class="titulo-secao">Agenda do Dia</h2>
                    
                    <!-- Calendário -->
                    <div class="calendario-container">
                        <div class="calendario-header">
                            <button class="botao-nav-calendario" id="btn-mes-anterior">◀</button>
                            <span class="mes-atual" id="mes-agenda">Abril 2025</span>
                            <button class="botao-nav-calendario" id="btn-mes-proximo">▶</button>
                        </div>
                        <div class="dias-semana">
                            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                        </div>
                        <div class="dias-calendario" id="dias-calendario">
                            <!-- Dias serão renderizados aqui -->
                        </div>
                    </div>
                    
                    <!-- Lista de agendamentos do dia selecionado -->
                    <h3 class="titulo-data" id="titulo-data-selecionada">26 de Abril de 2025</h3>
                    <div class="lista-agendamentos" id="lista-agendamentos">
                        <!-- Agendamentos serão renderizados aqui -->
                    </div>
                </section>
                
                <!-- Seção Serviços -->
                <section class="secao" id="secao-servicos">
                    <h2 class="titulo-secao">Gerenciar Serviços</h2>
                    <div class="lista-servicos" id="lista-servicos">
                        <!-- Lista de serviços será renderizada aqui -->
                    </div>
                    <button class="botao-adicionar" id="btn-novo-servico">
                        <span>+</span> Adicionar Serviço
                    </button>
                </section>
            
                <!-- Seção Clientes -->
                <section class="secao" id="secao-clientes">
                    <h2 class="titulo-secao">Lista de Clientes</h2>
                    
                    <div class="campo-busca">
                        <input type="text" class="input-campo" id="busca-cliente" 
                            placeholder="Buscar cliente por nome ou telefone...">
                    </div>
                    
                    <div class="lista-clientes" id="lista-clientes">
                        <!-- Lista de clientes será renderizada aqui -->
                    </div>
                </section>
                
                <!-- Seção Avisos -->
                <section class="secao" id="secao-avisos">
                    <h2 class="titulo-secao">Mensagem aos Clientes</h2>
                    
                    <div class="formulario">
                        <div class="area-aviso">
                            <label class="label-campo">Mensagem</label>
                            <textarea class="textarea-aviso" id="aviso-texto" 
                                placeholder="Digite uma mensagem para exibir na dashboard dos clientes..."
                                maxlength="300">${avisoAtivo ? avisoAtivo.mensagem : ''}</textarea>
                            <span class="contador-caracteres" id="contador-aviso">
                                ${(avisoAtivo ? avisoAtivo.mensagem : '').length}/300
                            </span>
                        </div>
                        
                        <div class="switch-container">
                            <span class="switch-label">Exibir mensagem</span>
                            <label class="switch">
                                <input type="checkbox" id="aviso-ativo" 
                                    ${avisoAtivo && avisoAtivo.ativo ? 'checked' : ''}>
                                <span class="slider-switch"></span>
                            </label>
                        </div>
                        
                        <button class="botao-adicionar" id="btn-salvar-aviso">
                            Salvar Aviso
                        </button>
                    </div>
                </section>
                
                <!-- Seção Bloqueios -->
                <section class="secao" id="secao-bloqueios">
                    <h2 class="titulo-secao">Bloqueios de Horários</h2>
                    <p style="font-size: 0.85rem; color: #6B6B6B; margin-bottom: 16px;">
                        Bloqueie horários específicos quando você não puder atender clientes.
                    </p>
                    
                    <div class="formulario">
                        <div class="campo-config">
                            <span class="rotulo-config">Data</span>
                            <input type="date" class="input-config" id="bloqueio-data">
                        </div>
                        
                        <div class="campo-config">
                            <span class="rotulo-config">Hora Início</span>
                            <input type="time" class="input-config" id="bloqueio-inicio">
                        </div>
                        
                        <div class="campo-config">
                            <span class="rotulo-config">Hora Fim</span>
                            <input type="time" class="input-config" id="bloqueio-fim">
                        </div>
                        
                        <div class="campo-config">
                            <span class="rotulo-config">Motivo (opcional)</span>
                            <input type="text" class="input-config" id="bloqueio-motivo" 
                                placeholder="Ex: Consulta médica">
                        </div>
                        
                        <button class="botao-adicionar" id="btn-bloquear-horario">
                            Bloquear Horário
                        </button>
                    </div>
                    
                    <h3 style="font-size: 1rem; margin: 24px 0 16px 0; color: #333;">Horários Bloqueados</h3>
                    <div id="lista-bloqueios"></div>
                </section>
            
                <!-- Seção Configurações -->
                <section class="secao" id="secao-configuracoes">
                <h2 class="titulo-secao">Configurações do Salão</h2>
                
                <p style="font-size: 0.85rem; color: #6B6B6B; margin-bottom: 16px; font-weight: 500;">
                    Segunda a Sexta
                </p>
                
                <div class="campo-config">
                    <span class="rotulo-config">Abertura</span>
                    <input type="time" class="input-config" id="config-segunda-abertura" 
                        value="${configuracoes.segundaAbertura || '09:00'}">
                </div>
                
                <div class="campo-config">
                    <span class="rotulo-config">Intervalo Início</span>
                    <input type="time" class="input-config" id="config-segunda-intervalo-inicio" 
                        value="${configuracoes.segundaIntervaloInicio || '12:00'}">
                </div>
                
                <div class="campo-config">
                    <span class="rotulo-config">Intervalo Fim</span>
                    <input type="time" class="input-config" id="config-segunda-intervalo-fim" 
                        value="${configuracoes.segundaIntervaloFim || '13:00'}">
                </div>
                
                <div class="campo-config">
                    <span class="rotulo-config">Fechamento</span>
                    <input type="time" class="input-config" id="config-segunda-fechamento" 
                        value="${configuracoes.segundaFechamento || '19:00'}">
                </div>
                
                <p style="font-size: 0.85rem; color: #6B6B6B; margin: 20px 0 16px 0; font-weight: 500;">
                    Sábado
                </p>
                
                <div class="campo-config">
                    <span class="rotulo-config">Abertura</span>
                    <input type="time" class="input-config" id="config-sabado-abertura" 
                        value="${configuracoes.sabadoAbertura || '09:00'}">
                </div>
                
                <div class="campo-config">
                    <span class="rotulo-config">Fechamento</span>
                    <input type="time" class="input-config" id="config-sabado-fechamento" 
                        value="${configuracoes.sabadoFechamento || '17:00'}">
                </div>
                
                <p style="font-size: 0.85rem; color: #6B6B6B; margin: 20px 0 16px 0; font-weight: 500;">
                    Domingo
                </p>
                
                <div class="campo-config">
                    <span class="rotulo-config">Fechado</span>
                    <label class="switch">
                        <input type="checkbox" id="config-domingo-fechado" 
                            ${configuracoes.domingoFechado === false ? '' : 'checked'}>
                        <span class="slider-switch"></span>
                    </label>
                </div>
                
                <p style="font-size: 0.85rem; color: #6B6B6B; margin: 20px 0 16px 0; font-weight: 500;">
                    Contato
                </p>
                
                <div class="campo-config">
                    <span class="rotulo-config">Telefone</span>
                    <input type="tel" class="input-config" id="config-telefone" 
                        value="${configuracoes.telefone || ''}" 
                        placeholder="(11) 99999-9999"
                        inputmode="tel">
                </div>
                
                <div class="campo-config">
                    <span class="rotulo-config">Endereço</span>
                    <input type="text" class="input-config" id="config-endereco" 
                        value="${configuracoes.endereco || ''}" placeholder="Rua, número, bairro">
                </div>
                
                <div class="campo-config">
                    <span class="rotulo-config">Tempo entre serviços (min)</span>
                    <input type="number" class="input-config" id="config-tempo" 
                        value="${configuracoes.tempoEntreAgendamentos || 15}" 
                        min="0" max="60">
                </div>
                
                <button class="botao-adicionar" id="btn-salvar-config" style="margin-top: 12px;">
                    Salvar Configurações
                </button>
            </section>
            
        </main>
        
        <!-- Rodapé com informações em card -->
        <footer class="rodape">
            <div class="card-rodape">
                <span class="titulo-card-rodape">Dados do Salão</span>
                <div class="card-rodape-linha">
                    <span class="icone-rodape">📍</span>
                    <span>${configuracoes.endereco || 'Endereço não informado'}</span>
                </div>
                <div class="card-rodape-linha">
                    <span class="icone-rodape">📞</span>
                    <span>${configuracoes.telefone || 'Telefone não informado'}</span>
                </div>
                <div class="card-rodape-divisor"></div>
                <div class="card-rodape-horarios">
                    <span class="titulo-rodape">Horários de Funcionamento</span>
                    <span>Seg à Sex: ${configuracoes.segundaAbertura || '09:00'} - ${configuracoes.segundaIntervaloInicio || '12:00'} / ${configuracoes.segundaIntervaloFim || '13:00'} - ${configuracoes.segundaFechamento || '19:00'}</span>
                    <span>Sábado: ${configuracoes.sabadoAbertura || '09:00'} - ${configuracoes.sabadoFechamento || '17:00'}</span>
                    <span>Domingo e Feriados: ${configuracoes.domingoFechado ? 'Fechado' : 'Aberto'}</span>
                </div>
            </div>
        </footer>
        
        <!-- Overlay do menu -->
        <div class="menu-overlay" id="menu-overlay"></div>
        
        <!-- Menu hamburger -->
        <nav class="menu-hamburger" id="menu-hamburger">
            <div class="cabecalho-menu">
                <span class="titulo-menu">Menu</span>
                <button class="botao-fechar-menu" id="btn-fechar-menu">
                    ✕
                </button>
            </div>
            <div class="lista-menu">
                <div class="menu-secao">
                    <span class="titulo-secao-menu">Navegação</span>
                </div>
                <a href="#" class="item-menu" data-nav="solicitacoes">
                    <span class="icone-menu">🔔</span>
                    <span>Solicitações</span>
                    <span class="badge-notificacao" id="badge-solicitacoes" style="display:none;">0</span>
                </a>
                <a href="#" class="item-menu" data-nav="confirmacoes">
                    <span class="icone-menu">✅</span>
                    <span>Confirmações</span>
                    <span class="badge-notificacao" id="badge-confirmacoes" style="display:none;">0</span>
                </a>
                <a href="#" class="item-menu ativo" data-nav="agenda">
                    <span class="icone-menu">📅</span>
                    <span>Agenda</span>
                </a>
                <a href="#" class="item-menu" data-nav="servicos">
                    <span class="icone-menu">💅</span>
                    <span>Serviços</span>
                </a>
                <a href="#" class="item-menu" data-nav="clientes">
                    <span class="icone-menu">👥</span>
                    <span>Clientes</span>
                </a>
                <a href="admin-agendamento.html" class="item-menu" id="menu-agendar-cliente">
                    <span class="icone-menu">📝</span>
                    <span>Agendar para Cliente</span>
                </a>
                <a href="#" class="item-menu" data-nav="avisos">
                    <span class="icone-menu">📢</span>
                    <span>Avisos</span>
                </a>
                <a href="#" class="item-menu" data-nav="bloqueios">
                    <span class="icone-menu">🔒</span>
                    <span>Bloqueios</span>
                </a>
                <a href="#" class="item-menu" data-nav="configuracoes">
                    <span class="icone-menu">⚙️</span>
                    <span>Configurações</span>
                </a>
                <div class="menu-divisor"></div>
                <a href="#" class="item-menu sair" id="menu-sair">
                    <span class="icone-menu">🚪</span>
                    <span>Sair</span>
                </a>
            </div>
        </nav>
    `;
}

/* ================================================
   RENDERIZAR LISTA DE SERVIÇOS
   ================================================ */
function renderizarListaServicos() {
    const container = document.getElementById('lista-servicos');
    
    if (servicos.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <span class="icone-vazio">💅</span>
                <p class="texto-vazio">Nenhum serviço cadastrado.</p>
                <p class="texto-vazio">Clique em "Adicionar Serviço" para começar.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    servicos.forEach(servico => {
        html += `
            <div class="card-servico" data-id="${servico.id}">
                <div class="icone-servico">
                    ${servico.icone || '💅'}
                </div>
                <div class="info-servico">
                    <p class="nome-servico">${servico.nome}</p>
                    <p class="detalhes-servico">${servico.duracao || 60} min</p>
                </div>
                <p class="preco-servico">R$ ${servico.preco}</p>
                <div class="botoes-servico">
                    <button class="botao-icon editar" data-id="${servico.id}" title="Editar">✏️</button>
                    <button class="botao-icon excluir" data-id="${servico.id}" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    document.querySelectorAll('.botao-icon.editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = pegarIdDoPai(e, '.card-servico');
            if (id) editarServico(id);
        });
    });
    
    document.querySelectorAll('.botao-icon.excluir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = pegarIdDoPai(e, '.card-servico');
            if (id) excluirServico(id);
        });
    });
}

/* ================================================
   RENDERIZAR CONFIGURAÇÕES
   ================================================ */
function renderizarConfiguracoes() {
    document.getElementById('config-segunda-abertura').value = configuracoes.segundaAbertura || '09:00';
    document.getElementById('config-segunda-intervalo-inicio').value = configuracoes.segundaIntervaloInicio || '12:00';
    document.getElementById('config-segunda-intervalo-fim').value = configuracoes.segundaIntervaloFim || '13:00';
    document.getElementById('config-segunda-fechamento').value = configuracoes.segundaFechamento || '19:00';
    document.getElementById('config-sabado-abertura').value = configuracoes.sabadoAbertura || '09:00';
    document.getElementById('config-sabado-fechamento').value = configuracoes.sabadoFechamento || '17:00';
    document.getElementById('config-domingo-fechado').checked = configuracoes.domingoFechado !== false;
    document.getElementById('config-telefone').value = configuracoes.telefone || '';
    document.getElementById('config-endereco').value = configuracoes.endereco || '';
    document.getElementById('config-tempo').value = configuracoes.tempoEntreAgendamentos || 15;
}

/* ================================================
   RENDERIZAR AVISO
   ================================================ */
function renderizarAviso() {
    const texto = document.getElementById('aviso-texto');
    const ativo = document.getElementById('aviso-ativo');
    const contador = document.getElementById('contador-aviso');
    
    if (avisoAtivo) {
        texto.value = avisoAtivo.mensagem || '';
        ativo.checked = avisoAtivo.ativo || false;
    } else {
        texto.value = '';
        ativo.checked = false;
    }
    
    contador.textContent = `${texto.value.length}/300`;
    
    texto.addEventListener('input', () => {
        contador.textContent = `${texto.value.length}/300`;
    });
}

/* ================================================
   INICIALIZAR CALENDÁRIO
   ================================================ */
function inicializarCalendario() {
    const btnMesAnterior = document.getElementById('btn-mes-anterior');
    const btnMesProximo = document.getElementById('btn-mes-proximo');
    
    if (btnMesAnterior) {
        btnMesAnterior.addEventListener('click', () => {
            dataAtual.setMonth(dataAtual.getMonth() - 1);
            renderizarCalendario();
        });
    }
    
    if (btnMesProximo) {
        btnMesProximo.addEventListener('click', () => {
            dataAtual.setMonth(dataAtual.getMonth() + 1);
            renderizarCalendario();
        });
    }
    
    // Selecionar hoje por padrão
    const hoje = new Date();
    dataSelecionada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
}

/* ================================================
   RENDERIZAR CALENDÁRIO
   ================================================ */
function renderizarCalendario() {
    const mesElement = document.getElementById('mes-agenda');
    const diasContainer = document.getElementById('dias-calendario');
    const tituloData = document.getElementById('titulo-data-selecionada');
    
    if (!mesElement || !diasContainer) return;
    
    // Exibir nome do mês
    const mes = dataAtual.getMonth();
    const ano = dataAtual.getFullYear();
    mesElement.textContent = `${nomesMeses[mes]} ${ano}`;
    
    // Calcular dias do mês
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaPrimeiro = primeiroDia.getDay();
    
    let html = '';
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < diaSemanaPrimeiro; i++) {
        html += '<span class="dia-vazio"></span>';
    }
    
    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const temAgendamento = diasComAgendamentos.includes(dataStr);
        const isHoje = dataSelecionada.getDate() === dia && 
                     dataSelecionada.getMonth() === mes && 
                     dataSelecionada.getFullYear() === ano;
        
        html += `
            <span class="dia ${temAgendamento ? 'tem-agendamento' : ''} ${isHoje ? 'selecionado' : ''}" 
                  data-data="${dataStr}" 
                  data-dia="${dia}">
                ${dia}
            </span>
        `;
    }
    
    diasContainer.innerHTML = html;
    
    // Adicionar eventos aos dias
    document.querySelectorAll('.dia[data-data]').forEach(diaEl => {
        diaEl.addEventListener('click', () => {
            const dataStr = diaEl.dataset.data;
            const dia = parseInt(diaEl.dataset.dia);
            dataSelecionada = new Date(ano, mes, dia);
            
            // Atualizar visual
            document.querySelectorAll('.dia').forEach(d => d.classList.remove('selecionado'));
            diaEl.classList.add('selecionado');
            
            // Atualizar título da data
            if (tituloData) {
                tituloData.textContent = `${dia} de ${nomesMeses[mes]} de ${ano}`;
            }
            
            // Renderizar agendamentos do dia
            renderizarAgendamentosDia(dataStr);
        });
    });
    
    // Renderizar agendamentos do dia selecionado
    const dataStrAtual = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dataSelecionada.getDate()).padStart(2, '0')}`;
    if (tituloData) {
        tituloData.textContent = `${dataSelecionada.getDate()} de ${nomesMeses[mes]} de ${ano}`;
    }
    renderizarAgendamentosDia(dataStrAtual);
}

/* ================================================
   RENDERIZAR AGENDAMENTOS DO DIA
   ================================================ */
function renderizarAgendamentosDia(dataStr) {
    const container = document.getElementById('lista-agendamentos');
    if (!container) return;
    
    const agendamentosDia = agendamentos.filter(a => a.data === dataStr);
    
    if (agendamentosDia.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <span class="icone-vazio">📅</span>
                <p class="texto-vazio">Nenhum agendamento neste dia.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por horário
    agendamentosDia.sort((a, b) => a.horario.localeCompare(b.horario));
    
    let html = '';
    agendamentosDia.forEach(agend => {
        const statusClass = agend.status === 'confirmado' ? 'confirmado' : 
                        agend.status === 'cancelado' ? 'cancelado' : 'pendente';
        
        const clienteObj = clientes.find(c => c.id === agend.userId);
        const nomeCliente = clienteObj ? clienteObj.nome : (agend.clienteNome || 'Cliente Desconhecido');
        const nomeServico = agend.servico || agend.servicoNome || 'Serviço';
        
        html += `
            <div class="card-agendamento" data-id="${agend.id}" style="cursor: pointer;">
                <div class="horario-agendamento">${agend.horario}</div>
                <div class="info-agendamento">
                    <p class="nome-cliente-agend">${nomeCliente}</p>
                    <p class="servico-agend">${nomeServico}</p>
                </div>
                <div class="status-agendamento ${statusClass}">
                    ${agend.status === 'confirmado' ? '✓' : agend.status === 'cancelado' ? '✕' : '⏳'}
                </div>
                <div class="botoes-agendamento" onclick="event.stopPropagation()">
                    ${(() => {
                        const telefoneCliente = (clienteObj ? clienteObj.telefone : '') || agend.clienteTelefone || '';
                        const msgWpp = `Olá ${nomeCliente}! 💅 Aqui é a equipe do salão. Gostaria de falar sobre seu agendamento de ${agend.servico} no dia ${formatarData(agend.data)} às ${agend.horario}.`;
                        const linkWpp = gerarLinkWhatsApp(telefoneCliente, msgWpp);
                        return linkWpp ? `<a class="botao-icon whatsapp-icon" href="${linkWpp}" target="_blank" rel="noopener" title="Contatar cliente via WhatsApp" onclick="event.stopPropagation()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>` : '';
                    })()}
                    ${agend.status !== 'confirmado' ? 
                        `<button class="botao-icon confirmar" data-id="${agend.id}" title="Confirmar">✓</button>` : ''}
                    ${agend.status !== 'cancelado' ? 
                        `<button class="botao-icon cancelar" data-id="${agend.id}" title="Cancelar">✕</button>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Evento de clique no card para abrir modal de detalhes
    document.querySelectorAll('.card-agendamento[data-id]').forEach(card => {
        card.addEventListener('click', () => abrirModalDetalhesAgendamento(card.dataset.id));
    });
    
    // Adicionar eventos aos botões
    document.querySelectorAll('.botao-icon.confirmar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = pegarIdDoPai(e, '.card-agendamento');
            if (id) confirmarAgendamento(id);
        });
    });
    
    document.querySelectorAll('.botao-icon.cancelar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = pegarIdDoPai(e, '.card-agendamento');
            if (id) cancelarAgendamento(id);
        });
    });
}

/* ================================================
   ATUALIZAR BADGE PENDENTES
   ================================================ */
async function confirmarAgendamento(id) {
    try {
        // Buscar dados do agendamento antes de confirmar
        const agendDoc = await firebase.firestore().collection('agendamentos').doc(id).get();
        const agendamento = agendDoc.data();
        
        await firebase.firestore().collection('agendamentos').doc(id).update({
            status: 'confirmado',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Enviar notificação para o cliente
        if (agendamento && agendamento.userId) {
            await enviarNotificacaoPush(
                agendamento.userId,
                'Agendamento Confirmado!',
                `Seu agendamento de ${agendamento.servico} foi confirmado para ${formatarData(agendamento.data)} às ${agendamento.horario}.`,
                'confirmado'
            );
        }
        
        // Atualizar lista local
        const idx = agendamentos.findIndex(a => a.id === id);
        if (idx !== -1) {
            agendamentos[idx].status = 'confirmado';
        }
        
        // Re-renderizar
        const dataStr = `${dataSelecionada.getFullYear()}-${String(dataSelecionada.getMonth() + 1).padStart(2, '0')}-${String(dataSelecionada.getDate()).padStart(2, '0')}`;
        renderizarAgendamentosDia(dataStr);
        renderizarSolicitacoes();
        renderizarConfirmacoes();
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao confirmar:', erro);
    }
}

/* ================================================
   CANCELAR AGENDAMENTO
   ================================================ */
async function cancelarAgendamento(id) {
    const agendamento = agendamentos.find(a => a.id === id);
    const clienteObj = agendamento ? clientes.find(c => c.id === agendamento.userId) : null;
    const nomeCliente = clienteObj ? clienteObj.nome : (agendamento?.clienteNome || 'Cliente');
    const telefoneCliente = (clienteObj ? clienteObj.telefone : '') || agendamento?.clienteTelefone || '';

    const confirmar = await mostrarConfirm(
        'Cancelar Agendamento',
        'Tem certeza que deseja <strong>excluir</strong> este agendamento?<br><br>O cliente será notificado.',
        'alerta'
    );
    
    if (!confirmar) return;
    
    try {
        await firebase.firestore().collection('agendamentos').doc(id).delete();
        
        // Remover da lista local
        const idx = agendamentos.findIndex(a => a.id === id);
        if (idx !== -1) {
            agendamentos.splice(idx, 1);
        }
        
        // Re-renderizar
        const dataStr = `${dataSelecionada.getFullYear()}-${String(dataSelecionada.getMonth() + 1).padStart(2, '0')}-${String(dataSelecionada.getDate()).padStart(2, '0')}`;
        renderizarAgendamentosDia(dataStr);
        renderizarSolicitacoes();
        renderizarConfirmacoes();

        // Oferecer notificação WhatsApp para o cliente
        if (agendamento && telefoneCliente) {
            const msgWpp = `Olá ${nomeCliente}! 💅 Aqui é o salão Jeci Vieira Nails.\n\nInfelizmente precisamos cancelar seu agendamento:\n\nServiço: ${agendamento.servico}\nData: ${formatarData(agendamento.data)}\nHorário: ${agendamento.horario}\n\nPor favor, faça um novo agendamento ou entre em contato. Sentimos muito pelo inconveniente! 🙏`;
            const linkWpp = gerarLinkWhatsApp(telefoneCliente, msgWpp);
            if (linkWpp) {
                const modal = criarModal();
                modal.querySelector('.modal-icon').textContent = '✅';
                modal.querySelector('.modal-titulo').textContent = 'Cancelado com Sucesso';
                modal.querySelector('.modal-mensagem').innerHTML = `Agendamento excluído. Deseja avisar <strong>${nomeCliente}</strong> via WhatsApp?`;
                modal.querySelector('.modal-botoes').innerHTML = `
                    <button class="modal-botao secundario" id="modal-skip-wpp">Pular</button>
                    <a class="modal-botao whatsapp" href="${linkWpp}" target="_blank" rel="noopener" id="modal-enviar-wpp">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:4px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Avisar via WhatsApp
                    </a>
                `;
                modal.dataset.clickOutside = 'true';
                modal.classList.add('ativo');
                document.getElementById('modal-skip-wpp').addEventListener('click', () => modal.classList.remove('ativo'));
                document.getElementById('modal-enviar-wpp').addEventListener('click', () => {
                    setTimeout(() => modal.classList.remove('ativo'), 500);
                });
            }
        }
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao cancelar:', erro);
    }
}


/* ================================================
   RENDERIZAR SOLICITAÇÕES
   ================================================ */
function renderizarSolicitacoes() {
    const container = document.getElementById('lista-solicitacoes');
    const badge = document.getElementById('badge-solicitacoes');
    if (!container) return;
    
    // Status pode estar ausente em agendamentos muito antigos, mas novos tem 'pendente'
    const solicitacoes = agendamentos.filter(a => a.status === 'pendente' || !a.status);
    
    // Atualizar Badge
    if (badge) {
        if (solicitacoes.length > 0) {
            badge.textContent = solicitacoes.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    if (solicitacoes.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <span class="icone-vazio">🔔</span>
                <p class="texto-vazio">Nenhuma solicitação pendente.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar do mais antigo para o mais novo
    solicitacoes.sort((a, b) => {
        if (a.data === b.data) {
            return a.horario.localeCompare(b.horario);
        }
        return a.data.localeCompare(b.data);
    });
    
    let html = '';
    solicitacoes.forEach(agend => {
        const clienteObj = clientes.find(c => c.id === agend.userId);
        const nomeCliente = clienteObj ? clienteObj.nome : (agend.clienteNome || 'Cliente Desconhecido');
        const nomeServico = agend.servico || agend.servicoNome || 'Serviço';
        
        const [ano, mes, dia] = agend.data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        html += `
            <div class="card-agendamento" data-id="${agend.id}">
                <div class="horario-agendamento">
                    <div style="font-size:0.75rem; color:#6B6B6B; margin-bottom:2px;">${dataFormatada}</div>
                    <div>${agend.horario}</div>
                </div>
                <div class="info-agendamento">
                    <p class="nome-cliente-agend">${nomeCliente}</p>
                    <p class="servico-agend">${nomeServico}</p>
                </div>
                <div class="status-agendamento pendente">⏳</div>
                <div class="botoes-agendamento">
                    ${(() => {
                        const telefoneCliente = (clienteObj ? clienteObj.telefone : '') || agend.clienteTelefone || '';
                        const msgWpp = `Olá ${nomeCliente}! 💅 Aqui é a equipe do salão Jeci Vieira Nails. Vimos sua solicitação de agendamento de ${nomeServico} para o dia ${dataFormatada} às ${agend.horario}. Gostaríamos de confirmar!`;
                        const linkWpp = gerarLinkWhatsApp(telefoneCliente, msgWpp);
                        return linkWpp ? `<a class="botao-icon whatsapp-icon" href="${linkWpp}" target="_blank" rel="noopener" title="Contatar cliente via WhatsApp" onclick="event.stopPropagation()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>` : '';
                    })()}
                    <button class="botao-icon confirmar" data-id="${agend.id}" title="Confirmar">✓</button>
                    <button class="botao-icon cancelar" data-id="${agend.id}" title="Cancelar">✕</button>
                </div>
            </div>
        `;
    });

    
    container.innerHTML = html;
    
    // Adicionar eventos aos botões recém criados
    container.querySelectorAll('.botao-icon.confirmar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.card-agendamento')?.dataset.id;
            if (id) confirmarAgendamento(id);
        });
    });
    
    container.querySelectorAll('.botao-icon.cancelar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.card-agendamento')?.dataset.id;
            if (id) cancelarAgendamento(id);
        });
    });
}

/* ================================================
   RENDERIZAR CONFIRMAÇÕES
   ================================================ */
function renderizarConfirmacoes() {
    const container = document.getElementById('lista-confirmacoes');
    const badge = document.getElementById('badge-confirmacoes');
    if (!container) return;
    
    // Calcular próxima data (amanhã)
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];
    
    // Data limite: 3 dias à frente para captar agendamentos próximos
    const limite = new Date();
    limite.setDate(limite.getDate() + 3);
    const limiteStr = limite.toISOString().split('T')[0];
    
    // Filtrar agendamentos: próximos dias, não cancelados
    const confirmacoes = agendamentos.filter(a => {
        if (a.status === 'cancelado') return false;
        if (a.data < amanhaStr) return false;
        if (a.data > limiteStr) return false;
        return true;
    });
    
    // Atualizar Badge
    const pendentes = confirmacoes.filter(a => a.status !== 'confirmado');
    if (badge) {
        if (pendentes.length > 0) {
            badge.textContent = pendentes.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    if (confirmacoes.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <span class="icone-vazio">✅</span>
                <p class="texto-vazio">Nenhum agendamento nos próximos dias.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar do mais próximo para o mais distante
    confirmacoes.sort((a, b) => {
        if (a.data === b.data) {
            return a.horario.localeCompare(b.horario);
        }
        return a.data.localeCompare(b.data);
    });
    
    let html = '';
    confirmacoes.forEach(agend => {
        const clienteObj = clientes.find(c => c.id === agend.userId);
        const nomeCliente = clienteObj ? clienteObj.nome : (agend.clienteNome || 'Cliente Desconhecido');
        const telefoneCliente = (clienteObj ? clienteObj.telefone : '') || agend.clienteTelefone || '';
        const nomeServico = agend.servico || agend.servicoNome || 'Serviço';
        const jaConfirmado = agend.status === 'confirmado';
        
        const [ano, mes, dia] = agend.data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        // Formatar data para exibição
        const dataObj = new Date(agend.data + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanhaDate = new Date(amanhaStr + 'T00:00:00');
        let LabelData = dataFormatada;
        if (dataObj.getTime() === amanhaDate.getTime()) {
            LabelData = 'Amanhã';
        }
        
        // Mensagem de confirmação
        const msgConfirmacao = `Olá ${nomeCliente}! 💅 Aqui é o salão Jeci Vieira Nails.\n\nVim confirmar seu agendamento:\nServiço: ${nomeServico}\nData: ${dataFormatada}\nHorário: ${agend.horario}\n\nQualquer dúvida, estamos à disposição! 😊`;
        const linkWpp = gerarLinkWhatsApp(telefoneCliente, msgConfirmacao);
        
        html += `
            <div class="card-agendamento" data-id="${agend.id}">
                <div class="horario-agendamento">
                    <div style="font-size:0.75rem; color:#6B6B6B; margin-bottom:2px;">${LabelData}</div>
                    <div>${agend.horario}</div>
                </div>
                <div class="info-agendamento">
                    <p class="nome-cliente-agend">${nomeCliente}</p>
                    <p class="servico-agend">${nomeServico}</p>
                </div>
                <div class="status-agendamento ${jaConfirmado ? 'confirmado' : 'pendente'}">${jaConfirmado ? '✓' : '⏳'}</div>
                <div class="botoes-agendamento">
                    ${linkWpp ? `<a class="botao-icon whatsapp-icon" href="${linkWpp}" target="_blank" rel="noopener" title="Confirmar via WhatsApp" onclick="event.stopPropagation()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>` : ''}
                    ${!jaConfirmado ? `<button class="botao-icon confirmar" data-id="${agend.id}" title="Confirmar internamente">✓</button>` : ''}
                    <button class="botao-icon cancelar" data-id="${agend.id}" title="Cancelar">✕</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Adicionar eventos aos botões
    container.querySelectorAll('.botao-icon.confirmar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.card-agendamento')?.dataset.id;
            if (id) confirmarAgendamento(id);
        });
    });
    
    container.querySelectorAll('.botao-icon.cancelar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.card-agendamento')?.dataset.id;
            if (id) cancelarAgendamento(id);
        });
    });
}

/* ================================================
   RENDERIZAR LISTA DE CLIENTES
   ================================================ */
function renderizarListaClientes() {
    const container = document.getElementById('lista-clientes');
    const inputBusca = document.getElementById('busca-cliente');
    
    if (!container) return;
    
    if (clientesFiltrados.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <span class="icone-vazio">👥</span>
                <p class="texto-vazio">Nenhum cliente cadastrado.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    clientesFiltrados.forEach(cliente => {
        html += `
            <div class="card-cliente" data-id="${cliente.id}">
                <div class="info-cliente">
                    <p class="nome-cliente">${cliente.nome || 'Sem nome'}</p>
                    <p class="detalhes-cliente">${cliente.email || 'Sem email'}</p>
                    <p class="detalhes-cliente">${cliente.telefone || 'Sem telefone'}</p>
                </div>
                <div class="botoes-cliente">
                    <button class="botao-acao-cliente detalhes" data-id="${cliente.id}">Ver Detalhes</button>
                    <button class="botao-acao-cliente excluir" data-id="${cliente.id}">Remover</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    if (inputBusca) {
        inputBusca.value = '';
        inputBusca.addEventListener('input', () => {
            const termo = inputBusca.value.toLowerCase().trim();
            if (!termo) {
                clientesFiltrados = [...clientes];
            } else {
                clientesFiltrados = clientes.filter(cliente => {
                    const nome = (cliente.nome || '').toLowerCase();
                    const telefone = (cliente.telefone || '').toLowerCase();
                    const email = (cliente.email || '').toLowerCase();
                    return nome.includes(termo) || telefone.includes(termo) || email.includes(termo);
                });
            }
            renderizarListaClientes();
        });
    }
    
    document.querySelectorAll('.botao-acao-cliente.detalhes').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.card-cliente')?.dataset.id;
            if (id) abrirModalCliente(id);
        });
    });
    
    // Eventos para botão de excluir cliente
    document.querySelectorAll('.botao-acao-cliente.excluir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.card-cliente')?.dataset.id;
            if (id) {
                const cliente = clientes.find(c => c.id === id);
                const nome = cliente ? cliente.nome : 'Cliente';
                removerCliente(id, nome);
            }
        });
    });
}

/* ================================================
   REMOVER CLIENTE
   Remove cliente da coleção usuarios
   ================================================ */
async function removerCliente(clienteId, nomeCliente) {
    const confirmar = await mostrarConfirm(
        'Remover Cliente',
        `Tem certeza que deseja remover o cliente <strong>${nomeCliente}</strong>?<br><br>
        <small style="color: #666;">Esta ação não pode ser desfeita. Os agendamentos deste cliente serão mantidos no histórico.</small>`,
        'danger'
    );
    
    if (!confirmar) return;
    
    try {
        await firebase.firestore().collection('usuarios').doc(clienteId).delete();
        
        // Remover da lista local
        clientes = clientes.filter(c => c.id !== clienteId);
        clientesFiltrados = clientesFiltrados.filter(c => c.id !== clienteId);
        
        // Re-renderizar
        renderizarListaClientes();
        
        await mostrarAlerta('Sucesso', 'Cliente removido com sucesso!', 'sucesso');
        console.log('[DEBUG] Cliente removido:', clienteId);
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao remover cliente:', erro);
        await mostrarAlerta('Erro', 'Erro ao remover cliente: ' + erro.message, 'erro');
    }
}

/* ================================================
   INICIALIZAR MENU HAMBURGER
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
    
    const botaoAtualizar = document.getElementById('btn-atualizar');
    if (botaoAtualizar) {
        botaoAtualizar.addEventListener('click', async () => {
            botaoAtualizar.style.animation = 'none';
            botaoAtualizar.offsetHeight;
            botaoAtualizar.style.animation = 'spin 1s ease-in-out';
            await carregarDadosFirestore();
            await mostrarAlerta('Atualizado', 'Dados atualizados com sucesso!', 'sucesso');
        });
    }
}

/* ================================================
    MÁSCARA DE TELEFONE
    ================================================ */
function inicializarMascaraTelefone() {
    const inputTelefone = document.getElementById('config-telefone');
    if (!inputTelefone) return;
    
    inputTelefone.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        
        if (valor.length > 10) {
            valor = valor.substring(0, 11);
            valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (valor.length > 5) {
            valor = valor.replace(/^(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3');
        } else if (valor.length > 0) {
            valor = valor.replace(/^(\d*)/, '($1');
        }
        
        e.target.value = valor;
        
        // Atualiza rodapé em tempo real
        atualizarRodapeTempoReal();
    });
    
    inputTelefone.addEventListener('blur', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length > 0 && valor.length < 10) {
            e.target.value = '';
        }
    });
}

/* ================================================
    ATUALIZAR RODAPÉ EM TEMPO REAL
    ================================================ */
function atualizarRodapeTempoReal() {
    const campoTelefone = document.getElementById('config-telefone');
    const campoEndereco = document.getElementById('config-endereco');
    const telefoneRodape = document.querySelector('.rodape .card-rodape-linha:nth-child(2) span:last-child');
    const enderecoRodape = document.querySelector('.rodape .card-rodape-linha:first-child span:last-child');
    
    if (telefoneRodape && campoTelefone) {
        telefoneRodape.textContent = campoTelefone.value || 'Telefone não informado';
    }
    if (enderecoRodape && campoEndereco) {
        enderecoRodape.textContent = campoEndereco.value || 'Endereço não informado';
    }
}

/* ================================================
   INICIALIZAR EVENTOS
   ================================================ */
function inicializarEventos() {
    // Navegação do menu hamburger
    const itensMenu = document.querySelectorAll('.item-menu[data-nav]');
    itensMenu.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navegarPara(item.dataset.nav);
        });
    });
    
    inicializarMascaraTelefone();
    
    // Atualizar rodapé ao digitar no endereço
    const campoEndereco = document.getElementById('config-endereco');
    if (campoEndereco) {
        campoEndereco.addEventListener('input', atualizarRodapeTempoReal);
    }
    
    document.getElementById('btn-novo-servico').addEventListener('click', () => abrirModalServico());
    document.getElementById('btn-salvar-config').addEventListener('click', () => salvarConfiguracoes());
    document.getElementById('btn-salvar-aviso').addEventListener('click', () => salvarAviso());
    document.getElementById('btn-bloquear-horario').addEventListener('click', () => adicionarBloqueio());
    
    renderizarListaBloqueios();
    
    document.getElementById('menu-sair').addEventListener('click', async (e) => {
        e.preventDefault();
        await firebase.auth().signOut();
        window.location.href = '../index.html';
    });
}

/* ================================================
   NAVEGAR PARA SEÇÃO
   ================================================ */
function navegarPara(secao) {
    // Atualizar menu
    document.querySelectorAll('.item-menu[data-nav]').forEach(item => {
        item.classList.remove('ativo');
        if (item.dataset.nav === secao) {
            item.classList.add('ativo');
        }
    });
    
    // Atualizar seções
    document.querySelectorAll('.secao').forEach(sec => {
        sec.classList.remove('ativa');
    });
    const secaoElement = document.getElementById(`secao-${secao}`);
    if (secaoElement) {
        secaoElement.classList.add('ativa');
    }
    
    // Fechar menu após selecionar
    const menu = document.getElementById('menu-hamburger');
    const overlay = document.getElementById('menu-overlay');
    menu.classList.remove('aberto');
    overlay.classList.remove('aberto');
}

/* ================================================
   ABRIR MODAL DE SERVIÇO
   ================================================ */
function abrirModalServico(servico = null) {
    servicoEditando = servico;
    
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 300;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    const iconeSelecionado = servico ? servico.icone : '💅';
    const nome = servico ? servico.nome : '';
    const descricao = servico ? servico.descricao : '';
    const preco = servico ? servico.preco : '';
    const duracao = servico ? servico.duracao : 60;
    
    overlay.innerHTML = `
        <div class="formulario" style="width: 100%; max-width: 400px; margin: 0;">
            <h2 class="titulo-secao">${servico ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            
            <div class="campo-formulario">
                <label class="label-campo">Nome do Serviço</label>
                <input type="text" class="input-campo" id="servico-nome" 
                    placeholder="Ex: Manicure" value="${nome}">
            </div>
            
            <div class="campo-formulario">
                <label class="label-campo">Descrição</label>
                <input type="text" class="input-campo" id="servico-descricao" 
                    placeholder="Ex: Esmaltação e cuidado das unhas" value="${descricao}">
            </div>
            
            <div class="linha-campos">
                <div class="campo-formulario">
                    <label class="label-campo">Preço (R$)</label>
                    <input type="number" class="input-campo" id="servico-preco" 
                        placeholder="50" value="${preco}" min="0">
                </div>
                
                <div class="campo-formulario">
                    <label class="label-campo">Duração (min)</label>
                    <input type="number" class="input-campo" id="servico-duracao" 
                        value="${duracao}" min="15" max="240" step="15">
                </div>
            </div>
            
            <div class="campo-formulario">
                <label class="label-campo">Ícone</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="icones-container">
                    ${['💅', '🦶', '✨', '🌸', '💕', '⭐', '🎀', '💐'].map(icon => `
                        <button type="button" class="botao-icon ${iconeSelecionado === icon ? 'ativo' : ''}" 
                            data-icone="${icon}" style="font-size: 1.5rem; width: 44px; height: 44px;"
                            ${iconeSelecionado === icon ? 'style="background: var(--rose-gold); color: #fff;"' : ''}>
                            ${icon}
                        </button>
                    `).join('')}
                </div>
                <input type="hidden" id="servico-icone" value="${iconeSelecionado}">
            </div>
            
            <div class="botoes-formulario">
                <button class="botao-formulario botao-cancelar" id="btn-cancelar-servico">Cancelar</button>
                <button class="botao-formulario botao-salvar" id="btn-salvar-servico">Salvar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('btn-cancelar-servico').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    
    document.querySelectorAll('[data-icone]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('servico-icone').value = btn.dataset.icone;
            document.querySelectorAll('[data-icone]').forEach(b => {
                b.style.background = '';
                b.style.color = '';
            });
            btn.style.background = 'var(--rose-gold)';
            btn.style.color = '#fff';
        });
    });
    
    document.getElementById('btn-salvar-servico').addEventListener('click', () => salvarServico());
}

/* ================================================
   ABRIR MODAL DE CLIENTE
   ================================================ */
async function abrirModalCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    const dataCadastro = cliente.dataCadastro ? new Date(cliente.dataCadastro).toLocaleDateString('pt-BR') : 'Não informada';
    
    const modal = criarModal();
    modal.dataset.clickOutside = 'true';
    
    modal.querySelector('.modal-icon').textContent = '👤';
    modal.querySelector('.modal-titulo').textContent = 'Dados do Cliente';
    modal.querySelector('.modal-mensagem').innerHTML = `
        <div style="text-align: left; font-size: 0.9rem;">
            <p style="margin-bottom: 12px;"><strong>Nome:</strong> ${cliente.nome || 'Não informado'}</p>
            <p style="margin-bottom: 12px;"><strong>Email:</strong> ${cliente.email || 'Não informado'}</p>
            <p style="margin-bottom: 12px;"><strong>Telefone:</strong> ${cliente.telefone || 'Não informado'}</p>
            <p style="margin-bottom: 12px;"><strong>CPF:</strong> ${cliente.cpf || 'Não informado'}</p>
            <p style="margin-bottom: 12px;"><strong>Data de Nascimento:</strong> ${cliente.dataNascimento || 'Não informada'}</p>
            <p style="margin-bottom: 12px;"><strong>Cadastro em:</strong> ${dataCadastro}</p>
        </div>
    `;
    
    modal.querySelector('.modal-botoes').innerHTML = `
        <button class="modal-botao primario" id="btn-fechar-modal-cliente">Fechar</button>
    `;
    
    modal.classList.add('ativo');
    
document.getElementById('btn-fechar-modal-cliente').addEventListener('click', () => {
        modal.classList.remove('ativo');
    });
}

/* ================================================
   EDITAR SERVIÇO
   ================================================ */
function editarServico(id) {
    const servico = servicos.find(s => s.id === id);
    if (servico) {
        abrirModalServico(servico);
    }
}

/* ================================================
   EXCLUIR SERVIÇO
   ================================================ */
async function excluirServico(id) {
    if (!id) {
        await mostrarAlerta('Erro', 'ID do serviço inválido.', 'erro');
        return;
    }
    
    const confirmar = await mostrarConfirm(
        'Excluir Serviço',
        'Tem certeza que deseja excluir este serviço?',
        'danger'
    );
    
    if (!confirmar) return;
    
    try {
        await firebase.firestore().collection('servicos').doc(id).delete();
        
        servicos = servicos.filter(s => s.id !== id);
        renderizarListaServicos();
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao excluir:', erro);
        await mostrarAlerta('Erro', 'Erro ao excluir serviço. Tente novamente.', 'erro');
    }
}

/* ================================================
   SALVAR SERVIÇO
   ================================================ */
async function salvarServico() {
    const nome = document.getElementById('servico-nome').value.trim();
    const descricao = document.getElementById('servico-descricao').value.trim();
    const preco = parseFloat(document.getElementById('servico-preco').value) || 0;
    const duracao = parseInt(document.getElementById('servico-duracao').value) || 60;
    const icone = document.getElementById('servico-icone').value || '💅';
    
    if (!nome) {
        await mostrarAlerta('Campo Obrigatório', 'Por favor, digite o nome do serviço.', 'alerta');
        return;
    }
    
    if (preco <= 0) {
        await mostrarAlerta('Campo Inválido', 'Por favor, digite um preço válido.', 'alerta');
        return;
    }
    
    try {
        const dados = {
            nome,
            descricao,
            preco,
            duracao,
            icone,
            ativo: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (servicoEditando && servicoEditando.id) {
            await firebase.firestore().collection('servicos').doc(servicoEditando.id).update(dados);
            console.log('[DEBUG] Serviço atualizado:', servicoEditando.id);
        } else {
            dados.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await firebase.firestore().collection('servicos').add(dados);
            dados.id = docRef.id;
            console.log('[DEBUG] Serviço criado:', docRef.id);
        }
        
        await carregarDadosFirestore();
        renderizarListaServicos();
        
        document.getElementById('modal-overlay').remove();
        servicoEditando = null;
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao salvar:', erro);
        await mostrarAlerta('Erro', 'Erro ao salvar serviço. Tente novamente.', 'erro');
    }
}

/* ================================================
   SALVAR CONFIGURAÇÕES
   ================================================ */
async function salvarConfiguracoes() {
    const config = {
        segundaAbertura: document.getElementById('config-segunda-abertura').value,
        segundaIntervaloInicio: document.getElementById('config-segunda-intervalo-inicio').value,
        segundaIntervaloFim: document.getElementById('config-segunda-intervalo-fim').value,
        segundaFechamento: document.getElementById('config-segunda-fechamento').value,
        sabadoAbertura: document.getElementById('config-sabado-abertura').value,
        sabadoFechamento: document.getElementById('config-sabado-fechamento').value,
        domingoFechado: document.getElementById('config-domingo-fechado').checked,
        telefone: document.getElementById('config-telefone').value,
        endereco: document.getElementById('config-endereco').value,
        tempoEntreAgendamentos: (() => {
            const valor = parseInt(document.getElementById('config-tempo').value);
            return isNaN(valor) ? 15 : valor;
        })(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await firebase.firestore().collection('configuracoes').doc('salao').set(config, { merge: true });
        
        configuracoes = config;
        
        await mostrarAlerta('Sucesso', 'Configurações salvas com sucesso!', 'sucesso');
        console.log('[DEBUG] Configurações salvas');
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao salvar:', erro);
        await mostrarAlerta('Erro', 'Erro ao salvar configurações. Tente novamente.', 'erro');
    }
}

/* ================================================
   SALVAR AVISO
   ================================================ */
async function salvarAviso() {
    const btn = document.getElementById('btn-salvar-aviso');
    const mensagem = document.getElementById('aviso-texto').value.trim();
    const ativo = document.getElementById('aviso-ativo').checked;
    
    if (!mensagem && ativo) {
        await mostrarAlerta('Campo Obrigatório', 'Por favor, digite uma mensagem para ativar o aviso.', 'alerta');
        return;
    }
    
    try {
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Salvando...';
        }

        if (!ativo) {
            // Se desativou, podemos apenas marcar como inativo ou excluir
            if (avisoAtivo && avisoAtivo.id) {
                await firebase.firestore().collection('avisos').doc(avisoAtivo.id).update({
                    ativo: false,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } else {
            const dados = {
                mensagem,
                ativo: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (avisoAtivo && avisoAtivo.id) {
                await firebase.firestore().collection('avisos').doc(avisoAtivo.id).update(dados);
            } else {
                dados.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await firebase.firestore().collection('avisos').add(dados);
            }
        }
        
        await carregarDadosFirestore();
        await mostrarAlerta('Sucesso', 'Aviso atualizado com sucesso!', 'sucesso');
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao salvar aviso:', erro);
        await mostrarAlerta('Erro', 'Erro ao salvar aviso. Tente novamente.', 'erro');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Salvar Mensagem';
        }
    }
}

/* ================================================
   RENDERIZAR LISTA DE BLOQUEIOS
   ================================================ */
function renderizarListaBloqueios() {
    const container = document.getElementById('lista-bloqueios');
    if (!container) return;
    
    if (!horariosBloqueados || horariosBloqueados.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <span class="icone-vazio">🔒</span>
                <p class="texto-vazio">Nenhum horário bloqueado.</p>
            </div>
        `;
        return;
    }
    
    const hoje = new Date().toISOString().split('T')[0];
    
    let html = '';
    horariosBloqueados.forEach((bloq, index) => {
        const dataFormata = formatarData_BR(bloq.data);
        const jaPassou = bloq.data < hoje;
        
        html += `
            <div class="card-servico" data-index="${index}">
                <div class="info-servico">
                    <p class="nome-servico">${dataFormata}</p>
                    <p class="detalhes-servico">${bloq.horaInicio} - ${bloq.horaFim}</p>
                    ${bloq.motivo ? `<p class="detalhes-servico" style="color: #888;">${bloq.motivo}</p>` : ''}
                </div>
                ${!jaPassou ? `
                <button class="botao-icon excluir" data-index="${index}" title="Desbloquear">🔓</button>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Adicionar eventos aos botões
    container.querySelectorAll('.botao-icon.excluir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.closest('.card-servico').dataset.index);
            if (!isNaN(idx)) removerBloqueio(idx);
        });
    });
}

function formatarData_BR(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

/* ================================================
   ADICIONAR BLOQUEIO
   ================================================ */
async function adicionarBloqueio() {
    const data = document.getElementById('bloqueio-data').value;
    const horaInicio = document.getElementById('bloqueio-inicio').value;
    const horaFim = document.getElementById('bloqueio-fim').value;
    const motivo = document.getElementById('bloqueio-motivo').value.trim();
    
    if (!data || !horaInicio || !horaFim) {
        await mostrarAlerta('Campos Obrigatórios', 'Preencha data, hora de início e hora de fim.', 'alerta');
        return;
    }
    
    if (horaInicio >= horaFim) {
        await mostrarAlerta('Horário Inválido', 'A hora de fim deve ser maior que a hora de início.', 'alerta');
        return;
    }
    
    try {
        const snap = await firebase.firestore()
            .collection('agendamentos')
            .where('data', '==', data)
            .where('status', 'in', ['pendente', 'confirmado'])
            .get();
        
        const [hIni, mIni] = horaInicio.split(':').map(Number);
        const [hFim, mFim] = horaFim.split(':').map(Number);
        const minBloqInicio = hIni * 60 + mIni;
        const minBloqFim = hFim * 60 + mFim;
        
        const agendamentosConflitantes = [];
        
        snap.docs.forEach(doc => {
            const agendamento = doc.data();
            const [hAgend, mAgend] = agendamento.horario.split(':').map(Number);
            const minAgend = hAgend * 60 + mAgend;
            const duracao = agendamento.duracao || 60;
            
            const minFimAgend = minAgend + duracao;
            
            if (minAgend < minBloqFim && minFimAgend > minBloqInicio) {
                agendamentosConflitantes.push({
                    id: doc.id,
                    horario: agendamento.horario,
                    duracao: duracao,
                    servico: agendamento.servicoNome || agendamento.servico,
                    cliente: agendamento.clienteNome || 'Cliente'
                });
            }
        });
        
        if (agendamentosConflitantes.length > 0) {
            let msg = '<strong>ATENÇÃO:</strong> existem agendamentos neste período:<br><br><ul>';
            agendamentosConflitantes.forEach(ag => {
                msg += `<li>${ag.horario} - ${ag.servico} (${ag.cliente})</li>`;
            });
            msg += '</ul><br>Deseja bloquear mesmo assim?<br><small>O(s) agendamento(s) deverá(ão) ser cancelado(s) manualmente.</small>';
            
            const confirmar = await mostrarConfirm('Agendamentos Conflictantes', msg, 'bloque');
            if (!confirmar) return;
        }
        
        const novoBloqueio = {
            id: 'bloq_' + Date.now(),
            data,
            horaInicio,
            horaFim,
            motivo
        };
        
        const bloqueiosAtualizados = [...(horariosBloqueados || []), novoBloqueio];
        
        await firebase.firestore().collection('configuracoes').doc('salao').set({
            horariosBloqueados: bloqueiosAtualizados
        }, { merge: true });
        
        horariosBloqueados = bloqueiosAtualizados;
        
        document.getElementById('bloqueio-data').value = '';
        document.getElementById('bloqueio-inicio').value = '';
        document.getElementById('bloqueio-fim').value = '';
        document.getElementById('bloqueio-motivo').value = '';
        
        renderizarListaBloqueios();
        await mostrarAlerta('Sucesso', 'Horário bloqueado com sucesso!', 'sucesso');
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao bloquear horário:', erro);
        await mostrarAlerta('Erro', 'Erro ao bloquear horário. Tente novamente.', 'erro');
    }
}

/* ================================================
   REMOVER BLOQUEIO
   ================================================ */
async function removerBloqueio(index) {
    if (!horariosBloqueados || !horariosBloqueados[index]) {
        await mostrarAlerta('Erro', 'Bloqueio não encontrado.', 'erro');
        return;
    }
    
    const bloq = horariosBloqueados[index];
    const confirmar = await mostrarConfirm(
        'Desbloquear Horário',
        `Deseja desbloquear ${formatarData_BR(bloq.data)} das ${bloq.horaInicio} às ${bloq.horaFim}?`,
        'bloque'
    );
    
    if (!confirmar) return;
    
    try {
        // Criar nova lista sem o bloqueio removido
        const bloqueiosAtualizados = horariosBloqueados.filter((_, i) => i !== index);
        
        // Salvar no Firestore usando set com merge
        await firebase.firestore().collection('configuracoes').doc('salao').set({
            horariosBloqueados: bloqueiosAtualizados
        }, { merge: true });
        
        // Atualizar variável local
        horariosBloqueados = bloqueiosAtualizados;
        
        // Re-renderizar lista
        renderizarListaBloqueios();
        
        await mostrarAlerta('Sucesso', 'Horário desbloqueado!', 'sucesso');
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao desbloquear:', erro);
        await mostrarAlerta('Erro', 'Erro ao desbloquear horários. Tente novamente.', 'erro');
    }
}

/* ================================================
   INICIALIZAÇÃO AUTOMÁTICA
   Inicia quando o DOM estiver pronto
   ================================================ */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAdmin);
} else {
    inicializarAdmin();
}