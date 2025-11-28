# Veja+Saúde Web - Interface de Monitoramento de UPAs

## Resumo

Este projeto implementa a interface web do sistema Veja+Saúde para monitoramento em tempo real de Unidades de Pronto Atendimento (UPA). Desenvolvido como Trabalho de Conclusão de Curso, o sistema oferece visualização geográfica de UPAs, estatísticas em tempo real, análise de dados históricos e geração de relatórios, utilizando React 19 e arquitetura baseada em componentes.

## Arquitetura

### Padrão Arquitetural

O projeto adota uma **Arquitetura baseada em Componentes** com separação clara de responsabilidades:

- **Apresentação**: Componentes React isolados e reutilizáveis
- **Lógica de Negócio**: Services encapsulam regras e comunicação com APIs
- **Gerenciamento de Estado**: Context API para estado global (autenticação)
- **Comunicação**: Camada de serviços para HTTP (Axios) e WebSocket (Socket.io)

Cada camada possui responsabilidades bem definidas:

```
src/
├── components/         # Componentes de UI reutilizáveis
├── pages/              # Páginas/rotas da aplicação
├── contexts/           # Estado global (Context API)
├── services/           # Lógica de negócio e comunicação
├── server/             # Camada de comunicação HTTP
├── utils/              # Utilitários e helpers
└── tests/              # Testes automatizados
```

### Módulos Principais

#### 1. Visualização Geográfica (MapPage)

Interface pública para visualização de UPAs em mapa interativo.

**Responsabilidades:**
- Exibir mapa com localização de todas as UPAs
- Mostrar status de ocupação por cores (verde, amarelo, vermelho)
- Calcular e exibir rotas até UPAs selecionadas
- Mostrar tempo estimado de deslocamento (carro, bicicleta, a pé)
- Filtrar UPAs por distância e status de ocupação
- Atualizar dados em tempo real via WebSocket

**Principais componentes:**
- MapView: Renderização do mapa Leaflet
- SidePanel: Lista de UPAs com filtros
- UpaItem: Card individual de cada UPA

#### 2. Estatísticas em Tempo Real (UpaStatsPage)

Painel público com dados atualizados da UPA selecionada.

**Responsabilidades:**
- Exibir fila de espera atual (triagem e atendimento)
- Mostrar distribuição de pacientes por classificação Manchester
- Calcular e exibir tempo médio de espera
- Atualizar métricas automaticamente via WebSocket
- Apresentar dados de forma visual

**Visualizações:**
- Cards de métricas: Total de pacientes, tempo médio, status
- Lista de pacientes em espera

#### 3. Dashboard Administrativo (AdminDashboard)

Painel administrativo com visão consolidada de todas as UPAs.

**Responsabilidades:**
- Exibir métricas das últimas 24 horas (entradas, triagens, atendimentos)
- Comparar indicadores entre UPAs da cidade
- Mostrar tempos de espera por classificação em tempo real
- Exibir evolução das UPAs nos últimos 7 dias
- Atualizar dados automaticamente via WebSocket

**Visualizações:**
- Cards de métricas 24h: Entradas, Triagens, Atendimentos
- Comparação entre UPAs: Total de pacientes, tempo médio, bairros atendidos
- Gráficos de tempos de espera: Por classificação para cada UPA
- Linha do tempo: Evolução das UPAs

#### 4. Relatórios Analíticos (AdminReports)

Módulo de análise de dados históricos com geração de relatórios.

**Responsabilidades:**
- Filtrar dados por UPA e período (ano, mês, dia)
- Gerar estatísticas gerais (total de pacientes, taxa de conclusão)
- Exibir distribuição e percentuais por classificação Manchester
- Analisar tempos de espera detalhados (geral, triagem, atendimento)
- Mostrar bairros atendidos com métricas
- Gerar relatórios PDF exportáveis

**Análises disponíveis:**
- Distribuição de Pacientes: Gráfico de pizza por classificação
- Percentuais de Classificação: Gráfico de barras comparativo
- Tempos Médios de Espera: Gráfico horizontal por classificação
- Análise Detalhada: Métricas de tempo geral, triagem e atendimento
- Bairros Atendidos: Gráfico de barras e tabela detalhada
- Dashboard Analytics: Comparação últimas 24h vs hoje vs ontem

