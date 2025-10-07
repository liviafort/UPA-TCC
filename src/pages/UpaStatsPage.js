import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/Dashboard.css';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  getUpaStatistics,
  getUpaDistribution,
  getUpaPercentages,
  getUpaEvolution,
  getUpaWaitTimes
} from '../server/Api';
import webSocketService from '../services/WebSocketService';

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

const CLASSIFICATION_LABELS = {
  'NAO_TRIADO': 'Não Triado',
  'AZUL': 'Não Urgente',
  'VERDE': 'Pouco Urgente',
  'AMARELO': 'Urgente',
  'VERMELHO': 'Emergência'
};

function UpaStatsPage({ upas = [] }) {  // Valor padrão para upas
  const { id } = useParams();
  const [stats, setStats] = useState({});
  const [distribution, setDistribution] = useState({});
  const [percentages, setPercentages] = useState({});
  const [evolution, setEvolution] = useState({});
  const [waitTimes, setWaitTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsData, distData, percData, evolData, waitData] = await Promise.all([
          getUpaStatistics(id).catch(() => ({})),
          getUpaDistribution(id).catch(() => ({ distribution: {} })),
          getUpaPercentages(id).catch(() => ({ percentages: {} })),
          getUpaEvolution(id).catch(() => ({ data: [] })),
          getUpaWaitTimes(id).catch(() => ({ wait_times: {} }))
        ]);

        setStats(statsData || {});
        setDistribution(distData || { distribution: {} });
        setPercentages(percData || { percentages: {} });
        setEvolution(evolData || { data: [] });
        setWaitTimes(waitData || { wait_times: {} });

      } catch (err) {
        console.error("Failed to load UPA data:", err);
        setError("Não foi possível carregar os dados da UPA");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Inscreve-se para receber atualizações da UPA específica via WebSocket
    webSocketService.subscribeToUpa(id);

    // Escuta atualizações de fila em tempo real
    const unsubscribeQueue = webSocketService.onQueueUpdate((data) => {
      if (data.upaId === id) {
        // Atualiza distribuição
        setDistribution({
          upaId: id,
          distribution: {
            VERMELHO: { count: data.data.porClassificacao.vermelho || 0 },
            AMARELO: { count: data.data.porClassificacao.amarelo || 0 },
            VERDE: { count: data.data.porClassificacao.verde || 0 },
            AZUL: { count: data.data.porClassificacao.azul || 0 },
            NAO_TRIADO: { count: data.data.porClassificacao.semTriagem || 0 },
          },
          lastUpdated: data.data.ultimaAtualizacao,
        });

        // Atualiza percentagens
        const total = data.data.totalPacientes || 1;
        setPercentages({
          upaId: id,
          percentages: {
            VERMELHO: (data.data.porClassificacao.vermelho / total) * 100,
            AMARELO: (data.data.porClassificacao.amarelo / total) * 100,
            VERDE: (data.data.porClassificacao.verde / total) * 100,
            AZUL: (data.data.porClassificacao.azul / total) * 100,
          },
          totalPatients: data.data.totalPacientes,
          lastUpdated: data.data.ultimaAtualizacao,
        });

        // Atualiza tempos de espera
        setWaitTimes({
          upaId: id,
          wait_times: data.data.metricasPorClassificacao.map(m => ({
            classification: m.classificacao,
            average_wait_time_minutes: m.tempoMedioEsperaMinutos,
            max_protocol_wait_time: m.tempoMaximoEsperaProtocolo,
            patients_over_time: m.pacientesAcimaTempo,
          })),
          lastUpdated: data.data.ultimaAtualizacao,
        });
      }
    });

    return () => {
      unsubscribeQueue();
      webSocketService.unsubscribeFromUpa(id);
    };
  }, [id]);

  const upa = (upas || []).find(u => u.id === id) || {};

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando dados...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="upa-stats-container">
        <h2>{error}</h2>
        <Link to="/" className="back-link">← Voltar ao Mapa</Link>
      </div>
    );
  }

  if (!upa.id) {
    return (
      <div className="upa-stats-container">
        <h2>UPA não encontrada.</h2>
        <Link to="/" className="back-link">← Voltar ao Mapa</Link>
      </div>
    );
  }

  // Prepara dados para os gráficos com verificações de segurança
  const distributionData = Object.entries(distribution.distribution || {}).map(([key, value]) => ({
    name: CLASSIFICATION_LABELS[key] || key,
    count: value?.count || 0,
    fill: COLOR_MAP[key] || '#8884d8'
  }));

  const percentagesData = Object.entries(percentages.percentages || {}).map(([key, value]) => ({
    name: CLASSIFICATION_LABELS[key] || key,
    value: value || 0,
    fill: COLOR_MAP[key] || '#8884d8'
  }));

  // Substitua o mapeamento de evolutionData por:
  const evolutionData = evolution.data?.map(item => {
    // Corrige o problema do fuso horário criando a data no UTC
    const dateObj = new Date(item.date + 'T12:00:00Z'); // Meio-dia UTC evita problemas de timezone
    const dia = dateObj.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      timeZone: 'UTC' 
    });
    
    return {
      ...item,
      date: item.date, 
      dia: dia,        
      total: (item.entradas || 0) + (item.triagens || 0) + (item.atendimentos || 0)
    };
  }) || [];

  
  const waitTimesData = (waitTimes.wait_times || []).map(item => ({
    subject: CLASSIFICATION_LABELS[item.classification] || item.classification,
    tempo: item.average_wait_time_minutes || 0,
    fullMark: 120
  }));

  const getCardData = (classification) => {
  const data = distributionData.find(d => d.name === classification) || {};
  const waitTimeKey = Object.keys(CLASSIFICATION_LABELS).find(
    key => CLASSIFICATION_LABELS[key] === classification
  );
  const waitTimeItem = (waitTimes.wait_times || []).find(
    item => item.classification === waitTimeKey
  );
  const waitTime = waitTimeItem?.average_wait_time_minutes || 0;

  return {
    count: data.count || 0,
    waitTime: Math.round(waitTime)
  };
};
 

  const blueData = getCardData('Não Urgente');
  const greenData = getCardData('Pouco Urgente');
  const yellowData = getCardData('Urgente');
  const redData = getCardData('Emergência');
  const triaData = getCardData('Não Triado');


  return (
    <div className="upa-stats-container">
      <header className="stats-header">
        <h1>{upa.name || 'UPA'}</h1>
        <p>{upa.address || 'Endereço não disponível'}</p>
        {distribution?.last_updated && (
          <p>Última atualização: {new Date(distribution.last_updated).toLocaleString()}</p>
        )}
      </header>

      <div className="stats-main">
        <div className="stats-card stats-card-triagem">
          <h2>Sem Triagem</h2>
          <p className="stats-value">{triaData.count}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio: {triaData.waitTime} min</p>
        </div>
        <div className="stats-card stats-card-blue">
          <h2>Não Urgente</h2>
          <p className="stats-value">{blueData.count}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio: {blueData.waitTime} min</p>
        </div>
        
        <div className="stats-card stats-card-green">
          <h2>Pouco Urgente</h2>
          <p className="stats-value">{greenData.count}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio: {greenData.waitTime} min</p>
        </div>
        
        <div className="stats-card stats-card-yellow">
          <h2>Urgente</h2>
          <p className="stats-value">{yellowData.count}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio: {yellowData.waitTime} min</p>
        </div>
        
        <div className="stats-card stats-card-red">
          <h2>Emergência</h2>
          <p className="stats-value">{redData.count}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio: {redData.waitTime} min</p>
        </div>
      </div>

      <div className="stats-charts">
        {/* Gráfico de Evolução - Ocupa 2 colunas */}
        <div className="chart-card chart-wide">
          <h3>Evolução dos Pacientes ao Longo do Tempo</h3>
          {evolutionData.length > 0 ? (
            <div style={{ width: '100%', height: '350px' }}>
              <Line
                data={{
                  labels: evolutionData.map(item => item.dia),
                  datasets: [{
                    label: 'Total de Pacientes',
                    data: evolutionData.map(item => item.total),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: { size: 12, weight: '600' },
                        color: '#2c3e50',
                        padding: 15
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(44, 62, 80, 0.9)',
                      padding: 12,
                      titleFont: { size: 13, weight: 'bold' },
                      bodyFont: { size: 12 },
                      cornerRadius: 8
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        font: { size: 11 },
                        color: '#6c757d'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: { size: 11 },
                        color: '#6c757d'
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="no-data">Sem dados históricos</div>
          )}
        </div>

        {/* Gráfico de Tempos de Espera - Ocupa 2 colunas */}
        <div className="chart-card chart-wide">
          <h3>Tempos Médios de Espera por Classificação</h3>
          {waitTimesData.length > 0 ? (
            <div style={{ width: '100%', height: '350px' }}>
              <Line
                data={{
                  labels: waitTimesData.map(item => item.subject),
                  datasets: [{
                    label: 'Tempo Médio (minutos)',
                    data: waitTimesData.map(item => item.tempo),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: { size: 12, weight: '600' },
                        color: '#2c3e50',
                        padding: 15
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(44, 62, 80, 0.9)',
                      padding: 12,
                      titleFont: { size: 13, weight: 'bold' },
                      bodyFont: { size: 12 },
                      cornerRadius: 8,
                      callbacks: {
                        label: (context) => `Tempo: ${context.parsed.y} minutos`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        font: { size: 11 },
                        color: '#6c757d',
                        callback: (value) => `${value} min`
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: { size: 11 },
                        color: '#6c757d'
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="no-data">Sem dados de tempo de espera</div>
          )}
        </div>

        {/* Gráfico de Distribuição */}
        <div className="chart-card">
          <h3>Distribuição por Classificação</h3>
          {distributionData.length > 0 ? (
            <div style={{ width: '100%', height: '300px' }}>
              <Bar
                data={{
                  labels: distributionData.map(item => item.name),
                  datasets: [{
                    label: 'Pacientes',
                    data: distributionData.map(item => item.count),
                    backgroundColor: distributionData.map(item => item.fill + '90'),
                    borderColor: distributionData.map(item => item.fill),
                    borderWidth: 2,
                    borderRadius: 8
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
                      backgroundColor: 'rgba(44, 62, 80, 0.9)',
                      padding: 12,
                      cornerRadius: 8
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        font: { size: 11 },
                        color: '#6c757d'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: { size: 11 },
                        color: '#6c757d'
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="no-data">Sem dados de distribuição</div>
          )}
        </div>

        {/* Gráfico de Percentual */}
        <div className="chart-card">
          <h3>Percentual por Classificação</h3>
          {percentagesData.length > 0 ? (
            <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut
                data={{
                  labels: percentagesData.map(item => item.name),
                  datasets: [{
                    data: percentagesData.map(item => item.value),
                    backgroundColor: percentagesData.map(item => item.fill + 'B0'),
                    borderColor: percentagesData.map(item => item.fill),
                    borderWidth: 2,
                    hoverOffset: 15
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        font: { size: 11 },
                        color: '#2c3e50',
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(44, 62, 80, 0.9)',
                      padding: 12,
                      cornerRadius: 8,
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.parsed || 0;
                          return `${label}: ${value.toFixed(1)}%`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="no-data">Sem dados percentuais</div>
          )}
        </div>
      </div>

      <footer className="stats-footer">
        <Link to="/" className="back-link desktop-only">← Voltar ao Mapa</Link>
      </footer>
    </div>
  );
}

export default UpaStatsPage;