/* ================================================
   JECI VIEIRA NAILS - AGENDAMENTO PELO ADMIN
   ================================================ */

/* ================================================
   WHATSAPP HELPER
   ================================================ */
function gerarLinkWhatsApp(telefone, mensagem) {
    if (!telefone) return null;
    var numero = telefone.replace(/\D/g, '');
    var numeroCompleto = numero.startsWith('55') ? numero : '55' + numero;
    var texto = encodeURIComponent(mensagem);
    return 'https://wa.me/' + numeroCompleto + '?text=' + texto;
}

/* ================================================
   VARIAVEIS GLOBAIS
   ================================================ */
var servicoSelecionado = null;
var dataSelecionada = null;
var horarioSelecionado = null;
var passoAtual = 0;

var dataCalendario = new Date();
var reagendarParams = null;

var clienteSelecionado = null;
var clienteNome = '';
var clienteTelefone = '';
var clientes = [];
var clientesFiltrados = [];
var adminUid = '';

/* ================================================
   DADOS DO FIRESTORE
   ================================================ */
var servicosAtivos = [];
var configuracoes = {
    segundaAbertura: "09:00",
    segundaIntervaloInicio: "12:00",
    segundaIntervaloFim: "13:00",
    segundaFechamento: "19:00",
    sabadoAbertura: "09:00",
    sabadoFechamento: "17:00",
    domingoFechado: true,
    tempoEntreAgendamentos: 15
};
var agendamentosDia = [];
var horariosBloqueados = [];

var nomesMeses = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

var nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

/* ================================================
   VERIFICAR PARAMETROS DE URL
   ================================================ */
function verificarParamsReagendamento() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('reagendar') === 'true') {
        reagendarParams = {
            agendamentoId: params.get('agendamentoId'),
            servico: params.get('servico'),
            servicoId: params.get('servicoId'),
            preco: params.get('preco'),
            duracao: parseInt(params.get('duracao') || '60')
        };
        console.log('[DEBUG] Modo reagendamento:', reagendarParams);
    }
}

/* ================================================
   CARREGAR DADOS DO FIRESTORE
   ================================================ */
async function carregarDadosAgendamento() {
    try {
        var promessas = [
            firebase.firestore().collection('servicos').where('ativo', '==', true).get(),
            firebase.firestore().collection('configuracoes').doc('salao').get(),
            firebase.firestore().collection('usuarios').where('role', '==', 'cliente').orderBy('nome').get()
        ];
        var resultados = await Promise.all(promessas);

        var servicosSnap = resultados[0];
        var configSnap = resultados[1];
        var clientesSnap = resultados[2];

        servicosAtivos = servicosSnap.docs.map(function(doc) {
            var data = doc.data();
            return {
                id: doc.id,
                nome: data.nome,
                preco: data.preco,
                duracao: data.duracao,
                icone: data.icone,
                ativo: data.ativo
            };
        });

        if (configSnap.exists) {
            var configData = configSnap.data();
            configuracoes.segundaAbertura = configData.segundaAbertura || configuracoes.segundaAbertura;
            configuracoes.segundaIntervaloInicio = configData.segundaIntervaloInicio || configuracoes.segundaIntervaloInicio;
            configuracoes.segundaIntervaloFim = configData.segundaIntervaloFim || configuracoes.segundaIntervaloFim;
            configuracoes.segundaFechamento = configData.segundaFechamento || configuracoes.segundaFechamento;
            configuracoes.sabadoAbertura = configData.sabadoAbertura || configuracoes.sabadoAbertura;
            configuracoes.sabadoFechamento = configData.sabadoFechamento || configuracoes.sabadoFechamento;
            configuracoes.domingoFechado = configData.domingoFechado !== false;
            configuracoes.tempoEntreAgendamentos = configData.tempoEntreAgendamentos || configuracoes.tempoEntreAgendamentos;
            configuracoes.telefone = configData.telefone || '';
        }

        clientes = clientesSnap.docs.map(function(doc) {
            var data = doc.data();
            return {
                id: doc.id,
                nome: data.nome,
                telefone: data.telefone,
                email: data.email
            };
        });
        clientesFiltrados = clientes.slice();

        console.log('[DEBUG] Servicos carregados:', servicosAtivos.length);
        console.log('[DEBUG] Clientes carregados:', clientes.length);
    } catch (erro) {
        console.error('[DEBUG] Erro ao carregar dados:', erro);
        servicosAtivos = [];
        clientes = [];
        clientesFiltrados = [];
    }
}

