// src/tests/test-utils.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

// Wrapper customizado para testes que precisam de contextos
const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (ui, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export tudo do testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock data helpers
export const mockUpa = {
  id: 1,
  name: 'UPA Central',
  address: 'Rua Teste, 123',
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
  statusOcupacao: 'MODERADA',
  isActive: true,
};

export const mockUser = {
  id: 1,
  username: 'admin',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'ADMIN',
  isActive: true,
};

export const mockQueueData = {
  upaId: 1,
  totalPacientes: 21,
  aguardandoTriagem: 5,
  porClassificacao: {
    azul: 5,
    verde: 10,
    amarelo: 3,
    laranja: 2,
    vermelho: 1,
  },
  tempoMedioEsperaMinutos: 45,
  statusOcupacao: 'MODERADA',
  ultimaAtualizacao: new Date().toISOString(),
};
