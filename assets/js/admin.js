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
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.card-cliente')?.dataset.id;
            if (id) abrirModalCliente(id);
        });
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