/* ================================================
   BUSCAR AGENDAMENTOS DO DIA
   ================================================ */
async function buscarAgendamentosDia(dataStr) {
    try {
        var promessas = [
            firebase.firestore()
                .collection('agendamentos')
                .where('data', '==', dataStr)
                .where('status', 'in', ['pendente', 'confirmado'])
                .get(),
            firebase.firestore()
                .collection('configuracoes')
                .doc('salao')
                .get()
        ];
        var resultados = await Promise.all(promessas);

        var agendSnap = resultados[0];
        var configSnap = resultados[1];

        agendamentosDia = agendSnap.docs.map(function(doc) {
            var data = doc.data();
            return {
                horario: data.horario,
                duracao: data.duracao || 60
            };
        });

        var configData = configSnap.data() || {};
        horariosBloqueados = configData.horariosBloqueados || [];
        
        console.log('[DEBUG] Agendamentos do dia:', agendamentosDia.length);
    } catch (erro) {
        console.error('[DEBUG] Erro ao buscar agendamentos:', erro);
        agendamentosDia = [];
        horariosBloqueados = [];
    }
}

/* ================================================
   INICIALIZACAO
   ================================================ */
function inicializarAgendamentoAdmin() {
    var status = document.getElementById('status');
    
    firebase.auth().onAuthStateChanged(async function(usuario) {
        console.log('[DEBUG] Usuario:', usuario);
        
        try {
            if (!usuario) {
                status.textContent = 'Voce precisa estar logado. Redirecionando...';
                setTimeout(function() {
                    window.location.href = '../index.html';
                }, 1500);
                return;
            }
            
            var doc = await firebase.firestore().collection('usuarios').doc(usuario.uid).get();
            var dados = doc.data();
            
            if (!doc.exists || !dados || dados.role !== 'admin') {
                status.textContent = 'Acesso restrito. Redirecionando...';
                setTimeout(function() {
                    window.location.href = 'dashboard.html';
                }, 1500);
                return;
            }
            
            adminUid = usuario.uid;
            console.log('[DEBUG] Admin logado:', adminUid);
            
            status.textContent = 'Carregando dados...';
            await carregarDadosAgendamento();
            
            if (servicosAtivos.length === 0) {
                status.textContent = 'Nenhum servico disponivel no momento.';
                return;
            }
            
            exibirPaginaAgendamentoAdmin();
            
        } catch (erro) {
            console.error('[DEBUG] Erro:', erro);
            status.textContent = 'Erro ao carregar: ' + erro.message;
        }
    });
}

/* ================================================
   EXIBIR PAGINA DE AGENDAMENTO ADMIN
   ================================================ */
function exibirPaginaAgendamentoAdmin() {
    document.body.innerHTML = criarEstruturaAgendamentoAdmin();
    inicializarEventosAdmin();
    renderizarClientes();
    renderizarServicos();
}

/* ================================================
   CRIAR ESTRUTURA HTML
   ================================================ */
