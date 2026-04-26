/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DE AGENDAMENTO
   Frontend com dados mock
   ================================================ */

/* ================================================
   VARIÁVEIS GLOBAIS
   ================================================ */
let servicoSelecionado = null;
let dataSelecionada = null;
let horarioSelecionado = null;
letStepAtual = 1;
let dataCalendario = new Date();

/* ================================================
   DADOS MOCK
   ================================================ */
const dadosMock = {
    servicos: [
        { id: 1, nome: "Manicure", preco: 50, duracao: 60, icone: "💅" },
        { id: 2, nome: "Pedicure", preco: 45, duracao: 60, icone: "🦶" },
        { id: 3, nome: "Unhas Decoradas", preco: 120, duracao: 90, icone: "✨" },
        { id: 4, nome: "Spa dos Pés", preco: 80, duracao: 45, icone: "🌸" }
    ],
    configuracoes: {
        segundaAbertura: "09:00",
        segundaIntervaloInicio: "12:00",
        segundaIntervaloFim: "13:00",
        segundaFechamento: "19:00",
        sabadoAbertura: "09:00",
        sabadoFechamento: "17:00",
        domingoFechado: true,
        tempoEntreAgendamentos: 15
    },
    agendamentos: [
        { data: "2025-04-26", horario: "14:00" }
    ]
};

const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ================================================
   INICIALIZAÇÃO
   ================================================ */
function inicializarAgendamento() {
    const status = document.getElementById('status');
    
    firebase.auth().onAuthStateChanged(async (usuario) => {
        console.log('[DEBUG] Usuário:', usuario);
        
        try {
            if (!usuario) {
                status.textContent = 'Você precisa estar logado. Redirecionando...';
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                return;
            }
            
            // Renderiza a página de agendamento
            exibirPaginaAgendamento(usuario);
            
        } catch (erro) {
            console.error('[DEBUG] Erro:', erro);
            status.textContent = 'Erro ao carregar: ' + erro.message;
        }
    });
}

/* ================================================
   EXIBIR PÁGINA DE AGENDAMENTO
   ================================================ */
function exibirPaginaAgendamento(usuario) {
    document.body.innerHTML = criarEstruturaAgendamento(usuario);
    inicializarEventos();
    renderizarServicos();
}

/* ================================================
   CRIAR ESTRUTURA HTML
   ================================================ */
function criarEstruturaAgendamento(usuario) {
    return `
        <header class="header-agendamento">
            <a href="dashboard.html" class="logo-header">
                <img src="../data/img/favicon.svg" alt="Jeci Nails">
                <span class="texto-logo">Jeci Nails</span>
            </a>
            <a href="dashboard.html" class="botao-voltar">←</a>
        </header>
        
        <main class="container-agendamento">
            <h1 class="titulo-pagina">Agendar Serviço</h1>
            <p class="subtitulo-pagina">Escolha o serviço, data e horário</p>
            
            <div class="passos-container">
                <div class="passo ativo" id="passo-1">
                    <span class="numero-passo">1</span>
                    <span class="texto-passo">Serviço</span>
                </div>
                <div class="passo" id="passo-2">
                    <span class="numero-passo">2</span>
                    <span class="texto-passo">Data</span>
                </div>
                <div class="passo" id="passo-3">
                    <span class="numero-passo">3</span>
                    <span class="texto-passo">Horário</span>
                </div>
                <div class="passo" id="passo-4">
                    <span class="numero-passo">4</span>
                    <span class="texto-passo">Confirmar</span>
                </div>
            </div>
            
            <!-- Passo 1: Seleção de Serviço -->
            <section class="secao-agendamento ativa" id="secao-1">
                <h2 class="titulo-secao">
                    <span class="icone-secao">💅</span>
                    Selecione um Serviço
                </h2>
                <div class="grid-servicos" id="grid-servicos">
                    <!-- Serviços renderizados via JS -->
                </div>
                <button class="botao-proximo" id="btn-passo-1" disabled>
                    Continuar
                </button>
            </section>
            
            <!-- Passo 2: Escolher Data -->
            <section class="secao-agendamento" id="secao-2">
                <h2 class="titulo-secao">
                    <span class="icone-secao">📅</span>
                    Escolha a Data
                </h2>
                <div class="calendario-opcoes">
                    <div class="calendario-header">
                        <button class="botao-nav-calendario" id="btn-mes-anterior">◀</button>
                        <span class="mes-calendario" id="mes-atual"></span>
                        <button class="botao-nav-calendario" id="btn-mes-proximo">▶</button>
                    </div>
                    <div class="dias-semana">
                        ${nomesDias.map(dia => `<span>${dia}</span>`).join('')}
                    </div>
                    <div class="dias-calendario" id="dias-calendario">
                        <!-- Dias renderizados via JS -->
                    </div>
                </div>
                <button class="botao-proximo" id="btn-passo-2" disabled>
                    Continuar
                </button>
                <button class="botao-voltar-passo" id="btn-voltar-2">
                    ← Voltar
                </button>
            </section>
            
            <!-- Passo 3: Escolher Horário -->
            <section class="secao-agendamento" id="secao-3">
                <h2 class="titulo-secao">
                    <span class="icone-secao">🕐</span>
                    Escolha o Horário
                </h2>
                
                <div class="servico-selecionado-info" id="info-servico-selecionado">
                    <!-- info do serviço -->
                </div>
                
                <div class="grid-horarios" id="grid-horarios">
                    <!-- Horários renderizados via JS -->
                </div>
                
                <button class="botao-proximo" id="btn-passo-3" disabled>
                    Continuar
                </button>
                <button class="botao-voltar-passo" id="btn-voltar-3">
                    ← Voltar
                </button>
            </section>
            
            <!-- Passo 4: Confirmação -->
            <section class="secao-agendamento" id="secao-4">
                <h2 class="titulo-secao">
                    <span class="icone-secao">✅</span>
                    Confirmar Agendamento
                </h2>
                
                <div class="card-confirmacao" id="card-confirmacao">
                    <!-- Dados da confirmação -->
                </div>
                
                <div class="campo-input">
                    <label>Observações (opcional)</label>
                    <textarea id="observacoes" rows="3" 
                        placeholder="Alguma observação ou solicitação especial..."></textarea>
                </div>
                
                <button class="botao-proximo" id="btn-confirmar">
                    Confirmar Agendamento
                </button>
                <button class="botao-voltar-passo" id="btn-voltar-4">
                    ← Voltar
                </button>
            </section>
        </main>
    `;
}

