# Guia de Deploy — Portal da Comunidade
**EEMPC Francisco Araújo Barros · Ceará Científico 2026**

> **Aviso:** este arquivo descreve a implantação histórica no Render e não representa mais a produção. A arquitetura atual usa GitHub Pages, Vercel e Upstash. Para operar, publicar ou recuperar o portal, consulte `OPERACAO_E_RECUPERACAO.md` e `backend/DEPLOY_VERCEL.md`.

---

## Arquitetura de segurança

```
GITHUB (público — sem segredos)
├── Frontend (HTML/CSS/JS)  →  GitHub Pages (site público)
└── Backend (Node.js código) →  Render.com (servidor privado)
                                      ↑
                              GEMINI_API_KEY
                         (só no painel do Render,
                          nunca no código/GitHub)
```

**O que vai para o GitHub:** todo o código — HTML, CSS, JS, server.js
**O que NÃO vai para o GitHub:** `backend/.env` (chave) e `node_modules/`
**Onde a chave fica:** apenas nas variáveis de ambiente do Render.com

---

## PASSO 1 — Preparar o repositório GitHub

### 1.1 Verificar .gitignore
O arquivo `.gitignore` já está criado na raiz do projeto.
Ele protege: `backend/.env`, `node_modules/`, arquivos do sistema.

### 1.2 Inicializar o Git e subir
```bash
# Na pasta raiz do projeto (portal-comunidade/)
git init
git add .
git status
# Verifique: backend/.env NÃO deve aparecer na lista!
git commit -m "Portal da Comunidade - Ceará Científico 2026"
```

### 1.3 Criar repositório no GitHub
1. Acesse **github.com** → botão **New repository**
2. Nome: `portal-comunidade` (ou qualquer nome)
3. Visibilidade: **Public**
4. NÃO marque "Add README" (já temos)
5. Clique em **Create repository**

### 1.4 Enviar código
```bash
git remote add origin https://github.com/SEU-USUARIO/portal-comunidade.git
git branch -M main
git push -u origin main
```

---

## PASSO 2 — Deploy do Backend no Render.com

O backend é o servidor Node.js que usa a chave Gemini.
A chave fica **apenas no painel do Render** — nunca no GitHub.

### 2.1 Criar conta no Render
- Acesse **https://render.com**
- Faça login com sua conta GitHub (facilita a integração)

### 2.2 Criar o Web Service
1. Clique em **New → Web Service**
2. Conecte ao repositório `portal-comunidade`
3. Configure assim:

| Campo | Valor |
|---|---|
| **Name** | `portal-comunidade-ai` |
| **Region** | `Oregon (US West)` ou mais próximo |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.3 Adicionar variáveis de ambiente (aqui fica a chave!)
Na seção **Environment Variables**, adicione:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | `AIzaSua_Chave_Real_Aqui` |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `MAX_TOKENS` | `1500` |
| `RATE_LIMIT_PER_MIN` | `20` |
| `ALLOWED_ORIGINS` | `https://SEU-USUARIO.github.io,https://SEU-USUARIO.github.io/portal-comunidade` |

4. Clique em **Create Web Service**
5. Aguarde o deploy (2-3 minutos)
6. Você receberá uma URL como: `https://portal-comunidade-ai.onrender.com`

### 2.4 Testar o backend
Abra no navegador:
```
https://portal-comunidade-ai.onrender.com/health
```
Deve retornar: `{"ok":true,"model":"gemini-2.0-flash","timestamp":"..."}`

---

## PASSO 3 — Configurar o frontend para apontar para o backend

### 3.1 Editar js/config.js
Abra o arquivo `js/config.js` e atualize com a URL do Render:

```js
window.PORTAL_AI_ENDPOINT = 'https://portal-comunidade-ai.onrender.com/api/assistente';
```

### 3.2 Enviar atualização para o GitHub
```bash
git add js/config.js
git commit -m "Configura endpoint do backend em produção"
git push
```

---

## PASSO 4 — Deploy do Frontend no GitHub Pages

1. No GitHub, vá em **Settings** do repositório
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione: `Deploy from a branch`
4. **Branch:** `main` | **Folder:** `/ (root)`
5. Clique em **Save**
6. Aguarde 1-2 minutos
7. Seu site ficará em: `https://SEU-USUARIO.github.io/portal-comunidade`

---

## Resumo de segurança

| O que | Onde fica | É público? | Seguro? |
|---|---|---|---|
| Código HTML/CSS/JS | GitHub | ✅ Sim | ✅ Seguro |
| Código `server.js` | GitHub | ✅ Sim | ✅ Seguro (sem chave) |
| `GEMINI_API_KEY` | Render.com (env vars) | ❌ Não | ✅ Seguro |
| `backend/.env` | Só no seu PC | ❌ Não | ✅ Seguro |
| URL do backend | `js/config.js` no GitHub | ✅ Sim | ✅ Seguro (é só URL) |

**A chave Gemini só existe em dois lugares:**
1. No painel de Environment Variables do Render.com
2. No arquivo `backend/.env` no seu computador (nunca vai pro GitHub)

---

## Manutenção

### Atualizar o site após mudanças
```bash
git add .
git commit -m "Descrição da mudança"
git push
```
O GitHub Pages atualiza o frontend automaticamente.
O Render.com atualiza o backend automaticamente.

### Tier gratuito do Render
- O servidor "hiberna" após 15 min sem uso
- A primeira requisição após a hibernação demora ~30s (cold start)
- Para evitar: use o plano pago ($7/mês) ou um serviço de ping periódico
