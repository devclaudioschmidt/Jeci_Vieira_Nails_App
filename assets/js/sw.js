/* ================================================
   JEICI VIEIRA NAILS - SERVICE WORKER
   Permite funcionamento offline e cache de arquivos
   ================================================ */

/* ----------------------------------------
   CONFIGURAÇÕES DO CACHE
   Nome e versão do cache para controle de updates
   ---------------------------------------- */
const nomeCache = 'jeci-nails-cache-v2';

/* ----------------------------------------
   LISTA DE ARQUIVOS PARA CACHE
   Arquivos que serão armazenados em cache
   para funcionar offline
   ---------------------------------------- */
const listaArquivosCache = [
    './',
    './index.html',
    './css/style.css',
    './css/style-login.css',
    './assets/js/firebase-config.js',
    './assets/js/login.js',
    './assets/js/auth.js',
    './data/img/favicon.svg',
    './data/img/Logo_JeciVieira_NailsDesigner.svg',
    './data/img/login/img_login_01.png',
    './data/img/login/img_login_02.png',
    './data/img/icons/icon-192x192.svg',
    './data/img/icons/icon-512x512.svg'
];

/* ----------------------------------------
   INSTALAÇÃO DO SERVICE WORKER
   Executado quando o SW é registrado pela
   primeira vez. Armazena os arquivos em cache.
   ---------------------------------------- */
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(nomeCache)
            .then((cache) => {
                console.log('[Service Worker] Armazenando arquivos em cache...');
                return cache.addAll(listaArquivosCache);
            })
            .then(() => {
                console.log('[Service Worker] Instalação concluída!');
                return self.skipWaiting();
            })
            .catch((erro) => {
                console.error('[Service Worker] Erro ao instalar cache:', erro);
            })
    );
});

/* ----------------------------------------
   ATIVAÇÃO DO SERVICE WORKER
   Executado quando o SW é ativado.
   Limpa caches antigos se houver atualização.
   ---------------------------------------- */
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((listaCaches) => {
                console.log('[Service Worker] Limpando caches antigos...');
                return Promise.all(
                    listaCaches.map((nomeCacheAntigo) => {
                        if (nomeCacheAntigo !== nomeCache) {
                            console.log('[Service Worker] Removendo cache antigo:', nomeCacheAntigo);
                            return caches.delete(nomeCacheAntigo);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Ativação concluída!');
                return self.clients.claim();
            })
            .catch((erro) => {
                console.error('[Service Worker] Erro ao ativar:', erro);
            })
    );
});

/* ================================================
   ESTRATÉGIA DE CACHE - NETWORK FIRST
   Primeiro tenta buscar da rede (dados frescos),
   se falhar, usa cache como backup.
   Mantém usuário logado e dados atualizados.
   ================================================ */
self.addEventListener('fetch', (evento) => {
    // Ignora requisições do Firebase e APIs externas
    if (evento.request.url.includes('firebase') || 
        evento.request.url.includes('googleapis') ||
        evento.request.url.includes('gstatic')) {
        return;
    }
    
    evento.respondWith(
        fetch(evento.request)
            .then((respostaRede) => {
                // Verifica se é resposta válida
                if (!respostaRede || respostaRede.status !== 200 || respostaRede.type !== 'basic') {
                    return respostaRede;
                }
                
                // Clona e armazena no cache para uso offline
                const respostaParaCache = respostaRede.clone();
                caches.open(nomeCache)
                    .then((cache) => {
                        cache.put(evento.request, respostaParaCache);
                    });
                
                console.log('[Service Worker] Servindo da rede:', evento.request.url);
                return respostaRede;
            })
            .catch(() => {
                // Se rede falhar, busca do cache
                return caches.match(evento.request)
                    .then((respostaCache) => {
                        if (respostaCache) {
                            console.log('[Service Worker] Servindo do cache:', evento.request.url);
                        }
                        return respostaCache;
                    });
            })
            .catch((erro) => {
                console.error('[Service Worker] Erro no fetch:', erro);
            })
    );
});