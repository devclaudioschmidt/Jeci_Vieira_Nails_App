const estruturaPerfilHTML = `
    <div class="mensagemFeedback" id="mensagemFeedback" style="display: none;"></div>

    <header class="header-perfil">
        <a href="dashboard.html" class="logo-header">
            <img src="../data/img/Logo_JeciVieira_NailsDesigner.svg" alt="Jeci Vieira Nails" class="imagem-logo-topo">
        </a>
        <a href="dashboard.html" class="botao-voltar">←</a>
    </header>

    <main class="container-perfil">

        <h1 class="titulo-pagina">Meu Perfil</h1>
        <p class="subtitulo-pagina">Atualize seus dados de contato</p>

        <div class="card-perfil">
            <h2 class="titulo-card">Dados Pessoais</h2>

            <form id="formPerfil">

                <div class="campo-formulario-perfil">
                    <label class="label-campo-perfil" for="campoNome">Nome Completo</label>
                    <input type="text" id="campoNome" name="nome"
                        class="input-campo-perfil"
                        placeholder="Seu nome completo" autocomplete="name">
                </div>

                <div class="campo-formulario-perfil">
                    <label class="label-campo-perfil" for="campoEmail">E-mail</label>
                    <input type="email" id="campoEmail" name="email"
                        class="input-campo-perfil input-campo-perfil.somente-leitura"
                        placeholder="seu@email.com" autocomplete="email" readonly>
                </div>

                <div class="campo-formulario-perfil">
                    <label class="label-campo-perfil" for="campoTelefone">Telefone</label>
                    <input type="tel" id="campoTelefone" name="telefone"
                        class="input-campo-perfil"
                        placeholder="(11) 99999-9999" autocomplete="tel">
                </div>

                <div class="campo-formulario-perfil">
                    <label class="label-campo-perfil" for="campoDataNascimento">Data de Nascimento</label>
                    <input type="text" id="campoDataNascimento" name="dataNascimento"
                        class="input-campo-perfil"
                        placeholder="DD/MM/AAAA" autocomplete="bday">
                </div>

                <button type="submit" class="botao-salvar-perfil">
                    Salvar Alterações
                </button>
            </form>

            <div class="link-voltar">
                <a href="dashboard.html">← Voltar ao Dashboard</a>
            </div>

            <p id="status" style="display: none;"></p>
        </div>
    </main>
`;

function inicializarPaginaPerfil() {
    const status = document.getElementById('status');

    firebase.auth().onAuthStateChanged(async (usuario) => {
        if (!usuario) {
            status.textContent = 'Você precisa estar logado. Redirecionando...';
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            return;
        }

        renderizarEstruturaPerfil();
    });
}

function renderizarEstruturaPerfil() {
    document.body.innerHTML = estruturaPerfilHTML;

    inicializarPerfil();

    inicializarRefreshPerfil();
}

async function inicializarRefreshPerfil() {
    await inicializarRefresh('perfil', refreshPerfilCompleto);

    const header = document.querySelector('.header-perfil');
    if (header) {
        const logoHeader = header.querySelector('.logo-header');
        const botaoVoltar = header.querySelector('.botao-voltar');

        if (logoHeader && botaoVoltar && !header.querySelector('.botoes-header')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'botoes-header';
            header.insertBefore(wrapper, logoHeader.nextSibling);
            wrapper.appendChild(botaoVoltar);
        }
    }

    document.removeEventListener('visibilitychange', globalRefreshPage);
    document.addEventListener('visibilitychange', globalRefreshPage);

    window.globalRefreshPage = refreshPerfilCompleto;

    const headerParaBotao = document.querySelector('.header-perfil');
    if (headerParaBotao) {
        adicionarBotaoRefreshHeader(headerParaBotao, refreshPerfilCompleto);
    }
}

async function refreshPerfilCompleto() {
    const botao = document.getElementById('btn-header-refresh');

    try {
        mostrarFeedbackRefresh(true, 'refresh');
        if (botao) {
            botao.classList.add('animando');
        }

        const usuario = await firebase.auth().currentUser;
        if (!usuario) {
            window.location.href = '../index.html';
            return;
        }

        const resultado = await firestoreService.carregarUsuario(usuario.uid);

        if (resultado.success && resultado.data) {
            document.getElementById('campoNome').value = resultado.data.nome || '';
            document.getElementById('campoEmail').value = resultado.data.email || '';
            document.getElementById('campoTelefone').value = resultado.data.telefone || '';
            document.getElementById('campoDataNascimento').value = resultado.data.dataNascimento || '';
        }

        if (botao) {
            setTimeout(() => {
                botao.classList.remove('animando');
            }, 1000);
        }

        mostrarAlertaRefresh('Atualizado', 'Dados recarregados com sucesso!', 'sucesso');

    } catch (erro) {
        console.error('[Perfil] Erro no refresh:', erro);
        mostrarAlertaRefresh('Erro', 'Falha ao recarregar dados.', 'erro');
    } finally {
        mostrarFeedbackRefresh(false);
    }
}


