import { DB } from "./js/db.js";
import { api } from "./js/api.js";

/**
 * Sentences Controller - Background Service Worker
 * Gerencia comunicação entre popup, content scripts e backend
 */

// Inicializa API com token salvo (se existir)
api.loadSavedAuth().then(loaded => {
    if (loaded) {
        console.log("[Controller] Auth token loaded");
    }
});

// ==================== OFFSCREEN SSE MANAGEMENT ====================

let creatingOffscreen = false;

/**
 * Verifica se o offscreen document existe
 * @returns {Promise<boolean>}
 */
async function hasOffscreenDocument() {
    const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    return contexts.length > 0;
}

/**
 * Cria o offscreen document se não existir
 */
async function setupOffscreen() {
    if (await hasOffscreenDocument()) {
        console.log("[Controller] Offscreen document already exists");
        return;
    }

    if (creatingOffscreen) {
        console.log("[Controller] Offscreen document creation in progress");
        return;
    }

    creatingOffscreen = true;

    try {
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL("offscreen.html"),
            reasons: ['BLOBS'],
            justification: 'Maintains SSE connection for real-time translation updates'
        });
        console.log("[Controller] Offscreen document created for SSE");
    } catch (err) {
        console.error("[Controller] Failed to create offscreen document:", err);
    } finally {
        creatingOffscreen = false;
    }
}

/**
 * Envia mensagem para o offscreen document
 * @param {string} type - Tipo da mensagem
 * @param {Object} data - Dados da mensagem
 */
async function sendToOffscreen(type, data = {}) {
    try {
        await setupOffscreen();
        return await chrome.runtime.sendMessage({
            target: 'offscreen',
            type,
            ...data
        });
    } catch (err) {
        console.warn("[Controller] Error sending to offscreen:", err);
        return null;
    }
}

// Inicia offscreen SSE na inicialização
setupOffscreen();

// ==================== UTILITY FUNCTIONS ====================

/**
 * Detecta streaming pela URL
 * @param {string} url - URL da tab
 * @returns {string}
 */
function detectSourceFromUrl(url) {
    if (!url) return "Unknown";
    
    const sources = {
        "youtube.com": "YouTube",
        "netflix.com": "Netflix",
        "primevideo.com": "Amazon Prime Video",
        "disneyplus.com": "Disney+",
        "hbomax.com": "Max (HBO)",
        "starplus.com": "Star+"
    };
    
    for (const [domain, name] of Object.entries(sources)) {
        if (url.includes(domain)) return name;
    }
    
    return "Unknown";
}

// ==================== KEYBOARD SHORTCUT ====================

// Atalho de teclado (Ctrl+Shift+H)
chrome.commands.onCommand.addListener((command) => {
    if (command !== "save-word") return;
    console.log("teste: ", command);
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        // Injeta GetContext primeiro
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["js/getcontext.js"]
        }, () => {
            console.log("teste 2: ", command);
            // Depois executa a captura do texto e contexto
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const selection = window.getSelection().toString();
                    let context = null;
                    let pageTitle = document.title || "";
                    console.log("undefined context: ", typeof GetContext);
                    if (typeof GetContext !== 'undefined') {
                        try {
                            const ctx = GetContext.getContext();
                            context = GetContext.getFormattedContext();
                            pageTitle = ctx.title || pageTitle;
                            console.log("[Shortcut] Context:", context);
                            console.log("[Shortcut] Page Title:", pageTitle);
                        } catch (e) {
                            console.warn("[Shortcut] Error getting context:", e);
                        }
                    }
                    
                    return { selection, context, pageTitle };
                }
            }, (result) => {
                const data = result?.[0]?.result;
                if (data?.selection) {
                    const source = detectSourceFromUrl(tab.url);
                    DB.add(data.selection, source, data.context, data.pageTitle);
                }
            });
        });
    });
});

// ==================== MESSAGE HANDLER ====================

// Handler de mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Ignora mensagens para offscreen
    if (request.target === 'offscreen') return;

    // Processa eventos do offscreen
    if (request.type === 'offscreen-sse') {
        handleOffscreenEvent(request);
        return;
    }

    handleMessage(request, sender).then(sendResponse);
    return true; // Mantém canal aberto para resposta assíncrona
});

/**
 * Processa eventos vindos do offscreen SSE
 * O Service Worker é quem tem acesso ao chrome.storage!
 * @param {Object} event - Evento do offscreen
 */
