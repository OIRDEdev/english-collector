/**
 * Offscreen SSE Worker
 * Mantém conexão SSE ativa mesmo quando popup está fechado
 * 
 * IMPORTANTE: Offscreen NÃO tem acesso a chrome.storage!
 * Apenas envia mensagens para o Service Worker que salva os dados.
 */
(function() {
    'use strict';

    const SSE_URL = 'http://localhost:8080/api/v1/sse/translations';

    let eventSource = null;
    let connected = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    /**
     * Conecta ao servidor SSE
     */
    function connect() {
        if (eventSource) {
            disconnect();
        }

        console.log('[Offscreen SSE] Connecting to:', SSE_URL);

        try {
            eventSource = new EventSource(SSE_URL);

            eventSource.addEventListener('open', () => {
                console.log('[Offscreen SSE] Connected');
                connected = true;
                reconnectAttempts = 0;
                sendToServiceWorker('sse-connected', null);
            });

            eventSource.addEventListener('connected', (e) => {
                const data = JSON.parse(e.data);
                console.log('[Offscreen SSE] Client ID:', data.client_id);
            });

            // Tradução recebida - envia para Service Worker salvar
            eventSource.addEventListener('translation', (e) => {
                const event = JSON.parse(e.data);
                console.log('[Offscreen SSE] Translation received:', event.payload);
                
                // Envia para o Service Worker salvar no storage
                sendToServiceWorker('translation-received', event.payload);
            });

            // Erro de tradução
            eventSource.addEventListener('translation_error', (e) => {
                const event = JSON.parse(e.data);
                console.log('[Offscreen SSE] Translation error:', event.payload);
                sendToServiceWorker('translation-error', event.payload);
            });

            // Ping - apenas keep-alive
            eventSource.addEventListener('ping', () => {
                // Keep-alive, no action needed
            });

            eventSource.addEventListener('error', (e) => {
                console.warn('[Offscreen SSE] Connection error:', e);
                connected = false;
                sendToServiceWorker('sse-disconnected', null);
                attemptReconnect();
            });

        } catch (err) {
            console.error('[Offscreen SSE] Failed to connect:', err);
            attemptReconnect();
        }
    }

    /**
     * Desconecta do servidor SSE
     */
    function disconnect() {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
            connected = false;
            console.log('[Offscreen SSE] Disconnected');
        }
    }

    /**
     * Tenta reconectar com backoff exponencial
     */
    function attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('[Offscreen SSE] Max reconnection attempts reached');
            sendToServiceWorker('sse-max-retries', null);
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
        reconnectAttempts++;
        
        console.log(`[Offscreen SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
        
        setTimeout(connect, delay);
    }

    /**
     * Envia mensagem para o Service Worker
     * @param {string} event - Nome do evento
     * @param {Object} data - Dados do evento
     */
    function sendToServiceWorker(event, data) {
        chrome.runtime.sendMessage({
            type: 'offscreen-sse',
            event: event,
            data: data
        }).catch((err) => {
            console.warn('[Offscreen SSE] Error sending to SW:', err);
        });
    }

    /**
     * Ouve mensagens do Service Worker
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.target !== 'offscreen') return;

        switch (message.type) {
            case 'connect':
                connect();
                sendResponse({ success: true });
                break;

            case 'disconnect':
                disconnect();
                sendResponse({ success: true });
                break;

            case 'status':
                sendResponse({ connected, reconnectAttempts });
                break;

            default:
                sendResponse({ error: 'Unknown message type' });
        }

        return true;
    });

    // Auto-connect on load
    console.log('[Offscreen SSE] Starting...');
    connect();

})();
