/* ================================================
   LOGIN DE USUÁRIO
   Autentica usuário e retorna dados
   ================================================ */
async function loginUsuario(email, senha) {
  try {
    console.log("[DEBUG] Tentando login com:", email);
    
    // Definir persistência SESSION para manter login durante sessão do navegador
    // Funciona melhor em alguns navegadores/iOS
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
    
    // Autentica usuário no Firebase Auth
    const usuarioCredential = await firebase.auth().signInWithEmailAndPassword(email, senha);
    console.log("[DEBUG] Usuário autenticado:", usuarioCredential.user.uid);
    
    const uid = usuarioCredential.user.uid;
    console.log("[DEBUG] UID:", uid);

    // Busca dados do usuário no Firestore
    const usuarioDoc = await firebase.firestore().collection("usuarios").doc(uid).get();
    const dadosUsuario = usuarioDoc.data();
    
    console.log("[DEBUG] Dados do usuário:", dadosUsuario);
    console.log("[DEBUG] Role:", dadosUsuario?.role);

    // Verifica se encontrou dados
    if (!dadosUsuario) {
      console.error("[ERRO] Usuário não encontrado no Firestore");
      return { sucesso: false, erro: "user-not-found" };
    }

    console.log("[DEBUG] Login realizado com sucesso!");

    // Retorna sucesso com dados do usuário
    return { sucesso: true, uid: uid, role: dadosUsuario.role };
  } catch (erro) {
    console.error("[ERRO] Login:", erro);
    return { sucesso: false, erro: erro.code };
  }
}

/* ================================================
   ENVIAR NOTIFICAÇÃO
   Envia notificação via Firestore (ação)
   ================================================ */
async function enviarNotificacao(uid, titulo, mensagem, tipo = 'info') {
  try {
    // Salvar notificação na collection
    await firebase.firestore().collection('notificacoes').add({
      uid: uid,
      titulo: titulo,
      mensagem: mensagem,
      tipo: tipo,
      lida: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("[DEBUG] Notificação salva para:", uid);
    
  } catch (erro) {
    console.error("[DEBUG] Erro ao enviar notificação:", erro);
  }
}

/* ----------------------------------------
   LOGOUT
   Encerra sessão do usuário
   ---------------------------------------- */
async function logout() {
  console.log("[DEBUG] Fazendo logout...");
  await firebase.auth().signOut();
  window.location.href = "index.html";
}

/* ----------------------------------------
   OBSERVAR AUTH
   Escuta mudanças no estado de autenticação
   ---------------------------------------- */
function observerAuth(callback) {
  firebase.auth().onAuthStateChanged(callback);
}

/* ----------------------------------------
   OBTER USUÁRIO ATUAL
   Retorna o usuário atualmente logado
   ---------------------------------------- */
function getUsuarioAtual() {
  return firebase.auth().currentUser;
}

/* ----------------------------------------
   OBTER DADOS DO USUÁRIO
   Retorna dados do usuário do Firestore
   ---------------------------------------- */
async function getDadosUsuario() {
  const usuario = firebase.auth().currentUser;
  if (!usuario) return null;
  
  const doc = await firebase.firestore().collection("usuarios").doc(usuario.uid).get();
  return doc.data();
}