const firestoreService = (function () {

    const COLECAO_SERVICOS = 'servicos';
    const COLECAO_CONFIGURACOES = 'configuracoes';
    const COLECAO_AVISOS = 'avisos';
    const COLECAO_AGENDAMENTOS = 'agendamentos';
    const COLECAO_USUARIOS = 'usuarios';
    const DOC_CONFIG_SALAO = 'salao';

    const CONFIGURACOES_DEFAULT = {
        segundaAbertura: "09:00",
        segundaIntervaloInicio: "12:00",
        segundaIntervaloFim: "13:00",
        segundaFechamento: "19:00",
        sabadoAbertura: "09:00",
        sabadoFechamento: "17:00",
        domingoFechado: true,
        tempoEntreAgendamentos: 15,
        telefone: "",
        endereco: ""
    };

    function getDb() {
        return firebase.firestore();
    }

    function log(level, mensagem, dados) {
        const prefixo = '[FirestoreService]';
        if (level === 'erro') {
            console.error(prefixo, mensagem, dados || '');
        } else if (level === 'aviso') {
            console.warn(prefixo, mensagem, dados || '');
        } else {
            console.log(prefixo, mensagem, dados || '');
        }
    }

    function dataToObj(doc) {
        return { id: doc.id, ...doc.data() };
    }

    async function carregarServicosAtivos() {
        try {
            log('info', 'Buscando servicos ativos...');
            const snap = await getDb()
                .collection(COLECAO_SERVICOS)
                .where('ativo', '==', true)
                .get();

            const servicos = snap.docs.map(dataToObj);
            log('info', `Servicos ativos carregados: ${servicos.length}`, servicos);
            return { success: true, data: servicos };
        } catch (erro) {
            log('erro', 'Erro ao carregar servicos:', erro.message);
            return { success: false, data: [], error: erro };
        }
    }

    async function carregarConfiguracoes() {
        try {
            log('info', 'Buscando configuracoes...');
            const snap = await getDb()
                .collection(COLECAO_CONFIGURACOES)
                .doc(DOC_CONFIG_SALAO)
                .get();

            const dados = snap.exists
                ? { ...CONFIGURACOES_DEFAULT, ...snap.data() }
                : { ...CONFIGURACOES_DEFAULT };

            log('info', 'Configuracoes carregadas', dados);
            return { success: true, data: dados };
        } catch (erro) {
            log('erro', 'Erro ao carregar configuracoes:', erro.message);
            return { success: false, data: { ...CONFIGURACOES_DEFAULT }, error: erro };
        }
    }

    async function carregarAvisoAtivo() {
        try {
            log('info', 'Buscando aviso ativo...');
            const snap = await getDb()
                .collection(COLECAO_AVISOS)
                .where('ativo', '==', true)
                .limit(1)
                .get();

            const aviso = snap.empty ? null : snap.docs[0].data().mensagem || null;
            log('info', 'Aviso ativo:', aviso ? 'encontrado' : 'nenhum');
            return { success: true, data: aviso };
        } catch (erro) {
            log('erro', 'Erro ao carregar aviso:', erro.message);
            return { success: false, data: null, error: erro };
        }
    }

    async function carregarAgendamentosDoDia(dataStr) {
        try {
            log('info', `Buscando agendamentos do dia ${dataStr}...`);

            const [agendSnap, configResult] = await Promise.all([
                getDb()
                    .collection(COLECAO_AGENDAMENTOS)
                    .where('data', '==', dataStr)
                    .where('status', 'in', ['pendente', 'confirmado'])
                    .get(),
                carregarConfiguracoes()
            ]);

            const agendamentos = agendSnap.docs.map(doc => ({
                horario: doc.data().horario,
                duracao: doc.data().duracao || 60
            }));

            const config = configResult.success ? configResult.data : {};
            const horariosBloqueados = config.horariosBloqueados || [];

            log('info', `Agendamentos do dia ${dataStr}: ${agendamentos.length} encontrados`);
            return {
                success: true,
                data: { agendamentos, horariosBloqueados, configuracoes: config }
            };
        } catch (erro) {
            log('erro', `Erro ao buscar agendamentos do dia ${dataStr}:`, erro.message);
            return { success: false, data: { agendamentos: [], horariosBloqueados: [] }, error: erro };
        }
    }

    async function carregarProximoAgendamento(uid) {
        try {
            log('info', `Buscando proximo agendamento do usuario ${uid}...`);

            const hoje = new Date().toISOString().split('T')[0];

            const snap = await getDb()
                .collection(COLECAO_AGENDAMENTOS)
                .where('userId', '==', uid)
                .where('status', 'in', ['pendente', 'confirmado'])
                .get();

            if (snap.empty) {
                log('info', 'Nenhum agendamento encontrado para o usuario');
                return { success: true, data: null };
            }

            const agendamentos = snap.docs
                .map(dataToObj)
                .filter(a => a.data >= hoje && a.status !== 'cancelado');

            if (agendamentos.length === 0) {
                return { success: true, data: null };
            }

            const proximo = agendamentos.sort((a, b) =>
                a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)
            )[0];

            const resultado = {
                servico: proximo.servicoNome || proximo.servico,
                servicoId: proximo.servicoId,
                data: proximo.data,
                horario: proximo.horario,
                status: proximo.status,
                id: proximo.id
            };

            log('info', 'Proximo agendamento encontrado:', resultado);
            return { success: true, data: resultado };
        } catch (erro) {
            log('erro', 'Erro ao buscar proximo agendamento:', erro.message);
            return { success: false, data: null, error: erro };
        }
    }

    async function carregarAgendamentosUsuario(uid) {
        try {
            log('info', `Buscando todos agendamentos do usuario ${uid}...`);

            const snap = await getDb()
                .collection(COLECAO_AGENDAMENTOS)
                .where('userId', '==', uid)
                .get();

            const agendamentos = snap.docs.map(dataToObj);
            log('info', `Agendamentos do usuario: ${agendamentos.length}`);
            return { success: true, data: agendamentos };
        } catch (erro) {
            log('erro', 'Erro ao buscar agendamentos do usuario:', erro.message);
            return { success: false, data: [], error: erro };
        }
    }

    async function buscarAgendamentoPorTelefone(telefone) {
        try {
            log('info', `Buscando agendamentos pelo telefone...`);

            const hoje = new Date().toISOString().split('T')[0];

            const snap = await getDb()
                .collection(COLECAO_AGENDAMENTOS)
                .where('clienteTelefone', '==', telefone)
                .where('status', 'in', ['pendente', 'confirmado'])
                .get();

            const agendamentos = snap.docs
                .map(dataToObj)
                .filter(a => a.data >= hoje)
                .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario));

            log('info', `Agendamentos encontrados pelo telefone: ${agendamentos.length}`);
            return { success: true, data: agendamentos };
        } catch (erro) {
            log('erro', 'Erro ao buscar agendamentos por telefone:', erro.message);
            return { success: false, data: [], error: erro };
        }
    }

    async function criarOuBuscarUsuario(telefone, nome) {
        try {
            const telLimpo = telefone.replace(/\D/g, '');
            log('info', `Buscando usuario pelo telefone...`);

            const existenteSnap = await getDb()
                .collection(COLECAO_USUARIOS)
                .where('telefone', '==', telefone)
                .where('role', '==', 'cliente')
                .limit(1)
                .get();

            if (!existenteSnap.empty) {
                const doc = existenteSnap.docs[0];
                log('info', `Usuario existente encontrado: ${doc.id}`);
                return { success: true, data: { id: doc.id, ...doc.data(), existente: true } };
            }

            const novoUsuario = {
                nome: nome,
                telefone: telefone,
                email: '',
                role: 'cliente',
                dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await getDb()
                .collection(COLECAO_USUARIOS)
                .add(novoUsuario);

            log('info', `Novo usuario criado: ${docRef.id}`);
            return { success: true, data: { id: docRef.id, ...novoUsuario, existente: false } };
        } catch (erro) {
            log('erro', 'Erro ao criar/buscar usuario:', erro.message);
            return { success: false, data: null, error: erro };
        }
    }

    async function criarAgendamento(dados) {
        try {
            const agendamentoDoc = {
                ...dados,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await getDb()
                .collection(COLECAO_AGENDAMENTOS)
                .add(agendamentoDoc);

            log('info', `Agendamento criado: ${docRef.id}`);
            return { success: true, data: { id: docRef.id } };
        } catch (erro) {
            log('erro', 'Erro ao criar agendamento:', erro.message);
            return { success: false, data: null, error: erro };
        }
    }

    async function removerAgendamento(id) {
        try {
            await getDb()
                .collection(COLECAO_AGENDAMENTOS)
                .doc(id)
                .delete();

            log('info', `Agendamento removido: ${id}`);
            return { success: true };
        } catch (erro) {
            log('erro', 'Erro ao remover agendamento:', erro.message);
            return { success: false, error: erro };
        }
    }

    async function carregarUsuario(uid) {
        try {
            log('info', `Buscando usuario: ${uid}...`);

            const snap = await getDb()
                .collection(COLECAO_USUARIOS)
                .doc(uid)
                .get();

            if (!snap.exists) {
                log('aviso', `Usuario ${uid} nao encontrado`);
                return { success: true, data: null };
            }

            const dados = { id: snap.id, ...snap.data() };
            log('info', `Usuario carregado: ${dados.nome || uid}`);
            return { success: true, data: dados };
        } catch (erro) {
            log('erro', 'Erro ao carregar usuario:', erro.message);
            return { success: false, data: null, error: erro };
        }
    }

    async function atualizarUsuario(uid, dados) {
        try {
            await getDb()
                .collection(COLECAO_USUARIOS)
                .doc(uid)
                .update(dados);

            log('info', `Usuario atualizado: ${uid}`);
            return { success: true };
        } catch (erro) {
            log('erro', 'Erro ao atualizar usuario:', erro.message);
            return { success: false, error: erro };
        }
    }

    async function carregarDadosIniciaisAgendamento() {
        try {
            log('info', 'Carregando dados iniciais para agendamento...');

            const [servicosResult, configResult] = await Promise.all([
                carregarServicosAtivos(),
                carregarConfiguracoes()
            ]);

            const servicos = servicosResult.success ? servicosResult.data : [];
            const configuracoes = configResult.success ? configResult.data : { ...CONFIGURACOES_DEFAULT };

            if (servicos.length === 0 && servicosResult.success) {
                log('aviso', 'Nenhum servico ativo encontrado no banco de dados');
            }

            if (!servicosResult.success) {
                log('erro', 'Falha ao carregar servicos:', servicosResult.error?.message);
            }
            if (!configResult.success) {
                log('erro', 'Falha ao carregar configuracoes:', configResult.error?.message);
            }

            return {
                success: servicosResult.success || configResult.success,
                data: { servicos, configuracoes },
                errors: {
                    servicos: servicosResult.error || null,
                    configuracoes: configResult.error || null
                }
            };
        } catch (erro) {
            log('erro', 'Erro inesperado ao carregar dados iniciais:', erro.message);
            return {
                success: false,
                data: { servicos: [], configuracoes: { ...CONFIGURACOES_DEFAULT } },
                error: erro
            };
        }
    }

    async function carregarDadosDashboard(uid) {
        try {
            log('info', 'Carregando dados do dashboard...');

            const [avisoResult, configResult, proximoResult, usuarioResult] = await Promise.all([
                carregarAvisoAtivo(),
                carregarConfiguracoes(),
                carregarProximoAgendamento(uid),
                carregarUsuario(uid)
            ]);

            return {
                success: true,
                data: {
                    aviso: avisoResult.success ? avisoResult.data : null,
                    configuracoes: configResult.success ? configResult.data : { ...CONFIGURACOES_DEFAULT },
                    proximoAgendamento: proximoResult.success ? proximoResult.data : null,
                    usuario: usuarioResult.success ? usuarioResult.data : { nome: 'Cliente' }
                }
            };
        } catch (erro) {
            log('erro', 'Erro ao carregar dados do dashboard:', erro.message);
            return {
                success: false,
                data: {
                    aviso: null,
                    configuracoes: { ...CONFIGURACOES_DEFAULT },
                    proximoAgendamento: null,
                    usuario: { nome: 'Cliente' }
                },
                error: erro
            };
        }
    }

    return {
        carregarServicosAtivos,
        carregarConfiguracoes,
        carregarAvisoAtivo,
        carregarAgendamentosDoDia,
        carregarProximoAgendamento,
        carregarAgendamentosUsuario,
        buscarAgendamentoPorTelefone,
        criarOuBuscarUsuario,
        criarAgendamento,
        removerAgendamento,
        carregarUsuario,
        atualizarUsuario,
        carregarDadosIniciaisAgendamento,
        carregarDadosDashboard
    };

})();