async function carregarDadosPerfil() {
    const status = document.getElementById('status');

    try {
        const usuario = firebase.auth().currentUser;
        if (!usuario) return;

        const resultado = await firestoreService.carregarUsuario(usuario.uid);
        const dados = resultado.success ? resultado.data : null;

        if (!dados) {
            status.textContent = 'Dados do usuário não encontrados.';
            return;
        }

        document.getElementById('campoNome').value = dados.nome || '';
        document.getElementById('campoEmail').value = dados.email || '';
        document.getElementById('campoTelefone').value = dados.telefone || '';
        document.getElementById('campoDataNascimento').value = dados.dataNascimento || '';

        status.style.display = 'none';

    } catch (erro) {
        console.error('[Perfil] Erro ao carregar dados:', erro);
        status.textContent = 'Erro ao carregar dados: ' + erro.message;
    }
}

function mostrarMensagem(texto, tipo) {
    const mensagemFeedback = document.getElementById('mensagemFeedback');
    if (!mensagemFeedback) return;

    mensagemFeedback.textContent = texto;
    mensagemFeedback.className = 'mensagemFeedback ' + tipo;
    mensagemFeedback.style.display = 'block';
    setTimeout(function() {
        mensagemFeedback.style.display = 'none';
    }, 5000);
}

function validarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length < 10 || numeros.length > 11) {
        return false;
    }
    return true;
}

function formatarTelefone(input) {
    let valor = input.value;
    valor = valor.replace(/\D/g, '');

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

function validarData(data) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(data)) {
        return false;
    }

    const partes = data.split('/');
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (dia < 1 || dia > 31) return false;
    if (mes < 1 || mes > 12) return false;
    if (ano < 1900 || ano > new Date().getFullYear()) return false;

    return true;
}

function formatarData(input) {
    let valor = input.value;
    valor = valor.replace(/\D/g, '');

    if (valor.length > 0) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2);
    }
    if (valor.length > 5) {
        valor = valor.substring(0, 5) + '/' + valor.substring(5, 9);
    }

    input.value = valor;
}

async function salvarDadosPerfil() {
    const usuario = firebase.auth().currentUser;
    if (!usuario) {
        mostrarMensagem('Usuário não está logado.', 'erro');
        return;
    }

    const nome = document.getElementById('campoNome').value.trim();
    const email = document.getElementById('campoEmail').value.trim();
    const telefone = document.getElementById('campoTelefone').value.trim();
    const dataNascimento = document.getElementById('campoDataNascimento').value.trim();

    if (!nome) {
        mostrarMensagem('Nome é obrigatório.', 'erro');
        return;
    }

    if (!email || !email.includes('@')) {
        mostrarMensagem('Email inválido.', 'erro');
        return;
    }

    if (telefone && !validarTelefone(telefone)) {
        mostrarMensagem('Telefone inválido. Use formato: (11) 99999-9999', 'erro');
        return;
    }

    if (dataNascimento && !validarData(dataNascimento)) {
        mostrarMensagem('Data de nascimento inválida. Use formato: DD/MM/AAAA', 'erro');
        return;
    }

    const formPerfil = document.getElementById('formPerfil');
    const botaoSalvar = formPerfil.querySelector('button[type="submit"]');
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = 'Salvando...';

    try {
        const dadosAtualizar = {
            nome: nome,
            email: email
        };
        if (telefone) dadosAtualizar.telefone = telefone;
        if (dataNascimento) dadosAtualizar.dataNascimento = dataNascimento;

        const resultado = await firestoreService.atualizarUsuario(usuario.uid, dadosAtualizar);

        if (resultado.success) {
            mostrarMensagem('Dados salvos com sucesso!', 'sucesso');
        } else {
            throw new Error(resultado.error?.message || 'Erro ao salvar');
        }

    } catch (erro) {
        console.error('[Perfil] Erro ao salvar:', erro);
        mostrarMensagem('Erro ao salvar: ' + erro.message, 'erro');
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = 'Salvar';
    }
}

function inicializarPerfil() {
    const formPerfil = document.getElementById('formPerfil');
    const campoTelefone = document.getElementById('campoTelefone');
    const campoData = document.getElementById('campoDataNascimento');

    if (campoTelefone) {
        campoTelefone.addEventListener('input', function() {
            formatarTelefone(this);
        });
    }

    if (campoData) {
        campoData.addEventListener('input', function() {
            formatarData(this);
        });
    }

    if (formPerfil) {
        formPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarDadosPerfil();
        });
    }

    carregarDadosPerfil();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPaginaPerfil);
} else {
    inicializarPaginaPerfil();
}
