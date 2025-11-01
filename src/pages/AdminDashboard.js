// src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';
import AnalyticsService from '../services/AnalyticsService';
import RoutingService from '../services/RoutingService';
import AdminSidebar from '../components/AdminSidebar';
import {
  fetchUpasComStatus,
  getTotalEntriesLast24h,
  getTotalScreeningsLast24h,
  getTotalTreatmentsLast24h,
  getUpasByCityAndState,
  getUpaEvolution
} from '../server/Api';
import logo from '../assets/logo.png';
import '../styles/AdminDashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalUpas, setTotalUpas] = useState(0);
  const [comparison, setComparison] = useState([]);
  const [upas, setUpas] = useState([]);
  const [upasByState, setUpasByState] = useState([]);
  const [noUpasInState, setNoUpasInState] = useState(false);
  const [analytics24h, setAnalytics24h] = useState({
    entries: null,
    screenings: null,
    treatments: null
  });
  const [evolutionData, setEvolutionData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadUserProfile();
    load24hAnalytics();
  }, []);

  useEffect(() => {
    if (userProfile?.state && userProfile?.city) {
      loadUpasByUserState();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    if (user?.id) {
      try {
        const profile = await AuthService.getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const loadUpasByUserState = async () => {
    try {
      console.log('Buscando UPAs para cidade:', userProfile.city, 'estado:', userProfile.state);

      const upasData = await getUpasByCityAndState(userProfile.city, userProfile.state);

      console.log('UPAs encontradas:', upasData);

      if (upasData.length === 0) {
        setNoUpasInState(true);
        setTotalUpas(0);
        setUpasByState([]);
      } else {
        setNoUpasInState(false);
        setUpasByState(upasData);
        setTotalUpas(upasData.length);

        // Busca todas as UPAs para os gráficos de comparação
        const allUpasData = await fetchUpasComStatus();
        setUpas(allUpasData);

        // Busca dados de comparação
        const comparisonData = await AnalyticsService.getUpaComparison();
        setComparison(comparisonData);

        // Busca dados de evolução das UPAs (últimos 7 dias)
        if (upasData.length > 0) {
          loadEvolutionData(upasData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar UPAs do estado:', error);
      setNoUpasInState(true);
      setTotalUpas(0);
      setUpasByState([]);
    }
  };

  const loadEvolutionData = async (upasData) => {
    try {
      console.log('📊 Carregando evolução para UPAs:', upasData.map(u => ({ id: u.id, name: u.name })));

      // Busca evolução de cada UPA (7 dias)
      const evolutionPromises = upasData.map(upa => {
        console.log(`  🔄 Buscando evolução para ${upa.name} (${upa.id})`);
        return getUpaEvolution(upa.id, 7); // Garante que passa days=7
      });
      const evolutionResults = await Promise.all(evolutionPromises);

      console.log('📈 Resultados de evolução recebidos:');
      evolutionResults.forEach((result, index) => {
        console.log(`  ${upasData[index].name}:`, {
          period: result.period,
          dataLength: result.data?.length,
          data: result.data
        });
      });

      // Organiza os dados por UPA
      const organizedData = evolutionResults.map((result, index) => ({
        upaId: upasData[index].id,
        upaName: upasData[index].name,
        data: result.data || []
      }));

      setEvolutionData(organizedData);
      console.log('✅ Dados de evolução organizados:', organizedData);
    } catch (error) {
      console.error('❌ Erro ao carregar evolução das UPAs:', error);
    }
  };

  const load24hAnalytics = async () => {
    try {
      const [entries, screenings, treatments] = await Promise.all([
        getTotalEntriesLast24h(),
        getTotalScreeningsLast24h(),
        getTotalTreatmentsLast24h()
      ]);

      console.log('=== 24h Analytics ===');
      console.log('Entries:', entries);
      console.log('Screenings:', screenings);
      console.log('Treatments:', treatments);

      setAnalytics24h({
        entries,
        screenings,
        treatments
      });
    } catch (error) {
      console.error('Erro ao carregar analytics das últimas 24h:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userProfile={userProfile}
      />

      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="admin-logo">
            <img src={logo} alt="Logo" width="106" height="40" viewBox="0 0 60 60"/>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-container">
          <div className="admin-welcome">
            <h2>Bem-vindo(a), {user?.username}!</h2>
            <p>Painel de controle do sistema Veja+Saúde</p>
          </div>

          {/* Cards de estatísticas */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon blue">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2ZM16 6C18.206 6 20 7.794 20 10C20 12.206 18.206 14 16 14C13.794 14 12 12.206 12 10C12 7.794 13.794 6 16 6ZM16 26C12.666 26 9.69 24.361 7.862 21.849C8.495 19.426 12.537 18 16 18C19.463 18 23.505 19.426 24.138 21.849C22.31 24.361 19.334 26 16 26Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3>Perfil</h3>
                <p className="stat-value">{userProfile?.username || user?.username}</p>
                <p className="stat-label">Usuário autenticado</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon green">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2L6 12H12V26H20V12H26L16 2Z" fill="currentColor"/>
                  <path d="M4 28H28V30H4V28Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3>UPAs Cadastradas</h3>
                <p className="stat-value">{totalUpas}</p>
                <p className="stat-label">
                  {noUpasInState
                    ? `UPAs indisponíveis em ${userProfile?.state}`
                    : `Unidades em ${userProfile?.city} - ${userProfile?.state}`}
                </p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon yellow">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4C9.373 4 4 9.373 4 16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16C28 9.373 22.627 4 16 4ZM16 26C10.477 26 6 21.523 6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 21.523 21.523 26 16 26Z" fill="currentColor"/>
                  <path d="M15 10H17V17H15V10Z" fill="currentColor"/>
                  <path d="M15 19H17V21H15V19Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3>Status do Sistema</h3>
                <p className="stat-value">Ativo</p>
                <p className="stat-label">Funcionando normalmente</p>
              </div>
            </div>
          </div>

          {/* Mensagem de UPAs indisponíveis */}
          {noUpasInState && (
            <div className="no-upas-message">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM24 40C15.16 40 8 32.84 8 24C8 15.16 15.16 8 24 8C32.84 8 40 15.16 40 24C40 32.84 32.84 40 24 40Z" fill="#F59E0B"/>
                <path d="M22 22H26V34H22V22Z" fill="#F59E0B"/>
                <path d="M22 14H26V18H22V14Z" fill="#F59E0B"/>
              </svg>
              <h3>UPAs Indisponíveis</h3>
              <p>Não existem UPAs cadastradas no estado de <strong>{userProfile?.state}</strong>.</p>
              <p>Entre em contato com o administrador do sistema para mais informações.</p>
            </div>
          )}

          {/* Comparação entre UPAs */}
          {!noUpasInState && comparison.length > 0 && (
            <div className="comparison-section">
              <h3>Comparação entre UPAs</h3>

              <div className="comparison-grid">
                {comparison.map((upa, index) => (
                  <div key={index} className="upa-comparison-card">
                    <div className="upa-comparison-header">
                      <h4>{upa.upaNome}</h4>
                    </div>

                    <div className="comparison-metrics">
                      <div className="metric-row">
                        <span className="metric-label">Total de Pacientes</span>
                        <div className="metric-bar-container">
                          <div
                            className="metric-bar metric-bar-patients"
                            style={{ width: `${(upa.totalPacientes / Math.max(...comparison.map(u => u.totalPacientes))) * 100}%` }}
                          >
                            <span className="metric-value">{upa.totalPacientes}</span>
                          </div>
                        </div>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Tempo Médio</span>
                        <div className="metric-bar-container">
                          <div
                            className="metric-bar metric-bar-time"
                            style={{ width: `${(upa.tempoMedioEspera / Math.max(...comparison.map(u => u.tempoMedioEspera))) * 100}%` }}
                          >
                            <span className="metric-value">{RoutingService.formatMinutes(upa.tempoMedioEspera)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Bairros Atendidos</span>
                        <div className="metric-bar-container">
                          <div
                            className="metric-bar metric-bar-bairros"
                            style={{ width: `${(upa.bairrosUnicos / Math.max(...comparison.map(u => u.bairrosUnicos))) * 100}%` }}
                          >
                            <span className="metric-value">{upa.bairrosUnicos}</span>
                          </div>
                        </div>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Status de Ocupação</span>
                        <div className={`metric-status-container status-${upa.statusOcupacao?.toLowerCase()}`}>
                          <span className="metric-status-text">{upa.statusOcupacao?.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evolução das UPAs - Últimos 7 Dias */}
          {!noUpasInState && evolutionData.length > 0 && (
            <div className="evolution-section">
              <h3>Evolução das UPAs - Últimos 7 Dias</h3>
              <div className="evolution-chart-card">
                <Line
                  data={{
                    labels: evolutionData[0]?.data.map(item => {
                      const date = new Date(item.date);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }) || [],
                    datasets: evolutionData.map((upaEvolution, index) => {
                      const colors = [
                        { bg: 'rgba(9, 172, 150, 0.2)', border: 'rgba(9, 172, 150, 1)' },
                        { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 1)' },
                        { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 1)' }
                      ];
                      const color = colors[index % colors.length];

                      return {
                        label: upaEvolution.upaName,
                        data: upaEvolution.data.map(item => item.entradas),
                        borderColor: color.border,
                        backgroundColor: color.bg,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: color.border,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                      };
                    })
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 13,
                            weight: '600'
                          }
                        }
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                          size: 14,
                          weight: 'bold'
                        },
                        bodyFont: {
                          size: 13
                        },
                        callbacks: {
                          label: (context) => {
                            return `${context.dataset.label}: ${context.parsed.y} entradas`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 10,
                          font: {
                            size: 12
                          }
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 12
                          }
                        },
                        grid: {
                          display: false
                        }
                      }
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Análises Gerais - Últimas 24h */}
          {!noUpasInState && analytics24h.entries && analytics24h.screenings && analytics24h.treatments && (
            <div className="analytics-24h-section">
              <h3>Comparações Gerais - Últimas 24 Horas</h3>
              <div className="analytics-24h-grid">
                {/* Entradas */}
                <div className="analytics-card">
                  <h4>Entradas de Pacientes</h4>
                  <div className="chart-container-small">
                    <Bar
                      data={{
                        labels: Object.keys(analytics24h.entries).map(upaId => {
                          const upa = upas.find(u => u.id === upaId);
                          return upa ? upa.name : 'UPA';
                        }),
                        datasets: [{
                          label: 'Entradas',
                          data: Object.values(analytics24h.entries),
                          backgroundColor: 'rgba(9, 172, 150, 0.7)',
                          borderColor: 'rgba(9, 172, 150, 1)',
                          borderWidth: 2
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 10 }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Triagens */}
                <div className="analytics-card">
                  <h4>Triagens Realizadas</h4>
                  <div className="chart-container-small">
                    <Bar
                      data={{
                        labels: Object.keys(analytics24h.screenings).map(upaId => {
                          const upa = upas.find(u => u.id === upaId);
                          return upa ? upa.name : 'UPA';
                        }),
                        datasets: [{
                          label: 'Triagens',
                          data: Object.values(analytics24h.screenings),
                          backgroundColor: 'rgba(59, 130, 246, 0.7)',
                          borderColor: 'rgba(59, 130, 246, 1)',
                          borderWidth: 2
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 10 }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Atendimentos */}
                <div className="analytics-card">
                  <h4>Atendimentos Concluídos</h4>
                  <div className="chart-container-small">
                    <Bar
                      data={{
                        labels: Object.keys(analytics24h.treatments).map(upaId => {
                          const upa = upas.find(u => u.id === upaId);
                          return upa ? upa.name : 'UPA';
                        }),
                        datasets: [{
                          label: 'Atendimentos',
                          data: Object.values(analytics24h.treatments),
                          backgroundColor: 'rgba(245, 158, 11, 0.7)',
                          borderColor: 'rgba(245, 158, 11, 1)',
                          borderWidth: 2
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 10 }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações rápidas */}
          <div className="admin-actions" style={{ marginTop: '32px' }}>
            <h3>Ações Rápidas</h3>
            <div className="action-buttons">
              <button className="action-btn" onClick={() => navigate('/')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
                Ver Mapa
              </button>

              <button className="action-btn" onClick={() => navigate('/admin/reports')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
                </svg>
                Relatórios
              </button>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
