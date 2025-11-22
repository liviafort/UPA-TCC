// src/tests/integration/integration-utils.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';

/**
 * Renderiza componente com todos os providers necessários para testes de integração
 */
export const renderWithProviders = (ui, options = {}) => {
  const { route = '/', initialEntries, ...renderOptions } = options;

  // Usa MemoryRouter para testes (não conflita com BrowserRouter do App)
  const entries = initialEntries || [route];

  const AllProviders = ({ children }) => {
    return (
      <MemoryRouter initialEntries={entries} initialIndex={0}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    );
  };

  return {
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
  };
};

/**
 * Mocks de API para testes de integração
 */
export const mockApiResponses = {
  // UPAs mockadas
  upas: [
    {
      id: 1,
      name: 'UPA Central',
      address: 'Rua Central, 100',
      lat: -7.2404146,
      lng: -35.8883043,
      queueDetail: {
        blue: 5,
        green: 10,
        yellow: 3,
        orange: 2,
        red: 1,
      },
      averageWaitTime: '45 min',
      totalPacientes: 21,
      aguardandoTriagem: 5,
      statusOcupacao: 'MODERADA',
      isActive: true,
    },
    {
      id: 2,
      name: 'UPA Bessa',
      address: 'Av. Bessa, 200',
      lat: -7.0731847,
      lng: -34.8412845,
      queueDetail: {
        blue: 3,
        green: 8,
        yellow: 2,
        orange: 1,
        red: 0,
      },
      averageWaitTime: '30 min',
      totalPacientes: 14,
      aguardandoTriagem: 3,
      statusOcupacao: 'BAIXA',
      isActive: true,
    },
  ],

  // Usuário mockado
  user: {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    role: 'ADMIN',
  },

  // Resposta de login bem-sucedido
  loginSuccess: {
    success: true,
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      role: 'ADMIN',
    },
    token: 'fake-jwt-token',
  },

  // Resposta de login com erro
  loginError: {
    success: false,
    message: 'Credenciais inválidas',
  },

  // Estatísticas de bairros
  bairroStats: {
    success: true,
    data: {
      bairros: [
        { bairro: 'Centro', total: 100 },
        { bairro: 'Bessa', total: 80 },
        { bairro: 'Manaíra', total: 60 },
      ],
    },
  },

  // Comparação de UPAs
  upaComparison: {
    success: true,
    data: {
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
    },
  },
};

/**
 * Helper para esperar por elemento de loading desaparecer
 */
export const waitForLoadingToFinish = async (container) => {
  const { queryByText } = container;

  // Aguarda até que não haja mais "Carregando" na tela
  await new Promise((resolve) => {
    const checkLoading = () => {
      if (!queryByText(/carregando/i)) {
        resolve();
      } else {
        setTimeout(checkLoading, 50);
      }
    };
    checkLoading();
  });
};

/**
 * Helper para simular login do usuário
 */
export const loginUser = async (screen, userEvent, credentials = {}) => {
  const { username = 'admin', password = 'password123' } = credentials;

  // Preenche o formulário
  const usernameInput = screen.getByLabelText(/usuário|username/i);
  const passwordInput = screen.getByLabelText(/senha|password/i);
  const submitButton = screen.getByRole('button', { name: /entrar|login/i });

  await userEvent.type(usernameInput, username);
  await userEvent.type(passwordInput, password);
  await userEvent.click(submitButton);
};

/**
 * Helper para simular logout do usuário
 */
export const logoutUser = async (screen, userEvent) => {
  const logoutButton = screen.getByRole('button', { name: /sair|logout/i });
  await userEvent.click(logoutButton);
};

/**
 * Mock de geolocalização
 */
export const mockGeolocation = (coords = { latitude: -7.1195, longitude: -34.8450 }) => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn((success) =>
      success({
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: 100,
        },
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  global.navigator.geolocation = mockGeolocation;
  return mockGeolocation;
};

/**
 * Mock de WebSocket para testes
 */
export class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;

    // Simula conexão bem-sucedida após um pequeno delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen(new Event('open'));
    }, 10);
  }

  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simula resposta do servidor
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: JSON.stringify({ type: 'ack', data: JSON.parse(data) }),
        });
      }
    }, 10);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose(new Event('close'));
  }

  // Método helper para simular mensagem do servidor
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({
        data: JSON.stringify(data),
      });
    }
  }

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
