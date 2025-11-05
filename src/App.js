// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import Header from './components/Header';
import SidePanel from './components/SidePanel';
import MapView from './components/MapView';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import UpaStatsPage from './pages/UpaStatsPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './contexts/AuthContext';
import { fetchUpasComStatus } from './server/Api';
import RoutingService from './services/RoutingService';
import webSocketService from './services/WebSocketService';


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

    // Conecta ao WebSocket
    webSocketService.connect();

    // Escuta atualizações de todas as UPAs
    const unsubscribe = webSocketService.onAllUpasUpdate((data) => {
      // Atualiza a UPA específica que recebeu atualização
      setUpas(prevUpas => {
        return prevUpas.map(upa => {
          if (upa.id === data.upaId) {
            // Extrai os tempos de espera por classificação
            const waitTimesByClassification = {};
            if (data.data.metricasPorClassificacao) {
              data.data.metricasPorClassificacao.forEach(metrica => {
                const classificacao = metrica.classificacao.toLowerCase();
                waitTimesByClassification[classificacao] = metrica.tempoMedioEsperaMinutos;
              });
            }

            return {
              ...upa,
              totalPacientes: data.data.totalPacientes,
              statusOcupacao: data.data.statusOcupacao,
              averageWaitTime: RoutingService.formatMinutes(data.data.tempoMedioEsperaMinutos),
              queueDetail: {
                blue: data.data.porClassificacao.azul || 0,
                green: data.data.porClassificacao.verde || 0,
                yellow: data.data.porClassificacao.amarelo || 0,
                red: data.data.porClassificacao.vermelho || 0,
              },
              waitTimesByClassification: waitTimesByClassification,
            };
          }
          return upa;
        });
      });
    });

    return () => {
      unsubscribe();
      webSocketService.disconnect();
    };
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

  // Calcula rotas com todos os modos de transporte (carro, bicicleta, a pé)
  useEffect(() => {
    if (userLocation && upas.length > 0) {
      Promise.all(
        upas.map(async (upa) => {
          try {
            // Busca todas as rotas simultaneamente
            const routes = await RoutingService.calculateAllRoutes(
              userLocation.lat,
              userLocation.lng,
              upa.lat,
              upa.lng
            );

            // Busca a geometria da rota (usando car para visualização da rota principal)
            const url = `https://router.project-osrm.org/route/v1/car/${userLocation.lng},${userLocation.lat};${upa.lng},${upa.lat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();

            let coords = null;
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
              coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }

            return {
              id: upa.id,
              driving: routes.driving,
              bike: routes.bike,
              foot: routes.foot,
              coords: coords
            };
          } catch (err) {
            console.error(`Erro ao calcular rotas para UPA ${upa.id}:`, err);
            return {
              id: upa.id,
              driving: null,
              bike: null,
              foot: null,
              coords: null
            };
          }
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

  // Calcula o "score" para cada UPA usando tempo de carro
  const { bestUpaId } = useMemo(() => {
    let bestScore = Infinity;
    let bestId = null;
    upas.forEach(upa => {
      const route = routesData[upa.id];
      if (route && route.driving && route.driving.duration) {
        const travelMin = Math.ceil(route.driving.duration / 60);
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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Página de Login para Gestores - Sem Header */}
          <Route path="/gestao/login" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Painel Administrativo - Rota Protegida */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Relatórios Administrativos - Rota Protegida */}
          <Route path="/admin/reports" element={
            <PrivateRoute>
              <AdminReports />
            </PrivateRoute>
          } />

          {/* Perfil do Usuário - Rota Protegida */}
          <Route path="/profile" element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } />

          {/* Gestão de Usuários - Rota Protegida apenas para ADMIN */}
          <Route path="/admin/users" element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          } />

        {/* Páginas com Header e Layout padrão */}
        <Route path="/*" element={
          <div className="app-wrapper">
            <Header
              onToggleSidebar={toggleSidebar}
              isSidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />

            <div className="notification-banner">
              Se você estiver em emergência, procure a unidade mais próxima. Você é prioridade!
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
                      isSidebarOpen={sidebarOpen}
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
        } />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;