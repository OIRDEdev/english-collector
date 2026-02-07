import { StreamingRegistry } from "./StreamingRegistry.js";

/**
 * SubtitleCollector - Class to capture subtitles from different streaming services.
 * Sends captured sentences to the Background Service Worker.
 */
export class SubtitleCollector {
    constructor() {
        this.registry = new StreamingRegistry();
        this.currentStreaming = null;
        this.isExtensionValid = true;
        this.boundHandleClick = this.handleCaptionClick.bind(this);
        
        this.init();
    }

    /**
     * Initializes the collector by detecting the current streaming service.
     */
    init() {
        if (!this.checkExtensionContext()) {
            console.warn("[SubtitleCollector] Invalid extension context - reload the page");
            return;
        }

        this.currentStreaming = this.registry.detect();
        
        if (this.currentStreaming) {
            console.log(`[SubtitleCollector] Detected: ${this.currentStreaming.name}`);
            this.attachListeners();
        } else {
            console.warn("[SubtitleCollector] Streaming not supported");
        }
    }

    /**
     * Checks if the extension context is still valid.
     * @returns {boolean}
     */
    checkExtensionContext() {
        try {
            return chrome.runtime?.id !== undefined;
        } catch (e) {
            return false;
        }
    }

    /**
     * Finds the caption element clicked based on the current streaming selectors.
     * @param {HTMLElement} target - Clicked element
     * @returns {HTMLElement|null}
     */
    findCaptionElement(target) {
        if (!this.currentStreaming) return null;

        for (const selector of this.currentStreaming.captionSelectors) {
            const element = target.closest(selector);
            if (element) return element;
        }

        return null;
    }

    /**
     * Sends the captured phrase to the Background Service Worker.
     * @param {string} sentence - Caption phrase
     */
    sendToController(sentence) {
        if (!sentence || !sentence.trim()) return;

        try {
            // Context handling (keeping compatibility with existing global GetContext if present)
            let context = null;
            let pageTitle = document.title || "";
            
            // Assuming GetContext is still available globally from getcontext.js
            // If getcontext.js is refactored, this import needs to change.
            if (typeof window.GetContext !== 'undefined') {
                const ctx = window.GetContext.getContext();
                context = window.GetContext.getFormattedContext();
                pageTitle = ctx.title || pageTitle;
            }
            
            // Using chrome.runtime.sendMessage directly for now, can be abstracted later
            chrome.runtime.sendMessage({
                type: "addsentences",
                sentences: sentence.trim(),
                source: this.currentStreaming?.name || "unknown",
                context: context,
                pageTitle: pageTitle
            });
            console.log(`[SubtitleCollector] Sentence sent: "${sentence.trim()}"`);
        } catch (e) {
            console.warn("[SubtitleCollector] Error sending message:", e.message);
            this.handleContextInvalidation();
        }
    }

    /**
     * Handler for subtitle clicks.
     * @param {MouseEvent} event
     */
    handleCaptionClick(event) {
        if (!this.isExtensionValid || !this.checkExtensionContext()) {
            this.handleContextInvalidation();
            return;
        }

        const captionElement = this.findCaptionElement(event.target);
        if (!captionElement) return;

        const text = captionElement.innerText;
        if (text) {
            this.sendToController(text);
        }
    }

    /**
     * Handles extension context invalidation.
     */
    handleContextInvalidation() {
        console.warn("[SubtitleCollector] Extension unavailable - reload the page");
        this.isExtensionValid = false;
        this.detachListeners();
    }

    attachListeners() {
        document.addEventListener("click", this.boundHandleClick);
        console.log("[SubtitleCollector] Listeners attached");
    }

    detachListeners() {
        document.removeEventListener("click", this.boundHandleClick);
        console.log("[SubtitleCollector] Listeners removed");
    }
}