function criarEstruturaAgendamentoAdmin() {
    var html = '';
    html += '<header class="header-agendamento">';
    html += '    <a href="admin.html" class="logo-header">';
    html += '        <img src="../data/img/Logo_JeciVieira_NailsDesigner.svg" alt="Jeci Nails" class="imagem-logo-topo">';
    html += '    </a>';
    html += '    <a href="admin.html" class="botao-voltar">&larr;</a>';
    html += '</header>';
    html += '<main class="container-agendamento">';
    html += '    <h1 class="titulo-pagina">Agendar para Cliente</h1>';
    html += '    <p class="subtitulo-pagina">Selecione o cliente, servico, data e horario</p>';
    html += '    <div class="passos-container">';
    html += '        <div class="passo ativo" id="passo-0"><span class="numero-passo">0</span><span class="texto-passo">Cliente</span></div>';
    html += '        <div class="passo" id="passo-1"><span class="numero-passo">1</span><span class="texto-passo">Servico</span></div>';
    html += '        <div class="passo" id="passo-2"><span class="numero-passo">2</span><span class="texto-passo">Data</span></div>';
    html += '        <div class="passo" id="passo-3"><span class="numero-passo">3</span><span class="texto-passo">Horario</span></div>';
    html += '        <div class="passo" id="passo-4"><span class="numero-passo">4</span><span class="texto-passo">Confirmar</span></div>';
    html += '    </div>';
    
    // Passo 0: Seleção de Cliente
    html += '    <section class="secao-agendamento ativa" id="secao-0">';
    html += '        <h2 class="titulo-secao"><span class="icone-secao">&#128101;</span> Selecionar Cliente</h2>';
    html += '        <div class="campo-busca-cliente">';
    html += '            <input type="text" class="input-busca-cliente" id="busca-cliente" placeholder="Buscar cliente por nome ou telefone...">';
    html += '        </div>';
    html += '        <div class="lista-clientes-selecao" id="lista-clientes-selecao"></div>';
    html += '        <div class="opcao-novo-cliente">';
    html += '            <h3 class="titulo-opcao-novo">Ou cadastrar novo cliente</h3>';
    html += '            <div class="campo-novo-cliente"><label class="label-novo-cliente">Nome do Cliente *</label><input type="text" class="input-novo-cliente" id="novo-cliente-nome" placeholder="Digite o nome completo"></div>';
    html += '            <div class="campo-novo-cliente"><label class="label-novo-cliente">Telefone *</label><input type="tel" class="input-novo-cliente" id="novo-cliente-telefone" placeholder="(11) 99999-9999" inputmode="tel"></div>';
    html += '        </div>';
    html += '        <button class="botao-proximo" id="btn-passo-0" disabled>Continuar</button>';
    html += '    </section>';
    
    // Passo 1: Seleção de Serviço
    html += '    <section class="secao-agendamento" id="secao-1">';
    html += '        <h2 class="titulo-secao"><span class="icone-secao">&#128133;</span> Selecione um Servico</h2>';
    html += '        <div class="grid-servicos" id="grid-servicos"></div>';
    html += '        <button class="botao-proximo" id="btn-passo-1" disabled>Continuar</button>';
    html += '    </section>';
    
    // Passo 2: Escolher Data
    html += '    <section class="secao-agendamento" id="secao-2">';
    html += '        <h2 class="titulo-secao"><span class="icone-secao">&#128197;</span> Escolha a Data</h2>';
    html += '        <div class="calendario-opcoes">';
    html += '            <div class="calendario-header">';
    html += '                <button class="botao-nav-calendario" id="btn-mes-anterior">&larr;</button>';
    html += '                <span class="mes-calendario" id="mes-atual"></span>';
    html += '                <button class="botao-nav-calendario" id="btn-mes-proximo">&rarr;</button>';
    html += '            </div>';
    html += '            <div class="dias-semana">';
    for (var i = 0; i < nomesDias.length; i++) {
        html += '<span>' + nomesDias[i] + '</span>';
    }
    html += '            </div>';
    html += '            <div class="dias-calendario" id="dias-calendario"></div>';
    html += '        </div>';
    html += '        <button class="botao-proximo" id="btn-passo-2" disabled>Continuar</button>';
    html += '        <button class="botao-voltar-passo" id="btn-voltar-2">&larr; Voltar</button>';
    html += '    </section>';
    
    // Passo 3: Escolher Horário
    html += '    <section class="secao-agendamento" id="secao-3">';
    html += '        <h2 class="titulo-secao"><span class="icone-secao">&#128336;</span> Escolha o Horario</h2>';
    html += '        <div class="servico-selecionado-info" id="info-servico-selecionado"></div>';
    html += '        <div class="grid-horarios" id="grid-horarios"></div>';
    html += '        <button class="botao-proximo" id="btn-passo-3" disabled>Continuar</button>';
    html += '        <button class="botao-voltar-passo" id="btn-voltar-3">&larr; Voltar</button>';
    html += '    </section>';
    
    // Passo 4: Confirmação
    html += '    <section class="secao-agendamento" id="secao-4">';
    html += '        <h2 class="titulo-secao"><span class="icone-secao">&#9989;</span> Confirmar Agendamento</h2>';
    html += '        <div class="card-confirmacao" id="card-confirmacao"></div>';
    html += '        <div class="campo-input"><label>Observacoes (opcional)</label><textarea id="observacoes" rows="3" placeholder="Alguma observacao ou solicitacao especial..."></textarea></div>';
    html += '        <button class="botao-proximo" id="btn-confirmar">Confirmar Agendamento</button>';
    html += '        <button class="botao-voltar-passo" id="btn-voltar-4">&larr; Voltar</button>';
    html += '    </section>';
    
    html += '</main>';
    return html;
}

