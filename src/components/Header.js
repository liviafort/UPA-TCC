// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/globals.css';
import logo from '../assets/logo.png'; // ajuste o caminho conforme necessário

function Header({ onToggleSidebar }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-button" onClick={onToggleSidebar}>
          &#9776;
        </button>
        <Link to="/">
          <img src={logo} alt="Logo" className="header-logo" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
