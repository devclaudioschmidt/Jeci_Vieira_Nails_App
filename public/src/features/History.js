import { Mask } from '../utils/Mask.js';

class History {
    constructor() {
        this._key = null;
        this._maxItems = 5;
    }

    init(clientPhone) {
        const phone = Mask.phoneRaw(clientPhone);
        this._key = phone ? `historico_${phone}` : null;
    }

    getKey() {
        return this._key;
    }

    getAll() {
        if (!this._key) return [];
        try {
            const data = localStorage.getItem(this._key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    add(service, date, time, price, category) {
        if (!this._key) return;
        
        let history = this.getAll();
        history.unshift({
            service,
            date,
            time,
            price,
            category,
            createdAt: new Date().toISOString()
        });
        
        if (history.length > this._maxItems) {
            history = history.slice(0, this._maxItems);
        }
        
        localStorage.setItem(this._key, JSON.stringify(history));
    }

    remove(index) {
        if (!this._key) return;
        let history = this.getAll();
        history.splice(index, 1);
        localStorage.setItem(this._key, JSON.stringify(history));
    }

    clear() {
        if (this._key) {
            localStorage.removeItem(this._key);
        }
    }

    getUpcoming() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return this.getAll().find(item => {
            const date = new Date(item.date + 'T' + item.time);
            return date > now && date < tomorrow;
        });
    }

    isUpcoming(date) {
        return new Date(date) > new Date();
    }
}

export const HistoryInstance = new History();
