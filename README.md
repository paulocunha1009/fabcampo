# FabCampo — Campo Digital | Ceará Científico

Portal educacional do Assentamento Lagoa do Mineiro, desenvolvido pela EEMPC Francisco Araújo Barros. O frontend usa HTML, CSS e JavaScript no GitHub Pages; os recursos de IA usam um backend Node.js na Vercel.

## Painel da equipe - 18/11/2026

Reportagens e eventos têm telas distintas de lista, edição e revisão/publicação. Consulte [Reestruturação do painel](PAINEL_REESTRUTURADO_2026-11-18.md) para navegação, preservação dos registros, testes e manutenção.

## Atualização visual e revisão técnica

Estado revisto em 16/11/2026. Consulte [Melhorias e auditoria de novembro](ATUALIZACOES_PORTAL_2026-11-16.md) para o histórico das entregas, arquivos, paleta, testes e pendências.

O portal possui temas Claro/Escuro/Sistema, controle sol/lua junto à logo, busca no cabeçalho e na inicial e destaques para reportagens. O rolo de fotos foi retirado da inicial. Alto contraste continua separado do tema visual.

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

## Como editar reportagens, eventos e listas

Use o painel com uma conta autorizada para preparar e revisar matérias, fotos, créditos e eventos. Salvar rascunho não publica. A publicação exige a confirmação editorial já existente; a equipe não deve editar diretamente os arquivos gerados de uma matéria gerenciada.

`data/site.json` é a lista pública de conteúdo. As publicações do painel atualizam as entradas gerenciadas. O banner consulta essa lista, usa até cinco reportagens publicadas com `editorialId` e busca a capa na própria página. A seleção Nossa escola em movimento é manual. Educação & Inovação utiliza um carregador próprio.

Em manutenção manual, preservar `editorialId`, manifesto e caminhos; conferir o fluxo descrito na [documentação da rodada](ATUALIZACOES_PORTAL_2026-11-16.md). O índice `data/busca.json` permite pesquisar títulos e trechos; `data/plantas.json` alimenta o catálogo.

## Imagens e fotografias

Reutilize fotos reais compatíveis com o assunto e confira legenda, autoria e autorização. O painel prepara as fotos da matéria e permite escolher a capa. O banner usa a capa da reportagem publicada.

Consulte [Imagens Pendentes](IMAGENS_PENDENTES.md) antes de substituir marcadores históricos. Eles não representam fotografias dos fatos narrados. Falhas no carregamento devem preservar legenda e contexto, com mensagem legível, sem mostrar o caminho técnico para o visitante.

## Inteligência Artificial

O assistente, os desafios da Expedição e as atividades do Catálogo estão conectados à API oficial `https://fabcampo-api.vercel.app`. O backend usa Gemini, protege a chave no painel da Vercel e aplica limites persistentes pelo Upstash. Quando a API ou a cota gratuita não está disponível, o portal mantém atividades locais de contingência.

Nenhuma chave deve ser colocada no JavaScript, no GitHub ou na documentação. Consulte [backend/DEPLOY_VERCEL.md](backend/DEPLOY_VERCEL.md) para configuração e [OPERACAO_E_RECUPERACAO.md](OPERACAO_E_RECUPERACAO.md) para manutenção.

## Organização Financeira Rural

A reportagem sobre mudanças climáticas oferece uma planilha educativa para famílias produtoras registrarem receitas, despesas, perdas climáticas, reservas e metas. O recurso inclui gráficos, campos críticos protegidos e um manual visual voltado ao uso pelo celular com Google Planilhas.

- acesso: `pages/reportagem-clima.html#organizacao-financeira-rural`;
- arquivos públicos: `downloads/organizacao-financeira/`;
- cópias de preservação: `materiais/organizacao-financeira/`;
- documentação técnica e manutenção: seção 20 de [DOCUMENTACAO.md](DOCUMENTACAO.md).

## Documentação da implantação

As decisões executadas estão em [DECISOES_IMPLANTACAO_VERCEL.md](DECISOES_IMPLANTACAO_VERCEL.md). A configuração atual está em [backend/DEPLOY_VERCEL.md](backend/DEPLOY_VERCEL.md).

O arquivo [PLANO_BACKEND_RAILWAY.md](PLANO_BACKEND_RAILWAY.md) é mantido somente como registro histórico da proposta substituída.
