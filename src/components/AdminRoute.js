// src/components/AdminRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getUserProfile } from '../server/Api';

/**
 * Componente para proteger rotas que requerem role ADMIN
 * Redireciona para o dashboard se o usuário não tiver permissão
 */
function AdminRoute({ children }) {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
        } catch (error) {
          console.error('Erro ao buscar perfil do usuário:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading]);

  // Mostra loading enquanto verifica autenticação e role
  if (authLoading || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#09AC96'
      }}>
        Verificando permissões...
      </div>
    );
  }

  // Redireciona para login se não estiver autenticado
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Redireciona para dashboard se não for ADMIN
  if (userProfile?.role !== 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Renderiza o componente filho se for ADMIN
  return children;
}

export default AdminRoute;
