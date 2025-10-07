// src/server/Api.js
import axios from 'axios';
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
    console.log('🔄 Buscando lista de UPAs da API...');

    // Usa o endpoint /api/v1/upas/sidebar que já retorna os dados formatados
    const response = await api.get('/api/v1/upas/sidebar');

    console.log('✅ Resposta da API recebida:', response.status);

    if (!response.data.success) {
      console.error("❌ Erro na resposta da API:", response.data.message);
      return [];
    }

    const upas = response.data.data;

    // Mapeia os dados da API para o formato esperado pelo frontend
    const upasFormatadas = await Promise.all(upas.map(async (upa) => {
      try {
        // Busca dados da fila para pegar o tempo médio de espera
        const queueResponse = await api.get(`/api/v1/upas/${upa.id}/queue`);
        const queueData = queueResponse.data.success ? queueResponse.data.data : null;

        const tempoMedio = queueData?.tempoMedioEsperaMinutos || 0;

        return {
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
          averageWaitTime: `${Math.round(tempoMedio)} min`,
          totalPacientes: upa.totalPacientes,
          statusOcupacao: upa.statusOcupacao,
          isActive: upa.isActive,
        };
      } catch (err) {
        console.error(`Erro ao buscar dados da UPA ${upa.id}:`, err);
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
          totalPacientes: upa.totalPacientes,
          statusOcupacao: upa.statusOcupacao,
          isActive: upa.isActive,
        };
      }
    }));

    return upasFormatadas;
  } catch (err) {
    console.error("❌ Erro ao buscar UPAs:", err);
    console.error("Detalhes do erro:", {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });

    // Se for erro 403, pode ser problema de CORS ou autenticação
    if (err.response?.status === 403) {
      console.error("⚠️ Erro 403 (Forbidden) - Possíveis causas:");
      console.error("  1. Problema de CORS (Cross-Origin Resource Sharing)");
      console.error("  2. API requer autenticação");
      console.error("  3. IP bloqueado ou rate limit");
      console.error("  4. Verifique se está rodando em desenvolvimento (npm run dev)");
    }

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

  // Como a rota /api/v1/queue/${upaId}/statistics não existe,
  // vamos calcular as estatísticas a partir dos dados de evolution
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
    console.error('Erro ao calcular estatísticas:', error);
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

export const getUpaDistribution = async (upaId) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockDistribution, upaId }), 300);
    });
  }

  const queueData = await getUpaQueueData(upaId);

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

export const getUpaPercentages = async (upaId) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockPercentages, upaId }), 300);
    });
  }

  const queueData = await getUpaQueueData(upaId);
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

export const getUpaEvolution = async (upaId, days = 7) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockEvolution, upaId }), 300);
    });
  }

  const response = await api.get(`/api/v1/queue/${upaId}/evolution?days=${days}`);

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

export const getUpaQueueData = async (upaId) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockWaitTimes, upaId }), 300);
    });
  }

  const response = await api.get(`/api/v1/upas/${upaId}/queue`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Erro ao buscar dados da fila');
  }

  return response.data.data;
};

export const getUpaWaitTimes = async (upaId) => {
  // Retorna dados mockados se a flag estiver ativa
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockWaitTimes, upaId }), 300);
    });
  }

  const queueData = await getUpaQueueData(upaId);

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
    console.error("Erro ao buscar e formatar dados da UPA:", error);
    return null;
  }

}
