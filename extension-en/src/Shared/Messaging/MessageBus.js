/**
 * MessageBus - centralized message handling for Chrome Runtime messages.
 */
export class MessageBus {
    constructor() {
        this.handlers = new Map();
        this.offscreenHandler = null;
        
        // Bind the listener
        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    }

    /**
     * Registers a handler function for a specific message type.
     * @param {string} type - The message type to listen for.
     * @param {Function} handler - Async function(request, sender) returning response.
     */
    register(type, handler) {
        this.handlers.set(type, handler);
    }

    /**
     * Registers a handler for offscreen events (special case).
     * @param {Function} handler 
     */
    registerOffscreenHandler(handler) {
        this.offscreenHandler = handler;
    }

    /**
     * Central message listener.
     */
    onMessage(request, sender, sendResponse) {
        // Ignore messages targeted to offscreen (handled by offscreen doc)
        if (request.target === 'offscreen') return;

        // Handle offscreen SSE events
        if (request.type === 'offscreen-sse') {
            if (this.offscreenHandler) {
                this.offscreenHandler(request);
            }
            return;
        }

        // Handle standard messages
        const handler = this.handlers.get(request.type);
        if (handler) {
            // Execute handler and send response
            Promise.resolve(handler(request, sender))
                .then(sendResponse)
                .catch(err => {
                    console.error(`Error handling message ${request.type}:`, err);
                    sendResponse({ error: err.message });
                });
            return true; // Keep channel open for async response
        } else {
            console.warn(`[MessageBus] No handler registered for type: ${request.type}`);
        }
    }
    
    /**
     * Sends a message to the popup (if open)
     */
    notifyPopup(type, data) {
        chrome.runtime.sendMessage({
            type: 'popup-notification',
            event: type,
            data: data
        }).catch(() => {
            // Popup might be closed, ignore
        });
    }
}

export const messageBus = new MessageBus();
