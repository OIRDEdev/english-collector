/**
 * YouTube Context Plugin
 * Auto-registra no ContextRegistry
 */
(function() {
    'use strict';

    const plugin = {
        name: 'YouTube',
        host: 'www.youtube.com',

        getContext() {
            return {
                description: this.getDescription(),
                videoTitle: this.getVideoTitle(),
                channel: this.getChannel()
            };
        },

        getDescription() {
            const expander = document.querySelector(
                'ytd-text-inline-expander#description-inline-expander'
            );
            if (!expander) return null;

            const expanded = expander.querySelector('#expanded yt-attributed-string');
            if (expanded?.innerText?.trim()) {
                return expanded.innerText.trim();
            }

            const snippet = expander.querySelector('#snippet yt-attributed-string');
            if (snippet?.innerText?.trim()) {
                return snippet.innerText.trim();
            }

            const attributedSnippet = expander.querySelector('#attributed-snippet-text');
            return attributedSnippet?.innerText?.trim() || null;
        },

        getVideoTitle() {
            const selectors = [
                'h1.ytd-video-primary-info-renderer yt-formatted-string',
                'h1.ytd-watch-metadata yt-formatted-string',
                '#title h1 yt-formatted-string'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return null;
        },

        getChannel() {
            const selectors = [
                '#channel-name yt-formatted-string a',
                'ytd-channel-name yt-formatted-string a'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return null;
        }
    };

    // Auto-register quando o Registry estiver disponível
    if (window.__ContextRegistry__) {
        window.__ContextRegistry__.register('youtube', plugin);
    } else {
        // Fallback: aguarda o Registry
        const waitForRegistry = setInterval(() => {
            if (window.__ContextRegistry__) {
                window.__ContextRegistry__.register('youtube', plugin);
                clearInterval(waitForRegistry);
            }
        }, 10);
        // Timeout de segurança
        setTimeout(() => clearInterval(waitForRegistry), 5000);
    }

})();
