/**
 * OffscreenManager - Manages the lifecycle and communication with the offscreen document.
 */
export class OffscreenManager {
    constructor() {
        this.creatingOffscreen = false;
        this.offscreenUrl = "src/Offscreen/index.html";
    }

    /**
     * Checks if the offscreen document exists.
     * @returns {Promise<boolean>}
     */
    async hasOffscreenDocument() {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        return contexts.length > 0;
    }

    /**
     * Creates the offscreen document if it doesn't exist.
     */
    async setupOffscreen() {
        if (await this.hasOffscreenDocument()) {
            console.log("[OffscreenManager] Document already exists");
            return;
        }

        if (this.creatingOffscreen) {
            console.log("[OffscreenManager] Creation in progress");
            return;
        }

        this.creatingOffscreen = true;

        try {
            await chrome.offscreen.createDocument({
                url: chrome.runtime.getURL(this.offscreenUrl),
                reasons: ['BLOBS'],
                justification: 'Maintains SSE connection for real-time translation updates'
            });
            console.log("[OffscreenManager] Document created");
        } catch (err) {
            console.error("[OffscreenManager] Failed to create document:", err);
        } finally {
            this.creatingOffscreen = false;
        }
    }

    /**
     * Sends a message to the offscreen document.
     * @param {string} type - Message type
     * @param {Object} data - Message data
     */
    async sendToOffscreen(type, data = {}) {
        try {
            await this.setupOffscreen();
            return await chrome.runtime.sendMessage({
                target: 'offscreen',
                type,
                ...data
            });
        } catch (err) {
            console.warn("[OffscreenManager] Error sending message:", err);
            return null;
        }
    }
}

export const offscreenManager = new OffscreenManager();
