// Firebase Scheduled Functions - Lembretes de Agendamento
const functions = require('firebase-functions');
const https = require('https');

const DATABASE_URL = 'app-jeci-vieira-nails-default-rtdb.firebaseio.com';

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

function sendFCMNotification(token, title, body, data = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      token: token,
      notification: {
        title: title,
        body: body
      },
      data: data,
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: '/assets/icon-notification.png',
          badge: '/assets/icon-badge.png'
        },
        fcm_options: {
          link: '/cliente.html'
        }
      }
    });

    const options = {
      hostname: 'fcm.googleapis.com',
      path: '/v1/projects/app-jeci-vieira-nails/messages:send',
      method: 'POST',
      headers: {
        'Authorization': 'key=AAAA9V7n9lU:APA91bGZ0Y1xT1vVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqzvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqzvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqzvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqzvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqZvVqzvVqZm0g',
        'Content-Type': 'application/json'
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
    req.write(payload);
    req.end();
  });
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

exports.sendReminder8Hours = functions.pubsub
  .schedule('every 60 minutes')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('[Reminder] Verificando agendamentos para lembrete...');
    
    const now = new Date();
    const nowBrt = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    
    const eightHoursLater = new Date(nowBrt.getTime() + (8 * 60 * 60 * 1000));
    
    const targetDateStr = eightHoursLater.toISOString().split('T')[0];
    const targetHour = eightHoursLater.getUTCHours();
    const targetMinute = eightHoursLater.getUTCMinutes();
    const targetTimeStr = (targetHour < 10 ? '0' + targetHour : targetHour) + ':' + (targetMinute < 10 ? '0' + targetMinute : targetMinute);
    
    console.log(`[Reminder] Procurando agendamentos em ${targetDateStr} às ${targetTimeStr}`);
    
    try {
      const agendamentos = await readFirebase('agendamentos') || {};
      const tokens = await readFirebase('tokens') || {};
      
      let sentCount = 0;
      
      for (const key in agendamentos) {
        const app = agendamentos[key];
        const status = String(app.status || '').toLowerCase().trim();
        
        if (status !== 'confirmado') continue;
        
        const appData = normalizeDate(app.data);
        const appTime = normalizeTime(app.hora);
        
        if (appData !== targetDateStr) continue;
        if (appTime !== targetTimeStr) continue;
        
        const clienteUid = app.clienteUid;
        if (!clienteUid || !tokens[clienteUid]) continue;
        
        const tokenEntry = tokens[clienteUid];
        const token = tokenEntry.token;
        
        if (!token) continue;
        
        const formattedDate = appData.split('-').reverse().join('/');
        
        await sendFCMNotification(
          token,
          '⏰ Lembrete: Seu atendimento é em 8 horas!',
          `Você tem agendamento de ${app.servico} às ${app.hora} no dia ${formattedDate}. Acesse para ver detalhes.`,
          { url: '/cliente.html', action: 'reminder', data: appData, hora: appTime }
        );
        
        sentCount++;
        console.log(`[Reminder] Lembrete enviado para ${app.cliente}`);
      }
      
      console.log(`[Reminder] ${sentCount} lembretes enviados`);
      
    } catch (error) {
      console.error('[Reminder] Erro:', error);
    }
    
    return null;
  });

exports.sendDailyCheck = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('[DailyCheck] Verificando agendamentos de amanhă...');
    
    const now = new Date();
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    console.log(`[DailyCheck] Verificando agendamentos para ${tomorrowDate}`);
    
    return null;
  });