/* ================================================
   INICIALIZAR EVENTOS
   ================================================ */
function inicializarEventosAdmin() {
    var buscaInput = document.getElementById('busca-cliente');
    if (buscaInput) {
        buscaInput.addEventListener('input', function() {
            filtrarClientes(buscaInput.value);
        });
    }
    
    var nomeInput = document.getElementById('novo-cliente-nome');
    var telInput = document.getElementById('novo-cliente-telefone');
    if (nomeInput) {
        nomeInput.addEventListener('input', verificarCamposNovoCliente);
    }
    if (telInput) {
        telInput.addEventListener('input', verificarCamposNovoCliente);
    }
    
    document.getElementById('btn-mes-anterior').addEventListener('click', function() {
        dataCalendario.setMonth(dataCalendario.getMonth() - 1);
        renderizarCalendario();
    });
    
    document.getElementById('btn-mes-proximo').addEventListener('click', function() {
        dataCalendario.setMonth(dataCalendario.getMonth() + 1);
        renderizarCalendario();
    });
    
    document.getElementById('btn-passo-0').addEventListener('click', function() { irParaPasso(1); });
    document.getElementById('btn-passo-1').addEventListener('click', function() { irParaPasso(2); });
    document.getElementById('btn-passo-2').addEventListener('click', async function() { await irParaPasso(3); });
    document.getElementById('btn-passo-3').addEventListener('click', function() { irParaPasso(4); });
    
    document.getElementById('btn-voltar-2').addEventListener('click', function() { irParaPasso(1); });
    document.getElementById('btn-voltar-3').addEventListener('click', function() { irParaPasso(2); });
    document.getElementById('btn-voltar-4').addEventListener('click', function() { irParaPasso(3); });
    
    document.getElementById('btn-confirmar').addEventListener('click', confirmarAgendamentoAdmin);
    
    renderizarCalendario();
}

/* ================================================
   VERIFICAR CAMPOS NOVO CLIENTE
   ================================================ */
function verificarCamposNovoCliente() {
    var nome = document.getElementById('novo-cliente-nome').value.trim();
    var tel = document.getElementById('novo-cliente-telefone').value.trim();
    var btn = document.getElementById('btn-passo-0');
    
    var cards = document.querySelectorAll('.card-cliente-selecao');
    for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('selecionado');
    }
    clienteSelecionado = null;
    
    if (nome && tel) {
        clienteNome = nome;
        clienteTelefone = tel;
        btn.disabled = false;
    } else {
        btn.disabled = true;
    }
}

/* ================================================
   RENDERIZAR CLIENTES
   ================================================ */
function renderizarClientes() {
    var container = document.getElementById('lista-clientes-selecao');
    if (!container) return;
    
    if (clientesFiltrados.length === 0) {
        container.innerHTML = '<p class="sem-resultados-cliente">Nenhum cliente encontrado.</p>';
        return;
    }
    
    var html = '';
    clientesFiltrados.forEach(function(cliente) {
        html += '<div class="card-cliente-selecao" data-id="' + cliente.id + '">';
        html += '    <span class="icone-cliente-selecao">&#128100;</span>';
        html += '    <div class="info-cliente-selecao">';
        html += '        <p class="nome-cliente-selecao">' + cliente.nome + '</p>';
        html += '        <p class="telefone-cliente-selecao">' + (cliente.telefone || 'Sem telefone') + '</p>';
        html += '    </div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    var cards = document.querySelectorAll('.card-cliente-selecao');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            document.getElementById('novo-cliente-nome').value = '';
            document.getElementById('novo-cliente-telefone').value = '';
            
            var allCards = document.querySelectorAll('.card-cliente-selecao');
            allCards.forEach(function(c) { c.classList.remove('selecionado'); });
            card.classList.add('selecionado');
            
            clienteSelecionado = clientes.find(function(c) { return c.id === card.dataset.id; });
            clienteNome = clienteSelecionado.nome;
            clienteTelefone = clienteSelecionado.telefone || '';
            
            document.getElementById('btn-passo-0').disabled = false;
        });
    });
}

/* ================================================
   FILTRAR CLIENTES
   ================================================ */
