// src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';
import logo from '../assets/logo.png';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (user?.id) {
      try {
        const profile = await AuthService.getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <img src={logo} alt="Logo" width="106" height="40" viewBox="0 0 60 60"/>
          </div>

          <div className="admin-user-menu">
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="admin-user-details">
                <span className="admin-user-name">{user?.username}</span>
                <span className="admin-user-role">Administrador</span>
              </div>
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3H3V17H13V15H11V15H5V5H11V5H13V3Z" fill="currentColor"/>
                <path d="M16.293 9.293L13.293 6.293L14.707 4.879L20 10.172L14.707 15.465L13.293 14.051L16.293 11.051H7V9.051H16.293V9.293Z" fill="currentColor"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-container">
          <div className="admin-welcome">
            <h2>Bem-vindo(a), {user?.username}!</h2>
            <p>Painel de controle do sistema UPA Fácil</p>
          </div>

          {/* Cards de estatísticas */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon blue">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2ZM16 6C18.206 6 20 7.794 20 10C20 12.206 18.206 14 16 14C13.794 14 12 12.206 12 10C12 7.794 13.794 6 16 6ZM16 26C12.666 26 9.69 24.361 7.862 21.849C8.495 19.426 12.537 18 16 18C19.463 18 23.505 19.426 24.138 21.849C22.31 24.361 19.334 26 16 26Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3>Perfil</h3>
                <p className="stat-value">{userProfile?.username || user?.username}</p>
                <p className="stat-label">Usuário autenticado</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon green">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2L6 12H12V26H20V12H26L16 2Z" fill="currentColor"/>
                  <path d="M4 28H28V30H4V28Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3>UPAs Cadastradas</h3>
                <p className="stat-value">-</p>
                <p className="stat-label">Total de unidades</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon yellow">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4C9.373 4 4 9.373 4 16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16C28 9.373 22.627 4 16 4ZM16 26C10.477 26 6 21.523 6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 21.523 21.523 26 16 26Z" fill="currentColor"/>
                  <path d="M15 10H17V17H15V10Z" fill="currentColor"/>
                  <path d="M15 19H17V21H15V19Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3>Status do Sistema</h3>
                <p className="stat-value">Ativo</p>
                <p className="stat-label">Funcionando normalmente</p>
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="admin-actions">
            <h3>Ações Rápidas</h3>
            <div className="action-buttons">
              <button className="action-btn" onClick={() => navigate('/')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
                Ver Mapa
              </button>

              <button className="action-btn" onClick={() => navigate('/admin/reports')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
                </svg>
                Relatórios
              </button>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
