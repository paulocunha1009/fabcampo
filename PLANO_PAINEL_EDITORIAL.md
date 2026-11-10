# Painel editorial de notícias e eventos

Demanda do roadmap técnico, seção 17 de `DOCUMENTACAO.md`.
Levantamento iniciado em 5 de novembro de 2026.

## Objetivo

Permitir preparar, revisar e publicar notícias da comunidade e eventos da escola
por formulários, com prévia do conteúdo e sem editar diretamente HTML ou JSON.
Os leitores e os alunos continuam acessando as atividades sem login.

## Estrutura encontrada no projeto

| Parte | Situação atual | Consequência para o painel |
| --- | --- | --- |
| Notícias da comunidade | Três registros em `data/site.json`, usados como contingência | Precisam de espaço próprio para continuarem visíveis quando chegam notícias externas |
| Notícias externas | `/api/noticias`, exibidas pelo carregador `js/noticias.js` | Continuam automáticas; sua edição não é a mesma coisa que publicar uma notícia da escola |
| Eventos locais | Há uma lista em `data/site.json` | A página inicial atual não usa essa lista para sua agenda |
| Agenda da página inicial | Incorporação da agenda de feriados do Brasil do Google | Não representa um cadastro de eventos da escola |
| Edição e publicação | Não há painel, contas de editores ou rotas de gravação editorial | É necessário definir o fluxo de revisão e o acesso antes de liberar publicações |

Os registros existentes não comprovam que as datas e os eventos foram confirmados
pela escola. A curadoria continua com estudantes e professores, conforme combinado.

## Preparação independente da escolha de acesso

O painel deve oferecer campos de notícia (título, resumo, data, categoria, fonte e
link) e evento (nome, data e descrição). A prévia precisa mostrar o que será publicado.
Datas e links devem ser validados, preservando o texto quando houver erro. O editor
não deve inventar datas, preencher fatos pela IA ou exigir que alunos forneçam dados
pessoais para consultar o portal.

Notícias da comunidade e notícias externas precisam ser distinguidas na página
inicial. A agenda escolar deve mostrar registros confirmados pela equipe. A agenda
de feriados existente pode permanecer identificada como tal, sem ser tratada como
agenda da escola nem alterada por esse painel.

## Decisão do professor sobre o fluxo

O professor definiu que somente ele e a equipe autorizada poderão publicar. A
pesquisa e a curadoria dos estudantes continuam sendo encaminhadas à equipe.
O professor escolheu conta Google, como a usada na escola. Nome
digitado ou botão escondido não servem como autenticação. Uma publicação direta
precisa verificar o acesso no servidor, inclusive quando a requisição não vem da tela.

## Decisões da implementação seguinte

- Definir com o professor as contas autorizadas e a forma de autenticação.
- Escolher onde persistir os registros e o histórico de revisões. Arquivos gravados
  no filesystem de uma função Vercel não são um armazenamento editorial persistente.
- Definir rascunho, revisão e publicação de acordo com os papéis escolhidos.
- Preparar prévia e validação dos campos antes de conectar a gravação pública.
- Impedir que uma edição sobrescreva silenciosamente uma revisão mais recente.
- Manter uma versão anterior recuperável em caso de erro de publicação.
- Conferir publicação autorizada, rejeição de acesso indevido e preservação do
  trabalho em falhas de rede, além da conferência visual.

## Prévia implementada para revisão

`painel/index.html` contém a prévia de desenvolvimento do editor, com formulários
de notícia e evento, validação de campos, visualização do registro e exportação de
um arquivo JSON explicitamente marcado como rascunho. Usa os registros existentes
em `data/site.json`; nenhuma notícia ou data de evento foi inventada para preenchê-lo.

A edição em andamento bloqueia a troca de registro até ser guardada no rascunho
ou descartada, para evitar perder o texto por engano. Os dados ficam em memória
durante a página e o arquivo exportado reúne somente notícias e eventos, sem
reescrever as demais seções do portal.

Os botões de entrada e publicação direta estão indisponíveis nesta prévia. Não há
login conectado à tela, gravação em servidor ou liberação de acesso público à edição.
A configuração Google, o armazenamento persistente e o fluxo de publicação são a
etapa seguinte. A prévia não foi publicada no site.

## Preparação do acesso Google

`backend/lib/editorial-auth.js` usa a biblioteca oficial `google-auth-library` para
verificar assinatura, emissor, público e validade do ID token. A autorização compara
o identificador estável Google `sub` com uma lista individual definida no servidor.
Uma conta Google ou um domínio escolar, isoladamente, não concedem acesso.
E-mail digitado não é prova de identidade. A verificação ocorre a cada requisição,
sem cookies, sessão própria ou armazenamento de token no navegador nesta etapa.

`GET /api/editorial/me` recebe somente `Authorization: Bearer <ID token>` e retorna
a identidade de um editor autorizado. Sem configuração completa responde 503;
token ausente ou inválido recebe 401; conta não autorizada recebe 403. A rota não
cadastra contas, não concede permissões e não publica conteúdo. Respostas não têm
cache; erros não incluem o token nem detalhes internos do Google.

Configuração pendente, sem valores reais adicionados ao repositório:

1. Configurar um cliente Web do Google Identity Services para a origem exata do painel.
2. Conectar o botão de entrada, mantendo o ID token somente em memória e enviando-o
   por HTTPS em cabeçalho, nunca na URL. Não pedir acesso a Gmail, Drive ou Calendar.
3. Confirmar com o professor a primeira conta e vincular seu `sub` validado à lista
   `EDITORIAL_GOOGLE_SUBJECTS` no servidor. Não habilitar cadastro automático.
4. Definir `EDITORIAL_GOOGLE_CLIENT_ID` e a lista aprovada no ambiente do backend;
   conferir recusa de outra conta antes de conectar qualquer operação de gravação.
5. Implementar saída e expiração para uso em computadores compartilhados.

Os testes incluem assinatura RSA real via biblioteca Google com chave de teste
local, adulteração do token, configuração ausente e recusa de conta não autorizada.
Não equivalem à validação com a conta real da escola, ainda pendente.

Referência: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

## Cliente Google criado em 6 de novembro de 2026

O professor concluiu a criação de `Campo Digital — Painel editorial` no projeto
Google Cloud `gen-lang-client-0478559212`. O ID público foi registrado em
`painel/auth-config.js`; o segredo do cliente não foi copiado nem incorporado ao
projeto. O fluxo de Google Identity Services com ID token não precisa desse segredo.

Origens cadastradas: `https://fabcampo.com.br` e `https://www.fabcampo.com.br`.
O acesso por localhost não foi autorizado nesse cliente.

A conta indicada pelo professor já consta como usuário de teste do projeto. Isso
não substitui a lista de autorização editorial por `sub` no backend. O ID Google
estável dessa conta ainda precisa ser obtido por uma entrada validada.

Foi identificado que a marca da tela de consentimento é `AISTUDYTEC`, compartilhada
com outro cliente existente. Não foi alterada para evitar mudar a identificação do
outro aplicativo. Antes da liberação definitiva, resolver a identidade do login:
uma marca independente para Campo Digital exige projeto OAuth separado, enquanto
o cliente atual pode servir para a validação técnica inicial com esse nome visível.