function filtrarClientes(termo) {
    if (!termo || termo.trim() === '') {
        clientesFiltrados = clientes.slice();
    } else {
        var busca = termo.toLowerCase().trim();
        clientesFiltrados = clientes.filter(function(c) {
            return c.nome.toLowerCase().includes(busca) || (c.telefone && c.telefone.includes(busca));
        });
    }
    renderizarClientes();
}

/* ================================================
   IR PARA PASSO
   ================================================ */
async function irParaPasso(passo) {
    if (passo === 1) {
        if (!clienteNome || !clienteTelefone) {
            await mostrarAlertaAgendamento('Por favor, selecione um cliente ou cadastre um novo.');
            return;
        }
    }
    if (passo > 1 && passo <= 3) {
        if (passo === 2 && !servicoSelecionado) {
            await mostrarAlertaAgendamento('Por favor, selecione um servico.');
            return;
        }
        if (passo === 3 && !dataSelecionada) {
            await mostrarAlertaAgendamento('Por favor, selecione uma data.');
            return;
        }
        if (passo === 4 && !horarioSelecionado) {
            await mostrarAlertaAgendamento('Por favor, selecione um horario.');
            return;
        }
    }
    
    if (passo === 3) {
        await renderizarHorarios();
    }
    
    if (passo === 4) {
        renderizarConfirmacao();
    }
    
    for (var i = 0; i <= 4; i++) {
        var passoEl = document.getElementById('passo-' + i);
        var secaoEl = document.getElementById('secao-' + i);
        
        if (i <= passo) {
            passoEl.classList.add('ativo');
        } else {
            passoEl.classList.remove('ativo');
        }
        
        if (i === passo) {
            secaoEl.classList.add('ativa');
        } else {
            secaoEl.classList.remove('ativa');
        }
    }
    
    passoAtual = passo;
}

/* ================================================
   RENDERIZAR SERVICOS
   ================================================ */
function renderizarServicos() {
    var container = document.getElementById('grid-servicos');
    if (!container) return;
    
    if (servicosAtivos.length === 0) {
        container.innerHTML = '<p class="texto-vazio">Nenhum servico disponivel.</p>';
        return;
    }
    
    var html = '';
    servicosAtivos.forEach(function(servico) {
        html += '<div class="card-servico-opcao" data-id="' + servico.id + '">';
        html += '    <span class="icone-servico-opcao">' + (servico.icone || '&#128133;') + '</span>';
        html += '    <p class="nome-servico-opcao">' + servico.nome + '</p>';
        html += '    <p class="preco-servico-opcao">R$ ' + servico.preco + '</p>';
        html += '    <p class="duracao-servico-opcao">' + (servico.duracao || 60) + ' min</p>';
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    var cards = document.querySelectorAll('.card-servico-opcao');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            var allCards = document.querySelectorAll('.card-servico-opcao');
            allCards.forEach(function(c) { c.classList.remove('selecionado'); });
            card.classList.add('selecionado');
            
            servicoSelecionado = servicosAtivos.find(function(s) { return s.id === card.dataset.id; });
            
            document.getElementById('btn-passo-1').disabled = false;
        });
    });
}

/* ================================================
   RENDERIZAR CALENDARIO
   ================================================ */
