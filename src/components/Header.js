import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/globals.css';
import logo from '../assets/logo.png';
import mapa from '../assets/mapas.png';

function Header({ onToggleSidebar, isSidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const isUpaDetail = location.pathname.startsWith('/upa/');

  const handleMobileMapClick = () => {
    if (isSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {isUpaDetail ? (
          <>
            <Link to="/" className="back-link desktop-only">
              ← Voltar ao Mapa
            </Link>
          </>
        ) : (
          <>
            <button className="menu-button" onClick={onToggleSidebar}>
              &#9776;
            </button>
            <Link to="/">
              <img
                src={mapa}
                alt="Mapa"
                className="maps-logo mobile-only"
                onClick={handleMobileMapClick}
              />
            </Link>
          </>
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