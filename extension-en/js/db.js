import { api as defaultApi } from "./api.js";

/**
 * Database Manager - Gerencia armazenamento local de frases
 * Usa injeção de dependência para o cliente API
 * 
 * Quando salva uma frase:
 * 1. Guarda localmente (para exibição rápida)
 * 2. Envia para o backend via API
 */
class DatabaseManager {
    /**
     * @param {Object} options - Opções de configuração
     * @param {Object} options.apiClient - Cliente API para envio ao backend
     * @param {string} options.storageKey - Chave do storage local
     */
    constructor(options = {}) {
        this.apiClient = options.apiClient || defaultApi;
        this.storageKey = options.storageKey || "my_db";
        this.syncEnabled = options.syncEnabled !== false; // Por padrão, sincroniza com API
    }

    /**
     * Injeta um novo cliente API
     * @param {Object} apiClient - Nova instância do cliente API
     */
    setApiClient(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Habilita/desabilita sincronização com API
     * @param {boolean} enabled
     */
    setSyncEnabled(enabled) {
        this.syncEnabled = enabled;
    }

    /**
     * Gera uma chave única
     * @returns {string}
     */
    generateKey() {
        return Math.random().toString(36).substring(2, 12);
    }

    /**
     * Adiciona uma frase ao banco de dados e envia para o backend
     * @param {string} sentence - A frase capturada
     * @param {string} source - O streaming de origem
     * @param {string} context - Contexto adicional (descrição, título do vídeo, etc)
     * @param {string} pageTitle - Título da página
     * @returns {Promise<Object>} Resultado da operação
     */
    async add(sentence, source = "Unknown", context = null, pageTitle = "") {
        if (!sentence || !sentence.trim()) {
            return { success: false, reason: "empty" };
        }

        const key = this.generateKey();
        const entry = {
            text: sentence.trim(),
            source: source,
            context: context,
            pageTitle: pageTitle || document?.title || "",
            timestamp: Date.now(),
            date: new Date().toISOString(),
            synced: false
        };

        // 1. Salva localmente primeiro (para exibição imediata)
        try {
            const data = await chrome.storage.local.get(this.storageKey);
            const db = data[this.storageKey] || {};
            db[key] = entry;
            await chrome.storage.local.set({ [this.storageKey]: db });
            console.log("[DB] Saved locally:", sentence.substring(0, 50) + "...");
        } catch (e) {
            console.error("[DB] Error saving locally:", e);
            return { success: false, reason: "storage_error", error: e };
        }

        // 2. Envia para o backend (se sincronização habilitada)
        if (this.syncEnabled && this.apiClient) {
            try {
                const urlOrigem = typeof window !== 'undefined' ? window.location?.href : "";
                const apiResult = await this.apiClient.addPhrase(
                    sentence, 
                    urlOrigem, 
                    pageTitle || entry.pageTitle, 
                    context
                );
                
                if (apiResult.success) {
                    // Marca como sincronizado
                    await this.markAsSynced(key);
                    console.log("[DB] Synced with backend");
                } else {
                    console.warn("[DB] Backend sync failed:", apiResult.reason || apiResult.error);
                }
            } catch (e) {
                console.warn("[DB] Backend sync error:", e);
                // Não falha a operação, apenas marca como não sincronizado
            }
        }

        return { success: true, key };
    }

    /**
     * Marca uma entrada como sincronizada
     * @param {string} key - Chave da entrada
     */
    async markAsSynced(key) {
        const data = await chrome.storage.local.get(this.storageKey);
        const db = data[this.storageKey] || {};
        
        if (db[key]) {
            db[key].synced = true;
            await chrome.storage.local.set({ [this.storageKey]: db });
        }
    }

    /**
     * Retorna todas as frases do banco local
     * @returns {Promise<Object>}
     */
    async getAll() {
        const data = await chrome.storage.local.get(this.storageKey);
        return data[this.storageKey] || {};
    }

    /**
     * Retorna frases ordenadas por timestamp
     * @returns {Promise<Array>}
     */
    async getAllSorted() {
        const db = await this.getAll();
        const entries = Object.entries(db).map(([key, value]) => ({
            key,
            ...value
        }));
        
        return entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    /**
     * Conta o número de frases
     * @returns {Promise<number>}
     */
    async count() {
        const db = await this.getAll();
        return Object.keys(db).length;
    }

    /**
     * Conta frases não sincronizadas
     * @returns {Promise<number>}
     */
    async countUnsynced() {
        const all = await this.getAllSorted();
        return all.filter(item => !item.synced).length;
    }

    /**
     * Deleta uma frase específica
     * @param {string} key - Chave da frase
     * @param {boolean} deleteFromBackend - Se deve deletar também do backend
     */
    async delete(key, deleteFromBackend = false) {
        const data = await chrome.storage.local.get(this.storageKey);
        const db = data[this.storageKey] || {};
        
        if (db[key]) {
            // Se habilitado, deleta do backend também
            if (deleteFromBackend && this.apiClient && db[key].backendId) {
                await this.apiClient.deletePhrase(db[key].backendId);
            }

            delete db[key];
            await chrome.storage.local.set({ [this.storageKey]: db });
            console.log("[DB] Deleted:", key);
        }
    }

    /**
     * Limpa todas as frases locais
     */
    async clearAll() {
        await chrome.storage.local.set({ [this.storageKey]: {} });
        console.log("[DB] All data cleared");
    }

    /**
     * Filtra frases por fonte
     * @param {string} source - Nome do streaming
     * @returns {Promise<Array>}
     */
    async getBySource(source) {
        const all = await this.getAllSorted();
        return all.filter(item => 
            item.source?.toLowerCase() === source?.toLowerCase()
        );
    }

    /**
     * Retorna todas as fontes únicas
     * @returns {Promise<string[]>}
     */
    async getSources() {
        const all = await this.getAllSorted();
        const sources = new Set(all.map(item => item.source));
        return Array.from(sources);
    }

    /**
     * Sincroniza frases não sincronizadas com o backend
     * @returns {Promise<Object>} Resultado da sincronização
     */
    async syncPending() {
        if (!this.syncEnabled || !this.apiClient) {
            return { success: false, reason: "sync_disabled" };
        }

        const all = await this.getAllSorted();
        const unsynced = all.filter(item => !item.synced);

        let synced = 0;
        let failed = 0;

        for (const item of unsynced) {
            try {
                const result = await this.apiClient.addPhrase(
                    item.text, 
                    "", 
                    item.pageTitle || "", 
                    item.context
                );
                if (result.success) {
                    await this.markAsSynced(item.key);
                    synced++;
                } else {
                    failed++;
                }
            } catch {
                failed++;
            }
        }

        console.log(`[DB] Sync complete: ${synced} synced, ${failed} failed`);
        return { success: true, synced, failed, total: unsynced.length };
    }
}

// Cria instância padrão com o cliente API padrão
const DB = new DatabaseManager();

export { DatabaseManager, DB };
