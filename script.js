// ============================================
// DADOS DOS SERVIÇOS - EDITE AQUI!
// ============================================

const appData = {
    categories: [
        {
            id: "manicure",
            name: "Manicure & Pedicure",
            description: "Nails, gel, alongamento e spa dos pés",
            icon: "nails"
        },
        {
            id: "podologia",
            name: "Podologia",
            description: "Tratamento especializado para os pés",
            icon: "foot"
        }
    ],
    services: []
};

// ============================================
// VARIÁVEIS DO APP
// ============================================

let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let selectedPrice = null;
let selectedDuration = null;
let selectedCategory = null;

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Firebase Functions API URL (substitui Google Apps Script)
const API_URL = 'https://us-central1-app-jeci-vieira-nails.cloudfunctions.net/api';

document.addEventListener('DOMContentLoaded', function() {
    const loggedUid = localStorage.getItem('cliente_uid');
    const loggedNome = localStorage.getItem('cliente_nome');
    const loggedTelefone = localStorage.getItem('cliente_telefone');
    
    if (loggedUid && loggedNome) {
        const nameInput = document.getElementById('clientName');
        const phoneInput = document.getElementById('clientPhone');
        if (nameInput) nameInput.value = loggedNome;
        if (phoneInput && loggedTelefone) {
            let value = loggedTelefone.replace(/\D/g, '');
            if (value.length <= 2) {
                value = '(' + value;
            } else if (value.length <= 6) {
                value = '(' + value.slice(0, 2) + ') ' + value.slice(2);
            } else if (value.length <= 10) {
                value = '(' + value.slice(0, 2) + ') ' + value.slice(2, 6) + '-' + value.slice(6);
            } else {
                value = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7, 11);
            }
            phoneInput.value = value;
        }
    }
});

// ============================================
// HISTÓRICO E LOCALSTORAGE
// ============================================

function getClientKey() {
    const phone = document.getElementById('clientPhone').value;
    return phone ? 'historico_' + phone.replace(/\D/g, '') : null;
}

function saveToHistory(service, date, time, price, category) {
    var key = getClientKey();
    if (!key) return;
    
    var historyData = JSON.parse(localStorage.getItem(key) || '[]');
    historyData.unshift({
        service: service,
        date: date,
        time: time,
        price: price,
        category: category,
        createdAt: new Date().toISOString()
    });
    
    if (historyData.length > 5) historyData = historyData.slice(0, 5);
    localStorage.setItem(key, JSON.stringify(historyData));
}

function getHistory() {
    var key = getClientKey();
    if (!key) return [];
    return JSON.parse(localStorage.getItem(key)) || '[]';
}

function clearHistory() {
    var key = getClientKey();
    if (key) localStorage.removeItem(key);
}

function cancelFromHistory(index, service, date, time) {
    const formattedDate = formatDate(date);
    
    if (!confirm(`Deseja realmente cancelar o agendamento de ${service} no dia ${formattedDate} às ${time}?`)) {
        return;
    }
    
    const clientName = document.getElementById('clientName').value || 'Cliente';
    const clientPhone = document.getElementById('clientPhone').value || '';
    
    const message = `Olá! Gostaria de CANCELAR meu agendamento:\n\n` +
        `👤 Nome: ${clientName}\n` +
        `📱 WhatsApp: ${clientPhone}\n` +
        `✨ Serviço: ${service}\n` +
        `📅 Data: ${formattedDate}\n` +
        `🕐 Horário: ${time}\n\n` +
        `Por favor, cancele meu agendamento. Obrigado(a)!`;
    
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
        const key = getClientKey();
        let history = JSON.parse(localStorage.getItem(key) || '[]');
        history.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(history));
        closeMenuSection();
    }, 1000);
}

