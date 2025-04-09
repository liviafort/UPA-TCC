import React from 'react';
import UpaItem from './UpaItem';

function SidePanel({ upas, onSelectUpa }) {
  return (
    <>
      {upas.map((upa) => (
        <UpaItem key={upa.id} upa={upa} onSelectUpa={onSelectUpa} />
      ))}
    </>
  );
}

export default SidePanel;
