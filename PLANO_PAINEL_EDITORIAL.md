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
