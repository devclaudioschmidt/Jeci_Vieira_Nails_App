class ApiService {
    constructor() {
        this._baseUrl = 'https://us-central1-app-jeci-vieira-nails.cloudfunctions.net/api';
    }

    async request(action, params = {}, method = 'GET') {
        const url = new URL(this._baseUrl);
        url.searchParams.set('action', action);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (method === 'POST') {
            options.body = new URLSearchParams({ action, ...params });
        }

        try {
            const response = await fetch(url.toString(), options);
            const text = await response.text();
            
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        } catch (error) {
            throw new Error(`API Error [${action}]: ${error.message}`);
        }
    }

    async getServicos() {
        return this.request('getServicos');
    }

    async getHorarios(data, duracao = 30) {
        return this.request('getHorarios', { data, duracao });
    }

    async agendar(dados) {
        return this.request('agendar', {
            data: dados.date,
            hora: dados.time,
            servico: dados.service,
            cliente: dados.name,
            telefone: dados.phone,
            duracao: dados.duration || 30
        }, 'POST');
    }

    async agendarCliente(dados) {
        return this.request('agendarCliente', {
            uid: dados.uid,
            data: dados.date,
            hora: dados.time,
            servico: dados.service,
            telefone: dados.phone,
            duracao: dados.duration || 30,
            clienteNome: dados.name
        }, 'POST');
    }

    async getClientAppointments(uid, clienteNome) {
        const params = { uid };
        if (clienteNome) params.clienteNome = clienteNome;
        return this.request('getClientAppointments', params);
    }

    async cancelarAgendamento(data, hora) {
        return this.request('cancelarAgendamento', { data, hora }, 'POST');
    }

    async getSalao() {
        return this.request('getSalao');
    }

    async getBloqueios(data) {
        return this.request('getBloqueios', { data });
    }
}

const Api = new ApiService();

export { Api };