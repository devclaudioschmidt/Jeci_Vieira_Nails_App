const { readFirebase, writeFirebase, deleteFirebase, generateId, normalizeDate, normalizeTime } = require('../utils/helpers');

const HORARIOS_SEMANA = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
const HORARIOS_SABADO = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];

async function getServicos() {
    const data = await readFirebase('servicos');
    const lista = [];
    if (data) {
        Object.keys(data).forEach(key => {
            lista.push({ id: key, ...data[key] });
        });
    }
    return lista;
}

async function salvarServico({ id, category, name, description, price, duration, icon }) {
    await writeFirebase(`servicos/${id}`, {
        category: category || '',
        name: name,
        description: description || '',
        price: parseFloat(price) || 0,
        duration: parseInt(duration) || 30,
        icon: icon || 'circle'
    });
    return { sucesso: true };
}

async function excluirServico(id) {
    await deleteFirebase(`servicos/${id}`);
    return { sucesso: true };
}

async function getHorarios(dataQuery, duracao = 30) {
    const dataNormalized = normalizeDate(dataQuery);
    const dateObj = new Date(dataQuery + 'T12:00:00');
    const diaSemana = dateObj.getDay();
    
    let todosHorarios = [];
    let horarioFechamento = 21 * 60;
    
    if (diaSemana >= 1 && diaSemana <= 5) {
        todosHorarios = HORARIOS_SEMANA;
        horarioFechamento = 21 * 60;
    } else if (diaSemana === 6) {
        todosHorarios = HORARIOS_SABADO;
        horarioFechamento = 12 * 60;
    } else {
        return { data: dataNormalized, horarios: [] };
    }

    const agendamentosData = await readFirebase('agendamentos') || {};
    const agendamentos = [];
    
    Object.keys(agendamentosData).forEach(key => {
        const app = agendamentosData[key];
        const status = String(app.status || '').toLowerCase().trim();
        
        if (normalizeDate(app.data) === dataNormalized && status === 'confirmado') {
            const horaNormalized = normalizeTime(app.hora);
            if (horaNormalized) {
                const duracaoExistente = parseInt(app.duracao) || 30;
                const parts = horaNormalized.split(':');
                const startMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                agendamentos.push({ start: startMin, end: startMin + duracaoExistente });
            }
        }
    });

    const bloqueiosData = await readFirebase('bloqueios') || {};
    Object.keys(bloqueiosData).forEach(key => {
        const block = bloqueiosData[key];
        if (normalizeDate(block.data) === dataNormalized) {
            const horaInicio = normalizeTime(block.hora_inicio);
            const horaFim = normalizeTime(block.hora_fim);
            if (horaInicio && horaFim) {
                const partsInicio = horaInicio.split(':');
                const partsFim = horaFim.split(':');
                const startMin = parseInt(partsInicio[0]) * 60 + parseInt(partsInicio[1]);
                const endMin = parseInt(partsFim[0]) * 60 + parseInt(partsFim[1]);
                agendamentos.push({ start: startMin, end: endMin });
            }
        }
    });

    const now = new Date();
    const nowBrt = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const hojeBrStr = nowBrt.toISOString().split('T')[0];
    let currentMinutes = -1;
    
    if (hojeBrStr === dataNormalized) {
        currentMinutes = nowBrt.getUTCHours() * 60 + nowBrt.getUTCMinutes();
    }

    const duracaoInt = parseInt(duracao) || 30;
    
    const disponiveis = todosHorarios.filter(h => {
        const parts = h.split(':');
        const hMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        const hEnd = hMin + duracaoInt;
        
        if (hMin <= currentMinutes) return false;
        if (hMin >= horarioFechamento) return false;
        
        for (const exist of agendamentos) {
            if (!(hEnd <= exist.start || hMin >= exist.end)) {
                return false;
            }
        }
        
        return true;
    });

    return { data: dataNormalized, horarios: disponiveis };
}