function renderizarCalendario() {
    var mesEl = document.getElementById('mes-atual');
    var diasEl = document.getElementById('dias-calendario');
    if (!mesEl || !diasEl) return;
    
    var mes = dataCalendario.getMonth();
    var ano = dataCalendario.getFullYear();
    mesEl.textContent = nomesMeses[mes] + ' ' + ano;
    
    var primeiroDia = new Date(ano, mes, 1);
    var ultimoDia = new Date(ano, mes + 1, 0);
    var diasNoMes = ultimoDia.getDate();
    var diaSemanaPrimeiro = primeiroDia.getDay();
    
    var html = '';
    
    for (var i = 0; i < diaSemanaPrimeiro; i++) {
        html += '<span class="dia-vazio"></span>';
    }
    
    var hoje = new Date();
    
    for (var dia = 1; dia <= diasNoMes; dia++) {
        var dataObj = new Date(ano, mes, dia);
        var dataStr = ano + '-' + String(mes + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
        var diaSemana = dataObj.getDay();
        
        var indisponivel = false;
        var bloqueado = false;
        
        if (dataObj < hoje && dataObj.toDateString() !== hoje.toDateString()) {
            indisponivel = true;
        }
        
        if (diaSemana === 0 && configuracoes.domingoFechado) {
            bloqueado = true;
        }
        
        var isSabado = (diaSemana === 6);
        
        var classes = 'dia-cal';
        if (indisponivel) classes += ' indisponivel';
        if (bloqueado) classes += ' bloqueado';
        
        html += '<span class="' + classes + '" data-data="' + dataStr + '" data-dia="' + dia + '">' + dia + '</span>';
    }
    
    diasEl.innerHTML = html;
    
    var dias = document.querySelectorAll('.dia-cal');
    dias.forEach(function(diaEl) {
        diaEl.addEventListener('click', function() {
            if (diaEl.classList.contains('indisponivel') || diaEl.classList.contains('bloqueado')) {
                return;
            }
            
            var allDias = document.querySelectorAll('.dia-cal');
            allDias.forEach(function(d) { d.classList.remove('selecionado'); });
            diaEl.classList.add('selecionado');
            
            dataSelecionada = {
                str: diaEl.dataset.data,
                dia: parseInt(diaEl.dataset.dia)
            };
            
            document.getElementById('btn-passo-2').disabled = false;
        });
    });
}

/* ================================================
   RENDERIZAR HORARIOS
   ================================================ */
async function renderizarHorarios() {
    var container = document.getElementById('grid-horarios');
    var infoContainer = document.getElementById('info-servico-selecionado');
    if (!container) return;
    
    if (infoContainer) {
        infoContainer.innerHTML = '<span class="icone-info-servico">' + (servicoSelecionado.icone || '&#128133;') + '</span>' +
            '<div class="texto-info-servico"><strong>' + servicoSelecionado.nome + '</strong> R$ ' + servicoSelecionado.preco + ' • ' + (servicoSelecionado.duracao || 60) + ' min</div>';
    }
    
    await buscarAgendamentosDia(dataSelecionada.str);
    
    var horarios = gerarHorarios(dataSelecionada.str, servicoSelecionado.duracao || 60, configuracoes, agendamentosDia);
    
    if (horarios.length === 0) {
        container.innerHTML = '<p class="texto-vazio">Nenhum horario disponivel para esta data.</p>';
        return;
    }
    
    var html = '';
    horarios.forEach(function(h) {
        var disponivel = !h.indisponivel;
        html += '<div class="card-horario ' + (!disponivel ? 'indisponivel' : '') + '" data-horario="' + h.horario + '" ' + (!disponivel ? 'data-indisponivel="true"' : '') + '>';
        html += '    <span class="horario-texto">' + h.horario + '</span>';
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    var cards = document.querySelectorAll('.card-horario');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            if (card.dataset.indisponivel === 'true') return;
            
            var allCards = document.querySelectorAll('.card-horario');
            allCards.forEach(function(c) { c.classList.remove('selecionado'); });
            card.classList.add('selecionado');
            
            horarioSelecionado = card.dataset.horario;
            document.getElementById('btn-passo-3').disabled = false;
        });
    });
}

/* ================================================
   GERAR HORARIOS
   ================================================ */
