// Firebase Cloud Functions API - Jeci Vieira Nails App
const functions = require('firebase-functions');
const https = require('https');

const DATABASE_URL = 'app-jeci-vieira-nails-default-rtdb.firebaseio.com';
const PROJECT_ID = 'app-jeci-vieira-nails';

// Função para enviar notificação usando Firebase Admin SDK (incluído automaticamente nas Functions)
const admin = require('firebase-admin');
admin.initializeApp();

async function sendFCMNotification(token, title, body, data = {}) {
  try {
    const message = {
      token: token,
      notification: { title: title, body: body },
      data: Object.keys(data).length > 0 ? data : undefined,
      webpush: {
        notification: { 
          title: title, 
          body: body, 
          icon: '/assets/icon-notification.png'
        },
        fcm_options: { link: data.url || '/cliente.html' }
      }
    };
    
    const result = await admin.messaging().send(message);
    console.log('[FCM] Notificação enviada:', result);
    return result;
  } catch (error) {
    console.error('[FCM] Erro ao enviar:', error);
    return null;
  }
}

async function sendNotificationToRole(role, title, body, data = {}) {
  const tokensData = await readFirebase('tokens') || {};
  const promises = [];
  
  Object.keys(tokensData).forEach(key => {
    const tokenEntry = tokensData[key];
    if (tokenEntry.role === role && tokenEntry.token) {
      promises.push(sendFCMNotification(tokenEntry.token, title, body, data));
    }
  });
  
  await Promise.all(promises);
}

function normalizeDate(data) {
  if (!data) return null;
  if (typeof data === 'string') {
    data = data.trim();
    if (data.indexOf('/') > -1) {
      const parts = data.split(' ')[0].split('/');
      if (parts.length === 3) {
        if (parts[0].length === 2 && parts[2].length === 4) {
          return parts[2] + '-' + parts[1] + '-' + parts[0];
        }
        return parts[0] + '-' + parts[1] + '-' + parts[2];
      }
    }
    if (data.indexOf(' ') > -1) return data.split(' ')[0];
    if (data.indexOf('T') > -1) return data.split('T')[0];
    return data;
  }
  return String(data).split(' ')[0];
}

function normalizeTime(hora) {
  if (!hora) return null;
  hora = String(hora).trim();
  if (hora.indexOf(':') === -1) {
    const h = parseInt(hora, 10);
    return (h < 10 ? '0' + h : h) + ':00';
  }
  const parts = hora.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function sendResponse(res, statusCode, data) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Content-Type', 'application/json');
  res.status(statusCode).send(JSON.stringify(data));
}

