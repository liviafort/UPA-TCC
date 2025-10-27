// src/pages/AdminReports.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AdminReports.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  getUpaStatistics,
  getUpaDistribution,
  getUpaPercentages,
  getUpaEvolution,
  getUpaWaitTimes,
  fetchUpasComStatus
} from '../server/Api';
import AnalyticsService from '../services/AnalyticsService';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COLOR_MAP = {
  'NAO_TRIADO': '#94a3b8',
  'AZUL': '#3b82f6',
  'VERDE': '#10b981',
  'AMARELO': '#f59e0b',
  'VERMELHO': '#ef4444'
};

function AdminReports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [upas, setUpas] = useState([]);
  const [selectedUpaId, setSelectedUpaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Dados dos gráficos
  const [statistics, setStatistics] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [percentages, setPercentages] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [waitTimes, setWaitTimes] = useState(null);
  const [bairroStats, setBairroStats] = useState(null);
  const [comparison, setComparison] = useState([]);

  // Carregar lista de UPAs
  useEffect(() => {
    loadUpas();
    loadComparison();
  }, []);

  // Carregar dados quando UPA for selecionada
  useEffect(() => {
    if (selectedUpaId) {
      loadUpaData(selectedUpaId);
    }
  }, [selectedUpaId]);

  const loadUpas = async () => {
    try {
      const data = await fetchUpasComStatus();
      setUpas(data);
      if (data.length > 0) {
        setSelectedUpaId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar UPAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpaData = async (upaId) => {
    setLoadingData(true);
    try {
      const [stats, dist, perc, evol, wait, bairros] = await Promise.all([
        getUpaStatistics(upaId),
        getUpaDistribution(upaId),
        getUpaPercentages(upaId),
        getUpaEvolution(upaId),
        getUpaWaitTimes(upaId),
        AnalyticsService.getBairroStats(upaId)
      ]);

      console.log('=== DEBUG AdminReports ===');
      console.log('Statistics:', stats);
      console.log('Distribution:', dist);
      console.log('Percentages:', perc);
      console.log('Evolution:', evol);
      console.log('WaitTimes:', wait);
      console.log('BairroStats:', bairros);

      // Transformar os dados dos objetos para arrays esperados pelos gráficos
      const distributionArray = dist?.distribution ? Object.entries(dist.distribution).map(([key, value]) => ({
        classificacao: key,
        quantidade: value.count || 0
      })) : [];

      const percentagesArray = perc?.percentages ? Object.entries(perc.percentages).map(([key, value]) => ({
        classificacao: key,
        percentual: value || 0
      })) : [];

      const evolutionArray = evol?.data || [];

      const waitTimesArray = wait?.wait_times?.map(w => ({
        classificacao: w.classification,
        tempoMedio: w.average_wait_time_minutes
      })) || [];

      console.log('=== TRANSFORMED DATA ===');
      console.log('distributionArray:', distributionArray);
      console.log('percentagesArray:', percentagesArray);
      console.log('evolutionArray:', evolutionArray);
      console.log('waitTimesArray:', waitTimesArray);

      setStatistics(stats);
      setDistribution(distributionArray);
      setPercentages(percentagesArray);
      setEvolution(evolutionArray);
      setWaitTimes(waitTimesArray);
      setBairroStats(bairros);
    } catch (error) {
      console.error('Erro ao carregar dados da UPA:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadComparison = async () => {
    try {
      const data = await AnalyticsService.getUpaComparison();
      setComparison(data);
    } catch (error) {
      console.error('Erro ao carregar comparação:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedUpa = upas.find(u => u.id === selectedUpaId);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="60" height="60" rx="12" fill="#09AC96"/>
              <path d="M30 15L20 25H26V40H34V25H40L30 15Z" fill="white"/>
              <path d="M18 42H42V45H18V42Z" fill="white"/>
            </svg>
            <h1>Relatórios e Análises</h1>
          </div>

          <div className="admin-user-menu">
            <button onClick={() => navigate('/admin/dashboard')} className="admin-back-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 9H5.83L11.42 3.41L10 2L2 10L10 18L11.41 16.59L5.83 11H20V9Z" fill="currentColor"/>
              </svg>
              Voltar
            </button>
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="admin-user-name">{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3H3V17H13V15H11V15H5V5H11V5H13V3Z" fill="currentColor"/>
                <path d="M16.293 9.293L13.293 6.293L14.707 4.879L20 10.172L14.707 15.465L13.293 14.051L16.293 11.051H7V9.051H16.293V9.293Z" fill="currentColor"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-container">
          {/* Seletor de UPA */}
          <div className="upa-selector-card">
            <div className="selector-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#09AC96"/>
              </svg>
              <h2>Selecione a UPA</h2>
            </div>
            <select
              value={selectedUpaId}
              onChange={(e) => setSelectedUpaId(e.target.value)}
              className="upa-select"
            >
              {upas.map(upa => (
                <option key={upa.id} value={upa.id}>
                  {upa.name}
                </option>
              ))}
            </select>
            {selectedUpa && (
              <div className="upa-info">
                <p><strong>Endereço:</strong> {selectedUpa.address}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${selectedUpa.statusOcupacao}`}>{selectedUpa.statusOcupacao?.toUpperCase()}</span></p>
              </div>
            )}
          </div>

          {loadingData ? (
            <div className="loading-data">
              <div className="spinner-large"></div>
              <p>Carregando dados...</p>
            </div>
          ) : selectedUpaId && (
            <>
              {/* Cards de Estatísticas Rápidas */}
              {statistics && (
                <div className="stats-quick-cards">
                  <div className="quick-card blue">
                    <div className="quick-card-icon">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4C9.373 4 4 9.373 4 16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16C28 9.373 22.627 4 16 4ZM16 10C17.104 10 18 10.896 18 12C18 13.104 17.104 14 16 14C14.896 14 14 13.104 14 12C14 10.896 14.896 10 16 10ZM20 22H12V20H14V16H13V14H16V20H18V22H20Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="quick-card-content">
                      <h3>{statistics.totalEventos || 0}</h3>
                      <p>Total de Eventos</p>
                    </div>
                  </div>

                  <div className="quick-card green">
                    <div className="quick-card-icon">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4C9.373 4 4 9.373 4 16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16C28 9.373 22.627 4 16 4ZM16 26C10.477 26 6 21.523 6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 21.523 21.523 26 16 26Z" fill="currentColor"/>
                        <path d="M15 10H17V17H15V10Z" fill="currentColor"/>
                        <path d="M15 19H17V21H15V19Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="quick-card-content">
                      <h3>{statistics.taxaConclusao || 0}%</h3>
                      <p>Taxa de Conclusão</p>
                    </div>
                  </div>

                  {bairroStats && (
                    <div className="quick-card yellow">
                      <div className="quick-card-icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 2C11.59 2 8 5.59 8 10C8 15.5 16 28 16 28C16 28 24 15.5 24 10C24 5.59 20.41 2 16 2ZM16 13C14.34 13 13 11.66 13 10C13 8.34 14.34 7 16 7C17.66 7 19 8.34 19 10C19 11.66 17.66 13 16 13Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="quick-card-content">
                        <h3>{bairroStats.bairros?.length || 0}</h3>
                        <p>Bairros Atendidos</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gráficos Principais */}
              <div className="charts-grid">
                {/* Distribuição por Classificação */}
                {distribution && Array.isArray(distribution) && distribution.length > 0 && (
                  <div className="chart-card">
                    <h3>Distribuição por Classificação</h3>
                    <div className="chart-container">
                      <Doughnut
                        data={{
                          labels: distribution.map(d => d.classificacao),
                          datasets: [{
                            data: distribution.map(d => d.quantidade),
                            backgroundColor: distribution.map(d => COLOR_MAP[d.classificacao] || '#94a3b8'),
                            borderWidth: 2,
                            borderColor: '#fff'
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                font: { size: 12 }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Percentuais */}
                {percentages && Array.isArray(percentages) && percentages.length > 0 && (
                  <div className="chart-card">
                    <h3>Percentuais por Classificação</h3>
                    <div className="chart-container">
                      <Bar
                        data={{
                          labels: percentages.map(p => p.classificacao),
                          datasets: [{
                            label: 'Percentual (%)',
                            data: percentages.map(p => p.percentual),
                            backgroundColor: percentages.map(p => COLOR_MAP[p.classificacao] || '#94a3b8'),
                            borderRadius: 8
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
                              max: 100,
                              ticks: {
                                callback: (value) => value + '%'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Evolução */}
                {evolution && Array.isArray(evolution) && evolution.length > 0 && (
                  <div className="chart-card full-width">
                    <h3>Evolução de Pacientes (Últimos 7 Dias)</h3>
                    <div className="chart-container">
                      <Line
                        data={{
                          labels: evolution.map(e => new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
                          datasets: [{
                            label: 'Pacientes',
                            data: evolution.map(e => (e.entradas || 0) + (e.triagens || 0) + (e.atendimentos || 0)),
                            borderColor: '#09AC96',
                            backgroundColor: 'rgba(9, 172, 150, 0.1)',
                            fill: true,
                            tension: 0.4
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            y: { beginAtZero: true }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tempos Médios de Espera */}
                {waitTimes && Array.isArray(waitTimes) && waitTimes.length > 0 && (
                  <div className="chart-card full-width">
                    <h3>Tempos Médios de Espera por Classificação</h3>
                    <div className="chart-container">
                      <Bar
                        data={{
                          labels: waitTimes.map(w => w.classificacao),
                          datasets: [{
                            label: 'Tempo (min)',
                            data: waitTimes.map(w => w.tempoMedio),
                            backgroundColor: waitTimes.map(w => COLOR_MAP[w.classificacao] || '#94a3b8'),
                            borderRadius: 8
                          }]
                        }}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) => value + ' min'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Bairros Atendidos */}
                {bairroStats && bairroStats.bairros && Array.isArray(bairroStats.bairros) && bairroStats.bairros.length > 0 && (
                  <div className="chart-card">
                    <h3>Bairros Atendidos</h3>
                    <div className="chart-container">
                      <Pie
                        data={{
                          labels: bairroStats.bairros.map(b => b.bairro),
                          datasets: [{
                            data: bairroStats.bairros.map(b => b.total),
                            backgroundColor: [
                              '#3b82f6',
                              '#10b981',
                              '#f59e0b',
                              '#ef4444',
                              '#8b5cf6',
                              '#ec4899',
                              '#06b6d4'
                            ],
                            borderWidth: 2,
                            borderColor: '#fff'
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 10,
                                font: { size: 11 }
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const bairro = bairroStats.bairros[context.dataIndex];
                                  return `${bairro.bairro}: ${bairro.total} (${bairro.percentual.toFixed(1)}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tabela de Bairros */}
                {bairroStats && bairroStats.bairros && Array.isArray(bairroStats.bairros) && bairroStats.bairros.length > 0 && (
                  <div className="chart-card">
                    <h3>Detalhes por Bairro</h3>
                    <div className="table-container">
                      <table className="bairros-table">
                        <thead>
                          <tr>
                            <th>Bairro</th>
                            <th>Pacientes</th>
                            <th>%</th>
                            <th>Tempo Médio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bairroStats.bairros.map((bairro, index) => (
                            <tr key={index}>
                              <td><strong>{bairro.bairro}</strong></td>
                              <td>{bairro.total}</td>
                              <td>{bairro.percentual.toFixed(1)}%</td>
                              <td>{bairro.mediaTempoEspera} min</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Comparação entre UPAs */}
          {comparison.length > 0 && (
            <div className="comparison-section">
              <h2>Comparação entre UPAs</h2>
              <div className="comparison-table-container">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>UPA</th>
                      <th>Total Pacientes</th>
                      <th>Tempo Médio</th>
                      <th>Status</th>
                      <th>Bairros Únicos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((upa, index) => (
                      <tr key={index}>
                        <td><strong>{upa.upaNome}</strong></td>
                        <td>{upa.totalPacientes}</td>
                        <td>{upa.tempoMedioEspera} min</td>
                        <td>
                          <span className={`status-badge ${upa.statusOcupacao}`}>
                            {upa.statusOcupacao?.toUpperCase()}
                          </span>
                        </td>
                        <td>{upa.bairrosUnicos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminReports;
