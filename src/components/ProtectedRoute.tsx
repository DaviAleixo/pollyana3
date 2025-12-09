import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/auth.service';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!authService.isAuthenticated()) {
    // Se não estiver autenticado, redireciona para a página de login
    return <Navigate to="/admin/login" replace />;
  }

  // Se estiver autenticado, renderiza os filhos ou o Outlet
  return children ? <>{children}</> : <Outlet />;
}