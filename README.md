# Veja+Saúde - Sistema de Monitoramento de UPAs

Sistema web para visualização em tempo real da situação das Unidades de Pronto Atendimento (UPAs), permitindo que cidadãos consultem filas, tempos de espera e rotas até as unidades mais próximas.

## 🚀 Como Iniciar o Projeto

### Pré-requisitos
- Node.js (versão 20 ou superior)
- npm ou yarn
- React 19

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre na pasta do projeto
cd UPA-TCC

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env e preencha com suas credenciais
```

### Executar o Projeto

```bash
# Inicia o servidor de desenvolvimento
npm start
```

O projeto será aberto automaticamente em [http://localhost:3000](http://localhost:3000)

### Outros Comandos

```bash
# Executar testes
npm test

# Executar testes com interface gráfica
npm run test:ui

# Executar testes com cobertura
npm run test:coverage

# Build para produção
npm run build
```

## ⚙️ Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configuração. Crie um arquivo `.env` na raiz do projeto (use `.env.example` como base):

```env
# Servidor
PORT=3000
HOST=0.0.0.0

# API Backend
REACT_APP_API_URL=https://api.vejamaisaude.com/upa

# WebSocket
REACT_APP_WEBSOCKET_URL=https://api.vejamaisaude.com

# Mapbox Token (obtenha em: https://account.mapbox.com/)
REACT_APP_MAPBOX_TOKEN=seu_token_aqui

# OSRM (Rotas)
REACT_APP_OSRM_URL=https://router.project-osrm.org

# Ambiente
NODE_ENV=development

# Timeout
REACT_APP_API_TIMEOUT=10000
```

**⚠️ Importante:** O arquivo `.env` contém informações sensíveis e **não deve ser commitado** no Git.

## 📁 Estrutura de Diretórios

```
src/
├── assets/              # Imagens, ícones e arquivos estáticos
├── components/          # Componentes React reutilizáveis
│   ├── Header.js
│   ├── MapView.js
│   ├── UpaItem.js
│   ├── AdminSidebar.js
│   └── ...
├── contexts/            # Context API (gerenciamento de estado global)
│   └── AuthContext.js   # Autenticação e usuário
├── pages/               # Páginas da aplicação
│   ├── MapPage.js       
│   ├── UpaStatsPage.js  
│   ├── LoginPage.js     
│   ├── AdminDashboard.js
│   ├── AdminReports.js
│   └── ...
├── services/            # Serviços e lógica de negócio
│   ├── RoutingService.js      # Cálculo de rotas
│   ├── WebSocketService.js    # Comunicação em tempo real
│   ├── AnalyticsService.js    # Estatísticas e analytics
│   └── AuthService.js         # Autenticação
├── server/              # Comunicação com API
│   ├── Api.js           # Endpoints da API
│   └── MockData.js      # Dados de exemplo
├── styles/              # Arquivos CSS
├── tests/               # Testes automatizados
│   ├── unit/            # Testes unitários (87 testes)
│   └── integration/     # Testes de integração (58 testes)
├── utils/               # Utilitários gerais
│   └── pdfGenerator.js  # Geração de relatórios PDF
├── App.js               # Componente raiz
└── index.js             # Ponto de entrada da aplicação
```

## 🧪 Testes

O projeto possui **145 testes automatizados**:
- **87 testes unitários** - Testam componentes e funções isoladamente
- **58 testes de integração** - Testam fluxos completos da aplicação

Para mais detalhes sobre os testes, consulte:
- [Testes Unitários](src/tests/unit/README.md)
- [Testes de Integração](src/tests/integration/README.md)

## 🛠️ Tecnologias Utilizadas

- **React 19** - Biblioteca para interfaces
- **React Router** - Navegação entre páginas
- **Leaflet** - Mapas interativos
- **Chart.js** - Gráficos e visualizações
- **Socket.io** - Comunicação em tempo real
- **Vitest** - Framework de testes
- **Axios** - Requisições HTTP

## 📄 Licença

Este projeto é um Trabalho de Conclusão de Curso (TCC).
