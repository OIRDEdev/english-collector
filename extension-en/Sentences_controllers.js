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

// Atalho de teclado (Ctrl+Shift+H)
chrome.commands.onCommand.addListener((command) => {
    if (command !== "save-word") return;

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString()
        }, (result) => {
            const sentence = result?.[0]?.result;
            if (sentence) {
                const source = detectSourceFromUrl(tab.url);
                DB.add(sentence, source);
            }
        });
    });
});

// Handler de mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender).then(sendResponse);
    return true; // Mantém canal aberto para resposta assíncrona
});

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
            const addResult = await DB.add(request.sentences, source);
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