Estado: cliente criado e conferido no console, mas botão de entrada ainda não
conectado, variáveis do backend não configuradas e painel não publicado. Não houve
ativação de publicação ou gravação de conteúdo.

## Separação dos projetos autorizada pelo professor

Em 6 de novembro de 2026 foi criado e conferido no console o projeto independente
`Campo Digital`, ID `campo-digital-513918`, na organização já selecionada da conta,
`aluno.ce.gov.br`. A marca e o cliente AISTUDYTEC do projeto anterior foram mantidos.

O assistente de identidade está preenchido com nome `Campo Digital`, contato do
professor e público externo em modo de testes (acesso limitado aos usuários de
teste a cadastrar). A conclusão está pendente da revisão e aceitação, pelo
professor, da política de dados do usuário dos serviços de API do Google. Nenhuma
concordância foi marcada pelo assistente e a identidade ainda não foi concluída.

O ID do cliente criado anteriormente no projeto compartilhado foi retirado da
configuração ativa em `painel/auth-config.js`, que fica vazio até a criação de um
cliente no novo projeto. Nenhum cliente antigo foi excluído. Backend, login público
e publicação editorial continuam sem ativação.

## Identidade independente e cliente concluídos

Em 6 de novembro de 2026 o professor concluiu a política e a criação da identidade
no novo projeto, e depois criou o cliente Web `Campo Digital — Painel editorial`.
A criação foi conferida na lista de clientes do projeto `campo-digital-513918`.
O ID público independente está em `painel/auth-config.js`. Não foi copiado segredo
de cliente para o projeto. As origens são os dois endereços HTTPS oficiais do portal.

A conta indicada pelo professor foi cadastrada e conferida como o único usuário
de teste desse novo projeto. O status continua `Testando`. Esse cadastro permite
validar a entrada Google, mas não concede autorização editorial no backend.

Próximos passos técnicos: conectar o botão Google no painel, validar a identidade
no backend e vincular o `sub` confirmado à lista aprovada, configurar o ambiente e
validar acesso permitido/negado. Depois conectar armazenamento e publicação com
histórico recuperável. O painel e o backend alterados permanecem locais nesta etapa;
não há login editorial ativo no portal público.

## Conexão do botão Google preparada

`painel/login.js` carrega o SDK oficial somente após o clique do usuário e somente
nas duas origens HTTPS cadastradas. Usa seleção explícita de conta, sem One Tap ou
entrada automática. A prévia em localhost apresenta a limitação sem tentar o login.

`painel/google-access.js` envia o ID token em cabeçalho Bearer para a rota de
verificação do backend, sem cookies, redirecionamentos ou cache. Não retém token em
localStorage, sessionStorage ou memória de sessão após a requisição. A identificação
exibida pode ser limpa pelo usuário; sair da página cancela verificações e ignora
respostas atrasadas. Isso ainda não cria uma sessão editorial para gravações.

Respostas 401, 403, 503 e falhas de rede têm mensagens distintas. Uma resposta válida
mostra que a conta foi conferida, mas não habilita o botão de publicação. Nenhum
rascunho é apagado em falha do login. A origem de produção e o fluxo real com a conta
do professor ainda precisam ser conferidos após implantação/configuração do backend.

Validação desta etapa: 107 testes Node aprovados, incluindo autorização, assinatura
Google, erros de acesso e cancelamento; prévia local conferida no navegador. Os
testes de interface não substituem a validação da entrada real do professor.

Referência do botão: https://developers.google.com/identity/gsi/web/reference/js-reference

## Modelo editorial aprovado pelo professor

Fluxo adotado: **rascunho → revisão do professor/equipe → publicação**. O painel
ainda opera somente a primeira etapa; conferir campos não aprova nem publica.

Notícia: título, resumo recomendado de até duas frases, texto completo recomendado
de dois a quatro parágrafos, local, data quando conhecida, categoria, fonte/autoria
e referência opcional. Evento: nome, descrição do objetivo, data e horário
confirmados, local, público, orientações de participação, equipe responsável e
contato institucional. Os dois modelos têm imagem opcional com legenda, crédito e
descrição acessível. Nesta versão, usa-se endereço de imagem já disponível; não há
upload de arquivo nem inclusão automática da imagem na prévia.

O rascunho pode manter campos novos e datas não confirmadas em branco. A lista de
pendências aponta o necessário antes da revisão: notícia exige local e texto
completo, enquanto evento exige data, horário e informações práticas. Se houver
imagem, exige legenda, crédito e descrição acessível. Uma notícia sem data conhecida
não recebe uma data inventada. Os registros anteriores são carregados sem completar
informações por suposição.

O download agora usa envelope `version: 2`, `status: rascunho` e preserva todos os
novos campos. Não modifica `data/site.json`. O armazenamento continua em memória
com download local; salvar/retomar pelo servidor e histórico de revisão continuam
pendentes. Não há importação de arquivo nesta versão.

Validação: 110 testes Node aprovados; notícia e evento existentes conferidos na
interface com suas pendências reais, sem conteúdo fictício adicionado ao portal.

## Editor de postagem, capa e cards com Gemini

O professor esclareceu o objetivo: experiência de criar uma postagem, com foto,
texto, modelo da reportagem, cards e prévia; depois publicação no site por decisão
da equipe autorizada. Autorizou usar o Gemini atual para as sugestões editoriais.
As referências existentes são `reportagem-educacao.html` (destaques) e
`reportagem-clima.html` (dados). A prévia tem duas apresentações de cards inspiradas
nessas referências; ainda não gera nem publica uma página HTML completa.

### Capa

- Seleção local de JPEG/PNG/WebP até 12 MB, com pelo menos 1200 × 675 pixels e
  até 40 megapixels. Ajuste de posição do recorte, conversão WebP e download.
- Saída: 1200 × 675 pixels, qualidade 82, até 1 MB. É a capa horizontal da matéria,
  não um carrossel ou uma galeria de várias fotos nesta versão.
- O backend verifica o arquivo real, as dimensões e o tamanho, e recodifica sem EXIF.
- `POST /api/editorial/imagens` exige conta autorizada antes de receber a imagem.
  Grava somente em `img/editorial/<hash-do-conteúdo>.webp`, no repositório fabcampo,
  em branch previamente criada com nome `editorial-*`. Não escreve em main/master,
  não sobrescreve imagem diferente nem publica reportagem.
- A branch do repositório público permite acesso à imagem antes da publicação;
  isso está explicado no formulário. Rascunho não significa arquivo privado.
- O token de escrita deve ficar somente no ambiente do backend, restrito ao
  repositório e permissão Contents: write. Nenhuma credencial foi criada ou copiada.
  A branch de rascunhos e `EDITORIAL_GITHUB_TOKEN`/`EDITORIAL_UPLOAD_BRANCH` ainda
  não estão configurados; nenhum upload real foi feito.

### Sugestões de IA

`POST /api/editorial/cards` exige editor autorizado e usa o mesmo cliente Gemini,
modelo, teto de tokens e limitador global do SabIA. O backend mantém o prompt fixo;
o navegador envia só título e texto. Até três cards e um resumo são sugeridos.
Resumo e trechos precisam constar literalmente no texto recebido; uma resposta
fora desse critério é recusada. Rótulos, pertinência dos trechos e conteúdo final
continuam sujeitos à revisão humana.

