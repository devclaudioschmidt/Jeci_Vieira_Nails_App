/* ================================================
   JEICI VIEIRA NAILS - LÓGICA DO DASHBOARD
   JavaScript para página do cliente logado
   ================================================ */

/* ----------------------------------------
   INICIALIZAÇÃO DO DASHBOARD
   Verifica autenticação e exibe dados do usuário
   ---------------------------------------- */
function inicializarDashboard() {
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
            
            // Se role for admin, redireciona para área admin
            if (dados.role === 'admin') {
                status.textContent = 'Redirecionando para área admin...';
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                return;
            }
            
            // Exibe página do cliente
            exibirDashboard(dados);
            
        } catch (erro) {
            console.error('[DEBUG] Erro:', erro);
            status.textContent = 'Erro ao carregar: ' + erro.message;
        }
    });
}

/* ----------------------------------------
   EXIBIR DASHBOARD
   Renderiza a página com dados do usuário
   ---------------------------------------- */
function exibirDashboard(dados) {
    document.body.innerHTML = `
        <div class="cardDashboard">
            <h1 class="nomeUsuario">Olá, ${dados.nome}!</h1>
            <p class="mensagemWelcome">Você acessou a página do cliente.</p>
            <button class="botaoSair" id="btnSair">Sair</button>
        </div>
    `;
    
    // Adiciona evento ao botão sair
    document.getElementById('btnSair').addEventListener('click', async () => {
        await firebase.auth().signOut();
        window.location.href = '../index.html';
    });
}