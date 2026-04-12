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
  if (action === 'login') return verificarLogin(params.user, params.pass);
  
  if (action === 'getServicos') return getServicos();
  if (action === 'salvarServico') return salvarServico(params);
  if (action === 'excluirServico') return excluirServico(params.id);
  
  if (action === 'editarAgendamento') return editarAgendamento(params);
  if (action === 'cancelarAgendamento') return cancelarAgendamento(params);
  
  return ContentService.createTextOutput(
    JSON.stringify({ erro: 'ação inválida' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// verificarLogin - Valida acesso administrativo
// ============================================
function verificarLogin(user, pass) {
  // CONFIGURAÇÃO DE ACESSO - ALTERE AQUI!
  const USER_ADMIN = 'admin';
  const PASS_ADMIN = '1234';
  
  if (user === USER_ADMIN && pass === PASS_ADMIN) {
    return ContentService.createTextOutput(
      JSON.stringify({ sucesso: true, token: Utilities.base64Encode(user + ':' + pass) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'Usuário ou senha incorretos' })
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
  
  var dateObj = new Date(data + 'T12:00:00'); // Meio-dia para evitar problemas de fuso
  var diaSemana = dateObj.getDay(); // 0 = Domingo, 1-5 = Seg-Sex, 6 = Sábado
  var todosHorarios = [];
  
  if (diaSemana >= 1 && diaSemana <= 5) {
    // Segunda a Sexta: 08:00 às 11:00 e 13:30 às 21:00
    todosHorarios = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
    ];
  } else if (diaSemana === 6) {
    // Sábado: 07:00 às 12:00
    todosHorarios = [
      '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'
    ];
  }
  
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

// ============================================
// getServicos - Lista serviços configurados
// ============================================
function getServicos() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('servicos');
  
  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ erro: 'Aba servicos nao encontrada' })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  var dados = sheet.getDataRange().getValues();
  var lista = [];
  
  for (var i = 1; i < dados.length; i++) {
    if(!dados[i][0]) continue;
    lista.push({
      id: String(dados[i][0]).trim(),
      category: String(dados[i][1]).trim(),
      name: String(dados[i][2]).trim(),
      description: String(dados[i][3] || '').trim(),
      price: parseFloat(dados[i][4]) || 0,
      duration: parseInt(dados[i][5], 10) || 0,
      icon: String(dados[i][6] || 'circle').trim()
    });
  }
  
  return ContentService.createTextOutput(
    JSON.stringify(lista)
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// salvarServico - Adiciona ou atualiza serviço
// ============================================
function salvarServico(params) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('servicos');
  
  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ sucesso: false, erro: 'Aba servicos nao encontrada' })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  var dados = sheet.getDataRange().getValues();
  var rowIndexToUpdate = -1;
  
  // Procura se já existe
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).trim() === params.id) {
      rowIndexToUpdate = i + 1; // +1 porque sheet começa em 1, e array dados em 0
      break;
    }
  }
  
  var newRowData = [
    params.id,
    params.category,
    params.name,
    params.description || '',
    params.price || 0,
    params.duration || 0,
    params.icon || 'circle'
  ];
  
  if (rowIndexToUpdate > -1) {
    // Atualiza
    sheet.getRange(rowIndexToUpdate, 1, 1, newRowData.length).setValues([newRowData]);
  } else {
    // Insere
    if (dados.length === 1 && String(dados[0][0]) === "") {
        // Inicializa cabeçalho caso esteja completamente vazia
        sheet.getRange(1, 1, 1, 7).setValues([['id', 'category', 'name', 'description', 'price', 'duration', 'icon']]);
    }
    sheet.appendRow(newRowData);
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// excluirServico - Remove um serviço
// ============================================
function excluirServico(id) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('servicos');
  
  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ sucesso: false, erro: 'Aba servicos nao encontrada' })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  var dados = sheet.getDataRange().getValues();
  var rowIndexToDelete = -1;
  
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).trim() === id) {
      rowIndexToDelete = i + 1;
      break;
    }
  }
  
  if (rowIndexToDelete > -1) {
    sheet.deleteRow(rowIndexToDelete);
    return ContentService.createTextOutput(
      JSON.stringify({ sucesso: true })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'Serviço não encontrado' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// editarAgendamento - Atualiza um agendamento
// ============================================
function editarAgendamento(params) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheetByName('agendamentos');
  var dados = sheet.getDataRange().getValues();
  
  var originalData = normalizeDate(params.originalData, tz);
  var originalTime = normalizeTime(params.originalTime, tz);
  var novaData = normalizeDate(params.data, tz);
  var novaHora = normalizeTime(params.hora, tz);
  
  for (var i = 1; i < dados.length; i++) {
    var dataNaPlanilha = normalizeDate(dados[i][0], tz);
    var horaNaPlanilha = normalizeTime(dados[i][1], tz);
    
    if (dataNaPlanilha === originalData && horaNaPlanilha === originalTime) {
      sheet.getRange(i + 1, 1).setValue(params.data);
      sheet.getRange(i + 1, 2).setValue(params.hora);
      sheet.getRange(i + 1, 4).setValue(params.cliente);
      sheet.getRange(i + 1, 5).setValue(params.telefone);
      sheet.getRange(i + 1, 3).setValue(params.servico);
      
      return ContentService.createTextOutput(
        JSON.stringify({ sucesso: true })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'Agendamento não encontrado' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// cancelarAgendamento - Remove o agendamento
// ============================================
function cancelarAgendamento(params) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheetByName('agendamentos');
  var dados = sheet.getDataRange().getValues();
  
  var dataNormalized = normalizeDate(params.data, tz);
  var horaNormalized = normalizeTime(params.hora, tz);
  
  for (var i = 1; i < dados.length; i++) {
    var dataNaPlanilha = normalizeDate(dados[i][0], tz);
    var horaNaPlanilha = normalizeTime(dados[i][1], tz);
    
    if (dataNaPlanilha === dataNormalized && horaNaPlanilha === horaNormalized) {
      sheet.deleteRow(i + 1);
      
      return ContentService.createTextOutput(
        JSON.stringify({ sucesso: true })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'Agendamento não encontrado' })
  ).setMimeType(ContentService.MimeType.JSON);
}
