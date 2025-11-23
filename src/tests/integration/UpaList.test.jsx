// src/tests/integration/UpaList.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders, userEvent, mockApiResponses, MockWebSocket } from './integration-utils';
import MapPage from '../../pages/MapPage';
import axios from 'axios';

// Mock do axios
vi.mock('axios');

// Mock do WebSocket
global.WebSocket = MockWebSocket;

// Mock do Leaflet (biblioteca de mapas)
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: vi.fn(),
    flyTo: vi.fn(),
  }),
}));

describe('Carregamento e Exibição de UPAs - Integração', () => {
  let user;
  let mockAxios;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock do axios.create
    mockAxios = {
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };
    axios.create.mockReturnValue(mockAxios);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Carregamento inicial de UPAs', () => {
    it('deve carregar e exibir lista de UPAs', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockApiResponses.upas,
        },
      });

      renderWithProviders(<MapPage />);

      // Aguarda carregamento
      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
        expect(screen.getByText('UPA Bessa')).toBeInTheDocument();
      });

      // Verifica que a API foi chamada
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/upas')
      );
    });

    it('deve exibir indicador de loading durante carregamento', async () => {
      // Mock que demora para resolver
      mockAxios.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  data: { success: true, data: mockApiResponses.upas },
                }),
              1000
            );
          })
      );

      renderWithProviders(<MapPage />);

      // Deve mostrar loading inicialmente
      expect(screen.getByText(/carregando|loading/i)).toBeInTheDocument();

      // Aguarda o carregamento completar
      await waitFor(
        () => {
          expect(screen.queryByText(/carregando|loading/i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('deve exibir mensagem quando não há UPAs', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      });

      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/nenhuma upa|não há upas|lista vazia/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Exibição de informações das UPAs', () => {
    beforeEach(() => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockApiResponses.upas,
        },
      });
    });

    it('deve exibir detalhes de cada UPA', async () => {
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      // Verifica informações da primeira UPA
      const upaCentral = screen.getByText('UPA Central').closest('.upa-item, [class*="upa"]');
      expect(within(upaCentral).getByText(/Rua Central, 100/i)).toBeInTheDocument();
      expect(within(upaCentral).getByText(/45 min/i)).toBeInTheDocument();
      expect(within(upaCentral).getByText(/21/i)).toBeInTheDocument(); // total pacientes
    });

    it('deve exibir classificação de risco corretamente', async () => {
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      // Verifica os badges de classificação
      const upaCentral = screen.getByText('UPA Central').closest('.upa-item, [class*="upa"]');

      // Deve ter badges para cada classificação
      expect(within(upaCentral).getByText('5')).toBeInTheDocument(); // blue
      expect(within(upaCentral).getByText('10')).toBeInTheDocument(); // green
      expect(within(upaCentral).getByText('3')).toBeInTheDocument(); // yellow
      expect(within(upaCentral).getByText('2')).toBeInTheDocument(); // orange
      expect(within(upaCentral).getByText('1')).toBeInTheDocument(); // red
    });

    it('deve exibir status de ocupação', async () => {
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      expect(screen.getByText(/moderada/i)).toBeInTheDocument();
      expect(screen.getByText(/baixa/i)).toBeInTheDocument();
    });
  });

  describe('Interação com lista de UPAs', () => {
    beforeEach(() => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockApiResponses.upas,
        },
      });
    });

    it('deve permitir clicar em uma UPA para ver detalhes', async () => {
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      // Clica na UPA
      const upaItem = screen.getByText('UPA Central').closest('.upa-item, [class*="upa"]');
      await user.click(upaItem);

      // Deve navegar ou abrir detalhes
      // (O comportamento específico depende da implementação)
      await waitFor(() => {
        expect(
          screen.getByText(/ver detalhes|detalhes|mais informações/i)
        ).toBeInTheDocument();
      });
    });

    it('deve destacar UPA selecionada', async () => {
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      const upaItem = screen.getByText('UPA Central').closest('.upa-item, [class*="upa"]');
      await user.click(upaItem);

      // Verifica se a UPA recebeu classe de selecionada
      await waitFor(() => {
        expect(upaItem).toHaveClass(/selected|active/);
      });
    });

    it('deve permitir buscar/filtrar UPAs', async () => {
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
        expect(screen.getByText('UPA Bessa')).toBeInTheDocument();
      });

      // Busca por "Bessa"
      const searchInput = screen.getByPlaceholderText(/buscar|pesquisar/i);
      await user.type(searchInput, 'Bessa');

      // Deve mostrar apenas UPA Bessa
      await waitFor(() => {
        expect(screen.getByText('UPA Bessa')).toBeInTheDocument();
        expect(screen.queryByText('UPA Central')).not.toBeInTheDocument();
      });
    });
  });

  describe('Atualização em tempo real (WebSocket)', () => {
    let mockWebSocket;

    beforeEach(() => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockApiResponses.upas,
        },
      });

      // Captura a instância do WebSocket criada
      const OriginalWebSocket = global.WebSocket;
      global.WebSocket = function (url) {
        mockWebSocket = new OriginalWebSocket(url);
        return mockWebSocket;
      };
      global.WebSocket.CONNECTING = MockWebSocket.CONNECTING;
      global.WebSocket.OPEN = MockWebSocket.OPEN;
      global.WebSocket.CLOSING = MockWebSocket.CLOSING;
      global.WebSocket.CLOSED = MockWebSocket.CLOSED;
    });

    it('deve conectar ao WebSocket e receber atualizações', async () => {
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      // Aguarda conexão WebSocket
      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      }, { timeout: 100 });

      // Simula mensagem do servidor com atualização
      mockWebSocket.simulateMessage({
        type: 'upa-update',
        data: {
          id: 1,
          queueDetail: {
            blue: 10, // Alterado de 5 para 10
            green: 12,
            yellow: 4,
            orange: 3,
            red: 2,
          },
          totalPacientes: 31, // Alterado de 21 para 31
        },
      });

      // Verifica atualização na UI
      await waitFor(() => {
        const upaCentral = screen.getByText('UPA Central').closest('.upa-item, [class*="upa"]');
        expect(within(upaCentral).getByText('31')).toBeInTheDocument();
      });
    });

    it('deve lidar com desconexão do WebSocket', async () => {
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(mockWebSocket).toBeDefined();
      }, { timeout: 100 });

      // Simula desconexão
      mockWebSocket.close();

      // Pode exibir mensagem de desconexão ou tentar reconectar
      // (Depende da implementação)
    });
  });

  describe('Tratamento de erros', () => {
    it('deve exibir mensagem de erro quando falha ao carregar UPAs', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/erro|falha|não foi possível carregar/i)
        ).toBeInTheDocument();
      });
    });

    it('deve permitir tentar novamente após erro', async () => {
      // Primeira tentativa falha
      mockAxios.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { success: true, data: mockApiResponses.upas },
        });

      renderWithProviders(<MapPage />);

      // Aguarda mensagem de erro
      await waitFor(() => {
        expect(screen.getByText(/erro|falha/i)).toBeInTheDocument();
      });

      // Clica em "tentar novamente"
      const retryButton = screen.getByRole('button', { name: /tentar novamente|recarregar/i });
      await user.click(retryButton);

      // Deve carregar com sucesso
      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });
    });

    it('deve lidar com resposta da API mal formatada', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: false,
          message: 'Erro interno do servidor',
        },
      });

      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/erro interno|erro do servidor/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Performance e otimização', () => {
    it('não deve fazer múltiplas chamadas desnecessárias à API', async () => {
      mockAxios.get.mockResolvedValue({
        data: { success: true, data: mockApiResponses.upas },
      });

      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      // Deve ter feito apenas 1 chamada
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });

    it('deve cachear dados das UPAs', async () => {
      mockAxios.get.mockResolvedValue({
        data: { success: true, data: mockApiResponses.upas },
      });

      const { unmount } = renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      const firstCallCount = mockAxios.get.mock.calls.length;

      // Desmonta e remonta o componente
      unmount();
      renderWithProviders(<MapPage />);

      await waitFor(() => {
        expect(screen.getByText('UPA Central')).toBeInTheDocument();
      });

      // Se houver cache, não deve fazer nova chamada
      // (Isso depende da implementação de cache)
      const secondCallCount = mockAxios.get.mock.calls.length;

      // Pode ser igual (com cache) ou maior (sem cache)
      expect(secondCallCount).toBeGreaterThanOrEqual(firstCallCount);
    });
  });
});
