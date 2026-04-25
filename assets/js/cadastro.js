/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO CADASTRO
   JavaScript para página de cadastro
   ================================================ */

/* ----------------------------------------
   VARIÁVEIS GLOBAIS
   Elementos do DOM usados na página
   ---------------------------------------- */
const formCadastro = document.getElementById('formCadastro');
const mensagemFeedback = document.getElementById('mensagemFeedback');

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
   VALIDAR CADASTRO
   Valida os dados antes de enviar
   ---------------------------------------- */
function validarCadastro(nome, email, senha, confirmarSenha) {
    // Verifica se senhas coincidem
    if (senha !== confirmarSenha) {
        mostrarMensagem('As senhas não conferem.', 'erro');
        return false;
    }
    
    // Verifica tamanho mínimo da senha
    if (senha.length < 6) {
        mostrarMensagem('A senha deve ter pelo menos 6 caracteres.', 'erro');
        return false;
    }
    
    return true;
}

/* ----------------------------------------
   PROCESSAR CADASTRO
   Envia dados para o Firebase
   ---------------------------------------- */
async function processarCadastro(nome, email, senha) {
    const botaoSubmit = formCadastro.querySelector('button[type="submit"]');
    botaoSubmit.disabled = true;
    botaoSubmit.textContent = 'Cadastrando...';

    const resultado = await cadastrarUsuario(email, senha, nome);

    if (resultado.sucesso) {
        mostrarMensagem('Cadastro realizado com sucesso!', 'sucesso');
        setTimeout(function() {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        let erroTexto = 'Erro ao cadastrar.';
        if (resultado.erro === 'auth/email-already-in-use') {
            erroTexto = 'Este e-mail já está cadastrado.';
        } else if (resultado.erro === 'auth/invalid-email') {
            erroTexto = 'E-mail inválido.';
        }
        mostrarMensagem(erroTexto, 'erro');
        botaoSubmit.disabled = false;
        botaoSubmit.textContent = 'Cadastrar';
    }
}

/* ----------------------------------------
   INICIALIZAÇÃO
   Configura eventos da página de cadastro
   ---------------------------------------- */
function inicializarCadastro() {
    formCadastro.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('campoNome').value;
        const email = document.getElementById('campoEmail').value;
        const senha = document.getElementById('campoSenha').value;
        const confirmarSenha = document.getElementById('campoConfirmarSenha').value;

        // Valida dados
        if (!validarCadastro(nome, email, senha, confirmarSenha)) {
            return;
        }

        // Processa cadastro
        await processarCadastro(nome, email, senha);
    });
}

/* ----------------------------------------
   INICIALIZAÇÃO AUTOMÁTICA
   Inicia quando o DOM estiver pronto
   ---------------------------------------- */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCadastro);
} else {
    inicializarCadastro();
}