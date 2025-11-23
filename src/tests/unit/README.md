# Testes Unitários - Veja+Saúde

## 📋 Visão Geral

Os testes unitários verificam o funcionamento de componentes, funções e módulos de forma **isolada**, garantindo que cada parte do sistema funcione corretamente de maneira independente.


## 🎯 Objetivos

- ✅ Testar componentes individuais isoladamente
- ✅ Verificar serviços e utilitários
- ✅ Testar custom hooks
- ✅ Validar formatação e transformação de dados
- ✅ Garantir tratamento correto de erros
- ✅ Execução rápida e eficiente

## 📁 Estrutura

```
src/tests/unit/
├── README.md                    # Este arquivo
├── setup.js                     # Configuração global dos testes
├── test-utils.jsx              # Utilitários para testes
├── components/                  # Testes de componentes
│   ├── Header.test.jsx
│   ├── UpaItem.test.jsx
│   └── ...
├── services/                    # Testes de serviços
│   ├── RoutingService.test.js
│   ├── AnalyticsService.test.js
│   └── ...
└── hooks/                       # Testes de custom hooks
    ├── useAuth.test.jsx
    └── ...
```

## 🧪 Arquivos de Teste

### Componentes

**Header.test.jsx**
- ✅ Renderização do logo
- ✅ Links de navegação
- ✅ Comportamento com/sem autenticação
- ✅ Menu mobile (sidebar)
- ✅ Logout de usuário

**UpaItem.test.jsx**
- ✅ Exibição de informações da UPA
- ✅ Classificação de risco
- ✅ Status de ocupação
- ✅ Interação de clique
- ✅ Estados de loading

### Services

**RoutingService.test.js**
- ✅ Cálculo de rotas
- ✅ Estimativa de tempo
- ✅ Tratamento de erros de API
- ✅ Formatação de coordenadas
- ✅ Casos edge

**AnalyticsService.test.js**
- ✅ Rastreamento de eventos
- ✅ Coleta de métricas
- ✅ Formatação de dados analíticos
- ✅ Privacidade de dados
- ✅ Validação de parâmetros

### Hooks

**useAuth.test.jsx**
- ✅ Estado de autenticação
- ✅ Login/logout
- ✅ Verificação de token
- ✅ Persistência de sessão
- ✅ Renovação de token


## 📊 Estatísticas

### Cobertura de Testes

| Tipo de Teste | Quantidade | Descrição |
|--------------|------------|-----------|
| **Componentes** | ~40 | Componentes React individuais |
| **Services** | ~30 | Serviços e utilitários |
| **Hooks** | ~17 | Custom hooks do React |
| **TOTAL** | **87 testes** | Testes unitários |


## 🚀 Como Executar

```bash
# Executar todos os testes unitários
npm test -- unit

# Executar arquivo específico
npm test -- Header.test.jsx

# Com interface gráfica
npm run test:ui

# Com cobertura
npm run test:coverage -- unit

# Executar testes uma vez (CI/CD)
npm run test:run
```

## 🔍 Estratégia de Testes

Os testes unitários focam em:
- **Isolamento**: Cada componente/função testado independentemente
- **Rapidez**: Execução muito rápida (~10-50ms por teste)
- **Mocking**: Todas as dependências externas são mockadas
- **Cobertura**: Cobrir todos os caminhos de código possíveis
- **Confiabilidade**: Testes determinísticos e repetíveis


## 📚 Referências

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
