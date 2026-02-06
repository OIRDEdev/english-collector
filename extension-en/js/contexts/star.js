/**
 * Star+ Context Plugin
 * Auto-registra no ContextRegistry
 */
(function() {
    'use strict';

    const plugin = {
        name: 'Star+',
        host: 'www.starplus.com',

        getContext() {
            return {
                description: this.getDescription(),
                contentTitle: this.getTitle()
            };
        },

        getDescription() {
            const selectors = [
                '[data-testid="details-description"]',
                '.details-metadata__description'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return null;
        },

        getTitle() {
            const selectors = [
                '[data-testid="details-title"]',
                '.details-metadata__title'
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
        window.__ContextRegistry__.register('star', plugin);
    } else {
        const wait = setInterval(() => {
            if (window.__ContextRegistry__) {
                window.__ContextRegistry__.register('star', plugin);
                clearInterval(wait);
            }
        }, 10);
        setTimeout(() => clearInterval(wait), 5000);
    }

})();
