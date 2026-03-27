import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { LoginRequest, LoginResponse, GoogleAuthRequest, User } from '@/types/api';

// Fallback to /api/v1 to allow reverse proxy (e.g. Nginx/ngrok) to handle routing
//const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const API_BASE_URL = '/api';
// Token Storage Keys - Only User is stored in localStorage now
const USER_KEY = 'polyglotflow_user';
const EXTENSION_TOKEN_KEY = 'extension_token';

class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (error: Error) => void;
  }> = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // Important for HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor - Add extension token to Authorization header
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(EXTENSION_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 and refresh token
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                               originalRequest.url?.includes('/auth/refresh') || 
                               originalRequest.url?.includes('/auth/logout');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshAccessToken();
            this.processQueue(null);
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError as Error);
            this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: Error | null): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await this.axiosInstance.post<any>('/auth/refresh');
    if (response.data?.extension_token) {
      localStorage.setItem(EXTENSION_TOKEN_KEY, response.data.extension_token);
    }
  }

  // Token Management
  public getExtensionToken(): string | null {
    return localStorage.getItem(EXTENSION_TOKEN_KEY);
  }

  public getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  public setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Check auth by calling /me endpoint
  public async checkAuth(): Promise<User | null> {
    try {
      const response = await this.axiosInstance.get<User>('/auth/me');
      this.setUser(response.data);
      return response.data;
    } catch (error) {
        return null; // Not authenticated
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getUser();
  }

  public async logout(): Promise<void> {
    try {
        await this.axiosInstance.post('/auth/logout');
    } catch (e) {
        console.error("Logout failed", e);
    } finally {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(EXTENSION_TOKEN_KEY);
    }
  }

  // Auth Endpoints
  public async login(credentials: LoginRequest): Promise<void> {
    const response = await this.axiosInstance.post<any>('/auth/login', credentials);
    if (response.data?.extension_token) {
      localStorage.setItem(EXTENSION_TOKEN_KEY, response.data.extension_token);
    }
    // After login, fetch user info
    await this.checkAuth();
  }

  public async loginWithGoogle(credential: string): Promise<void> {
    const response = await this.axiosInstance.post<any>('/auth/google', { credential });
    if (response.data?.extension_token) {
      localStorage.setItem(EXTENSION_TOKEN_KEY, response.data.extension_token);
    }
    await this.checkAuth();
  }

  public async register(data: { nome: string; email: string; senha: string }): Promise<void> {
    const response = await this.axiosInstance.post<any>('/auth/register', data);
    if (response.data?.extension_token) {
      localStorage.setItem(EXTENSION_TOKEN_KEY, response.data.extension_token);
    }
    await this.checkAuth();
  }

  // Settings Endpoints
  public async getSettings(userId: number): Promise<any> {
    const response = await this.axiosInstance.get(`/settings?user_id=${userId}`);
    return response.data;
  }

  public async updateSettings(data: Record<string, any>): Promise<any> {
    const response = await this.axiosInstance.put('/settings', data);
    return response.data;
  }

  public async completeOnboarding(data: {
    user_id: number;
    native_lang_id: number;
    target_lang_id: number;
    daily_minutes: number;
    daily_cards: number;
    plan: string;
    level?: string;
  }): Promise<any> {
    const response = await this.axiosInstance.post('/settings/onboarding', data);
    return response.data;
  }

  public async getIdiomas(): Promise<any[]> {
    const response = await this.axiosInstance.get('/idiomas');
    return response.data;
  }

  public async markExerciseAsViewed(exercicioId: number): Promise<void> {
    await this.axiosInstance.post(`/exercises/${exercicioId}/view`);
  }

  // API Instance for other services
  public get api(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiService = ApiService.getInstance();
export default apiService;
