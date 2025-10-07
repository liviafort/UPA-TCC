# 🔧 Troubleshooting - Erro 403 (Forbidden)

## 📋 Diagnóstico do Erro

O erro 403 significa que o servidor está **negando acesso** à requisição, mesmo que você esteja autenticado.

---

## 🔍 Verificações Realizadas

✅ **API está funcionando:** Testamos via cURL e a API responde 200 OK
✅ **OSRM API está funcionando:** API de rotas responde corretamente
✅ **Proxy configurado:** `setupProxy.js` está configurado corretamente
✅ **Logs adicionados:** Sistema agora mostra detalhes dos erros

---

## 🛠️ Passos para Resolver

### 1️⃣ **Verificar se está rodando em modo desenvolvimento**

```bash
# Certifique-se de usar o comando dev, NÃO start
npm run dev

# NÃO use:
# npm start  ❌
```

**Por quê?** O proxy só funciona em modo desenvolvimento (`npm run dev`). Em produção (`npm start`), ele tenta acessar a API diretamente e pode gerar erro 403 por CORS.

### 2️⃣ **Limpar cache do navegador**

1. Abra DevTools (F12)
2. Clique com botão direito no ícone de recarregar
3. Selecione **"Limpar cache e recarregar forçadamente"**

Ou:

```bash
# Parar o servidor
Ctrl + C

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
npm install

# Rodar novamente
npm run dev
```

### 3️⃣ **Verificar logs do console**

Agora os logs estão mais detalhados. Abra o console do navegador (F12) e procure por:

```
🔄 Buscando lista de UPAs da API...
✅ Resposta da API recebida: 200
```

Se aparecer:
```
❌ Erro 403 (Forbidden) - Possíveis causas:
  1. Problema de CORS (Cross-Origin Resource Sharing)
  2. API requer autenticação
  3. IP bloqueado ou rate limit
  4. Verifique se está rodando em desenvolvimento (npm run dev)
```

### 4️⃣ **Verificar porta e URL**

Certifique-se de que está acessando:
```
http://localhost:3000
```

**NÃO** acesse por:
- `http://127.0.0.1:3000` ❌
- `http://0.0.0.0:3000` ❌
- Outros IPs ou portas ❌

### 5️⃣ **Verificar se o proxy está funcionando**

Com o servidor rodando, abra outro terminal e teste:

```bash
# Deve funcionar sem erro 403
curl http://localhost:3000/api/v1/upas/sidebar
```

### 6️⃣ **Usar dados mockados temporariamente**

Se o erro persistir, você pode usar dados mockados enquanto investiga:

Edite `src/server/Api.js` linha 13:

```javascript
// Mude de false para true
const USE_MOCK_DATA = true;
```

Isso fará o sistema usar dados de exemplo ao invés de chamar a API real.

---

## 🔍 Logs do Terminal do Servidor

Quando você rodar `npm run dev`, agora verá logs do proxy:

```
🔄 Proxy Request: GET /api/v1/upas/sidebar
✅ Proxy Response: 200 /api/v1/upas/sidebar
```

Se aparecer `❌ Proxy Error`, é sinal de problema na configuração do proxy.

---

## 🌐 Problemas de CORS

Se o erro persistir, pode ser necessário adicionar headers CORS no backend. Mas **você não precisa fazer isso** se usar o proxy corretamente.

O proxy já está configurado com:
```javascript
changeOrigin: true,  // Altera o header Origin
secure: false,       // Aceita certificados SSL self-signed
```

---

## 📊 Checklist de Diagnóstico

- [ ] Está rodando `npm run dev` (não `npm start`)?
- [ ] Cache do navegador foi limpo?
- [ ] Está acessando `http://localhost:3000`?
- [ ] Apareceram logs no console do navegador?
- [ ] Proxy está funcionando? (testar com cURL)
- [ ] Reinstalou as dependências?

---

## 🆘 Se Nada Funcionar

1. **Ative os dados mockados:**
   ```javascript
   // src/server/Api.js linha 13
   const USE_MOCK_DATA = true;
   ```

2. **Verifique se o backend está configurado para aceitar CORS**
   - A API pode estar bloqueando requisições do frontend
   - Verifique com o administrador do backend

3. **Teste a API diretamente:**
   ```bash
   curl -v https://api.vejamaisaude.com/upa/api/v1/upas/sidebar
   ```

4. **Verifique se há firewall ou antivírus bloqueando**
   - Alguns antivírus bloqueiam requisições proxy
   - Tente desabilitar temporariamente

---

## 📝 Informações Técnicas

### Configuração Atual do Proxy

**Arquivo:** `src/setupProxy.js`

```javascript
app.use('/api', createProxyMiddleware({
  target: 'https://api.vejamaisaude.com/upa',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug'
}));
```

**Como funciona:**
- Requisição do navegador: `http://localhost:3000/api/v1/upas/sidebar`
- Proxy redireciona para: `https://api.vejamaisaude.com/upa/api/v1/upas/sidebar`
- Resposta volta para o navegador sem erro CORS

### Configuração da API

**Arquivo:** `src/server/Api.js`

```javascript
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? ''  // Usa proxy em desenvolvimento
    : 'https://api.vejamaisaude.com/upa'  // URL direta em produção
});
```

---

**Data:** 07/10/2025
**Arquivos modificados:**
- `src/server/Api.js` - Logs detalhados adicionados
- `src/setupProxy.js` - Logs de proxy adicionados
