import React from 'react';

function UpaItem({ upa, onSelectUpa }) {
  const { name, address, queueDetail, doctorOnDuty, averageWaitTime } = upa;
  const totalQueue = queueDetail.blue + queueDetail.green + queueDetail.yellow + queueDetail.red;

  return (
    <div className="upa-item" onClick={() => onSelectUpa(upa)}>
      <h3>{name}</h3>
      <p>{address}</p>
      <p><strong>Médica(o):</strong> {doctorOnDuty}</p>
      <p><strong>Tempo médio:</strong> {averageWaitTime}</p>
      
      <div className="faixas-grid">
        <span className="badge blue" title="Azul">{queueDetail.blue}</span>
        <span className="badge green" title="Verde">{queueDetail.green}</span>
        <span className="badge yellow" title="Amarela">{queueDetail.yellow}</span>
        <span className="badge red" title="Vermelha">{queueDetail.red}</span>
      </div>
      
      <p style={{ marginTop: '8px' }}>
        <strong>Total:</strong> {totalQueue} pessoa(s)
      </p>
    </div>
  );
}

export default UpaItem;
