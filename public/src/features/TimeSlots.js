import { DOM, App } from '../core/App.js';
import { Api } from '../core/ApiService.js';

class TimeSlots {
    constructor() {
        this._onSelect = null;
        this._times = [];
    }

    init(onSelect) {
        this._onSelect = onSelect;
    }

    async load(date) {
        const timeGrid = DOM.get('timeGrid');
        const timeLoading = DOM.get('timeLoading');
        
        if (timeGrid) timeGrid.innerHTML = '';
        if (timeLoading) timeLoading.style.display = 'flex';
        DOM.show('timeSection');

        try {
            const duration = App.state.get('selectedDuration') || 30;
            const data = await Api.getHorarios(date, duration);
            const horarios = data.horarios || [];
            
            if (timeLoading) timeLoading.style.display = 'none';
            this._times = horarios;

            if (horarios.length === 0) {
                if (timeGrid) {
                    timeGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">Nenhum horário disponível para esta data.</p>';
                }
                return;
            }

            if (timeGrid) {
                timeGrid.innerHTML = horarios.map((time, index) => {
                    const delayClass = `delay-${(index % 6) + 1}`;
                    return `
                        <button class="time-slot animate-scale-in ${delayClass}" onclick="TimeSlots.select('${time}', event)">
                            ${time}
                        </button>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Erro ao buscar horários:', error);
            if (timeLoading) timeLoading.style.display = 'none';
            this.showFallback(timeGrid);
        }

        const timeSection = DOM.get('timeSection');
        if (timeSection) timeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showFallback(container) {
        if (!container) return;
        const fallback = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
        container.innerHTML = fallback.map((time, index) => {
            const delayClass = `delay-${(index % 6) + 1}`;
            return `
                <button class="time-slot animate-scale-in ${delayClass}" onclick="TimeSlots.select('${time}', event)">
                    ${time}
                </button>
            `;
        }).join('');
    }

    select(time, event) {
        App.state.set('selectedTime', time);
        
        DOM.queryAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        if (event && event.target) {
            event.target.classList.add('selected');
        }

        setTimeout(() => {
            if (this._onSelect) {
                this._onSelect(time);
            }
        }, 300);
    }
}

export const TimeSlotsInstance = new TimeSlots();
