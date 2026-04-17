importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCyvIn4WQ2bMmzkLOuiiCpftCGFjRMWef8",
  authDomain: "app-jeci-vieira-nails.firebaseapp.com",
  databaseURL: "https://app-jeci-vieira-nails-default-rtdb.firebaseio.com",
  projectId: "app-jeci-vieira-nails",
  storageBucket: "app-jeci-vieira-nails.firebasestorage.app",
  messagingSenderId: "327805471060",
  appId: "1:327805471060:web:3a36e862601000dd95a0c1",
  measurementId: "G-JSG7JRN1H7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Jeci Vieira Nails';
  const notificationOptions = {
    body: payload.notification?.body || 'Nova notificação',
    icon: '/assets/icon-notification.png',
    badge: '/assets/icon-badge.png',
    tag: 'jeci-notification',
    renotify: true,
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/cliente.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});