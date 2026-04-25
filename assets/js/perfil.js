/* ================================================
   JEICI VIEIRA NAILS - PERFIL DO USUÁRIO
   JavaScript para página de perfil do cliente
   ================================================ */

/* ----------------------------------------
   VARIÁVEIS GLOBAIS
   Elementos do DOM usados na página
   ---------------------------------------- */
const formPerfil = document.getElementById('formPerfil');
const mensagemFeedback = document.getElementById('mensagemFeedback');

/* ----------------------------------------
   CARREGAR DADOS DO PERFIL
   Busca dados do usuário logado no Firestore
   ---------------------------------------- */
async function carregarDadosPerfil() {
    const status = document.getElementById('status');
    
    // Usa onAuthStateChanged para esperar Firebase iniciar
    firebase.auth().onAuthStateChanged(async (usuario) => {
        console.log('[DEBUG] Estado auth alterado, usuário:', usuario);
        
        try {
            // Verifica se há usuário logado
            if (!usuario) {
                status.textContent = 'Usuário não está logado. Redirecionando...';
                console.log('[DEBUG] Não logado, redirecionando para login');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                return;
            }
            
            console.log('[DEBUG] UID do usuário:', usuario.uid);
            
            // Busca dados do usuário no Firestore
            const doc = await firebase.firestore().collection('usuarios').doc(usuario.uid).get();
            const dados = doc.data();
            
            console.log('[DEBUG] Dados do usuário:', dados);
            
            // Verifica se há dados do usuário
            if (!dados) {
                status.textContent = 'Dados do usuário não encontrados.';
                console.log('[DEBUG] Sem dados no Firestore');
                return;
            }
            
            // Preenche os campos do formulário
            document.getElementById('campoNome').value = dados.nome || '';
            document.getElementById('campoEmail').value = dados.email || '';
            document.getElementById('campoTelefone').value = dados.telefone || '';
            document.getElementById('campoDataNascimento').value = dados.dataNascimento || '';
            
            // Esconde status de carregamento
            status.style.display = 'none';
            
            console.log('[DEBUG] Dados carregados com sucesso!');
            
        } catch (erro) {
            console.error('[DEBUG] Erro ao carregar dados:', erro);
            status.textContent = 'Erro ao carregar dados: ' + erro.message;
        }
    });
}

/* ----------------------------------------
   MOSTRAR MENSAGEM
   Exibe mensagem de feedback na tela
   ---------------------------------------- */
function mostrarMensagem(texto, tipo) {
    mensagemFeedback.textContent = texto;
    mensagemFeedback.className = 'mensagemFeedback ' + tipo;
    mensagemFeedback.style.display = 'block';
    setTimeout(function() {
        mensagemFeedback.style.display = 'none';
    }, 5000);
}

/* ----------------------------------------
   VALIDAR TELEFONE
   Valida formato brasileiro de telefone
   Retorna true se válido, false se inválido
   ---------------------------------------- */
function validarTelefone(telefone) {
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos (fixo ou celular)
    if (numeros.length < 10 || numeros.length > 11) {
        return false;
    }
    
    return true;
}

/* ----------------------------------------
   FORMATA TELEFONE
   Aplica máscara de formato brasileiro
   Exemplo: (11) 99999-9999
   ---------------------------------------- */
function formatarTelefone(input) {
    let valor = input.value;
    valor = valor.replace(/\D/g, ''); // Remove não numéricos
    
    if (valor.length > 0) {
        valor = '(' + valor;
    }
    if (valor.length > 3) {
        valor = valor.substring(0, 3) + ') ' + valor.substring(3);
    }
    if (valor.length > 10) {
        valor = valor.substring(0, 10) + '-' + valor.substring(10, 14);
    }
    
    input.value = valor;
}

/* ----------------------------------------
   VALIDAR DATA
   Valida formato brasileiro de data
   Retorna true se válido, false se inválido
   ---------------------------------------- */
