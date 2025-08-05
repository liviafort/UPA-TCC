// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import Header from './components/Header';
import SidePanel from './components/SidePanel';
import MapView from './components/MapView';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import UpaStatsPage from './pages/UpaStatsPage';
import { fetchUpasComStatus } from './server/Api';


// Coordenadas padrão se o usuário negar a geolocalização
const DEFAULT_CENTER = [-7.2404146, -35.8883043];

function App() {
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const [upas, setUpas] = useState([]);
  const [selectedUpa, setSelectedUpa] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routesData, setRoutesData] = useState({});


  useEffect(() => {
    async function loadUpas() {
      const data = await fetchUpasComStatus();
      setUpas(data);
    }
    loadUpas();
  }, []);


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
  // Configura os handlers de swipe para a sidebar
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setSidebarOpen(false),
    delta: 80, // Distância mínima em pixels para acionar o swipe
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Header
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
          
        <div className="notification-banner">
          ⚠️ Se você estiver em emergência, procure a unidade mais próxima. Você é prioridade!
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