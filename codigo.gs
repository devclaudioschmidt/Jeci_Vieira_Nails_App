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
  
  if (action === 'getHorarios') return getHorarios(params.data, params.duracao);
  if (action === 'agendar') return agendar(params);
  if (action === 'getAgendamentos') return listar();
  if (action === 'login') return verificarLogin(params.user, params.pass);
  
  if (action === 'getServicos') return getServicos();
  if (action === 'salvarServico') return salvarServico(params);
  if (action === 'excluirServico') return excluirServico(params.id);
  
  if (action === 'editarAgendamento') return editarAgendamento(params);
  if (action === 'cancelarAgendamento') return cancelarAgendamento(params);
  if (action === 'reagendarAgendamento') return reagendarAgendamento(params);
  if (action === 'bloquearHorario') return bloquearHorario(params);
  if (action === 'desbloquearHorario') return desbloquearHorario(params);
  if (action === 'getBloqueios') return getBloqueios();
  
return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'Agendamento não encontrado' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// getBloqueios - Lista todos os horários bloqueados
// ============================================
function getBloqueios() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('bloqueios');
  
  if (!sheet) {
    ss.insertSheet('bloqueios');
    sheet = ss.getSheetByName('bloqueios');
    sheet.appendRow(['id', 'data', 'hora_inicio', 'hora_fim', 'motivo', 'criado_em']);
  }
  
  var dados = sheet.getDataRange().getValues();
  var lista = [];
  
  for (var i = 1; i < dados.length; i++) {
    var dataNaPlanilha = normalizeDate(dados[i][1]); // Use helper to ensure YYYY-MM-DD
    if (dataNaPlanilha) {
      lista.push({
        id: i + 1, // Use row number as ID
        data: dataNaPlanilha,
        hora_inicio: normalizeTime(dados[i][2]),
        hora_fim: normalizeTime(dados[i][3]),
        motivo: dados[i][4] || '',
        criado_em: dados[i][5]
      });
    }
  }
  
  return ContentService.createTextOutput(
    JSON.stringify(lista)
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// bloquearHorario - Bloqueia um horário
// ============================================
function bloquearHorario(params) {
  var data = normalizeDate(params.data || params.data_);
  var hora_inicio = normalizeTime(params.hora_inicio || params.horaInicio || params.hora_inicio_);
  var hora_fim = normalizeTime(params.hora_fim || params.horaFim || params.hora_fim_);
  var motivo = params.motivo || '';
  
  Logger.log('bloquearHorario - Data: ' + data + ', Inicio: ' + hora_inicio + ', Fim: ' + hora_fim);
  
  if (!data || !hora_inicio || !hora_fim) {
    var desc = [];
    if (!data) desc.push('data');
    if (!hora_inicio) desc.push('hora_inicio');
    if (!hora_fim) desc.push('hora_fim');
    
return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'Agendamento não encontrado' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// reagendarAgendamento - Altera data/hora do agendamento
// ============================================
function reagendarAgendamento(params) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheetByName('agendamentos');
  var dados = sheet.getDataRange().getValues();
  
  var dataStr = String(params.data);
  var horaStr = String(params.hora);
  
  Logger.log('Procurando agendamento: data=' + dataStr + ', hora=' + horaStr);
  
  for (var i = 1; i < dados.length; i++) {
    var rowData = dados[i][0];
    var rowHora = dados[i][1];
    
    var dataMatch = String(rowData) === dataStr || String(rowData) === params.data;
    var horaMatch = String(rowHora).trim() === horaStr.trim() || normalizeTime(rowHora, tz) === normalizeTime(horaStr, tz);
    
    Logger.log('Linha ' + i + ': ' + rowData + ' ' + rowHora + ' -> match=' + dataMatch + 'x' + horaMatch);
    
    if (dataMatch && horaMatch) {
      var servico = dados[i][2];
      var cliente = dados[i][3];
      var telefone = dados[i][4];
      var status = dados[i][5];
      var createdAt = dados[i][6];
      var duracao = dados[i][7];
      
      sheet.deleteRow(i + 1);
      
      sheet.appendRow([
        params.novaData,
        params.novaHora,
        servico,
        cliente,
        telefone,
        status,
        createdAt,
        duracao
      ]);
      
      Logger.log('Agendamento movido para ' + params.novaData + ' ' + params.novaHora);
      
      return ContentService.createTextOutput(
        JSON.stringify({ sucesso: true })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  Logger.log('Agendamento não encontrado!');
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'Agendamento não encontrado' })
  ).setMimeType(ContentService.MimeType.JSON);
}
  
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('bloqueios');
  
  if (!sheet) {
    ss.insertSheet('bloqueios');
    sheet = ss.getSheetByName('bloqueios');
    sheet.appendRow(['id', 'data', 'hora_inicio', 'hora_fim', 'motivo', 'criado_em']);
  }
  
  var lastRow = sheet.getLastRow();
  var nextId = lastRow + 1;
  
  sheet.appendRow([
    nextId,
    data,
    hora_inicio,
    hora_fim,
    motivo,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// desbloquearHorario - Remove um bloqueio
// ============================================
function desbloquearHorario(params) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('bloqueios');
  
  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ sucesso: false, erro: 'Nenhum bloqueio encontrado' })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  var rowId = parseInt(params.id);
  if (rowId > 0) {
    sheet.deleteRow(rowId);
    return ContentService.createTextOutput(
      JSON.stringify({ sucesso: true })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'ID de bloqueio inválido' })
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
function getHorarios(data, duracao) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheetByName('agendamentos');
  var dados = sheet.getDataRange().getValues();
  
  var dateObj = new Date(data + 'T12:00:00');
  Logger.log('Data recebida: ' + data);
  Logger.log('Date object: ' + dateObj);
  var diaSemana = dateObj.getDay();
  Logger.log('Dia da semana: ' + diaSemana);
  var todosHorarios = [];
  var horarioFechamento = 21 * 60;
  var intervaloInicio = 11 * 60;
  var intervaloFim = 13.5 * 60;
  
  if (diaSemana >= 1 && diaSemana <= 5) {
    todosHorarios = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
    ];
    horarioFechamento = 21 * 60;
  } else if (diaSemana === 6) {
    todosHorarios = [
      '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'
    ];
    horarioFechamento = 12 * 60;
    intervaloInicio = 0;
    intervaloFim = 0;
  }
  
  var duracaoServico = parseInt(duracao) || 30;
  var ultimoHorarioMin = horarioFechamento - duracaoServico;
  
  var agendamentos = [];
  var dataNormalized = normalizeDate(data, tz);
  
  // Verifica agendamentos existentes
  for (var i = 1; i < dados.length; i++) {
    var dataNaPlanilha = normalizeDate(dados[i][0], tz);
    var status = String(dados[i][5] || '').toLowerCase().trim();
    
    Logger.log('Linha ' + i + ': planilha=' + dataNaPlanilha + ', buscando=' + dataNormalized + ', status=' + status);
    
    if (dataNaPlanilha === dataNormalized && status === 'confirmado') {
      var horaRaw = dados[i][1];
      var horaNormalized = normalizeTime(horaRaw, tz);
      var duracaoExistente = parseInt(dados[i][7]) || 30;
      
      if (horaNormalized) {
        var parts = horaNormalized.split(':');
        var startMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        var endMin = startMin + duracaoExistente;
        
        agendamentos.push({
          start: startMin,
          end: endMin,
          duracao: duracaoExistente
        });
      }
    }
  }
  
  // Verifica bloqueios de horários
  var bloqueiosSheet = ss.getSheetByName('bloqueios');
  Logger.log('Verificando bloqueios para data: ' + dataNormalized);
  if (bloqueiosSheet) {
    var bloqueios = bloqueiosSheet.getDataRange().getValues();
    Logger.log('Total linhas bloqueios: ' + bloqueios.length);
    for (var j = 1; j < bloqueios.length; j++) {
      var dataBloqueio = normalizeDate(bloqueios[j][1], tz);
      var horaInicio = normalizeTime(bloqueios[j][2], tz);
      var horaFim = normalizeTime(bloqueios[j][3], tz);
      
      Logger.log('Linha ' + j + ': data=' + dataBloqueio + ' inicio=' + horaInicio + ' fim=' + horaFim);
      
      if (dataBloqueio === dataNormalized && horaInicio && horaFim) {
        Logger.log('>>> BLOQUEIO MATCH: ' + dataBloqueio + ' ' + horaInicio + '-' + horaFim);
        
        todosHorarios.forEach(function(h) {
          if (h >= horaInicio && h < horaFim) {
            if (ocupados.indexOf(h) === -1) {
              ocupados.push(h);
            }
          }
        });
      }
    }
  }
  
var disponiveis = todosHorarios.filter(function(h) {
    var parts = h.split(':');
    var hMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    var hEnd = hMin + duracaoServico;
    
    if (hMin > ultimoHorarioMin) return false;
    
    if (hEnd > intervaloInicio && hMin < intervaloFim) return false;
    
    for (var j = 0; j < agendamentos.length; j++) {
      var exist = agendamentos[j];
      if (!(hEnd <= exist.start || hMin >= exist.end)) {
        return false;
      }
    }
    
    return true;
  });
  
  Logger.log('Horarios disponiveis: ' + disponiveis.length);
  return ContentService.createTextOutput(
    JSON.stringify({ data: data, horarios: disponiveis })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// calcularHorariosBloqueados - Calcula horários ocupados baseado na duração
// ============================================
function calcularHorariosBloqueados(horaInicio, duracao, todosHorarios) {
  var bloqueados = [];
  var horaParts = horaInicio.split(':');
  var hora = parseInt(horaParts[0]);
  var min = parseInt(horaParts[1]);
  var minutosTotais = hora * 60 + min;
  var minutosFim = minutosTotais + duracao;
  
  for (var i = 0; i < todosHorarios.length; i++) {
    var hParts = todosHorarios[i].split(':');
    var hMinutos = parseInt(hParts[0]) * 60 + parseInt(hParts[1]);
    
    if (hMinutos >= minutosTotais && hMinutos < minutosFim) {
      bloqueados.push(todosHorarios[i]);
    }
  }
  
  return bloqueados;
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
  var duracao = parseInt(params.duracao) || 30;
  
  for (var i = 1; i < dados.length; i++) {
    var dataNaPlanilha = normalizeDate(dados[i][0], tz);
    var status = String(dados[i][5] || '').toLowerCase().trim();
    
    if (dataNaPlanilha === dataNormalized && status === 'confirmado') {
      var horaExistente = normalizeTime(dados[i][1], tz);
      var durExistente = parseInt(dados[i][7]) || 30;
      
      var existParts = horaExistente.split(':');
      var existStartMin = parseInt(existParts[0]) * 60 + parseInt(existParts[1]);
      var existEndMin = existStartMin + durExistente;
      
      var novoParts = horaNormalized.split(':');
      var novoStartMin = parseInt(novoParts[0]) * 60 + parseInt(novoParts[1]);
      var novoEndMin = novoStartMin + duracao;
      
      if (!(novoEndMin <= existStartMin || novoStartMin >= existEndMin)) {
        return ContentService.createTextOutput(
          JSON.stringify({ sucesso: false, erro: 'Horário conflita com agendamento existente!' })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  sheet.appendRow([
    params.data,
    params.hora,
    params.servico,
    params.cliente,
    params.telefone,
    'confirmado',
    new Date().toISOString(),
    duracao
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
      status: dados[i][5],
      duracao: parseInt(dados[i][7]) || 30
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
  
  var originalData = params.originalData;
  var originalTime = params.originalTime;
  var novaData = params.data;
  var novaHora = params.hora;
  var duracao = parseInt(params.duracao) || 30;
  var cliente = params.cliente || '';
  var telefone = params.telefone || '';
  var servico = params.servico || '';
  
  // Verifica se o novo horario ja esta ocupado
  for (var j = 1; j < dados.length; j++) {
    var rowData = normalizeDate(dados[j][0], tz);
    var rowHora = normalizeTime(dados[j][1], tz);
    var novaDataNorm = normalizeDate(novaData, tz);
    var novaHoraNorm = normalizeTime(novaHora, tz);
    var status = String(dados[j][5] || '').toLowerCase().trim();
    
    if (rowData === novaDataNorm && rowHora === novaHoraNorm && status === 'confirmado') {
      return ContentService.createTextOutput(
        JSON.stringify({ sucesso: false, erro: 'Horario ja ocupado!' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  Logger.log('editarAgendamento - original: ' + originalData + ' ' + originalTime + ', novo: ' + novaData + ' ' + novaHora);
  Logger.log('Total linhas: ' + dados.length);
  
  for (var i = 1; i < dados.length; i++) {
    var rowData = normalizeDate(dados[i][0], tz);
    var rowHora = normalizeTime(dados[i][1], tz);
    var rowStatus = String(dados[i][5] || '').toLowerCase().trim();
    
    var originalDataNorm = normalizeDate(originalData, tz);
    var originalTimeNorm = normalizeTime(originalTime, tz);
    
    var dataMatch = rowData === originalDataNorm;
    var horaMatch = rowHora === originalTimeNorm;
    
    Logger.log('Linha ' + i + ': data="' + rowData + '"=="' + originalDataNorm + '"? ' + dataMatch + ', hora="' + rowHora + '"=="' + originalTimeNorm + '"? ' + horaMatch + ', status=' + rowStatus);
    
    if (dataMatch && horaMatch) {
      if (rowStatus !== 'confirmado') {
        return ContentService.createTextOutput(
          JSON.stringify({ sucesso: false, erro: 'Agendamento não encontrado ou já cancelado' })
        ).setMimeType(ContentService.MimeType.JSON);
      }
      
      var novaDataNorm = normalizeDate(novaData, tz);
      var novaHoraNorm = normalizeTime(novaHora, tz);
      
      sheet.getRange(i + 1, 1).setValue(novaDataNorm);
      sheet.getRange(i + 1, 2).setValue(novaHoraNorm);
      sheet.getRange(i + 1, 4).setValue(cliente);
      sheet.getRange(i + 1, 5).setValue(telefone);
      sheet.getRange(i + 1, 3).setValue(servico);
      sheet.getRange(i + 1, 8).setValue(duracao);
      
      Logger.log('Agendamento atualizado na linha ' + i);
      
      return ContentService.createTextOutput(
        JSON.stringify({ sucesso: true })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  Logger.log('Agendamento nao encontrado!');
  return ContentService.createTextOutput(
    JSON.stringify({ sucesso: false, erro: 'Agendamento nao encontrado' })
  ).setMimeType(ContentService.MimeType.JSON);
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