Os cards não são imagens inventadas: a IA seleciona trechos, e o painel os apresenta
nos modelos visuais do portal. A equipe pode aceitar as sugestões e editar os cards
no rascunho. A IA não substitui o texto original, não confirma fatos e não publica.
Modelo e cards são preservados no JSON do rascunho.

Cada operação solicita uma verificação Google explícita; o token fica somente
durante a verificação e a requisição seguinte, sem persistência no navegador. Como
o backend ainda não está configurado/implantado para o acesso editorial, essas
operações reais permanecem indisponíveis. Não houve consumo real da cota Gemini.

Validação: 120 testes Node aprovados, incluindo processamento real WebP, recusa de
arquivos inválidos, destino fixo de upload, recusa de sobrescrita, autorização e
limites compartilhados da IA. Foto existente do portal preparada no navegador e
arquivo baixado conferido como WebP 1200 × 675 sem EXIF. Auditoria npm sem alertas
após adotar sharp 0.35.5. O código continua local e a publicação permanece bloqueada.

Referência de upload: https://docs.github.com/en/rest/repos/contents

## Galeria e vídeo aprovados pelo professor

A reportagem passa a prever **1 a 10 fotos no total, incluindo uma única capa,
e no máximo um vídeo opcional por link do YouTube**. Esta seção amplia o limite
anterior de uma única foto. Eventos mantêm seu formulário de imagem opcional.

A prévia agora permite seleção de várias fotos, escolha de capa, ajuste de posição
do recorte, reordenação, substituição e remoção do rascunho. Cada foto tem legenda,
crédito e descrição acessível. A capa continua em 1200 × 675 WebP; a galeria mantém
a proporção, limitada a 1600 pixels por lado, sem ampliar imagens menores. Cada
arquivo preparado tem até 1 MB. O backend valida o uso (capa/galeria), as dimensões,
o formato real e remove metadados antes de gravar. Original da galeria e recorte da
capa podem ser dois arquivos técnicos, mas contam como uma foto na reportagem.

O fluxo de envio solicita uma verificação Google para o lote e envia os arquivos
sequencialmente. Confirmações parciais são preservadas se ocorrer falha. Excluir uma
foto do rascunho não exclui arquivo do GitHub. O upload real continua sem ativação:
nenhuma imagem foi enviada ao repositório nesta etapa.

O arquivo de rascunho usa `version: 3`, com `fotos` (ordem, capa, endereços e textos)
e `video`. O mínimo de uma foto é uma pendência de revisão, sem impedir guardar um
rascunho incompleto. Mais de dez fotos, duas capas, IDs repetidos e endereços
executáveis são recusados. Fotos sem envio, sem recorte da capa ou sem metadados
necessários aparecem como pendência. Fotos locais e seus bytes não são incorporados
ao download JSON: permanecem apenas nesta página até o envio. Recarregar perde os
arquivos ainda não enviados, mesmo com um JSON salvo. Salvar e retomar no servidor
continua pendente, conforme as etapas anteriores.

Vídeo: aceita um link HTTPS de vídeo YouTube, normaliza o endereço e descarta opções
de autoplay do link recebido. A prévia só carrega o player após clique, usando
youtube-nocookie.com e autoplay=0. Não recebe upload de arquivo de vídeo nem valida
disponibilidade/permissão de incorporação do vídeo; isso deve ser conferido na revisão.

Validação: 124 testes Node aprovados; duas fotos existentes do portal preparadas e
conferidas na interface, com reordenação, troca de capa e prévia do recorte e da foto
interna. Permanecem pendentes ativação do acesso, credencial GitHub, persistência de
rascunhos e geração/publicação da página final.

Referência do player: https://support.google.com/youtube/answer/171780

## Usabilidade do editor

Tela reorganizada em três etapas sem apagar campos ao navegar: **Conteúdo**,
**Fotos e vídeo** e **Revisão**. A etapa de revisão resume título, quantidade de
fotos, escolha de capa e presença de vídeo. Guardar continua atualizando a prévia;
não foi transformado em publicação ou salvamento persistente.

Acesso da equipe, retomada de registros existentes e assistência de IA ficam em
áreas expansíveis. Uma operação que pede Google abre a área de acesso. A galeria
usa cartões compactos: legenda/crédito/descrição, recorte e troca de arquivo podem
ser abertos por foto; mover e remover continuam disponíveis. Todas as ações
mantêm nomes acessíveis; campos com erro abrem a etapa e o detalhe correspondentes
antes de receber foco.

Em telas maiores, a prévia fica ao lado do formulário e acompanha a rolagem. Abaixo
de 1100 pixels fica depois do editor; há atalho para ir até ela. No celular, as fotos
e os botões se acomodam em uma coluna. Aviso de rascunho local e de perda dos arquivos
não enviados permanece visível no início; o download explica que não inclui fotos.

Conferidos no navegador: mudança de etapas, retorno ao título vazio após tentar
guardar pela revisão, retomada de registro existente, duas fotos, resumo da revisão
e atualização da prévia. Layout conferido em 1280 e 390 pixels, sem rolagem lateral
na largura menor; tamanho do navegador restaurado ao final. Os 124 testes existentes
passaram nesta etapa. As alterações continuam locais, sem publicação do painel.

## Salvamento e primeira identificação Google

Rotas privadas preparadas em `backend/lib/editorial-drafts.js`: listar, abrir e
salvar um registro por rascunho, somente após autorização de editor. Usam Redis
existente com chaves separadas por ambiente, sem publicar texto no GitHub. A ativação
exige `EDITORIAL_DRAFTS_ENABLED=true`; sem isso, não há fallback de memória que possa
ser confundido com persistência. Nenhuma gravação real foi ativada nesta etapa.

O script Redis compara atomicamente a revisão esperada antes de escrever e mantém
cinco revisões anteriores. Revisão antiga recebe 409, sem sobrescrever a atual.
Há limite de 50 rascunhos, até 128 KB de dados por registro; arquivos de foto ficam
fora do JSON. Não há expiração automática dos rascunhos. A persistência e o script
Lua ainda precisam ser conferidos no serviço real antes de habilitar o salvamento.
Os testes de retorno/conflito usam armazenamento simulado e não substituem essa
validação de integração. O histórico não possui interface de restauração nesta versão.

No painel, `Salvar no painel` é distinto de guardar na página e baixar JSON.
Rascunhos remotos aparecem em área própria; abrir exige guardar a edição local e
adiciona o registro à lista da página. O envio aguarda confirmação de revisão do
servidor; erros e mudanças concorrentes não apagam o texto da página. Não existe
salvamento automático ou persistência de dados no navegador.

Em 6 de novembro de 2026 o ID público Google foi cadastrado em Production na Vercel,
como Config `EDITORIAL_GOOGLE_CLIENT_ID`. Nenhuma lista de editores, segredo GitHub
ou flag de salvamento foi cadastrada. O novo deploy precisa incorporar essa variável.

`GET /api/editorial/identidade` valida o ID token e devolve somente a própria
identidade com papel `pending`; não cadastra nem autoriza uma conta. A tela usa esse
retorno quando a conta ainda não pode acessar `/me`. O identificador confirmado
permite preparar a autorização individual do professor, após a revisão dele.