function contactAdmin(service, date, time) {
    const formattedDate = formatDate(date);
    
    const clientName = document.getElementById('clientName').value || 'Cliente';
    const clientPhone = document.getElementById('clientPhone').value || '';
    
    const message = `Olá! Tenho uma dúvida sobre meu agendamento:\n\n` +
        `👤 Nome: ${clientName}\n` +
        `📱 WhatsApp: ${clientPhone}\n` +
        `✨ Serviço: ${service}\n` +
        `📅 Data: ${formattedDate}\n` +
        `🕐 Horário: ${time}\n\n` +
        `Gostaria de saber mais informações.`;
    
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ============================================
// LISTA DE ESPERA
// ============================================

function getWaitlistKey() {
    return 'waitlist';
}

function joinWaitlist(service, date, phone, name) {
    var key = getWaitlistKey();
    var waitlist = JSON.parse(localStorage.getItem(key) || '[]');
    
    waitlist.push({
        service: service,
        date: date,
        phone: phone,
        name: name,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(key, JSON.stringify(waitlist));
    return true;
}

function getWaitlist() {
    var key = getWaitlistKey();
    return JSON.parse(localStorage.getItem(key)) || '[]';
}

// Horários disponíveis (agora vem do GAS)
const AVAILABLE_TIMES = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
const UNAVAILABLE_TIMES = []; // Não usado mais, mantido para compatibilidade

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    fetch(API_URL + '?action=getServicos')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                appData.services = data;
            }
        })
        .catch(err => {
            console.error('Falha ao carregar os servicos via Google. Exibindo padrao.', err);
            // Poderíamos colocar um serviço mínimo de fallback aqui, ou deixar vázio.
        })
        .finally(() => {
            const loader = document.getElementById('globalLoader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
            }
            renderCategories();
            checkReminders();
            setupWaitlistDateInput();
        });
});