function gerarHorarios(dataStr, duracao, config, horariosOcupados) {
    var horarios = [];
    
    var partes = dataStr.split('-').map(Number);
    var ano = partes[0];
    var mes = partes[1];
    var dia = partes[2];
    var dataObj = new Date(ano, mes - 1, dia);
    var diaSemana = dataObj.getDay();
    var isSabado = (diaSemana === 6);
    
    var abertura, fechamento;
    if (isSabado && config.sabadoAbertura && config.sabadoAbertura.trim() !== '') {
        abertura = config.sabadoAbertura;
        fechamento = config.sabadoFechamento;
    } else {
        abertura = config.segundaAbertura;
        fechamento = config.segundaFechamento;
    }
    
    if (!abertura || !fechamento) return horarios;
    
    var horaAbr = parseInt(abertura.split(':')[0]);
    var minAbr = parseInt(abertura.split(':')[1]);
    var horaFec = parseInt(fechamento.split(':')[0]);
    var minFec = parseInt(fechamento.split(':')[1]);
    var minInicio = horaAbr * 60 + minAbr;
    var minFim = horaFec * 60 + minFec;
    
    var intInicio = isSabado ? null : config.segundaIntervaloInicio;
    var intFim = isSabado ? null : config.segundaIntervaloFim;
    var minIntInicio = intInicio ? parseInt(intInicio.split(':')[0]) * 60 + parseInt(intInicio.split(':')[1]) : null;
    var minIntFim = intFim ? parseInt(intFim.split(':')[0]) * 60 + parseInt(intFim.split(':')[1]) : null;
    
    var tempoEntre = config.tempoEntreAgendamentos || 0;
    
    while (minInicio + duracao + tempoEntre <= minFim) {
        var hora = Math.floor(minInicio / 60);
        var min = minInicio % 60;
        var horarioStr = String(hora).padStart(2, '0') + ':' + String(min).padStart(2, '0');
        
        var minTermino = minInicio + duracao + tempoEntre;
        
        var indisponivel = false;
        
        if (minIntInicio && minIntFim) {
            if (minInicio < minIntFim && minTermino > minIntInicio) {
                minInicio = minIntFim;
                continue;
            }
        }
        
        var minAtual = minInicio;
        var duracaoNova = duracao + tempoEntre;
        
        for (var occIndex = 0; occIndex < horariosOcupados.length; occIndex++) {
            var occ = horariosOcupados[occIndex];
            var occPartes = occ.horario.split(':').map(Number);
            var minOcupado = occPartes[0] * 60 + occPartes[1];
            var duracaoOcupado = occ.duracao || 60;
            var minFimOcupado = minOcupado + duracaoOcupado;
            
            var comecaDurante = minAtual >= minOcupado && minAtual < minFimOcupado;
            var terminaDepois = (minAtual + duracaoNova) > minOcupado && minAtual < minOcupado;
            
            if (comecaDurante || terminaDepois) {
                indisponivel = true;
                break;
            }
        }
        
        if (!indisponivel && horariosBloqueados.length > 0) {
            for (var bloqIndex = 0; bloqIndex < horariosBloqueados.length; bloqIndex++) {
                var bloq = horariosBloqueados[bloqIndex];
                if (bloq.data !== dataStr) continue;
                
                var hIni = parseInt(bloq.horaInicio.split(':')[0]);
                var mIni = parseInt(bloq.horaInicio.split(':')[1]);
                var hFim = parseInt(bloq.horaFim.split(':')[0]);
                var mFim = parseInt(bloq.horaFim.split(':')[1]);
                var minBloqInicio = hIni * 60 + mIni;
                var minBloqFim = hFim * 60 + mFim;
                
                if (minInicio >= minBloqInicio && minInicio < minBloqFim) {
                    indisponivel = true;
                    break;
                }
            }
        }
        
        horarios.push({
            horario: horarioStr,
            indisponivel: indisponivel
        });
        
        minInicio += 30;
    }
    
    return horarios;
}

/* ================================================
   RENDERIZAR CONFIRMACAO
   ================================================ */
function renderizarConfirmacao() {
    var container = document.getElementById('card-confirmacao');
    if (!container) return;
    
    var dataBr = formatarData(dataSelecionada.str);
    
    container.innerHTML = '<div class="linha-confirmacao"><span class="label-confirmacao">Cliente</span><span class="valor-confirmacao">' + clienteNome + '</span></div>' +
        '<div class="linha-confirmacao"><span class="label-confirmacao">Telefone</span><span class="valor-confirmacao">' + clienteTelefone + '</span></div>' +
        '<div class="linha-confirmacao"><span class="label-confirmacao">Servico</span><span class="valor-confirmacao">' + servicoSelecionado.nome + '</span></div>' +
        '<div class="linha-confirmacao"><span class="label-confirmacao">Data</span><span class="valor-confirmacao">' + dataBr + '</span></div>' +
        '<div class="linha-confirmacao"><span class="label-confirmacao">Horario</span><span class="valor-confirmacao">' + horarioSelecionado + ' (' + servicoSelecionado.duracao + ' min)</span></div>' +
        '<div class="linha-confirmacao"><span class="label-confirmacao">Valor</span><span class="valor-confirmacao total-valor">R$ ' + servicoSelecionado.preco + '</span></div>';
}

/* ================================================
   FORMATAR DATA
   ================================================ */
function formatarData(dataStr) {
    var partes = dataStr.split('-').map(Number);
    var ano = partes[0];
    var mes = partes[1];
    var dia = partes[2];
    return dia + ' de ' + nomesMeses[mes - 1] + ' de ' + ano;
}

/* ================================================
   CONFIRMAR AGENDAMENTO (ADMIN)
   ================================================ */
