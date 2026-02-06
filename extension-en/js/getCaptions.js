/**
 * SubtitleCollector - Classe para capturar legendas de diferentes serviços de streaming
 * Envia as frases capturadas para o Sentences_Controllers via chrome.runtime.sendMessage
 */
class SubtitleCollector {
    // Dicionário de configurações de streaming
    static STREAMINGS = {
        netflix: {
            name: "Netflix",
            host: "www.netflix.com",
            playerSelectors: [".watch-video", ".sizing-wrapper"],
            captionSelectors: [".player-timedtext-text-container"],
            menuSelectors: [
                {
                    selector: '.watch-video--speed-controls-container, [data-uia="selector-audio-subtitle"], .watch-video--selector-episode-container, .watch-video--episode-preview-container',
                    visibleAttr: null
                }
            ]
        },

        youtube: {
            name: "YouTube",
            host: "www.youtube.com",
            playerSelectors: ["#ytd-player"],
            captionSelectors: [".caption-visual-line", ".captions-text", ".ytp-caption-segment"],
            menuSelectors: [
                { selector: ".ytp-settings-button", visibleAttr: "aria-expanded" },
                { selector: ".ytp-ad-skip-button", visibleAttr: null }
            ]
        },

        primevideo: {
            name: "Amazon Prime Video",
            host: "www.primevideo.com",
            playerSelectors: [".atvwebplayersdk-player-container"],
            captionSelectors: [".atvwebplayersdk-captions-text"],
            menuSelectors: null
        },

        disneyplus: {
            name: "Disney+",
            host: "www.disneyplus.com",
            playerSelectors: [".btm-media-player"],
            captionSelectors: [".dss-subtitle-renderer-line", ".hive-subtitle-renderer-line"],
            menuSelectors: null
        },

        max: {
            name: "Max (HBO)",
            host: "play.hbomax.com",
            playerSelectors: [
                "div[class*='StyledPlayerContainer-Beam-Web']",
                "div[class*='StyledPlayerContainer-Fuse-Web']",
                "div[class*='PlayerRootContainer-Fuse-Web-Play']"
            ],
            captionSelectors: [
                "div[class*='CaptionWindow-Beam-Web']",
                "div[class*='CaptionWindow-Fuse-Web']",
                "div[class*='CaptionWindow-Fuse-Web-Play']"
            ],
            menuSelectors: null
        },

        starplus: {
            name: "Star+",
            host: "www.starplus.com",
            playerSelectors: [".btm-media-player"],
            captionSelectors: [".dss-subtitle-renderer-line"],
            menuSelectors: null
        }
    };

    constructor() {
        this.isExtensionValid = true;
        this.currentStreaming = null;
        this.boundHandleClick = this.handleCaptionClick.bind(this);
        
        this.init();
    }

    /**
     * Inicializa o collector detectando o streaming atual
     */
    init() {
        if (!this.checkExtensionContext()) {
            console.warn("[SubtitleCollector] Contexto da extensão inválido - recarregue a página");
            return;
        }

        this.currentStreaming = this.detectCurrentStreaming();
        
        if (this.currentStreaming) {
            console.log(`[SubtitleCollector] Detectado: ${this.currentStreaming.name}`);
            this.attachListeners();
        } else {
            console.warn("[SubtitleCollector] Streaming não suportado");
        }
    }

    /**
     * Detecta qual serviço de streaming está sendo usado baseado no hostname
     * @returns {Object|null} Configuração do streaming ou null se não encontrado
     */
    detectCurrentStreaming() {
        const hostname = window.location.hostname;
        
        for (const key in SubtitleCollector.STREAMINGS) {
            const streaming = SubtitleCollector.STREAMINGS[key];
            if (hostname.includes(streaming.host) || streaming.host.includes(hostname)) {
                return streaming;
            }
        }
        
        return null;
    }

    /**
     * Verifica se o contexto da extensão ainda é válido
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
     * Encontra o elemento de legenda clicado baseado nos seletores do streaming atual
     * @param {HTMLElement} target - Elemento clicado
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
     * Envia a frase capturada para o Sentences_Controllers
     * @param {string} sentence - Frase da legenda
     */
    sendToController(sentence) {
        if (!sentence || !sentence.trim()) return;

        try {
            // Importar GetContext dinamicamente se disponível
            let context = null;
            let pageTitle = document.title || "";
            
            if (typeof GetContext !== 'undefined') {
                const ctx = GetContext.getContext();
                context = GetContext.getFormattedContext();
                pageTitle = ctx.title || pageTitle;
            }
            console.log("teste: ", context);
            chrome.runtime.sendMessage({
                type: "addsentences",
                sentences: sentence.trim(),
                source: this.currentStreaming?.name || "unknown",
                context: context,
                pageTitle: pageTitle
            });
            console.log(`[SubtitleCollector] Frase enviada: "${sentence.trim()}"`);
        } catch (e) {
            console.warn("[SubtitleCollector] Erro ao enviar mensagem:", e.message);
            this.handleContextInvalidation();
        }
    }

    /**
     * Handler para cliques em legendas
     * @param {MouseEvent} event
     */
    handleCaptionClick(event) {
        // Verifica contexto da extensão
        if (!this.isExtensionValid || !this.checkExtensionContext()) {
            this.handleContextInvalidation();
            return;
        }

        // Busca elemento de legenda
        const captionElement = this.findCaptionElement(event.target);
        if (!captionElement) return;

        // Extrai e envia o texto
        const text = captionElement.innerText;
        if (text) {
            this.sendToController(text);
        }
    }

    /**
     * Trata invalidação do contexto da extensão
     */
    handleContextInvalidation() {
        console.warn("[SubtitleCollector] Extensão indisponível - recarregue a página");
        this.isExtensionValid = false;
        this.detachListeners();
    }

    /**
     * Anexa os event listeners
     */
    attachListeners() {
        document.addEventListener("click", this.boundHandleClick);
        console.log("[SubtitleCollector] Listeners anexados");
    }

    /**
     * Remove os event listeners
     */
    detachListeners() {
        document.removeEventListener("click", this.boundHandleClick);
        console.log("[SubtitleCollector] Listeners removidos");
    }

    /**
     * Retorna a lista de streamings suportados
     * @returns {string[]}
     */
    static getSupportedStreamings() {
        return Object.keys(SubtitleCollector.STREAMINGS);
    }

    /**
     * Adiciona um novo streaming ao dicionário
     * @param {string} key - Chave única do streaming
     * @param {Object} config - Configuração do streaming
     */
    static addStreaming(key, config) {
        if (!config.name || !config.host || !config.captionSelectors) {
            throw new Error("Configuração de streaming inválida. Requer: name, host, captionSelectors");
        }
        SubtitleCollector.STREAMINGS[key] = config;
    }

    /**
     * Obtém configuração de um streaming específico
     * @param {string} key - Chave do streaming
     * @returns {Object|null}
     */
    static getStreamingConfig(key) {
        return SubtitleCollector.STREAMINGS[key] || null;
    }
}

// Inicializa o collector automaticamente
const subtitleCollector = new SubtitleCollector();
