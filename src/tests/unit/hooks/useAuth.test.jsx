// src/tests/unit/hooks/useAuth.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import AuthService from '../../../services/AuthService';

// Mock do AuthService
vi.mock('../../../services/AuthService');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Inicialização', () => {
    it('deve completar inicialização e definir loading como false', async () => {
      AuthService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Aguarda a inicialização completar
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    it('deve carregar usuário autenticado no mount', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        role: 'ADMIN',
      };

      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getCurrentUser.mockReturnValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(AuthService.isAuthenticated).toHaveBeenCalled();
      expect(AuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('deve manter user null quando não há autenticação', async () => {
      AuthService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(AuthService.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        role: 'ADMIN',
      };

      const mockLoginResponse = {
        user: mockUser,
        token: 'fake-token',
      };

      AuthService.isAuthenticated.mockReturnValue(false);
      AuthService.login.mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin', 'password123');
      });

      expect(loginResult).toEqual(mockLoginResponse);
      expect(result.current.user).toEqual(mockUser);
      expect(AuthService.login).toHaveBeenCalledWith('admin', 'password123');
    });

    it('deve lançar erro quando login falha', async () => {
      const mockError = new Error('Credenciais inválidas');

      AuthService.isAuthenticated.mockReturnValue(false);
      AuthService.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.login('wrong', 'credentials');
        });
      }).rejects.toThrow('Credenciais inválidas');

      expect(result.current.user).toBeNull();
    });

    it('deve atualizar estado do usuário após login bem-sucedido', async () => {
      const mockUser = {
        id: 2,
        username: 'user',
        role: 'PADRAO',
      };

      AuthService.isAuthenticated.mockReturnValue(false);
      AuthService.login.mockResolvedValue({ user: mockUser, token: 'token' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      await act(async () => {
        await result.current.login('user', 'pass');
      });

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('deve fazer logout e limpar usuário', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        role: 'ADMIN',
      };

      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getCurrentUser.mockReturnValue(mockUser);
      AuthService.logout.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(AuthService.logout).toHaveBeenCalled();
    });

    it('deve funcionar mesmo se user já está null', async () => {
      AuthService.isAuthenticated.mockReturnValue(false);
      AuthService.logout.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });

  describe('signup', () => {
    it('deve fazer signup com sucesso', async () => {
      const mockUser = {
        id: 3,
        username: 'newuser',
        role: 'PADRAO',
      };

      const mockSignupResponse = {
        user: mockUser,
        token: 'new-token',
      };

      const userData = {
        username: 'newuser',
        password: 'password123',
        email: 'newuser@test.com',
      };

      AuthService.isAuthenticated.mockReturnValue(false);
      AuthService.signup.mockResolvedValue(mockSignupResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signupResult;
      await act(async () => {
        signupResult = await result.current.signup(userData);
      });

      expect(signupResult).toEqual(mockSignupResponse);
      expect(result.current.user).toEqual(mockUser);
      expect(AuthService.signup).toHaveBeenCalledWith(userData);
    });

    it('deve lançar erro quando signup falha', async () => {
      const mockError = new Error('Username já existe');

      AuthService.isAuthenticated.mockReturnValue(false);
      AuthService.signup.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.signup({ username: 'existing' });
        });
      }).rejects.toThrow('Username já existe');

      expect(result.current.user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('deve retornar true quando usuário está autenticado', async () => {
      AuthService.isAuthenticated.mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated()).toBe(true);
    });

    it('deve retornar false quando usuário não está autenticado', async () => {
      AuthService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated()).toBe(false);
    });
  });

  describe('Casos Edge', () => {
    it('deve lançar erro quando useAuth é usado fora do AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth deve ser usado dentro de um AuthProvider');
    });

    it('deve lidar com getCurrentUser retornando null', async () => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getCurrentUser.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    it('deve lidar com login retornando dados incompletos', async () => {
      AuthService.isAuthenticated.mockReturnValue(false);
      AuthService.login.mockResolvedValue({ token: 'token-only' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('user', 'pass');
      });

      expect(result.current.user).toBeUndefined();
    });

    it('deve preservar user através de múltiplas operações', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        role: 'ADMIN',
      };

      AuthService.isAuthenticated
        .mockReturnValueOnce(false)
        .mockReturnValue(true);
      AuthService.login.mockResolvedValue({ user: mockUser, token: 'token' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Login
      await act(async () => {
        await result.current.login('admin', 'pass');
      });

      expect(result.current.user).toEqual(mockUser);

      // Verificar autenticação
      expect(result.current.isAuthenticated()).toBe(true);

      // User ainda deve estar presente
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('Estado de Loading', () => {
    it('deve atualizar loading para false após inicialização', async () => {
      AuthService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('deve manter loading false após operações', async () => {
      AuthService.isAuthenticated.mockReturnValue(false);
      AuthService.login.mockResolvedValue({
        user: { id: 1 },
        token: 'token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('user', 'pass');
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
