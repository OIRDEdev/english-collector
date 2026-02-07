/**
 * Offscreen SSE Worker
 * Performs the SSE connection handling within the Offscreen Document.
 * 
 * IMPORTANT: Offscreen does NOT have access to chrome.storage!
 * It only sends messages to the Service Worker which saves the data.
 */
import { config } from "../Shared/config.js";

(function() {
    'use strict';

    // SSE URL from config or default
    const SSE_URL = config.apiUrl ? `${config.apiUrl}/api/v1/sse/translations` : 'http://localhost:8080/api/v1/sse/translations';

    let eventSource = null;
    let connected = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    /**
     * Connects to the SSE server
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

            // Translation received - send to Service Worker to save
            eventSource.addEventListener('translation', (e) => {
                const event = JSON.parse(e.data);
                console.log('[Offscreen SSE] Translation received:', event.payload);
                
                // Send to Service Worker to save in storage
                sendToServiceWorker('translation-received', event.payload);
            });

            // Translation error
            eventSource.addEventListener('translation_error', (e) => {
                const event = JSON.parse(e.data);
                console.log('[Offscreen SSE] Translation error:', event.payload);
                sendToServiceWorker('translation-error', event.payload);
            });

            // Ping - keep-alive only
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
     * Disconnects from SSE server
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
     * Attempts to reconnect with exponential backoff
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
     * Sends message to Service Worker
     * @param {string} event - Event name
     * @param {Object} data - Event data
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
     * Listens for messages from Service Worker
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
