import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { LoginRequest, LoginResponse, GoogleAuthRequest, User } from '@/types/api';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Token Storage Keys - Only User is stored in localStorage now
const USER_KEY = 'polyglotflow_user';

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
    // Request interceptor - No longer need to manually add token
    // browser handles cookies automatically

    // Response interceptor - handle 401 and refresh token
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
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
    await this.axiosInstance.post('/auth/refresh');
  }

  // Token Management - Removed as cookies are handled by browser

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
    // We can't know for sure without checking server, but for UI sync we check if valid user object exists
    // However, best practice is to rely on checkAuth on mount.
    return !!this.getUser();
  }

  public async logout(): Promise<void> {
    try {
        await this.axiosInstance.post('/auth/logout');
    } catch (e) {
        console.error("Logout failed", e);
    } finally {
        localStorage.removeItem(USER_KEY);
        // Force reload or redirect
        window.location.href = '/login';
    }
  }

  // Auth Endpoints
  public async login(credentials: LoginRequest): Promise<void> {
    await this.axiosInstance.post('/auth/login', credentials);
    // After login, fetch user info
    await this.checkAuth();
  }

  public async loginWithGoogle(credential: string): Promise<void> {
    await this.axiosInstance.post('/auth/google', { credential });
    await this.checkAuth();
  }

  public async register(data: { nome: string; email: string; senha: string }): Promise<void> {
    await this.axiosInstance.post('/auth/register', data);
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
    native_lang: string;
    target_lang: string;
    daily_minutes: number;
    daily_cards: number;
    plan: string;
    level?: string;
  }): Promise<any> {
    const response = await this.axiosInstance.post('/settings/onboarding', data);
    return response.data;
  }

  // API Instance for other services
  public get api(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiService = ApiService.getInstance();
export default apiService;