Validação de preparação: 132 testes Node e três testes Python aprovados, navegação
existente conferida. Implantação de código e validação da conta real são os próximos
passos; operações de escrita continuam fechadas enquanto não forem configuradas.

Referência de operação atômica: https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval

## Implantação e conta confirmada — 6 de novembro de 2026

- API implantada a partir de `defc64c27fc38b9357cba96355668313473b1772`, deployment
  Vercel `57vcmQerTkWq9NmfC3m7VjMnzGy7`, promovido ao domínio oficial após conferir
  a saúde da versão protegida. CI GitHub `42277227633` concluído com sucesso.
- Frontend: somente os 13 arquivos de `painel/` foram adicionados ao master,
  commit `db1cf2b16f782e9dce4515207884ada3a6d10e7d`. GitHub Pages `42277662367`
  concluído com sucesso; todos os 13 arquivos publicados conferidos contra a versão
  local, normalizando apenas finais de linha. As demais páginas não foram alteradas.
- Referência de retorno do frontend preservada em
  `codex/backup-antes-editorial-20261106` (master anterior `eb3de2a`).
- Endereço disponível: https://fabcampo.com.br/painel/index.html . Sem inclusão na
  navegação principal ou no sitemap; esse detalhe não constitui proteção de acesso.
  Campos e prévia local são acessíveis; operações no servidor continuam protegidas.
- API oficial conferida: health 200, IA configurada, Upstash e limites 30/IP/min,
  15 globais/min e 200/dia; identidade sem token 401; `/me` e rascunhos 503;
  diagnóstico 404.
- A conta indicada pelo professor foi confirmada pelo fluxo real Google no painel,
  com papel pendente. O identificador estável foi usado apenas para preparar a
  configuração no console; não foi registrado em arquivos do repositório.
- Preparados, mas **não salvos**, no formulário de variáveis Production da Vercel:
  `EDITORIAL_GOOGLE_SUBJECTS` somente com a identidade confirmada do professor e
  `EDITORIAL_DRAFTS_ENABLED=true`. A aplicação depende de confirmação do professor
  por conceder acesso de editor. Depois será necessário novo deploy e teste real de
  persistência/conflito. A flag de salvamento segue desativada no ambiente publicado.
- Nenhuma credencial GitHub de escrita foi criada; upload, IA editorial e publicação
  de matérias não foram usados nessa conferência. Publicar continua indisponível.

O estado desta seção substitui as anotações anteriores que diziam que todo o painel
permanecia local. Persistência e autorização continuam pendentes conforme descrito.

## Autorização recebida e implantação aguardando MFA

O professor autorizou explicitamente sua conta como único editor e o salvamento
privado. `EDITORIAL_GOOGLE_SUBJECTS` e `EDITORIAL_DRAFTS_ENABLED=true` foram salvos
em Production na Vercel, sem credenciais ou identificadores registrados no código.
A Vercel confirmou o cadastro das duas variáveis.

Foi solicitado redeploy do código atual de main com as configurações aprovadas.
Antes de concluir, a Vercel abriu `Verify Your Identity`, pedindo o código do
aplicativo autenticador. A etapa foi entregue ao professor para preenchimento direto;
nenhum código foi solicitado na conversa ou inserido pelo assistente. A nova
implantação e sua promoção ainda não foram confirmadas. O teste real de persistência
e conflito continua pendente até essa confirmação de identidade.

## Ativação aprovada e ajuste de entrada por operação

A confirmação MFA foi concluída pelo professor. Redeploy Vercel
`DHEdf7HRS9r1ix3gZnm5TpSKvF6s` foi promovido com as duas configurações aprovadas;
API saudável e rotas de editor retornando 401 sem autenticação, conforme esperado.
O teste real de rascunho começou com um registro já existente no portal, sem
publicação. Não houve confirmação de persistência ainda nesta verificação.

Foi identificado que a tela reinicializava o SDK Google a cada ação. O login passa
a inicializar uma vez por ciclo da página, e o acesso de editor pode permanecer
somente em memória por até dez minutos, limitado também pela expiração Google
confirmada pelo servidor. Sair ou deixar a página limpa essa credencial. Não há
localStorage, sessionStorage ou cookie de sessão. Cada requisição continua exigindo
verificação Google e autorização no backend. Essa sessão é apenas para a equipe;
as atividades dos estudantes não foram modificadas.

Ajuste validado com 134 testes Node, incluindo expiração e limpeza. O teste real de
salvar, reabrir e recusar revisão antiga continua em andamento após implantar esse
ajuste de acesso. As revisões reais confirmadas devem ser registradas na próxima
atualização deste documento.

## Ajuste de acesso publicado; entrada do professor pendente

API do ajuste: `ec971cf8b2a7877a301d906e5f61abe78c984a7d`, deployment pronto
`2RWsFuvjv9bEUjY3G1MeR7ya7fJK`, com promoção solicitada para o domínio oficial.
Frontend: `91a0dcbfcd5b05b0c1311cd8150bb00348d83616`. Validação GitHub
`42279366062` e GitHub Pages `42279382275` concluídos com sucesso; novo `login.js`
conferido no endereço público. Autorização individual e flag privada foram mantidas.

A página oficial foi recarregada, e o botão Google reconhece a conta do professor.
A automação não conseguiu concluir o novo clique no botão incorporado: a tentativa
por coordenadas foi recusada pelo controle do navegador por não conseguir inspecionar
com segurança as coordenadas do iframe. A aba foi entregue ao professor para clicar
diretamente; não houve tentativa de contornar esse bloqueio nem de ler tokens da página.

Ainda não há confirmação de rascunho salvo no Redis. Não informar salvamento real,
retomada ou proteção de conflito como validados até concluir a entrada e conferir
essas operações pela interface. Nenhuma matéria ou foto foi publicada nessa etapa.

## Primeiro salvamento real confirmado

Após o professor concluir a entrada no Google, a interface exibiu `Conta conferida`
com a conta autorizada. Foi selecionado o primeiro registro já existente no portal
e salvo como rascunho privado. O servidor confirmou na tela:
`Rascunho salvo no painel — revisão 1. Nenhuma publicação foi feita.`
Isso confirma a primeira gravação real pelo script Redis; não confirma ainda a
retomada, a recusa de edição antiga ou a retenção de cinco revisões.

Na retomada algumas horas depois, a versão oficial da API foi conferida na Vercel:
`2RWsFuvjv9bEUjY3G1MeR7ya7fJK` / `ec971cf`, pronta e associada ao domínio oficial.
O acesso em memória da página havia expirado. A busca de rascunhos solicitou nova
entrada Google, e essa etapa foi entregue ao professor. A recuperação da lista e o
teste de conflito continuam pendentes; não recriar o mesmo rascunho para mascarar
uma falha de retomada.

Os avisos da interface foram corrigidos para distinguir `Guardar e atualizar prévia`
(somente a página), `Salvar no painel` (aguardar confirmação de revisão) e download
JSON. Removidas mensagens iniciais que diziam que o salvamento ainda estava em
preparação, pois a função já foi ativada. Fotos ainda não enviadas continuam locais.

