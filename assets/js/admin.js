/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO ADMIN
   JavaScript para página do administrador
   ================================================ */

/* ----------------------------------------
   INICIALIZAÇÃO DO ADMIN
   Verifica autenticação e exibe dados do admin
   ---------------------------------------- */
function inicializarAdmin() {
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
            
            // Verifica se é admin, se não for redireciona
            if (dados.role !== 'admin') {
                status.textContent = 'Acesso restrito. Redirecionando...';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                return;
            }
            
            // Exibe página do admin
            exibirAdmin(dados);
            
        } catch (erro) {
            console.error('[DEBUG] Erro:', erro);
            status.textContent = 'Erro ao carregar: ' + erro.message;
        }
    });
}

/* ----------------------------------------
   EXIBIR ADMIN
   Renderiza a página com dados do admin
   ---------------------------------------- */
function exibirAdmin(dados) {
    document.body.innerHTML = `
        <div class="cardAdmin">
            <span class="badgeAdmin">ADMINISTRADOR</span>
            <h1 class="nomeUsuario">Olá, ${dados.nome}!</h1>
            <p class="mensagemWelcome">Você acessou a página do administrator.</p>
            <button class="botaoSair" id="btnSair">Sair</button>
        </div>
    `;
    
    // Adiciona evento ao botão sair
    document.getElementById('btnSair').addEventListener('click', async () => {
        await firebase.auth().signOut();
        window.location.href = '../index.html';
    });
}