#### 5. Gerenciamento de Usuários (Users, UserProfile)

Administração de usuários do sistema.

**Responsabilidades:**
- Listar todos os usuários cadastrados
- Criar novos usuários (admin/padrao)
- Ativar/desativar usuários
- Visualizar e editar perfil próprio


**Funcionalidades:**
- Tabela de usuários com busca
- Modal de criação/edição
- Botões de ação (ativar, inativar)
- Perfil do usuário logado

## Comunicação em Tempo Real

### WebSocket - Socket.IO

O sistema utiliza **Socket.IO** para comunicação bidirecional em tempo real com o backend.

**Arquitetura de Rooms:**
```
Cliente conecta → Entra na room "upa:{upaId}"
                ↓
Backend emite evento → Apenas clientes da room recebem
                     ↓
Frontend atualiza UI automaticamente
```

**Eventos recebidos:**
- `queue_update`: Atualização de métricas de uma UPA específica
  - Emitido para: Room específica da UPA
  - Dados: Fila atual, pacientes por classificação, tempos de espera

- `all_upas_update`: Atualização global de todas as UPAs
  - Emitido para: Broadcast (todos os clientes)
  - Dados: Lista atualizada de todas as UPAs com status

**Implementação:**
```javascript
// Conexão e entrada em room específica
WebSocketService.connect();
WebSocketService.joinUpaRoom(upaId);

// Escuta de eventos
WebSocketService.onQueueUpdate((data) => {
  updateMetrics(data);
});

// Limpeza ao desmontar
WebSocketService.leaveUpaRoom(upaId);
```

**Benefícios:**
- **Baixa Latência**: Atualizações instantâneas sem polling
- **Isolamento**: Cada painel recebe apenas dados relevantes
- **Escalabilidade**: Suporta múltiplos clientes simultâneos
- **Reconexão Automática**: Mantém conexão estável

### HTTP - Axios

Comunicação síncrona com API REST para operações CRUD e consultas.

**Interceptores configurados:**
- **Request**: Adiciona token JWT em todas as requisições
- **Response**: Trata erros 401 (não autorizado) e redireciona para login

**Endpoints principais:**
- `/api/v1/upas`: CRUD de UPAs
- `/api/v1/analytics`: Estatísticas e análises
- `/api/v1/users`: Gerenciamento de usuários
- `/auth`: Autenticação (login, signup, refresh token)

## Stack Tecnológica

### Frontend
- **Linguagem:** JavaScript (ES6+)
- **Framework:** React 19.1.0
- **Roteamento:** React Router DOM 7.5.0
- **Build:** React Scripts 5.0.1

### Visualização de Dados
- **Mapas:** Leaflet 1.9.4 + React Leaflet 5.0.0
- **Gráficos:** Chart.js 4.5.0 + React Chart.js 2.5.3.0
- **Alternativo:** Recharts 3.1.0

### Comunicação
- **HTTP:** Axios 1.11.0
- **WebSocket:** Socket.io-client 4.8.1
- **Cookies:** js-cookie 3.0.5

### Geração de Documentos
- **PDF:** jsPDF 3.0.3
- **Tabelas PDF:** jspdf-autotable 5.0.2
- **Screenshots:** html2canvas 1.4.1

### Estado e Utilitários
- **Gerenciamento de Estado:** Context API (React nativo)
- **Validação:** Ajv 8.17.1
- **Swipe Mobile:** react-swipeable 7.0.2

## Testes

### Estratégia de Testes

O projeto implementa uma estratégia de testes abrangente com **145 testes automatizados**:

**1. Testes Unitários (87 testes)**
- Componentes isolados (Header, MapView, UpaItem, AdminSidebar)
- Services (RoutingService, AnalyticsService, AuthService)
- Hooks personalizados (useAuth)
- Utilitários (pdfGenerator, formatters)

