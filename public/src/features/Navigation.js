const Navigation = {
    _steps: ['step1', 'step-manicure', 'step-podologia', 'step2', 'step3'],
    _sectionContent: {},

    init() {
        this.renderCategories();
        Reminder.check();
        this.initMenuSections();
        Waitlist.init();
    },

    renderCategories() {
        const container = DOM.query('#step1 .category-grid');
        if (container) {
            container.innerHTML = appData.categories.map((cat, i) => Components.categoryCard(cat, i)).join('');
        }
    },

    goToCategory(categoryId) {
        App.state.set('selectedCategory', categoryId);

        this.hideAllSteps();
        
        const category = appData.categories.find(c => c.id === categoryId);
        const services = appData.services.filter(s => s.category === categoryId);
        
        const stepId = categoryId === 'manicure' ? 'step-manicure' : 'step-podologia';
        const section = DOM.get(stepId);
        
        if (section) {
            const titleEl = section.querySelector('.section-title');
            const subtitleEl = section.querySelector('.section-subtitle');
            if (titleEl) titleEl.textContent = category ? category.name : '';
            if (subtitleEl) subtitleEl.textContent = category ? category.description : '';
            
            const listEl = section.querySelector('.service-list');
            if (listEl) {
                listEl.innerHTML = services.map((s, i) => Components.serviceCard(s, categoryId, i)).join('');
            }
            
            section.style.display = 'block';
        }
        
        DOM.scrollTop();
    },

    selectService(serviceId) {
        const service = appData.services.find(s => s.id === serviceId);
        if (!service) return;
        
        App.state.set('selectedService', service.name);
        App.state.set('selectedDuration', service.duration);
        App.state.set('selectedPrice', service.price);
        App.state.set('selectedCategory', service.category);

        DOM.get('selectedServiceName').textContent = service.name;
        DOM.get('selectedServicePrice').textContent = `R$ ${service.price}`;
        
        this.hideAllSteps();
        DOM.show('step2');
        
        DOM.scrollTop();
    },

    goBack() {
        const step3 = DOM.get('step3');
        const step2 = DOM.get('step2');
        
        if (step3 && step3.style.display !== 'none') {
            step3.style.display = 'none';
            step2.style.display = 'block';
        } else {
            step2.style.display = 'none';
            
            const category = App.state.get('selectedCategory');
            if (category === 'manicure') {
                DOM.show('step-manicure');
            } else if (category === 'podologia') {
                DOM.show('step-podologia');
            } else {
                DOM.show('step1');
            }
            
            App.state.set('selectedService', null);
        }
        
        DOM.scrollTop();
    },

    goBackToHome() {
        this.hideAllSteps();
        App.state.set('selectedCategory', null);
        DOM.show('step1');
        DOM.scrollTop();
    },

    showStep3() {
        this.hideAllSteps();
        
        const summary = App.state.getBookingSummary();
        DOM.get('summaryService').textContent = summary.service;
        DOM.get('summaryDate').textContent = Formatters.date(summary.date);
        DOM.get('summaryTime').textContent = Formatters.timeRange(summary.time, summary.duration);
        DOM.get('summaryPrice').textContent = Formatters.price(summary.price);
        
        DOM.show('step3');
        DOM.scrollTop();
    },

    hideAllSteps() {
        this._steps.forEach(id => DOM.hide(id));
    },

    reset() {
        History.init(DOM.get('clientPhone')?.value || '');
        this.hideAllSteps();
        DOM.show('step1');
    },

    initMenuSections() {
        this._sectionContent = {
            horarios: this.getHorariosContent,
            galeria: this.getGaleriaContent,
            depoimentos: this.getDepoimentosContent,
            promocoes: this.getPromocoesContent,
            sobre: this.getSobreContent,
            politica: this.getPoliticaContent,
            historico: this.getHistoricoContent,
            listaespera: this.getListaEsperaContent
        };
    },

    showSection(section) {
        const contentFn = this._sectionContent[section];
        if (contentFn) {
            Modals.section(contentFn.call(this));
        }
    },

    getHorariosContent() {
        return `
            <div class="menu-section-header">
                <h2>Horário de Funcionamento</h2>
                <p>Estamos disponíveis para atendê-lo nos seguintes horários:</p>
            </div>
            <div class="horarios-card">
                <div class="dia-card">
                    <div class="dia-header">
                        <span class="dia-icon">📅</span>
                        <span class="dia-nome">Segunda à Sexta</span>
                    </div>
                    <div class="horarios-periodos">
                        <div class="periodo manha">
                            <span class="periodo-label">☀️ Manhã</span>
                            <span class="periodo-horario">08:00h - 11:00h</span>
                        </div>
                        <div class="periodo tarde">
                            <span class="periodo-label">🌙 Tarde</span>
                            <span class="periodo-horario">13:30h - 21:00h</span>
                        </div>
                    </div>
                </div>
                <div class="dia-card">
                    <div class="dia-header">
                        <span class="dia-icon">📅</span>
                        <span class="dia-nome">Sábado</span>
                    </div>
                    <div class="horarios-periodos">
                        <div class="periodo">
                            <span class="periodo-label">🕐</span>
                            <span class="periodo-horario">07:00h - 12:00h</span>
                        </div>
                    </div>
                </div>
                <div class="dia-card fechado">
                    <div class="dia-header">
                        <span class="dia-icon">🚫</span>
                        <span class="dia-nome">Domingo e Feriados</span>
                    </div>
                    <div class="periodo-fechado"><span>Fechado</span></div>
                </div>
            </div>
            <div class="obs-card">
                <p>📞 Agende seu horário com antecedência!</p>
            </div>
        `;
    },

    getGaleriaContent() {
        return `
            <div class="menu-section-header">
                <h2>Galeria</h2>
                <p>Alguns dos nossos trabalhos</p>
            </div>
            <div class="gallery-grid">
                <div class="gallery-item">💅</div>
                <div class="gallery-item">✨</div>
                <div class="gallery-item">🎨</div>
                <div class="gallery-item">💖</div>
                <div class="gallery-item">🌸</div>
                <div class="gallery-item">⭐</div>
            </div>
        `;
    },

    getDepoimentosContent() {
        return `
            <div class="menu-section-header">
                <h2>Depoimentos</h2>
                <p>O que nossas clientes dizem</p>
            </div>
            <div class="testimonial-card">
                <p class="testimonial-text">"Excelente trabalho! Sempre saio satisfeita do salão."</p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">M</div>
                    <div>
                        <div class="testimonial-name">Maria Silva</div>
                        <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card">
                <p class="testimonial-text">"Ambiente agradável e profissionais capacitados. Recomendo!"</p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">J</div>
                    <div>
                        <div class="testimonial-name">Julia Santos</div>
                        <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
                    </div>
                </div>
            </div>
        `;
    },

    getPromocoesContent() {
        return `
            <div class="menu-section-header">
                <h2>Promoções</h2>
                <p>Descontos especiais para você</p>
            </div>
            <div class="promo-card">
                <h3>Combo Master</h3>
                <p>Pé + Mão + Hidratação</p>
                <div class="promo-code">COMBO20</div>
                <p style="margin-top: 12px; font-size: 0.85rem;">20% de desconto</p>
            </div>
            <div class="promo-card">
                <h3>Dia das Amigas</h3>
                <p>2+ mãos = 15% off</p>
                <div class="promo-code">DIAS</div>
            </div>
            <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                Válido apenas para novos agendamentos.
            </p>
        `;
    },

    getSobreContent() {
        return `
            <div class="menu-section-header">
                <h2>Sobre Nós</h2>
                <p>Conheça nossa história</p>
            </div>
            <div class="about-image">
                <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="32" cy="20" r="12"/>
                    <path d="M16 56C16 40 24 32 32 32C40 32 48 40 48 56"/>
                </svg>
            </div>
            <div class="about-text">
                <p>Jeci Vieira Nails & Podologia é um salão especializado em cuidados das unhas e dos pés.</p>
                <p>Nosso objetivo é proporcionar beleza e bem-estar através de serviços de qualidade.</p>
                <p>Agende seu horário e venha nos conhecer!</p>
            </div>
        `;
    },

    getPoliticaContent() {
        return `
            <div class="menu-section-header">
                <h2>Política de Agendamento</h2>
                <p>Regras e condições</p>
            </div>
            <div class="info-card">
                <ul class="policy-list">
                    <li>
                        <div class="policy-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8V12L16 14"/>
                            </svg>
                        </div>
                        <div class="policy-text">
                            <strong>Horário</strong>
                            <span>Chegue no horário agendado. Atrasos de mais de 10min podem resultar em cancelamento.</span>
                        </div>
                    </li>
                    <li>
                        <div class="policy-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818"/>
                                <path d="M22 4L12 14.01L9 11.01"/>
                            </svg>
                        </div>
                        <div class="policy-text">
                            <strong>Cancelamento</strong>
                            <span>Cancele com antecedência mínima de 24h.</span>
                        </div>
                    </li>
                    <li>
                        <div class="policy-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                                <path d="M12 6V12L16 14"/>
                            </svg>
                        </div>
                        <div class="policy-text">
                            <strong>Confirmação</strong>
                            <span>Seu agendamento será confirmado via WhatsApp.</span>
                        </div>
                    </li>
                </ul>
            </div>
        `;
    },

    getHistoricoContent() {
        const history = History.getAll();
        
        if (!DOM.get('clientPhone')?.value) {
            return `
                <div class="menu-section-header">
                    <h2>Meu Histórico</h2>
                    <p>Seus agendamentos</p>
                </div>
                <div class="info-card">
                    <p style="text-align: center; color: var(--text-muted);">
                        Digite seu WhatsApp no formulário de agendamento para salvar seu histórico.
                    </p>
                </div>
            `;
        }
        
        if (history.length === 0) {
            return `
                <div class="menu-section-header">
                    <h2>Meu Histórico</h2>
                    <p>Seus agendamentos</p>
                </div>
                <div class="info-card">
                    <p style="text-align: center; color: var(--text-muted);">
                        Você ainda não tem agendamentos.<br>Faça seu primeiro agendamento!
                    </p>
                </div>
                <button class="menu-action-btn" onclick="Navigation.goToNewSchedule()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5V19M5 12H19"/>
                    </svg>
                    Novo Agendamento
                </button>
            `;
        }
        
        const historyHtml = history.map((item, i) => Components.historyCard(item, i)).join('');
        
        return `
            <div class="menu-section-header">
                <h2>Meu Histórico</h2>
                <p>Últimos ${history.length} agendamento(s) encontrado(s)</p>
            </div>
            <div class="history-list">${historyHtml}</div>
        `;
    },

    getListaEsperaContent() {
        const servicesOptions = appData.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        
        return `
            <div class="menu-section-header">
                <h2>Lista de Espera</h2>
                <p>Seja notificado quando houver vaga</p>
            </div>
            <div class="info-card">
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                    Não achou um horário disponível?<br>Entre na lista de espera que avisaremos quando houver disponibilidade.
                </p>
                <div class="form-group">
                    <label for="waitlistService">Serviço desejado</label>
                    <select id="waitlistService" class="waitlist-select">
                        <option value="">Selecione...</option>
                        ${servicesOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="waitlistDate">Data preferida</label>
                    <input type="date" id="waitlistDate" class="waitlist-input">
                </div>
                <div class="form-group">
                    <label for="waitlistPhone">Seu WhatsApp</label>
                    <input type="tel" id="waitlistPhone" placeholder="(11) 99999-9999" class="waitlist-input">
                </div>
                <button class="menu-action-btn" onclick="Waitlist.submit()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    Entrar na Lista de Espera
                </button>
            </div>
        `;
    },

    goToNewSchedule() {
        Modals.closeSection();
        DOM.get('step1')?.scrollIntoView({ behavior: 'smooth' });
    }
};

export { Navigation };
