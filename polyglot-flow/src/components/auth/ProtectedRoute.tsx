import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login, mantendo a intenção de rota original
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // O componente pode opcionalmente verificar o "Onboarding" se necessário,
  // mas como os settings do usuário estão acessíveis,
  // poderíamos redirecionar para /onboarding aqui.
  
  return <Outlet />;
};

export const PublicRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
  
    if (isLoading) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
  
    if (isAuthenticated) {
      // Redirecionar para dashboard se já logado nas rotas publicas
      return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }
    
    return <Outlet />;
  };
