const Components = {
    categoryCard(category, index) {
        const delayClass = `delay-${index + 1}`;
        const isPodologia = category.id === 'podologia';
        
        return `
            <button class="category-card ${isPodologia ? 'podologia' : ''} animate-fade-in-up ${delayClass}" onclick="Navigation.goToCategory('${category.id}')">
                <div class="category-icon ${isPodologia ? 'podologia' : ''}">
                    ${this.getCategoryIcon(category.icon)}
                </div>
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                <span class="category-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19"/>
                    </svg>
                </span>
            </button>
        `;
    },

    serviceCard(service, categoryId, index) {
        const delayClass = `delay-${index + 1}`;
        const isPodologia = categoryId === 'podologia';
        const badgeHtml = service.badge ? `<div class="service-badge">${service.badge}</div>` : '';
        
        return `
            <button class="service-card animate-fade-in-up ${delayClass}" onclick="Navigation.selectService('${service.id}')">
                ${badgeHtml}
                <div class="service-icon ${isPodologia ? 'podologia' : ''}">
                    ${this.getServiceIcon(service.icon)}
                </div>
                <div class="service-info">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                </div>
                <div class="service-meta">
                    <span class="price">R$ ${service.price}</span>
                    <span class="duration">${Formatters.duration(service.duration)}</span>
                </div>
                <div class="card-shine"></div>
            </button>
        `;
    },

    historyCard(item, index) {
        const dateStr = Formatters.dateShort(item.date);
        const isUpcoming = History.isUpcoming(item.date);
        
        return `
            <div class="history-card ${isUpcoming ? 'upcoming' : ''}">
                <div class="history-date">${dateStr}</div>
                <div class="history-service">${item.service}</div>
                <div class="history-time">${item.time}</div>
                <div class="history-price">${Formatters.price(item.price)}</div>
                ${isUpcoming ? `
                    <button class="history-contact-btn" onclick="Contact.whatsapp('${item.service}', '${item.date}', '${item.time}')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967..."/>
                        </svg>
                        <span>Entrar em contato</span>
                    </button>
                    <button class="history-cancel-btn" onclick="HistoryManager.cancel(${index}, '${item.service}', '${item.date}', '${item.time}')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span>Cancelar</span>
                    </button>
                ` : ''}
            </div>
        `;
    },

    reminderBanner(item) {
        return `
            <div class="reminder-banner" id="reminderBanner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <div class="reminder-text">
                    <strong>Lembrete: ${item.service}</strong>
                    <span>Amanhã às ${item.time}</span>
                </div>
                <button class="reminder-close" onclick="UI.dismissReminder()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6L18 18"/>
                    </svg>
                </button>
            </div>
        `;
    },

    getCategoryIcon(iconType) {
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
    },

    getServiceIcon(iconType) {
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
};

export { Components };