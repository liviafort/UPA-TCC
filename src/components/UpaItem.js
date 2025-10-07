// src/components/UpaItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/UpaItem.css';
import icon from '../assets/hospital-icon.svg';
import clockIcon from '../assets/clock.svg'

function UpaItem({ upa, onSelectUpa, bestUpaId }) {
  const { name, address, queueDetail, averageWaitTime, totalPacientes } = upa;
  const totalQueue = totalPacientes || 0;

  return (
      <div className="upa-item" onClick={() => onSelectUpa(upa)}>
        <img src={icon} alt="Ícone Hospital" className="icon-painel" />

        <h3 className='text-upa-item'>{name}</h3>

        <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1rem' }}>📍</span> {address}
        </p>

        <div style={{
          marginBottom: '12px'
        }}>
          <p style={{ margin: '0', fontSize: '0.85rem', color: '#6c757d' }}>
            Tempo médio de espera
          </p>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#09AC96',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img src={clockIcon} alt="Tempo" style={{ width: '24px', height: '24px' }} />
            <span>{averageWaitTime}</span>
          </p>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <p style={{
            fontSize: '0.85rem',
            color: '#6c757d',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            Classificação de Risco
          </p>
          <div className="faixas-grid">
            <span className="badge blue" title="Não Urgente">{queueDetail.blue}</span>
            <span className="badge green" title="Pouco Urgente">{queueDetail.green}</span>
            <span className="badge yellow" title="Urgente">{queueDetail.yellow}</span>
            <span className="badge red" title="Emergência">{queueDetail.red}</span>
          </div>
        </div>

        <p style={{
          marginTop: '12px',
          fontSize: '0.95rem',
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          Total: <span style={{ color: '#09AC96', fontSize: '1.1rem' }}>{totalQueue}</span> paciente{totalQueue !== 1 ? 's' : ''}
        </p>

        <Link to={`/upa/${upa.id}`} className="dash-link">
          Ver Detalhes
        </Link>
      </div>
  );
}

export default UpaItem;
