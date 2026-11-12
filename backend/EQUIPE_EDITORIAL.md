# Gestão da equipe editorial

Implementação preparada; ativação depende de `EDITORIAL_TEAM_ENABLED=true` no backend.
O responsável precisa apresentar token Google válido, ter sub em
`EDITORIAL_GOOGLE_SUBJECTS` e e-mail verificado exatamente igual a
`paulo.cunha1@prof.ce.gov.br`. Integrantes publicadores não gerenciam acessos.

`GET /api/editorial/equipe` lista os e-mails de publicação já aprovados na
configuração, sobrepostos pelas decisões salvas no painel. A conta responsável
é mostrada separadamente e não pode ser alterada por essa rota.

`POST /api/editorial/equipe` recebe `email`, `papel` (`rascunhos`, `publicador`
ou `inativo`), `revisao` e `confirmado:true`. Exige o responsável em toda chamada.
Persistência privada em Redis, sem TTL, até 100 entradas, CAS atômico para
impedir sobrescrita entre abas. Guarda a data e o responsável pela última alteração.
E-mail novo aprovado vincula uma única identidade Google no primeiro acesso,
usando o mesmo vínculo permanente já existente. Alterar papel não apaga o vínculo.

Com a função ativa, decisões salvas prevalecem sobre permissões de configuração.
`inativo` impede novas operações, mas não interrompe uma requisição já aceita.
Falhas de leitura negam acesso aos integrantes; o responsável original continua
autenticando para diagnóstico. A consulta/escrita da equipe falha com 503.
Somente rascunhos mantém o trabalho privado compartilhado e uso da IA, sem
publicação ou retirada pública. Retirar acesso não apaga conteúdo existente.

A interface não guarda tokens ou lista da equipe no armazenamento do navegador.
Exige confirmação da alteração e nova consulta após salvamento ou falha incerta.
O cartão só aparece quando `/me` informa `gerenciarEquipe:true`; isso não substitui
a autorização do servidor. A sessão expirada fecha a janela e limpa os dados.

## Implantação e recuperação

Publicar backend e frontend preparados e ativar a variável somente com aprovação
do professor. A ativação não altera os papéis já aprovados nem insere contas novas.
Não usar alterações reais de permissões como teste descartável. Conferir a lista
com a conta do professor; o teste de escrita foi feito apenas em memória/local.

Antes de desativar a função ou voltar ao backend anterior, sincronizar as listas
de ambiente com as decisões atuais: o backend antigo não lê decisões do painel.
Sem isso, contas retiradas ou rebaixadas no painel poderiam recuperar o acesso
anterior definido no ambiente. Preservar o registro e os vínculos no Redis.

Validação local: 250 testes, incluindo privilégio exclusivo do responsável,
proteção da própria conta, CAS, rebaixamento, retirada, reativação, conflito de
identidade e falha fechada. QA da interface usou uma API simulada, sem contas reais.