## Retomada e conflito conferidos no serviço real

Após nova entrada do professor, a listagem privada recuperou o mesmo rascunho como
revisão 1. O registro foi aberto pelo painel, incluindo título, resumo, fonte e data
existentes. Uma segunda cópia de edição da revisão 1 foi aberta para testar conflito.

Essa segunda cópia foi salva e o servidor confirmou revisão 2. Ao tentar salvar a
primeira cópia, que ainda esperava revisão 1, o painel exibiu:
`Existe uma versão mais recente. Seu texto foi preservado: baixe-o antes de abrir a versão do painel.`
Nova busca no servidor manteve revisão 2; essa revisão foi aberta novamente e ficou
selecionada na tela. Portanto foram confirmados em produção: gravação, recuperação,
incremento de revisão, recusa de versão antiga e preservação da versão mais recente.
O limite de cinco revisões anteriores ainda não foi exercitado com seis salvamentos.

O teste usou somente o primeiro registro já existente no portal, copiado para um
único rascunho privado. As cópias abertas durante a conferência são entradas locais
temporárias, não rascunhos duplicados no servidor. Nenhuma matéria, foto ou vídeo
foi publicado, e nenhuma sugestão Gemini foi solicitada nesse teste.

Permanecem pendentes a credencial de escrita GitHub e a branch de imagens, envio
real das fotos, geração da página pública e seu fluxo final de publicação/reversão.
A revisão de fontes, fatos e imagens continua com o professor e a equipe autorizada.

## Avisos de salvamento publicados e conferidos

A atualização dos dois arquivos de orientação (`b14a15b`) teve build aprovado, mas
o deployment GitHub Pages `42323992809` encerrou com `Timeout reached, aborting!`.
A tentativa de ler logs com a credencial Git foi bloqueada pela revisão automática
por não haver autorização específica para esse uso; nenhum token foi obtido ou
reaproveitado. A conferência prosseguiu pelos estados e anotações públicos, que
informaram o timeout. Não repetir a sondagem de credenciais.

Foi feita uma única nova tentativa, sem mudar conteúdo: master
`64babcaad6f1888c8dc56ed77a640676b8eb43f4`, GitHub Pages `42325005278`, concluído
com sucesso. Todos os 14 arquivos de `painel/` no domínio oficial foram comparados
à versão local, normalizando somente finais de linha: nenhuma divergência.

Estado entregue: rascunho privado aberto na revisão 2, salvamento/retomada e conflito
conferidos no Redis real. Nenhuma publicação editorial ou upload de foto foi feito.
Os avisos atualizados aparecem ao recarregar a página; uma aba antiga pode manter
os textos anteriores até recarregar. Recarregar também limpa a sessão em memória;
os rascunhos confirmados no servidor permanecem recuperáveis após nova entrada.

## Ativação do envio de imagens — 07/11/2026

A credencial fina `FabCampo - Upload de imagens` foi criada após autorização
explícita: apenas o repositório `paulocunha1009/fabcampo`, Contents leitura/escrita,
Metadata leitura, nenhuma permissão de conta, expiração em 07/12/2026.
Foi armazenada como Secret de Production `EDITORIAL_GITHUB_TOKEN` na Vercel.
Nenhum valor de credencial foi escrito nos arquivos do projeto.
`EDITORIAL_UPLOAD_BRANCH=editorial-rascunhos` foi salvo como Config de Production.

A branch de imagens foi preparada em `fba6b2b`, com README e configuração que
impede builds Vercel dessa branch. Não mesclar essa branch inteira em main/master.
O backend limita o uso da credencial a imagens WebP em `img/editorial/` nessa
branch; a credencial GitHub em si concede escrita em conteúdo do repositório.

Redeploy `54cKdFDWqEVYLGFm7msxSAJnHBCJ`, fonte main `a506d75`, build Ready,
promovido com sucesso ao domínio `fabcampo-api.vercel.app`.
Foto pública existente `img/galeria/educacao-escola.jpg` foi preparada no painel
como uma foto e capa. O envio real aguarda nova entrada Google do professor;
nenhum upload está confirmado ainda. Não afirmar validação ponta a ponta.
A prévia de fotos retomadas precisa também conferir os caminhos da branch de
rascunhos, pois eles ainda não existem no domínio público até a publicação.

## Upload real confirmado e prévia corrigida — 07/11/2026

Após a entrada Google, o painel confirmou o envio da foto existente de Educação.
A API pública GitHub confirmou dois arquivos na branch `editorial-rascunhos`:
- `ca46a51d77422ab4845de9866bd1c7e6a668a3136f5bd321227a17c00984a2f5.webp`:
  1600 × 1200, 247172 bytes, foto interna.
- `f5a3d83231aa59acf35de4412c10cefc13054df5a36919de0d4e0cecb6c8b8ef.webp`:
  1200 × 675, 122792 bytes, capa.
Os downloads públicos foram inspecionados com Sharp: WebP, EXIF e XMP ausentes.
O painel confirmou salvamento privado na revisão 3. A foto de teste já era pública;
nenhum texto novo foi inventado e nenhuma reportagem foi publicada.

Corrigida a resolução de imagens editoriais na prévia e no link de referência:
endereços canônicos continuam no rascunho, mas a prévia do painel busca hashes
editoriais na branch de preparação. Fotos antigas mantêm endereços do portal.
Master `be5044ab7d17a3c5961186bea07a14a8ebd438f0`, Pages `42384949285` success.
Os três arquivos publicados foram comparados com os locais: idênticos após
normalizar finais de linha. 41 testes editoriais passaram; a primeira execução
teve acesso localhost bloqueado pelo sandbox, e a execução autorizada passou.
A retomada visual em uma sessão nova ainda precisa ser conferida; o login atual
expirou durante a conferência. Não há perda do salvamento já confirmado.

## Retomada visual confirmada — 07/11/2026

Em uma sessão nova da página oficial, após entrada Google, a listagem retornou o
rascunho único na revisão 3. O registro foi aberto e a galeria e prévia carregaram
as imagens diretamente da branch de preparação: foto interna 1600 × 1200 e capa
1200 × 675, ambas com `complete=true` e dimensões naturais positivas no DOM.
Não foi preciso selecionar novamente arquivos locais. O título e resumo foram
recuperados. Nenhuma revisão adicional, alteração editorial ou publicação ocorreu.
Evidência local: `tmp/validacao/retomada-revisao3-fotos-confirmadas.png`.
Próxima etapa: testar sugestões Gemini com texto real conferido; o rascunho atual
continua sem texto completo, local e metadados editoriais das fotos, portanto não
está pronto para publicação.

## Teste Gemini e correção por seleção de trechos — 07/11/2026

O teste real usou os seis parágrafos já públicos de `.pilar-card__desc` da
reportagem Educação. Foram colocados somente na edição local, sem salvar nova
revisão nem publicar. A primeira chamada retornou 502. Diagnóstico seguro foi
implantado (7c662aa; deployment a3bv4Q4dEznsixLTpdSJngJWvDd6 promovido):
`phase: validation, status: null`. A resposta Gemini foi recebida, mas recusada
pela validação de trechos. Não registrar texto da reportagem, resposta ou tokens.