function readFirebase(path) {
  return new Promise((resolve, reject) => {
    const url = `https://${DATABASE_URL}/${path}.json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

function writeFirebase(path, data, method = 'PUT') {
  return new Promise((resolve, reject) => {
    const url = `https://${DATABASE_URL}/${path}.json`;
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: DATABASE_URL,
      path: `/${path}.json`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function deleteFirebase(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DATABASE_URL,
      path: `/${path}.json`,
      method: 'DELETE'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.end();
  });
}

exports.api = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendResponse(res, 204, '');
  }

  const action = req.query.action || req.body.action;

  try {
    switch (action) {
      case 'getServicos': {
        const data = await readFirebase('servicos');
        const lista = [];
        if (data) {
          Object.keys(data).forEach(key => {
            lista.push({ id: key, ...data[key] });
          });
        }
        return sendResponse(res, 200, lista);
      }
      
      case 'salvarServico': {
        const { id, category, name, description, price, duration, icon } = req.body;
        if (!id || !name) {
          return sendResponse(res, 400, { sucesso: false, erro: 'ID e nome são obrigatórios' });
        }
        await writeFirebase(`servicos/${id}`, {
          category: category || '',
          name: name,
          description: description || '',
          price: parseFloat(price) || 0,
          duration: parseInt(duration) || 30,
          icon: icon || 'circle'
        });
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'excluirServico': {
        const id = req.query.id || req.body.id;
        if (!id) {
          return sendResponse(res, 400, { sucesso: false, erro: 'ID é obrigatório' });
        }
        await deleteFirebase(`servicos/${id}`);
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'getHorarios': {
        const data = req.query.data || req.body.data;
        const duracao = parseInt(req.query.duracao || req.body.duracao) || 30;
        
        if (!data) {
          return sendResponse(res, 200, { data: null, horarios: [] });
        }
        
        const dataNormalized = normalizeDate(data);
        const dateObj = new Date(data + 'T12:00:00');
        const diaSemana = dateObj.getDay();
        let todosHorarios = [];
        let horarioFechamento = 21 * 60;
        
        if (diaSemana >= 1 && diaSemana <= 5) {
          todosHorarios = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
          horarioFechamento = 21 * 60;
        } else if (diaSemana === 6) {
          todosHorarios = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
          horarioFechamento = 12 * 60;
        }
        
        const agendamentosData = await readFirebase('agendamentos') || {};
        const agendamentos = [];
        
        Object.keys(agendamentosData).forEach(key => {
          const app = agendamentosData[key];
          const dataNaPlanilha = normalizeDate(app.data);
          const status = String(app.status || '').toLowerCase().trim();
          
          if (dataNaPlanilha === dataNormalized && status === 'confirmado') {
            const horaNormalized = normalizeTime(app.hora);
            const duracaoExistente = parseInt(app.duracao) || 30;
            
            if (horaNormalized) {
              const parts = horaNormalized.split(':');
              const startMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
              const endMin = startMin + duracaoExistente;
              agendamentos.push({ start: startMin, end: endMin, duracao: duracaoExistente });
            }
          }
        });
        
        const bloqueiosData = await readFirebase('bloqueios') || {};
        
        Object.keys(bloqueiosData).forEach(key => {
          const block = bloqueiosData[key];
          const dataBloqueio = normalizeDate(block.data);
          const horaInicio = normalizeTime(block.hora_inicio);
          const horaFim = normalizeTime(block.hora_fim);
          
          if (dataBloqueio === dataNormalized && horaInicio && horaFim) {
            const partsInicio = horaInicio.split(':');
            const partsFim = horaFim.split(':');
            const startMin = parseInt(partsInicio[0]) * 60 + parseInt(partsInicio[1]);
            const endMin = parseInt(partsFim[0]) * 60 + parseInt(partsFim[1]);
            agendamentos.push({ start: startMin, end: endMin });
          }
        });
        
        const ultimoHorarioMin = horarioFechamento - duracao;
        
        const now = new Date();
        const nowBrt = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const hojeBrStr = nowBrt.toISOString().split('T')[0];
        let currentMinutes = -1;
        
        if (hojeBrStr === dataNormalized) {
          currentMinutes = nowBrt.getUTCHours() * 60 + nowBrt.getUTCMinutes();
        }
        
        const disponiveis = todosHorarios.filter(h => {
          const parts = h.split(':');
          const hMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          const hEnd = hMin + duracao;
          
          if (hMin <= currentMinutes) return false;
          if (hMin > ultimoHorarioMin) return false;
          
          for (const exist of agendamentos) {
            if (!(hEnd <= exist.start || hMin >= exist.end)) {
              return false;
            }
          }
          
          return true;
        });
        
        return sendResponse(res, 200, { data: data, horarios: disponiveis });
      }
      
      case 'agendar': {
        const { data, hora, servico, cliente, telefone, duracao } = req.body;
        
        if (!data || !hora || !servico || !cliente) {
          return sendResponse(res, 400, { sucesso: false, erro: 'Parâmetros incompletos' });
        }
        
        const dataNormalized = normalizeDate(data);
        const horaNormalized = normalizeTime(hora);
        const duracaoInt = parseInt(duracao) || 30;
        
        const agendamentos = await readFirebase('agendamentos') || {};
        
        Object.keys(agendamentos).forEach(key => {
          const app = agendamentos[key];
          const dataNaPlanilha = normalizeDate(app.data);
          const status = String(app.status || '').toLowerCase().trim();
          
          if (dataNaPlanilha === dataNormalized && status === 'confirmado') {
            const horaExistente = normalizeTime(app.hora);
            const durExistente = parseInt(app.duracao) || 30;
            
            const existParts = horaExistente.split(':');
            const existStartMin = parseInt(existParts[0]) * 60 + parseInt(existParts[1]);
            const existEndMin = existStartMin + durExistente;
            
            const novoParts = horaNormalized.split(':');
            const novoStartMin = parseInt(novoParts[0]) * 60 + parseInt(novoParts[1]);
            const novoEndMin = novoStartMin + duracaoInt;
            
            if (!(novoEndMin <= existStartMin || novoStartMin >= existEndMin)) {
              return sendResponse(res, 400, { sucesso: false, erro: 'Horário conflita com agendamento existente!' });
            }
          }
        });
        
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
        
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'getAgendamentos': {
        const data = await readFirebase('agendamentos') || {};
        const lista = [];
        
        Object.keys(data).forEach(key => {
          lista.push({ id: key, ...data[key] });
        });
        
        lista.sort((a, b) => {
          const dateA = new Date(a.data + 'T' + (a.hora || '00:00'));
          const dateB = new Date(b.data + 'T' + (b.hora || '00:00'));
          return dateA - dateB;
        });
        
        return sendResponse(res, 200, lista);
      }
      
      case 'editarAgendamento': {
        const { originalData, originalTime, data, hora, servico, cliente, telefone, duracao } = req.body;
        
        const agendamentos = await readFirebase('agendamentos') || {};
        const originalDataNorm = normalizeDate(originalData);
        const originalTimeNorm = normalizeTime(originalTime);
        const newDataNorm = normalizeDate(data);
        const newTimeNorm = normalizeTime(hora);
        const duracaoInt = parseInt(duracao) || 30;
        
        let foundKey = null;
        let foundClientName = null;
        for (const key in agendamentos) {
          const app = agendamentos[key];
          const dataNaPlanilha = normalizeDate(app.data);
          const horaNaPlanilha = normalizeTime(app.hora);
          const status = String(app.status || '').toLowerCase().trim();
          
          if (dataNaPlanilha === originalDataNorm && horaNaPlanilha === originalTimeNorm && status === 'confirmado') {
            foundKey = key;
            foundClientName = app.cliente;
            break;
          }
        }
        
        if (!foundKey) {
          return sendResponse(res, 400, { sucesso: false, erro: 'Agendamento não encontrado ou já cancelado' });
        }
        
        // Verifica conflitos de horário (mesma lógica do agendarCliente)
        const isSameSlot = originalDataNorm === newDataNorm && originalTimeNorm === newTimeNorm;
        if (!isSameSlot) {
          const hasConflict = false;
          for (const key in agendamentos) {
            const app = agendamentos[key];
            if (key === foundKey) continue;
            
            const dataNaPlanilha = normalizeDate(app.data);
            const status = String(app.status || '').toLowerCase().trim();
            
            if (dataNaPlanilha === newDataNorm && status === 'confirmado') {
              const horaExistente = normalizeTime(app.hora);
              const durExistente = parseInt(app.duracao) || 30;
              
              const existParts = horaExistente.split(':');
              const existStartMin = parseInt(existParts[0]) * 60 + parseInt(existParts[1]);
              const existEndMin = existStartMin + durExistente;
              
              const novoParts = newTimeNorm.split(':');
              const novoStartMin = parseInt(novoParts[0]) * 60 + parseInt(novoParts[1]);
              const novoEndMin = novoStartMin + duracaoInt;
              
              // Verifica sobreposição: novo início < existente fim E novo fim > existente início
              if (!(novoEndMin <= existStartMin || novoStartMin >= existEndMin)) {
                return sendResponse(res, 400, { sucesso: false, erro: 'Horário conflita com agendamento existente!' });
              }
            }
          }
        }
        
        await writeFirebase(`agendamentos/${foundKey}`, {
          data: data,
          hora: hora,
          servico: servico,
          cliente: cliente || foundClientName,
          telefone: telefone || '',
          duracao: duracaoInt
        });
        
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'bloquearHorario': {
        const data = req.body.data || req.query.data;
        const hora_inicio = normalizeTime(req.body.hora_inicio || req.body.horaInicio || req.query.hora_inicio);
        const hora_fim = normalizeTime(req.body.hora_fim || req.body.horaFim || req.query.hora_fim);
        const motivo = req.body.motivo || '';
        
        if (!data || !hora_inicio || !hora_fim) {
          return sendResponse(res, 400, { sucesso: false, erro: 'Parâmetros incompletos' });
        }
        
        const newId = generateId();
        await writeFirebase(`bloqueios/${newId}`, {
          data: data,
          hora_inicio: hora_inicio,
          hora_fim: hora_fim,
          motivo: motivo,
          criado_em: new Date().toISOString()
        });
        
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'desbloquearHorario': {
        const id = req.query.id || req.body.id;
        
        if (!id) {
          return sendResponse(res, 400, { sucesso: false, erro: 'ID é obrigatório' });
        }
        
        await deleteFirebase(`bloqueios/${id}`);
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'getBloqueios': {
        const data = await readFirebase('bloqueios') || {};
        const lista = [];
        
        Object.keys(data).forEach(key => {
          lista.push({ id: key, ...data[key] });
        });
        
        return sendResponse(res, 200, lista);
      }
      
      case 'getSalao': {
        const salaoData = await readFirebase('salao');
        if (salaoData) {
          return sendResponse(res, 200, salaoData);
        }
        return sendResponse(res, 200, {
          nome: 'Jeci Vieira Nails & Podologia',
          telefone: '',
          instagram: '',
          aniversario: '',
          fotoPerfil: ''
        });
      }
      
      case 'updateSalao': {
        const { nome, telefone, instagram, aniversario, fotoPerfil } = req.body;
        await writeFirebase('salao', {
          nome: nome || 'Jeci Vieira Nails & Podologia',
          telefone: telefone || '',
          instagram: instagram || '',
          aniversario: aniversario || '',
          fotoPerfil: fotoPerfil || '',
          updatedAt: new Date().toISOString()
        });
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'saveCliente': {
        const { uid, nome, email, telefone } = req.body;
        if (!uid || !email) {
          return sendResponse(res, 400, { sucesso: false, erro: 'UID e email são obrigatórios' });
        }
        await writeFirebase(`clientes/${uid}`, {
          nome: nome || '',
          email: email,
          telefone: telefone || '',
          createdAt: new Date().toISOString()
        });
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'getCliente': {
        const uid = req.query.uid || req.body.uid;
        if (!uid) {
          return sendResponse(res, 400, { sucesso: false, erro: 'UID é obrigatório' });
        }
        const clienteData = await readFirebase(`clientes/${uid}`);
        if (clienteData) {
          return sendResponse(res, 200, clienteData);
        }
        return sendResponse(res, 200, { nome: '', email: '', telefone: '' });
      }
      
      case 'updateCliente': {
        const { uid, nome, telefone, email } = req.body;
        if (!uid) {
          return sendResponse(res, 400, { sucesso: false, erro: 'UID é obrigatório' });
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
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'getSalaoPublico': {
        const salaoData = await readFirebase('salao') || {};
        return sendResponse(res, 200, {
          telefone: salaoData.telefone || '',
          instagram: salaoData.instagram || '',
          nome: salaoData.nome || 'Jeci Vieira Nails'
        });
      }
      
      case 'getClientAppointments': {
        const uid = req.query.uid || req.body.uid;
        if (!uid) {
          return sendResponse(res, 200, []);
        }
        const allAgendamentos = await readFirebase('agendamentos') || {};
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const lista = [];
        Object.keys(allAgendamentos).forEach(key => {
          const app = allAgendamentos[key];
          if (app.clienteUid === uid) {
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
        
        return sendResponse(res, 200, lista);
      }
      
      case 'agendarCliente': {
        const { uid, data, hora, servico, telefone, duracao } = req.body;
        
        if (!uid || !data || !hora || !servico) {
          return sendResponse(res, 400, { sucesso: false, erro: 'Parâmetros incompletos' });
        }
        
        const dataNormalized = normalizeDate(data);
        const horaNormalized = normalizeTime(hora);
        const duracaoInt = parseInt(duracao) || 30;
        const clienteData = await readFirebase(`clientes/${uid}`);
        const clienteNome = (clienteData && clienteData.nome) ? clienteData.nome : 'Cliente';
        const clienteTelefoneDB = (clienteData && clienteData.telefone) ? clienteData.telefone : '';
        
        const agendamentos = await readFirebase('agendamentos') || {};
        
        Object.keys(agendamentos).forEach(key => {
          const app = agendamentos[key];
          const dataNaPlanilha = normalizeDate(app.data);
          const status = String(app.status || '').toLowerCase().trim();
          
          if (dataNaPlanilha === dataNormalized && status === 'confirmado') {
            const horaExistente = normalizeTime(app.hora);
            const durExistente = parseInt(app.duracao) || 30;
            
            const existParts = horaExistente.split(':');
            const existStartMin = parseInt(existParts[0]) * 60 + parseInt(existParts[1]);
            const existEndMin = existStartMin + durExistente;
            
            const novoParts = horaNormalized.split(':');
            const novoStartMin = parseInt(novoParts[0]) * 60 + parseInt(novoParts[1]);
            const novoEndMin = novoStartMin + duracaoInt;
            
            if (!(novoEndMin <= existStartMin || novoStartMin >= existEndMin)) {
              return sendResponse(res, 400, { sucesso: false, erro: 'Horário conflita com agendamento existente!' });
            }
          }
        });
        
        const newId = generateId();
        await writeFirebase(`agendamentos/${newId}`, {
          data: data,
          hora: hora,
          servico: servico,
          cliente: clienteNome,
          telefone: telefone || clienteTelefoneDB || '',
          clienteUid: uid,
          status: 'confirmado',
          duracao: duracaoInt,
          criado_em: new Date().toISOString()
        });
        
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'cancelarAgendamentoPorId': {
        const id = req.body.id || req.query.id;
        if (!id) {
          return sendResponse(res, 400, { sucesso: false, erro: 'ID é obrigatório' });
        }
        await deleteFirebase(`agendamentos/${id}`);
        return sendResponse(res, 200, { sucesso: true });
      }

      case 'cancelarAgendamento': {
        const { data, hora } = req.body;
        
        const dataNormalized = normalizeDate(data);
        const horaNormalized = normalizeTime(hora);
        
        const agendamentos = await readFirebase('agendamentos') || {};
        
        let foundKey = null;
        Object.keys(agendamentos).forEach(key => {
          const app = agendamentos[key];
          const dataNaPlanilha = normalizeDate(app.data);
          const horaNaPlanilha = normalizeTime(app.hora);
          
          if (dataNaPlanilha === dataNormalized && horaNaPlanilha === horaNormalized) {
            foundKey = key;
          }
        });
        
        if (!foundKey) {
          return sendResponse(res, 400, { sucesso: false, erro: 'Agendamento não encontrado' });
        }
        
        await deleteFirebase(`agendamentos/${foundKey}`);
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'saveFCMToken': {
        const { uid, token, role } = req.body;
        if (!uid || !token) {
          return sendResponse(res, 400, { sucesso: false, erro: 'UID e token são obrigatórios' });
        }
        await writeFirebase(`tokens/${uid}`, {
          uid: uid,
          token: token,
          role: role || 'cliente',
          timestamp: Date.now()
        });
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'removeFCMToken': {
        const { uid, token } = req.body;
        if (!uid) {
          return sendResponse(res, 400, { sucesso: false, erro: 'UID é obrigatório' });
        }
        await deleteFirebase(`tokens/${uid}`);
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'sendNotification': {
        const { role, title, body, data } = req.body;
        if (!role || !title || !body) {
          return sendResponse(res, 400, { sucesso: false, erro: 'Role, title e body são obrigatórios' });
        }
        await sendNotificationToRole(role, title, body, data || {});
        return sendResponse(res, 200, { sucesso: true });
      }
      
      case 'login': {
        const user = req.body.user || req.query.user;
        const pass = req.body.pass || req.query.pass;
        
        const USER_ADMIN = 'admin';
        const PASS_ADMIN = '1234';
        
        if (user === USER_ADMIN && pass === PASS_ADMIN) {
          const token = Buffer.from(user + ':' + pass).toString('base64');
          return sendResponse(res, 200, { sucesso: true, token: token });
        }
        
        return sendResponse(res, 401, { sucesso: false, erro: 'Usuário ou senha incorretos' });
      }
      
      default:
        return sendResponse(res, 400, { sucesso: false, erro: 'Ação não encontrada' });
    }
  } catch (error) {
    console.error('Error:', error);
    return sendResponse(res, 500, { sucesso: false, erro: error.message });
  }
});
