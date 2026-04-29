/* ================================================
   FIREBASE MESSAGING SERVICE WORKER
   Para receiveber push notifications mesmo com app fechado
   ================================================ */

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configuração do Firebase (mesma do app)
firebase.initializeApp({
  apiKey: "AIzaSyAQnNczuAI-XZXpzLWsN3FsljeUsRXKyY8",
  authDomain: "jeci-vieira-nails.firebaseapp.com",
  projectId: "jeci-vieira-nails",
  storageBucket: "jeci-vieira-nails.firebasestorage.app",
  messagingSenderId: "570979627981",
  appId: "1:570979627981:web:87a39a89fb8075ffa00a84"
});

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[FCM Service Worker] Received background message:', payload);

  const notificationTitle = payload.notification.title || 'Nova solicitação!';
  const notificationOptions = {
    body: payload.notification.body || 'Você tem uma nova solicitação de agendamento.',
    icon: '/assets/img/logo.png',
    badge: '/assets/img/badge-icon.png',
    tag: 'agendamento-notification',
    requireInteraction: true,
    data: {
      url: '/pages/admin/admin.html?solicitacoes'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Listen for messages when app is in background
self.addEventListener('push', function(event) {
  console.log('[FCM] Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('[FCM] Push data:', data);
  }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[FCM] Notification clicked:', event);
  
  event.notification.close();
  
  // Open the admin page when notification is clicked
  const urlToOpen = event.notification.data?.url || '/pages/admin/admin.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[FCM Service Worker] Initialized successfully');