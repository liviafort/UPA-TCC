// src/components/AdminSidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AdminSidebar.css';

function AdminSidebar({ isOpen, onClose, userProfile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      {/* Sidebar */}
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Perfil do usuário */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <h3>{userProfile?.name || user?.username}</h3>
            <p className="sidebar-username">@{user?.username}</p>
            <span className={`sidebar-role ${userProfile?.role?.toLowerCase()}`}>
              {userProfile?.role === 'ADMIN' ? 'Administrador' : 'Usuário Padrão'}
            </span>
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="sidebar-nav">
          <button
            className="sidebar-nav-item"
            onClick={() => handleNavigation('/admin/dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
            </svg>
            <span>Página Inicial</span>
          </button>

          <button
            className="sidebar-nav-item"
            onClick={() => handleNavigation('/admin/reports')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
            </svg>
            <span>Relatórios</span>
          </button>

          {/* Mostrar apenas para usuários ADMIN */}
          {userProfile?.role === 'ADMIN' && (
            <button
              className="sidebar-nav-item"
              onClick={() => handleNavigation('/admin/users')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
              </svg>
              <span>Usuários</span>
            </button>
          )}

          <button
            className="sidebar-nav-item"
            onClick={() => handleNavigation('/profile')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
            </svg>
            <span>Configurações</span>
          </button>

          <button
            className="sidebar-nav-item"
            onClick={() => handleNavigation('/')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
            </svg>
            <span>Voltar ao Mapa</span>
          </button>
        </nav>

        {/* Botão de sair */}
        <button className="sidebar-logout" onClick={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 3H3V17H13V15H11V15H5V5H11V5H13V3Z" fill="currentColor"/>
            <path d="M16.293 9.293L13.293 6.293L14.707 4.879L20 10.172L14.707 15.465L13.293 14.051L16.293 11.051H7V9.051H16.293V9.293Z" fill="currentColor"/>
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </>
  );
}

export default AdminSidebar;
