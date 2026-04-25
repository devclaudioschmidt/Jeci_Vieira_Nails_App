/* ================================================
   JEICI VIEIRA NAILS - CONFIGURAÇÃO FIREBASE
   Configuração inicial do Firebase para o app
   ================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyAQnNczuAI-XZXpzLWsN3FsljeUsRXKyY8",
  authDomain: "jeci-vieira-nails.firebaseapp.com",
  projectId: "jeci-vieira-nails",
  storageBucket: "jeci-vieira-nails.firebasestorage.app",
  messagingSenderId: "570979627981",
  appId: "1:570979627981:web:87a39a89fb8075ffa00a84"
};

// Inicializa o Firebase com as configurações
firebase.initializeApp(firebaseConfig);

// Exporta instâncias de auth e firestore para uso global
// (Disponível como firebase.auth() e firebase.firestore())