A correção cf2a9c7 passa ao Gemini trechos originais numerados e pede IDs. O
servidor resolve os IDs para o texto original e mantém a validação de extração.
IDs inválidos são rejeitados e a revisão humana permanece obrigatória.
136 testes Node passaram. A validação real dessa correção ainda está em andamento.

Teste real concluído: ded4d90 / deployment EgUG9xL8tcDTMi72vsp3yAK2rS1F
promovido ao domínio oficial. Seleção por IDs isolada ainda teve falha de validação;
a resposta estruturada obrigatória (`responseJsonSchema`) resolveu a chamada real.
O painel exibiu resumo e três cards; os quatro trechos foram comparados com o
texto de entrada e são literais. Os títulos continuam sujeitos à revisão humana.
Não foi clicado Usar sugestões, não foi salva uma nova revisão e nada foi publicado.
A revisão privada 3 continua intacta; texto de teste e sugestões estão só na aba.
Evidência: `tmp/validacao/gemini-cards-confirmados.png`.
Referência técnica: https://ai.google.dev/gemini-api/docs/structured-output
Próxima etapa: construir a página final da reportagem conforme os modelos existentes,
antes de habilitar publicação/atualização/reversão com acesso autorizado.

## Pesquisa original → reportagem completa — 07/11/2026

Pedido do professor: a IA deve estruturar a reportagem inteira a partir da pesquisa
do aluno, sem criar fatos externos, e conservar a pesquisa para comparação.
Implementação main dd0215b, frontend master 1aae6f6. Backend deployment
9yy13izLvKxbioyUjYqgKcvLA4H3 Ready e promoção solicitada no domínio oficial.

Novo campo privado `pesquisa` (até 12.000 caracteres), subtítulo, botão Organizar
pesquisa em reportagem e proposta separada com título, subtítulo, abertura, até
três seções com intertítulos, cards de trechos e lacunas. Cada parte mostra os
trechos originais associados. IDs são validados pelo servidor, e números e falas
entre aspas ausentes na pesquisa são recusados. Isso não comprova semanticamente
nomes, atribuições, relações ou toda paráfrase: revisão humana continua necessária.
O prompt exige preservar incerteza/atribuição e não completar dados ausentes.

Nova rota autenticada `/api/editorial/reportagem`: autorização antes de leitura,
limite JSON 64 KB, mesma cota SabIA/Gemini e orçamento de 1000 tokens, JSON Schema,
nenhum texto de pesquisa/resposta em logs. Sem busca ou ferramentas externas.
A pesquisa é enviada ao Gemini somente ao solicitar a proposta. Não publicar
`pesquisa` em futuras páginas públicas; ela pertence ao rascunho privado e ao
arquivo de edição baixado pela equipe.

Usar reportagem no rascunho altera somente a edição local: título, subtítulo,
resumo, texto com intertítulos ## e cards. Não altera pesquisa, data, local, fonte,
fotos ou vídeo. Salvar no painel continua sendo uma ação separada com revisão.
Mudanças na pesquisa ou edição invalidam a proposta; trocar registro/sair cancela
requisições em andamento. Cards continuam editáveis. Pesquisa/subtítulo são
preservados pelo validador local e pela lista permitida do armazenamento privado.

140 testes completos passaram antes da implantação; os seis testes específicos
atuais também passaram, incluindo duas verificações da UI para aplicação explícita,
preservação do original, edição durante geração e saída da conta. Prévia local
conferida no navegador. Teste real de geração completa e persistência real dos
novos campos ainda pendente; aguardar publicação Pages e nova entrada Google.

Publicação concluída: GitHub Pages 42386785989 success; os seis arquivos frontend
foram comparados ao domínio oficial sem divergências. CI main 42386781804 success.
Nova aba pública 21 preparada com os mesmos seis parágrafos públicos de Educação
usados no teste anterior. Nenhum texto novo foi inventado. Geração completa aguarda
clique Google do professor nessa aba. Pesquisa ainda é edição local, sem nova
revisão privada. A revisão 3 e a aba anterior não foram alteradas nesta conferência.

## Geração completa e recuperação real confirmadas — 07/11/2026

Após login na aba 21, Gemini gerou título, subtítulo, abertura, três seções e três
cards usando os seis parágrafos públicos da reportagem Educação. Os apoios de cada
parte foram abertos para comparação. O modelo não apontou lacunas; a interface
explica que isso não substitui conferência humana. O material de teste é conceitual,
sem entrevista/evento novo, e não estabelece local ou data de nova apuração.

A proposta foi aplicada à edição de teste, mantendo `pesquisa` byte a byte no DOM.
Fonte/autoria foi registrada como nos créditos da página existente, com link para
`pages/reportagem-educacao.html`. Novo rascunho privado salvo e reaberto: título
`Escola do Campo: Conectada à Cultura e à Vida da Comunidade`, revisão 1. A pesquisa
recuperada do servidor é idêntica à original; subtítulo, texto com intertítulos e
cards também aparecem após a retomada. A revisão 3 do primeiro rascunho com foto
permanece separada. Agora há dois rascunhos privados, nenhum publicado.
Evidências: `tmp/validacao/reportagem-completa-proposta.png` e
`tmp/validacao/reportagem-completa-salva.png`.

## Importação de pesquisa PDF/Markdown — 07/11/2026

Pedido autorizado: importar pesquisa completa como referência e esclarecer o limite
diário de reportagens. Implementação main 13da100; frontend 727985e seguido de
e03a907 (orientação de limites da extração). Backend DeZbPWGRSz1VYjBgAQ4DCJRYEPDJ
Ready e promoção solicitada. CI main 42388840999 success. Pages final 42388966743
success; sete arquivos publicados foram comparados aos locais, sem divergências.

Importação é leitura LOCAL no navegador: PDF.js 6.5.438 oficial npm, distribuído no
próprio portal com worker, cmaps, fontes e licenças. O binário original não é enviado
nem guardado no portal/GitHub/Redis. Texto e metadados de referência podem ser salvos
no rascunho privado. Gemini recebe somente o texto conferido ao solicitar geração.
Não prometer armazenamento do PDF original ou OCR implementado.

Limites: um PDF/MD/Markdown, até 5 MB, PDF até 50 páginas, texto até 40.000 caracteres
e 96 KB UTF-8, além das anotações manuais de até 12.000. Markdown UTF-8 é literal,
sem executar HTML nem seguir links; quebras CRLF são normalizadas para LF.
PDF só usa texto extraível: sem interpretar gráficos, imagens ou manuscritos.
Se alguma página não tiver texto, exceder páginas/caracteres ou falhar, recusar
sem incorporar conteúdo parcial. PDF com senha tem mensagem própria. Não cortar
pesquisa silenciosamente. Extração sempre exige conferência explícita do texto.

Nova propriedade privada `pesquisaArquivo`: nome, tipo, paginas, texto, conferido.
Ela participa do snapshot da proposta, cancela geração atrasada ao mudar e é
preservada no validador/editor/arquivo de edição/Redis. Rascunhos agora até 256 KB,
POST 320 KB; geração até 160 KB JSON. Toda a referência validada segue na chamada
única ao Gemini (não há leitura remota de links nem chamadas ocultas por página).
Permanece versão concisa de até 250 palavras / orçamento 1000 tokens de saída.

