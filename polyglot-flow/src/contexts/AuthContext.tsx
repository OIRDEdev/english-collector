import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '@/services/api';
import type { User } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = apiService.getUser();
    if (storedUser && apiService.isAuthenticated()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const response = await apiService.login({ email, senha });
    setUser(response.user);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const response = await apiService.loginWithGoogle(credential);
    setUser(response.user);
  }, []);

  const register = useCallback(async (nome: string, email: string, senha: string) => {
    const response = await apiService.register({ nome, email, senha });
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    apiService.logout();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
