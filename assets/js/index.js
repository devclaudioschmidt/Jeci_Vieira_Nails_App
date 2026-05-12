let dadosSalon = {};
let agendamentoLocal = null;
let consultandoTelefone = false;

function formatarDataLocal(dataStr) {
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

function formatarTelefoneLocal(valor) {
    const nums = valor.replace(/\D/g, '').slice(0, 11);
    if (nums.length > 6) {
        return '(' + nums.slice(0, 2) + ') ' + nums.slice(2, 7) + '-' + nums.slice(7);
    } else if (nums.length > 2) {
        return '(' + nums.slice(0, 2) + ') ' + nums.slice(2);
    } else if (nums.length > 0) {
        return '(' + nums;
    }
    return nums;
}

function getStatusAgendamentoStyle(status) {
    if (status === 'pendente') return { cor: '#f59e0b', label: 'Pendente' };
    if (status === 'confirmado') return { cor: '#10b981', label: 'Confirmado' };
    if (status === 'cancelado') return { cor: '#ef4444', label: 'Cancelado' };
    return { cor: '#6b7280', label: status };
}

function carregarAgendamentoLocal() {
    try {
        const salvo = localStorage.getItem('meuAgendamento');
        if (!salvo) return;

        const dados = JSON.parse(salvo);
        if (!dados || !dados.id || !dados.timestamp) return;

        const UM_DIA_MS = 24 * 60 * 60 * 1000;
        if (Date.now() - dados.timestamp > UM_DIA_MS) {
            localStorage.removeItem('meuAgendamento');
            return;
        }

        agendamentoLocal = dados;
    } catch (e) {
        console.warn('[Index] Erro ao ler localStorage:', e);
    }
}

async function carregarDadosSalon() {
    carregarAgendamentoLocal();

    try {
        const [configResult, avisoResult] = await Promise.all([
            firestoreService.carregarConfiguracoes(),
            firestoreService.carregarAvisoAtivo()
        ]);

        if (configResult.success) {
            dadosSalon = configResult.data;
        }

        renderizarPagina(avisoResult.success ? avisoResult.data : null);
    } catch (erro) {
        console.error('[Index] Erro ao carregar dados:', erro);
        renderizarPagina(null);
    }
}

function criarCardAgendamentoLocal() {
    if (!agendamentoLocal) return '';

    const dataBr = formatarDataLocal(agendamentoLocal.data);

    return `
        <div class="meu-agendamento-card">
            <div class="meu-agendamento-header">
                <span class="meu-agendamento-icon">✅</span>
                <span class="meu-agendamento-titulo">Seu Agendamento</span>
            </div>
            <div class="meu-agendamento-body">
                <div class="meu-agendamento-linha">
                    <span class="meu-agendamento-label">Serviço</span>
                    <span class="meu-agendamento-valor">${agendamentoLocal.servico}</span>
                </div>
                <div class="meu-agendamento-linha">
                    <span class="meu-agendamento-label">Data</span>
                    <span class="meu-agendamento-valor">${dataBr}</span>
                </div>
                <div class="meu-agendamento-linha">
                    <span class="meu-agendamento-label">Horário</span>
                    <span class="meu-agendamento-valor">${agendamentoLocal.horario}</span>
                </div>
                <div class="meu-agendamento-linha" style="border:none;padding-bottom:0">
                    <span class="meu-agendamento-label">Cliente</span>
                    <span class="meu-agendamento-valor">${agendamentoLocal.clienteNome || '—'}</span>
                </div>
            </div>
            <div class="meu-agendamento-acoes">
                <a href="pages/agendamento.html?reagendar=true&agendamentoId=${agendamentoLocal.id}&servico=${encodeURIComponent(agendamentoLocal.servico)}&preco=&duracao=60" class="meu-agendamento-btn secundario">
                    Reagendar
                </a>
                <button class="meu-agendamento-btn secundario" onclick="removerAgendamentoLocal()">
                    Dispensar
                </button>
            </div>
        </div>
    `;
}

function criarModalConsulta() {
    const overlay = document.createElement('div');
    overlay.className = 'consulta-overlay';
    overlay.id = 'consulta-overlay';
    overlay.innerHTML = `
        <div class="consulta-modal">
            <button class="consulta-fechar" id="consulta-fechar">✕</button>
            <h3 class="consulta-titulo">🔍 Consultar Agendamento</h3>
            <p class="consulta-subtitulo">Digite seu telefone para consultar seus agendamentos</p>
            <div class="consulta-input-group">
                <input type="tel" id="consulta-telefone" class="consulta-input"
                    placeholder="(11) 99999-9999" inputmode="tel" maxlength="15">
                <button class="consulta-buscar" id="consulta-buscar">Buscar</button>
            </div>
            <div id="consulta-resultado" class="consulta-resultado"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('consulta-fechar').addEventListener('click', fecharModalConsulta);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharModalConsulta();
    });

    const input = document.getElementById('consulta-telefone');
    input.addEventListener('input', function () {
        this.value = formatarTelefoneLocal(this.value);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') buscarAgendamentoConsulta();
    });

    document.getElementById('consulta-buscar').addEventListener('click', buscarAgendamentoConsulta);

    overlay.classList.add('ativo');
}

function fecharModalConsulta() {
    const overlay = document.getElementById('consulta-overlay');
    if (overlay) {
        overlay.classList.remove('ativo');
        setTimeout(() => overlay.remove(), 300);
    }
    consultandoTelefone = false;
}

async function buscarAgendamentoConsulta() {
    const input = document.getElementById('consulta-telefone');
    const resultado = document.getElementById('consulta-resultado');
    const botao = document.getElementById('consulta-buscar');
    const telefone = input.value.trim();

    if (!telefone || telefone.replace(/\D/g, '').length < 10) {
        resultado.innerHTML = '<p class="consulta-erro">Digite um telefone válido.</p>';
        return;
    }

    botao.disabled = true;
    botao.textContent = 'Buscando...';
    resultado.innerHTML = '<p class="consulta-carregando">Consultando...</p>';

    const res = await firestoreService.buscarAgendamentoPorTelefone(telefone);

    botao.disabled = false;
    botao.textContent = 'Buscar';

    if (!res.success) {
        resultado.innerHTML = '<p class="consulta-erro">Erro ao consultar. Tente novamente.</p>';
        return;
    }

    if (res.data.length === 0) {
        resultado.innerHTML = '<p class="consulta-vazio">Nenhum agendamento encontrado para este telefone.</p>';
        return;
    }

    let html = '<div class="consulta-lista">';
    res.data.forEach(ag => {
        const info = getStatusAgendamentoStyle(ag.status);
        const dataBr = formatarDataLocal(ag.data);
        html += `
            <div class="consulta-item">
                <div class="consulta-item-header">
                    <strong>${ag.servicoNome || ag.servico || 'Serviço'}</strong>
                    <span class="meu-agendamento-status" style="background:${info.cor}20;color:${info.cor};border:1px solid ${info.cor}40;font-size:11px;padding:2px 8px">${info.label}</span>
                </div>
                <div class="consulta-item-body">
                    <span>📅 ${dataBr}</span>
                    <span>🕐 ${ag.horario}</span>
                    <span>💰 R$ ${ag.preco || '—'}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';

    resultado.innerHTML = html;
}

function removerAgendamentoLocal() {
    localStorage.removeItem('meuAgendamento');
    agendamentoLocal = null;
    const card = document.querySelector('.meu-agendamento-card');
    if (card) {
        card.style.transition = 'opacity 0.3s';
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
    }
}

function renderizarPagina(aviso) {
    const container = document.getElementById('welcome-content');
    const temAviso = !!aviso;
    const temAgendamentoLocal = !!agendamentoLocal;

    container.innerHTML = `
        <div class="welcome-wrapper">
            <header class="welcome-header">
                <img src="data/img/Logo_JeciVieira_NailsDesigner.svg"
                     alt="Jeci Vieira Nails" class="welcome-logo">
                <h1 class="welcome-title">Bem-vinda!</h1>
                <p class="welcome-subtitle">
                    Pronta para um momento de beleza e autocuidado?
                </p>
            </header>

            <div class="welcome-notice ${temAviso ? 'visible' : ''}" id="notice-banner">
                <p class="notice-label">Aviso</p>
                <p class="notice-text">${aviso || ''}</p>
            </div>

            ${temAgendamentoLocal ? criarCardAgendamentoLocal() : ''}

            <div class="welcome-cta">
                <a href="pages/agendamento.html" class="btn-agendar">
                    Agendar horário
                </a>
            </div>

            <div class="welcome-consulta">
                <button class="btn-consultar" id="btn-consultar-agendamento">
                    🔍 Consultar agendamento
                </button>
            </div>

            <div class="welcome-info">
                <div class="info-card">
                    <span class="info-card-title">Informações do Salão</span>
                    <div class="info-row">
                        <span class="info-icon">📞</span>
                        <span>${dadosSalon.telefone || 'Telefone não informado'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">📍</span>
                        <span>${dadosSalon.endereco || 'Endereço não informado'}</span>
                    </div>
                </div>

                <div class="info-card">
                    <span class="info-card-title">Horários</span>
                    <div class="info-hours">
                        <span class="hours-label">Segunda a Sexta</span>
                        <span>${dadosSalon.segundaAbertura || '09:00'} - ${dadosSalon.segundaIntervaloInicio || '12:00'} / ${dadosSalon.segundaIntervaloFim || '13:00'} - ${dadosSalon.segundaFechamento || '19:00'}</span>
                        <div class="hours-divider"></div>
                        <span class="hours-label">Sábado</span>
                        <span>${dadosSalon.sabadoAbertura || '09:00'} - ${dadosSalon.sabadoFechamento || '17:00'}</span>
                        <div class="hours-divider"></div>
                        <span class="hours-label">Domingo e Feriados</span>
                        <span>${dadosSalon.domingoFechado !== false ? 'Fechado' : 'Aberto'}</span>
                    </div>
                </div>
            </div>

            <footer class="welcome-footer">
                <a href="pages/admin-login.html" class="admin-link">
                    Área do Administrador
                </a>
            </footer>
        </div>
    `;

    const btnConsultar = document.getElementById('btn-consultar-agendamento');
    if (btnConsultar) {
        btnConsultar.addEventListener('click', () => {
            if (!consultandoTelefone) {
                consultandoTelefone = true;
                criarModalConsulta();
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarDadosSalon);
} else {
    carregarDadosSalon();
}
