/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO HISTÓRICO
   ================================================ */

function inicializarHistorico() {
    const status = document.getElementById('status');
    
    firebase.auth().onAuthStateChanged(async (usuario) => {
        if (!usuario) {
            if(status) status.textContent = 'Você precisa estar logado. Redirecionando...';
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            return;
        }

        try {
            const usuarioDoc = await firebase.firestore().collection('usuarios').doc(usuario.uid).get();
            const usuarioDados = usuarioDoc.data() || {};
            usuario.nome = usuarioDados.nome || usuario.displayName || 'Cliente';

            // Buscar Agendamentos do Usuário
            const agendamentosSnap = await firebase.firestore().collection('agendamentos')
                .where('userId', '==', usuario.uid)
                .get();

            const agendamentos = agendamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Separar futuros e passados
            const hojeStr = new Date().toISOString().split('T')[0];
            
            const futuros = agendamentos.filter(ag => ag.data >= hojeStr).sort(ordenarAgendamentos);
            const passados = agendamentos.filter(ag => ag.data < hojeStr).sort(ordenarAgendamentosDesc);

            renderizarTela(futuros, passados);
            
        } catch (erro) {
            console.error('[DEBUG] Erro:', erro);
            if(status) status.textContent = 'Erro ao carregar: ' + erro.message;
        }
    });
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

function formatarData(dataStr) {
    const nomesMeses = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return `${dia} de ${nomesMeses[mes - 1]} de ${ano}`;
}

function renderizarTela(futuros, passados) {
    document.body.innerHTML = `
        <header class="header-perfil">
            <a href="dashboard.html" class="logo-header">
                <img src="../data/img/Logo_JeciVieira_NailsDesigner.svg" alt="Jeci Vieira Nails" class="imagem-logo-topo">
            </a>
            <a href="dashboard.html" class="botao-voltar">←</a>
        </header>

        <main class="container-perfil">
            <h1 class="titulo-pagina">Meus Agendamentos</h1>
            <p class="subtitulo-pagina">Acompanhe seus horários marcados</p>

            <section class="secao-historico">
                <h2 class="titulo-secao">Próximos Agendamentos</h2>
                <div class="lista-agendamentos">
                    ${gerarHtmlCards(futuros, 'futuro', 'Você não tem horários agendados para o futuro.')}
                </div>
            </section>

            <section class="secao-historico">
                <h2 class="titulo-secao">Histórico</h2>
                <div class="lista-agendamentos">
                    ${gerarHtmlCards(passados, 'passado', 'Nenhum agendamento no histórico.')}
                </div>
            </section>
            
            <a href="agendamento.html" class="botao-agendar">Agendar Novo Serviço</a>
        </main>
    `;
}

function gerarHtmlCards(agendamentos, classeTipo, mensagemVazio) {
    if (agendamentos.length === 0) {
        return `<div class="sem-agendamentos">${mensagemVazio}</div>`;
    }

    const agora = new Date();
    const hojeStr = agora.toISOString().split('T')[0];

    return agendamentos.map(ag => {
        const statusStr = ag.status || 'pendente';
        const badgeClass = `status-${statusStr}`;
        const badgeTexto = statusStr === 'confirmado' ? 'Confirmado' :
                           statusStr === 'cancelado' ? 'Cancelado' : 'Pendente';
        
        const dataAgend = new Date(ag.data + 'T' + ag.horario);
        const horasRestantes = (dataAgend - agora) / (1000 * 60 * 60);
        const podeReagendar = horasRestantes > 24 && statusStr !== 'cancelado';
        const podeCancelar = statusStr !== 'cancelado';
        
        return `
        <div class="card-agendamento ${classeTipo}" data-id="${ag.id}">
            <div class="card-topo">
                <span class="servico-nome">${ag.servico}</span>
                <span class="status-badge ${badgeClass}">${badgeTexto}</span>
            </div>
            <div class="card-detalhes">
                <div class="detalhe-item">
                    <span>📅</span>
                    <span>${formatarData(ag.data)}</span>
                </div>
                <div class="detalhe-item">
                    <span>🕐</span>
                    <span>${ag.horario} (${ag.duracao || 60} min)</span>
                </div>
                <div class="detalhe-item">
                    <span>💰</span>
                    <span>R$ ${parseFloat(ag.preco || 0).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
            ${classeTipo === 'futuro' ? `
            <div class="card-botoes">
                ${podeCancelar ? `<button class="botao-card cancelar" data-id="${ag.id}" data-acao="cancelar">Cancelar</button>` : ''}
                ${podeReagendar ? `<button class="botao-card reagendar" data-id="${ag.id}" data-acao="reagendar" data-servico="${encodeURIComponent(ag.servico)}" data-servicoId="${ag.servicoId}" data-preco="${ag.preco}" data-duracao="${ag.duracao || 60}">Reagendar</button>` : ''}
            </div>
            ` : ''}
        </div>
        `;
    }).join('');
}

/* ================================================
   SISTEMA DE MODAIS (local)
   ================================================ */
function criarModalLocal() {
    const existing = document.getElementById('modal-historico');
    if (existing) return existing;
    
    const modal = document.createElement('div');
    modal.id = 'modal-historico';
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
            modal.classList.remove('ativo');
        }
    });
    
    return modal;
}

