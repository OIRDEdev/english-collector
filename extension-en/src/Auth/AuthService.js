/**
 * AuthService - Gerencia autenticação da extensão via cookies
 * Usa a mesma estratégia do polyglot-flow: HttpOnly cookies (withCredentials)
 */
import { config } from "../Shared/config.js";

class AuthService {
    constructor() {
        this.user = null;
        this.isReady = false;
    }

    /**
     * Verifica se o usuário está autenticado consultando /api/v1/auth/me
     * Os cookies são enviados automaticamente com withCredentials/credentials: 'include'
     * @returns {Promise<Object|null>} user data ou null
     */
    async checkAuth() {
        try {
            const response = await fetch(`${config.apiUrl}/api/v1/auth/me`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            }); 
            if (!response.ok) {
                this.user = null;
                return null;
            }
            const data = await response.json();
            this.user = data;
            console.log("[Auth] Auth check response 2:", data);
            await this._saveUserToStorage(data);
            console.log("[Auth] User authenticated:", data.nome || data.email);
            return data;
        } catch (e) {
            console.warn("[Auth] Auth check failed:", e.message);
            this.user = null;
            return null;
        } finally {
            this.isReady = true;
        }
    }

    /**
     * Login com email/senha via API (cookies são definidos pelo servidor)
     * @param {string} email
     * @param {string} senha
     * @returns {Promise<Object>} user data
     */
    async login(email, senha) {
        const response = await fetch(`${config.apiUrl}/api/v1/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || "Falha no login");
        }

        // Após login, buscar dados do usuário
        const user = await this.checkAuth();
        if (!user) {
            throw new Error("Login succeeded but could not fetch user data");
        }

        return user;
    }

    /**
     * Logout - chama API e limpa dados locais
     */
    async logout() {
        try {
            await fetch(`${config.apiUrl}/api/v1/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (e) {
            console.warn("[Auth] Logout API call failed:", e.message);
        }

        this.user = null;
        await chrome.storage.local.remove(["user_data", "auth_token", "id_token"]);
        console.log("[Auth] Logged out");
    }

    /**
     * Retorna se o usuário está logado
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.user !== null;
    }

    /**
     * Retorna dados do usuário logado
     * @returns {Object|null}
     */
    getUser() {
        return this.user;
    }

    /**
     * Retorna user_id ou fallback
     * @returns {number}
     */
    getUserId() {
        return this.user?.id || 0;
    }

    /**
     * Carrega usuário do storage (para inicialização rápida)
     * @returns {Promise<Object|null>}
     */
    async loadFromStorage() {
        try {
            const data = await chrome.storage.local.get("user_data");
            if (data.user_data) {
                this.user = data.user_data;
                return this.user;
            }
        } catch (e) {
            console.warn("[Auth] Error loading from storage:", e);
        }
        return null;
    }

    /**
     * Salva user data no storage para persistência local
     * @param {Object} user
     */
    async _saveUserToStorage(user) {
        try {
            await chrome.storage.local.set({ user_data: user });
        } catch (e) {
            console.warn("[Auth] Error saving to storage:", e);
        }
    }

    /**
     * Retorna a URL de login do polyglot-flow
     * @returns {string}
     */
    getLoginPageUrl() {
        return "http://localhost:8081/login";
    }
}

const authService = new AuthService();
export { AuthService, authService };
