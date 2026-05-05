/* ================================================
   LOGIN DE USUÁRIO
   Autentica usuário e retorna dados
   ================================================ */
async function loginUsuario(email, senha) {
  try {
    console.log("[DEBUG] Tentando login com:", email);
    
    // Definir persistência LOCAL para manter login após fechar navegador
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    
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
   CADASTRAR USUÁRIO
   Cria conta Firebase Auth + documento no Firestore
   Verifica duplicação por telefone
   ---------------------------------------- */
async function cadastrarUsuario(email, senha, nome, telefone = '') {
    try {
        let userId = null;
        let usuarioExistenteDoc = null;
        
        // VERIFICAR se foi passado telefone
        if (telefone && telefone.trim() !== '') {
            const telLimpo = telefone.replace(/\D/g, '');
            console.log('[DEBUG] Verificando se telefone já existe:', telLimpo);
            
            const existenteSnap = await firebase.firestore().collection('usuarios')
                .where('telefone', '==', telefone)
                .limit(1)
                .get();
            
            if (!existenteSnap.empty) {
                // ENCONTROU! Usar documento existente
                usuarioExistenteDoc = existenteSnap.docs[0];
                userId = usuarioExistenteDoc.id;
                
                console.log('[DEBUG] Usuário já existia com este telefone. ID:', userId);
                
                // Criar conta Firebase Auth para este usuário
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, senha);
                const novoUid = userCredential.user.uid;
                
                // Atualizar documento existente com novo uid e email
                await firebase.firestore().collection('usuarios').doc(userId).update({
                    email: email,
                    uidAuth: novoUid, // Vincular ao Auth
                    dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('[DEBUG] Documento atualizado com novo uid:', novoUid);
                
                return { sucesso: true };
            }
        }
        
        // SE NÃO ENCONTROU (ou não tem telefone), fluxo normal
        console.log('[DEBUG] Criando novo usuário do zero...');
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, senha);
        userId = userCredential.user.uid;
        
        const dadosUsuario = {
            nome: nome,
            email: email,
            telefone: telefone || '',
            role: 'cliente',
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await firebase.firestore().collection('usuarios').doc(userId).set(dadosUsuario);
        
        return { sucesso: true };
        
    } catch (erro) {
        console.error('[DEBUG] Erro no cadastro:', erro);
        return { sucesso: false, erro: erro.code };
    }
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