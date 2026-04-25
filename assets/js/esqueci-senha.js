/* ================================================
   JEICI VIEIRA NAILS - RECUPERAÇÃO DE SENHA
   JavaScript para página de redefinição de senha
   ================================================ */

/* ----------------------------------------
   VARIÁVEIS GLOBAIS
   Elementos do DOM usados na página
   ---------------------------------------- */
const formEsqueciSenha = document.getElementById('formEsqueciSenha');
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
   ENVIAR LINK DE RECUPERAÇÃO
   Envia email de redefinição de senha
   ---------------------------------------- */
async function enviarLinkRecuperacao(email) {
    const botaoSubmit = formEsqueciSenha.querySelector('button[type="submit"]');
    botaoSubmit.disabled = true;
    botaoSubmit.textContent = 'Enviando...';

    try {
        await firebase.auth().sendPasswordResetEmail(email);
        console.log('[DEBUG] Email de recuperação enviado para:', email);
        return { sucesso: true };
    } catch (erro) {
        console.error('[ERRO] Recuperar senha:', erro);
        return { sucesso: false, erro: erro.code };
    }
}

/* ----------------------------------------
   INICIALIZAÇÃO
   Configura eventos da página
   ---------------------------------------- */
function inicializarEsqueciSenha() {
    formEsqueciSenha.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('campoEmail').value;

        if (!email) {
            mostrarMensagem('Por favor, informe seu email.', 'erro');
            return;
        }

        const resultado = await enviarLinkRecuperacao(email);

        if (resultado.sucesso) {
            mostrarMensagem('Link de recuperação enviado! Verifique seu email.', 'sucesso');
            formEsqueciSenha.reset();
            document.querySelector('button[type="submit"]').disabled = true;
            document.querySelector('button[type="submit"]').textContent = 'Enviado';
        } else {
            let erroTexto = 'Erro ao enviar link.';
            if (resultado.erro === 'auth/user-not-found') {
                erroTexto = 'Email não encontrado.';
            } else if (resultado.erro === 'auth/invalid-email') {
                erroTexto = 'Email inválido.';
            }
            mostrarMensagem(erroTexto, 'erro');
            document.querySelector('button[type="submit"]').disabled = false;
            document.querySelector('button[type="submit"]').textContent = 'Enviar Link';
        }
    });
}

/* ----------------------------------------
   INICIALIZAÇÃO AUTOMÁTICA
   Inicia quando o DOM estiver pronto
   ---------------------------------------- */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarEsqueciSenha);
} else {
    inicializarEsqueciSenha();
}