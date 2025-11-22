# Testes de Integração - Veja+Saúde

## 📋 Visão Geral

Os testes de integração verificam como diferentes partes do sistema funcionam juntas, simulando interações reais do usuário e testando fluxos completos da aplicação.


## 🎯 Objetivos

- ✅ Testar fluxos completos de usuário 
- ✅ Verificar integração entre componentes e serviços
- ✅ Simular chamadas de API e respostas
- ✅ Testar estados de erro e recuperação
- ✅ Validar navegação e roteamento
- ✅ Garantir que o sistema funciona como um todo

## 📁 Estrutura

```
src/tests/integration/
├── README.md                    # Este arquivo
├── integration-utils.jsx        # Utilitários para testes de integração
├── AuthFlow.test.jsx           # Testes de autenticação completa
├── UpaList.test.jsx            # Testes de listagem e exibição de UPAs
└── Navigation.test.jsx         # Testes de navegação e rotas
```

##  Arquivos de Teste

### 1. AuthFlow.test.jsx (18 testes)

Testa o **fluxo completo de autenticação**:

**Login bem-sucedido**
- ✅ Login com credenciais válidas e redirecionamento
- ✅ Armazenamento de token após login
- ✅ Preservação de dados do usuário

**Login com erro**
- ✅ Exibição de mensagem de erro com credenciais inválidas
- ✅ Permitir nova tentativa após erro
- ✅ Tratamento de erro de rede

**Validação de formulário**
- ✅ Exigir preenchimento do usuário
- ✅ Exigir preenchimento da senha
- ✅ Não enviar formulário vazio

**Estado de loading**
- ✅ Mostrar indicador de loading durante login
- ✅ Desabilitar botão durante loading

**Interação com teclado**
- ✅ Permitir login pressionando Enter
- ✅ Navegar entre campos com Tab

### 2. UpaList.test.jsx (20 testes)

Testa **carregamento, exibição e interação com UPAs**:

**Carregamento inicial**
- ✅ Carregar e exibir lista de UPAs
- ✅ Exibir indicador de loading durante carregamento
- ✅ Exibir mensagem quando não há UPAs

**Exibição de informações**
- ✅ Exibir detalhes de cada UPA
- ✅ Exibir classificação de risco corretamente
- ✅ Exibir status de ocupação

**Interação com lista**
- ✅ Clicar em UPA para ver detalhes
- ✅ Destacar UPA selecionada
- ✅ Buscar/filtrar UPAs

**Atualização em tempo real (WebSocket)**
- ✅ Conectar ao WebSocket e receber atualizações
- ✅ Lidar com desconexão do WebSocket

**Tratamento de erros**
- ✅ Exibir mensagem de erro ao falhar carregamento
- ✅ Permitir tentar novamente após erro
- ✅ Lidar com resposta da API mal formatada

**Performance**
- ✅ Não fazer múltiplas chamadas desnecessárias
- ✅ Cachear dados das UPAs

### 3. Navigation.test.jsx (20 testes)

Testa **navegação entre páginas e rotas**:

**Navegação pública**
- ✅ Navegar da home para mapa
- ✅ Acessar página de login diretamente
- ✅ Mostrar detalhes de UPA específica
- ✅ Ter link para voltar ao mapa

**Navegação com header**
- ✅ Logo clicável que leva à home
- ✅ Link de gestão no header
- ✅ Navegar para login quando não autenticado
- ✅ Navegar para dashboard quando autenticado

**Rotas protegidas**
- ✅ Redirecionar para login sem autenticação
- ✅ Permitir acesso com autenticação
- ✅ Verificar permissões de admin

**Histórico de navegação**
- ✅ Navegar para frente e para trás
- ✅ Manter estado ao usar botão voltar

**Navegação com sidebar (mobile)**
- ✅ Abrir sidebar ao clicar no menu
- ✅ Fechar sidebar ao clicar em link
- ✅ Fechar sidebar ao clicar fora

**Rotas não encontradas (404)**
- ✅ Exibir página 404 para rota inválida
- ✅ Ter link para voltar à home

**Deep linking**
- ✅ Carregar diretamente página de detalhes
- ✅ Carregar diretamente página de perfil

**Breadcrumbs**
- ✅ Mostrar breadcrumbs em páginas internas
- ✅ Permitir navegação via breadcrumbs


## 📊 Estatísticas

### Cobertura de Testes

| Tipo de Teste | Quantidade | Descrição |
|--------------|------------|-----------|
| **Autenticação** | 18 | Fluxo completo de login/logout |
| **Listagem de UPAs** | 20 | Carregamento, exibição, WebSocket |
| **Navegação** | 20 | Rotas, proteção, histórico |
| **TOTAL** | **58 testes** | Testes de integração |

## 🚀 Como Executar

```bash
# Executar todos os testes de integração
npm test -- integration

# Executar arquivo específico
npm test -- AuthFlow.test.jsx

# Com interface gráfica
npm run test:ui

# Com cobertura
npm run test:coverage -- integration
```
