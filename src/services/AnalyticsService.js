// src/services/AnalyticsService.js
import axios from 'axios';

const API_URL = 'https://api.vejamaisaude.com/upa';

// Usa a mesma instância do axios com interceptors
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class AnalyticsService {
  /**
   * Busca estatísticas de bairros para uma UPA específica
   * @param {string} upaId - ID da UPA
   * @param {object} dateParams - Parâmetros de filtro de data (year, month, day)
   * @returns {Promise} Dados dos bairros atendidos pela UPA
   */
  async getBairroStats(upaId, dateParams = {}) {
    try {
      console.log(`📊 Buscando estatísticas de bairros para UPA ${upaId}...`);

      // Monta a query string com os parâmetros de data
      const queryParams = new URLSearchParams();
      if (dateParams.year) queryParams.append('year', dateParams.year);
      if (dateParams.month) queryParams.append('month', dateParams.month);
      if (dateParams.day) queryParams.append('day', dateParams.day);

      const queryString = queryParams.toString();
      const url = `/api/v1/analytics/bairros/${upaId}${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(url);

      if (response.data.success) {
        console.log('✅ Estatísticas de bairros carregadas:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao buscar estatísticas de bairros');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de bairros:', error);
      throw error;
    }
  }

  /**
   * Busca comparação entre todas as UPAs
   * @returns {Promise} Dados de comparação entre UPAs
   */
  async getUpaComparison() {
    try {
      console.log('📊 Buscando comparação entre UPAs...');

      const response = await api.get('/api/v1/analytics/comparison');

      if (response.data.success) {
        console.log('✅ Comparação de UPAs carregada:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao buscar comparação de UPAs');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar comparação de UPAs:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
