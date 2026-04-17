const PushNotifications = {
  messaging: null,
  tokenKey: 'fcm_token',
  permissionKey: 'notification_permission',
  vapidKey: 'BIKDFUWEE9pfGmPoapc35jQjqx7cp6z1exO0q6Dv5W1VvvKHpubhwVfdgKZPn_QoWOCjTLS9wuu_LuksuSSnIq0',

  init: function() {
    if (!this.isSupported()) {
      console.warn('[Push] Push notifications not supported in this browser');
      return Promise.resolve(false);
    }

    if (!firebase.messaging.isSupported()) {
      console.warn('[Push] Firebase Messaging not supported');
      return Promise.resolve(false);
    }

    this.messaging = firebase.messaging({ vapidKey: this.vapidKey });
    this.messaging.useServiceWorkerRegistration(this.getServiceWorkerRegistration());

    this.messaging.onTokenRefresh(function() {
      console.log('[Push] Token refreshed');
      PushNotifications.saveToken();
    });

    this.messaging.onMessage(function(payload) {
      console.log('[Push] Foreground message received:', payload);
      PushNotifications.showForegroundNotification(payload);
    });

    return Promise.resolve(true);
  },

  getServiceWorkerRegistration: function() {
    if ('serviceWorker' in navigator) {
      return navigator.serviceWorker.register('./firebase-messaging-sw.js')
        .then(function(registration) {
          console.log('[Push] Service Worker registered:', registration);
          return registration;
        })
        .catch(function(error) {
          console.error('[Push] Service Worker registration failed:', error);
          return null;
        });
    }
    return Promise.resolve(null);
  },

  isSupported: function() {
    return 'Notification' in window && firebase.messaging.isSupported();
  },

  requestPermission: function() {
    return Notification.requestPermission()
      .then(function(permission) {
        console.log('[Push] Notification permission:', permission);
        localStorage.setItem(PushNotifications.permissionKey, permission);
        return permission === 'granted';
      })
      .catch(function(error) {
        console.error('[Push] Permission request failed:', error);
        return false;
      });
  },

  saveToken: function() {
    if (!this.messaging) {
      console.warn('[Push] Messaging not initialized');
      return Promise.resolve(null);
    }

    return this.messaging.getToken()
      .then(function(token) {
        if (token) {
          console.log('[Push] FCM Token:', token);
          localStorage.setItem(PushNotifications.tokenKey, token);
          PushNotifications.sendTokenToServer(token);
          return token;
        }
        return null;
      })
      .catch(function(error) {
        console.error('[Push] Error getting token:', error);
        return null;
      });
  },

  sendTokenToServer: function(token) {
    const uid = localStorage.getItem('cliente_uid') || localStorage.getItem('admin_uid');
    const role = localStorage.getItem('admin_uid') ? 'admin' : 'cliente';

    if (!uid) {
      console.log('[Push] User not logged in, cannot save token');
      return;
    }

    const data = {
      uid: uid,
      token: token,
      role: role,
      timestamp: Date.now()
    };

    fetch(API_URL + '?action=saveFCMToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(res) { return res.json(); })
    .then(function(result) {
      console.log('[Push] Token saved to server:', result);
    })
    .catch(function(error) {
      console.error('[Push] Error saving token:', error);
    });
  },

  showForegroundNotification: function(payload) {
    const title = payload.notification?.title || 'Jeci Vieira Nails';
    const options = {
      body: payload.notification?.body || 'Nova notificação',
      icon: '/assets/icon-notification.png',
      badge: '/assets/icon-badge.png',
      tag: 'jeci-notification',
      renotify: true,
      data: payload.data || {}
    };

    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  },

  enable: async function() {
    const permitted = await this.requestPermission();
    if (permitted) {
      await this.init();
      return await this.saveToken();
    }
    return false;
  },

  disable: function() {
    if (this.messaging) {
      this.messaging.getToken()
        .then(function(token) {
          if (token) {
            PushNotifications.deleteToken(token);
          }
        });
    }
    localStorage.removeItem(this.tokenKey);
  },

  deleteToken: function(token) {
    const uid = localStorage.getItem('cliente_uid') || localStorage.getItem('admin_uid');
    if (!uid || !token) return;

    fetch(API_URL + '?action=removeFCMToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: uid,
        token: token
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(result) {
      console.log('[Push] Token removed from server:', result);
    })
    .catch(function(error) {
      console.error('[Push] Error removing token:', error);
    });
  },

  getPermissionStatus: function() {
    return Notification.permission;
  },

  isEnabled: function() {
    return localStorage.getItem(this.tokenKey) !== null;
  }
};

window.PushNotifications = PushNotifications;