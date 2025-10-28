import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/Dashboard.css';
import {
  getUpaStatistics,
  getUpaDistribution,
  getUpaPercentages,
  getUpaEvolution,
  getUpaWaitTimes
} from '../server/Api';
import webSocketService from '../services/WebSocketService';

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
        <div className="spinner-large"></div>
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

  const getCardData = (classification) => {
    const classificationKey = Object.keys(CLASSIFICATION_LABELS).find(
      key => CLASSIFICATION_LABELS[key] === classification
    );
    const count = distribution.distribution?.[classificationKey]?.count || 0;
    const waitTimeItem = (waitTimes.wait_times || []).find(
      item => item.classification === classificationKey
    );
    const waitTime = waitTimeItem?.average_wait_time_minutes || 0;

    return {
      count: count,
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

      <footer className="stats-footer">
        <Link to="/" className="back-link desktop-only">← Voltar ao Mapa</Link>
      </footer>
    </div>
  );
}

export default UpaStatsPage;