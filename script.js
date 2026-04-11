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
    services: [
        {
            id: "manicure-basica",
            category: "manicure",
            name: "Manicure",
            description: "Corte, shape e pintura perfeita",
            price: 50,
            duration: 45,
            badge: null,
            icon: "hand"
        },
        {
            id: "manicure-gel",
            category: "manicure",
            name: "Esmaltação em Gel",
            description: "Esmaltação em Gel com duraçao de até 15 dias.",
            price: 85,
            duration: 90,
            badge: null,
            icon: "hand"
        },
        {
            id: "pe-mao",
            category: "manicure",
            name: "Pé e Mão",
            description: "Combo completo com hidratação",
            price: 85,
            duration: 90,
            badge: null,
            icon: "hands"
        },
        {
            id: "esmaltacao-gel",
            category: "manicure",
            name: "Esmaltação em Gel",
            description: "Durabilidade e brilho por semanas",
            price: 70,
            duration: 60,
            badge: null,
            icon: "bottle"
        },
        {
            id: "alongamento",
            category: "manicure",
            name: "Alongamento",
            description: "Unhaspostiças com técnica moderna",
            price: 150,
            duration: 120,
            badge: null,
            icon: "longnail"
        },
        {
            id: "podologia-basica",
            category: "podologia",
            name: "Podologia Básica",
            description: "Limpeza, corte e tratamento de unhas",
            price: 80,
            duration: 60,
            badge: null,
            icon: "foot"
        },
        {
            id: "spa-podologico",
            category: "podologia",
            name: "Spa Podológico",
            description: "Hidratação profunda e massagem relaxante",
            price: 120,
            duration: 90,
            badge: null,
            icon: "spa"
        },
        {
            id: "tratamento-calos",
            category: "podologia",
            name: "Tratamento de Calos",
            description: "Remoção e tratamento especializado",
            price: 90,
            duration: 60,
            badge: null,
            icon: "circle"
        },
        {
            id: "ortese-unha",
            category: "podologia",
            name: "Órtese de Unha",
            description: "Correção de unhas encravadas",
            price: 100,
            duration: 45,
            badge: null,
            icon: "brace"
        }
    ]
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

// Número do WhatsApp - SUBSTITUA pelo seu número
const WHATSAPP_NUMBER = '5511999999999';

// Horários disponíveis
const AVAILABLE_TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const UNAVAILABLE_TIMES = []; // Adicione horários indisponíveis, ex: ['10:00', '15:00']

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    renderCategories();
});

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

function loadTimes() {
    const timeGrid = document.getElementById('timeGrid');
    const timeSection = document.getElementById('timeSection');
    
    timeGrid.innerHTML = AVAILABLE_TIMES.map((time, index) => {
        const isUnavailable = UNAVAILABLE_TIMES.includes(time);
        const delayClass = `delay-${(index % 6) + 1}`;
        return `
            <button 
                class="time-slot ${isUnavailable ? 'unavailable' : ''} animate-scale-in ${delayClass}" 
                onclick="${isUnavailable ? '' : `selectTime('${time}')`}"
                ${isUnavailable ? 'disabled' : ''}
            >
                ${time}
            </button>
        `;
    }).join('');
    
    timeSection.style.display = 'block';
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
    document.getElementById('summaryTime').textContent = selectedTime;
    document.getElementById('summaryPrice').textContent = `R$ ${selectedPrice}`;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('pt-BR', options);
}

// ============================================
// ENVIO WHATSAPP
// ============================================

document.getElementById('confirmForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    
    const category = appData.categories.find(c => c.id === selectedCategory);
    const categoryText = category ? category.name : 'Manicure & Pedicure';
    
    const message = `Olá! Gostaria de confirmar meu agendamento:\n\n` +
        `👤 Nome: ${name}\n` +
        `📱 WhatsApp: ${phone}\n` +
        `💅 Área: ${categoryText}\n` +
        `✨ Serviço: ${selectedService}\n` +
        `📅 Data: ${formatDate(selectedDate)}\n` +
        `🕐 Horário: ${selectedTime}\n` +
        `💰 Valor: R$ ${selectedPrice}`;
    
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    
    // Abre WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Mostra modal de sucesso
    document.getElementById('successModal').style.display = 'flex';
});

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    
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
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    
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
