const GAS_URL = 'https://script.google.com/macros/s/AKfycbz_BOZtoRK8-JpUsJTuQ-iMlHwqGa12ln4-g2bga1jLYP5rw4WlHNiE09p2G8JdipC0/exec';

// VERIFICAÇÃO DE AUTENTICAÇÃO
(function checkAuth() {
    const token = localStorage.getItem('admin_auth_token');
    if (!token) {
        window.location.href = 'login.html';
    }
})();

function logout() {
    localStorage.removeItem('admin_auth_token');
    window.location.href = 'login.html';
}

let adminCurrentMonth = new Date().getMonth();
let adminCurrentYear = new Date().getFullYear();
let adminSelectedDate = null;
let allAppointments = [];
let pendingCancelData = null;
let blockedSchedules = [];

document.addEventListener('DOMContentLoaded', () => {
    // Definir data inicial
    const today = new Date();
    adminSelectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Atualiza title do date info
    updateAgendaDateTitle();
    
    // Renderiza calendário
    renderAdminCalendar();

    // Carrega dados
    fetchAppointments();
    fetchBlockedSchedules();
});

function fetchAppointments() {
    const loading = document.getElementById('loadingIndicator');
    loading.style.display = 'flex';
    
    fetch(GAS_URL + '?action=getAgendamentos')
        .then(res => res.json())
        .then(data => {
            allAppointments = Array.isArray(data) ? data : []; 
            loading.style.display = 'none';
            renderAdminCalendar();
            showAgendaForDate(adminSelectedDate);
        })
        .catch(err => {
            console.error('Erro ao buscar agendamentos', err);
            loading.style.display = 'none';
        });
}

function fetchBlockedSchedules() {
    console.log('Buscando bloqueios...');
    console.log('URL:', GAS_URL + '?action=getBloqueios');
    fetch(GAS_URL + '?action=getBloqueios')
        .then(res => {
            console.log('Status:', res.status, res.statusText);
            return res.json();
        })
        .then(data => {
            console.log('Bloqueios recebidos:', data);
            blockedSchedules = Array.isArray(data) ? data : [];
        })
        .catch(err => {
            console.error('Erro ao buscar bloqueios', err);
        });
}

function unlockSchedule(id) {
    if (!confirm('Tem certeza que deseja desbloquear este horário?')) return;
    
    const params = new URLSearchParams({
        action: 'desbloquearHorario',
        id: id
    });
    
    fetch(GAS_URL + '?' + params.toString())
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                fetchBlockedSchedules();
                showAgendaForDate(adminSelectedDate);
            } else {
                alert(data.erro || 'Erro ao desbloquear');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao desbloquear');
        });
}

function openBlockModal() {
    document.getElementById('blockDate').value = adminSelectedDate || '';
    document.getElementById('blockStartTime').value = '';
    document.getElementById('blockEndTime').value = '';
    document.getElementById('blockReason').value = '';
    document.getElementById('blockModal').style.display = 'flex';
}

function closeBlockModal() {
    document.getElementById('blockModal').style.display = 'none';
}

document.getElementById('blockForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBlockBtn');
    btn.textContent = 'Bloqueando...';
    btn.disabled = true;
    
    const data = document.getElementById('blockDate').value;
    const horaInicio = document.getElementById('blockStartTime').value;
    const horaFim = document.getElementById('blockEndTime').value;
    const motivo = document.getElementById('blockReason').value;
    
    console.log('Bloqueando:', data, horaInicio, horaFim, motivo);
    
    const params = new URLSearchParams({
        action: 'bloquearHorario',
        data: data,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        motivo: motivo
    });
    
    console.log('URL:', GAS_URL + '?' + params.toString());
    
    fetch(GAS_URL + '?' + params.toString())
        .then(res => res.json())
        .then(data => {
            console.log('Resposta:', data);
            if (data.sucesso) {
                closeBlockModal();
                alert('Horário bloqueado com sucesso!');
                fetchBlockedSchedules();
            } else {
                alert(data.erro || 'Erro ao bloquear');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao bloquear');
        })
        .finally(() => {
            btn.textContent = 'Bloquear';
            btn.disabled = false;
        });
});