146 testes completos passaram. Quatro testes específicos passaram após ajustar
orientações/UTF-8. PDF real FabCampo_Fase0 foi importado no domínio oficial:
2 páginas / 4661 caracteres. Seu conteúdo foi tratado como dados de teste, jamais
instruções do usuário. Markdown criado do artigo público Educação: 23947 caracteres
após normalizar quebras de linha, comparado ao arquivo fonte sem perda de conteúdo.
No portal oficial, o Markdown está importado e conferido na aba 23; geração com
arquivo completo aguarda nova entrada Google. Ainda não há salvamento real do novo
campo `pesquisaArquivo` nem geração autenticada com arquivo confirmados.

Limites REAIS consultados em /health: Upstash persistente, 200 solicitações/dia,
15 globais/minuto, 30/IP/minuto; modelo gemini-2.5-flash-lite. Uma geração/refação
consome uma chamada; importar, ler e conferir arquivo não chama Gemini. SabIA e
cards disputam a mesma cota de 200. Até 200 gerações/dia é apenas teto teórico se
não houver outros usos/refações/falhas/cotas do provedor, não 200 reportagens
aprovadas. Com duas gerações por matéria seriam no máximo 100 antes dos demais
usos. O armazenamento tem limite separado de 50 rascunhos privados no total.
A cota diária usa bucket UTC e renova às 21h de Fortaleza; o limite não garante
qualidade editorial, que depende de pesquisa, evidências e revisão humana.
Evidências: tmp/validacao/importacao-pdf-oficial.png,
importacao-oficial-aguardando-google.png e importacao-pesquisa-markdown.png.

## Incidente de inicialização e restauração — 07/11/2026

A implantação 13da100 estava Ready, mas a função falhava ao iniciar: a importação
nomeada de ../../painel/pesquisa-core.js não expunha o export na raiz de execução
ESM da Vercel. /health e preflight /api/editorial/me retornaram 500. A conferência
anterior de Ready e frontend foi insuficiente: não considerar serviço validado sem
/health JSON ok e operação protegida real. O erro foi informado ao professor.

Correção ebd91c77f82e36f37f4c8a97b81b70c33bed52c1: validação do servidor movida
para backend/lib/editorial-research-file.js; report e drafts importam módulo local.
146 testes passaram. Deployment 92dbo9Vaq6oCtMz7Cgtd6kjiAdqU, domínio
fabcampo-hl7bwq4pn-sidep-ce.vercel.app, /health JSON ok conferido com sessão Vercel
ANTES de promover. Após promoção, /health oficial HTTP 200 application/json, ok true,
Upstash e limites 200/dia/15 global/min/30IP/min conferidos por shell e navegador.
Teste de regressão adicional importa report/drafts com somente arquivos do backend
em diretório temporário isolado, sem painel: passou. Não repetir a dependência de
módulos frontend .js sem fronteira ESM explícita na implantação.

A aba 23 agora contém arquivo escolhido pelo usuário, `AMC — Aula 3 Estudo
Aplicado — Armazenamento e Mapa da Placa-mãe do AgroVida.md`, 21.356 caracteres,
não o Markdown Educação de teste. Não substituir a seleção nem marcar conferência
por ele. Texto foi preservado. Ele precisa conferir o texto, marcar confirmação,
solicitar geração e fazer login de novo; a tentativa anterior ocorreu durante 500.
Geração com arquivo e salvamento real de pesquisaArquivo continuam pendentes.
Evidência: tmp/validacao/api-restaurada-pesquisa.png.

## Importação, geração e retomada reais concluídas — 07/11/2026

O login foi validado. A confirmação da referência estava desmarcada; após conferir
texto Markdown legível, foi marcada e a geração solicitada com os 21.356 caracteres.
A primeira proposta interpretou o plano de aula como execução passada. Ela foi
DESCARTADA sem aplicar/salvar. O problema foi informado ao professor.

Correção c5d2bdf031773dbcfc7f2891384366eda316b5aa: prompt distingue planos,
roteiros, exemplos/simulações de fatos apurados; sinais de plano geram
`tipoMaterial=planejamento`. Título e abertura precisam identificar proposta/plano,
e verbos de execução passada conhecidos são recusados nesse caso. Trata-se de
proteção adicional conservadora, não prova semântica universal: revisão continua
obrigatória. 148 testes passaram, incluindo regressão de plano vs execução.
Deployment 2KiMyDBTCeZrvehyEuri8DAgcWVJ / fabcampo-n4czc5vos-sidep-ce.vercel.app
teve /health JSON ok ANTES de promover. Depois da promoção, geração autenticada,
salvamento e recuperação confirmaram operação do domínio oficial.

Segunda proposta reconheceu `Plano de Aula: Missão Técnico do AgroVida -
Armazenamento e Placa-mãe`, com abertura de proposta e atividades previstas.
Foi aplicada ao rascunho privado com fonte `AMC — Aula 3: Estudo Aplicado — AgroVida
(documento de referência)`, sem preencher local, data, fotos ou URL desconhecidos.
Salvamento confirmado revisão 1. Após nova busca e abertura do servidor, o texto
extraído recuperado foi comparado à referência anterior: 21.356 caracteres,
igualdade integral. Texto/subtítulo/cards também retomados.
Agora são três rascunhos privados separados, nenhum publicado. O arquivo binário
original continua só no computador; não foi enviado ao GitHub nem armazenado.
Evidências: tmp/validacao/proposta-arquivo-plano-aula.png e
arquivo-pesquisa-salvo-recuperado.png. Importação/geração/persistência real concluídas.
Limites de uso continuam 200 chamadas/dia compartilhadas e 15 globais/minuto;
nenhuma mudança de cota foi feita. Não confundir chamadas com matérias aprovadas.

## Prévia da página completa no padrão do portal — 07/11/2026

Concluída a etapa da página completa para conferência, antes de habilitar publicação.
Botão `Conferir página completa da reportagem` abre dialog com iframe sandbox
sem allow-same-origin, conteúdo somente em memória e opções Computador/Celular.
Não usa URL/query com dados privados, nem faz salvamento/publicação ao abrir.
Fecha limpando srcdoc e devolvendo foco ao botão. Usa edição atual validada.

Renderizador puro ESM em backend/lib/editorial-page.mjs, com dependência local
editorial-chrome.mjs. Cabeçalho e rodapé derivados da reportagem Educação por
tools/sync-editorial-chrome.mjs, com link de privacidade explícito. Não foi importado
no servidor nem alterada a API; backend oficial continua c5d2bdf. A base do futuro
publicador poderá usar esse mesmo renderizador, mas validação/publicação seguem
pendentes. A página gerada é estática com título/subtítulo, capa e metadados
informados, intertítulos, cards, galeria de até dez fotos incluindo a capa, vídeo
YouTube carregado só por clique, fontes, navegação lateral e rodapé.

Lista permitida explícita exclui pesquisa, pesquisaArquivo e credenciais. Texto
escapado; URLs verificadas; data ausente não recebe data atual; preview usa branch
editorial-rascunhos para hashes de fotos, versão pública usa domínio oficial.
Nenhuma matéria pública criada. O iframe tem aviso privado/noindex e a URL do
painel continua a mesma. Privacidade aqui é isolamento em memória, não publicação.

