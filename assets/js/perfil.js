/* ================================================
   JEICI VIEIRA NAILS - PERFIL DO USUÁRIO
   JavaScript para página de perfil do cliente
   ================================================ */

// ============================================
// ESTRUTURA HTML DA PÁGINA
// ============================================
const estruturaPerfilHTML = `
    <!-- Mensagem de feedback -->
    <div class="mensagemFeedback" id="mensagemFeedback" style="display: none;"></div>
    
    <!-- Header fixo -->
    <header class="header-perfil">
        <a href="dashboard.html" class="logo-header">
            <img src="../data/img/Logo_JeciVieira_NailsDesigner.svg" alt="Jeci Vieira Nails" class="imagem-logo-topo">
        </a>
        <a href="dashboard.html" class="botao-voltar">←</a>
    </header>
    
    <!-- Container principal -->
    <main class="container-perfil">
        
        <h1 class="titulo-pagina">Meu Perfil</h1>
        <p class="subtitulo-pagina">Atualize seus dados de contato</p>
        
        <!-- Card de perfil -->
        <div class="card-perfil">
            <h2 class="titulo-card">Dados Pessoais</h2>
            
            <!-- Formulário de perfil -->
            <form id="formPerfil">
                
                <!-- Campo: Nome -->
                <div class="campo-formulario-perfil">
                    <label class="label-campo-perfil" for="campoNome">Nome Completo</label>
                    <input type="text" id="campoNome" name="nome" 
                        class="input-campo-perfil" 
                        placeholder="Seu nome completo" autocomplete="name">
                </div>
                
                <!-- Campo: Email (apenas leitura) -->
                <div class="campo-formulario-perfil">
                    <label class="label-campo-perfil" for="campoEmail">E-mail</label>
                    <input type="email" id="campoEmail" name="email" 
                        class="input-campo-perfil input-campo-perfil.somente-leitura" 
                        placeholder="seu@email.com" autocomplete="email" readonly>
                </div>
                
                <!-- Campo: Telefone -->
                <div class="campo-formulario-perfil">
                    <label class="label-campo-perfil" for="campoTelefone">Telefone</label>
                    <input type="tel" id="campoTelefone" name="telefone" 
                        class="input-campo-perfil" 
                        placeholder="(11) 99999-9999" autocomplete="tel">
                </div>
                
                <!-- Campo: Data de Nascimento -->
                <div class="campo-formulario-perfil">
                    <label class="label-campo-perfil" for="campoDataNascimento">Data de Nascimento</label>
                    <input type="text" id="campoDataNascimento" name="dataNascimento" 
                        class="input-campo-perfil" 
                        placeholder="DD/MM/AAAA" autocomplete="bday">
                </div>
                
                <!-- Botão de salvar -->
                <button type="submit" class="botao-salvar-perfil">
                    Salvar Alterações
                </button>
            </form>
            
            <!-- Link para voltar -->
            <div class="link-voltar">
                <a href="dashboard.html">← Voltar ao Dashboard</a>
            </div>
            
            <!-- Status -->
            <p id="status" style="display: none;"></p>
        </div>
    </main>
`;

// ============================================
// INICIALIZAÇÃO DA PÁGINA
// Verifica autenticação e renderiza estrutura
// ============================================
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
        
        // Renderiza estrutura
        renderizarEstruturaPerfil();
    });
}

// ============================================
// RENDERIZAR ESTRUTURA
// Substitui conteúdo do body pelo HTML do perfil
// ============================================
function renderizarEstruturaPerfil() {
    document.body.innerHTML = estruturaPerfilHTML;
    
    // Inicializa eventos e carrega dados
    inicializarPerfil();
}

// ============================================
// CARREGAR DADOS DO PERFIL
// Busca dados do usuário logado no Firestore
// ============================================
async function carregarDadosPerfil() {
    const status = document.getElementById('status');
    
    try {
        const usuario = firebase.auth().currentUser;
        if (!usuario) return;
        
        const doc = await firebase.firestore().collection('usuarios').doc(usuario.uid).get();
        const dados = doc.data();
        
        if (!dados) {
            status.textContent = 'Dados do usuário não encontrados.';
            return;
        }
        
        // Preenche os campos
        document.getElementById('campoNome').value = dados.nome || '';
        document.getElementById('campoEmail').value = dados.email || '';
        document.getElementById('campoTelefone').value = dados.telefone || '';
        document.getElementById('campoDataNascimento').value = dados.dataNascimento || '';
        
        status.style.display = 'none';
        
    } catch (erro) {
        console.error('[DEBUG] Erro ao carregar dados:', erro);
        status.textContent = 'Erro ao carregar dados: ' + erro.message;
    }
}

// ============================================
// MOSTRAR MENSAGEM
// Exibe mensagem de feedback na tela
// ============================================
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

// ============================================
// VALIDAR TELEFONE
// Valida formato brasileiro de telefone
// Retorna true se válido, false se inválido
// ============================================
function validarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length < 10 || numeros.length > 11) {
        return false;
    }
    return true;
}

// ============================================
// FORMATA TELEFONE
// Aplica máscara de formato brasileiro
// Exemplo: (11) 99999-9999
// ============================================
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

// ============================================
// VALIDAR DATA
// Valida formato brasileiro de data
// Retorna true se válido, false se inválido
// ============================================
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

// ============================================
// FORMATAR DATA
// Aplica máscara de data brasileira
// Exemplo: DD/MM/AAAA
// ============================================
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

// ============================================
// SALVAR DADOS DO PERFIL
// Salva dados no Firestore
// ============================================
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
    
    // Validações
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
    
    // Desabilita botão
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
        
        await firebase.firestore().collection('usuarios').doc(usuario.uid).set(dadosAtualizar, { merge: true });
        
        mostrarMensagem('Dados salvos com sucesso!', 'sucesso');
        
    } catch (erro) {
        console.error('[ERRO] Salvar perfil:', erro);
        mostrarMensagem('Erro ao salvar: ' + erro.message, 'erro');
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = 'Salvar';
    }
}

// ============================================
// INICIALIZAR PERFIL
// Configura eventos da página
// ============================================
function inicializarPerfil() {
    const formPerfil = document.getElementById('formPerfil');
    const campoTelefone = document.getElementById('campoTelefone');
    const campoData = document.getElementById('campoDataNascimento');
    
    // Máscara de telefone
    if (campoTelefone) {
        campoTelefone.addEventListener('input', function() {
            formatarTelefone(this);
        });
    }
    
    // Máscara de data
    if (campoData) {
        campoData.addEventListener('input', function() {
            formatarData(this);
        });
    }
    
    // Submit do formulário
    if (formPerfil) {
        formPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarDadosPerfil();
        });
    }
    
    // Carrega dados
    carregarDadosPerfil();
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// Inicia quando o DOM estiver pronto
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPaginaPerfil);
} else {
    inicializarPaginaPerfil();
}