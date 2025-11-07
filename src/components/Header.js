import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/globals.css';
import logo from '../assets/logo.png';

function Header({ onToggleSidebar }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isUpaDetail = location.pathname.startsWith('/upa/');

  // Se o usuário está autenticado, vai para o dashboard, senão vai para o login
  const gestaoLink = isAuthenticated() ? '/admin/dashboard' : '/gestao/login';

  return (
    <header className="app-header">
      <div className="header-left">
        {isUpaDetail ? (
          <>
            <Link to="/" className="back-link desktop-only">
              Voltar ao Mapa
            </Link>
          </>
        ) : (
          <button className="menu-button" onClick={onToggleSidebar}>
            &#9776;
          </button>
        )}
      </div>
      <div className="header-right">
        <Link to={gestaoLink} className="login-button-header">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 0C6.243 0 4 2.243 4 5C4 7.757 6.243 10 9 10C11.757 10 14 7.757 14 5C14 2.243 11.757 0 9 0Z" fill="currentColor"/>
            <path d="M9 12C4.029 12 0 14.686 0 18H18C18 14.686 13.971 12 9 12Z" fill="currentColor"/>
          </svg>
          {/* Gestão */}
        </Link>
        <Link to="/">
          <img src={logo} alt="Logo" className="header-logo" />
        </Link>
      </div>
    </header>

  );
}

export default Header;