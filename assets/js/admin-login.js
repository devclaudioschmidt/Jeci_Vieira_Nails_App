const formLogin = document.querySelector('.formularioLogin');
const mensagemFeedback = document.getElementById('mensagemFeedback');

function mostrarMensagem(texto, tipo) {
    if (!mensagemFeedback) return;
    mensagemFeedback.textContent = texto;
    mensagemFeedback.className = 'mensagemFeedback ' + tipo;
    mensagemFeedback.style.display = 'block';
    setTimeout(function() {
        mensagemFeedback.style.display = 'none';
    }, 5000);
}

function criarElementoFeedback() {
    const div = document.createElement('div');
    div.id = 'mensagemFeedback';
    div.className = 'mensagemFeedback';
    div.style.display = 'none';
    document.body.appendChild(div);
}

function inicializarAdminLogin() {
    if (!mensagemFeedback) {
        criarElementoFeedback();
    }

    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('campoEmail').value;
        const senha = document.getElementById('campoSenha').value;

        const botaoSubmit = formLogin.querySelector('button[type="submit"]');
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = 'Entrando...';

        const resultado = await loginUsuario(email, senha);

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
            if (resultado.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                mostrarMensagem('Acesso restrito para administradores.', 'erro');
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = 'Entrar';
                setTimeout(async () => {
                    await firebase.auth().signOut();
                }, 2000);
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAdminLogin);
} else {
    inicializarAdminLogin();
}
