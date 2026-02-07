import { DB } from "../Database/DatabaseManager.js";
import { detectSourceFromUrl } from "../Shared/utils/UrlUtils.js";

/**
 * SentenceController - Manages sentence operations interacting with the Database.
 */
export class SentenceController {
    
    /**
     * Adds sentences to the database.
     * @param {Object} data - { sentences, source, context, pageTitle }
     * @param {string} tabUrl - Optional URL to detect source if not provided
     */
    async add(data, tabUrl) {
        const source = data.source || detectSourceFromUrl(tabUrl);
        const result = await DB.add(
            data.sentences, 
            source, 
            data.context || null, 
            data.pageTitle || ""
        );
        return { success: result.success };
    }

    async getAll() {
        const data = await DB.getAll();
        return { data };
    }

    async getAllSorted() {
        const sorted = await DB.getAllSorted();
        return { data: sorted };
    }

    async delete(key, deleteFromBackend) {
        await DB.delete(key, deleteFromBackend);
        return { success: true };
    }

    async clearAll() {
        await DB.clearAll();
        return { success: true };
    }

    async count() {
        const count = await DB.count();
        return { count };
    }

    async syncPending() {
        return await DB.syncPending();
    }

    /**
     * Saves a translation received from SSE to the database.
     * @param {Object} data - Translation data
     */
    async saveTranslation(data) {
        const SENTENCES_KEY = 'my_db';
        try {
            const result = await chrome.storage.local.get(SENTENCES_KEY);
            const db = result[SENTENCES_KEY] || {};
            let found = false;

            for (const key in db) {
                if (db[key].phraseId === data.phrase_id) {
                    db[key].translation = data.traducao_completa;
                    db[key].explanation = data.explicacao;
                    db[key].translationPending = false;
                    db[key].fatias_traducoes = data.fatias_traducoes;
                    db[key].modelo_ia = data.modelo_ia;
                    found = true;
                    // console.log(`[SentenceController] Translation saved: ${key}`);
                    break;
                }
            }

            if (found) {
                await chrome.storage.local.set({ [SENTENCES_KEY]: db });
            } else {
                console.warn(`[SentenceController] No sentence found for phraseId: ${data.phrase_id}`);
            }
        } catch (err) {
            console.error('[SentenceController] Error saving translation:', err);
        }
    }
}

export const sentenceController = new SentenceController();
