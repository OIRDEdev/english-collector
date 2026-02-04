import { config } from "./config.js";

/**
 * API Client - Gerencia chamadas para o backend
 * Responsável por autenticação e envio de frases
 */
class ApiClient {
    constructor(options = {}) {
        this.config = options.config || config;
        this.authHeader = null;
        this.isAuthenticated = false;
        this.lastPhrase = "";
    }

    /**
     * Define o header de autorização
     * @param {string} token - Token de acesso
     */
    setAuthToken(token) {
        if (token) {
            this.authHeader = `Bearer ${token}`;
            this.isAuthenticated = true;
        } else {
            this.authHeader = null;
            this.isAuthenticated = false;
        }
    }

    /**
     * Carrega token salvo do storage
     */
    async loadSavedAuth() {
        try {
            const data = await chrome.storage.local.get("auth_token");
            if (data.auth_token) {
                this.setAuthToken(data.auth_token);
                return true;
            }
        } catch (e) {
            console.warn("[API] Error loading auth:", e);
        }
        return false;
    }

    /**
     * Salva token no storage
     * @param {string} token - Token para salvar
     */
    async saveAuthToken(token) {
        await chrome.storage.local.set({ auth_token: token });
        this.setAuthToken(token);
    }

    /**
     * Remove autenticação
     */
    async logout() {
        await chrome.storage.local.remove("auth_token");
        this.authHeader = null;
        this.isAuthenticated = false;
        console.log("[API] Logged out");
    }

    /**
     * Realiza login com tokens
     * @param {string} idToken - ID Token
     * @param {string} accessToken - Access Token
     * @returns {Promise<boolean>}
     */
    async login(idToken, accessToken) {
        try {
            await chrome.storage.local.set({ 
                id_token: idToken,
                auth_token: accessToken 
            });
            this.setAuthToken(accessToken);
            console.log("[API] Login successful");
            return true;
        } catch (e) {
            console.error("[API] Login failed:", e);
            return false;
        }
    }

    /**
     * Método genérico para chamadas HTTP
     * @param {Object} options - Opções da requisição
     * @returns {Promise<Object>}
     */
    async call(options) {
        const { method, endpoint, body, responseType = "json" } = options;

        const headers = {
            "Content-Type": "application/json; charset=UTF-8"
        };

        if (this.authHeader) {
            headers["Authorization"] = this.authHeader;
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (responseType === "text") {
                return await response.text();
            }

            return await response.json();
        } catch (error) {
            console.error(`[API] Error calling ${method} ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Envia uma frase para o backend
     * @param {string} text - Texto da frase
     * @param {string} streamingName - Nome do streaming
     * @returns {Promise<Object>}
     */
    async addPhrase(text, streamingName) {
        if (!text || text.trim() === "" || text === this.lastPhrase) {
            return { success: false, reason: "empty_or_duplicate" };
        }

        try {
            const result = await this.call({
                method: "POST",
                endpoint: "frase",
                body: {
                    texto: text.trim(),
                    streaming: { nome: streamingName || "Unknown" }
                }
            });

            this.lastPhrase = text;
            console.log("[API] Phrase sent:", text.substring(0, 50) + "...");
            return { success: true, data: result };
        } catch (error) {
            console.error("[API] Failed to send phrase:", error);
            return { success: false, error };
        }
    }

    /**
     * Busca frases do backend
     * @param {Object} options - Opções de busca
     * @returns {Promise<Array>}
     */
    async getPhrases(options = { take: 50 }) {
        try {
            const result = await this.call({
                method: "GET",
                endpoint: `frase?take=${options.take}`
            });

            return result.result || [];
        } catch (error) {
            console.error("[API] Failed to get phrases:", error);
            return [];
        }
    }

    /**
     * Deleta uma frase do backend
     * @param {string} id - ID da frase
     * @returns {Promise<boolean>}
     */
    async deletePhrase(id) {
        try {
            await this.call({
                method: "DELETE",
                endpoint: `frase/${id}`
            });
            return true;
        } catch (error) {
            console.error("[API] Failed to delete phrase:", error);
            return false;
        }
    }

    /**
     * Verifica status da API
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            await this.call({
                method: "GET",
                endpoint: "health"
            });
            return true;
        } catch {
            return false;
        }
    }
}

// Exporta classe e instância singleton
const api = new ApiClient();

export { ApiClient, api };
