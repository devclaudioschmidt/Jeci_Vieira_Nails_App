const https = require('https');
const admin = require('firebase-admin');

const DATABASE_URL = 'app-jeci-vieira-nails-default-rtdb.firebaseio.com';

admin.initializeApp();

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function sendResponse(res, statusCode, data) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Content-Type', 'application/json');
    res.status(statusCode).send(JSON.stringify(data));
}

function readFirebase(path) {
    return new Promise((resolve, reject) => {
        const url = `https://${DATABASE_URL}/${path}.json`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

function writeFirebase(path, data, method = 'PUT') {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: DATABASE_URL,
            path: `/${path}.json`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve(responseData);
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function deleteFirebase(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: DATABASE_URL,
            path: `/${path}.json`,
            method: 'DELETE'
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        
        req.on('error', reject);
        req.end();
    });
}

async function verifyAuth(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Auth verification failed:', error.message);
        return null;
    }
}

async function sendFCMNotification(token, title, body, data = {}) {
    try {
        const message = {
            token: token,
            notification: { title: title, body: body },
            webpush: {
                notification: { title: title, body: body, icon: '/assets/icon-notification.png' },
                fcm_options: { link: data.url || '/cliente.html' }
            }
        };
        
        return await admin.messaging().send(message);
    } catch (error) {
        console.error('[FCM] Erro ao enviar:', error);
        return null;
    }
}

function normalizeDate(data) {
    if (!data) return null;
    if (typeof data === 'string') {
        data = data.trim();
        if (data.indexOf('/') > -1) {
            const parts = data.split(' ')[0].split('/');
            if (parts.length === 3) {
                if (parts[0].length === 2 && parts[2].length === 4) {
                    return parts[2] + '-' + parts[1] + '-' + parts[0];
                }
                return parts[0] + '-' + parts[1] + '-' + parts[2];
            }
        }
        if (data.indexOf(' ') > -1) return data.split(' ')[0];
        if (data.indexOf('T') > -1) return data.split('T')[0];
        return data;
    }
    return String(data).split(' ')[0];
}

function normalizeTime(hora) {
    if (!hora) return null;
    hora = String(hora).trim();
    if (hora.indexOf(':') === -1) {
        const h = parseInt(hora, 10);
        return (h < 10 ? '0' + h : h) + ':00';
    }
    const parts = hora.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) || 0;
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

module.exports = {
    DATABASE_URL,
    generateId,
    sendResponse,
    readFirebase,
    writeFirebase,
    deleteFirebase,
    verifyAuth,
    sendFCMNotification,
    normalizeDate,
    normalizeTime
};