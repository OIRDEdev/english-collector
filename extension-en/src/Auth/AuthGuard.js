/**
 * AuthGuard - Controla visibilidade da UI baseado no estado de autenticação
 * Se não logado: mostra tela de login
 * Se logado: mostra popup normal
 */
import { authService } from "./AuthService.js";

class AuthGuard {
    constructor() {
        this.authScreen = document.getElementById("auth-screen");
        this.mainContent = document.querySelector("main");
        this.navBar = document.querySelector("nav");
    }

    /**
     * Inicializa o guard — verifica auth e ajusta a UI
     * @returns {Promise<boolean>} true se autenticado
     */
    async init() {
        // Tentar carregar do storage primeiro (instante)
        await authService.loadFromStorage();

        if (authService.isLoggedIn()) {
            this.showApp();
        } else {
            this.showLoginScreen();
        }

        // Verificar com o servidor em background
        const user = await authService.checkAuth();

        if (user) {
            this.showApp();
            return true;
        } else {
            this.showLoginScreen();
            return false;
        }
    }

    /**
     * Mostra a tela de login e esconde o app
     */
    showLoginScreen() {
        if (this.authScreen) this.authScreen.style.display = "flex";
        if (this.mainContent) this.mainContent.style.display = "none";
        if (this.navBar) this.navBar.style.display = "none";
    }

    /**
     * Mostra o app e esconde a tela de login
     */
    showApp() {
        if (this.authScreen) this.authScreen.style.display = "none";
        if (this.mainContent) this.mainContent.style.display = "block";
        if (this.navBar) this.navBar.style.display = "flex";
    }

    /**
     * Abre a página de login do polyglot-flow em uma nova aba
     */
    openLoginPage() {
        chrome.tabs.create({ url: authService.getLoginPageUrl() });
    }

    /**
     * Faz login direto pela extensão
     * @param {string} email
     * @param {string} senha
     * @returns {Promise<Object>} user data
     */
    async loginDirect(email, senha) {
        const user = await authService.login(email, senha);
        this.showApp();
        return user;
    }

    /**
     * Faz logout e mostra tela de login
     */
    async logout() {
        await authService.logout();
        this.showLoginScreen();
    }
}

const authGuard = new AuthGuard();
export { AuthGuard, authGuard };
