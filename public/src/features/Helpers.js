const Reminder = {
    check() {
        const upcoming = History.getUpcoming();
        if (!upcoming) return;
        
        const banner = Components.reminderBanner(upcoming);
        document.body.insertAdjacentHTML('beforeend', banner);
    },

    dismiss() {
        const banner = DOM.get('reminderBanner');
        if (banner) banner.remove();
    }
};

const Contact = {
    whatsapp(service, date, time) {
        const name = DOM.get('clientName')?.value || 'Cliente';
        const phone = DOM.get('clientPhone')?.value || '';
        
        const message = `Ola! Tenho uma duvida sobre meu agendamento:\n\n` +
            `Nome: ${name}\n` +
            `WhatsApp: ${phone}\n` +
            `Servico: ${service}\n` +
            `Data: ${Formatters.date(date)}\n` +
            `Horario: ${time}\n\n` +
            `Gostaria de saber mais informacoes.`;
        
        this._openWhatsApp(message);
    },

    cancel(service, date, time) {
        const formattedDate = Formatters.date(date);
        
        if (!confirm(`Deseja realmente cancelar o agendamento de ${service} no dia ${formattedDate} as ${time}?`)) {
            return;
        }
        
        const name = DOM.get('clientName')?.value || 'Cliente';
        const phone = DOM.get('clientPhone')?.value || '';
        
        const message = `Ola! Gostaria de CANCELAR meu agendamento:\n\n` +
            `Nome: ${name}\n` +
            `WhatsApp: ${phone}\n` +
            `Servico: ${service}\n` +
            `Data: ${formattedDate}\n` +
            `Horario: ${time}\n\n` +
            `Por favor, cancele meu agendamento. Obrigado(a)!`;
        
        this._openWhatsApp(message);
    },

    info() {
        const message = 'Ola! Gostaria de mais informacoes sobre os servicos.';
        this._openWhatsApp(message);
    },

    _openWhatsApp(message) {
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        const win = window.open(url, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
            location.href = url;
        }
    }
};

const Waitlist = {
    _key: 'waitlist',

    init() {
        const dateInput = DOM.get('waitlistDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }
    },

    submit() {
        const serviceId = DOM.get('waitlistService')?.value;
        const date = DOM.get('waitlistDate')?.value;
        const phone = DOM.get('waitlistPhone')?.value;

        if (!serviceId || !date || !phone) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const service = appData.services.find(s => s.id === serviceId);
        const name = service ? service.name : serviceId;

        let waitlist = this.getAll();
        waitlist.push({
            service: name,
            date,
            phone,
            name: '',
            createdAt: new Date().toISOString()
        });

        localStorage.setItem(this._key, JSON.stringify(waitlist));

        alert('Voce foi adicionado a lista de espera! Entraremos em contato quando houver disponibilidade.');
        Modals.closeSection();
    },

    getAll() {
        try {
            const data = localStorage.getItem(this._key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
};

const UI = {
    toggleMenu() {
        DOM.get('menuOverlay')?.classList.toggle('active');
        DOM.get('menuDrawer')?.classList.toggle('active');
        document.body.style.overflow = DOM.get('menuOverlay')?.classList.contains('active') ? 'hidden' : '';
    },

    openLocation() {
        this.toggleMenu();
        const url = `https://www.google.com/maps/search/?api=1&query=R.+Erwin+Seiller+46%2C+Joinville%2C+SC`;
        window.open(url, '_blank');
    },

    dismissReminder() {
        Reminder.dismiss();
    },

    closeAllModals() {
        Modals.closeAll();
    }
};

const HistoryManager = {
    cancel(index, service, date, time) {
        Contact.cancel(service, date, time);
        
        setTimeout(() => {
            History.remove(index);
            Modals.section(Navigation.getHistoricoContent());
        }, 1000);
    }
};

export { Reminder, Contact, Waitlist, UI, HistoryManager };
