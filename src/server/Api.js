// src/server/Api.js
import axios from 'axios';
import Cookies from 'js-cookie';
import RoutingService from '../services/RoutingService';
import {
  mockStatistics,
  mockDistribution,
  mockPercentages,
  mockEvolution,
  mockWaitTimes,
  mockUpasComStatus
} from './MockData';

// FLAG DE CONTROLE: Ative para usar dados mockados durante desenvolvimento
const USE_MOCK_DATA = false;

// Instância do Axios com a URL base da API.
// Conecta diretamente no servidor em todos os ambientes
const api = axios.create({
  baseURL: 'https://api.vejamaisaude.com/upa',
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout de 10 segundos
  timeout: 10000,
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      // Adiciona o token no header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Busca todas as UPAs e seus respectivos status de fila.
 * Retorna uma lista de UPAs com detalhes formatados ou uma lista vazia em caso de erro.
 */
export async function fetchUpasComStatus() {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUpasComStatus), 500); // Simula delay da API
    });
  }

  try {
    // Usa o endpoint /api/v1/upa-queue/sidebar/data que já retorna os dados formatados
    const response = await api.get('/api/v1/upa-queue/sidebar/data');

    if (!response.data.success) {
      return [];
    }

    const upas = response.data.data;

    // Mapeia os dados da API para o formato esperado pelo frontend
    const upasFormatadas = await Promise.all(upas.map(async (upa) => {
      try {
        // Busca dados da fila para pegar o tempo médio de espera
        const queueResponse = await api.get(`/api/v1/upa-queue/${upa.id}/queue`);
        const queueData = queueResponse.data.success ? queueResponse.data.data : null;

        const tempoMedio = queueData?.tempoMedioEsperaMinutos || 0;

        // Extrai os tempos de espera por classificação
        const waitTimesByClassification = {};
        if (queueData?.metricasPorClassificacao) {
          queueData.metricasPorClassificacao.forEach(metrica => {
            const classificacao = metrica.classificacao.toLowerCase();
            waitTimesByClassification[classificacao] = metrica.tempoMedioEsperaMinutos;
          });
        }

        const upaFormatada = {
          id: upa.id,
          name: upa.nome,
          address: upa.endereco,
          lat: upa.latitude,
          lng: upa.longitude,
          queueDetail: queueData ? {
            blue: queueData.porClassificacao.azul || 0,
            green: queueData.porClassificacao.verde || 0,
            yellow: queueData.porClassificacao.amarelo || 0,
            red: queueData.porClassificacao.vermelho || 0,
          } : {
            blue: 0,
            green: 0,
            yellow: 0,
            red: 0,
          },
          averageWaitTime: RoutingService.formatMinutes(tempoMedio),
          waitTimesByClassification: waitTimesByClassification,
          totalPacientes: upa.totalPacientes,
          aguardandoTriagem: queueData?.aguardandoTriagem || 0,
          statusOcupacao: upa.statusOcupacao,
          isActive: upa.isActive,
        };

        return upaFormatada;
      } catch (err) {
        // Fallback para dados básicos do sidebar
        return {
          id: upa.id,
          name: upa.nome,
          address: upa.endereco,
          lat: upa.latitude,
          lng: upa.longitude,
          queueDetail: {
            blue: 0,
            green: 0,
            yellow: 0,
            red: 0,
          },
          averageWaitTime: `0 min`,
          waitTimesByClassification: {},
          totalPacientes: upa.totalPacientes,
          aguardandoTriagem: 0,
          statusOcupacao: upa.statusOcupacao,
          isActive: upa.isActive,
        };
      }
    }));

    return upasFormatadas;
  } catch (err) {
    return [];
  }
}

