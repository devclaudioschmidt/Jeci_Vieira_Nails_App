/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO INDEX
   JavaScript para página de login
   ================================================ */

/* ----------------------------------------
   VARIÁVEIS GLOBAIS
   Elementos do DOM usados na página
   ---------------------------------------- */
const formLogin = document.querySelector('.formularioLogin');
const mensagemFeedback = document.getElementById('mensagemFeedback');

/* ----------------------------------------
   MOSTRAR MENSAGEM
   Exibe mensagem de feedback na tela
   ---------------------------------------- */
function mostrarMensagem(texto, tipo) {
    if (!mensagemFeedback) return;
    mensagemFeedback.textContent = texto;
    mensagemFeedback.className = 'mensagemFeedback ' + tipo;
    mensagemFeedback.style.display = 'block';
    setTimeout(function() {
        mensagemFeedback.style.display = 'none';
    }, 5000);
}

/* ----------------------------------------
   CRIAR ELEMENTO DE FEEDBACK
   Cria elemento para mostrar mensagens ( overlay )
   ---------------------------------------- */
function criarElementoFeedback() {
    const div = document.createElement('div');
    div.id = 'mensagemFeedback';
    div.className = 'mensagemFeedback';
    div.style.display = 'none';
    document.body.appendChild(div);
}

/* ----------------------------------------
   INICIALIZAÇÃO
   Configura eventos da página de login
   ---------------------------------------- */
function inicializarIndex() {
    // Cria elemento de feedback se não existir
    if (!mensagemFeedback) {
        criarElementoFeedback();
    }

    // Adiciona evento de submit ao formulário
    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('campoEmail').value;
        const senha = document.getElementById('campoSenha').value;

        const botaoSubmit = formLogin.querySelector('button[type="submit"]');
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = 'Entrando...';

        const resultado = await loginUsuario(email, senha);

        console.log("[DEBUG index] Resultado do login:", resultado);

        if (!resultado.sucesso) {
            let erroTexto = 'Erro ao fazer login.';
            if (resultado.erro === 'auth/invalid-email') {
                erroTexto = 'E-mail inválido.';
            } else if (resultado.erro === 'auth/invalid-credential' || resultado.erro === 'auth/wrong-password') {
                erroTexto = 'E-mail ou senha incorretos.';
            } else if (resultado.erro === 'auth/user-not-found') {
                erroTexto = 'Usuário não encontrado.';
            }
            mostrarMensagem(erroTexto, 'erro');
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = 'Entrar';
        } else {
            console.log("[DEBUG index] Login bem-sucedido! Role:", resultado.role);
            
            if (resultado.role === 'admin') {
                console.log("[DEBUG index] Redirecionando para pages/admin.html");
                window.location.href = 'pages/admin.html';
            } else {
                console.log("[DEBUG index] Redirecionando para pages/dashboard.html");
                window.location.href = 'pages/dashboard.html';
            }
        }
    });
}

/* ----------------------------------------
   INICIALIZAÇÃO AUTOMÁTICA
   Inicia quando o DOM estiver pronto
   ---------------------------------------- */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarIndex);
} else {
    inicializarIndex();
}