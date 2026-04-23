const PushNotifications = {
  messaging: null,
  tokenKey: 'fcm_token',
  permissionKey: 'notification_permission',

  init: function() {
    return new Promise((resolve) => {
      if (!('Notification' in window)) {
        console.warn('[Push] Notifications not supported');
        resolve(false);
        return;
      }
      
      try {
        this.messaging = firebase.messaging();
        
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('./firebase-messaging-sw.js')
            .then(reg => console.log('[Push] Service Worker registered'))
            .catch(err => console.warn('[Push] SW registration failed:', err));
        }
        
        resolve(true);
      } catch(e) {
        console.warn('[Push] Firebase Messaging error:', e);
        resolve(false);
      }
    });
  },

  requestPermission: function() {
    return Notification.requestPermission()
      .then(permission => {
        console.log('[Push] Permission:', permission);
        return permission === 'granted';
      })
      .catch(error => {
        console.error('[Push] Error:', error);
        return false;
      });
  },

  saveToken: function() {
    if (!this.messaging) return Promise.resolve(null);
    
    return this.messaging.getToken()
      .then(token => {
        if (token) {
          console.log('[Push] Token obtained');
          localStorage.setItem(this.tokenKey, token);
          this.sendTokenToServer(token);
          return token;
        }
        return null;
      })
      .catch(err => {
        console.warn('[Push] getToken error:', err);
        return null;
      });
  },

  sendTokenToServer: function(token) {
    const uid = localStorage.getItem('cliente_uid') || localStorage.getItem('admin_uid');
    if (!uid) return;
    
    const role = localStorage.getItem('admin_uid') ? 'admin' : 'cliente';
    
    fetch(API_URL + '?action=saveFCMToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, role })
    })
    .then(res => res.json())
    .then(result => console.log('[Push] Token saved:', result))
    .catch(err => console.warn('[Push] Save error:', err));
  },

  showForegroundNotification: function(payload) {
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'Jeci Nails', {
        body: payload.notification?.body || 'Nova mensagem'
      });
    }
  },

  getPermissionStatus: function() {
    return Notification.permission;
  },

  isEnabled: function() {
    return localStorage.getItem(this.tokenKey) !== null;
  }
};

window.PushNotifications = PushNotifications;