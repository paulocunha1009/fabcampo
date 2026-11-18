# Reestruturação do painel - 18/11/2026

## Solicitação e resultado

O professor relatou dificuldade de uso e solicitou separar reportagens e eventos. O painel passou a oferecer telas distintas de lista e edição para cada área, com navegação lateral no computador e menu recolhível no celular.

- Início com duas entradas principais: Reportagens e Eventos da escola, cada uma com opção de listar e criar.
- Listas com busca por título e filtros Todos, Rascunhos, Publicados e Lixeira. Filtros adicionais e ordenação ficam recolhidos. A área Eventos não mostra reportagens, e vice-versa.
- Editor em coluna única, com etapas de conteúdo, mídia e revisão/publicação. Eventos têm seus próprios campos e imagem opcional. Data e horário ficam agrupados no computador.
- Salvar rascunho em posição fixa e estado de salvamento com número de revisão. Atualizar prévia é diferente de salvar no servidor.
- Prévia em janela própria; publicação somente na etapa final, com as validações e confirmações já existentes.
- Comparação da versão publicada permanece disponível como opção adicional na revisão de reportagens.
- Agendamentos, mural, equipe e ajuda na navegação administrativa. Exibição das ferramentas segue as permissões já conferidas pelos módulos de acesso.
- Rotas da interface: `painel/#reportagens` e `painel/#eventos`. São telas independentes na mesma sessão, sem criar cópias dos registros ou exigir nova autenticação a cada troca de tela. Abrir outra aba continua exigindo autenticação própria.

## Preservação dos dados e operações

Não houve migração ou alteração de rascunhos, imagens, publicações, contas, permissões, limites ou agendamentos no servidor. Os 13 eventos reais permanecem nos registros já cadastrados. Cada chamada privada continua sendo autorizada pela API.

A troca para outro conteúdo é bloqueada enquanto há alterações não salvas. Início e ajuda não descartam o formulário aberto. A expiração da sessão oculta as funções e preserva os campos na mesma aba, conforme o fluxo existente.

Corrigida colisão entre os seletores dos botões de tipo e o atributo `data-tipo` dos itens da lista: a troca de tipo agora seleciona explicitamente os botões. Isso evita que uma lista já carregada impeça a seleção correta de reportagem/evento.

Os IDs dos campos e as ações dos módulos existentes foram mantidos. Mudou a disposição visual e a navegação; formulários e operações usam os mesmos contratos da API.

## Arquivos

- `painel/organizacao.js`: montagem das telas, navegação, filtros por área, prévia, estados e proteção da edição.
- `painel/organizacao.css`: layout, legibilidade, estados de interação e responsividade.
- `painel/index.html`: inclusão dos arquivos e atualização das versões de cache.
- `painel/painel.js` e `painel/entrada-painel.js`: seletores específicos dos botões.
- Importações correspondentes em conferência, rascunhos e prévia atualizadas para manter uma única instância do módulo de edição.
- `tools/test-painel-organizado.cjs`: teste de navegador isolado, com dados e autenticação simulados.

## Verificação e limites

- 312 testes existentes do workspace aprovados após as alterações dos módulos de edição.
- Teste local com 13 eventos de demonstração e uma reportagem: acesso fechado antes da sessão simulada, listas separadas, edição, prevenção de perda, uma requisição por salvamento, revisão apropriada a cada tipo, prévia, visibilidade da equipe conforme papel, consulta com falha 503 visível e expiração preservando os campos.
- Responsividade verificada em 1440, 1024, 768, 390, 360 e 320 pixels, incluindo abertura/fechamento do menu móvel por Escape.
- Contraste calculado nos estados de início, lista e edição. Estados selecionados não usam transição que prejudique a leitura durante a troca.
- Nenhum rascunho real foi criado, editado ou publicado pelos testes. Não foi feito login Google real nesta rodada nem teste físico com teclado virtual de celular.

Para repetir: Playwright e Chrome instalados, executar `node tools/test-painel-organizado.cjs` na raiz. A ferramenta usa arquivos locais e intercepta a rede; não acessa dados reais. Relatórios e imagens ficam em `tmp/painel-organizado-testes/`. A suíte existente usa `node --test --test-reporter=spec` na pasta backend; os testes HTTP locais exigem conexão em 127.0.0.1.

## Publicação e recuperação

Esta é uma entrega de frontend na branch master. Não exige promoção da API nem sincronização integral com main. Para reverter, revisar e reverter apenas o commit desta interface; preservar arquivos de notícias, agenda e demais edições posteriores. Os rascunhos privados não fazem parte do commit e não devem ser recriados numa reversão visual.


### Ajustes após uso pelo professor

Eventos continuam publicáveis sem imagem. A etapa de mídia agora explicita a opção de seguir sem foto, sem instruções de capa obrigatória das reportagens. Agendamentos passou de diálogo modal para tela própria, mantendo menu e botão de retorno disponíveis. O fechamento invalida consultas pendentes sem alterar a programação salva. Publicação de reportagens, eventos e acervo só aparece para contas com permissão `publicar`; contas de rascunho mantêm edição, salvamento e revisão. O backend continua responsável pela autorização de cada operação.

O teste de navegador cobre entrada e saída de Agendamentos, ausência de modal, seis larguras e alternância das permissões de publicação. Nenhuma programação real foi alterada durante esses testes.


### Mural e equipe em telas próprias

Mural da Caravana e Equipe e permissões também passaram de diálogos modais para seções da navegação. Menu, indicação de área ativa e retorno ao início permanecem disponíveis. A saída invalida consultas e libera URLs temporárias de fotos; operações já enviadas continuam sob autorização do servidor. As permissões existentes foram preservadas. O teste isolado cobre entrada, saída, seis larguras, ausência de sobreposição modal e ocultação após perda de permissão, usando somente dados simulados.
