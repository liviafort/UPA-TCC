// src/server/Api.js
import axios from 'axios';

// Instância do Axios com a URL base da API.
const api = axios.create({
  baseURL: 'https://upa-tcc-backend.onrender.com',
});

/**
 * Busca todas as UPAs e seus respectivos status de fila.
 * Retorna uma lista de UPAs com detalhes formatados ou uma lista vazia em caso de erro.
 */
export async function fetchUpasComStatus() {
  try {
    // Busca informações de todas as UPAs
    const response = await api.get('/upas');
    const upas = response.data;

    // Busca o status de todas as UPAs em paralelo
    const upasCompletas = await Promise.all(
      upas.map(async (upa) => {
        try {
          // Busca informações de filas de uma UPA específica
          const statusRes = await api.get(`/queue/${upa.id}`);
          const status = statusRes.data;

          return {
            id: upa.id,
            name: upa.name,
            address: upa.address,
            lat: upa.latitude,
            lng: upa.longitude,
            queueDetail: {
              blue: status.por_classificacao.azul,
              green: status.por_classificacao.verde,
              yellow: status.por_classificacao.amarelo,
              red: status.por_classificacao.vermelho,
            },
            averageWaitTime: `${status.tempo_medio_espera_minutos} min`,
          };
        } catch (err) {
          console.error(`Erro ao buscar status da UPA ${upa.id}:`, err);
          return null;
        }
      })
    );

    return upasCompletas.filter(Boolean); // Remove os valores nulos
  } catch (err) {
    console.error("Erro ao buscar UPAs:", err);
    return [];
  }
}

// Funções de API para buscar dados específicos de uma UPA
export const getUpaStatistics = async (upaId) => {
  const { data } = await api.get(`/queue/${upaId}/statistics`);
  return {
    upaId: data.upa_id,
    totalEventos: data.total_eventos,
    entradas: data.entradas,
    triagens: data.triagens,
    atendimentos: data.atendimentos,
    taxaConclusao: data.taxa_conclusao,
    periodo: data.periodo,
  };
};

export const getUpaDistribution = async (upaId) => {
  const { data } = await api.get(`/queue/${upaId}/queue-distribution`);
  return {
    upaId: data.upa_id,
    distribution: data.distribution,
    lastUpdated: data.last_updated,
  };
};

export const getUpaPercentages = async (upaId) => {
  const { data } = await api.get(`/queue/${upaId}/queue-percentages`);
  return {
    upaId: data.upa_id,
    percentages: data.percentages,
    totalPatients: data.total_patients,
    lastUpdated: data.last_updated,
  };
};

export const getUpaEvolution = async (upaId) => {
  const { data } = await api.get(`/queue/${upaId}/queue-evolution`);
  return {
    upaId: data.upa_id,
    period: data.period,
    data: data.data,
    lastUpdated: data.last_updated,
  };
};

export const getUpaWaitTimes = async (upaId) => {
  const { data } = await api.get(`/queue/${upaId}/current-wait-times`);
  return {
    upaId: data.upa_id,
    wait_times: data.wait_times,  // Mantém a estrutura original da API
    lastUpdated: data.last_updated,
  };
};

/**
 * Busca todos os dados de uma UPA e formata para o mesmo padrão das variáveis 'mockadas'.
 * Essa função facilita a substituição no componente React.
 */
export async function fetchUpaDataFormatted(upaId) {
  try {
    const [distribution, evolution, waitTimes] = await Promise.all([
      getUpaDistribution(upaId),
      getUpaEvolution(upaId),
      getUpaWaitTimes(upaId),
    ]);

    // Mapeamento das classificações da API para os nomes do seu código
    const classificacaoMap = {
      AZUL: 'Não Urgente',
      VERDE: 'Pouco Urgente',
      AMARELO: 'Urgente',
      VERMELHO: 'Emergência',
      NAO_TRIADO: 'Não Triado', // Adicionado para cobrir a possibilidade
    };
    
    // 1. Dados para os cards e o gráfico de barras/pizza
    const azulAguardando = distribution.distribution.AZUL?.count || 0;
    const verdeAguardando = distribution.distribution.VERDE?.count || 0;
    const amareloAguardando = distribution.distribution.AMARELO?.count || 0;
    const vermelhoAguardando = distribution.distribution.VERMELHO?.count || 0;

    const classificacoesData = Object.entries(distribution.distribution).map(([key, value]) => ({
      name: classificacaoMap[key] || key,
      value: value.count,
    }));

    // 2. Dados para os tempos médios de espera
    const tempoMedioAzul = waitTimes.waitTimes.find(t => t.classification === 'AZUL')?.average_wait_time_minutes || 0;
    const tempoMedioVerde = waitTimes.waitTimes.find(t => t.classification === 'VERDE')?.average_wait_time_minutes || 0;
    const tempoMedioAmarelo = waitTimes.waitTimes.find(t => t.classification === 'AMARELO')?.average_wait_time_minutes || 0;
    const tempoMedioVermelho = waitTimes.waitTimes.find(t => t.classification === 'VERMELHO')?.average_wait_time_minutes || 0;
    
    const mediaAtendimentoData = waitTimes.waitTimes.map(item => ({
      subject: classificacaoMap[item.classification] || item.classification,
      tempo: item.average_wait_time_minutes,
    }));

    // 3. Dados para o gráfico de linha (histórico)
    const historicoAtendimentos = evolution.data.map(item => ({
      dia: item.dia,
      atendidos: item.total_atendidos,
    }));

    return {
      azulAguardando,
      verdeAguardando,
      amareloAguardando,
      vermelhoAguardando,
      tempoMedioAzul: `${tempoMedioAzul} min`,
      tempoMedioVerde: `${tempoMedioVerde} min`,
      tempoMedioAmarelo: `${tempoMedioAmarelo} min`,
      tempoMedioVermelho: `${tempoMedioVermelho} min`,
      historicoAtendimentos,
      classificacoesData,
      mediaAtendimentoData,
    };

  } catch (error) {
    console.error("Erro ao buscar e formatar dados da UPA:", error);
    return null;
  }
  
}