function validarData(data) {
    // Verifica formato DD/MM/AAAA
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(data)) {
        return false;
    }
    
    // Extrai dia, mês e ano
    const partes = data.split('/');
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);
    
    // Valida ranges
    if (dia < 1 || dia > 31) return false;
    if (mes < 1 || mes > 12) return false;
    if (ano < 1900 || ano > new Date().getFullYear()) return false;
    
    return true;
}

/* ----------------------------------------
   FORMATAR DATA
   Aplica máscara de data brasileira
   Exemplo: DD/MM/AAAA
   ---------------------------------------- */
function formatarData(input) {
    let valor = input.value;
    valor = valor.replace(/\D/g, ''); // Remove não numéricos
    
    if (valor.length > 0) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2);
    }
    if (valor.length > 5) {
        valor = valor.substring(0, 5) + '/' + valor.substring(5, 9);
    }
    
    input.value = valor;
}

/* ----------------------------------------
   SALVAR DADOS DO PERFIL
   Salva telefone e data de nascimento no Firestore
   ---------------------------------------- */
async function salvarDadosPerfil() {
    // Verifica se há usuário logado
    const usuario = firebase.auth().currentUser;
    if (!usuario) {
        mostrarMensagem('Usuário não está logado.', 'erro');
        return;
    }
    
    // Obtém valores dos campos
    const telefone = document.getElementById('campoTelefone').value.trim();
    const dataNascimento = document.getElementById('campoDataNascimento').value.trim();
    
    // Valida telefone (se informado)
    if (telefone && !validarTelefone(telefone)) {
        mostrarMensagem('Telefone inválido. Use formato: (11) 99999-9999', 'erro');
        return;
    }
    
    // Valida data (se informada)
    if (dataNascimento && !validarData(dataNascimento)) {
        mostrarMensagem('Data de nascimento inválida. Use formato: DD/MM/AAAA', 'erro');
        return;
    }
    
    // Desabilita botão durante processo
    const botaoSalvar = formPerfil.querySelector('button[type="submit"]');
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = 'Salvando...';
    
    try {
        // Cria objeto com dados a atualizar
        const dadosAtualizar = {};
        if (telefone) dadosAtualizar.telefone = telefone;
        if (dataNascimento) dadosAtualizar.dataNascimento = dataNascimento;
        
        // Atualiza no Firestore
        await firebase.firestore().collection('usuarios').doc(usuario.uid).update(dadosAtualizar);
        
        console.log('[DEBUG] Dados atualizados com sucesso!');
        console.log('[DEBUG] Dados atualizados:', dadosAtualizar);
        
        mostrarMensagem('Dados salvos com sucesso!', 'sucesso');
        
    } catch (erro) {
        console.error('[ERRO] Salvar perfil:', erro);
        mostrarMensagem('Erro ao salvar dados: ' + erro.message, 'erro');
    } finally {
        // Reabilita botão
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = 'Salvar';
    }
}

/* ----------------------------------------
   INICIALIZAÇÃO
   Configura eventos da página de perfil
   ---------------------------------------- */
function inicializarPerfil() {
    // Configura máscara de telefone
    const campoTelefone = document.getElementById('campoTelefone');
    if (campoTelefone) {
        campoTelefone.addEventListener('input', function() {
            formatarTelefone(this);
        });
    }
    
    // Configura máscara de data
    const campoData = document.getElementById('campoDataNascimento');
    if (campoData) {
        campoData.addEventListener('input', function() {
            formatarData(this);
        });
    }
    
    // Configura submit do formulário
    if (formPerfil) {
        formPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarDadosPerfil();
        });
    }
    
    // Carrega dados do perfil
    carregarDadosPerfil();
}

/* ----------------------------------------
   INICIALIZAÇÃO AUTOMÁTICA
   Inicia quando o DOM estiver pronto
   ---------------------------------------- */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPerfil);
} else {
    inicializarPerfil();
}