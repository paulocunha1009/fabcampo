# FabCampo — Campo Digital | Ceará Científico

Portal educacional do Assentamento Lagoa do Mineiro, desenvolvido pela EEMPC Francisco Araújo Barros. O frontend usa HTML, CSS e JavaScript no GitHub Pages; os recursos de IA usam um backend Node.js na Vercel.

## Produção atual

- portal: `https://fabcampo.com.br`;
- API: `https://fabcampo-api.vercel.app`;
- frontend: GitHub Pages pela branch `master`;
- backend: Vercel pela branch `main`;
- limites: Upstash Redis;
- operação e recuperação: [OPERACAO_E_RECUPERACAO.md](OPERACAO_E_RECUPERACAO.md);
- privacidade: [privacidade.html](privacidade.html);
- monitoramento automático: `.github/workflows/monitoramento.yml`, a cada 6 horas e sem consumir a cota Gemini.

## Estrutura

```text
├── index.html
├── contato.html
├── pages/
│   ├── historia.html
│   ├── memoria.html
│   ├── agricola.html
│   ├── expedicao.html
│   ├── catalogo.html
│   ├── Plantação-Nativa.html
│   ├── Plantas-Medicinaisv2.html
│   └── mudas.html
├── css/
│   ├── portal.css
│   └── portal-responsivo.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── components/
│   └── services/
├── data/
│   └── site.json
├── img/
│   ├── banner/
│   ├── galeria/
│   └── icones/
├── media/
│   ├── videos/
│   └── legendas/
└── backend/
    ├── server.js
    ├── lib/
    └── test/
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

O assistente, os desafios da Expedição e as atividades do Catálogo estão conectados à API oficial `https://fabcampo-api.vercel.app`. O backend usa Gemini, protege a chave no painel da Vercel e aplica limites persistentes pelo Upstash. Quando a API ou a cota gratuita não está disponível, o portal mantém atividades locais de contingência.

Nenhuma chave deve ser colocada no JavaScript, no GitHub ou na documentação. Consulte [backend/DEPLOY_VERCEL.md](backend/DEPLOY_VERCEL.md) para configuração e [OPERACAO_E_RECUPERACAO.md](OPERACAO_E_RECUPERACAO.md) para manutenção.

## Documentação da implantação

As decisões executadas estão em [DECISOES_IMPLANTACAO_VERCEL.md](DECISOES_IMPLANTACAO_VERCEL.md). A configuração atual está em [backend/DEPLOY_VERCEL.md](backend/DEPLOY_VERCEL.md).

O arquivo [PLANO_BACKEND_RAILWAY.md](PLANO_BACKEND_RAILWAY.md) é mantido somente como registro histórico da proposta substituída.
