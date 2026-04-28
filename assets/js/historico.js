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
        <header class="header-historico">
            <a href="dashboard.html" class="logo-header">
                <img src="../data/img/favicon.svg" alt="Jeci Nails">
                <span class="texto-logo">Jeci Nails</span>
            </a>
            <a href="dashboard.html" class="botao-voltar">←</a>
        </header>

        <main class="container-historico">
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
            
            <a href="agendamento.html" class="btn-novo-agendamento">Agendar Novo Serviço</a>
        </main>
    `;
}

function gerarHtmlCards(agendamentos, classeTipo, mensagemVazio) {
    if (agendamentos.length === 0) {
        return `<div class="sem-agendamentos">${mensagemVazio}</div>`;
    }

    return agendamentos.map(ag => {
        const statusStr = ag.status || 'pendente';
        const badgeClass = `status-${statusStr}`;
        const badgeTexto = statusStr === 'confirmado' ? 'Confirmado' :
                           statusStr === 'cancelado' ? 'Cancelado' : 'Pendente';
                           
        return `
        <div class="card-agendamento ${classeTipo}">
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
                    <span>${ag.horario} (${ag.duracao} min)</span>
                </div>
                <div class="detalhe-item">
                    <span>💰</span>
                    <span>R$ ${parseFloat(ag.preco).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarHistorico);
} else {
    inicializarHistorico();
}