**2. Testes de Integração (58 testes)**
- Fluxos completos de páginas (MapPage, UpaStatsPage, LoginPage)
- Integração com Context API
- Comunicação com APIs mockadas
- Navegação entre rotas

### Ferramentas de Teste
- **Framework:** Vitest 3.2.4
- **Testing Library:** @testing-library/react 16.3.0
- **User Events:** @testing-library/user-event 14.6.1
- **Matchers:** @testing-library/jest-dom 6.9.1
- **Ambiente:** jsdom 26.1.0
- **Cobertura:** @vitest/coverage-v8 3.2.4
- **UI:** @vitest/ui 3.2.4

### Execução de Testes

```bash
# Executar todos os testes
npm test

# Executar apenas testes unitários
npm test -- src/tests/unit

# Executar apenas testes de integração
npm test -- src/tests/integration

# Interface gráfica de testes
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage

# Executar testes uma vez (CI/CD)
npm run test:run
```

### Documentação de Testes

Para detalhes completos sobre os testes:
- [Testes Unitários](src/tests/unit/README.md) - 87 testes
- [Testes de Integração](src/tests/integration/README.md) - 58 testes

## Configuração do Ambiente

### Pré-requisitos

- Node.js 20+
- npm ou yarn
- Backend Veja+Saúde em execução

### Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configuração. 
- Cada desenvolvedor deve criar seu próprio `.env` localmente

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre na pasta do projeto
cd UPA-TCC

# Instale as dependências
npm install

# Edite o arquivo .env com suas credenciais
```

### Execução

```bash
# Desenvolvimento (porta 3000)
npm start

# Desenvolvimento alternativo
npm run dev

# Build para produção
npm run build

# Servir build de produção localmente
npm run serve
```

**Acesso:**
- Desenvolvimento: http://localhost:3000
- Produção (após build): http://localhost:8080

## Protocolo de Manchester

O sistema **visualiza e analisa** dados processados seguindo o Protocolo de Manchester para classificação de risco. A classificação é realizada por sistemas externos e consumida pela aplicação.

**Níveis de classificação visualizados:**

1. **Emergência (Vermelho)**: Atendimento imediato
   - Cor: #B21B1B
   - Tempo máximo: 0 minutos

2. **Muito Urgente (Laranja)**: Atendimento muito urgente
   - Cor: #FF8C00

3. **Urgente (Amarelo)**: Atendimento urgente
   - Cor: #E1AF18

4. **Pouco Urgente (Verde)**: Atendimento não urgente
   - Cor: #1BB232

5. **Não Urgente (Azul)**: Atendimento eletivo
   - Cor: #217BC0

O sistema exibe essas classificações através de:
- Cores em mapas e listas
- Gráficos de distribuição
- Análises de tempo de espera por cor
- Indicadores visuais de status

## Estrutura do Projeto

```
UPA-TCC/
├── public/                  # Arquivos públicos estáticos
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── assets/              # Recursos estáticos
│   │   ├── bike.svg
│   │   ├── car.svg
│   │   ├── walk.svg
│   │   ├── clock.svg
│   │   ├── hospital-icon.svg
│   │   └── logo.png
│   ├── components/          # Componentes React
│   │   ├── Header.js        # Cabeçalho da aplicação
│   │   ├── MapView.js       # Visualização do mapa Leaflet
│   │   ├── UpaItem.js       # Card de UPA individual
│   │   └── AdminSidebar.js  # Menu lateral administrativo
│   ├── contexts/            # Context API
│   │   └── AuthContext.js   # Contexto de autenticação
│   ├── pages/               # Páginas da aplicação
│   │   ├── MapPage.js       # Mapa público de UPAs
│   │   ├── UpaStatsPage.js  # Página de Estatísticas em tempo real
│   │   ├── LoginPage.js     # Login de usuários
│   │   ├── AdminDashboard.js # Dashboard administrativo
│   │   ├── AdminReports.js  # Relatórios e análises
│   │   ├── Users.js         # Gerenciamento de usuários
│   │   └── UserProfile.js   # Perfil do usuário
│   ├── services/            # Camada de serviços
│   │   ├── RoutingService.js    # Cálculo de rotas OpenStreetMap
│   │   ├── WebSocketService.js  # Comunicação Socket.IO
│   │   ├── AnalyticsService.js  # Estatísticas e métricas
│   │   └── AuthService.js       # Autenticação JWT
│   ├── server/              # Comunicação HTTP
│   │   ├── Api.js           # Endpoints e interceptadores Axios
│   │   └── MockData.js      # Dados mock para desenvolvimento
│   ├── styles/              # Arquivos CSS
│   │   ├── App.css
│   │   ├── MapPage.css
│   │   ├── AdminDashboard.css
│   │   └── ...
│   ├── tests/               # Testes automatizados
│   │   ├── unit/            # Testes unitários (87 testes)
│   │   │   ├── components/  # Testes de componentes
│   │   │   ├── services/    # Testes de services
│   │   │   ├── hooks/       # Testes de hooks
│   │   │   └── utils/       # Testes de utilitários
│   │   ├── integration/     # Testes de integração (58 testes)
│   │   │   └── pages/       # Testes de páginas completas
│   │   └── README.md        # Documentação geral de testes
│   ├── utils/               # Utilitários
│   │   └── pdfGenerator.js  # Geração de relatórios PDF
│   ├── App.js               # Componente raiz
│   └── index.js             # Entry point
├── .env                     # Variáveis de ambiente (não versionado)
├── .gitignore               # Arquivos ignorados pelo Git
├── package.json             # Dependências e scripts
├── vitest.config.js         # Configuração do Vitest
└── README.md                # Este arquivo
```

## Convenções de Código

### Estrutura de Componentes

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// 2. Component
function MyComponent({ prop1, prop2 }) {
  // 3. State
  const [state, setState] = useState(null);

  // 4. Effects
  useEffect(() => {
    // effect logic
  }, []);

  // 5. Handlers
  const handleClick = () => {
    // handler logic
  };

  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// 7. PropTypes
MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number
};

export default MyComponent;
```

