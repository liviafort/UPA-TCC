import React, { useState } from 'react';
import './App.css';
import SidePanel from '../src/components/SidePanel';
import MapView from '../src/components/MapView';

// Dados mockados das UPAs
const MOCK_UPAS = [
  {
    id: 1,
    name: 'UPA Dinamérica',
    address: 'Rua Exemplo, 123 - Dinamérica, Campina Grande - PB',
    lat: -7.2424,
    lng: -35.9035,
    queue: 10, // Fila mediana (amarelo)
  },
  {
    id: 2,
    name: 'UPA Alto Branco',
    address: 'Avenida Principal, 999 - Alto Branco, Campina Grande - PB',
    lat: -7.2191,
    lng: -35.8818,
    queue: 3, // Fila curta (verde)
  },
  {
    id: 3,
    name: 'UPA Bodocongó',
    address: 'Travessa da Saúde, 45 - Bodocongó, Campina Grande - PB',
    lat: -7.2178,
    lng: -35.9299,
    queue: 20, // Fila alta (vermelho)
  },
];

function App() {
  const [upas] = useState(MOCK_UPAS);
  const [selectedUpa, setSelectedUpa] = useState(null);

  const handleSelectUpa = (upa) => {
    setSelectedUpa(upa);
  };

  return (
    <div className="app-container">
      <SidePanel upas={upas} onSelectUpa={handleSelectUpa} />
      <div className="map-view">
        <MapView upas={upas} selectedUpa={selectedUpa} />
      </div>
    </div>
  );
}

export default App;
