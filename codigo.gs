// ============================================
// CONFIGURAÇÃO - ID DA SUA PLANILHA
// ============================================
const SS_ID = '1aGmqDTKhjVqDWsZrK78olyjGlh4ECNM6cSn8ZY2TxIg';

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================
function doGet(e) {
  return handleRequest(e || {});
}

function doPost(e) {
  return handleRequest(e || {});
}

function handleRequest(e) {
  var params = e.parameter || {};
  var action = params.action;
  
  if (action === 'getHorarios') return getHorarios(params.data);
  if (action === 'agendar') return agendar(params);
  if (action === 'getAgendamentos') return listar();
  
  return ContentService.createTextOutput(
    JSON.stringify({ erro: 'ação inválida' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// Normaliza data para string YYYY-MM-DD
// ============================================
function normalizeDate(data, sheetTimeZone) {
  if (!data) return null;
  
  // Se for objeto Data, formata considerando o fuso da planilha para evitar erro de dia anterior
  if (Object.prototype.toString.call(data) === '[object Date]') {
    return Utilities.formatDate(data, sheetTimeZone || Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  
  if (typeof data === 'string') {
    data = data.trim();
    // Se estiver no formato DD/MM/YYYY vindo de texto livre
    if (data.indexOf('/') > -1) {
      var parts = data.split(' ')[0].split('/');
      if (parts.length === 3) {
        if (parts[0].length === 2 && parts[2].length === 4) {
          return parts[2] + '-' + parts[1] + '-' + parts[0]; 
        }
        return parts[0] + '-' + parts[1] + '-' + parts[2]; 
      }
    }
    // Remove horas e mantém só a data
    if (data.indexOf(' ') > -1) return data.split(' ')[0];
    if (data.indexOf('T') > -1) return data.split('T')[0];
    
    return data;
  }
  
  return String(data).split(' ')[0];
}

// ============================================
// Normaliza horário para formato HH:00
// ============================================
function normalizeTime(hora, sheetTimeZone) {
  if (!hora) return null;
  
  if (Object.prototype.toString.call(hora) === '[object Date]') {
    return Utilities.formatDate(hora, sheetTimeZone || Session.getScriptTimeZone(), "HH:mm");
  }
  
  hora = String(hora).trim();
  
  if (hora.indexOf(':') === -1) {
    var h = parseInt(hora, 10);
    return (h < 10 ? '0' + h : h) + ':00';
  }
  
  var parts = hora.split(':');
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10) || 0;
  
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

// ============================================
// getHorarios - Lista horários disponíveis
// ============================================
function getHorarios(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var tz = ss.getSpreadsheetTimeZone(); // Garante o fuso correto
  var sheet = ss.getSheetByName('agendamentos');
  var dados = sheet.getDataRange().getValues();
  
  var todosHorarios = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  var ocupados = [];
  
  var dataNormalized = normalizeDate(data, tz);
  
  for (var i = 1; i < dados.length; i++) {
    var dataNaPlanilha = normalizeDate(dados[i][0], tz);
    var status = String(dados[i][5] || '').toLowerCase().trim();
    
    // Testa se a data bate E se está confirmado
    if (dataNaPlanilha === dataNormalized && status === 'confirmado') {
      var horaRaw = dados[i][1];
      var horaNormalized = normalizeTime(horaRaw, tz);
      if (horaNormalized) {
        ocupados.push(horaNormalized);
      }
    }
  }
  
  var disponiveis = todosHorarios.filter(function(h) {
    return ocupados.indexOf(h) === -1;
  });
  
  return ContentService.createTextOutput(
    JSON.stringify({ data: data, horarios: disponiveis })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// agendar - Salva um novo agendamento
// ============================================
function agendar(params) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheetByName('agendamentos');
  var dados = sheet.getDataRange().getValues();
  
  var horaNormalized = normalizeTime(params.hora, tz);
  var dataNormalized = normalizeDate(params.data, tz);
  
  // Impede de agendar se já existir confirmado no mesmo horário
  for (var i = 1; i < dados.length; i++) {
    var dataNaPlanilha = normalizeDate(dados[i][0], tz);
    var horaExistente = normalizeTime(dados[i][1], tz);
    var status = String(dados[i][5] || '').toLowerCase().trim();
    
    if (dataNaPlanilha === dataNormalized && horaExistente === horaNormalized && status === 'confirmado') {
      return ContentService.createTextOutput(
        JSON.stringify({ sucesso: false, erro: 'Horário já ocupado nesta data!' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Salva no banco
  sheet.appendRow([
    params.data,
    params.hora,
    params.servico,
    params.cliente,
    params.telefone,
    'confirmado',
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// listar - Lista todos os agendamentos
// ============================================
function listar() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheetByName('agendamentos');
  var dados = sheet.getDataRange().getValues();
  var lista = [];
  
  for (var i = 1; i < dados.length; i++) {
    lista.push({
      data: normalizeDate(dados[i][0], tz),
      hora: normalizeTime(dados[i][1], tz),
      servico: dados[i][2],
      cliente: dados[i][3],
      telefone: dados[i][4],
      status: dados[i][5]
    });
  }
  
  return ContentService.createTextOutput(
    JSON.stringify(lista)
  ).setMimeType(ContentService.MimeType.JSON);
}
