// src/server/MockData.js
// Dados mockados para desenvolvimento quando a API está indisponível

/**
 * Dados mockados para getUpaStatistics
 */
export const mockStatistics = {
  upaId: "1",
  totalEventos: 450,
  entradas: 180,
  triagens: 150,
  atendimentos: 120,
  taxaConclusao: 75.5,
  periodo: {
    inicio: "2025-09-26",
    fim: "2025-10-03"
  }
};

/**
 * Dados mockados para getUpaDistribution
 */
export const mockDistribution = {
  upaId: "1",
  distribution: {
    NAO_TRIADO: {
      count: 15,
      percentage: 10.0
    },
    AZUL: {
      count: 45,
      percentage: 30.0
    },
    VERDE: {
      count: 50,
      percentage: 33.3
    },
    AMARELO: {
      count: 30,
      percentage: 20.0
    },
    VERMELHO: {
      count: 10,
      percentage: 6.7
    }
  },
  last_updated: new Date().toISOString()
};

/**
 * Dados mockados para getUpaPercentages
 */
export const mockPercentages = {
  upaId: "1",
  percentages: {
    NAO_TRIADO: 10.0,
    AZUL: 30.0,
    VERDE: 33.3,
    AMARELO: 20.0,
    VERMELHO: 6.7
  },
  totalPatients: 150,
  lastUpdated: new Date().toISOString()
};

/**
 * Dados mockados para getUpaEvolution
 * Retorna dados dos últimos 7 dias
 */
export const mockEvolution = {
  upaId: "1",
  period: {
    inicio: "2025-09-26",
    fim: "2025-10-03"
  },
  data: [
    {
      date: "2025-09-26",
      entradas: 65,
      triagens: 58,
      atendimentos: 52
    },
    {
      date: "2025-09-27",
      entradas: 72,
      triagens: 68,
      atendimentos: 61
    },
    {
      date: "2025-09-28",
      entradas: 58,
      triagens: 55,
      atendimentos: 50
    },
    {
      date: "2025-09-29",
      entradas: 45,
      triagens: 42,
      atendimentos: 38
    },
    {
      date: "2025-09-30",
      entradas: 80,
      triagens: 75,
      atendimentos: 68
    },
    {
      date: "2025-10-01",
      entradas: 70,
      triagens: 65,
      atendimentos: 60
    },
    {
      date: "2025-10-02",
      entradas: 68,
      triagens: 63,
      atendimentos: 58
    },
    {
      date: "2025-10-03",
      entradas: 55,
      triagens: 50,
      atendimentos: 45
    }
  ],
  lastUpdated: new Date().toISOString()
};

/**
 * Dados mockados para getUpaWaitTimes
 */
export const mockWaitTimes = {
  upaId: "1",
  wait_times: {
    NAO_TRIADO: 25,
    AZUL: 90,
    VERDE: 60,
    AMARELO: 30,
    VERMELHO: 5
  },
  lastUpdated: new Date().toISOString()
};

/**
 * Dados mockados para fetchUpasComStatus
 * Lista de UPAs com informações de fila
 */
export const mockUpasComStatus = [
  {
    id: "1",
    name: "UPA Dinamérica",
    address: "Av. Dinamérica Alves Correia, nº 1289 - Dinamérica, Campina Grande - PB",
    lat: -7.245035101295457,
    lng: -35.911502073015235,
    queueDetail: {
      blue: 45,
      green: 50,
      yellow: 30,
      red: 10
    },
    averageWaitTime: "45 min"
  },
  {
    id: "2",
    name: "UPA Alto Branco",
    address: "Avenida Manoel Tavares - Alto Branco, Campina Grande - PB",
    lat: -7.199722570036266,
    lng: -35.8773387576718,
    queueDetail: {
      blue: 30,
      green: 35,
      yellow: 20,
      red: 5
    },
    averageWaitTime: "35 min"
  },
];
