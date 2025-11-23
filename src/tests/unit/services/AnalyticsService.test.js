// src/tests/unit/services/AnalyticsService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios antes de importar o service
vi.mock('axios');

// Mock da instância api
const mockApi = {
  get: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

// Configura axios.create para retornar mockApi
axios.create.mockReturnValue(mockApi);

// Agora importa o service (que irá usar o axios mockado)
const { default: analyticsService } = await import('../../../services/AnalyticsService.js');

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getBairroStats', () => {
    it('deve buscar estatísticas de bairros sem filtros de data', async () => {
      const mockData = {
        bairros: [
          { bairro: 'Centro', total: 100 },
          { bairro: 'Bessa', total: 80 },
        ],
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockData,
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const result = await analyticsService.getBairroStats('1');

      expect(result).toEqual(mockData);
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/analytics/bairros/1');
    });

    it('deve buscar estatísticas de bairros com filtros de data completos', async () => {
      const mockData = {
        bairros: [
          { bairro: 'Centro', total: 50 },
        ],
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockData,
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const dateParams = {
        year: '2025',
        month: '01',
        day: '15',
      };

      const result = await analyticsService.getBairroStats('1', dateParams);

      expect(result).toEqual(mockData);
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/analytics/bairros/1?year=2025&month=01&day=15'
      );
    });

    it('deve buscar estatísticas com filtros parciais (apenas ano e mês)', async () => {
      const mockData = { bairros: [] };
      const mockResponse = {
        data: {
          success: true,
          data: mockData,
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const dateParams = {
        year: '2025',
        month: '01',
      };

      await analyticsService.getBairroStats('1', dateParams);

      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/analytics/bairros/1?year=2025&month=01'
      );
    });

    it('deve lançar erro quando a API retorna success: false', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'UPA não encontrada',
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      await expect(analyticsService.getBairroStats('999')).rejects.toThrow(
        'UPA não encontrada'
      );
    });

    it('deve lançar erro quando a requisição falha', async () => {
      const mockError = new Error('Network error');
      mockApi.get.mockRejectedValueOnce(mockError);

      await expect(analyticsService.getBairroStats('1')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getUpaComparison', () => {
    it('deve buscar comparação entre UPAs com sucesso', async () => {
      const mockData = {
        upas: [
          {
            id: 1,
            nome: 'UPA Central',
            totalPacientes: 100,
            tempoMedioEspera: 45,
          },
          {
            id: 2,
            nome: 'UPA Bessa',
            totalPacientes: 80,
            tempoMedioEspera: 30,
          },
        ],
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockData,
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const result = await analyticsService.getUpaComparison();

      expect(result).toEqual(mockData);
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/analytics/comparison');
    });

    it('deve lançar erro quando a API retorna success: false', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Erro ao buscar dados',
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      await expect(analyticsService.getUpaComparison()).rejects.toThrow(
        'Erro ao buscar dados'
      );
    });

    it('deve lançar erro quando a requisição falha', async () => {
      const mockError = new Error('Server error');
      mockApi.get.mockRejectedValueOnce(mockError);

      await expect(analyticsService.getUpaComparison()).rejects.toThrow(
        'Server error'
      );
    });
  });
});
