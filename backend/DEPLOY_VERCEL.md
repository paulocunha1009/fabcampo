# Implantação e manutenção da API na Vercel

Este procedimento documenta a API oficial usada pelo portal público.

## Decisões registradas

- frontend permanece no GitHub Pages;
- projeto Vercel: `fabcampo-api`;
- repositório: `paulocunha1009/fabcampo`;
- endpoint público: `https://fabcampo-api.vercel.app`;
- diretório raiz na Vercel: `backend`;
- branch de produção da API: `main`;
- modelo inicial: `gemini-2.5-flash-lite`;
- planos gratuitos, sem aumento automático pago;
- Upstash Redis para limites persistentes;
- conversas não são armazenadas;
- o portal está conectado à API após testes, backup e aprovação final.

## 1. Importar o projeto

1. Na Vercel, escolha **Add New > Project**.
2. Importe `paulocunha1009/fabcampo`.
3. Use o nome `fabcampo-api`.
4. Configure **Root Directory** como `backend`.
5. Configure **Production Branch** como `main`.
6. Não altere os dois projetos Vercel já existentes.

## 2. Criar o banco gratuito Upstash

Crie ou conecte um banco Redis gratuito pelo Marketplace/Integrações da Vercel. Com o prefixo usado neste projeto, a integração cria:

```text
UPSTASH_REDIS_REST_KV_REST_API_URL
UPSTASH_REDIS_REST_KV_REST_API_TOKEN
```

O backend também aceita os nomes padrão `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.

Não copie esses valores para o GitHub, documentos ou mensagens.

## 3. Variáveis de ambiente

Cadastre nos ambientes Production e Preview:

```text
GEMINI_API_KEY=<cadastrar diretamente no painel>
GEMINI_MODEL=gemini-2.5-flash-lite
MAX_TOKENS=1000
RATE_LIMIT_PER_IP_MIN=30
RATE_LIMIT_GLOBAL_MIN=10
RATE_LIMIT_GLOBAL_DAY=200
RATE_LIMIT_PREFIX=campo-digital
RATE_LIMIT_SALT=<texto aleatório longo e privado>
REQUIRE_PERSISTENT_RATE_LIMIT=true
ALLOWED_ORIGINS=https://fabcampo.com.br,https://www.fabcampo.com.br
```

Não habilite upgrade automático ou plano pago.

## 4. Testes de implantação e manutenção

- `/health` responde `200`, com `ok: true`, `aiConfigured: true` e `limiter: "upstash"`;
- origem não autorizada é bloqueada;
- `/api/assistente` responde em português;
- `/api/atividade` devolve texto baseado no material enviado;
- `/api/noticias` devolve uma lista ou uma lista vazia válida;
- nenhuma chave aparece no navegador ou no repositório;
- a 11ª solicitação no mesmo minuto recebe `429`;
- o portal usa atividades locais quando a API retorna `429` ou `503`.

## 5. Endereço usado pelo portal

O arquivo `js/config.js` aponta para `https://fabcampo-api.vercel.app/api/assistente`. O domínio `api.fabcampo.com.br` é uma melhoria futura opcional e não é necessário para operar gratuitamente.

## Reversão

Se uma nova versão da API apresentar problema, restaure o commit estável ou a URL anterior em `js/config.js` e publique novamente os branches `main` e `master`. O portal continuará oferecendo a contingência local enquanto a API estiver indisponível.
