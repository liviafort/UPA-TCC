// src/tests/unit/components/Header.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

// Mock dos hooks
vi.mock('../../../contexts/AuthContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    Link: ({ to, children, className }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Mock das imagens
vi.mock('../../../assets/logo.png', () => ({
  default: 'logo.png',
}));

const renderHeader = (props) => {
  return render(
    <BrowserRouter>
      <Header {...props} />
    </BrowserRouter>
  );
};

describe('Header', () => {
  const mockOnToggleSidebar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização básica', () => {
    it('deve renderizar o header com logo', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveClass('header-logo');
    });

    it('deve renderizar links de navegação', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Comportamento baseado em autenticação', () => {
    it('deve mostrar link para login quando usuário não está autenticado', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      const { container } = renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const loginLink = container.querySelector('a.login-button-header');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/gestao/login');
    });

    it('deve mostrar link para dashboard quando usuário está autenticado', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => true });

      const { container } = renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const dashboardLink = container.querySelector('a.login-button-header');
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/admin/dashboard');
    });
  });

  describe('Comportamento baseado em rota', () => {
    it('deve mostrar botão de menu na página inicial', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const menuButton = screen.getByText('☰');
      expect(menuButton).toBeInTheDocument();
    });

    it('deve chamar onToggleSidebar quando botão de menu é clicado', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const menuButton = screen.getByText('☰');
      menuButton.click();

      expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('deve mostrar link "Voltar ao Mapa" na página de detalhes da UPA', () => {
      useLocation.mockReturnValue({ pathname: '/upa/1' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const backLink = screen.getByText('Voltar ao Mapa');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('não deve mostrar botão de menu na página de detalhes da UPA', () => {
      useLocation.mockReturnValue({ pathname: '/upa/1' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const menuButton = screen.queryByText('☰');
      expect(menuButton).not.toBeInTheDocument();
    });

    it('deve detectar rotas de UPA com diferentes IDs', () => {
      useLocation.mockReturnValue({ pathname: '/upa/123' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const backLink = screen.getByText('Voltar ao Mapa');
      expect(backLink).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter ícone SVG acessível no link de gestão', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      const { container } = renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 18 18');
    });

    it('deve ter alt text apropriado na logo', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      renderHeader({ onToggleSidebar: mockOnToggleSidebar });

      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveAttribute('alt', 'Logo');
    });
  });

  describe('Casos Edge', () => {
    it('deve funcionar sem callback onToggleSidebar', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      expect(() => {
        renderHeader({});
      }).not.toThrow();
    });

    it('deve lidar com pathname vazio', () => {
      useLocation.mockReturnValue({ pathname: '' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      expect(() => {
        renderHeader({ onToggleSidebar: mockOnToggleSidebar });
      }).not.toThrow();
    });

    it('deve lidar com isAuthenticated retornando valores falsy', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      useAuth.mockReturnValue({ isAuthenticated: () => false });

      expect(() => {
        renderHeader({ onToggleSidebar: mockOnToggleSidebar });
      }).not.toThrow();

      // Verifica que o link de gestão aponta para login quando não autenticado
      const loginLinks = screen.getAllByRole('link');
      const loginLink = loginLinks.find(link => link.getAttribute('href') === '/gestao/login');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveClass('login-button-header');
    });
  });
});
