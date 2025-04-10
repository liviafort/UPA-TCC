// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import Header from './components/Header';
import SidePanel from './components/SidePanel';
import MapView from './components/MapView';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import UpaStatsPage from './pages/UpaStatsPage';


// Coordenadas padrão se o usuário negar a geolocalização
const DEFAULT_CENTER = [-7.2404146, -35.8883043];

// Dados mockados das UPAs
const MOCK_UPAS = [
  {
    id: 1,
    name: 'UPA Dinamérica',
    address: 'Avenida Dinamérica Alves Correia, 1289 - Dinamérica',
    queueDetail: { blue: 2, green: 5, yellow: 10, red: 3 },
    lat: -7.245232,
    lng: -35.9114377,
    doctorOnDuty: 'Dra. Maria Souza',
    averageWaitTime: '35 min',
  },
  {
    id: 2,
    name: 'UPA Alto Branco',
    address: 'Avenida Manoel Tavares, 1735, Alto Branco',
    queueDetail: { blue: 0, green: 3, yellow: 2, red: 0 },
    lat: -7.1998982,
    lng: -35.8773173,
    doctorOnDuty: 'Dr. João Silva',
    averageWaitTime: '20 min',
  },
];

function App() {
  const [upas] = useState(MOCK_UPAS);
  const [selectedUpa, setSelectedUpa] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [routesData, setRoutesData] = useState({});

  // Solicita a localização do usuário via navegador
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Erro ao obter localização:", err);
          setUserLocation({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
        }
      );
    } else {
      setUserLocation({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
    }
  }, []);

  // Chamadas à API OSRM para cada UPA (manter como antes)
  useEffect(() => {
    if (userLocation) {
      Promise.all(
        upas.map((upa) => {
          const url = `https://router.project-osrm.org/route/v1/walking/${userLocation.lng},${userLocation.lat};${upa.lng},${upa.lat}?overview=full&geometries=geojson`;
          return fetch(url)
            .then(res => res.json())
            .then(data => {
              if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                return {
                  id: upa.id,
                  duration: route.duration, // em segundos
                  distance: route.distance, // em metros
                  coords: route.geometry.coordinates.map(c => [c[1], c[0]])
                };
              } else {
                return { id: upa.id, duration: Infinity, distance: Infinity, coords: null };
              }
            })
            .catch(err => {
              console.error("Erro na rota OSRM p/ UPA " + upa.id + ":", err);
              return { id: upa.id, duration: Infinity, distance: Infinity, coords: null };
            });
        })
      ).then(results => {
        const dataObj = {};
        results.forEach(item => {
          dataObj[item.id] = item;
        });
        setRoutesData(dataObj);
      });
    }
  }, [userLocation, upas]);

  // Calcula o "score" para cada UPA
  const { bestUpaId } = useMemo(() => {
    let bestScore = Infinity;
    let bestId = null;
    upas.forEach(upa => {
      const route = routesData[upa.id];
      if (route && route.duration !== Infinity) {
        const travelMin = Math.ceil(route.duration / 60);
        const waitMin = parseInt(upa.averageWaitTime.split(" ")[0]);
        const score = travelMin + waitMin;
        if (score < bestScore) {
          bestScore = score;
          bestId = upa.id;
        }
      }
    });
    return { bestUpaId: bestId };
  }, [routesData, upas]);

  // Se nenhuma UPA estiver selecionada, define automaticamente a melhor
  useEffect(() => {
    if (!selectedUpa && bestUpaId) {
      const best = upas.find(upa => upa.id === bestUpaId);
      setSelectedUpa(best);
    }
  }, [bestUpaId, selectedUpa, upas]);

  const handleSelectUpa = (upa) => {
    setSelectedUpa(upa);
    setSidebarOpen(false);    // fecha a sidebar
  };
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Configura os handlers de swipe para a sidebar
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setSidebarOpen(false),
    delta: 80, // Distância mínima em pixels para acionar o swipe
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  return (
    <HashRouter>
      <div className="app-wrapper">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="notification-banner">
          Se você estiver em emergência, procure a agência mais próxima. Você é prioridade!
        </div>

        <Routes>
          {/* Página Principal */}
          <Route path="/" element={
            <div className="main-content" {...swipeHandlers}>
              <div className={`sidebar ${sidebarOpen ? '' : 'sidebar-closed'}`}>
                <SidePanel
                  upas={upas}
                  onSelectUpa={handleSelectUpa}
                  bestUpaId={bestUpaId}
                />
              </div>
              <div className="map-container">
                <MapView
                  upas={upas}
                  selectedUpa={selectedUpa}
                  userLocation={userLocation}
                  routesData={routesData}
                  bestUpaId={bestUpaId}
                />
              </div>
            </div>
          }/>

          {/* Página de Estatísticas da UPA */}
          <Route path="/upa/:id" element={
            <div className="main-content" {...swipeHandlers}>
              <div className={`sidebar ${sidebarOpen ? '' : 'sidebar-closed'}`}>
                <SidePanel
                  upas={upas}
                  onSelectUpa={handleSelectUpa}
                  bestUpaId={bestUpaId}
                />
              </div>
              <div className="map-container">
                <UpaStatsPage upas={upas} />
              </div>
            </div>
          }/>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;