/* ================================================
   INICIALIZAR EVENTOS
   ================================================ */
function inicializarEventos() {
    // Navegação do calendário
    document.getElementById('btn-mes-anterior').addEventListener('click', () => {
        dataCalendario.setMonth(dataCalendario.getMonth() - 1);
        renderizarCalendario();
    });
    
    document.getElementById('btn-mes-proximo').addEventListener('click', () => {
        dataCalendario.setMonth(dataCalendario.getMonth() + 1);
        renderizarCalendario();
    });
    
    // Botões de navegação
    document.getElementById('btn-passo-1').addEventListener('click', () => irParaPasso(2));
    document.getElementById('btn-passo-2').addEventListener('click', () => irParaPasso(3));
    document.getElementById('btn-passo-3').addEventListener('click', () => irParaPasso(4));
    
    document.getElementById('btn-voltar-2').addEventListener('click', () => irParaPasso(1));
    document.getElementById('btn-voltar-3').addEventListener('click', () => irParaPasso(2));
    document.getElementById('btn-voltar-4').addEventListener('click', () => irParaPasso(3));
    
    // Confirmar
    document.getElementById('btn-confirmar').addEventListener('click', confirmarAgendamento);
    
    // Renderiza calendário
    renderizarCalendario();
}

/* ================================================
   IR PARA PASSO
   ================================================ */
