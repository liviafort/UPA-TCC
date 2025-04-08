import React from 'react';
import '../App.css';

function Header({ onToggleSidebar }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-button" onClick={onToggleSidebar}>
          &#9776; {/* Ícone "hamburger" */}
        </button>
        <h1 className="header-title">Veja + Saúde</h1>
      </div>
      <input
        type="text"
        className="search-input"
        placeholder="Buscar unidade..."
      />
    </header>
  );
}

export default Header;
