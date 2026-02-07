/**
 * Context Registry - Singleton Pattern para SPAs
 * Previne re-declaração e garante consistência em re-injeções
 */
(function() {
    'use strict';

    // Se já existe, não recria - apenas retorna
    if (window.__ContextRegistry__) {
        return;
    }

    const Registry = {
        plugins: {},
        
        /**
         * Registra um plugin de contexto
         * @param {string} key - Identificador único
         * @param {Object} plugin - { name, host, getContext() }
         */
        register(key, plugin) {
            if (!plugin || !plugin.name || !plugin.host || typeof plugin.getContext !== 'function') {
                console.warn(`[ContextRegistry] Plugin inválido: ${key}`);
                return false;
            }
            
            // Só registra se não existir (idempotente)
            if (!this.plugins[key]) {
                this.plugins[key] = plugin;
                console.log(`[ContextRegistry] Plugin registrado: ${key}`);
            }
            return true;
        },

        /**
         * Obtém um plugin registrado
         * @param {string} key 
         * @returns {Object|null}
         */
        get(key) {
            return this.plugins[key] || null;
        },

        /**
         * Lista todos os plugins registrados
         * @returns {string[]}
         */
        list() {
            return Object.keys(this.plugins);
        },

        /**
         * Encontra o plugin apropriado para o hostname atual
         * @returns {Object|null}
         */
        findPlugin() {
            const hostname = window.location.hostname;
            
            for (const key in this.plugins) {
                const plugin = this.plugins[key];
                if (plugin.host === '*') continue; // Skip generic
                
                if (hostname.includes(plugin.host) || plugin.host.includes(hostname)) {
                    return { key, plugin };
                }
            }
            
            // Fallback para generic
            if (this.plugins.generic) {
                return { key: 'generic', plugin: this.plugins.generic };
            }
            
            return null;
        }
    };

    // Core GetContext API
    const GetContext = {
        /**
         * Obtém contexto do site atual
         * @returns {Object}
         */
        getContext() {
            const hostname = window.location.hostname;
            const url = window.location.href;
            const title = document.title || '';
            
            const found = Registry.findPlugin();
            
            if (found) {
                try {
                    const context = found.plugin.getContext();
                    return {
                        streaming: found.plugin.name,
                        site: hostname,
                        url: url,
                        title: title,
                        ...context
                    };
                } catch (e) {
                    console.warn(`[GetContext] Erro no plugin ${found.key}:`, e);
                }
            }
            
            // Fallback mínimo
            return {
                streaming: 'Website',
                site: hostname,
                url: url,
                title: title,
                description: null
            };
        },

        /**
         * Formata contexto para envio à API
         * @returns {string}
         */
        getFormattedContext() {
            const ctx = this.getContext();
            const lines = [
                `Fonte: ${ctx.streaming}`,
                `Título: ${ctx.title}`
            ];
            
            if (ctx.site) lines.push(`Site: ${ctx.site}`);
            if (ctx.url) lines.push(`URL: ${ctx.url}`);
            if (ctx.description) lines.push(`Descrição: ${ctx.description}`);
            if (ctx.videoTitle) lines.push(`Vídeo: ${ctx.videoTitle}`);
            if (ctx.channel) lines.push(`Canal: ${ctx.channel}`);
            if (ctx.seriesTitle) lines.push(`Série: ${ctx.seriesTitle}`);
            if (ctx.episodeTitle) lines.push(`Episódio: ${ctx.episodeTitle}`);
            if (ctx.contentTitle) lines.push(`Conteúdo: ${ctx.contentTitle}`);
            
            return lines.join('\n');
        }
    };

    // Expõe o registry global
    window.__ContextRegistry__ = Registry;
    window.GetContext = GetContext;

})();