async function handleOffscreenEvent(event) {
    console.log("[Controller] Offscreen SSE event:", event.event, event.data);

    switch (event.event) {
        case 'sse-connected':
            console.log("[Controller] SSE connected via offscreen");
            break;

        case 'sse-disconnected':
            console.log("[Controller] SSE disconnected");
            break;

        case 'translation-received':
            console.log("[Controller] Translation received via SSE:", event.data);
            // Service Worker salva a tradução no storage
            await saveTranslationToStorage(event.data);
            // Notifica o popup (se estiver aberto)
            notifyPopup('translation-received', event.data);
            break;

        case 'translation-error':
            console.log("[Controller] Translation error via SSE:", event.data);
            notifyPopup('translation-error', event.data);
            break;

        case 'sse-max-retries':
            console.error("[Controller] SSE max retries reached, recreating offscreen");
            // Tenta recriar o offscreen após um delay
            setTimeout(setupOffscreen, 5000);
            break;
    }
}

/**
 * Salva tradução no storage (apenas SW tem acesso!)
 * @param {Object} data - Dados da tradução { phrase_id, traducao_completa, explicacao, ... }
 */
async function saveTranslationToStorage(data) {
    const SENTENCES_KEY = 'my_db';

    try {
        const result = await chrome.storage.local.get(SENTENCES_KEY);
        const db = result[SENTENCES_KEY] || {};

        // Encontra a sentença pelo phraseId
        let found = false;
        for (const key in db) {
            if (db[key].phraseId === data.phrase_id) {
                db[key].translation = data.traducao_completa;
                db[key].explanation = data.explicacao;
                db[key].translationPending = false;
                db[key].fatias_traducoes = data.fatias_traducoes;
                db[key].modelo_ia = data.modelo_ia;
                found = true;
                console.log(`[Controller] Translation saved to sentence: ${key} (phraseId: ${data.phrase_id})`);
                break;
            }
        }

        if (found) {
            await chrome.storage.local.set({ [SENTENCES_KEY]: db });
        } else {
            console.warn(`[Controller] No sentence found for phraseId: ${data.phrase_id}`);
        }

    } catch (err) {
        console.error('[Controller] Error saving translation:', err);
    }
}

/**
 * Notifica o popup sobre eventos
 * @param {string} type - Tipo do evento
 * @param {Object} data - Dados do evento
 */
function notifyPopup(type, data) {
    chrome.runtime.sendMessage({
        type: 'popup-notification',
        event: type,
        data: data
    }).catch(() => {
        // Popup might be closed, ignore
    });
}

/**
 * Processa mensagens de forma assíncrona
 * @param {Object} request - Dados da mensagem
 * @param {Object} sender - Informações do sender
 * @returns {Promise<Object>}
 */
async function handleMessage(request, sender) {
    const source = request.source || detectSourceFromUrl(sender.tab?.url);

    switch (request.type) {
        // === Operações de Frases ===
        case "addsentences":
            const addResult = await DB.add(
                request.sentences, 
                source, 
                request.context || null, 
                request.pageTitle || ""
            );
            return { success: addResult.success };

        case "getAllSentences":
            const data = await DB.getAll();
            return { data };

        case "getAllSentencesSorted":
            const sorted = await DB.getAllSorted();
            return { data: sorted };

        case "deleteSentence":
            await DB.delete(request.key, request.deleteFromBackend);
            return { success: true };

        case "clearAllSentences":
            await DB.clearAll();
            return { success: true };

        case "getSentenceCount":
            const count = await DB.count();
            return { count };

        case "syncPending":
            const syncResult = await DB.syncPending();
            return syncResult;

        // === Operações de SSE ===
        case "getSSEStatus":
            const sseStatus = await sendToOffscreen('status');
            return sseStatus || { connected: false };

        case "reconnectSSE":
            await sendToOffscreen('connect');
            return { success: true };

        // === Operações de Traduções ===
        case "getTranslation":
            const translations = await chrome.storage.local.get('sse_translations');
            const translation = translations.sse_translations?.[request.phraseId];
            return { translation };

        case "getAllTranslations":
            const allTranslations = await chrome.storage.local.get('sse_translations');
            return { translations: allTranslations.sse_translations || {} };

        // === Operações de Autenticação ===
        case "login":
            const loginResult = await api.login(request.idToken, request.accessToken);
            return { success: loginResult };

        case "logout":
            await api.logout();
            return { success: true };

        case "checkAuth":
            return { isAuthenticated: api.isAuthenticated };

        // === Operações de API ===
        case "getPhrasesFromBackend":
            const phrases = await api.getPhrases(request.options);
            return { data: phrases };

        case "healthCheck":
            const healthy = await api.healthCheck();
            return { healthy };

        default:
            console.warn("[Controller] Unknown message type:", request.type);
            return { error: "Unknown message type" };
    }
}

// Log de inicialização
console.log("[Sentences Controller] Service worker initialized");
console.log("[Sentences Controller] Sync enabled:", DB.syncEnabled);