// Funções de API para buscar dados específicos de uma UPA
export const getUpaStatistics = async (upaId) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockStatistics, upaId }), 300);
    });
  }

  // calcular as estatísticas a partir dos dados de evolution
  try {
    const evolutionResponse = await api.get(`/api/v1/queue/${upaId}/evolution?days=7`);

    if (!evolutionResponse.data.success) {
      throw new Error('Erro ao buscar evolução');
    }

    const evolutionData = evolutionResponse.data.data;

    // Calcula totais
    const totais = evolutionData.reduce((acc, day) => ({
      entradas: acc.entradas + day.entradas,
      triagens: acc.triagens + day.triagens,
      atendimentos: acc.atendimentos + day.atendimentos,
    }), { entradas: 0, triagens: 0, atendimentos: 0 });

    const totalEventos = totais.entradas + totais.triagens + totais.atendimentos;
    const taxaConclusao = totais.entradas > 0
      ? ((totais.atendimentos / totais.entradas) * 100).toFixed(1)
      : 0;

    return {
      upaId,
      totalEventos,
      entradas: totais.entradas,
      triagens: totais.triagens,
      atendimentos: totais.atendimentos,
      taxaConclusao: parseFloat(taxaConclusao),
      periodo: `${evolutionData.length} dias`,
    };
  } catch (error) {
    // Retorna dados vazios em caso de erro
    return {
      upaId,
      totalEventos: 0,
      entradas: 0,
      triagens: 0,
      atendimentos: 0,
      taxaConclusao: 0,
      periodo: '7 dias',
    };
  }
};

// Função para dados em TEMPO REAL (usada em UpaStatsPage)
export const getUpaDistribution = async (upaId, dateParams = {}) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockDistribution, upaId }), 300);
    });
  }

  const queueData = await getUpaQueueData(upaId, dateParams);

  return {
    upaId: queueData.upaId,
    distribution: {
      VERMELHO: { count: queueData.porClassificacao.vermelho },
      AMARELO: { count: queueData.porClassificacao.amarelo },
      VERDE: { count: queueData.porClassificacao.verde },
      AZUL: { count: queueData.porClassificacao.azul },
      NAO_TRIADO: { count: queueData.porClassificacao.semTriagem || 0 },
    },
    lastUpdated: queueData.ultimaAtualizacao,
  };
};

// Função para dados HISTÓRICOS (usada em AdminReports com filtros de data)
export const getUpaDistributionHistorical = async (upaId, dateParams = {}) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockDistribution, upaId }), 300);
    });
  }

  try {
    // Monta a query string com os parâmetros de data
    const queryParams = new URLSearchParams();

    // Se não tiver parâmetros de data, usa a data atual
    if (!dateParams.year && !dateParams.month && !dateParams.day) {
      const hoje = new Date();
      queryParams.append('year', hoje.getFullYear());
      queryParams.append('month', hoje.getMonth() + 1); // getMonth() retorna 0-11
      queryParams.append('day', hoje.getDate());
    } else {
      if (dateParams.year) queryParams.append('year', dateParams.year);
      if (dateParams.month) queryParams.append('month', dateParams.month);
      if (dateParams.day) queryParams.append('day', dateParams.day);
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/analytics/classification/${upaId}${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao buscar distribuição');
    }

    // Agrega os dados de todos os dias
    const distribution = response.data.data.distribution || [];
    const totals = {
      VERMELHO: 0,
      AMARELO: 0,
      VERDE: 0,
      AZUL: 0,
    };

    distribution.forEach(day => {
      totals.VERMELHO += day.vermelho || 0;
      totals.AMARELO += day.amarelo || 0;
      totals.VERDE += day.verde || 0;
      totals.AZUL += day.azul || 0;
    });

    return {
      upaId: response.data.data.upaId,
      upaNome: response.data.data.upaNome,
      distribution: {
        VERMELHO: { count: totals.VERMELHO },
        AMARELO: { count: totals.AMARELO },
        VERDE: { count: totals.VERDE },
        AZUL: { count: totals.AZUL },
      },
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro em getUpaDistributionHistorical:', error);
    throw error;
  }
};

// Função para dados em TEMPO REAL (usada em UpaStatsPage)
export const getUpaPercentages = async (upaId, dateParams = {}) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockPercentages, upaId }), 300);
    });
  }

  const queueData = await getUpaQueueData(upaId, dateParams);
  const total = queueData.totalPacientes || 1; // Evita divisão por zero

  return {
    upaId: queueData.upaId,
    percentages: {
      VERMELHO: (queueData.porClassificacao.vermelho / total) * 100,
      AMARELO: (queueData.porClassificacao.amarelo / total) * 100,
      VERDE: (queueData.porClassificacao.verde / total) * 100,
      AZUL: (queueData.porClassificacao.azul / total) * 100,
    },
    totalPatients: queueData.totalPacientes,
    lastUpdated: queueData.ultimaAtualizacao,
  };
};

