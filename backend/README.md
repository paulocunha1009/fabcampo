# API do Portal da Comunidade

Backend Express para o **SabIA — Inteligência do Território**, atividades da Expedição e do Catálogo e notícias externas. A API usa Google Gemini e foi preparada para execução local e na Vercel.

## Rotas

- `GET /health` — estado da configuração, modelo e limites ativos;
- `GET /api/noticias` — notícias externas com resposta local no frontend;
- `POST /api/assistente` — assistente educacional;
- `POST /api/atividade` — atividades ancoradas no acervo do portal.

## Desenvolvimento local

```bash
npm install
copy .env.example .env
npm start
```

O servidor local usa `http://localhost:3001`. Sem uma chave Gemini válida, `/health` funciona para diagnóstico e as rotas de IA retornam `503`, permitindo testar a contingência do frontend.

## Segurança e privacidade

- chaves ficam somente nas variáveis de ambiente;
- conversas não são gravadas;
- o endereço de rede é transformado em hash antes de entrar no contador;
- CORS aceita somente as origens configuradas;
- corpos JSON têm limite de 20 KB;
- Upstash aplica limites persistentes entre instâncias da Vercel;
- em produção, `REQUIRE_PERSISTENT_RATE_LIMIT=true` impede uso sem a proteção ativa.

## Limites iniciais aprovados

- 30 solicitações por minuto por IP/rede;
- 10 solicitações por minuto no portal inteiro;
- 200 solicitações por dia;
- até 1.000 tokens de saída por resposta.

Todos os valores são configuráveis sem mudança de código. Veja [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) para implantação.