async function agendar({ data, hora, servico, cliente, telefone, duracao }) {
    const dataNormalized = normalizeDate(data);
    const horaNormalized = normalizeTime(hora);
    const duracaoInt = parseInt(duracao) || 30;

    const agendamentos = await readFirebase('agendamentos') || {};
    
    for (const key in agendamentos) {
        const app = agendamentos[key];
        const status = String(app.status || '').toLowerCase().trim();
        
        if (normalizeDate(app.data) === dataNormalized && status === 'confirmado') {
            const horaExistente = normalizeTime(app.hora);
            const durExistente = parseInt(app.duracao) || 30;
            
            const existParts = horaExistente.split(':');
            const existStartMin = parseInt(existParts[0]) * 60 + parseInt(existParts[1]);
            const existEndMin = existStartMin + durExistente;
            
            const novoParts = horaNormalized.split(':');
            const novoStartMin = parseInt(novoParts[0]) * 60 + parseInt(novoParts[1]);
            const novoEndMin = novoStartMin + duracaoInt;
            
            if (!(novoEndMin <= existStartMin || novoStartMin >= existEndMin)) {
                return { sucesso: false, erro: 'Horário conflita com agendamento existente!' };
            }
        }
    }

    const newId = generateId();
    await writeFirebase(`agendamentos/${newId}`, {
        data: data,
        hora: hora,
        servico: servico,
        cliente: cliente,
        telefone: telefone || '',
        status: 'confirmado',
        duracao: duracaoInt,
        criado_em: new Date().toISOString()
    });

    return { sucesso: true };
}

async function agendarCliente({ uid, data, hora, servico, telefone, duracao, clienteNome }) {
    const dataNormalized = normalizeDate(data);
    const horaNormalized = normalizeTime(hora);
    const duracaoInt = parseInt(duracao) || 30;
    let nomeCliente = clienteNome;

    if (!nomeCliente) {
        const clienteData = await readFirebase(`clientes/${uid}`);
        nomeCliente = (clienteData && clienteData.nome) ? clienteData.nome : 'Cliente';
    }

    const agendamentos = await readFirebase('agendamentos') || {};
    
    for (const key in agendamentos) {
        const app = agendamentos[key];
        const status = String(app.status || '').toLowerCase().trim();
        
        if (normalizeDate(app.data) === dataNormalized && status === 'confirmado') {
            const horaExistente = normalizeTime(app.hora);
            const durExistente = parseInt(app.duracao) || 30;
            
            const existParts = horaExistente.split(':');
            const existStartMin = parseInt(existParts[0]) * 60 + parseInt(existParts[1]);
            const existEndMin = existStartMin + durExistente;
            
            const novoParts = horaNormalized.split(':');
            const novoStartMin = parseInt(novoParts[0]) * 60 + parseInt(novoParts[1]);
            const novoEndMin = novoStartMin + duracaoInt;
            
            if (!(novoEndMin <= existStartMin || novoStartMin >= existEndMin)) {
                return { sucesso: false, erro: 'Horário conflita com agendamento existente!' };
            }
        }
    }

    const newId = generateId();
    await writeFirebase(`agendamentos/${newId}`, {
        data: data,
        hora: hora,
        servico: servico,
        cliente: nomeCliente,
        telefone: telefone || '',
        clienteUid: uid,
        status: 'confirmado',
        duracao: duracaoInt,
        criado_em: new Date().toISOString()
    });

    return { sucesso: true };
}

async function getAgendamentos(uid = null) {
    let data = await readFirebase('agendamentos') || {};
    
    if (uid) {
        const filtered = {};
        Object.keys(data).forEach(key => {
            if (data[key].clienteUid === uid) {
                filtered[key] = data[key];
            }
        });
        data = filtered;
    }
    
    const lista = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    
    lista.sort((a, b) => {
        const dateA = new Date(a.data + 'T' + (a.hora || '00:00'));
        const dateB = new Date(b.data + 'T' + (b.hora || '00:00'));
        return dateA - dateB;
    });
    
    return lista;
}

