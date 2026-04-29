/* ================================================
   LOGIN DE USUÁRIO
   Autentica usuário e retorna dados
   ================================================ */
async function loginUsuario(email, senha) {
  try {
    console.log("[DEBUG] Tentando login com:", email);
    
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

    // Solicitar permissão de notificação e salvar token
    await salvarTokenFCM(uid, dadosUsuario.role);
    
    console.log("[DEBUG] Login realizado com sucesso!");

    // Retorna sucesso com dados do usuário
    return { sucesso: true, uid: uid, role: dadosUsuario.role };
  } catch (erro) {
    console.error("[ERRO] Login:", erro);
    return { sucesso: false, erro: erro.code };
  }
}

/* ================================================
   SALVAR TOKEN FCM
   Solicita permissão e salva token para push notifications
   ================================================ */
async function salvarTokenFCM(uid, role) {
  try {
    // Verificar se o navegador suporta notifications
    if (!('Notification' in window)) {
      console.log("[DEBUG] Browser não suporta notifications");
      return;
    }
    
    // Verificar se já tem permissão
    let permissao = Notification.permission;
    
    // Se não foi negada, solicitar
    if (permissao === 'default') {
      permissao = await Notification.requestPermission();
    }
    
    // Se não permitiu, sair
    if (permissao !== 'granted') {
      console.log("[DEBUG] Permissão de notificação negada:", permissao);
      return;
    }
    
    // Obter token do FCM
    const token = await firebase.messaging().getToken({
      vapidKey: "BEl62iUYgU4xLZd98NBXTMKjKjpPoPR1tY7W0tC5aZE"
    });
    
    if (!token) {
      console.log("[DEBUG] Token FCM não obtido");
      return;
    }
    
    console.log("[DEBUG] Token FCM obtido:", token.substring(0, 50) + "...");
    
    // Salvar token no Firestore
    await firebase.firestore().collection('tokens').doc(uid).set({
      token: token,
      role: role,
      uid: uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      platform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'web'
    });
    
    console.log("[DEBUG] Token FCM salvo no Firestore");
    
  } catch (erro) {
    console.error("[DEBUG] Erro ao salvar token FCM:", erro);
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

/* ================================================
   LOGIN DE USUÁRIO
   Autentica usuário e retorna dados
   ================================================ */
async function loginUsuario(email, senha) {
  try {
    console.log("[DEBUG] Tentando login com:", email);
    
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