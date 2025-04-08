import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import SidePanel from './components/SidePanel';
import MapView from './components/MapView';

const MOCK_UPAS = [
  {
    id: 1,
    name: 'UPA Dinamérica',
    address: 'Rua Exemplo, 123 - Dinamérica, Campina Grande - PB',
    queueDetail: { blue: 2, green: 5, yellow: 10, red: 3 },
    lat: -7.245232,
    lng: -35.9114377,
    doctorOnDuty: 'Dra. Maria Souza',
    averageWaitTime: '35 min',
  },
  {
    id: 2,
    name: 'UPA Alto Branco',
    address: 'Avenida Principal, 999 - Alto Branco, Campina Grande - PB',
    queueDetail: { blue: 0, green: 3, yellow: 2, red: 0 },
    lat: -7.1998982,
    lng: -35.8773173,
    doctorOnDuty: 'Dr. João Silva',
    averageWaitTime: '20 min',
  }
];

function App() {
  const [upas] = useState(MOCK_UPAS);
  const [selectedUpa, setSelectedUpa] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSelectUpa = (upa) => {
    setSelectedUpa(upa);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="app-wrapper">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="notification-banner">
        Se você estiver em situação de emergência, procure a agência mais próxima. Você é prioridade!
      </div>
      <div className="main-content">
        <div className={`sidebar ${sidebarOpen ? '' : 'sidebar-closed'}`}>
          <SidePanel upas={upas} onSelectUpa={handleSelectUpa} />
        </div>
        <div className="map-container">
          <MapView upas={upas} selectedUpa={selectedUpa} />
        </div>
      </div>
    </div>
  );
}

export default App;