async function editarAgendamento({ originalData, originalTime, data, hora, servico, cliente, telefone, duracao }) {
    const agendamentos = await readFirebase('agendamentos') || {};
    const originalDataNorm = normalizeDate(originalData);
    const originalTimeNorm = normalizeTime(originalTime);
    const newTimeNorm = normalizeTime(hora);
    const duracaoInt = parseInt(duracao) || 30;

    let foundKey = null;
    for (const key in agendamentos) {
        const app = agendamentos[key];
        const status = String(app.status || '').toLowerCase().trim();
        
        if (normalizeDate(app.data) === originalDataNorm && normalizeTime(app.hora) === originalTimeNorm && status === 'confirmado') {
            foundKey = key;
            break;
        }
    }

    if (!foundKey) {
        return { sucesso: false, erro: 'Agendamento não encontrado ou já cancelado' };
    }

    const isSameSlot = originalDataNorm === normalizeDate(data) && originalTimeNorm === newTimeNorm;
    if (!isSameSlot) {
        for (const key in agendamentos) {
            if (key === foundKey) continue;
            const app = agendamentos[key];
            const status = String(app.status || '').toLowerCase().trim();
            
            if (normalizeDate(app.data) === normalizeDate(data) && status === 'confirmado') {
                const horaExistente = normalizeTime(app.hora);
                const durExistente = parseInt(app.duracao) || 30;
                
                const existParts = horaExistente.split(':');
                const existStartMin = parseInt(existParts[0]) * 60 + parseInt(existParts[1]);
                const existEndMin = existStartMin + durExistente;
                
                const novoParts = newTimeNorm.split(':');
                const novoStartMin = parseInt(novoParts[0]) * 60 + parseInt(novoParts[1]);
                const novoEndMin = novoStartMin + duracaoInt;
                
                if (!(novoEndMin <= existStartMin || novoStartMin >= existEndMin)) {
                    return { sucesso: false, erro: 'Horário conflita com agendamento existente!' };
                }
            }
        }
    }

    await writeFirebase(`agendamentos/${foundKey}`, {
        data: data,
        hora: hora,
        servico: servico,
        cliente: cliente || agendamentos[foundKey].cliente,
        telefone: telefone || '',
        duracao: duracaoInt
    });

    return { sucesso: true };
}

async function cancelarAgendamento(data, hora) {
    const dataNormalized = normalizeDate(data);
    const horaNormalized = normalizeTime(hora);
    
    const agendamentos = await readFirebase('agendamentos') || {};
    
    for (const key in agendamentos) {
        const app = agendamentos[key];
        if (normalizeDate(app.data) === dataNormalized && normalizeTime(app.hora) === horaNormalized) {
            await deleteFirebase(`agendamentos/${key}`);
            return { sucesso: true };
        }
    }
    
    return { sucesso: false, erro: 'Agendamento não encontrado' };
}

async function cancelarAgendamentoPorId(id) {
    await deleteFirebase(`agendamentos/${id}`);
    return { sucesso: true };
}

async function getClientAppointments(uid = null, clienteNome = null) {
    const allAgendamentos = await readFirebase('agendamentos') || {};
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const lista = [];
    Object.keys(allAgendamentos).forEach(key => {
        const app = allAgendamentos[key];
        const matchesUid = app.clienteUid === uid;
        const matchesNome = clienteNome && app.cliente && app.cliente.toLowerCase().trim() === clienteNome.toLowerCase().trim();
        
        if (matchesUid || matchesNome) {
            const appDate = new Date(app.data);
            if (appDate >= ninetyDaysAgo) {
                lista.push({ id: key, ...app });
            }
        }
    });
    
    lista.sort((a, b) => {
        const dateA = new Date(a.data + 'T' + (a.hora || '00:00'));
        const dateB = new Date(b.data + 'T' + (b.hora || '00:00'));
        return dateB - dateA;
    });
    
    return lista;
}

module.exports = {
    getServicos,
    salvarServico,
    excluirServico,
    getHorarios,
    agendar,
    agendarCliente,
    getAgendamentos,
    editarAgendamento,
    cancelarAgendamento,
    cancelarAgendamentoPorId,
    getClientAppointments
};