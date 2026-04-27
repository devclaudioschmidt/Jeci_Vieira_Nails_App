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
   VARIÁVEIS GLOBAIS
   ================================================ */
let dadosAdmin = {};
let servicos = [];
let configuracoes = {};
let avisoAtivo = null;
let servicoEditando = null;
let clientes = [];
let clientesFiltrados = [];

/* Variáveis do Calendário */
let dataAtual = new Date();
let dataSelecionada = new Date();
let agendamentos = [];
let diasComAgendamentos = [];

/* Nomes dos meses */
const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/* Nomes dos dias da semana */
const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
            
            if (!dados) {
                status.textContent = 'Dados do usuário não encontrados.';
                return;
            }
            
            if (dados.role !== 'admin') {
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
            tempoEntreAgendamentos: 15
        };
        
        console.log('[DEBUG] Configurações carregadas:', configuracoes);
        
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
        
        // Carregar agendamentos
        try {
            const agendamentosSnap = await firebase.firestore()
                .collection('agendamentos')
                .orderBy('data')
                .orderBy('horario')
                .get();
            
            agendamentos = agendamentosSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Criar lista de dias com agendamentos
            diasComAgendamentos = [...new Set(agendamentos.map(a => a.data))];
            console.log('[DEBUG] Agendamentos carregados:', agendamentos.length);
        } catch (e) {
            console.log('[DEBUG] Nenhum agendamento ainda');
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
            <button class="botao-menu" id="btn-menu" aria-label="Abrir menu">
                <span class="linha-menu"></span>
                <span class="linha-menu"></span>
                <span class="linha-menu"></span>
            </button>
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
                        value="${configuracoes.telefone || ''}" placeholder="(11) 99999-9999">
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
                <a href="#" class="item-menu" data-nav="avisos">
                    <span class="icone-menu">📢</span>
                    <span>Avisos</span>
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
        btn.addEventListener('click', () => editarServico(btn.dataset.id));
    });
    
    document.querySelectorAll('.botao-icon.excluir').forEach(btn => {
        btn.addEventListener('click', () => excluirServico(btn.dataset.id));
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
        
        html += `
            <div class="card-agendamento" data-id="${agend.id}">
                <div class="horario-agendamento">${agend.horario}</div>
                <div class="info-agendamento">
                    <p class="nome-cliente-agend">${agend.clienteNome}</p>
                    <p class="servico-agend">${agend.servicoNome}</p>
                </div>
                <div class="status-agendamento ${statusClass}">
                    ${agend.status === 'confirmado' ? '✓' : agend.status === 'cancelado' ? '✕' : '⏳'}
                </div>
                <div class="botoes-agendamento">
                    ${agend.status !== 'confirmado' ? 
                        `<button class="botao-icon confirmar" data-id="${agend.id}" title="Confirmar">✓</button>` : ''}
                    ${agend.status !== 'cancelado' ? 
                        `<button class="botao-icon cancelar" data-id="${agend.id}" title="Cancelar">✕</button>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Adicionar eventos aos botões
    document.querySelectorAll('.botao-icon.confirmar').forEach(btn => {
        btn.addEventListener('click', () => confirmarAgendamento(btn.dataset.id));
    });
    
    document.querySelectorAll('.botao-icon.cancelar').forEach(btn => {
        btn.addEventListener('click', () => cancelarAgendamento(btn.dataset.id));
    });
}

/* ================================================
   CONFIRMAR AGENDAMENTO
   ================================================ */
async function confirmarAgendamento(id) {
    try {
        await firebase.firestore().collection('agendamentos').doc(id).update({
            status: 'confirmado',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualizar lista local
        const idx = agendamentos.findIndex(a => a.id === id);
        if (idx !== -1) {
            agendamentos[idx].status = 'confirmado';
        }
        
        // Re-renderizar
        const dataStr = `${dataSelecionada.getFullYear()}-${String(dataSelecionada.getMonth() + 1).padStart(2, '0')}-${String(dataSelecionada.getDate()).padStart(2, '0')}`;
        renderizarAgendamentosDia(dataStr);
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao confirmar:', erro);
    }
}

/* ================================================
   CANCELAR AGENDAMENTO
   ================================================ */
async function cancelarAgendamento(id) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }
    
    try {
        await firebase.firestore().collection('agendamentos').doc(id).update({
            status: 'cancelado',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualizar lista local
        const idx = agendamentos.findIndex(a => a.id === id);
        if (idx !== -1) {
            agendamentos[idx].status = 'cancelado';
        }
        
        // Re-renderizar
        const dataStr = `${dataSelecionada.getFullYear()}-${String(dataSelecionada.getMonth() + 1).padStart(2, '0')}-${String(dataSelecionada.getDate()).padStart(2, '0')}`;
        renderizarAgendamentosDia(dataStr);
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao cancelar:', erro);
    }
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
                <div class="icone-cliente">
                    👤
                </div>
                <div class="info-cliente">
                    <p class="nome-cliente">${cliente.nome || 'Sem nome'}</p>
                    <p class="detalhes-cliente">${cliente.email || 'Sem email'}</p>
                    <p class="detalhes-cliente">${cliente.telefone || 'Sem telefone'}</p>
                </div>
                <div class="botoes-cliente">
                    <button class="botao-icon" data-id="${cliente.id}" title="Ver detalhes">👁️</button>
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
    
    document.querySelectorAll('.card-cliente .botao-icon').forEach(btn => {
        btn.addEventListener('click', () => abrirModalCliente(btn.dataset.id));
    });
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
    
    document.getElementById('btn-novo-servico').addEventListener('click', () => abrirModalServico());
    document.getElementById('btn-salvar-config').addEventListener('click', () => salvarConfiguracoes());
    document.getElementById('btn-salvar-aviso').addEventListener('click', () => salvarAviso());
    
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
function abrirModalCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
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
    
    const dataCadastro = cliente.dataCadastro ? new Date(cliente.dataCadastro).toLocaleDateString('pt-BR') : 'Não informada';
    
    overlay.innerHTML = `
        <div class="formulario" style="width: 100%; max-width: 400px; margin: 0;">
            <h2 class="titulo-secao">Dados do Cliente</h2>
            <div style="margin-top: 20px;">
                <p style="margin-bottom: 15px;"><strong>Nome:</strong> ${cliente.nome || 'Não informado'}</p>
                <p style="margin-bottom: 15px;"><strong>Email:</strong> ${cliente.email || 'Não informado'}</p>
                <p style="margin-bottom: 15px;"><strong>Telefone:</strong> ${cliente.telefone || 'Não informado'}</p>
                <p style="margin-bottom: 15px;"><strong>CPF:</strong> ${cliente.cpf || 'Não informado'}</p>
                <p style="margin-bottom: 15px;"><strong>Data de Nascimento:</strong> ${cliente.dataNascimento || 'Não informada'}</p>
                <p style="margin-bottom: 15px;"><strong>Cadastro em:</strong> ${dataCadastro}</p>
            </div>
            <button type="button" class="botao botao-secundario" id="btn-fechar-modal" style="margin-top: 20px; width: 100%;">
                Fechar
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('btn-fechar-modal').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
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
    if (!confirm('Tem certeza que deseja excluir este serviço?')) {
        return;
    }
    
    try {
        await firebase.firestore().collection('servicos').doc(id).delete();
        
        servicos = servicos.filter(s => s.id !== id);
        renderizarListaServicos();
        
        console.log('[DEBUG] Serviço excluído:', id);
    } catch (erro) {
        console.error('[DEBUG] Erro ao excluir:', erro);
        alert('Erro ao excluir serviço. Tente novamente.');
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
        alert('Por favor, digite o nome do serviço.');
        return;
    }
    
    if (preco <= 0) {
        alert('Por favor, digite um preço válido.');
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
        alert('Erro ao salvar serviço. Tente novamente.');
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
        tempoEntreAgendamentos: parseInt(document.getElementById('config-tempo').value) || 15,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await firebase.firestore().collection('configuracoes').doc('salao').set(config, { merge: true });
        
        configuracoes = config;
        
        alert('Configurações salvas com sucesso!');
        console.log('[DEBUG] Configurações salvas');
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao salvar:', erro);
        alert('Erro ao salvar configurações. Tente novamente.');
    }
}

/* ================================================
   SALVAR AVISO
   ================================================ */
async function salvarAviso() {
    const mensagem = document.getElementById('aviso-texto').value.trim();
    const ativo = document.getElementById('aviso-ativo').checked;
    
    if (!mensagem) {
        alert('Por favor, digite uma mensagem.');
        return;
    }
    
    try {
        if (!ativo) {
            if (avisoAtivo && avisoAtivo.id) {
                await firebase.firestore().collection('avisos').doc(avisoAtivo.id).delete();
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
        
        alert('Aviso salvo com sucesso!');
        console.log('[DEBUG] Aviso salvo');
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao salvar:', erro);
        alert('Erro ao salvar aviso. Tente novamente.');
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