### Nomenclatura

- **Componentes**: PascalCase (ex: `MapView`, `UpaItem`)
- **Arquivos JS**: PascalCase para componentes, camelCase para utilitários
- **Funções**: camelCase (ex: `handleClick`, `fetchData`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_URL`, `MAX_RETRIES`)
- **CSS Classes**: kebab-case (ex: `map-container`, `upa-card`)

### Boas Práticas

- Componentes pequenos e focados em uma responsabilidade
- Evitar lógica complexa no JSX
- Utilizar PropTypes para validação de props
- Criar hooks customizados para lógica reutilizável
- Manter services sem dependência de React
- Testar componentes e lógica crítica
- Documentar funções e componentes complexos

## Build e Deploy

### Build de Produção

```bash
# Criar build otimizado
npm run build

# Resultado em /build
# - HTML, CSS, JS minificados
# - Assets otimizados
# - Source maps
```

### Servir Build Localmente

```bash
# Instalar serve (se necessário)
npm install -g serve

# Servir build
npm run serve

# Acesso: http://localhost:8080
```

### Deploy

O build pode ser hospedado em qualquer servidor web estático:

**Opções populares:**
- Netlify
- Vercel


## Troubleshooting

### Problemas Comuns

**1. Erro ao instalar dependências**
```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

**2. Porta 3000 já em uso**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**3. Problemas com variáveis de ambiente**
```bash
# Verificar se .env existe
ls -la .env

# Verificar se variáveis estão corretas
cat .env

# Reiniciar servidor após alterar .env
```

**4. WebSocket não conecta**
- Verificar se backend está rodando
- Conferir URL do WebSocket no .env
- Verificar logs do navegador (F12)
- Testar se CORS está configurado no backend

**5. Mapbox não carrega**
- Verificar token no .env
- Conferir se token é válido em https://account.mapbox.com/
- Verificar quota de requests do token

## Licença

Este projeto foi desenvolvido como parte do Trabalho de Conclusão de Curso em Engenharia de Computação.

---

**Desenvolvido com React 19 e ❤️**
