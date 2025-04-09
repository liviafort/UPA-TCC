import React from 'react';
import '../styles/globals.css';
import logo from '../assets/logo.png'; // ajuste o caminho conforme necessário

function Header({ onToggleSidebar }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-button" onClick={onToggleSidebar}>
          &#9776;
        </button>
        <img src={logo} alt="Logo" className="header-logo" />
      </div>
    </header>
  );
}

export default Header;
