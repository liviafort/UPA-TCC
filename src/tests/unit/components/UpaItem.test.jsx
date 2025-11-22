// src/tests/unit/components/UpaItem.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test-utils';
import UpaItem from '../../../components/UpaItem';
import { mockUpa } from '../../test-utils';

describe('UpaItem', () => {
  const mockOnSelectUpa = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização básica', () => {
    it('deve renderizar nome da UPA', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByText('UPA Central')).toBeInTheDocument();
    });

    it('deve renderizar endereço da UPA', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByText(/Rua Teste, 123/i)).toBeInTheDocument();
    });

    it('deve renderizar tempo médio de espera', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByText('Tempo médio de espera')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('deve renderizar ícone do hospital', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      const icon = screen.getByAltText('Ícone Hospital');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('icon-painel');
    });

    it('deve renderizar ícone do relógio', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      const clockIcon = screen.getByAltText('Tempo');
      expect(clockIcon).toBeInTheDocument();
    });
  });

  describe('Classificação de Risco', () => {
    it('deve renderizar todos os badges de classificação', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByTitle('Não Urgente')).toBeInTheDocument();
      expect(screen.getByTitle('Pouco Urgente')).toBeInTheDocument();
      expect(screen.getByTitle('Urgente')).toBeInTheDocument();
      expect(screen.getByTitle('Muito Urgente')).toBeInTheDocument();
      expect(screen.getByTitle('Emergência')).toBeInTheDocument();
    });

    it('deve exibir quantidade correta em cada badge', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      const blueBadge = screen.getByTitle('Não Urgente');
      const greenBadge = screen.getByTitle('Pouco Urgente');
      const yellowBadge = screen.getByTitle('Urgente');
      const orangeBadge = screen.getByTitle('Muito Urgente');
      const redBadge = screen.getByTitle('Emergência');

      expect(blueBadge).toHaveTextContent('5');
      expect(greenBadge).toHaveTextContent('10');
      expect(yellowBadge).toHaveTextContent('3');
      expect(orangeBadge).toHaveTextContent('2');
      expect(redBadge).toHaveTextContent('1');
    });

    it('deve aplicar classes corretas aos badges', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByTitle('Não Urgente')).toHaveClass('badge', 'blue');
      expect(screen.getByTitle('Pouco Urgente')).toHaveClass('badge', 'green');
      expect(screen.getByTitle('Urgente')).toHaveClass('badge', 'yellow');
      expect(screen.getByTitle('Muito Urgente')).toHaveClass('badge', 'orange');
      expect(screen.getByTitle('Emergência')).toHaveClass('badge', 'red');
    });
  });

  describe('Contadores de pacientes', () => {
    it('deve exibir total de pacientes no plural', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByText(/Total:/i)).toBeInTheDocument();
      expect(screen.getByText(/21/)).toBeInTheDocument();
      expect(screen.getAllByText(/pacientes/i).length).toBeGreaterThan(0);
    });

    it('deve exibir total de pacientes no singular quando há apenas 1', () => {
      const upaWith1Patient = {
        ...mockUpa,
        totalPacientes: 1,
        queueDetail: {
          blue: 0,
          green: 0,
          yellow: 0,
          orange: 0,
          red: 1,
        },
      };

      render(<UpaItem upa={upaWith1Patient} onSelectUpa={mockOnSelectUpa} />);

      // Verifica que o texto contém "paciente" no singular
      const totalText = screen.getByText(/Total:/i);
      expect(totalText).toBeInTheDocument();
      expect(totalText.textContent).toMatch(/Total:\s*1\s*paciente$/i);
    });

    it('deve exibir 0 pacientes quando totalPacientes é undefined', () => {
      const upaWithoutPatients = {
        ...mockUpa,
        totalPacientes: undefined,
      };

      render(<UpaItem upa={upaWithoutPatients} onSelectUpa={mockOnSelectUpa} />);

      const totalText = screen.getByText(/Total:/i).closest('p');
      expect(totalText).toHaveTextContent('0');
    });

    it('deve exibir pacientes aguardando triagem', () => {
      const upaWithTriage = {
        ...mockUpa,
        aguardandoTriagem: 7,
        queueDetail: {
          blue: 5,
          green: 10,
          yellow: 3,
          orange: 2,
          red: 1,
        },
      };

      render(<UpaItem upa={upaWithTriage} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByText(/Pacientes aguardando triagem:/i)).toBeInTheDocument();
      const triageText = screen.getByText(/Pacientes aguardando triagem:/i).closest('p');
      expect(triageText).toHaveTextContent('7');
    });

    it('deve exibir 0 quando aguardandoTriagem é undefined', () => {
      const upaWithoutTriage = {
        ...mockUpa,
        aguardandoTriagem: undefined,
      };

      render(<UpaItem upa={upaWithoutTriage} onSelectUpa={mockOnSelectUpa} />);

      const triageText = screen.getByText(/Pacientes aguardando triagem:/i).closest('p');
      expect(triageText).toHaveTextContent('0');
    });
  });

  describe('Interatividade', () => {
    it('deve chamar onSelectUpa quando clicado', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      const upaItem = screen.getByText('UPA Central').closest('.upa-item');
      upaItem.click();

      expect(mockOnSelectUpa).toHaveBeenCalledTimes(1);
      expect(mockOnSelectUpa).toHaveBeenCalledWith(mockUpa);
    });

    it('deve ser clicável em qualquer parte do item', () => {
      render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);

      const upaItem = screen.getByText(/Rua Teste/i).closest('.upa-item');
      upaItem.click();

      expect(mockOnSelectUpa).toHaveBeenCalledTimes(1);
    });
  });

  describe('Casos Edge', () => {
    it('deve renderizar com queueDetail vazio', () => {
      const upaWithEmptyQueue = {
        ...mockUpa,
        queueDetail: {
          blue: 0,
          green: 0,
          yellow: 0,
          orange: 0,
          red: 0,
        },
      };

      render(<UpaItem upa={upaWithEmptyQueue} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByTitle('Não Urgente')).toHaveTextContent('0');
      expect(screen.getByTitle('Emergência')).toHaveTextContent('0');
    });

    it('deve renderizar com valores null em queueDetail', () => {
      const upaWithNullQueue = {
        ...mockUpa,
        queueDetail: {
          blue: null,
          green: null,
          yellow: null,
          orange: null,
          red: null,
        },
      };

      expect(() => {
        render(<UpaItem upa={upaWithNullQueue} onSelectUpa={mockOnSelectUpa} />);
      }).not.toThrow();
    });

    it('deve renderizar com averageWaitTime vazio', () => {
      const upaWithNoWaitTime = {
        ...mockUpa,
        averageWaitTime: '',
      };

      render(<UpaItem upa={upaWithNoWaitTime} onSelectUpa={mockOnSelectUpa} />);

      expect(screen.getByText('Tempo médio de espera')).toBeInTheDocument();
    });

    it('deve renderizar sem bestUpaId', () => {
      expect(() => {
        render(<UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} />);
      }).not.toThrow();
    });

    it('deve funcionar sem callback onSelectUpa', () => {
      expect(() => {
        render(<UpaItem upa={mockUpa} />);
      }).not.toThrow();
    });

    it('deve renderizar com nome longo da UPA', () => {
      const upaWithLongName = {
        ...mockUpa,
        name: 'UPA Central de Atendimento Médico de Emergência do Bairro Centro da Cidade de João Pessoa',
      };

      render(<UpaItem upa={upaWithLongName} onSelectUpa={mockOnSelectUpa} />);

      expect(
        screen.getByText(
          'UPA Central de Atendimento Médico de Emergência do Bairro Centro da Cidade de João Pessoa'
        )
      ).toBeInTheDocument();
    });

    it('deve renderizar com endereço longo', () => {
      const upaWithLongAddress = {
        ...mockUpa,
        address: 'Rua Muito Longa Com Nome Extenso, Número 12345, Bairro Distante, CEP 58000-000',
      };

      render(<UpaItem upa={upaWithLongAddress} onSelectUpa={mockOnSelectUpa} />);

      expect(
        screen.getByText(/Rua Muito Longa Com Nome Extenso/i)
      ).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('deve corresponder ao snapshot', () => {
      const { container } = render(
        <UpaItem upa={mockUpa} onSelectUpa={mockOnSelectUpa} bestUpaId={1} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
