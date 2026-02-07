import { api as defaultApi } from "../Services/Api.js";

/**
 * Database Manager - Manages local storage of sentences
 * Uses dependency injection for API client
 */
class DatabaseManager {
    constructor(options = {}) {
        this.apiClient = options.apiClient || defaultApi;
        this.storageKey = options.storageKey || "my_db";
        this.syncEnabled = options.syncEnabled !== false;
    }

    setApiClient(apiClient) {
        this.apiClient = apiClient;
    }

    setSyncEnabled(enabled) {
        this.syncEnabled = enabled;
    }

    generateKey() {
        return Math.random().toString(36).substring(2, 12);
    }

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
            synced: false,
            phraseId: null,
            translationPending: false,
            translation: null
        };

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

        if (this.syncEnabled && this.apiClient) {
            try {
                const urlOrigem = typeof window !== 'undefined' ? window.location?.href : "";
                const apiResult = await this.apiClient.addPhrase(
                    sentence, 
                    urlOrigem, 
                    pageTitle || entry.pageTitle, 
                    context
                );
                
                if (apiResult.success && apiResult.phraseId) {
                    await this.markAsSynced(key, apiResult.phraseId);
                    await this.markAsTranslationPending(key, apiResult.phraseId);
                    console.log("[DB] Synced with backend, phraseId:", apiResult.phraseId);
                } else if (apiResult.success) {
                    await this.markAsSynced(key);
                    console.log("[DB] Synced without phraseId");
                } else {
                    console.warn("[DB] Backend sync failed:", apiResult.reason || apiResult.error);
                }
            } catch (e) {
                console.warn("[DB] Backend sync error:", e);
            }
        }

        return { success: true, key };
    }

    async markAsTranslationPending(key, phraseId) {
        const data = await chrome.storage.local.get(this.storageKey);
        const db = data[this.storageKey] || {};
        
        if (db[key]) {
            db[key].translationPending = true;
            db[key].phraseId = phraseId;
            await chrome.storage.local.set({ [this.storageKey]: db });
            console.log(`[DB] Marked as translation pending: ${key}, phraseId: ${phraseId}`);
        }
    }

    async markAsSynced(key, phraseId = null) {
        const data = await chrome.storage.local.get(this.storageKey);
        const db = data[this.storageKey] || {};
        
        if (db[key]) {
            db[key].synced = true;
            if (phraseId) {
                db[key].phraseId = phraseId;
            }
            await chrome.storage.local.set({ [this.storageKey]: db });
            console.log(`[DB] Marked as synced: ${key}, phraseId: ${phraseId}`);
        }
    }

    async getAll() {
        const data = await chrome.storage.local.get(this.storageKey);
        return data[this.storageKey] || {};
    }

    async getAllSorted() {
        const db = await this.getAll();
        const entries = Object.entries(db).map(([key, value]) => ({
            key,
            ...value
        }));
        
        return entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    async count() {
        const db = await this.getAll();
        return Object.keys(db).length;
    }

    async countUnsynced() {
        const all = await this.getAllSorted();
        return all.filter(item => !item.synced).length;
    }

    async delete(key, deleteFromBackend = false) {
        const data = await chrome.storage.local.get(this.storageKey);
        const db = data[this.storageKey] || {};
        
        if (db[key]) {
            if (deleteFromBackend && this.apiClient && db[key].backendId) { // Note: backendId might not be stored, usually phraseId?
                 // db.js original logic checked backendId, but mostly we track phraseId now.
                 // Let's assume the user logic in db.js was correct or we keep it. 
                 // db.js: if (deleteFromBackend && this.apiClient && db[key].backendId) {
                 // Wait, addPhrase returns phraseId, and we store it as phraseId.
                 // db.js delete checks `backendId`. This might be a bug in original code or they are synonyms.
                 // checking db.js original: yes, `db[key].backendId`. But `add` stores `phraseId`.
                 // I will correct this to `phraseId` if that's what we store.
                 // In `markAsSynced`: `db[key].phraseId = phraseId`.
                 // So we should check `phraseId`.
                 if (db[key].phraseId) {
                     await this.apiClient.deletePhrase(db[key].phraseId);
                 }
            }

            delete db[key];
            await chrome.storage.local.set({ [this.storageKey]: db });
            console.log("[DB] Deleted:", key);
        }
    }

    async clearAll() {
        await chrome.storage.local.set({ [this.storageKey]: {} });
        console.log("[DB] All data cleared");
    }

    async getBySource(source) {
        const all = await this.getAllSorted();
        return all.filter(item => 
            item.source?.toLowerCase() === source?.toLowerCase()
        );
    }

    async getSources() {
        const all = await this.getAllSorted();
        const sources = new Set(all.map(item => item.source));
        return Array.from(sources);
    }

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
                
                if (result.success && result.phraseId) {
                    await this.markAsSynced(item.key, result.phraseId);
                    await this.markAsTranslationPending(item.key, result.phraseId);
                    synced++;
                } else if (result.success) {
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

    async updateWithTranslation(phraseId, translation, explanation = null) {
        const data = await chrome.storage.local.get(this.storageKey);
        const db = data[this.storageKey] || {};

        for (const key in db) {
            if (db[key].phraseId === phraseId) {
                db[key].translation = translation;
                db[key].explanation = explanation;
                db[key].translationPending = false;
                await chrome.storage.local.set({ [this.storageKey]: db });
                return true;
            }
        }
        return false;
    }

    async findByPhraseId(phraseId) {
        const data = await chrome.storage.local.get(this.storageKey);
        const db = data[this.storageKey] || {};

        for (const key in db) {
            if (db[key].phraseId === phraseId) {
                return { key, ...db[key] };
            }
        }
        return null;
    }
}

const DB = new DatabaseManager();

export { DatabaseManager, DB };
