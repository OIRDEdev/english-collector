import { config } from "../Shared/config.js";

/**
 * API Client - Manages backend calls
 * Responsible for authentication and phrase submission
 */
class ApiClient {
    constructor(options = {}) {
        this.config = options.config || config;
        this.authHeader = null;
        this.isAuthenticated = false;
        this.lastPhrase = "";
    }

    /**
     * Sets auth header
     * @param {string} token - Access token
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
     * Loads saved token from storage
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
     * Saves token to storage
     * @param {string} token - Token to save
     */
    async saveAuthToken(token) {
        await chrome.storage.local.set({ auth_token: token });
        this.setAuthToken(token);
    }

    /**
     * Removes authentication
     */
    async logout() {
        await chrome.storage.local.remove("auth_token");
        this.authHeader = null;
        this.isAuthenticated = false;
        console.log("[API] Logged out");
    }

    /**
     * Log in with tokens
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
     * Generic HTTP call method
     * @param {Object} options - Request options
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
     * Sends a phrase to backend
     * @param {string} text 
     * @param {string} urlOrigem 
     * @param {string} tituloPagina 
     * @param {string} context 
     * @param {number} usuarioId 
     * @returns {Promise<Object>}
     */
    async addPhrase(text, urlOrigem = "", tituloPagina = "", context = null, usuarioId = 1) {
        if (!text || text.trim() === "" || text === this.lastPhrase) {
            return { success: false, reason: "empty_or_duplicate" };
        }

        try {
            const body = {
                usuario_id: usuarioId,
                conteudo: text.trim(),
                idioma_origem: "en",
                url_origem: urlOrigem,
                titulo_pagina: tituloPagina
            };

            if (context) {
                body.contexto = context;
            }

            const result = await this.call({
                method: "POST",
                endpoint: "api/v1/phrases",
                body: body
            });

            this.lastPhrase = text;
            const phraseId = result?.data?.id || result?.id || null;
            
            console.log("[API] Phrase sent:", text.substring(0, 50) + "... (ID:", phraseId, ")");
            return { success: true, data: result, phraseId: phraseId };
        } catch (error) {
            console.error("[API] Failed to send phrase:", error);
            return { success: false, error };
        }
    }

    async getPhrases() {
        try {
            const result = await this.call({
                method: "GET",
                endpoint: "api/v1/phrases"
            });
            return result.data || [];
        } catch (error) {
            console.error("[API] Failed to get phrases:", error);
            return [];
        }
    }

    async getPhrase(id) {
        try {
            const result = await this.call({
                method: "GET",
                endpoint: `api/v1/phrases/${id}`
            });
            return result.data || null;
        } catch (error) {
            console.error("[API] Failed to get phrase:", error);
            return null;
        }
    }

    async updatePhrase(id, data) {
        try {
            const result = await this.call({
                method: "PUT",
                endpoint: `api/v1/phrases/${id}`,
                body: {
                    conteudo: data.conteudo,
                    idioma_origem: data.idioma_origem
                }
            });
            return result.data || null;
        } catch (error) {
            console.error("[API] Failed to update phrase:", error);
            return null;
        }
    }

    async deletePhrase(id) {
        try {
            await this.call({
                method: "DELETE",
                endpoint: `api/v1/phrases/${id}`
            });
            return true;
        } catch (error) {
            console.error("[API] Failed to delete phrase:", error);
            return false;
        }
    }

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

const api = new ApiClient();

export { ApiClient, api };