function renderAdminCalendar() {
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    document.getElementById('adminCalendarMonth').textContent = `${monthNames[adminCurrentMonth]} ${adminCurrentYear}`;
    
    const firstDay = new Date(adminCurrentYear, adminCurrentMonth, 1).getDay();
    const daysInMonth = new Date(adminCurrentYear, adminCurrentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(adminCurrentYear, adminCurrentMonth, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let html = '';
    let dayIndex = 0;
    
    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<button class="calendar-day other-month" disabled>${daysInPrevMonth - i}</button>`;
        dayIndex++;
    }
    
    // Contagem de agendamentos por dia do mês atual
    const countsByDate = {};
    allAppointments.forEach(app => {
        if (!app.data) return;
        const d = String(app.data);
        countsByDate[d] = (countsByDate[d] || 0) + 1;
    });

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(adminCurrentYear, adminCurrentMonth, day);
        const dateStr = `${adminCurrentYear}-${String(adminCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        let classes = 'calendar-day animate-scale-in';
        
        if (date.getTime() === today.getTime()) {
            classes += ' today';
        }
        if (adminSelectedDate === dateStr) {
            classes += ' selected';
        }

        const count = countsByDate[dateStr] || 0;
        let indicatorHtml = '';
        if (count > 0) {
            classes += ' has-appointments';
            indicatorHtml = `<span class="calendar-indicator">${count}</span>`;
        }

        html += `<button class="${classes}" onclick="selectAdminDate('${dateStr}', this)">
            ${day}
            ${indicatorHtml}
        </button>`;
        dayIndex++;
    }
    
    // Preencher restante da grade
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        html += `<button class="calendar-day other-month" disabled>${i}</button>`;
        dayIndex++;
    }
    
    document.getElementById('adminCalendarDays').innerHTML = html;
}

function changeAdminMonth(delta) {
    adminCurrentMonth += delta;
    
    if (adminCurrentMonth > 11) {
        adminCurrentMonth = 0;
        adminCurrentYear++;
    } else if (adminCurrentMonth < 0) {
        adminCurrentMonth = 11;
        adminCurrentYear--;
    }
    
    renderAdminCalendar();
}

function selectAdminDate(dateStr, element) {
    adminSelectedDate = dateStr;
    
    document.querySelectorAll('#adminCalendarDays .calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    element.classList.add('selected');
    
    updateAgendaDateTitle();
    showAgendaForDate(dateStr);
}

function updateAgendaDateTitle() {
    if (!adminSelectedDate) return;
    const parts = adminSelectedDate.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let formatted = date.toLocaleDateString('pt-BR', options);
    
    // Capitalize first letter
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    document.getElementById('agendaDateTitle').textContent = formatted;
}

function showAgendaForDate(dateStr) {
    const listEl = document.getElementById('agendaList');
    const badgeEl = document.getElementById('agendaCount');
    
    const dayApps = allAppointments.filter(app => String(app.data) === dateStr);
    const dayBlocks = blockedSchedules.filter(b => String(b.data) === dateStr);
    
    dayApps.sort((a, b) => {
        return (a.hora || '').localeCompare(b.hora || '');
    });

    badgeEl.textContent = `${dayApps.length} agendamentos`;

    if (dayApps.length === 0 && dayBlocks.length === 0) {
        listEl.innerHTML = `
            <div class="empty-agenda animate-fade-in-up">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>Nenhum agendamento para esta data.</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    // Render blocked schedules
    html += dayBlocks.map((block, index) => {
        const timeRange = `${block.hora_inicio} - ${block.hora_fim}`;
        return `
            <div class="agenda-card blocked animate-fade-in-up" style="background: #fee2e2; border-left: 3px solid #ef4444;">
                <div class="agenda-time" style="color: #dc2626;">${timeRange}</div>
                <div class="agenda-info">
                    <h4 style="color: #dc2626;">HORÁRIO BLOQUEADO</h4>
                    <p>${block.motivo || 'Sem motivo'}</p>
                </div>
                <div class="agenda-actions">
                    <button class="action-btn-small delete" onclick="event.stopPropagation(); unlockSchedule('${block.id}')" title="Desbloquear">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Render appointments
    html += dayApps.map((app, index) => {
        const delayClass = `delay-${(index % 5) + 1}`;
        const encodedApp = encodeURIComponent(JSON.stringify(app));

        return `
            <div class="agenda-card animate-fade-in-up ${delayClass}" onclick="openDetailsModal('${encodedApp}')">
                <div class="agenda-time">${app.hora || '--:--'}</div>
                <div class="agenda-info">
                    <h4>${app.cliente || 'Sem nome'}</h4>
                    <p>${app.servico || 'Sem serviço especificado'}</p>
                </div>
                <div class="agenda-actions">
                    <button class="action-btn-small edit" onclick="event.stopPropagation(); openEditModal('${encodedApp}')" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn-small delete" onclick="event.stopPropagation(); openCancelModal('${encodedApp}')" title="Cancelar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    listEl.innerHTML = html;
}

function openDetailsModal(encodedAppStr) {
    try {
        const app = JSON.parse(decodeURIComponent(encodedAppStr));
        
        document.getElementById('modalName').textContent = app.cliente || 'Sem nome';
        document.getElementById('modalService').textContent = app.servico || 'Sem serviço';
        document.getElementById('modalPhone').textContent = app.telefone || 'Sem telefone';
        document.getElementById('modalTime').textContent = app.hora ? `${app.hora} horas` : '--:--';
        
        const whatsBtn = document.getElementById('modalWhatsBtn');
        if (app.telefone) {
            const cleanPhone = app.telefone.replace(/\D/g, '');
            whatsBtn.href = `https://wa.me/55${cleanPhone}`;
            whatsBtn.style.display = 'flex';
        } else {
            whatsBtn.style.display = 'none';
        }

        document.getElementById('detailsModal').style.display = 'flex';
    } catch (e) {
        console.error('Erro ao abrir detalhes', e);
    }
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// ============================================
// GERENCIADOR DE SERVIÇOS
// ============================================

let adminServices = [];

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
    
    event.currentTarget.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    if (tabName === 'agenda') {
        fetchBlockedSchedules();
    } else if (tabName === 'servicos' && adminServices.length === 0) {
        fetchAdminServices();
    }
}

function fetchAdminServices() {
    const loading = document.getElementById('servicesLoadingIndicator');
    loading.style.display = 'flex';
    
    fetch(GAS_URL + '?action=getServicos')
        .then(res => res.json())
        .then(data => {
            adminServices = Array.isArray(data) ? data : [];
            if(data.erro) {
                 console.log(data.erro);
                 adminServices = [];
            }
            loading.style.display = 'none';
            renderAdminServices();
        })
        .catch(err => {
            console.error('Erro ao buscar servicos', err);
            loading.style.display = 'none';
        });
}

function renderAdminServices() {
    const container = document.getElementById('servicesAdminList');
    
    if (adminServices.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum serviço cadastrado na planilha ou erro ao carregar.</p>`;
        return;
    }
    
    container.innerHTML = adminServices.map(s => `
        <div class="service-admin-card">
            <div class="service-admin-info">
                <h4>${s.name}</h4>
                <p>${s.description || 'Sem descrição'}</p>
                <div class="service-admin-price">R$ ${s.price.toFixed(2)} • ${s.duration} min</div>
                <div style="font-size: 0.75rem; color: #888; margin-top: 4px;">ID: ${s.id} | Cat: ${s.category}</div>
            </div>
            <div class="service-admin-actions">
                <button class="action-btn" onclick="openServiceModal('${s.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="deleteService('${s.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function openServiceModal(id = null) {
    const title = document.getElementById('serviceModalTitle');
    const form = document.getElementById('serviceForm');
    
    if (id) {
        const s = adminServices.find(x => x.id === id);
        if(!s) return;
        title.textContent = 'Editar Serviço';
        document.getElementById('serviceEditId').value = s.id;
        document.getElementById('serviceId').value = s.id;
        document.getElementById('serviceCategory').value = s.category;
        document.getElementById('serviceName').value = s.name;
        document.getElementById('serviceDesc').value = s.description || '';
        document.getElementById('servicePrice').value = s.price;
        document.getElementById('serviceDuration').value = s.duration;
    } else {
        title.textContent = 'Novo Serviço';
        form.reset();
        document.getElementById('serviceEditId').value = '';
    }
    
    document.getElementById('serviceModal').style.display = 'flex';
}

function closeServiceModal() {
    document.getElementById('serviceModal').style.display = 'none';
}

document.getElementById('serviceForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('saveServiceBtn');
    btn.textContent = 'Salvando...';
    btn.disabled = true;
    
    const params = new URLSearchParams({
        action: 'salvarServico',
        id: document.getElementById('serviceId').value,
        category: document.getElementById('serviceCategory').value,
        name: document.getElementById('serviceName').value,
        description: document.getElementById('serviceDesc').value,
        price: document.getElementById('servicePrice').value,
        duration: document.getElementById('serviceDuration').value,
        icon: 'circle' // default for now
    });
    
    fetch(GAS_URL + '?' + params.toString())
        .then(res => res.json())
        .then(data => {
            btn.textContent = 'Salvar';
            btn.disabled = false;
            closeServiceModal();
            fetchAdminServices(); // reload
        })
        .catch(err => {
            console.error(err);
            btn.textContent = 'Salvar';
            btn.disabled = false;
            alert('Erro ao salvar serviço');
        });
});

function deleteService(id) {
    if(!confirm('Tem certeza que deseja excluir o serviço ' + id + '?')) return;
    
    const params = new URLSearchParams({
        action: 'excluirServico',
        id: id
    });
    
    fetch(GAS_URL + '?' + params.toString())
        .then(res => res.json())
        .then(data => {
            fetchAdminServices();
        })
        .catch(err => {
            alert('Erro ao excluir');
        });
}

// ============================================
// EDITAR / CANCELAR AGENDAMENTOS
// ============================================

function openEditModal(encodedAppStr) {
    try {
        const app = JSON.parse(decodeURIComponent(encodedAppStr));
        
        document.getElementById('editOriginalData').value = app.data;
        document.getElementById('editOriginalTime').value = app.hora;
        document.getElementById('editClientName').value = app.cliente || '';
        document.getElementById('editClientPhone').value = app.telefone || '';
        document.getElementById('editService').value = app.servico || '';
        document.getElementById('editDate').value = app.data;
        document.getElementById('editTime').value = app.hora || '09:00';
        document.getElementById('editDuration').value = app.duracao || 30;
        
        document.getElementById('editModal').style.display = 'flex';
    } catch (e) {
        console.error('Erro ao abrir edição', e);
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

document.getElementById('editForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('saveEditBtn');
    btn.textContent = 'Salvando...';
    btn.disabled = true;
    
    const params = new URLSearchParams({
        action: 'editarAgendamento',
        originalData: document.getElementById('editOriginalData').value,
        originalTime: document.getElementById('editOriginalTime').value,
        cliente: document.getElementById('editClientName').value,
        telefone: document.getElementById('editClientPhone').value,
        servico: document.getElementById('editService').value,
        data: document.getElementById('editDate').value,
        hora: document.getElementById('editTime').value,
        duracao: document.getElementById('editDuration').value || 30
    });
    
    fetch(GAS_URL + '?' + params.toString())
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                closeEditModal();
                fetchAppointments();
            } else {
                alert(data.erro || 'Erro ao salvar');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao salvar');
        })
        .finally(() => {
            btn.textContent = 'Salvar Alterações';
            btn.disabled = false;
        });
});

function formatDateBr(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return dateStr;
}

function openCancelModal(encodedAppStr) {
    try {
        const app = JSON.parse(decodeURIComponent(encodedAppStr));
        pendingCancelData = app;
        
        document.getElementById('cancelClientName').textContent = app.cliente || 'Cliente';
        document.getElementById('cancelDate').textContent = formatDateBr(app.data);
        document.getElementById('cancelTime').textContent = app.hora || '--:--';
        
        document.getElementById('cancelModal').style.display = 'flex';
    } catch (e) {
        console.error('Erro ao abrir cancelamento', e);
    }
}

function closeCancelModal() {
    document.getElementById('cancelModal').style.display = 'none';
    pendingCancelData = null;
}

function confirmCancel() {
    if (!pendingCancelData) return;
    
    const params = new URLSearchParams({
        action: 'cancelarAgendamento',
        data: pendingCancelData.data,
        hora: pendingCancelData.hora,
        cliente: pendingCancelData.cliente
    });
    
    const cancelData = pendingCancelData;
    
    fetch(GAS_URL + '?' + params.toString())
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                closeCancelModal();
                fetchAppointments();
                
                if (cancelData.telefone) {
                    const cleanPhone = cancelData.telefone.replace(/\D/g, '');
                    const formattedDate = formatDateBr(cancelData.data);
                    
                    const message = `Olá! Seu agendamento foi CANCELADO.\n\n` +
                        `👤 Cliente: ${cancelData.cliente}\n` +
                        `📅 Data: ${formattedDate}\n` +
                        `🕐 Horário: ${cancelData.hora}\n` +
                        `✨ Serviço: ${cancelData.servico}\n\n` +
                        `Caso queira remarcar, é só fazer um novo agendamento pelo nosso sistema.`;
                    
                    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }
            } else {
                alert(data.erro || 'Erro ao cancelar');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao cancelar');
        });
}
