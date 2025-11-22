// src/tests/integration/Navigation.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from './integration-utils';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Header from '../../components/Header';
import AuthService from '../../services/AuthService';

// Mock dos services
vi.mock('../../services/AuthService');

// Componente de teste para simular navegação
const TestNavApp = () => {
  const location = useLocation();

  return (
    <div>
      <Header />
      <div data-testid="current-path">{location.pathname}</div>
      <Routes>
        <Route path="/" element={
          <div>
            <h1>Home Page</h1>
            <Link to="/mapa">Ver Mapa</Link>
          </div>
        } />
        <Route path="/mapa" element={
          <div>
            <h1>Mapa Page</h1>
            <Link to="/">Voltar</Link>
          </div>
        } />
        <Route path="/upa/:id" element={
          <div>
            <h1>UPA Detalhes</h1>
            <Link to="/mapa">Voltar ao Mapa</Link>
          </div>
        } />
        <Route path="/gestao/login" element={
          <div>
            <h1>Login Page</h1>
          </div>
        } />
        <Route path="/admin/dashboard" element={
          <div>
            <h1>Dashboard Admin</h1>
          </div>
        } />
        <Route path="*" element={
          <div>
            <h1>404 - Página não encontrada</h1>
            <Link to="/">Voltar para Home</Link>
          </div>
        } />
      </Routes>
    </div>
  );
};

describe('Navegação entre Páginas - Integração', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorage.clear();
    AuthService.isAuthenticated.mockReturnValue(false);
    AuthService.getCurrentUser.mockReturnValue(null);
  });

  describe('Navegação básica entre rotas', () => {
    it('deve navegar da home para mapa', async () => {
      renderWithProviders(<TestNavApp />, { route: '/' });

      expect(screen.getByText('Home Page')).toBeInTheDocument();
      expect(screen.getByTestId('current-path')).toHaveTextContent('/');

      const mapLink = screen.getByText('Ver Mapa');
      await user.click(mapLink);

      await waitFor(() => {
        expect(screen.getByText('Mapa Page')).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent('/mapa');
      });
    });

    it('deve voltar do mapa para home', async () => {
      renderWithProviders(<TestNavApp />, { route: '/mapa' });

      expect(screen.getByText('Mapa Page')).toBeInTheDocument();

      const backLink = screen.getByText('Voltar');
      await user.click(backLink);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });
    });

    it('deve navegar para detalhes de UPA', async () => {
      renderWithProviders(<TestNavApp />, { route: '/upa/1' });

      await waitFor(() => {
        expect(screen.getByText('UPA Detalhes')).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent('/upa/1');
      });
    });

    it('deve ter link para voltar ao mapa na página de detalhes', async () => {
      renderWithProviders(<TestNavApp />, { route: '/upa/1' });

      // Verifica que está na página de detalhes
      expect(screen.getByText('UPA Detalhes')).toBeInTheDocument();

      const backLinks = screen.getAllByText('Voltar ao Mapa');
      expect(backLinks.length).toBeGreaterThan(0);

      // Clica no link do conteúdo (não do header)
      const contentBackLink = backLinks.find(link =>
        !link.closest('.app-header')
      ) || backLinks[0];

      await user.click(contentBackLink);

      // Verifica que navegou para o mapa
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/mapa');
      });

      // E que o conteúdo do mapa está visível
      expect(screen.getByText('Mapa Page')).toBeInTheDocument();
    });
  });

  describe('Navegação com header', () => {
    it('deve ter logo clicável que leva à home', async () => {
      renderWithProviders(<TestNavApp />, { route: '/mapa' });

      const logo = screen.getByAltText(/logo/i);
      const logoLink = logo.closest('a');

      await user.click(logoLink);

      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      });
    });

    it('deve mostrar link de gestão no header', async () => {
      renderWithProviders(<TestNavApp />, { route: '/' });

      // Header tem um link com ícone de usuário (sem texto)
      const links = screen.getAllByRole('link');
      const gestaoLink = links.find(link =>
        link.className.includes('login-button-header')
      );

      expect(gestaoLink).toBeInTheDocument();
    });
  });

  describe('Rotas não encontradas (404)', () => {
    it('deve exibir página 404 para rota inválida', async () => {
      renderWithProviders(<TestNavApp />, { route: '/pagina-inexistente' });

      await waitFor(() => {
        expect(screen.getByText(/404|não encontrada/i)).toBeInTheDocument();
      });
    });

    it('deve ter link para voltar à home na página 404', async () => {
      renderWithProviders(<TestNavApp />, { route: '/rota-invalida' });

      const homeLink = screen.getByText(/voltar para home/i);
      expect(homeLink).toBeInTheDocument();

      await user.click(homeLink);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });
    });
  });

  describe('Deep linking', () => {
    it('deve carregar diretamente página de detalhes da UPA', async () => {
      renderWithProviders(<TestNavApp />, { route: '/upa/5' });

      await waitFor(() => {
        expect(screen.getByText('UPA Detalhes')).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent('/upa/5');
      });
    });

    it('deve carregar diretamente página de login', async () => {
      renderWithProviders(<TestNavApp />, { route: '/gestao/login' });

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.getByTestId('current-path')).toHaveTextContent('/gestao/login');
      });
    });
  });

  describe('Múltiplas navegações sequenciais', () => {
    it('deve permitir navegar por várias páginas em sequência', async () => {
      renderWithProviders(<TestNavApp />, { route: '/' });

      // Home -> Mapa
      await user.click(screen.getByText('Ver Mapa'));
      await waitFor(() => {
        expect(screen.getByText('Mapa Page')).toBeInTheDocument();
      });

      // Mapa -> Home
      await user.click(screen.getByText('Voltar'));
      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      // Home -> Mapa novamente
      await user.click(screen.getByText('Ver Mapa'));
      await waitFor(() => {
        expect(screen.getByText('Mapa Page')).toBeInTheDocument();
      });
    });
  });

  describe('Header em diferentes rotas', () => {
    it('deve mostrar header em todas as páginas', async () => {
      const routes = ['/', '/mapa', '/upa/1'];

      for (const route of routes) {
        const { unmount } = renderWithProviders(<TestNavApp />, { route });

        // Header sempre presente (tem logo)
        expect(screen.getByAltText(/logo/i)).toBeInTheDocument();

        unmount();
      }
    });

    it('deve mostrar botão de menu na home', async () => {
      renderWithProviders(<TestNavApp />, { route: '/' });

      // Na home, deve ter botão de menu
      const menuButton = screen.getByText('☰');
      expect(menuButton).toBeInTheDocument();
    });

    it('deve mostrar link "voltar" em página de detalhes', async () => {
      renderWithProviders(<TestNavApp />, { route: '/upa/1' });

      // Em detalhes, deve ter "Voltar ao Mapa" no header e no conteúdo
      const backLinks = screen.getAllByText(/voltar/i);
      expect(backLinks.length).toBeGreaterThan(0);
    });
  });
});
