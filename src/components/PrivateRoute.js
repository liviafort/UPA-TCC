// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para o login se o usuário não estiver autenticado
 */
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#09AC96'
      }}>
        Verificando autenticação...
      </div>
    );
  }

  // Redireciona para login se não estiver autenticado
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Renderiza o componente filho se estiver autenticado
  return children;
}

export default PrivateRoute;
