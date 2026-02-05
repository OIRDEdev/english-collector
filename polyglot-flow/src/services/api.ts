import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { LoginRequest, LoginResponse, GoogleAuthRequest, User } from '@/types/api';

const API_BASE_URL = 'https://api.multlearningweb.com/api/v1';

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'polyglotflow_access_token';
const REFRESH_TOKEN_KEY = 'polyglotflow_refresh_token';
const USER_KEY = 'polyglotflow_user';

class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
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
    // Request interceptor - add token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
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

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError as Error, null);
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

  private processQueue(error: Error | null, token: string | null): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post<{ access_token: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken }
    );

    const newAccessToken = response.data.access_token;
    this.setAccessToken(newAccessToken);
    return newAccessToken;
  }

  // Token Management
  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  public getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  public setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  public logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  }

  // Auth Endpoints
  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>('/auth/login', credentials);
    const { user, access_token, refresh_token } = response.data;
    
    this.setAccessToken(access_token);
    this.setRefreshToken(refresh_token);
    this.setUser(user);
    
    return response.data;
  }

  public async loginWithGoogle(credential: string): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>('/auth/google', { credential } as GoogleAuthRequest);
    const { user, access_token, refresh_token } = response.data;
    
    this.setAccessToken(access_token);
    this.setRefreshToken(refresh_token);
    this.setUser(user);
    
    return response.data;
  }

  public async register(data: { nome: string; email: string; senha: string }): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>('/auth/register', data);
    const { user, access_token, refresh_token } = response.data;
    
    this.setAccessToken(access_token);
    this.setRefreshToken(refresh_token);
    this.setUser(user);
    
    return response.data;
  }

  // API Instance for other services
  public get api(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiService = ApiService.getInstance();
export default apiService;
