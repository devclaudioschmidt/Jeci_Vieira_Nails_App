function gerarLinkWhatsApp(telefone, mensagem) {
    if (!telefone) return null;
    const numero = telefone.replace(/\D/g, '');
    const numeroCompleto = numero.startsWith('55') ? numero : '55' + numero;
    const texto = encodeURIComponent(mensagem);
    return `https://wa.me/${numeroCompleto}?text=${texto}`;
}

let telefoneAdm = '';

async function refreshHistoricoCompleto() {
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

        const resultAgendamentos = await firestoreService.carregarAgendamentosUsuario(usuario.uid);
        const agendamentos = resultAgendamentos.success ? resultAgendamentos.data : [];

        const hojeStr = new Date().toISOString().split('T')[0];
        const futuros = agendamentos.filter(ag => ag.data >= hojeStr).sort(ordenarAgendamentos);
        const passados = agendamentos.filter(ag => ag.data < hojeStr).sort(ordenarAgendamentosDesc);

        const usuarioResult = await firestoreService.carregarUsuario(usuario.uid);
        const dadosUsuario = usuarioResult.success ? usuarioResult.data : {};

        const configResult = await firestoreService.carregarConfiguracoes();
        telefoneAdm = configResult.success ? (configResult.data.telefone || '') : '';

        document.body.innerHTML = criarEstruturaHistorico(agendamentos, dadosUsuario);
        inicializarEventosHistorico();
        inicializarRefreshHistorico();

        if (botao) {
            setTimeout(() => {
                botao.classList.remove('animando');
            }, 1000);
        }

        mostrarAlertaRefresh('Atualizado', 'Dados recarregados com sucesso!', 'sucesso');

    } catch (erro) {
        console.error('[Historico] Erro no refresh:', erro);
        mostrarAlertaRefresh('Erro', 'Falha ao recarregar dados.', 'erro');
    } finally {
        mostrarFeedbackRefresh(false);
    }
}

function ordenarAgendamentos(a, b) {
    if (a.data === b.data) {
        return a.horario.localeCompare(b.horario);
    }
    return a.data.localeCompare(b.data);
}

function ordenarAgendamentosDesc(a, b) {
    if (a.data === b.data) {
        return b.horario.localeCompare(a.horario);
    }
    return b.data.localeCompare(a.data);
}

function inicializarHistorico() {
    const status = document.getElementById('status');

    firebase.auth().onAuthStateChanged(async (usuario) => {
        try {
            if (!usuario) {
                status.textContent = 'Usuário não está logado. Redirecionando...';
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                return;
            }

            console.log('[Historico] Usuario autenticado:', usuario.uid);

            const resultAgendamentos = await firestoreService.carregarAgendamentosUsuario(usuario.uid);
            const agendamentos = resultAgendamentos.success ? resultAgendamentos.data : [];

            if (!resultAgendamentos.success) {
                console.error('[Historico] Erro ao carregar agendamentos:', resultAgendamentos.error?.message);
            }

            const usuarioResult = await firestoreService.carregarUsuario(usuario.uid);
            const dadosUsuario = usuarioResult.success ? usuarioResult.data : {};

            const configResult = await firestoreService.carregarConfiguracoes();
            telefoneAdm = configResult.success ? (configResult.data.telefone || '') : '';

            document.body.innerHTML = criarEstruturaHistorico(agendamentos, dadosUsuario);
            inicializarEventosHistorico();
            inicializarRefreshHistorico();

        } catch (erro) {
            console.error('[Historico] Erro na inicializacao:', erro);
            if (document.getElementById('status')) {
                document.getElementById('status').textContent = 'Erro ao carregar dados.';
            }
        }
    });
}

function criarEstruturaHistorico(agendamentos, dadosUsuario) {
    const hojeStr = new Date().toISOString().split('T')[0];
    const futuros = agendamentos.filter(ag => ag.data >= hojeStr).sort(ordenarAgendamentos);
    const passados = agendamentos.filter(ag => ag.data < hojeStr).sort(ordenarAgendamentosDesc);

    return `
        <div class="mensagemFeedback" id="mensagemFeedback" style="display: none;"></div>

        <header class="header-perfil">
            <a href="dashboard.html" class="logo-header">
                <img src="../data/img/Logo_JeciVieira_NailsDesigner.svg" alt="Jeci Vieira Nails" class="imagem-logo-topo">
            </a>
            <a href="dashboard.html" class="botao-voltar">←</a>
        </header>

        <main class="container-historico">
            <h1 class="titulo-pagina">Meus Agendamentos</h1>
            <p class="subtitulo-pagina">Histórico completo dos seus agendamentos</p>

            <section class="secao-filtros">
                <div class="filtros-wrapper">
                    <div class="filtro-status" id="filtro-status">
                        <button class="botao-filtro ativo" data-filtro="todos">Todos</button>
                        <button class="botao-filtro" data-filtro="pendente">Pendentes</button>
                        <button class="botao-filtro" data-filtro="confirmado">Confirmados</button>
                        <button class="botao-filtro" data-filtro="cancelado">Cancelados</button>
                    </div>
                </div>
            </section>

            <section class="secao-listas">
                <div class="grupo-agendamentos">
                    <h2 class="titulo-grupo">Próximos Agendamentos</h2>
                    <div id="lista-futuros">
                        ${futuros.length === 0
                            ? '<p class="texto-vazio">Nenhum agendamento futuro.</p>'
                            : futuros.map(ag => criarCardAgendamento(ag, dadosUsuario)).join('')}
                    </div>
                </div>

                <div class="grupo-agendamentos">
                    <h2 class="titulo-grupo">Histórico</h2>
                    <div id="lista-passados">
                        ${passados.length === 0
                            ? '<p class="texto-vazio">Nenhum agendamento passado.</p>'
                            : passados.map(ag => criarCardAgendamento(ag, dadosUsuario)).join('')}
                    </div>
                </div>
            </section>
        </main>

        <div id="modal-container"></div>
    `;
}

