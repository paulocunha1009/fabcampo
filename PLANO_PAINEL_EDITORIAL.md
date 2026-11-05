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

## Decisão necessária para o fluxo

A pergunta enviada ao professor é quem poderá publicar:

1. Somente professor e equipe autorizada.
2. Alunos preparam rascunhos; professor revisa e publica.

Essa resposta define os papéis e se haverá acesso separado a rascunhos. Nome
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

Este documento registra o levantamento e as decisões pendentes. O painel ainda
não foi implementado nem disponibilizado para edição pública.