// Função para dados HISTÓRICOS (usada em AdminReports com filtros de data)
export const getUpaPercentagesHistorical = async (upaId, dateParams = {}) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockPercentages, upaId }), 300);
    });
  }

  try {
    // Monta a query string com os parâmetros de data
    const queryParams = new URLSearchParams();

    // Se não tiver parâmetros de data, usa a data atual
    if (!dateParams.year && !dateParams.month && !dateParams.day) {
      const hoje = new Date();
      queryParams.append('year', hoje.getFullYear());
      queryParams.append('month', hoje.getMonth() + 1); // getMonth() retorna 0-11
      queryParams.append('day', hoje.getDate());
    } else {
      if (dateParams.year) queryParams.append('year', dateParams.year);
      if (dateParams.month) queryParams.append('month', dateParams.month);
      if (dateParams.day) queryParams.append('day', dateParams.day);
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/analytics/classification/${upaId}${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao buscar percentuais');
    }

    // Agrega os dados de todos os dias
    const distribution = response.data.data.distribution || [];
    const totals = {
      VERMELHO: 0,
      AMARELO: 0,
      VERDE: 0,
      AZUL: 0,
    };

    distribution.forEach(day => {
      totals.VERMELHO += day.vermelho || 0;
      totals.AMARELO += day.amarelo || 0;
      totals.VERDE += day.verde || 0;
      totals.AZUL += day.azul || 0;
    });

    const total = totals.VERMELHO + totals.AMARELO + totals.VERDE + totals.AZUL || 1; // Evita divisão por zero

    return {
      upaId: response.data.data.upaId,
      upaNome: response.data.data.upaNome,
      percentages: {
        VERMELHO: (totals.VERMELHO / total) * 100,
        AMARELO: (totals.AMARELO / total) * 100,
        VERDE: (totals.VERDE / total) * 100,
        AZUL: (totals.AZUL / total) * 100,
      },
      totalPatients: total,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro em getUpaPercentagesHistorical:', error);
    throw error;
  }
};

export const getUpaEvolution = async (upaId, days = 7) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockEvolution, upaId }), 300);
    });
  }

  const url = `/api/v1/queue/${upaId}/evolution?days=${days}`;

  const response = await api.get(url);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar evolução da fila');
  }

  return {
    upaId,
    period: `${days} dias`,
    data: response.data.data,
    lastUpdated: new Date().toISOString(),
  };
};