function criarCardAgendamento(ag, dadosUsuario) {
    const statusClasses = {
        pendente: 'status-pendente',
        confirmado: 'status-confirmado',
        cancelado: 'status-cancelado'
    };

    const statusLabels = {
        pendente: 'Pendente',
        confirmado: 'Confirmado',
        cancelado: 'Cancelado'
    };

    const statusClass = statusClasses[ag.status] || 'status-pendente';
    const statusLabel = statusLabels[ag.status] || ag.status;

    const dataFormatada = formatarData(ag.data);
    const podeReagendar = ag.status !== 'cancelado' && ag.data >= new Date().toISOString().split('T')[0];

    return `
        <div class="card-agendamento-historico" data-id="${ag.id}" data-status="${ag.status}">
            <div class="card-header-historico">
                <span class="servico-historico">${ag.servicoNome || ag.servico || 'Serviço'}</span>
                <span class="status-historico ${statusClass}">${statusLabel}</span>
            </div>
            <div class="card-detalhes-historico">
                <span class="detalhe-item">📅 ${dataFormatada}</span>
                <span class="detalhe-item">🕐 ${ag.horario}</span>
                <span class="detalhe-item">💰 R$ ${ag.preco || '—'}</span>
                <span class="detalhe-item">⏱ ${ag.duracao || 60} min</span>
            </div>
            ${ag.observacoes ? `<div class="card-obs-historico">📝 ${ag.observacoes}</div>` : ''}
            <div class="card-acoes-historico">
                ${podeReagender
                    ? `<button class="botao-acao reagendar" data-id="${ag.id}"
                        data-servico="${ag.servicoNome || ag.servico || ''}"
                        data-servicoid="${ag.servicoId || ''}"
                        data-preco="${ag.preco || ''}"
                        data-duracao="${ag.duracao || 60}">Reagendar</button>`
                    : ''}
                ${ag.status === 'pendente' && ag.clienteTelefone
                    ? `<a class="botao-acao whatsapp" href="${gerarLinkWhatsApp(ag.clienteTelefone, `Olá! Seu agendamento do dia ${dataFormatada} às ${ag.horario} está confirmado? 😊`)}" target="_blank">WhatsApp</a>`
                    : ''}
            </div>
        </div>
    `;
}

function formatarData(dataStr) {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const mes = parseInt(partes[1]) - 1;
    return `${parseInt(partes[2])} de ${meses[mes]} de ${partes[0]}`;
}

function inicializarEventosHistorico() {
    const botoesFiltro = document.querySelectorAll('.botao-filtro');
    botoesFiltro.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesFiltro.forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            const filtro = btn.dataset.filtro;
            aplicarFiltroStatus(filtro);
        });
    });

    document.querySelectorAll('.botao-acao.reagendar').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const servico = btn.dataset.servico;
            const servicoId = btn.dataset.servicoid;
            const preco = btn.dataset.preco;
            const duracao = btn.dataset.duracao;
            window.location.href = `agendamento.html?reagendar=true&agendamentoId=${id}&servico=${encodeURIComponent(servico)}&servicoId=${servicoId}&preco=${preco}&duracao=${duracao}`;
        });
    });
}

function aplicarFiltroStatus(filtro) {
    const cards = document.querySelectorAll('.card-agendamento-historico');

    cards.forEach(card => {
        if (filtro === 'todos') {
            card.style.display = '';
            return;
        }

        const status = card.dataset.status;
        card.style.display = status === filtro ? '' : 'none';
    });
}

async function inicializarRefreshHistorico() {
    await inicializarRefresh('historico', refreshHistoricoCompleto);

    document.removeEventListener('visibilitychange', globalRefreshPage);
    document.addEventListener('visibilitychange', globalRefreshPage);

    window.globalRefreshPage = refreshHistoricoCompleto;

    const header = document.querySelector('.header-perfil');
    if (header) {
        adicionarBotaoRefreshHeader(header, refreshHistoricoCompleto);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarHistorico);
} else {
    inicializarHistorico();
}
