// Configurações do Firebase para Cloud Functions
// SUBSTITUA PELA SUA CHAVE REAL DO FIREBASE CONSOLE

module.exports = {
  FCM_SERVER_KEY: 'SUA_CHAVE_FCM_AQUI',
  DATABASE_URL: 'app-jeci-vieira-nails-default-rtdb.firebaseio.com'
};

// Para obter a FCM Server Key:
// 1. Acesse o Console do Firebase: https://console.firebase.google.com
// 2. Selecione o projeto: app-jeci-vieira-nails
// 3. Vá em Configurações do Projeto (ícone de engrenagem)
// 4. Clique em "Cloud Messaging"
// 5. Copie a "Chave do servidor" (Server key)
// 6. Substitua o valor em cima