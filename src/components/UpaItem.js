// src/components/UpaItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/UpaItem.css';
import icon from '../assets/hospital-icon.svg'

function UpaItem({ upa, onSelectUpa, bestUpaId }) {
  const { name, address, queueDetail, averageWaitTime } = upa;
  const totalQueue =
    queueDetail.blue + queueDetail.green + queueDetail.yellow + queueDetail.red;

  return (
    <div className="upa-item" onClick={() => onSelectUpa(upa)}>
      <img src={icon} alt="Icon" className="icon-painel" />
      {/* Nome da UPA como link destacado */}
      <h3 className='text-upa-item'>{name}</h3>
      <p>{address}</p>
      <p><strong>Tempo médio em fila:</strong> {averageWaitTime}</p>
      <div className="faixas-grid">
        <span className="badge blue" title="Azul">{queueDetail.blue}</span>
        <span className="badge green" title="Verde">{queueDetail.green}</span>
        <span className="badge yellow" title="Amarela">{queueDetail.yellow}</span>
        <span className="badge red" title="Vermelha">{queueDetail.red}</span>
      </div>
      <p style={{ marginTop: '8px' }}>
        <strong>Total:</strong> {totalQueue} pessoa(s)
      </p>
      <Link to={`/upa/${upa.id}`} className="dash-link">
        <text className='text-upa-item'>Ver detalhes</text>
      </Link>
    </div>
  );
}

export default UpaItem;
