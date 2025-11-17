// src/components/UpaItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/UpaItem.css';
import icon from '../assets/hospital-icon.svg';
import clockIcon from '../assets/clock.svg'

function UpaItem({ upa, onSelectUpa, bestUpaId }) {
  const { name, address, queueDetail, averageWaitTime, totalPacientes, aguardandoTriagem } = upa;
  const totalQueue = totalPacientes || 0;
  const waitingTriage = aguardandoTriagem || 0;

  return (
      <div className="upa-item" onClick={() => onSelectUpa(upa)}>
        <img src={icon} alt="Ícone Hospital" className="icon-painel" />

        <h3 className='text-upa-item'>{name}</h3>

        <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1rem' }}></span> {address}
        </p>

        <div style={{ marginBottom: '12px'}}>
          <p style={{ 
            margin: '0', 
            fontWeight: '600',
            fontSize: '0.85rem', 
            color: '#6c757d' 
          }}>
            Tempo médio de espera
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
            marginLeft: '23px',
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#09AC96'
          }}>
            <img src={clockIcon} alt="Tempo" style={{ width: '24px', height: '24px' }} />
            <span>{averageWaitTime}</span>
          </div>
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
            <span className="badge orange" title="Muito Urgente">{queueDetail.orange}</span>
            <span className="badge red" title="Emergência">{queueDetail.red}</span>
          </div>
        </div>

        <p style={{
          marginTop: '8px',
          fontSize: '0.95rem',
          fontWeight: '500',
          color: '#6c757d'
        }}>
          Pacientes aguardando triagem: <span style={{ color: '#2c3e50', fontWeight: '600' }}>{waitingTriage}</span>
        </p>

        <p style={{
          marginTop: '13px',
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
