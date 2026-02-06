/**
 * Max (HBO) Context Plugin
 * Auto-registra no ContextRegistry
 */
(function() {
    'use strict';

    const plugin = {
        name: 'Max (HBO)',
        host: 'play.hbomax.com',

        getContext() {
            return {
                description: this.getDescription(),
                contentTitle: this.getTitle()
            };
        },

        getDescription() {
            const el = document.querySelector('[class*="Synopsis"], [class*="description"]');
            return el?.innerText?.trim() || null;
        },

        getTitle() {
            const el = document.querySelector('[class*="Title"], [class*="title"]');
            return el?.innerText?.trim() || null;
        }
    };

    // Auto-register
    if (window.__ContextRegistry__) {
        window.__ContextRegistry__.register('max', plugin);
    } else {
        const wait = setInterval(() => {
            if (window.__ContextRegistry__) {
                window.__ContextRegistry__.register('max', plugin);
                clearInterval(wait);
            }
        }, 10);
        setTimeout(() => clearInterval(wait), 5000);
    }

})();
