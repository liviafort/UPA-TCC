// src/components/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/globals.css';
import logo from '../assets/logo.png';

function Header({ onToggleSidebar }) {
  const location = useLocation();
  const isUpaDetail = location.pathname.startsWith('/upa/');

  return (
    <header className="app-header">
      <div className="header-left">
        {isUpaDetail ? (
          <Link to="/" className="back-link">← Voltar ao Mapa</Link>
        ) : (
          <button className="menu-button" onClick={onToggleSidebar}>
            &#9776;
          </button>
        )}
      </div>
      <div className="header-right">
        <Link to="/">
          <img src={logo} alt="Logo" className="header-logo" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