function irParaPasso(passo) {
    // Validar antes de avançar
    if (passo > 1 && passo <= 3) {
        if (passo === 2 && !servicoSelecionado) {
            alert('Por favor, selecione um serviço.');
            return;
        }
        if (passo === 3 && !dataSelecionada) {
            alert('Por favor, selecione uma data.');
            return;
        }
        if (passo === 4 && !horarioSelecionado) {
            alert('Por favor, selecione um horário.');
            return;
        }
    }
    
    if (passo === 3) {
        renderizarHorarios();
    }
    
    if (passo === 4) {
        renderizarConfirmacao();
    }
    
    // Atualizar visual dos passos
    for (let i = 1; i <= 4; i++) {
        const passoEl = document.getElementById(`passo-${i}`);
        const secaoEl = document.getElementById(`secao-${i}`);
        
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
   RENDERIZAR SERVIÇOS
   ================================================ */
function renderizarServicos() {
    const container = document.getElementById('grid-servicos');
    if (!container) return;
    
    let html = '';
    dadosMock.servicos.forEach(servico => {
        html += `
            <div class="card-servico-opcao" data-id="${servico.id}">
                <span class="icone-servico-opcao">${servico.icone}</span>
                <p class="nome-servico-opcao">${servico.nome}</p>
                <p class="preco-servico-opcao">R$ ${servico.preco}</p>
                <p class="duracao-servico-opcao">${servico.duracao} min</p>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Adicionar eventos de seleção
    document.querySelectorAll('.card-servico-opcao').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.card-servico-opcao').forEach(c => c.classList.remove('selecionado'));
            card.classList.add('selecionado');
            
            servicoSelecionado = dadosMock.servicos.find(s => s.id == card.dataset.id);
            
            document.getElementById('btn-passo-1').disabled = false;
        });
    });
}

/* ================================================
   RENDERIZAR CALENDÁRIO
   ================================================ */
function renderizarCalendario() {
    const mesEl = document.getElementById('mes-atual');
    const diasEl = document.getElementById('dias-calendario');
    if (!mesEl || !diasEl) return;
    
    // Mês atual
    const mes = dataCalendario.getMonth();
    const ano = dataCalendario.getFullYear();
    mesEl.textContent = `${nomesMeses[mes]} ${ano}`;
    
    // Calcular dias
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaPrimeiro = primeiroDia.getDay();
    
    let html = '';
    
    // Dias vazios
    for (let i = 0; i < diaSemanaPrimeiro; i++) {
        html += '<span class="dia-vazio"></span>';
    }
    
    const hoje = new Date();
    const config = dadosMock.configuracoes;
    
    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataObj = new Date(ano, mes, dia);
        const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const diaSemana = dataObj.getDay();
        
        // Verificar se é válido
        let indisponivel = false;
        let bloqueado = false;
        
        // Dia passado
        if (dataObj < hoje && dataObj.toDateString() !== hoje.toDateString()) {
            indisponivel = true;
        }
        
        // Domingo
        if (diaSemana === 0 && config.domingoFechado) {
            bloqueado = true;
        }
        
        // Sábado
        const isSabado = (diaSemana === 6);
        
        html += `
            <span class="dia-cal ${indisponivel ? 'indisponivel' : ''} ${bloqueado ? 'bloqueado' : ''}" 
                  data-data="${dataStr}" 
                  data-dia="${dia}"
                  ${(isSabado && !config.sabadoAbertura) ? 'data-bloqueado="sabado"' : ''}>
                ${dia}
            </span>
        `;
    }
    
    diasEl.innerHTML = html;
    
    // Adicionar eventos
    document.querySelectorAll('.dia-cal').forEach(diaEl => {
        diaEl.addEventListener('click', () => {
            if (diaEl.classList.contains('indisponivel') || diaEl.classList.contains('bloqueado')) {
                return;
            }
            
            document.querySelectorAll('.dia-cal').forEach(d => d.classList.remove('selecionado'));
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
   RENDERIZAR HORÁRIOS
   ================================================ */
function renderizarHorarios() {
    const container = document.getElementById('grid-horarios');
    const infoContainer = document.getElementById('info-servico-selecionado');
    if (!container) return;
    
    // Info do serviço
    if (infoContainer) {
        infoContainer.innerHTML = `
            <span class="icone-info-servico">${servicoSelecionado.icone}</span>
            <div class="texto-info-servico">
                <strong>${servicoSelecionado.nome}</strong>
                R$ ${servicoSelecionado.preco} • ${servicoSelecionado.duracao} min
            </div>
        `;
    }
    
    // Gerar horários
    const config = dadosMock.configuracoes;
    const horariosOcupados = dadosMock.agendamentos
        .filter(a => a.data === dataSelecionada.str)
        .map(a => a.horario);
    
    const horarios = gerarHorarios(dataSelecionada.str, servicoSelecionado.duracao, config, horariosOcupados);
    
    let html = '';
    horarios.forEach(h => {
        const disponivel = !h.indisponivel;
        html += `
            <div class="card-horario ${!disponivel ? 'indisponivel' : ''}" 
                  data-horario="${h.horario}"
                  ${!disponivel ? 'data-indisponivel="true"' : ''}>
                <span class="horario-texto">${h.horario}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Eventos
    document.querySelectorAll('.card-horario').forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.indisponivel === 'true') return;
            
            document.querySelectorAll('.card-horario').forEach(c => c.classList.remove('selecionado'));
            card.classList.add('selecionado');
            
            horarioSelecionado = card.dataset.horario;
            document.getElementById('btn-passo-3').disabled = false;
        });
    });
}

