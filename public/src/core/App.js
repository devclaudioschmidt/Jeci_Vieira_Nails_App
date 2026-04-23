import { Api } from './ApiService.js';
import { Mask } from '../utils/Mask.js';

const appData = {
    categories: [
        { id: 'manicure', name: 'Manicure & Pedicure', description: 'Nails, gel, alongamento e spa dos pés', icon: 'nails' },
        { id: 'podologia', name: 'Podologia', description: 'Tratamento especializado para os pés', icon: 'foot' }
    ],
    services: []
};

class AppState {
    constructor() {
        this._state = {
            selectedCategory: null,
            selectedService: null,
            selectedDate: null,
            selectedTime: null,
            selectedPrice: null,
            selectedDuration: null,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            isLoading: false
        };
        this._listeners = {};
    }

    get(key) {
        return this._state[key];
    }

    set(key, value) {
        const oldValue = this._state[key];
        this._state[key] = value;
        this._emit(key, value, oldValue);
    }

    subscribe(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return () => {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        };
    }

    _emit(event, value, oldValue) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(cb => cb(value, oldValue));
        }
        if (this._listeners['*']) {
            this._listeners['*'].forEach(cb => cb(event, value, oldValue));
        }
    }

    reset() {
        this.set('selectedService', null);
        this.set('selectedDate', null);
        this.set('selectedTime', null);
        this.set('selectedPrice', null);
        this.set('selectedCategory', null);
    }

    getBookingSummary() {
        return {
            service: this._state.selectedService,
            date: this._state.selectedDate,
            time: this._state.selectedTime,
            price: this._state.selectedPrice,
            duration: this._state.selectedDuration,
            category: this._state.selectedCategory
        };
    }
}

const App = {
    state: new AppState(),
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        DOM.init();
        Mask.init();

        this.state.subscribe('*', (key, value) => {
            console.log(`[State] ${key}:`, value);
        });
    },

    async loadServices() {
        try {
            const data = await Api.getServicos();
            if (Array.isArray(data) && data.length > 0) {
                appData.services = data;
            }
        } catch (err) {
            console.error('Falha ao carregar serviços:', err);
        }
    },

    setLoading(loading) {
        this.state.set('isLoading', loading);
        const loader = DOM.get('globalLoader');
        if (loader) {
            loader.style.opacity = loading ? '1' : '0';
            if (!loading) {
                setTimeout(() => loader.style.display = 'none', 500);
            }
        }
    }
};

const DOM = {
    _cache: {},

    init() {
        document.querySelectorAll('[id]').forEach(el => {
            this._cache[el.id] = el;
        });
    },

    get(id) {
        if (!this._cache[id]) {
            this._cache[id] = document.getElementById(id);
        }
        return this._cache[id];
    },

    query(selector, context = document) {
        return context.querySelector(selector);
    },

    queryAll(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    },

    show(id) {
        const el = this.get(id);
        if (el) el.style.display = 'block';
    },

    hide(id) {
        const el = this.get(id);
        if (el) el.style.display = 'none';
    },

    toggle(id) {
        const el = this.get(id);
        if (el) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    },

    scrollTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const SALON_LOCATION = {
    nome: 'Jeci Vieira Nails',
    coordenadas: { lat: -26.2807517, lng: -48.884255 }
};

export { App, AppState, DOM, appData };