export const getUpaQueueData = async (upaId, dateParams = {}) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockWaitTimes, upaId }), 300);
    });
  }

  // Monta a query string com os parâmetros de data
  const queryParams = new URLSearchParams();
  if (dateParams.year) queryParams.append('year', dateParams.year);
  if (dateParams.month) queryParams.append('month', dateParams.month);
  if (dateParams.day) queryParams.append('day', dateParams.day);

  const queryString = queryParams.toString();
  const url = `/api/v1/upa-queue/${upaId}/queue${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar dados da fila');
  }

  return response.data.data;
};

export const getUpaWaitTimes = async (upaId, dateParams = {}) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockWaitTimes, upaId }), 300);
    });
  }

  const queueData = await getUpaQueueData(upaId, dateParams);

  return {
    upaId: queueData.upaId,
    wait_times: queueData.metricasPorClassificacao.map(m => ({
      classification: m.classificacao,
      average_wait_time_minutes: m.tempoMedioEsperaMinutos,
      max_protocol_wait_time: m.tempoMaximoEsperaProtocolo,
      patients_over_time: m.pacientesAcimaTempo,
    })),
    lastUpdated: queueData.ultimaAtualizacao,
  };
};

/**
 * Busca todos os dados de uma UPA e formata para o mesmo padrão das variáveis 'mockadas'.
 * Essa função facilita a substituição no componente React.
 */
export async function fetchUpaDataFormatted(upaId) {
  try {
    const [queueData, evolution] = await Promise.all([
      getUpaQueueData(upaId),
      getUpaEvolution(upaId, 7),
    ]);

    // Mapeamento das classificações da API para os nomes do seu código
    const classificacaoMap = {
      AZUL: 'Não Urgente',
      VERDE: 'Pouco Urgente',
      AMARELO: 'Urgente',
      VERMELHO: 'Emergência',
      NAO_TRIADO: 'Não Triado',
    };

    // 1. Dados para os cards e o gráfico de barras/pizza
    const azulAguardando = queueData.porClassificacao.azul || 0;
    const verdeAguardando = queueData.porClassificacao.verde || 0;
    const amareloAguardando = queueData.porClassificacao.amarelo || 0;
    const vermelhoAguardando = queueData.porClassificacao.vermelho || 0;
    const semTriagem = queueData.porClassificacao.semTriagem || 0;

    const classificacoesData = [
      { name: 'Emergência', value: vermelhoAguardando },
      { name: 'Urgente', value: amareloAguardando },
      { name: 'Pouco Urgente', value: verdeAguardando },
      { name: 'Não Urgente', value: azulAguardando },
      { name: 'Não Triado', value: semTriagem },
    ].filter(item => item.value > 0); // Remove classificações com 0 pacientes

    // 2. Dados para os tempos médios de espera usando metricasPorClassificacao
    const metricaAzul = queueData.metricasPorClassificacao.find(m => m.classificacao === 'AZUL');
    const metricaVerde = queueData.metricasPorClassificacao.find(m => m.classificacao === 'VERDE');
    const metricaAmarelo = queueData.metricasPorClassificacao.find(m => m.classificacao === 'AMARELO');
    const metricaVermelho = queueData.metricasPorClassificacao.find(m => m.classificacao === 'VERMELHO');

    const tempoMedioAzul = metricaAzul?.tempoMedioEsperaMinutos || 0;
    const tempoMedioVerde = metricaVerde?.tempoMedioEsperaMinutos || 0;
    const tempoMedioAmarelo = metricaAmarelo?.tempoMedioEsperaMinutos || 0;
    const tempoMedioVermelho = metricaVermelho?.tempoMedioEsperaMinutos || 0;

    const mediaAtendimentoData = queueData.metricasPorClassificacao
      .filter(m => m.quantidade > 0) // Só mostra classificações com pacientes
      .map(item => ({
        subject: classificacaoMap[item.classificacao] || item.classificacao,
        tempo: item.tempoMedioEsperaMinutos,
      }));

    // 3. Dados para o gráfico de linha (histórico)
    const historicoAtendimentos = evolution.data.map(item => ({
      dia: item.date,
      entradas: item.entradas,
      triagens: item.triagens,
      atendimentos: item.atendimentos,
      atendidos: item.atendimentos, // Para manter compatibilidade
    }));

    return {
      azulAguardando,
      verdeAguardando,
      amareloAguardando,
      vermelhoAguardando,
      semTriagem,
      totalPacientes: queueData.totalPacientes,
      aguardandoTriagem: queueData.aguardandoTriagem,
      aguardandoAtendimento: queueData.aguardandoAtendimento,
      tempoMedioAzul: `${Math.round(tempoMedioAzul)} min`,
      tempoMedioVerde: `${Math.round(tempoMedioVerde)} min`,
      tempoMedioAmarelo: `${Math.round(tempoMedioAmarelo)} min`,
      tempoMedioVermelho: `${Math.round(tempoMedioVermelho)} min`,
      tempoMedioEspera: `${Math.round(queueData.tempoMedioEsperaMinutos)} min`,
      statusOcupacao: queueData.statusOcupacao,
      historicoAtendimentos,
      classificacoesData,
      mediaAtendimentoData,
      ultimaAtualizacao: queueData.ultimaAtualizacao,
    };

  } catch (error) {
    return null;
  }
}

/**
 * Analytics Endpoints
 */

// Busca estatísticas de bairros para uma UPA
export const getBairroStats = async (upaId) => {
  const response = await api.get(`/api/v1/analytics/bairros/${upaId}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar estatísticas de bairros');
  }

  return response.data.data;
};

// Busca tendências de ocupação
export const getOccupancyTrends = async (upaId, days = 1) => {
  const response = await api.get(`/api/v1/analytics/occupancy/${upaId}?days=${days}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar tendências de ocupação');
  }

  return response.data.data;
};

// Busca distribuição de classificação
export const getClassificationDistribution = async (upaId, days = 1) => {
  const response = await api.get(`/api/v1/analytics/classification/${upaId}?days=${days}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar distribuição de classificação');
  }

  return response.data.data;
};

