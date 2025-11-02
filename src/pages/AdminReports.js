// src/pages/AdminReports.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';
import AdminSidebar from '../components/AdminSidebar';
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
  fetchUpasComStatus,
  getWaitTimeAnalytics,
  getDashboardAnalytics
} from '../server/Api';
import AnalyticsService from '../services/AnalyticsService';
import RoutingService from '../services/RoutingService';

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

  // Filtros de data
  const [useFilter, setUseFilter] = useState(false);
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [noDataForDate, setNoDataForDate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Dados dos gráficos
  const [statistics, setStatistics] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [percentages, setPercentages] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [waitTimes, setWaitTimes] = useState(null);
  const [bairroStats, setBairroStats] = useState(null);
  const [waitTimeAnalytics, setWaitTimeAnalytics] = useState(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);

  // Carregar lista de UPAs e perfil
  useEffect(() => {
    loadUpas();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (user?.id) {
      try {
        const profile = await AuthService.getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    }
  };

  // Carregar dados quando UPA for selecionada ou filtros mudarem
  useEffect(() => {
    if (selectedUpaId) {
      loadUpaData(selectedUpaId);
    }
  }, [selectedUpaId, useFilter, filterYear, filterMonth, filterDay]);

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
      // Monta os parâmetros de filtro de data
      const dateParams = {};
      if (useFilter) {
        if (filterYear) dateParams.year = filterYear;
        if (filterMonth) dateParams.month = filterMonth;
        if (filterDay) dateParams.day = filterDay;
      }

      console.log('==========================================');
      console.log('🔍 CARREGANDO DADOS DA UPA');
      console.log('==========================================');
      console.log('UPA ID:', upaId);
      console.log('Filtro ativo:', useFilter);
      console.log('Parâmetros de data:', dateParams);
      console.log('------------------------------------------');

      // Endpoints que NÃO recebem filtro de data: getUpaStatistics, getUpaEvolution (usam days fixo)
      // Endpoints que RECEBEM filtro de data: getUpaDistribution, getUpaPercentages, getUpaWaitTimes, getBairroStats, getWaitTimeAnalytics, getDashboardAnalytics
      const [stats, dist, perc, evol, wait, bairros, waitAnalytics, dashboard] = await Promise.all([
        getUpaStatistics(upaId), // SEM filtro (usa days=7)
        getUpaDistribution(upaId, dateParams), // COM filtro
        getUpaPercentages(upaId, dateParams), // COM filtro
        getUpaEvolution(upaId), // SEM filtro (usa days=7)
        getUpaWaitTimes(upaId, dateParams), // COM filtro
        AnalyticsService.getBairroStats(upaId, dateParams), // COM filtro
        getWaitTimeAnalytics(upaId, dateParams), // COM filtro
        getDashboardAnalytics(upaId, dateParams) // COM filtro
      ]);

      console.log('✅ DADOS RECEBIDOS DOS ENDPOINTS:');
      console.log('------------------------------------------');
      console.log('📊 Statistics (SEM filtro):', stats);
      console.log('📊 Distribution (COM filtro):', dist);
      console.log('📊 Percentages (COM filtro):', perc);
      console.log('📊 Evolution (SEM filtro):', evol);
      console.log('📊 WaitTimes (COM filtro):', wait);
      console.log('📊 BairroStats (COM filtro):', bairros);
      console.log('📊 WaitTimeAnalytics (COM filtro):', waitAnalytics);
      console.log('📊 DashboardAnalytics (COM filtro):', dashboard);
      console.log('==========================================');

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

      // Verifica se há dados quando o filtro está ativo
      if (useFilter) {
        const hasData =
          (distributionArray && distributionArray.length > 0) ||
          (percentagesArray && percentagesArray.length > 0) ||
          (waitTimesArray && waitTimesArray.length > 0) ||
          (bairros && bairros.length > 0) ||
          (waitAnalytics && Object.keys(waitAnalytics).length > 0) ||
          (dashboard && Object.keys(dashboard).length > 0);

        if (!hasData) {
          console.log('⚠️ Nenhum dado encontrado para a data selecionada');
          setNoDataForDate(true);
        } else {
          setNoDataForDate(false);
        }
      } else {
        setNoDataForDate(false);
      }

      setStatistics(stats);
      setDistribution(distributionArray);
      setPercentages(percentagesArray);
      setEvolution(evolutionArray);
      setWaitTimes(waitTimesArray);
      setBairroStats(bairros);
      setWaitTimeAnalytics(waitAnalytics);
      setDashboardAnalytics(dashboard);
    } catch (error) {
      console.error('Erro ao carregar dados da UPA:', error);
    } finally {
      setLoadingData(false);
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
            <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="60" height="60" rx="12" fill="#09AC96"/>
              <path d="M30 15L20 25H26V40H34V25H40L30 15Z" fill="white"/>
              <path d="M18 42H42V45H18V42Z" fill="white"/>
            </svg>
            <h1>Relatórios e Análises</h1>
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

          {/* Filtro de Data */}
          <div className="date-filter-card">
            <div className="filter-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z" fill="#09AC96"/>
              </svg>
              <h2>Filtrar por Data</h2>
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={useFilter}
                  onChange={(e) => {
                    setUseFilter(e.target.checked);
                    if (!e.target.checked) {
                      setFilterYear('');
                      setFilterMonth('');
                      setFilterDay('');
                    }
                  }}
                />
                <span className="toggle-label">{useFilter ? 'Ativo' : 'Inativo'}</span>
              </label>
            </div>

            {useFilter && (
              <div className="filter-inputs">
                <div className="filter-input-group">
                  <label>Ano</label>
                  <input
                    type="number"
                    placeholder="Ex: 2025"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    min="2020"
                    max="2030"
                  />
                </div>

                <div className="filter-input-group">
                  <label>Mês</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="1">Janeiro</option>
                    <option value="2">Fevereiro</option>
                    <option value="3">Março</option>
                    <option value="4">Abril</option>
                    <option value="5">Maio</option>
                    <option value="6">Junho</option>
                    <option value="7">Julho</option>
                    <option value="8">Agosto</option>
                    <option value="9">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Dia</label>
                  <input
                    type="number"
                    placeholder="Ex: 15"
                    value={filterDay}
                    onChange={(e) => setFilterDay(e.target.value)}
                    min="1"
                    max="31"
                  />
                </div>

                <div className="filter-info">
                  <p className="filter-description">
                    {!filterYear && !filterMonth && !filterDay && 'Configure os filtros acima'}
                    {filterYear && !filterMonth && !filterDay && `Exibindo dados do ano de ${filterYear}`}
                    {filterMonth && !filterDay && `Exibindo dados de ${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(filterMonth) - 1]}${filterYear ? ` de ${filterYear}` : ''}`}
                    {filterDay && filterMonth && `Exibindo dados do dia ${filterDay}/${filterMonth}${filterYear ? `/${filterYear}` : ''}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {loadingData ? (
            <div className="loading-data">
              <div className="spinner-large"></div>
              <p>Carregando dados...</p>
            </div>
          ) : noDataForDate ? (
            <div className="no-data-message">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 8C18.745 8 8 18.745 8 32C8 45.255 18.745 56 32 56C45.255 56 56 45.255 56 32C56 18.745 45.255 8 32 8ZM32 52C21.0185 52 12 42.9815 12 32C12 21.0185 21.0185 12 32 12C42.9815 12 52 21.0185 52 32C52 42.9815 42.9815 52 32 52Z" fill="#F59E0B"/>
                <path d="M30 20H34V36H30V20Z" fill="#F59E0B"/>
                <path d="M30 40H34V44H30V40Z" fill="#F59E0B"/>
              </svg>
              <h3>Nenhum Dado Encontrado</h3>
              <p>Não há dados disponíveis para a data selecionada.</p>
              <p className="date-info">
                {filterDay && filterMonth && filterYear && `${filterDay}/${filterMonth}/${filterYear}`}
                {filterMonth && !filterDay && filterYear && `${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(filterMonth) - 1]} de ${filterYear}`}
                {filterMonth && !filterDay && !filterYear && `${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(filterMonth) - 1]}`}
                {filterYear && !filterMonth && !filterDay && `Ano de ${filterYear}`}
              </p>
              <button
                className="reset-filter-btn"
                onClick={() => {
                  setUseFilter(false);
                  setFilterYear('');
                  setFilterMonth('');
                  setFilterDay('');
                }}
              >
                Limpar Filtros
              </button>
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
                            label: 'Tempo',
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
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  return 'Tempo: ' + RoutingService.formatMinutes(context.parsed.x);
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) => RoutingService.formatMinutes(value)
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Gráfico de Bairros Atendidos */}
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

                {/* Tabela de Detalhes por Bairro */}
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

                {/* Análise de Tempos de Espera */}
                {waitTimeAnalytics && (
                  <div className="chart-card full-width">
                    <h3>Análise Detalhada de Tempos de Espera</h3>
                    <div className="wait-time-analytics">
                      <div className="analytics-summary">
                        <div className="summary-card">
                          <span className="summary-label">Tempo Médio Geral</span>
                          <span className="summary-value">{RoutingService.formatMinutes(Math.max(0, waitTimeAnalytics.tempoMedioEsperaGeral || 0))}</span>
                        </div>
                        <div className="summary-card">
                          <span className="summary-label">Tempo Médio de Triagem</span>
                          <span className="summary-value">{RoutingService.formatMinutes(Math.max(0, waitTimeAnalytics.tempoMedioTriagem || 0))}</span>
                        </div>
                        <div className="summary-card">
                          <span className="summary-label">Tempo Médio de Atendimento</span>
                          <span className="summary-value">{RoutingService.formatMinutes(Math.max(0, waitTimeAnalytics.tempoMedioAtendimento || 0))}</span>
                        </div>
                      </div>
                      {waitTimeAnalytics.porClassificacao && Object.keys(waitTimeAnalytics.porClassificacao).length > 0 && (
                        <div className="chart-container">
                          <Bar
                            data={{
                              labels: Object.keys(waitTimeAnalytics.porClassificacao).map(k => k.toUpperCase()),
                              datasets: [{
                                label: 'Tempo de Espera (minutos)',
                                data: Object.values(waitTimeAnalytics.porClassificacao).map(v => Math.max(0, v)),
                                backgroundColor: Object.keys(waitTimeAnalytics.porClassificacao).map(k => {
                                  const colorMap = {
                                    'VERMELHO': '#ef4444',
                                    'AMARELO': '#f59e0b',
                                    'VERDE': '#10b981',
                                    'AZUL': '#3b82f6'
                                  };
                                  return colorMap[k.toUpperCase()] || '#94a3b8';
                                }),
                                borderColor: Object.keys(waitTimeAnalytics.porClassificacao).map(k => {
                                  const colorMap = {
                                    'VERMELHO': '#dc2626',
                                    'AMARELO': '#d97706',
                                    'VERDE': '#059669',
                                    'AZUL': '#2563eb'
                                  };
                                  return colorMap[k.toUpperCase()] || '#64748b';
                                }),
                                borderWidth: 2
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `Tempo: ${RoutingService.formatMinutes(context.parsed.y)}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: function(value) {
                                      return RoutingService.formatMinutes(value);
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Dashboard Analytics da UPA Selecionada */}
          {dashboardAnalytics && (
            <div className="dashboard-analytics-section">
              <h2>Estatísticas Gerais - {dashboardAnalytics.upaNome}</h2>

              {/* Comparação: Últimas 24h vs Hoje vs Ontem */}
              <div className="dashboard-comparison">
                <div className="comparison-chart-card">
                  <h3>Entradas de Pacientes</h3>
                  <Bar
                    data={{
                      labels: ['Últimas 24h', 'Hoje', 'Ontem'],
                      datasets: [{
                        label: 'Entradas',
                        data: [
                          dashboardAnalytics.ultimas24h.totalEntradas,
                          dashboardAnalytics.hoje.totalEntradas,
                          dashboardAnalytics.ontem.totalEntradas
                        ],
                        backgroundColor: ['rgba(9, 172, 150, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(156, 163, 175, 0.7)'],
                        borderColor: ['rgba(9, 172, 150, 1)', 'rgba(59, 130, 246, 1)', 'rgba(156, 163, 175, 1)'],
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
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>

                <div className="comparison-chart-card">
                  <h3>Triagens Realizadas</h3>
                  <Bar
                    data={{
                      labels: ['Últimas 24h', 'Hoje', 'Ontem'],
                      datasets: [{
                        label: 'Triagens',
                        data: [
                          dashboardAnalytics.ultimas24h.totalTriagens,
                          dashboardAnalytics.hoje.totalTriagens,
                          dashboardAnalytics.ontem.totalTriagens
                        ],
                        backgroundColor: ['rgba(9, 172, 150, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(156, 163, 175, 0.7)'],
                        borderColor: ['rgba(9, 172, 150, 1)', 'rgba(59, 130, 246, 1)', 'rgba(156, 163, 175, 1)'],
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
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>

                <div className="comparison-chart-card">
                  <h3>Atendimentos Concluídos</h3>
                  <Bar
                    data={{
                      labels: ['Últimas 24h', 'Hoje', 'Ontem'],
                      datasets: [{
                        label: 'Atendimentos',
                        data: [
                          dashboardAnalytics.ultimas24h.totalAtendimentos,
                          dashboardAnalytics.hoje.totalAtendimentos,
                          dashboardAnalytics.ontem.totalAtendimentos
                        ],
                        backgroundColor: ['rgba(9, 172, 150, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(156, 163, 175, 0.7)'],
                        borderColor: ['rgba(9, 172, 150, 1)', 'rgba(59, 130, 246, 1)', 'rgba(156, 163, 175, 1)'],
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
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminReports;