async function mostrarAlertaLocal(titulo, mensagem, tipo = 'info') {
    return new Promise((resolve) => {
        const modal = criarModalLocal();
        
        const icons = { sucesso: '✅', erro: '❌', alerta: '⚠️', info: 'ℹ️' };
        const btnStyles = { sucesso: 'primario', erro: 'danger', alerta: 'secundario', info: 'primario' };
        
        modal.querySelector('.modal-icon').textContent = icons[tipo] || icons.info;
        modal.querySelector('.modal-titulo').textContent = titulo;
        modal.querySelector('.modal-mensagem').innerHTML = mensagem;
        modal.querySelector('.modal-botoes').innerHTML = `
            <button class="modal-botao ${btnStyles[tipo] || 'primario'}" id="modal-ok-historico">OK</button>
        `;
        
        modal.classList.add('ativo');
        
        const cleanup = () => {
            modal.classList.remove('ativo');
        };
        
        document.getElementById('modal-ok-historico').addEventListener('click', () => {
            cleanup();
            resolve();
        });
    });
}

async function mostrarConfirmLocal(titulo, mensagem, tipo = 'alerta') {
    return new Promise((resolve) => {
        const modal = criarModalLocal();
        
        const icons = { alerta: '⚠️', danger: '⚠️', bloq: '🔒' };
        
        modal.querySelector('.modal-icon').textContent = icons[tipo] || icons.alerta;
        modal.querySelector('.modal-titulo').textContent = titulo;
        modal.querySelector('.modal-mensagem').innerHTML = mensagem;
        modal.querySelector('.modal-botoes').innerHTML = `
            <button class="modal-botao secundario" id="modal-cancel-historico">Cancelar</button>
            <button class="modal-botao danger" id="modal-confirm-historico">Confirmar</button>
        `;
        
        modal.classList.add('ativo');
        
        const cleanup = () => {
            modal.classList.remove('ativo');
        };
        
        document.getElementById('modal-cancel-historico').addEventListener('click', () => {
            cleanup();
            resolve(false);
        });
        
        document.getElementById('modal-confirm-historico').addEventListener('click', () => {
            cleanup();
            resolve(true);
        });
    });
}

/* ================================================
   AÇÕES DOS BOTÕES (Cancelar/Reagendar)
   ================================================ */
async function cancelarAgendamentoCliente(id) {
    const confirmar = await mostrarConfirmLocal(
        'Cancelar Agendamento',
        'Tem certeza que deseja excluir este agendamento?<br><br>Esta ação não pode ser desfeita.',
        'alerta'
    );
    
    if (!confirmar) return;
    
    try {
        // Excluir permanentemente do banco de dados
        await firebase.firestore().collection('agendamentos').doc(id).delete();
        
        await mostrarAlertaLocal('Excluído', 'Agendamento excluído com sucesso!', 'sucesso');
        
        setTimeout(() => window.location.reload(), 1500);
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao excluir:', erro);
        await mostrarAlertaLocal('Erro', 'Erro ao excluir agendamento. Tente novamente.', 'erro');
    }
}

function reagendarAgendamento(agendamentoId, servico, servicoId, preco, duracao) {
    const params = new URLSearchParams({
        reagendar: 'true',
        agendamentoId: agendamentoId,
        servico: servico || '',
        servicoId: servicoId || '',
        preco: preco || '',
        duracao: duracao || '60'
    });
    
    window.location.href = `agendamento.html?${params.toString()}`;
}

async function verificarReagendamento(botao) {
    const podeReagendar = botao.classList.contains('reagendar');
    
    if (!podeReagendar) {
        await mostrarAlertaLocal(
            'Reagendamento',
            'Para reagendar, você precisa ter pelo menos 24 horas de antecedência.<br><br>Por favor, entre em contato com o administrador para alterar seu horário.',
            'alerta'
        );
        return;
    }
    
    const id = botao.dataset.id;
    const servico = decodeURIComponent(botao.dataset.servico || '');
    const servicoId = botao.dataset.servicoId;
    const preco = botao.dataset.preco;
    const duracao = botao.dataset.duracao;
    
    reagendarAgendamento(id, servico, servicoId, preco, duracao);
}

/* ================================================
   INICIALIZAÇÃO
   ================================================ */
function setupBotoesAcoes() {
    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('botao-card')) {
            const botao = e.target;
            const acao = botao.dataset.acao;
            const id = botao.dataset.id;
            
            if (acao === 'cancelar') {
                await cancelarAgendamentoCliente(id);
            } else if (acao === 'reagendar') {
                await verificarReagendamento(botao);
            }
        }
    });
}

function iniciar() {
    inicializarHistorico();
    setupBotoesAcoes();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
} else {
    iniciar();
}