// Busca comparação entre UPAs
export const getUpaComparison = async () => {
  const response = await api.get('/api/v1/analytics/comparison');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar comparação de UPAs');
  }

  return response.data.data;
};

// Busca métricas de eventos
export const getEventsMetrics = async (upaId, startDate, endDate) => {
  const response = await api.get(`/api/v1/analytics/events/${upaId}?startDate=${startDate}&endDate=${endDate}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar métricas de eventos');
  }

  return response.data.data;
};

// Busca total de entradas nas últimas 24h
export const getTotalEntriesLast24h = async () => {
  const response = await api.get('/api/v1/analytics/entries/last-24h');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar total de entradas');
  }

  return response.data.data;
};

// Busca total de triagens nas últimas 24h
export const getTotalScreeningsLast24h = async () => {
  const response = await api.get('/api/v1/analytics/screenings/last-24h');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar total de triagens');
  }

  return response.data.data;
};

// Busca total de atendimentos nas últimas 24h
export const getTotalTreatmentsLast24h = async () => {
  const response = await api.get('/api/v1/analytics/treatments/last-24h');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar total de atendimentos');
  }

  return response.data.data;
};

// Busca análise de tempos de espera (para gráficos de relatórios)
export const getWaitTimeAnalytics = async (upaId, dateParams = {}) => {
  // Monta a query string com os parâmetros de data
  const queryParams = new URLSearchParams();
  if (dateParams.year) queryParams.append('year', dateParams.year);
  if (dateParams.month) queryParams.append('month', dateParams.month);
  if (dateParams.day) queryParams.append('day', dateParams.day);

  const queryString = queryParams.toString();
  const url = `/api/v1/analytics/wait-time/${upaId}${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar análise de tempos de espera');
  }

  return response.data.data;
};

// Busca dashboard analytics completo de uma UPA
export const getDashboardAnalytics = async (upaId, dateParams = {}) => {
  // Monta a query string com os parâmetros de data
  const queryParams = new URLSearchParams();
  if (dateParams.year) queryParams.append('year', dateParams.year);
  if (dateParams.month) queryParams.append('month', dateParams.month);
  if (dateParams.day) queryParams.append('day', dateParams.day);

  const queryString = queryParams.toString();
  const url = `/api/v1/analytics/dashboard/${upaId}${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar analytics do dashboard');
  }

  return response.data.data;
};

// ===================================
// FUNÇÕES DE PERFIL DE USUÁRIO
// ===================================

// Busca perfil do usuário
export const getUserProfile = async (userId) => {
  const response = await api.get(`/api/v1/users/${userId}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar perfil do usuário');
  }

  return response.data.data;
};

// Atualiza perfil do usuário
export const updateUserProfile = async (userId, userData) => {
  const response = await api.put(`/api/v1/users/${userId}`, userData);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao atualizar perfil');
  }

  return response.data.data;
};

// Altera senha do usuário
export const changePassword = async (userId, passwordData) => {
  const response = await api.put(`/api/v1/users/${userId}/password`, passwordData);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao alterar senha');
  }

  return response.data;
};

// Busca todos os usuários do sistema
export const getAllUsers = async () => {
  const response = await api.get('/api/v1/users');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar usuários');
  }

  return response.data.data;
};

// Inativa usuário
export const inactivateUser = async (userId) => {
  const response = await api.put(`/api/v1/users/${userId}/inactivate`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao inativar usuário');
  }

  return response.data.data;
};

// Ativa usuário
export const activateUser = async (userId) => {
  const response = await api.put(`/api/v1/users/${userId}/activate`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao ativar usuário');
  }

  return response.data.data;
};

// Mantém compatibilidade com código antigo
export const toggleUserStatus = inactivateUser;

// Cria novo usuário
export const createUser = async (userData) => {
  try {
    const response = await api.post('/api/v1/auth/signup', userData);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao criar usuário');
    }

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ===================================
// FUNÇÕES DE BUSCA DE UPAS
// ===================================

// Busca UPAs por cidade e estado
export const getUpasByCityAndState = async (city, state) => {
  const response = await api.get(`/api/v1/upas/city/state`, {
    params: { city, state }
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar UPAs');
  }

  return response.data.data;
};
