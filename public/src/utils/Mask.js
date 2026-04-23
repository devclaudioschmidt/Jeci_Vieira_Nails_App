const Mask = {
    init() {
        const phoneInput = DOM.get('clientPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.phone(e.target));
        }
    },

    phone(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }
        
        input.value = value;
    },

    phoneRaw(value) {
        return value.replace(/\D/g, '');
    },

    date(value) {
        value = value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        
        if (value.length > 4) {
            value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
        } else if (value.length > 2) {
            value = `${value.slice(0, 2)}/${value.slice(2)}`;
        }
        
        return value;
    }
};

export { Mask };
