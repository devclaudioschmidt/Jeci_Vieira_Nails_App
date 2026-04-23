const { readFirebase, writeFirebase, deleteFirebase, verifyAuth } = require('../utils/helpers');

async function saveCliente({ uid, nome, email, telefone }) {
    await writeFirebase(`clientes/${uid}`, {
        nome: nome || '',
        email: email,
        telefone: telefone || '',
        createdAt: new Date().toISOString()
    });
    return { sucesso: true };
}

async function getCliente(uid, req) {
    const decodedToken = await verifyAuth(req);
    if (decodedToken && decodedToken.uid !== uid) {
        return { sucesso: false, erro: 'Acesso negado' };
    }
    const clienteData = await readFirebase(`clientes/${uid}`);
    if (clienteData) {
        return clienteData;
    }
    return { nome: '', email: '', telefone: '' };
}

async function updateCliente({ uid, nome, telefone, email }, req) {
    const decodedToken = await verifyAuth(req);
    if (decodedToken && decodedToken.uid !== uid) {
        return { sucesso: false, erro: 'Acesso negado' };
    }
    
    const updateData = {
        nome: nome || '',
        telefone: telefone || '',
        updatedAt: new Date().toISOString()
    };
    
    if (email) {
        updateData.email = email;
    }
    
    await writeFirebase(`clientes/${uid}`, updateData, 'PATCH');
    return { sucesso: true };
}

async function excluirCliente(uid) {
    await deleteFirebase(`clientes/${uid}`);
    await deleteFirebase(`tokens/${uid}`);
    return { sucesso: true };
}

async function getSalao() {
    const salaoData = await readFirebase('salao');
    if (salaoData) {
        return salaoData;
    }
    return {
        nome: 'Jeci Vieira Nails & Podologia',
        telefone: '',
        instagram: '',
        aniversario: '',
        fotoPerfil: ''
    };
}

async function updateSalao({ nome, telefone, instagram, aniversario, fotoPerfil }) {
    await writeFirebase('salao', {
        nome: nome || 'Jeci Vieira Nails & Podologia',
        telefone: telefone || '',
        instagram: instagram || '',
        aniversario: aniversario || '',
        fotoPerfil: fotoPerfil || '',
        updatedAt: new Date().toISOString()
    });
    return { sucesso: true };
}

async function getBloqueios() {
    const data = await readFirebase('bloqueios') || {};
    const lista = [];
    Object.keys(data).forEach(key => {
        lista.push({ id: key, ...data[key] });
    });
    return lista;
}

async function bloquearHorario({ data, hora_inicio, hora_fim, motivo }) {
    const newId = require('../utils/helpers').generateId();
    await writeFirebase(`bloqueios/${newId}`, {
        data: data,
        hora_inicio: hora_inicio,
        hora_fim: hora_fim,
        motivo: motivo || '',
        criado_em: new Date().toISOString()
    });
    return { sucesso: true };
}

async function desbloquearHorario(id) {
    await deleteFirebase(`bloqueios/${id}`);
    return { sucesso: true };
}

async function saveFCMToken({ uid, token, role }) {
    await writeFirebase(`tokens/${uid}`, {
        uid: uid,
        token: token,
        role: role || 'cliente',
        timestamp: Date.now()
    });
    return { sucesso: true };
}

async function removeFCMToken(uid) {
    await deleteFirebase(`tokens/${uid}`);
    return { sucesso: true };
}

module.exports = {
    saveCliente,
    getCliente,
    updateCliente,
    excluirCliente,
    getSalao,
    updateSalao,
    getBloqueios,
    bloquearHorario,
    desbloquearHorario,
    saveFCMToken,
    removeFCMToken
};