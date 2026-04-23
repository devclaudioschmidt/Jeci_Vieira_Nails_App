const Modals = {
    show(modalId) {
        const modal = DOM.get(modalId);
        if (modal) modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    hide(modalId) {
        const modal = DOM.get(modalId);
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
    },

    success(onClose) {
        this.show('successModal');
        window._successCallback = onClose;
    },

    confirm(data, onConfirm, onBack) {
        const detailsEl = DOM.get('confirmDetails');
        if (detailsEl) {
            detailsEl.innerHTML = `
                <p><span class="label">Nome:</span> <span class="value">${data.name}</span></p>
                <p><span class="label">WhatsApp:</span> <span class="value">${data.phone}</span></p>
                <p><span class="label">Area:</span> <span class="value">${data.category}</span></p>
                <p><span class="label">Servico:</span> <span class="value">${data.service}</span></p>
                <p><span class="label">Data:</span> <span class="value">${Formatters.date(data.date)}</span></p>
                <p><span class="label">Horario:</span> <span class="value">${data.time}</span></p>
                <p><span class="label">Valor:</span> <span class="value">R$ ${data.price}</span></p>
            `;
        }

        window._confirmCallback = onConfirm;
        window._confirmBackCallback = onBack;
        this.show('confirmModal');
    },

    section(content) {
        const body = DOM.get('menuSectionBody');
        if (body) body.innerHTML = content;
        this.show('menuSectionModal');
    },

    closeAll() {
        const modals = ['successModal', 'confirmModal', 'menuSectionModal', 'registerModal'];
        modals.forEach(id => this.hide(id));
        document.body.style.overflow = '';
    },

    closeSuccess() {
        this.hide('successModal');
        document.body.style.overflow = '';
        if (window._successCallback) {
            window._successCallback();
        }
    },

    closeConfirm() {
        this.hide('confirmModal');
        document.body.style.overflow = '';
        if (window._confirmBackCallback) {
            window._confirmBackCallback();
        }
    },

    closeSection() {
        this.hide('menuSectionModal');
        document.body.style.overflow = '';
    }
};

export { Modals };
