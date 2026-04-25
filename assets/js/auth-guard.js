/* ================================================
   JEICI VIEIRA NAILS - PROTECTOR DE ROTAS
   Funções para proteger páginas autenticadas
   ================================================ */

/* ----------------------------------------
   VERIFICAR PÁGINA PROTEGIDA
   Verifica se usuário tem acesso à página
   e redireciona conforme role
   ---------------------------------------- */
async function verificarProtegida(paginaPermitida) {
  const usuario = firebase.auth().currentUser;
  
  console.log("[DEBUG auth-guard] Verificando proteção para:", paginaPermitida);
  console.log("[DEBUG auth-guard] Usuário:", usuario);
  
  // Se não está logado, redireciona para login
  if (!usuario) {
    console.log("[DEBUG auth-guard] Não logado, redirecionando para index.html");
    window.location.href = "../index.html";
    return null;
  }
  
  // Busca dados do usuário no Firestore
  const doc = await firebase.firestore().collection("usuarios").doc(usuario.uid).get();
  const dados = doc.data();
  
  console.log("[DEBUG auth-guard] Dados do usuário:", dados);
  
  // Se não há dados, redireciona
  if (!dados) {
    console.log("[DEBUG auth-guard] Sem dados, redirecionando para index.html");
    window.location.href = "./index.html";
    return null;
  }
  
  // Verifica role para admin
  if (paginaPermitida === "admin" && dados.role !== "admin") {
    console.log("[DEBUG auth-guard] Não é admin, redirecionando para dashboard.html");
    window.location.href = "dashboard.html";
    return null;
  }
  
  // Verifica role para cliente
  if (paginaPermitida === "cliente" && dados.role === "admin") {
    console.log("[DEBUG auth-guard] É admin, redirecionando para admin.html");
    window.location.href = "admin.html";
    return null;
  }
  
  console.log("[DEBUG auth-guard] Acesso permitido!");
  return dados;
}

/* ----------------------------------------
   VERIFICAR LOGIN
   Retorna Promise com dados do usuário
   ---------------------------------------- */
function verificarLogin() {
  return new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged(async (usuario) => {
      if (!usuario) {
        resolve(null);
        return;
      }
      
      const doc = await firebase.firestore().collection("usuarios").doc(usuario.uid).get();
      const dados = doc.data();
      resolve({ usuario, ...dados });
    });
  });
}

/* ----------------------------------------
   VERIFICAR SE É ADMIN
   Retorna true se usuário é admin
   ---------------------------------------- */
async function verificarAdmin() {
  const usuario = firebase.auth().currentUser;
  
  if (!usuario) return false;
  
  const doc = await firebase.firestore().collection("usuarios").doc(usuario.uid).get();
  const dados = doc.data();
  
  return dados?.role === "admin";
}

/* ----------------------------------------
   LOGOUT
   Encerra sessão e redireciona
   ---------------------------------------- */
async function logout() {
  console.log("[DEBUG auth-guard] Fazendo logout...");
  await firebase.auth().signOut();
  window.location.href = "./index.html";
}