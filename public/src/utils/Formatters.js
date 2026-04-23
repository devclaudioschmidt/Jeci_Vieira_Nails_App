const Formatters = {
    date(dateString, options = {}) {
        if (!dateString) return '-';
        const date = new Date(dateString + 'T00:00:00');
        const defaultOptions = { weekday: 'long', day: 'numeric', month: 'long', ...options };
        return date.toLocaleDateString('pt-BR', defaultOptions);
    },

    dateShort(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    },

    duration(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    },

    price(value) {
        if (!value && value !== 0) return '-';
        return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
    },

    timeRange(startTime, duration) {
        if (!startTime) return '-';
        
        const parts = startTime.split(':');
        let hours = parseInt(parts[0], 10);
        let minutes = parseInt(parts[1], 10) || 0;
        
        const totalMinutes = hours * 60 + minutes + (duration || 30);
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        
        const startFormatted = `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}`;
        const endFormatted = `${String(endHours).padStart(2, '0')}h${String(endMinutes).padStart(2, '0')}`;
        
        return `Das ${startFormatted} às ${endFormatted}`;
    },

    monthYear(month, year) {
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${monthNames[month]} ${year}`;
    },

    toInputDate(date) {
        if (!date) return '';
        if (typeof date === 'string' && date.includes('T')) {
            date = date.split('T')[0];
        }
        return date;
    },

    fromInputDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateString;
    }
};

export { Formatters };