A conferência encontrou CSS geral ocultando fotos de hero: correção específica
com editorial-hero--foto. Links # de srcdoc agora são interceptados para rolar e
focar o intertítulo sem navegar para o painel dentro do iframe. Recursos da prévia
têm versão de cache para carregar correções. Menu móvel e alto contraste reutilizam
os módulos do portal; não se carregam chat/analytics na prévia.

Master final c446128, Pages 42429243831 success. Cinco arquivos publicados foram
comparados aos locais, normalizando LF: todos correspondem. 153 testes completos
passaram. Navegador: modal oficial em 1212 px sem overflow; modo Celular com área
útil 375 px e scrollWidth 375; Menu abriu; link interno focou intertítulo e manteve
URL about:srcdoc. Capa real do portal conferida no modelo local. Fixtures usam só
textos/foto existentes de Educação, não relatos inventados. Nenhum novo rascunho
privado salvo nessa etapa, nenhuma chamada Gemini feita.
Evidências: tmp/validacao/pagina-completa-painel-celular.png e
pagina-completa-com-capa.png. Próxima etapa: fluxo autenticado de publicação,
atualização e retirada/reversão, com validação editorial e transação Git segura.

## Publicação autorizada preparada, envio ainda desativado — 08/11/2026

Implementado fluxo de preparação/confirmar/conferir para reportagens. Backend
fe228ad543638abc5130bbc79e93594f635db49c, deployment
HwGFWvR1ThatgWT5tNxDuSXSHrjN / fabcampo-1nwg72hsi-sidep-ce.vercel.app,
/health JSON ok conferido antes de promover. Oficial /health 200; POST preparar
sem login 401. CI main 42444135519 success. Frontend final master
4a84109ffc32098fe34ab29a14e5ee167c786ffe, Pages 42444319852 success; index,
publicacao.js e rascunhos.js publicados correspondem aos locais.

Rotas protegidas: POST /api/editorial/publicacoes/preparar, POST .../confirmar,
GET .../:id. Usa revisão confirmada no Redis, nunca conteúdo avulso enviado pelo
cliente. Exige título/resumo/texto/local/fonte, categoria/modelo válidos, uma a dez
fotos hash WebP, uma capa 1200x675, legendas/créditos/alt e vídeo/data válidos se
informados. Foto é conferida por hash SHA256, dimensões e ausência de EXIF/XMP.
Pesquisa original/arquivo são excluídos por lista permitida.

Preparar faz somente leituras: revisão, master, site.json, busca.json, sitemap,
manifesto opcional e fotos pinadas no commit da branch editorial-rascunhos.
Confirmar fica fechado se EDITORIAL_PUBLISH_ENABLED não for exatamente true.
Com liberação, gera blobs, árvore e commit com master como pai e atualiza referência
sem force. Operação altera somente página gerenciada pelo UUID, fotos verificadas,
notícias, busca, sitemap e manifesto público sem dados privados. Nunca mesclar
main/master ou a branch de fotos inteira. Conflitos de revisão/master/fotos ou
edições manuais da página são recusados. Reenvio com mesmo conteúdo/revisão é
reutilizado sem nova transação. Página inclui canonical e Open Graph da capa.

Envio Git não significa página ativa: conferência compara hash HTML no domínio e
hash da notícia correta; só então retorna publicada. Atualizações fora de master
ou demora do Pages permanecem aguardando. Retirada/reversão pela interface ainda
não foi implementada; histórico Git e recuperação manual existentes continuam.
Não afirmar transação real GitHub validada: até aqui só simulação, nenhuma matéria
foi publicada nem qualquer mutação GitHub foi feita pelo novo serviço.

Cliente guarda vínculo id/revisão/snapshot só depois da confirmação do salvamento
ou abertura remota. Edição local invalida plano/checkbox. Preparação apresenta
revisão, título, fotos e criar/atualizar. Envio exige conferência explícita e flag
ativa retornada pelo servidor. Autenticação Google é checada em todas as rotas.
Rascunhos importados usam a mesma instância versionada do módulo, evitando duplicar
handlers. Mensagem de conta conferida passou a orientar a revisão salva.

162 testes completos passaram, incluindo concorrência sem force, idempotência,
exclusão de pesquisa, preservação de notícias/eventos/busca/sitemap manuais, flag
fechada, rota sem login, plano invalidado por edição e início ESM isolado.
UI oficial conferida: envio desabilitado e exigência de revisão salva. Não foi
preparada publicação real de rascunho: os testes salvos não estão completos para
publicação; não preencher créditos/local/fatos inventados para contornar validação.

Vercel foi consultada: EDITORIAL_PUBLISH_ENABLED inexistente (No Results Found).
Formulário concreto preparado em Production, Config, chave
EDITORIAL_PUBLISH_ENABLED, valor true — NÃO SALVO. Antes de salvar/ativar, pedir
confirmação em tempo de ação, pois amplia uso da credencial de upload de fotos para
alterar conteúdo público do portal. Conta autorizada continua somente
paulo.cunha1@prof.ce.gov.br. Nenhuma credencial nova ou permissão GitHub foi criada.
A aprovação deve liberar a função, sem publicar automaticamente rascunhos de teste.
Evidência: tmp/validacao/publicacao-liberacao-proposta.png.
Referências técnicas GitHub: https://docs.github.com/en/rest/git/trees e
https://docs.github.com/en/rest/git/commits?apiVersion=2022-11-28 .

## Publicação ativa e primeira matéria conferida — 10/11/2026

A atualização abaixo substitui o estado de envio desativado descrito em 08/11.
O professor autorizou explicitamente a ativação, o Redeploy e a promoção.
EDITORIAL_PUBLISH_ENABLED=true foi salvo em Production. Deployment
5So4tCAWcwcHVNTiPWu9bDcQva7d, fonte fe228ad, promovido ao domínio oficial.
Saúde confirmada antes e depois; preparar sem autenticação continuou respondendo 401.

A primeira matéria real foi publicada com autorização editorial explícita:
Educação do Campo: escola, cultura e participação da comunidade, revisão 6.
Página: pages/reportagem-8273baca-bf99-4537-8af1-6d69689e46f3.html.
Foto creditada a Paulo H. Cordeiro — professor; local Lagoa do Mineiro e data
01/11/2026 confirmados na autorização. A pesquisa original permanece privada.
Commit público 2719b76fb3a63d97029272ea2b893e22cbf6227f; Pages 42914441269 success.
O painel confirmou os hashes da página e da notícia; a página pública foi aberta.
Isso valida uma transação real de criação pelo serviço. Atualização e retirada
não foram exercitadas com essa matéria; retirada/reversão pela interface segue pendente.

A prévia em branco foi corrigida ao abrir o dialog antes de atribuir srcdoc.
Master 0599629; conferidos computador, reabertura e celular com largura útil 375px
sem overflow. Revisão 6 foi recuperada do servidor e visualizada com a capa.
Campos restaurados pelo navegador chegaram inconsistentes em uma sessão nova;
a recuperação remota restaurou os valores corretos, sem salvar os campos incorretos.

Mensagens iniciais do painel foram atualizadas para explicar salvar, revisar,
enviar e conferir o site, removendo avisos antigos de implantação pendente.
