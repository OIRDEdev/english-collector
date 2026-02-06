/**
 * Netflix Context Plugin
 * Auto-registra no ContextRegistry
 */
(function() {
    'use strict';

    const plugin = {
        name: 'Netflix',
        host: 'www.netflix.com',

        getContext() {
            return {
                description: this.getDescription(),
                seriesTitle: this.getSeriesTitle(),
                episodeTitle: this.getEpisodeTitle()
            };
        },

        getDescription() {
            const selectors = [
                '[data-uia="preview-modal-synopsis"]',
                '.preview-modal-synopsis',
                '.about-container .synopsis'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return null;
        },

        getSeriesTitle() {
            const selectors = ['[data-uia="video-title"]', '.watch-title'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return null;
        },

        getEpisodeTitle() {
            const selectors = ['[data-uia="video-episode"]', '.episode-title'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return null;
        }
    };

    // Auto-register
    if (window.__ContextRegistry__) {
        window.__ContextRegistry__.register('netflix', plugin);
    } else {
        const wait = setInterval(() => {
            if (window.__ContextRegistry__) {
                window.__ContextRegistry__.register('netflix', plugin);
                clearInterval(wait);
            }
        }, 10);
        setTimeout(() => clearInterval(wait), 5000);
    }

})();
