import React, { useState } from 'react';
import './App.css';
import SidePanel from '../src/components/SidePanel';
import MapView from '../src/components/MapView';

const MOCK_UPAS = [
  {
    id: 1,
    name: 'UPA Dinamérica',
    address: 'Rua Exemplo, 123 - Dinamérica, Campina Grande - PB',
    lat: -7.245232,
    lng: -35.9114377,
    queue: 10,
  },
  {
    id: 2,
    name: 'UPA Alto Branco',
    address: 'Avenida Principal, 999 - Alto Branco, Campina Grande - PB',
    lat: -7.1998982,
    lng: -35.8773173,
    queue: 3, 
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
