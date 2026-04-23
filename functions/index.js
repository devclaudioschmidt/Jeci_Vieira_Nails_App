const functions = require('firebase-functions');
const { sendResponse } = require('./utils/helpers');
const AppointmentService = require('./services/AppointmentService');
const ClientService = require('./services/ClientService');

const api = functions.https.onRequest(async (req, res) => {
    if (req.method === 'OPTIONS') {
        return sendResponse(res, 204, '');
    }

    const action = req.query.action || req.body.action;

    try {
        switch (action) {
            case 'getServicos':
                return sendResponse(res, 200, await AppointmentService.getServicos());
            
            case 'salvarServico':
                return sendResponse(res, 200, await AppointmentService.salvarServico(req.body));
            
            case 'excluirServico':
                return sendResponse(res, 200, await AppointmentService.excluirServico(req.query.id || req.body.id));
            
            case 'getHorarios':
                return sendResponse(res, 200, await AppointmentService.getHorarios(
                    req.query.data || req.body.data,
                    req.query.duracao || req.body.duracao
                ));
            
            case 'agendar':
                return sendResponse(res, 200, await AppointmentService.agendar(req.body));
            
            case 'agendarCliente':
                return sendResponse(res, 200, await AppointmentService.agendarCliente(req.body));
            
            case 'getAgendamentos':
                return sendResponse(res, 200, await AppointmentService.getAgendamentos(req.query.uid));
            
            case 'editarAgendamento':
                return sendResponse(res, 200, await AppointmentService.editarAgendamento(req.body));
            
            case 'cancelarAgendamento':
                return sendResponse(res, 200, await AppointmentService.cancelarAgendamento(req.body.data, req.body.hora));
            
            case 'cancelarAgendamentoPorId':
                return sendResponse(res, 200, await AppointmentService.cancelarAgendamentoPorId(req.body.id || req.query.id));
            
            case 'getClientAppointments':
                return sendResponse(res, 200, await AppointmentService.getClientAppointments(
                    req.query.uid || req.body.uid,
                    req.query.clienteNome || req.body.clienteNome
                ));
            
            case 'saveCliente':
                return sendResponse(res, 200, await ClientService.saveCliente(req.body));
            
            case 'getCliente':
                return sendResponse(res, 200, await ClientService.getCliente(req.query.uid || req.body.uid, req));
            
            case 'updateCliente':
                return sendResponse(res, 200, await ClientService.updateCliente(req.body, req));
            
            case 'excluirCliente':
                return sendResponse(res, 200, await ClientService.excluirCliente(req.body.uid || req.query.uid));
            
            case 'getSalao':
                return sendResponse(res, 200, await ClientService.getSalao());
            
            case 'updateSalao':
                return sendResponse(res, 200, await ClientService.updateSalao(req.body));
            
            case 'getBloqueios':
                return sendResponse(res, 200, await ClientService.getBloqueios());
            
            case 'bloquearHorario':
                return sendResponse(res, 200, await ClientService.bloquearHorario(req.body));
            
            case 'desbloquearHorario':
                return sendResponse(res, 200, await ClientService.desbloquearHorario(req.query.id || req.body.id));
            
            case 'saveFCMToken':
                return sendResponse(res, 200, await ClientService.saveFCMToken(req.body));
            
            case 'removeFCMToken':
                return sendResponse(res, 200, await ClientService.removeFCMToken(req.body.uid));
            
            case 'login': {
                const user = req.body.user || req.query.user;
                const pass = req.body.pass || req.query.pass;
                
                if (user === 'admin' && pass === '1234') {
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

module.exports = { api };