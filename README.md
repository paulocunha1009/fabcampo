# Portal da Comunidade | Ceará Científico

Portal educacional estático feito com HTML, CSS e JavaScript para GitHub Pages.

## Produção atual

- portal: `https://fabcampo.com.br`;
- API: `https://fabcampo-api.vercel.app`;
- frontend: GitHub Pages pela branch `master`;
- backend: Vercel pela branch `main`;
- limites: Upstash Redis;
- operação e recuperação: [OPERACAO_E_RECUPERACAO.md](OPERACAO_E_RECUPERACAO.md);
- privacidade: [privacidade.html](privacidade.html).
- monitoramento automático: `.github/workflows/monitoramento.yml`, a cada 6 horas e sem consumir a cota Gemini.

## Estrutura

```text
├── index.html
├── contato.html
├── pages/
│   ├── historia.html
│   ├── memoria.html
│   ├── agricola.html
│   ├── Plantação-Nativa.html
│   └── Plantas-Medicinaisv2.html
├── css/
│   ├── estilo.css
│   └── responsivo.css
├── js/
│   ├── main.js
│   ├── components/
│   └── services/
├── data/
│   └── site.json
├── img/
│   ├── banner/
│   ├── galeria/
│   └── icones/
└── backend/
    └── exemplo-openai-proxy.js
```

## Como editar notícias, eventos e listas

Edite `data/site.json`.

Esse arquivo alimenta:
- notícias da página inicial
- eventos do mês
- dicas agrícolas
- cards de plantas nativas
- cards de plantas medicinais

## Como adicionar imagens

Os locais já estão prefixados no HTML. Basta salvar os arquivos nas pastas indicadas:

- `img/banner/banner-principal.jpg`
- `img/galeria/rolo-01.jpg`
- `img/galeria/rolo-02.jpg`
- `img/galeria/rolo-03.jpg`
- `img/galeria/rolo-04.jpg`
- `img/galeria/rolo-05.jpg`
- `img/galeria/historia-foto-antiga.jpg`
- `img/galeria/memoria-01.jpg`
- `img/galeria/memoria-02.jpg`
- `img/galeria/memoria-03.jpg`
- `img/galeria/agricola-01.jpg`

Enquanto as imagens não forem colocadas, o portal mostra caixas com o nome do arquivo esperado.

## Inteligência Artificial

O widget de IA já aparece no portal como protótipo. Para conectar IA real, não coloque chave de API no JavaScript do site.

Use um backend seguro como o exemplo em `backend/exemplo-openai-proxy.js`, publique em uma plataforma serverless e configure o endpoint conforme `js/config.example.js`.

Referência oficial usada: Responses API da OpenAI.

## Plano do backend de IA

O diagnóstico do serviço atual, a arquitetura proposta com `api.fabcampo.com.br`, os passos de implantação, testes e plano de reversão estão documentados em [PLANO_BACKEND_RAILWAY.md](PLANO_BACKEND_RAILWAY.md).

As decisões mais recentes substituem a proposta de continuar no Railway: consulte [DECISOES_IMPLANTACAO_VERCEL.md](DECISOES_IMPLANTACAO_VERCEL.md) e [backend/DEPLOY_VERCEL.md](backend/DEPLOY_VERCEL.md).
