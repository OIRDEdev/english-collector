import { api } from "../Services/Api.js";
import { messageBus } from "../Shared/Messaging/MessageBus.js";
import { offscreenManager } from "../Offscreen/OffscreenManager.js";
import { sentenceController } from "../Sentences/SentenceController.js";
import { detectSourceFromUrl } from "../Shared/utils/UrlUtils.js";
import { NotificationService } from "../Offscreen/services/notification.js";

/**
 * Service Worker Entry Point
 * Orchestrates components: MessageBus, OffscreenManager, SentenceController.
 */

// ==================== AUTH INITIALIZATION ====================
//"api.loadSavedAuth().then(loaded => {
 //   if (loaded) console.log("[Background] Auth token loaded");
//});

// ==================== OFFSCREEN & SSE HANDLING ====================
// Initialize offscreen for SSE
offscreenManager.setupOffscreen();
NotificationService.updateBadge(); // Initialize badge

// Handle events coming from Offscreen (SSE)
messageBus.registerOffscreenHandler(async (request) => {
    const { event, data } = request;
    // console.log("[Background] Offscreen SSE event:", event, data);

    switch (event) {
        case 'sse-connected':
            console.log("[Background] SSE connected");
            break;
        case 'sse-disconnected':
            console.log("[Background] SSE disconnected");
            break;
        case 'translation-received':
            console.log("[Background] Translation received");
            await sentenceController.saveTranslation(data);
            messageBus.notifyPopup('translation-received', data);
            break;
        case 'translation-error':
            console.log("[Background] Translation error:", data);
            messageBus.notifyPopup('translation-error', data);
            break;
        case 'sse-max-retries':
            console.error("[Background] SSE max retries, restarting offscreen");
            setTimeout(() => offscreenManager.setupOffscreen(), 5000);
            break;
    }
});

// ==================== MESSAGE REGISTRATION ====================

// --- Sentence Operations ---
messageBus.register("addsentences", async (req, sender) => {
    const tabUrl = sender.tab ? sender.tab.url : null;
    return await sentenceController.add(req, tabUrl);
});

messageBus.register("getAllSentences", async () => await sentenceController.getAll());
messageBus.register("getAllSentencesSorted", async () => await sentenceController.getAllSorted());
messageBus.register("deleteSentence", async (req) => await sentenceController.delete(req.key, req.deleteFromBackend));
messageBus.register("clearAllSentences", async () => await sentenceController.clearAll());
messageBus.register("getSentenceCount", async () => await sentenceController.count());
messageBus.register("syncPending", async () => await sentenceController.syncPending());

// --- SSE Operations ---
messageBus.register("getSSEStatus", async () => {
    const status = await offscreenManager.sendToOffscreen('status');
    return status || { connected: false };
});

messageBus.register("reconnectSSE", async () => {
    await offscreenManager.sendToOffscreen('connect');
    return { success: true };
});

// --- Translation Operations (Popup querying storage directly usually, but keeping compatible API) ---
messageBus.register("getTranslation", async (req) => {
    const translations = await chrome.storage.local.get('sse_translations');
    return { translation: translations.sse_translations?.[req.phraseId] };
});

messageBus.register("getAllTranslations", async () => {
    const allTranslations = await chrome.storage.local.get('sse_translations');
    return { translations: allTranslations.sse_translations || {} };
});

// --- Auth Operations ---
messageBus.register("login", async (req) => ({ success: await api.login(req.idToken, req.accessToken) }));
messageBus.register("logout", async () => {
    await api.logout();
    return { success: true };
});
messageBus.register("checkAuth", async () => ({ isAuthenticated: api.isAuthenticated }));

// --- API Operations ---
messageBus.register("getPhrasesFromBackend", async (req) => ({ data: await api.getPhrases(req.options) }));
messageBus.register("healthCheck", async () => ({ healthy: await api.healthCheck() }));


// ==================== COMMANDS (KEYBOARD SHORTCUTS) ====================
chrome.commands.onCommand.addListener((command) => {
    if (command !== "save-word") return;
    
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab) return;
        
        // Inject legacy getcontext.js if needed (could be improved by moving to src/Content)
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["src/Content/GetContext.js"] 
        }, () => {
            // Execute capture
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const selection = window.getSelection().toString();
                    let context = null;
                    let pageTitle = document.title || "";
                    
                    if (typeof GetContext !== 'undefined') {
                        try {
                            const ctx = GetContext.getContext();
                            context = GetContext.getFormattedContext();
                            pageTitle = ctx.title || pageTitle;
                        } catch (e) { console.warn(e); }
                    }
                    return { selection, context, pageTitle };
                }
            }, (result) => {
                const data = result?.[0]?.result;
                if (data?.selection) {
                    sentenceController.add({
                        sentences: data.selection,
                        context: data.context,
                        pageTitle: data.pageTitle
                    }, tab.url);
                }
            });
        });
    });
});

console.log("[Background] Service Worker Initialized (Refactored)");