/* ================================================
   GERAR HORÁRIOS
   ================================================ */
function gerarHorarios(dataStr, duracao, config, ocupados) {
    const horarios = [];
    
    // Determinar horário de funcionamento
    const dataObj = new Date(dataStr);
    const diaSemana = dataObj.getDay();
    const isSabado = (diaSemana === 6);
    
    let abertura, fechamento;
    if (isSabado && config.sabadoAbertura) {
        abertura = config.sabadoAbertura;
        fechamento = config.sabadoFechamento;
    } else {
        abertura = config.segundaAbertura;
        fechamento = config.segundaFechamento;
    }
    
    if (!abertura || !fechamento) return horarios;
    
    // Converter para minutos
    const [horaAbr, minAbr] = abertura.split(':').map(Number);
    const [horaFec, minFec] = fechamento.split(':').map(Number);
    let minInicio = horaAbr * 60 + minAbr;
    const minFim = horaFec * 60 + minFec;
    
    // Intervalo de almoço (segunda a sexta)
    const intInicio = isSabado ? null : config.segundaIntervaloInicio;
    const intFim = isSabado ? null : config.segundaIntervaloFim;
    let minIntInicio = intInicio ? intInicio.split(':').map(Number).reduce((a, b) => a * 60 + b) : null;
    let minIntFim = intFim ? intFim.split(':').map(Number).reduce((a, b) => a * 60 + b) : null;
    
    // Gerar horários
    while (minInicio + duracao <= minFim) {
        const hora = Math.floor(minInicio / 60);
        const min = minInicio % 60;
        const horarioStr = `${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        
        let indisponivel = false;
        if (ocupados.includes(horarioStr)) {
            indisponivel = true;
        }
        
        // Verificar se está no intervalo
        if (minIntInicio && minIntFim) {
            if (minInicio >= minIntInicio && minInicio < minIntFim) {
                indisponivel = true;
            }
        }
        
        horarios.push({
            horario: horarioStr,
            indisponivel: indisponivel
        });
        
        minInicio += (duracao + config.tempoEntreAgendamentos);
    }
    
    return horarios;
}

/* ================================================
   RENDERIZAR CONFIRMAÇÃO
   ================================================ */
function renderizarConfirmacao() {
    const container = document.getElementById('card-confirmacao');
    if (!container) return;
    
    const dataBr = formatarData(dataSelecionada.str);
    
    container.innerHTML = `
        <div class="linha-confirmacao">
            <span class="label-confirmacao">Serviço</span>
            <span class="valor-confirmacao">${servicoSelecionado.nome}</span>
        </div>
        <div class="linha-confirmacao">
            <span class="label-confirmacao">Data</span>
            <span class="valor-confirmacao">${dataBr}</span>
        </div>
        <div class="linha-confirmacao">
            <span class="label-confirmacao">Horário</span>
            <span class="valor-confirmacao">${horarioSelecionado} (${servicoSelecionado.duracao} min)</span>
        </div>
        <div class="linha-confirmacao">
            <span class="label-confirmacao">Valor</span>
            <span class="valor-confirmacao total-valor">R$ ${servicoSelecionado.preco}</span>
        </div>
    `;
}

/* ================================================
   FORMATAR DATA
   ================================================ */
function formatarData(dataStr) {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return `${dia} de ${nomesMeses[mes - 1]} de ${ano}`;
}

/* ================================================
   CONFIRMAR AGENDAMENTO
   ================================================ */
async function confirmarAgendamento() {
    const observacoes = document.getElementById('observacoes').value;
    
    const dados = {
        servico: servicoSelecionado.nome,
        servicoId: servicoSelecionado.id,
        preco: servicoSelecionado.preco,
        duracao: servicoSelecionado.duracao,
        data: dataSelecionada.str,
        horario: horarioSelecionado,
        observacoes: observacoes
    };
    
    console.log('[DEBUG] Agendamento:', dados);
    
    // BACKEND IGNORADO - mock de salvamento
    /* try {
        await firebase.firestore().collection('agendamentos').add({
            ...dados,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (erro) {
        console.error('[DEBUG] Erro:', erro);
    } */
    
    // Simular sucesso
    alert(`Agendamento confirmado!\n\n${servicoSelecionado.nome}\n${formatarData(dataSelecionada.str)} às ${horarioSelecionado}\n\nR$ ${servicoSelecionado.preco}\n\nEm breve você receberá a confirmação.`);
    
    // Redirecionar para dashboard
    window.location.href = 'dashboard.html';
}