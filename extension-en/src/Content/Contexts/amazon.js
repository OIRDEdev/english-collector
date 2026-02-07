/**
 * Amazon Prime Video Context Plugin
 * Auto-registra no ContextRegistry
 */
(function() {
    'use strict';

    const plugin = {
        name: 'Amazon Prime Video',
        host: 'www.primevideo.com',

        getContext() {
            return {
                description: this.getDescription(),
                contentTitle: this.getTitle()
            };
        },

        getDescription() {
            const selectors = [
                '[data-automation-id="synopsis"]',
                '.dv-dp-node-synopsis',
                '.synopsis'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return null;
        },

        getTitle() {
            const selectors = [
                '[data-automation-id="title"]',
                '.dv-dp-node-title',
                '.atvwebplayersdk-title-text'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return null;
        }
    };

    // Auto-register
    if (window.__ContextRegistry__) {
        window.__ContextRegistry__.register('amazon', plugin);
    } else {
        const wait = setInterval(() => {
            if (window.__ContextRegistry__) {
                window.__ContextRegistry__.register('amazon', plugin);
                clearInterval(wait);
            }
        }, 10);
        setTimeout(() => clearInterval(wait), 5000);
    }

})();