function checkReminders() {
    const history = getHistory();
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcoming = history.find(item => {
        const date = new Date(item.date + 'T' + item.time);
        return date > now && date < tomorrow;
    });
    
    if (upcoming) {
        const reminderBanner = document.createElement('div');
        reminderBanner.className = 'reminder-banner';
        reminderBanner.id = 'reminderBanner';
        reminderBanner.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div class="reminder-text">
                <strong>Lembrete: ${upcoming.service}</strong>
                <span>Amanhã às ${upcoming.time}</span>
            </div>
            <button class="reminder-close" onclick="dismissReminder()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6L18 18"/>
                </svg>
            </button>
        `;
        document.body.appendChild(reminderBanner);
    }
}

function dismissReminder() {
    const banner = document.getElementById('reminderBanner');
    if (banner) banner.remove();
}

function setupWaitlistDateInput() {
    const dateInput = document.getElementById('waitlistDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
}

// ============================================
// RENDERIZAÇÃO
// ============================================

function renderCategories() {
    const container = document.querySelector('#step1 .category-grid');
    
    container.innerHTML = appData.categories.map((cat, index) => {
        const iconSvg = getCategoryIcon(cat.icon);
        const delayClass = `delay-${index + 1}`;
        
        return `
            <button class="category-card ${cat.id === 'podologia' ? 'podologia' : ''} animate-fade-in-up ${delayClass}" onclick="selectCategory('${cat.id}')">
                <div class="category-icon ${cat.id === 'podologia' ? 'podologia' : ''}">
                    ${iconSvg}
                </div>
                <h3>${cat.name}</h3>
                <p>${cat.description}</p>
                <span class="category-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19"/>
                    </svg>
                </span>
            </button>
        `;
    }).join('');
}

function getCategoryIcon(iconType) {
    const icons = {
        nails: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M32 56V28"/>
            <path d="M32 28C32 28 20 24 20 14C20 8 24 4 32 4C40 4 44 8 44 14C44 24 32 28 32 28Z"/>
            <path d="M20 56C20 56 24 44 32 44C40 44 44 56 44 56"/>
            <circle cx="32" cy="12" r="2" fill="currentColor"/>
        </svg>`,
        foot: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M32 8C20 8 12 18 12 32C12 48 20 56 32 56C44 56 52 48 52 32C52 18 44 8 32 8Z"/>
            <path d="M24 28C24 28 28 32 32 32C36 32 40 28 40 28"/>
            <path d="M32 20V32"/>
            <circle cx="32" cy="40" r="3"/>
        </svg>`
    };
    return icons[iconType] || icons.nails;
}

function getServiceIcon(iconType) {
    const icons = {
        hand: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M24 44C24 44 8 32 8 20C8 14 12 8 18 8C20 8 22 9 24 11"/>
            <path d="M24 44C24 44 40 32 40 20C40 14 36 8 30 8C28 8 26 9 24 11"/>
            <path d="M24 11V44"/>
        </svg>`,
        hands: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 8C14 8 10 12 10 20C10 28 14 40 14 40"/>
            <path d="M24 8C24 8 20 12 20 20C20 28 24 40 24 40"/>
            <path d="M34 8C34 8 30 12 30 20C30 28 34 40 34 40"/>
            <path d="M10 40H38"/>
        </svg>`,
        bottle: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="16" y="4" width="16" height="8" rx="2"/>
            <path d="M18 12V40C18 42 20 44 24 44C28 44 30 42 30 40V12"/>
            <path d="M20 20H28M20 28H28"/>
        </svg>`,
        longnail: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M24 44V20"/>
            <path d="M24 20C24 20 18 18 18 12C18 8 20 6 24 6C28 6 30 8 30 12C30 18 24 20 24 20"/>
            <path d="M20 44C20 44 22 38 24 38C26 38 28 44 28 44"/>
        </svg>`,
        foot: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M24 8C16 8 10 16 10 28C10 40 16 44 24 44C32 44 38 40 38 28C38 16 32 8 24 8Z"/>
            <path d="M18 24H30"/>
            <path d="M24 18V30"/>
        </svg>`,
        spa: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M24 4L28 12L36 8L32 16L40 20L32 20L36 28L28 24L24 32L20 24L12 28L16 20L8 20L16 16L12 8L20 12L24 4Z"/>
            <path d="M18 32C18 32 20 36 24 36C28 36 30 32 30 32"/>
        </svg>`,
        circle: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="24" cy="24" r="16"/>
            <circle cx="24" cy="24" r="8"/>
            <path d="M24 8V16M24 32V40M8 24H16M32 24H40"/>
        </svg>`,
        brace: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 36L24 12L32 36"/>
            <path d="M18 28H30"/>
            <circle cx="24" cy="22" r="2"/>
        </svg>`
    };
    return icons[iconType] || icons.hand;
}

function formatDuration(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// ============================================
// NAVEGAÇÃO
// ============================================

function selectCategory(categoryId) {
    selectedCategory = categoryId;
    
    document.getElementById('step1').style.display = 'none';
    
    const category = appData.categories.find(c => c.id === categoryId);
    const services = appData.services.filter(s => s.category === categoryId);
    
    const stepId = categoryId === 'manicure' ? 'step-manicure' : 'step-podologia';
    const section = document.getElementById(stepId);
    
    section.querySelector('.section-title').textContent = category ? category.name : '';
    section.querySelector('.section-subtitle').textContent = category ? category.description : '';
    
    const serviceList = section.querySelector('.service-list');
    serviceList.innerHTML = services.map((service, index) => {
        const badgeHtml = service.badge 
            ? `<div class="service-badge">${service.badge}</div>` 
            : '';
        const iconClass = categoryId === 'podologia' ? 'podologia' : '';
        const delayClass = `delay-${index + 1}`;
        
        return `
            <button class="service-card animate-fade-in-up ${delayClass}" onclick="selectService('${service.id}')">
                ${badgeHtml}
                <div class="service-icon ${iconClass}">
                    ${getServiceIcon(service.icon)}
                </div>
                <div class="service-info">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                </div>
                <div class="service-meta">
                    <span class="price">R$ ${service.price}</span>
                    <span class="duration">${formatDuration(service.duration)}</span>
                </div>
                <div class="card-shine"></div>
            </button>
        `;
    }).join('');
    
    section.style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectService(serviceId) {
    const service = appData.services.find(s => s.id === serviceId);
    if (!service) return;
    
    selectedService = service.name;
    selectedDuration = service.duration;
    selectedPrice = service.price;
    selectedCategory = service.category;

    document.getElementById('step1').style.display = 'none';
    document.getElementById('step-manicure').style.display = 'none';
    document.getElementById('step-podologia').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    
    document.getElementById('selectedServiceName').textContent = service.name;
    document.getElementById('selectedServicePrice').textContent = `R$ ${service.price}`;
    
    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();
    selectedDate = null;
    renderCalendar();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBackToHome() {
    document.getElementById('step-manicure').style.display = 'none';
    document.getElementById('step-podologia').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    selectedCategory = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    if (step3.style.display !== 'none') {
        step3.style.display = 'none';
        step2.style.display = 'block';
    } else {
        step2.style.display = 'none';
        
        if (selectedCategory === 'manicure') {
            document.getElementById('step-manicure').style.display = 'block';
        } else if (selectedCategory === 'podologia') {
            document.getElementById('step-podologia').style.display = 'block';
        } else {
            document.getElementById('step1').style.display = 'block';
        }
        
        selectedService = null;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// CALENDÁRIO
// ============================================

function renderCalendar() {
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    document.getElementById('calendarMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let html = '';
    let dayIndex = 0;
    
    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        const delayClass = `delay-${(dayIndex % 6) + 1}`;
        html += `<button class="calendar-day other-month animate-scale-in ${delayClass}" disabled>${daysInPrevMonth - i}</button>`;
        dayIndex++;
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const delayClass = `delay-${(dayIndex % 6) + 1}`;
        
        let classes = 'calendar-day animate-scale-in ' + delayClass;
        
        if (date < today) {
            classes += ' disabled';
            html += `<button class="${classes}" disabled>${day}</button>`;
        } else if (date.getDay() === 0) { // Domingo
            classes += ' disabled';
            html += `<button class="${classes}" disabled>${day}</button>`;
        } else {
            if (date.getTime() === today.getTime()) {
                classes += ' today';
            }
            if (selectedDate === dateStr) {
                classes += ' selected';
            }
            html += `<button class="${classes}" onclick="selectDate('${dateStr}', this)">${day}</button>`;
        }
        dayIndex++;
    }
    
    // Preencher restante da grade
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        const delayClass = `delay-${(dayIndex % 6) + 1}`;
        html += `<button class="calendar-day other-month animate-scale-in ${delayClass}" disabled>${i}</button>`;
        dayIndex++;
    }
    
    document.getElementById('calendarDays').innerHTML = html;
}

function changeMonth(delta) {
    currentMonth += delta;
    
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    renderCalendar();
}

function selectDate(dateStr, element) {
    selectedDate = dateStr;
    
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    element.classList.add('selected');
    
    setTimeout(() => {
        loadTimes();
    }, 200);
}

// ============================================
// HORÁRIOS
// ============================================

// ============================================
// HORÁRIOS (buscar do Google Apps Script)
// ============================================

function loadTimes() {
    const timeGrid = document.getElementById('timeGrid');
    const timeSection = document.getElementById('timeSection');
    const timeLoading = document.getElementById('timeLoading');
    
    timeGrid.innerHTML = '';
    timeLoading.style.display = 'flex';
    timeSection.style.display = 'block';
    
    // Busca horários do Firebase Functions com duração do serviço
    fetch(API_URL + '?action=getHorarios&data=' + selectedDate + '&duracao=' + (selectedDuration || 30))
        .then(response => response.text())
        .then(text => {
            console.log('Raw response:', text);
            const data = JSON.parse(text);
            const horarios = data.horarios || [];
            
            console.log('Horários recebidos do servidor:', horarios);
            
            timeLoading.style.display = 'none';
            
            if (horarios.length === 0) {
                timeGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">Nenhum horário disponível para esta data.</p>';
                return;
            }

            timeGrid.innerHTML = horarios.map((time, index) => {
                const delayClass = `delay-${(index % 6) + 1}`;
                return `
                    <button 
                        class="time-slot animate-scale-in ${delayClass}" 
                        onclick="selectTime('${time}')"
                    >
                        ${time}
                    </button>
                `;
            }).join('');
        })
        .catch(error => {
            console.error('Erro ao buscar horários:', error);
            timeLoading.style.display = 'none';
            // Se der erro, mostra todos disponíveis
            const todosHorarios = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
            timeGrid.innerHTML = todosHorarios.map((time, index) => {
                const delayClass = `delay-${(index % 6) + 1}`;
                return `
                    <button 
                        class="time-slot animate-scale-in ${delayClass}" 
                        onclick="selectTime('${time}')"
                    >
                        ${time}
                    </button>
                `;
            }).join('');
        });
    
    selectedTime = null;
    document.getElementById('timeSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectTime(time) {
    selectedTime = time;
    
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    
    setTimeout(() => {
        showConfirmStep();
    }, 300);
}

// ============================================
// CONFIRMAÇÃO
// ============================================

function showConfirmStep() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    
    document.getElementById('summaryService').textContent = selectedService;
    document.getElementById('summaryDate').textContent = formatDate(selectedDate);
    document.getElementById('summaryTime').textContent = formatTimeRange(selectedTime, selectedDuration);
    document.getElementById('summaryPrice').textContent = `R$ ${parseFloat(selectedPrice).toFixed(2).replace('.', ',')}`;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatTimeRange(startTime, duration) {
    if (!startTime) return '-';
    
    const parts = startTime.split(':');
    let hours = parseInt(parts[0]);
    let minutes = parseInt(parts[1]) || 0;
    
    const totalMinutes = hours * 60 + minutes + (duration || 30);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    const startFormatted = `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}`;
    const endFormatted = `${String(endHours).padStart(2, '0')}h${String(endMinutes).padStart(2, '0')}`;
    
    return `Das ${startFormatted} às ${endFormatted}`;
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('pt-BR', options);
}

// ============================================
// ENVIO WHATSAPP
// ============================================

// ============================================
// ENVIO PARA GOOGLE APPS SCRIPT
// ============================================

document.getElementById('confirmForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    
    const category = appData.categories.find(c => c.id === selectedCategory);
    const categoryText = category ? category.name : 'Manicure & Pedicure';
    
    // Mostrar modal de confirmação
    const detailsHtml = `
        <p><span class="label">Nome:</span> <span class="value">${name}</span></p>
        <p><span class="label">WhatsApp:</span> <span class="value">${phone}</span></p>
        <p><span class="label">Área:</span> <span class="value">${categoryText}</span></p>
        <p><span class="label">Serviço:</span> <span class="value">${selectedService}</span></p>
        <p><span class="label">Data:</span> <span class="value">${formatDate(selectedDate)}</span></p>
        <p><span class="label">Horário:</span> <span class="value">${selectedTime}</span></p>
        <p><span class="label">Valor:</span> <span class="value">R$ ${selectedPrice}</span></p>
    `;
    
    document.getElementById('confirmDetails').innerHTML = detailsHtml;
    document.getElementById('confirmModal').style.display = 'flex';
    
    // Armazenar dados para uso na confirmação
    window.confirmData = {
        name,
        phone,
        categoryText,
        formData: new URLSearchParams({
            action: 'agendar',
            data: selectedDate,
            hora: selectedTime,
            servico: selectedService,
            cliente: name,
            telefone: phone,
            duracao: selectedDuration || 30
        })
    };
});

window.backToForm = function() {
    document.getElementById('confirmModal').style.display = 'none';
};

window.confirmAndSendWhatsApp = async function() {
    const { name, phone, categoryText, formData } = window.confirmData;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.sucesso) {
            saveToHistory(selectedService, selectedDate, selectedTime, selectedPrice, selectedCategory);
            
            const message = `Olá! Gostaria de confirmar meu agendamento:\n\n` +
                `👤 Nome: ${name}\n` +
                `📱 WhatsApp: ${phone}\n` +
                `💅 Área: ${categoryText}\n` +
                `✨ Serviço: ${selectedService}\n` +
                `📅 Data: ${formatDate(selectedDate)}\n` +
                `🕐 Horário: ${selectedTime}\n` +
                `💰 Valor: R$ ${selectedPrice}`;
            
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            
            // Tentar abrir de forma mais confiável
            const waWindow = window.open(whatsappUrl, '_blank');
            if (!waWindow || waWindow.closed || typeof waWindow.closed === 'undefined') {
                location.href = whatsappUrl;
            }
            
            document.getElementById('confirmModal').style.display = 'none';
            document.getElementById('successModal').style.display = 'flex';
        } else {
            alert(result.erro || 'Erro ao agendar. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao agendar. Tente novamente.');
    }
};

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    
    // Reseta tudo
    selectedService = null;
    selectedDate = null;
    selectedTime = null;
    selectedPrice = null;
    selectedCategory = null;
    
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step-manicure').style.display = 'none';
    document.getElementById('step-podologia').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    
    document.getElementById('timeSection').style.display = 'none';
    document.getElementById('clientName').value = name;
    document.getElementById('clientPhone').value = phone;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// MÁSCARA TELEFONE
// ============================================

document.getElementById('clientPhone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
        value = `(${value}`;
    }
    
    e.target.value = value;
});

// ============================================
// MENU DRAWER
// ============================================

function toggleMenu() {
    const overlay = document.getElementById('menuOverlay');
    const drawer = document.getElementById('menuDrawer');
    
    overlay.classList.toggle('active');
    drawer.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
}

function openWhatsApp() {
    toggleMenu();
    const message = 'Olá! Gostaria de mais informações sobre os serviços.';
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function openLocation() {
    toggleMenu();
    // Substitua pela sua localização real no Google Maps
    const locationUrl = 'https://maps.google.com/?q=Rua+Exemplo+123+Joinville+SC';
    window.open(locationUrl, '_blank');
}

function showMenuSection(section) {
    const modal = document.getElementById('menuSectionModal');
    const body = document.getElementById('menuSectionBody');
    
    const sectionsContent = {
        horarios: getHorariosContent(),
        galeria: getGaleriaContent(),
        depoimentos: getDepoimentosContent(),
        promocoes: getPromocoesContent(),
        sobre: getSobreContent(),
        politica: getPoliticaContent(),
        historico: getHistoricoContent(),
        listaespera: getListaEsperaContent()
    };
    
    body.innerHTML = sectionsContent[section] || '<p>Conteúdo em desenvolvimento.</p>';
    modal.classList.add('active');
    toggleMenu();
}

function closeMenuSection() {
    const modal = document.getElementById('menuSectionModal');
    modal.classList.remove('active');
}

function getHorariosContent() {
    return `
        <div class="menu-section-header">
            <h2>Horário de Funcionamento</h2>
            <p>Estamos disponíveis nos siguientes horários:</p>
        </div>
        <div class="info-card">
            <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6V12L16 14"/>
                </svg>
                Atención
            </h3>
            <div class="hours-grid">
                <div class="hours-row">
                    <span>Segunda a Sexta</span>
                    <span>9h às 18h</span>
                </div>
                <div class="hours-row">
                    <span>Sábado</span>
                    <span>9h às 14h</span>
                </div>
                <div class="hours-row closed">
                    <span>Domingo</span>
                    <span>Fechado</span>
                </div>
            </div>
        </div>
    `;
}

function getGaleriaContent() {
    return `
        <div class="menu-section-header">
            <h2>Galeria</h2>
            <p>Alguns dos nossos trabalhos</p>
        </div>
        <div class="gallery-grid">
            <div class="gallery-item">💅</div>
            <div class="gallery-item">✨</div>
            <div class="gallery-item">🎨</div>
            <div class="gallery-item">💖</div>
            <div class="gallery-item">🌸</div>
            <div class="gallery-item">⭐</div>
        </div>
    `;
}

function getDepoimentosContent() {
    return `
        <div class="menu-section-header">
            <h2>Depoimentos</h2>
            <p>O que nossas clientes dizem</p>
        </div>
        <div class="testimonial-card">
            <p class="testimonial-text">"Excelente trabalho! Sempre saio satisfeita do salão. Jeci é sehr detalhe."</p>
            <div class="testimonial-author">
                <div class="testimonial-avatar">M</div>
                <div>
                    <div class="testimonial-name">Maria Silva</div>
                    <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
                </div>
            </div>
        </div>
        <div class="testimonial-card">
            <p class="testimonial-text">"Ambiente agradável e profissionais sehr capacitados. Recomendo!"</p>
            <div class="testimonial-author">
                <div class="testimonial-avatar">J</div>
                <div>
                    <div class="testimonial-name">Julia Santos</div>
                    <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
                </div>
            </div>
        </div>
    `;
}

function getPromocoesContent() {
    return `
        <div class="menu-section-header">
            <h2>Promoções</h2>
            <p>Descontos especiais para você</p>
        </div>
        <div class="promo-card">
            <h3>Combo Master</h3>
            <p>Pé + Mão + Hidratação</p>
            <div class="promo-code">COMBO20</div>
            <p style="margin-top: 12px; font-size: 0.85rem;">20% de desconto</p>
        </div>
        <div class="promo-card">
            <h3>Dia das Amigas</h3>
            <p>2+ mãos = 15% off</p>
            <div class="promo-code">DIAS</div>
        </div>
        <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            Válido apenas para novos agendamentos.
        </p>
    `;
}

function getSobreContent() {
    return `
        <div class="menu-section-header">
            <h2>Sobre Nós</h2>
            <p>Conheça nossa história</p>
        </div>
        <div class="about-image">
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="32" cy="20" r="12"/>
                <path d="M16 56C16 40 24 32 32 32C40 32 48 40 48 56"/>
            </svg>
        </div>
        <div class="about-text">
            <p>Jeci Vieira Nails & Podologia ist ein salão especializado em cuidados das unhas e dos pés, com anos de experiência no mercado.</p>
            <p>Nosso objetivo é proporcionar belleza e bem-estar através de servicios de qualidade, usando produtos de excelência e técnicas modernas.</p>
            <p>Agende seu horário e venha nos conhecer!</p>
        </div>
    `;
}

function getPoliticaContent() {
    return `
        <div class="menu-section-header">
            <h2>Política de Agendamento</h2>
            <p>Regras e condições</p>
        </div>
        <div class="info-card">
            <ul class="policy-list">
                <li>
                    <div class="policy-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 8V12L16 14"/>
                        </svg>
                    </div>
                    <div class="policy-text">
                        <strong>Horário</strong>
                        <span>Chegue no horário agendado. Atrasos de mais de 15min podem resultar em cancelamento.</span>
                    </div>
                </li>
                <li>
                    <div class="policy-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818"/>
                            <path d="M22 4L12 14.01L9 11.01"/>
                        </svg>
                    </div>
                    <div class="policy-text">
                        <strong>Cancelamento</strong>
                        <span>Cancele com antecedência mínima de 24h.</span>
                    </div>
                </li>
                <li>
                    <div class="policy-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                            <path d="M12 6V12L16 14"/>
                        </svg>
                    </div>
                    <div class="policy-text">
                        <strong>第一次 Agendamento</strong>
                        <span>Clientes novas devem agendar com antecedência.</span>
                    </div>
                </li>
                <li>
                    <div class="policy-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <path d="M16 2V6M8 2V6M3 10H21"/>
                        </svg>
                    </div>
                    <div class="policy-text">
                        <strong>Confirmação</strong>
                        <span>Seu agendamento será confirmado via WhatsApp.</span>
                    </div>
                </li>
            </ul>
        </div>
    `;
}

function getHistoricoContent() {
    const history = getHistory();
    const phone = document.getElementById('clientPhone').value;
    
    if (!phone) {
        return `
            <div class="menu-section-header">
                <h2>Meu Histórico</h2>
                <p>Seus agendamentos</p>
            </div>
            <div class="info-card">
                <p style="text-align: center; color: var(--text-muted);">
                    Digite seu WhatsApp no formulário de agendamento para salvar seu histórico.
                </p>
            </div>
        `;
    }
    
    if (history.length === 0) {
        return `
            <div class="menu-section-header">
                <h2>Meu Histórico</h2>
                <p>Seus agendamentos</p>
            </div>
            <div class="info-card">
                <p style="text-align: center; color: var(--text-muted);">
                    Você ainda não tem agendamentos. <br>Faça seu primeiro agendamento!
                </p>
            </div>
            <button class="menu-action-btn" onclick="closeMenuSection(); document.getElementById('step1').scrollIntoView({behavior: 'smooth'})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5V19M5 12H19"/>
                </svg>
                Novo Agendamento
            </button>
        `;
    }
    
    const historyHtml = history.map((item, index) => {
        const date = new Date(item.date + 'T00:00:00');
        const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        const isUpcoming = new Date(item.date) > new Date();
        const canCancel = isUpcoming;
        
        return `
            <div class="history-card ${isUpcoming ? 'upcoming' : ''}">
                <div class="history-date">${dateStr}</div>
                <div class="history-service">${item.service}</div>
                <div class="history-time">${item.time}</div>
                <div class="history-price">R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}</div>
                ${canCancel ? `
                    <button class="history-contact-btn" onclick="contactAdmin('${item.service}', '${item.date}', '${item.time}')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span>Entrar em contato</span>
                    </button>
                    <button class="history-cancel-btn" onclick="cancelFromHistory(${index}, '${item.service}', '${item.date}', '${item.time}')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span>Cancelar</span>
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
    
    return `
        <div class="menu-section-header">
            <h2>Meu Histórico</h2>
            <p>Últimos ${history.length} agendamento(s) encontrado(s)</p>
        </div>
        <div class="history-list">
            ${historyHtml}
        </div>
    `;
}

function getListaEsperaContent() {
    return `
        <div class="menu-section-header">
            <h2>Lista de Espera</h2>
            <p>Seja notificado quando houver vaga</p>
        </div>
        <div class="info-card">
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                Não achou um horário disponível? <br>Entre na lista de espera que avisaremos quando houver vaga.
            </p>
            <div class="form-group">
                <label for="waitlistService">Serviço desejado</label>
                <select id="waitlistService" class="waitlist-select">
                    <option value="">Selecione...</option>
                    ${appData.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="waitlistDate">Data preferida</label>
                <input type="date" id="waitlistDate" class="waitlist-input">
            </div>
            <div class="form-group">
                <label for="waitlistPhone">Seu WhatsApp</label>
                <input type="tel" id="waitlistPhone" placeholder="(11) 99999-9999" class="waitlist-input">
            </div>
            <button class="menu-action-btn" onclick="submitWaitlist()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                Entrar na Lista de Espera
            </button>
        </div>
    `;
}

function submitWaitlist() {
    const service = document.getElementById('waitlistService').value;
    const date = document.getElementById('waitlistDate').value;
    const phone = document.getElementById('waitlistPhone').value;
    
    if (!service || !date || !phone) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const serviceObj = appData.services.find(s => s.id === service);
    const name = serviceObj ? serviceObj.name : service;
    
    joinWaitlist(name, date, phone, '');
    
    alert('Você foi adicionado à lista de espera! Entraremos em contato quando houver disponibilidade.');
    closeMenuSection();
}

window.openRegisterModal = function() {
    document.getElementById('registerModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeRegisterModal = function() {
    document.getElementById('registerModal').style.display = 'none';
    document.body.style.overflow = '';
};

document.getElementById('clientPhone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value.length <= 2) {
            value = '(' + value;
        } else if (value.length <= 6) {
            value = '(' + value.slice(0, 2) + ') ' + value.slice(2);
        } else if (value.length <= 10) {
            value = '(' + value.slice(0, 2) + ') ' + value.slice(2, 6) + '-' + value.slice(6);
        } else {
            value = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7, 11);
        }
    }
    e.target.value = value;
});
