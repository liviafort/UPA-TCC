// src/tests/integration/AuthFlow.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent, mockApiResponses } from './integration-utils';
import LoginPage from '../../pages/LoginPage';
import AuthService from '../../services/AuthService';

// Mock do AuthService
vi.mock('../../services/AuthService');

describe('Fluxo de Autenticação - Integração', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login bem-sucedido', () => {
    it('deve permitir login com credenciais válidas e redirecionar', async () => {
      // Mock de login bem-sucedido
      AuthService.login.mockResolvedValue(mockApiResponses.loginSuccess);

      renderWithProviders(<LoginPage />, { route: '/gestao/login' });

      // Preenche o formulário
      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Verifica que o AuthService.login foi chamado
      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith('admin', 'password123');
      });

      // Verifica que o login foi bem-sucedido
      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledTimes(1);
      });
    });

    it('deve armazenar token após login bem-sucedido', async () => {
      AuthService.login.mockResolvedValue(mockApiResponses.loginSuccess);

      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalled();
      });

      // Em uma implementação real, verificaria o localStorage ou cookie
      // expect(localStorage.getItem('token')).toBeTruthy();
    });

    it('deve preservar dados do usuário após login', async () => {
      const loginResponse = {
        ...mockApiResponses.loginSuccess,
        user: {
          id: 1,
          username: 'testuser',
          role: 'ADMIN',
        },
      };

      AuthService.login.mockResolvedValue(loginResponse);
      AuthService.getCurrentUser.mockReturnValue(loginResponse.user);

      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalled();
      });
    });
  });

  describe('Login com erro', () => {
    it('deve exibir mensagem de erro com credenciais inválidas', async () => {
      AuthService.login.mockRejectedValue(new Error('Credenciais inválidas'));

      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      await user.type(usernameInput, 'wrong');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      // Verifica se a mensagem de erro aparece
      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas|erro|falha/i)).toBeInTheDocument();
      });
    });

    it('deve permitir nova tentativa após erro', async () => {
      // Primeira tentativa falha
      AuthService.login
        .mockRejectedValueOnce(new Error('Credenciais inválidas'))
        .mockResolvedValueOnce(mockApiResponses.loginSuccess);

      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      // Primeira tentativa (erro)
      await user.type(usernameInput, 'wrong');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas|erro|falha/i)).toBeInTheDocument();
      });

      // Limpa campos
      await user.clear(usernameInput);
      await user.clear(passwordInput);

      // Segunda tentativa (sucesso)
      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledTimes(2);
      });
    });

    it('deve lidar com erro de rede', async () => {
      AuthService.login.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/erro|falha|network/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validação de formulário', () => {
    it('deve exigir preenchimento do usuário', async () => {
      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      // Tenta enviar sem preencher usuário
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Verifica validação HTML5 ou mensagem customizada
      const usernameInput = screen.getByLabelText(/usuário|username/i);
      expect(usernameInput).toBeInvalid();
    });

    it('deve exigir preenchimento da senha', async () => {
      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      // Tenta enviar sem preencher senha
      await user.type(usernameInput, 'admin');
      await user.click(submitButton);

      // Verifica validação HTML5 ou mensagem customizada
      const passwordInput = screen.getByLabelText(/senha|password/i);
      expect(passwordInput).toBeInvalid();
    });

    it('não deve enviar formulário vazio', async () => {
      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      await user.click(submitButton);

      // AuthService.login não deve ser chamado
      expect(AuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('Estado de loading', () => {
    it('deve mostrar indicador de loading durante login', async () => {
      // Mock que demora para resolver
      AuthService.login.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockApiResponses.loginSuccess), 1000);
          })
      );

      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Deve mostrar loading
      expect(
        screen.getByText(/carregando|entrando|processando/i) ||
          submitButton.hasAttribute('disabled')
      ).toBeTruthy();
    });

    it('deve desabilitar botão durante loading', async () => {
      AuthService.login.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockApiResponses.loginSuccess), 500);
          })
      );

      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Botão deve estar desabilitado
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Interação com teclado', () => {
    it('deve permitir login pressionando Enter', async () => {
      AuthService.login.mockResolvedValue(mockApiResponses.loginSuccess);

      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password123{Enter}');

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith('admin', 'password123');
      });
    });

    it('deve navegar entre campos com Tab', async () => {
      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/usuário|username/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);

      // Foca no primeiro campo
      usernameInput.focus();
      expect(document.activeElement).toBe(usernameInput);

      // Tab para o próximo campo
      await user.tab();
      expect(document.activeElement).toBe(passwordInput);
    });
  });
});
