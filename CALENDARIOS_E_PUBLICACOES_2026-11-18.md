# Calendário escolar e publicações programadas — 18/11/2026

## Separação dos usos

- Agenda pública: somente eventos escolares já publicados, conforme `data/eventos-escola.json`.
- Google Agenda: assinatura iCal da agenda pública, pelo endereço `https://fabcampo-api.vercel.app/api/agenda-escola.ics`. A conta assinante vê uma agenda separada em Outras agendas. Ela não é uma agenda Google com edição independente: alterações devem ser feitas pelo painel do portal. O Google controla a frequência de consulta; não há garantia de atualização instantânea. Assinatura, não importação de um arquivo isolado.
- Publicações: datas privadas de envio ao portal para reportagens e eventos. Não criam compromissos no Google. A data do evento e a data da reportagem permanecem campos distintos do agendamento de envio.
- Menu: programação existente da Caravana mantida, sem mudar a data previamente aprovada.

## Calendário visual

Componente próprio do portal, com meses, seleção de dia, indicação de registros e navegação por setas no teclado. Identidade verde/creme/dourado, com paleta escura própria. Substitui o iframe de feriados nacionais. A agenda pública conserva a lista detalhada e a opção Mostrar todos os eventos.

## Execução no servidor

`/api/editorial/programacoes`: somente contas com permissão de publicar. Salva o identificador, tipo e revisão aprovada, data/hora de Fortaleza, identidade do editor e estado. Redis privado, separado dos rascunhos e dos agendamentos do menu. Cancelar não retira conteúdos já publicados e não apaga rascunhos.

O workflow de `main` consulta pendências a cada cinco minutos. O GitHub pode atrasar execuções. Não promete precisão de minuto nem dispensa conferir a confirmação no site. O endpoint só aceita identidade OIDC temporária assinada pelo GitHub, com emissor, audiência, repositório, branch e arquivo de workflow exatos. Não usa token permanente no frontend.

Antes de enviar, o executor reavalia a permissão do editor, a revisão e a lixeira. Alterações exigem nova revisão e novo agendamento. Uma trava evita execução concorrente. Operações já enviadas são conferidas pela revisão pública antes de repetir. Falhas transitórias têm até três tentativas; conflitos e perda de permissão pedem revisão manual. A publicação continua atômica no GitHub e a confirmação visual depende da atualização do GitHub Pages.

## Verificação

Testes: data futura/fuso/revisão, cancelamento concorrente, alteração posterior, revogação de acesso, envio único e assinatura OIDC. iCal: eventos públicos, UID/revisão, conversão Fortaleza/UTC, escape e dobra UTF-8. Calendário: virada do ano e fevereiro bissexto. Navegador: áreas separadas, calendário no painel, confirmação invalidada ao mudar o horário, permissões e seis larguras. Testes usam dados simulados e não publicam rascunhos reais.

Referência Google: [Adicionar uma agenda por URL](https://support.google.com/calendar/answer/37100?hl=pt-BR).

## Implantação e reversão

Backend e workflow ficam em main. Frontend continua em master. Não mesclar branches inteiras. Nenhum novo agendamento de publicação é criado na implantação. O fluxo manual continua disponível.

Para suspender o executor, desative apenas o workflow Publicações programadas. Preserve a fila para conferência; desativar a execução não cancela itens. Não reverta a agenda pública JSON nem os conteúdos publicados por outros editores.


O teste real identificou que o repositório usa o novo subject imutável do GitHub. A validação foi ajustada para o subject exato com IDs permanentes do proprietário e do repositório, além de conferir esses claims separadamente. Referência: [GitHub OIDC — immutable subject claims](https://docs.github.com/en/actions/reference/security/oidc#immutable-subject-claims).


## Confirmação da disponibilização

Backend `f2db23f` promovido no domínio oficial. Frontend `38b22cc` publicado em master. A assinatura “Campo Digital — Agenda da escola” foi confirmada na conta do professor. A execução [44424211819](https://github.com/paulocunha1009/fabcampo/actions/runs/44424211819) confirmou a identidade do executor e respondeu `sem-pendencias`, sem publicar conteúdo de teste. Consulta pública da agenda respondeu 200 e rotas privadas sem autorização responderam 401. Backend de produção: 235 testes aprovados; testes específicos da identidade repetidos após correção e aprovados. Uma publicação futura real ainda deve ter seu estado conferido no portal após o envio.
