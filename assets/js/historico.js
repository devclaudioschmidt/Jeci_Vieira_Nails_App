/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO HISTÓRICO
   ================================================ */

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

/* Telefone do salão (carregado do Firestore) */
let telefoneAdm = '';


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

            // Buscar telefone do ADM nas configurações
            try {
                const configSnap = await firebase.firestore().collection('configuracoes').doc('salao').get();
                telefoneAdm = (configSnap.data() || {}).telefone || '';
            } catch(e) { /* ignora */ }

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
                ${podeCancelar ? `<button class="botao-card cancelar" data-id="${ag.id}" data-servico="${encodeURIComponent(ag.servico)}" data-data="${ag.data}" data-horario="${ag.horario}" data-acao="cancelar">Cancelar</button>` : ''}
                ${podeReagendar ? `<button class="botao-card reagendar" data-id="${ag.id}" data-acao="reagendar" data-servico="${encodeURIComponent(ag.servico)}" data-servicoId="${ag.servicoId}" data-preco="${ag.preco}" data-duracao="${ag.duracao || 60}">Reagendar</button>` : ''}
                ${telefoneAdm ? (() => {
                    const msgWpp = `Olá! Gostaria de falar sobre meu agendamento de ${ag.servico} no dia ${formatarData(ag.data)} às ${ag.horario}. 😊`;
                    const link = gerarLinkWhatsApp(telefoneAdm, msgWpp);
                    return link ? `<a class="botao-card whatsapp-card" href="${link}" target="_blank" rel="noopener" title="Contatar salão">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:4px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Falar com salão
                    </a>` : '';
                })() : ''}
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
    // Pegar dados do agendamento antes de cancelar
    const card = document.querySelector(`.card-agendamento[data-id="${id}"]`);
    const servicoNome = card ? decodeURIComponent(card.querySelector('.botao-card.cancelar')?.dataset.servico || '') || 'agendamento' : 'agendamento';
    const dataAgend = card ? card.querySelector('.botao-card.cancelar')?.dataset.data || '' : '';
    const horarioAgend = card ? card.querySelector('.botao-card.cancelar')?.dataset.horario || '' : '';

    const confirmar = await mostrarConfirmLocal(
        'Cancelar Agendamento',
        'Tem certeza que deseja excluir este agendamento?<br><br>Esta ação não pode ser desfeita.',
        'alerta'
    );
    
    if (!confirmar) return;
    
    try {
        // Excluir permanentemente do banco de dados
        await firebase.firestore().collection('agendamentos').doc(id).delete();
        
        // Gerar link WhatsApp para avisar ADM
        const msgCancelamento = `Olá! Infelizmente precisei cancelar meu agendamento. 😟\n\nServiço: ${servicoNome || 'agendamento'}\n${dataAgend ? 'Data: ' + formatarData(dataAgend) : ''}\n${horarioAgend ? 'Horário: ' + horarioAgend : ''}\n\nSe precisar, estou à disposição para reagendar!`;
        const linkWppAdm = gerarLinkWhatsApp(telefoneAdm, msgCancelamento);

        // Modal de sucesso com botão de WhatsApp
        const modal = criarModalLocal();
        modal.querySelector('.modal-icon').textContent = '✅';
        modal.querySelector('.modal-titulo').textContent = 'Agendamento Cancelado';
        modal.querySelector('.modal-mensagem').innerHTML = 'Agendamento excluído com sucesso!';
        modal.querySelector('.modal-botoes').innerHTML = `
            ${linkWppAdm ? `<a class="modal-botao whatsapp" href="${linkWppAdm}" target="_blank" rel="noopener">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:4px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Avisar ADM via WhatsApp
            </a>` : ''}
            <button class="modal-botao primario" id="modal-ok-cancelamento">OK</button>
        `;
        modal.classList.add('ativo');
        document.getElementById('modal-ok-cancelamento').addEventListener('click', () => {
            modal.classList.remove('ativo');
            window.location.reload();
        });
        
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
        // Usa closest para capturar cliques em elementos filhos (ex: SVG)
        // Só captura botões com data-acao (exclui links WhatsApp)
        const botao = e.target.closest('[data-acao]');
        if (!botao) return;

        const acao = botao.dataset.acao;
        const id = botao.dataset.id;

        if (acao === 'cancelar') {
            await cancelarAgendamentoCliente(id);
        } else if (acao === 'reagendar') {
            await verificarReagendamento(botao);
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
