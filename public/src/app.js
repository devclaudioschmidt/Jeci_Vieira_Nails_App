import { WHATSAPP_NUMBER } from './config.js';
import { Api } from './core/ApiService.js';
import { Formatters } from './utils/Formatters.js';
import { Mask } from './utils/Mask.js';
import { CalendarInstance as Calendar } from './features/Calendar.js';
import { TimeSlotsInstance as TimeSlots } from './features/TimeSlots.js';
import { HistoryInstance as History } from './features/History.js';
import { Navigation } from './features/Navigation.js';
import { Reminder, Contact, Waitlist, UI, HistoryManager } from './features/Helpers.js';
import { Components } from './ui/Components.js';
import { Modals } from './ui/Modals.js';
import { App, AppState, DOM, appData } from './core/App.js';

window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;

document.addEventListener('DOMContentLoaded', async function() {
    DOM.init();
    Mask.init();

    Calendar.init((date) => {
        TimeSlots.load(date);
    });

    TimeSlots.init((time) => {
        Navigation.showStep3();
    });

    Navigation.init();
    History.init(DOM.get('clientPhone')?.value || '');

    const loggedUid = localStorage.getItem('cliente_uid');
    const loggedNome = localStorage.getItem('cliente_nome');
    const loggedTelefone = localStorage.getItem('cliente_telefone');

    if (loggedUid && loggedNome) {
        const nameInput = DOM.get('clientName');
        const phoneInput = DOM.get('clientPhone');
        if (nameInput) nameInput.value = loggedNome;
        if (phoneInput && loggedTelefone) {
            phoneInput.value = Mask.phone(loggedTelefone) || loggedTelefone;
        }
    }

    const confirmForm = DOM.get('confirmForm');
    if (confirmForm) {
        confirmForm.addEventListener('submit', handleConfirmSubmit);
    }

    try {
        await App.loadServices();
    } catch (err) {
        console.error('Falha ao carregar serviços:', err);
    }

    App.setLoading(false);
});

async function handleConfirmSubmit(e) {
    e.preventDefault();

    const name = DOM.get('clientName')?.value;
    const phone = DOM.get('clientPhone')?.value;
    const summary = App.state.getBookingSummary();

    const category = appData.categories.find(c => c.id === summary.category);
    const categoryText = category ? category.name : 'Manicure & Pedicure';

    Modals.confirm(
        { name, phone, category: categoryText, ...summary },
        handleConfirmAndSend,
        () => Modals.closeConfirm()
    );
}

async function handleConfirmAndSend() {
    const name = DOM.get('clientName')?.value;
    const phone = DOM.get('clientPhone')?.value;
    const summary = App.state.getBookingSummary();

    const category = appData.categories.find(c => c.id === summary.category);
    const categoryText = category ? category.name : 'Manicure & Pedicure';

    try {
        const result = await Api.agendar({
            date: summary.date,
            time: summary.time,
            service: summary.service,
            name,
            phone,
            duration: summary.duration
        });

        if (result.sucesso) {
            History.add(summary.service, summary.date, summary.time, summary.price, summary.category);

            const message = `Olá! Gostaria de confirmar meu agendamento:\n\n` +
                `👤 Nome: ${name}\n` +
                `📱 WhatsApp: ${phone}\n` +
                `💅 Área: ${categoryText}\n` +
                `✨ Serviço: ${summary.service}\n` +
                `📅 Data: ${Formatters.date(summary.date)}\n` +
                `🕐 Horário: ${summary.time}\n` +
                `💰 Valor: ${Formatters.price(summary.price)}`;

            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            const win = window.open(whatsappUrl, '_blank');
            if (!win || win.closed || typeof win.closed === 'undefined') {
                location.href = whatsappUrl;
            }

            Modals.hide('confirmModal');
            Modals.show('successModal');
        } else {
            alert(result.erro || 'Erro ao agendar. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao agendar. Tente novamente.');
    }
}

function closeModal() {
    Modals.closeSuccess();
    Navigation.reset();
}

window.closeModal = closeModal;
window.toggleMenu = () => UI.toggleMenu();
window.openWhatsApp = () => {
    UI.toggleMenu();
    Contact.info();
};
window.openLocation = () => UI.openLocation();
window.showMenuSection = (section) => Navigation.showSection(section);
window.closeMenuSection = () => Modals.closeSection();
window.dismissReminder = () => UI.dismissReminder();
window.selectCategory = (id) => Navigation.goToCategory(id);
window.selectService = (id) => Navigation.selectService(id);
window.goBackToHome = () => Navigation.goBackToHome();
window.goBack = () => Navigation.goBack();
window.changeMonth = (delta) => Calendar.changeMonth(delta);
window.selectDate = (date, el) => Calendar.selectDate(date, el);
window.selectTime = (time, event) => TimeSlots.select(time, event);
window.confirmAndSendWhatsApp = handleConfirmAndSend;
window.backToForm = () => Modals.closeConfirm();
window.openRegisterModal = () => Modals.show('registerModal');
window.closeRegisterModal = () => Modals.hide('registerModal');