class Calendar {
    constructor() {
        this._month = new Date().getMonth();
        this._year = new Date().getFullYear();
        this._onDateSelect = null;
    }

    init(onSelect) {
        this._onDateSelect = onSelect;
        this.render();
    }

    setMonth(month, year) {
        this._month = month;
        this._year = year;
        this.render();
    }

    changeMonth(delta) {
        this._month += delta;
        
        if (this._month > 11) {
            this._month = 0;
            this._year++;
        } else if (this._month < 0) {
            this._month = 11;
            this._year--;
        }
        
        this.render();
    }

    render() {
        const monthEl = DOM.get('calendarMonth');
        if (monthEl) {
            monthEl.textContent = Formatters.monthYear(this._month, this._year);
        }

        const container = DOM.get('calendarDays');
        if (!container) return;

        const firstDay = new Date(this._year, this._month, 1).getDay();
        const daysInMonth = new Date(this._year, this._month + 1, 0).getDate();
        const daysInPrevMonth = new Date(this._year, this._month, 0).getDate();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDate = App.state.get('selectedDate');
        let dayIndex = 0;
        let html = '';

        for (let i = firstDay - 1; i >= 0; i--) {
            const delayClass = `delay-${(dayIndex % 6) + 1}`;
            html += `<button class="calendar-day other-month animate-scale-in ${delayClass}" disabled>${daysInPrevMonth - i}</button>`;
            dayIndex++;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this._year, this._month, day);
            date.setHours(12, 0, 0, 0);
            const dateStr = `${this._year}-${String(this._month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const delayClass = `delay-${(dayIndex % 6) + 1}`;
            
            let classes = 'calendar-day animate-scale-in ' + delayClass;
            const dayOfWeek = date.getDay();

            if (date < today) {
                classes += ' disabled';
                html += `<button class="${classes}" disabled>${day}</button>`;
            } else if (dayOfWeek === 0) {
                classes += ' disabled';
                html += `<button class="${classes}" disabled>${day}</button>`;
            } else {
                if (date.getTime() === today.getTime()) {
                    classes += ' today';
                }
                if (selectedDate === dateStr) {
                    classes += ' selected';
                }
                html += `<button class="${classes}" onclick="Calendar.selectDate('${dateStr}', this)">${day}</button>`;
            }
            dayIndex++;
        }

        const totalCells = firstDay + daysInMonth;
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const delayClass = `delay-${(dayIndex % 6) + 1}`;
            html += `<button class="calendar-day other-month animate-scale-in ${delayClass}" disabled>${i}</button>`;
            dayIndex++;
        }

        container.innerHTML = html;
    }

    selectDate(dateStr, element) {
        App.state.set('selectedDate', dateStr);
        
        DOM.queryAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        element.classList.add('selected');

        if (this._onDateSelect) {
            this._onDateSelect(dateStr);
        }
    }
}

export const CalendarInstance = new Calendar();