async function confirmarAgendamentoAdmin() {
    var observacoes = document.getElementById('observacoes').value;
    
    try {
        if (!adminUid) {
            throw new Error('Admin nao identificado');
        }
        
        var agendamentoDoc = {
            servico: servicoSelecionado.nome,
            servicoId: servicoSelecionado.id,
            preco: servicoSelecionado.preco,
            duracao: servicoSelecionado.duracao,
            data: dataSelecionada.str,
            horario: horarioSelecionado,
            observacoes: observacoes,
            status: 'pendente',
            clienteNome: clienteNome,
            clienteTelefone: clienteTelefone,
            criadoPor: adminUid,
            userId: clienteSelecionado ? clienteSelecionado.id : null,
            servicoNome: servicoSelecionado.nome,
            reagendadoDe: reagendarParams ? reagendarParams.agendamentoId : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await firebase.firestore().collection('agendamentos').add(agendamentoDoc);
        
        console.log('[DEBUG] Agendamento salvo com sucesso');
        
        var msg = 'Agendamento criado pelo administrador!<br><br><strong>Cliente:</strong> ' + clienteNome + '<br><strong>Servico:</strong> ' + servicoSelecionado.nome + '<br><strong>Data:</strong> ' + formatarData(dataSelecionada.str) + '<br><strong>Horario:</strong> ' + horarioSelecionado + ' (' + servicoSelecionado.duracao + ' min)<br><strong>Valor:</strong> R$ ' + servicoSelecionado.preco + '<br><strong>Status:</strong> Pendente';
        
        await mostrarModalSucesso(msg);
        
        window.location.href = 'admin.html';
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao salvar agendamento:', erro);
        await mostrarModalErro('Erro ao salvar agendamento. Tente novamente.');
    }
}

/* ================================================
   MODAIS
   ================================================ */
async function mostrarAlertaAgendamento(mensagem) {
    return new Promise(function(resolve) {
        var modal = criarModalAgendamento();
        
        modal.querySelector('.modal-icon').textContent = 'ℹ️';
        modal.querySelector('.modal-titulo').textContent = 'Atencao';
        modal.querySelector('.modal-mensagem').innerHTML = mensagem;
        modal.querySelector('.modal-botoes').innerHTML = '<button class="modal-botao primario" id="modal-ok">OK</button>';
        
        modal.classList.add('ativo');
        
        document.getElementById('modal-ok').addEventListener('click', function() {
            modal.classList.remove('ativo');
            resolve();
        });
    });
}

function criarModalAgendamento() {
    var existing = document.getElementById('modal-agendamento');
    if (existing) return existing;
    
    var modal = document.createElement('div');
    modal.id = 'modal-agendamento';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal-card"><span class="modal-icon"></span><h3 class="modal-titulo"></h3><p class="modal-mensagem"></p><div class="modal-botoes"></div></div>';
    document.body.appendChild(modal);
    return modal;
}

function mostrarModalSucesso(mensagem) {
    return new Promise(function(resolve) {
        var modal = criarModalAgendamento();
        
        modal.querySelector('.modal-icon').textContent = '✅';
        modal.querySelector('.modal-titulo').textContent = 'Agendamento Confirmado!';
        modal.querySelector('.modal-mensagem').innerHTML = mensagem;
        modal.querySelector('.modal-botoes').innerHTML = '<button class="modal-botao primario" id="modal-ok">Voltar ao Painel</button>';
        
        modal.classList.add('ativo');
        
        document.getElementById('modal-ok').addEventListener('click', function() {
            modal.classList.remove('ativo');
            resolve();
        });
    });
}

function mostrarModalErro(mensagem) {
    return new Promise(function(resolve) {
        var modal = criarModalAgendamento();
        
        modal.querySelector('.modal-icon').textContent = '❌';
        modal.querySelector('.modal-titulo').textContent = 'Erro';
        modal.querySelector('.modal-mensagem').innerHTML = mensagem;
        modal.querySelector('.modal-botoes').innerHTML = '<button class="modal-botao danger" id="modal-ok">Tentar Novamente</button>';
        
        modal.classList.add('ativo');
        
        document.getElementById('modal-ok').addEventListener('click', function() {
            modal.classList.remove('ativo');
            resolve();
        });
    });
}

/* ================================================
   INICIALIZACAO AUTOMATICA
   ================================================ */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAgendamentoAdmin);
} else {
    inicializarAgendamentoAdmin();
}
