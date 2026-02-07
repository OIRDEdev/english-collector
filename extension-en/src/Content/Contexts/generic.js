/**
 * Generic Website Context Plugin
 * Fallback para sites não reconhecidos
 * Auto-registra no ContextRegistry
 */
(function() {
    'use strict';

    const plugin = {
        name: 'Website',
        host: '*',

        getContext() {
            return {
                description: this.getDescription(),
                contentTitle: this.getTitle()
            };
        },

        getDescription() {
            // Meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc?.content?.trim()) {
                return metaDesc.content.trim();
            }

            // OpenGraph description
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc?.content?.trim()) {
                return ogDesc.content.trim();
            }

            // First paragraph
            const firstP = document.querySelector('article p, main p, .content p');
            if (firstP?.innerText?.trim()) {
                return firstP.innerText.trim().substring(0, 500);
            }

            return null;
        },

        getTitle() {
            // OpenGraph title
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle?.content?.trim()) {
                return ogTitle.content.trim();
            }

            // H1
            const h1 = document.querySelector('h1');
            if (h1?.innerText?.trim()) {
                return h1.innerText.trim();
            }

            return document.title || null;
        }
    };

    // Auto-register
    if (window.__ContextRegistry__) {
        window.__ContextRegistry__.register('generic', plugin);
    } else {
        const wait = setInterval(() => {
            if (window.__ContextRegistry__) {
                window.__ContextRegistry__.register('generic', plugin);
                clearInterval(wait);
            }
        }, 10);
        setTimeout(() => clearInterval(wait), 5000);
    }

})();
