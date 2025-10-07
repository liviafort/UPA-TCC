const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

// Profiles suportados pela API OSRM pública
// Nota: 'car' é o profile padrão, mas alguns servidores aceitam 'driving' como alias
const TRANSPORT_MODES = {
  DRIVING: 'car',
  BIKE: 'bike',
  FOOT: 'foot'
};

class RoutingService {
  /**
   * Calcula rota entre dois pontos para um modo de transporte específico
   * @param {number} lat1 - Latitude origem
   * @param {number} lon1 - Longitude origem
   * @param {number} lat2 - Latitude destino
   * @param {number} lon2 - Longitude destino
   * @param {string} mode - Modo de transporte (driving, bike, foot)
   * @returns {Promise<{distance: number, duration: number}>}
   */
  static async calculateRoute(lat1, lon1, lat2, lon2, mode = TRANSPORT_MODES.DRIVING) {
    try {
      const url = `${OSRM_BASE_URL}/${mode}/${lon1},${lat1};${lon2},${lat2}?overview=false`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`No route found for mode ${mode}`);
      }

      const route = data.routes[0];

      return {
        distance: route.distance, // em metros
        duration: route.duration  // em segundos
      };
    } catch (error) {
      console.error(`Erro ao calcular rota:`, error.message);
      return null;
    }
  }

  /**
   * Calcula rotas para todos os modos de transporte
   *
   * NOTA: O servidor OSRM público (router.project-osrm.org) só tem dados para carro.
   * Para bike e pé, fazemos estimativas baseadas no tempo/distância de carro:
   * - Bicicleta: ~2.5x mais tempo que carro (velocidade média: 15-20 km/h)
   * - A pé: ~5x mais tempo que carro (velocidade média: 5-6 km/h)
   *
   * @param {number} lat1 - Latitude origem
   * @param {number} lon1 - Longitude origem
   * @param {number} lat2 - Latitude destino
   * @param {number} lon2 - Longitude destino
   * @returns {Promise<{driving: object, bike: object, foot: object}>}
   */
  static async calculateAllRoutes(lat1, lon1, lat2, lon2) {
    // Busca apenas a rota de carro (única disponível no OSRM público)
    const driving = await this.calculateRoute(lat1, lon1, lat2, lon2, TRANSPORT_MODES.DRIVING);

    if (!driving) {
      return { driving: null, bike: null, foot: null };
    }

    // Estima tempo de bicicleta (velocidade média: 15 km/h vs carro: 40 km/h)
    const bike = {
      distance: driving.distance,
      duration: driving.duration * 2.7 // ~2.5x mais tempo
    };

    // Estima tempo a pé (velocidade média: 5 km/h vs carro: 40 km/h)
    const foot = {
      distance: driving.distance,
      duration: driving.duration * 6 // ~6x mais tempo
    };

    return { driving, bike, foot };
  }

  /**
   * Formata duração em segundos para formato legível
   * @param {number} seconds - Duração em segundos
   * @returns {string} Duração formatada
   */
  static formatDuration(seconds) {
    if (!seconds) return 'N/A';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  /**
   * Formata distância em metros para formato legível
   * @param {number} meters - Distância em metros
   * @returns {string} Distância formatada
   */
  static formatDistance(meters) {
    if (!meters) return 'N/A';

    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }
}

export default RoutingService;
export { TRANSPORT_MODES };
