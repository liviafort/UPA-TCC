// URLs específicas para cada modo de transporte no OpenStreetMap
const ROUTING_URLS = {
  DRIVING: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  BIKE: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
  FOOT: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving'
};

const TRANSPORT_MODES = {
  DRIVING: 'driving',
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
      // Seleciona a URL base correta para o modo de transporte
      let baseUrl;
      if (mode === TRANSPORT_MODES.DRIVING) {
        baseUrl = ROUTING_URLS.DRIVING;
      } else if (mode === TRANSPORT_MODES.BIKE) {
        baseUrl = ROUTING_URLS.BIKE;
      } else if (mode === TRANSPORT_MODES.FOOT) {
        baseUrl = ROUTING_URLS.FOOT;
      } else {
        baseUrl = ROUTING_URLS.DRIVING;
      }

      const url = `${baseUrl}/${lon1},${lat1};${lon2},${lat2}?overview=false`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Routing API error: ${response.status}`);
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
      console.error(`Erro ao calcular rota (${mode}):`, error.message);
      return null;
    }
  }

  /**
   * Calcula rotas para todos os modos de transporte
   * Busca tempos reais para carro, bicicleta e a pé usando APIs específicas do OpenStreetMap
   *
   * @param {number} lat1 - Latitude origem
   * @param {number} lon1 - Longitude origem
   * @param {number} lat2 - Latitude destino
   * @param {number} lon2 - Longitude destino
   * @returns {Promise<{driving: object, bike: object, foot: object}>}
   */
  static async calculateAllRoutes(lat1, lon1, lat2, lon2) {
    // Busca rotas reais para cada modo de transporte em paralelo
    const [driving, bike, foot] = await Promise.all([
      this.calculateRoute(lat1, lon1, lat2, lon2, TRANSPORT_MODES.DRIVING),
      this.calculateRoute(lat1, lon1, lat2, lon2, TRANSPORT_MODES.BIKE),
      this.calculateRoute(lat1, lon1, lat2, lon2, TRANSPORT_MODES.FOOT)
    ]);

    return { driving, bike, foot };
  }

  /**
   * Formata duração em segundos para formato legível
   * @param {number} seconds - Duração em segundos
   * @returns {string} Duração formatada
   */
  static formatDuration(seconds) {
    if (!seconds) return 'N/A';

    const totalMinutes = Math.ceil(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}h ${minutes}min`;
      }
      return `${hours}h`;
    }
    return `${totalMinutes}min`;
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

  /**
   * Formata minutos para formato legível (converte para horas se > 60 min)
   * @param {number} minutes - Tempo em minutos
   * @returns {string} Tempo formatado
   */
  static formatMinutes(minutes) {
    if (!minutes || minutes <= 0) return '0 min';

    const totalMinutes = Math.round(minutes);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (hours > 0) {
      if (remainingMinutes > 0) {
        return `${hours}h ${remainingMinutes}min`;
      }
      return `${hours}h`;
    }
    return `${totalMinutes} min`;
  }
}

export default RoutingService;
export { TRANSPORT_MODES };
