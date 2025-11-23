// src/tests/unit/services/RoutingService.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RoutingService, { TRANSPORT_MODES } from '../../../services/RoutingService';

describe('RoutingService', () => {
  describe('formatDuration', () => {
    it('deve formatar segundos em minutos corretamente', () => {
      expect(RoutingService.formatDuration(120)).toBe('2min');
      expect(RoutingService.formatDuration(90)).toBe('2min'); // arredonda para cima
    });

    it('deve formatar segundos em horas e minutos', () => {
      expect(RoutingService.formatDuration(3600)).toBe('1h');
      expect(RoutingService.formatDuration(3660)).toBe('1h 1min');
      expect(RoutingService.formatDuration(7200)).toBe('2h');
    });

    it('deve retornar N/A para valores inválidos', () => {
      expect(RoutingService.formatDuration(0)).toBe('N/A');
      expect(RoutingService.formatDuration(null)).toBe('N/A');
      expect(RoutingService.formatDuration(undefined)).toBe('N/A');
    });

    it('deve lidar com valores negativos', () => {
      // O formatDuration arredonda para cima, então -60 segundos = -1 minuto
      const result = RoutingService.formatDuration(-60);
      expect(result).toBe('-1min');
    });
  });

  describe('formatDistance', () => {
    it('deve formatar metros corretamente', () => {
      expect(RoutingService.formatDistance(500)).toBe('500 m');
      expect(RoutingService.formatDistance(999)).toBe('999 m');
    });

    it('deve formatar quilômetros com uma casa decimal', () => {
      expect(RoutingService.formatDistance(1000)).toBe('1.0 km');
      expect(RoutingService.formatDistance(1500)).toBe('1.5 km');
      expect(RoutingService.formatDistance(12345)).toBe('12.3 km');
    });

    it('deve retornar N/A para valores inválidos', () => {
      expect(RoutingService.formatDistance(0)).toBe('N/A');
      expect(RoutingService.formatDistance(null)).toBe('N/A');
      expect(RoutingService.formatDistance(undefined)).toBe('N/A');
    });

    it('deve arredondar metros para o valor inteiro mais próximo', () => {
      expect(RoutingService.formatDistance(500.7)).toBe('501 m');
      expect(RoutingService.formatDistance(500.3)).toBe('500 m');
    });
  });

  describe('formatMinutes', () => {
    it('deve formatar minutos simples', () => {
      expect(RoutingService.formatMinutes(30)).toBe('30 min');
      expect(RoutingService.formatMinutes(1)).toBe('1 min');
      expect(RoutingService.formatMinutes(59)).toBe('59 min');
    });

    it('deve formatar minutos em horas', () => {
      expect(RoutingService.formatMinutes(60)).toBe('1h');
      expect(RoutingService.formatMinutes(120)).toBe('2h');
    });

    it('deve formatar horas com minutos restantes', () => {
      expect(RoutingService.formatMinutes(90)).toBe('1h 30min');
      expect(RoutingService.formatMinutes(125)).toBe('2h 5min');
    });

    it('deve retornar "0 min" para valores zero ou negativos', () => {
      expect(RoutingService.formatMinutes(0)).toBe('0 min');
      expect(RoutingService.formatMinutes(-10)).toBe('0 min');
    });

    it('deve retornar "0 min" para valores null/undefined', () => {
      expect(RoutingService.formatMinutes(null)).toBe('0 min');
      expect(RoutingService.formatMinutes(undefined)).toBe('0 min');
    });

    it('deve arredondar valores decimais', () => {
      expect(RoutingService.formatMinutes(45.7)).toBe('46 min');
      expect(RoutingService.formatMinutes(45.3)).toBe('45 min');
    });
  });

  describe('calculateRoute', () => {
    let fetchMock;

    beforeEach(() => {
      fetchMock = vi.fn();
      global.fetch = fetchMock;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('deve calcular rota para modo driving com sucesso', async () => {
      const mockResponse = {
        code: 'Ok',
        routes: [
          {
            distance: 5000,
            duration: 600,
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await RoutingService.calculateRoute(
        -7.24,
        -35.88,
        -7.25,
        -35.89,
        TRANSPORT_MODES.DRIVING
      );

      expect(result).toEqual({
        distance: 5000,
        duration: 600,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('deve calcular rota para modo bike', async () => {
      const mockResponse = {
        code: 'Ok',
        routes: [
          {
            distance: 5000,
            duration: 900,
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await RoutingService.calculateRoute(
        -7.24,
        -35.88,
        -7.25,
        -35.89,
        TRANSPORT_MODES.BIKE
      );

      expect(result).toEqual({
        distance: 5000,
        duration: 900,
      });
    });

    it('deve calcular rota para modo foot', async () => {
      const mockResponse = {
        code: 'Ok',
        routes: [
          {
            distance: 5000,
            duration: 3600,
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await RoutingService.calculateRoute(
        -7.24,
        -35.88,
        -7.25,
        -35.89,
        TRANSPORT_MODES.FOOT
      );

      expect(result).toEqual({
        distance: 5000,
        duration: 3600,
      });
    });

    it('deve retornar null quando a API retorna erro', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await RoutingService.calculateRoute(
        -7.24,
        -35.88,
        -7.25,
        -35.89
      );

      expect(result).toBeNull();
    });

    it('deve retornar null quando não há rotas disponíveis', async () => {
      const mockResponse = {
        code: 'Ok',
        routes: [],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await RoutingService.calculateRoute(
        -7.24,
        -35.88,
        -7.25,
        -35.89
      );

      expect(result).toBeNull();
    });

    it('deve retornar null quando código da resposta não é Ok', async () => {
      const mockResponse = {
        code: 'NoRoute',
        routes: [],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await RoutingService.calculateRoute(
        -7.24,
        -35.88,
        -7.25,
        -35.89
      );

      expect(result).toBeNull();
    });

    it('deve usar modo driving como padrão quando modo inválido é passado', async () => {
      const mockResponse = {
        code: 'Ok',
        routes: [{ distance: 1000, duration: 120 }],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await RoutingService.calculateRoute(
        -7.24,
        -35.88,
        -7.25,
        -35.89,
        'invalid_mode'
      );

      expect(result).toEqual({
        distance: 1000,
        duration: 120,
      });
    });

    it('deve tratar erros de rede corretamente', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await RoutingService.calculateRoute(
        -7.24,
        -35.88,
        -7.25,
        -35.89
      );

      expect(result).toBeNull();
    });
  });

  describe('calculateAllRoutes', () => {
    let fetchMock;

    beforeEach(() => {
      fetchMock = vi.fn();
      global.fetch = fetchMock;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('deve calcular rotas para todos os modos de transporte', async () => {
      const mockDrivingResponse = {
        code: 'Ok',
        routes: [{ distance: 5000, duration: 600 }],
      };

      const mockBikeResponse = {
        code: 'Ok',
        routes: [{ distance: 5000, duration: 900 }],
      };

      const mockFootResponse = {
        code: 'Ok',
        routes: [{ distance: 5000, duration: 3600 }],
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDrivingResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBikeResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFootResponse,
        });

      const result = await RoutingService.calculateAllRoutes(
        -7.24,
        -35.88,
        -7.25,
        -35.89
      );

      expect(result.driving).toEqual({ distance: 5000, duration: 600 });
      expect(result.bike).toEqual({ distance: 5000, duration: 900 });
      expect(result.foot).toEqual({ distance: 5000, duration: 3600 });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('deve retornar null para modos com erro', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 'Ok',
            routes: [{ distance: 5000, duration: 900 }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            code: 'Ok',
            routes: [{ distance: 5000, duration: 3600 }],
          }),
        });

      const result = await RoutingService.calculateAllRoutes(
        -7.24,
        -35.88,
        -7.25,
        -35.89
      );

      expect(result.driving).toBeNull();
      expect(result.bike).toEqual({ distance: 5000, duration: 900 });
      expect(result.foot).toEqual({ distance: 5000, duration: 3600 });
    });
  });
});
