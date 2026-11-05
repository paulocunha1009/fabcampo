# Acompanhamento das melhorias do FabCampo

Atualizado em 5 de novembro de 2026. Este registro reúne o planejamento técnico
documentado e as decisões do professor nesta conversa. Alterações na `main` não
significam publicação no portal: o frontend usa `master` e a API exige promoção na Vercel.

## Planejamento de origem

- `DOCUMENTACAO.md`, seção 10: rótulos, foco visível, navegação pelo teclado e mensagens claras.
- `DOCUMENTACAO.md`, seção 17: melhorias do portal, quizzes e modo de alto contraste.
- `DOCUMENTACAO.md`, seção 21.16: testes do assistente e revisão periódica do acervo.

Os registros de setembro na documentação descrevem aquele período. Acompanhamento
atual abaixo não deve ser confundido com o estado publicado naquela data.

## Entregas em acompanhamento

| Demanda | Situação |
| --- | --- |
| SabIA consultar o acervo e validar respostas e links | Publicado anteriormente |
| Limitar espera pela IA e oferecer alternativa local | Publicado anteriormente |
| Validar automaticamente backend e acervo no GitHub | Ativo |
| Melhorar falhas, datas e carregamento de notícias | Implementado na `main`; publicação pendente |
| Expedição começar limpa em cada abertura, adequada ao laboratório | Implementado na `main`; publicação pendente |
| Consultar e baixar registros da atividade | Implementado na `main`; publicação pendente |
| Guardar pergunta e resposta juntas durante a atividade | Implementado na `main`; publicação pendente |
| Limpar a conversa do SabIA na troca de aluno | Implementado na `main`; publicação pendente |
| Revisar campos, avisos e foco por teclado da Expedição | Implementado na `main`; conferência visual e publicação pendentes |
| SabIA: foco ao abrir e fechar, seleção acessível dos modos e preservação do texto durante espera | Implementado na `main`; conferência visual e publicação pendentes |
| Catálogo: avisos de resultados e carregamento, resposta textual e foco na ficha | Implementado na `main`; conferência visual e publicação pendentes |
| Contato: validação, mensagens de envio e preservação do texto | Implementado na `main`; conferência visual e publicação pendentes |
| Modo de alto contraste | Implementado na `main`; conferência visual e publicação pendentes |
| Busca interna: links das páginas temáticas, termos em outra ordem e atualização das fichas | Implementado na `main`; conferência visual e publicação pendentes |

## Decisão para computadores compartilhados

Não há identificação individual ou login de estudantes. A proposta de recuperar
progresso entre sessões foi substituída, por orientação do professor, por atividades
temporárias: cada abertura começa limpa, e encerrar apaga os dados da página.
O aluno pode baixar uma cópia antes de encerrar. Arquivos baixados continuam no PC;
a entrega e remoção desses arquivos seguem a orientação do professor.

## Responsáveis pelas próximas etapas

1. Desenvolvimento: manter correções e testes automáticos no repositório.
2. Professor: conferir visualmente quando o acesso ao navegador estiver disponível.
3. Publicação: promover a API testada na Vercel e sincronizar somente os arquivos
   necessários do frontend com `master`, preservando as diferenças entre as branches.
4. Alunos: testar o uso no laboratório após a publicação e registrar dificuldades.

A revisão por código e os testes automáticos não substituem a conferência real
com teclado, leitores de tela e os computadores usados pela escola.

## Modo de alto contraste

O controle aparece antes do conteúdo principal nas páginas que carregam `js/app.js`.
Usa botão nativo com estado `aria-pressed` e anúncio da mudança. O modo pode seguir a
preferência `prefers-contrast` do sistema e ser alterado manualmente na página atual.
Não grava preferências no computador. Fotografias e vídeos não são invertidos.
O estilo especial é aplicado apenas em tela e mantém indicação textual das respostas
corretas dos quizzes. Páginas antigas de redirecionamento não recebem controles.

Na conferência visual, verificar legibilidade do menu, formulários, widgets, imagens,
quiz, Catálogo e Expedição, além de foco de teclado e comportamento em telas pequenas.
Não há declaração de conformidade integral de acessibilidade baseada nesses testes.

## Busca interna

A busca usa as páginas já listadas no portal e as fichas existentes em
`data/plantas.json`. Normaliza acentos e pontuação e permite procurar por palavras
em outra ordem. Resultados de plantas apontam ao filtro do Catálogo. Nenhuma ficha
ou informação de pesquisa foi acrescentada por essa melhoria.

O carregamento das fichas tem prazo de cinco segundos. Falhas não interrompem a
busca de páginas e são informadas ao visitante. Reabrir a busca permite tentar
novamente. A consulta digitada é limpa ao fechar o diálogo.

## Navegação por teclado no SabIA

O painel é um diálogo não modal: a página continua disponível. Ao abrir, o foco vai
para a pergunta; ao fechar, volta ao botão do assistente. `Escape` fecha o painel
quando o foco está em um controle dele, sem interferir em outras áreas da página.
Os modos usam botões nativos agrupados, com o modo ativo indicado por `aria-pressed`.
Não são anunciados como abas de um painel inexistente. Se outra pergunta estiver
em andamento, tentar enviar novamente preserva o novo texto no campo.

## Acessibilidade do Catálogo

Busca e filtros informam a quantidade de fichas encontradas por uma região de
status. O desafio anuncia preparo, modo local e disponibilidade das alternativas.
O estado de carregamento é indicado por `aria-busy`. As opções são agrupadas pelo
enigma e a resposta é explicitada em texto, além das cores. Após o palpite, o foco
vai para a ficha revelada. O enigma pronto não toma o foco se o visitante já estiver
usando outro controle da página. A revisão não altera o conteúdo das fichas.

## Formulário de contato

O envio atual usa Google Forms com `mode: no-cors`. Uma resposta opaca não permite
ao portal verificar o recebimento ou a aceitação dos campos. A interface informa
essa limitação, sem confirmar sucesso e sem apagar ou esconder os dados preenchidos.
O formulário oficial fica disponível por um link acionado pelo visitante, sem abrir
abas automaticamente em falhas. O prazo da tentativa é de 15 segundos, com prevenção
de envios simultâneos e restauração do botão ao terminar.

Erros de validação são associados aos campos e o primeiro inválido recebe foco.
Telefones são verificados apenas pelo formato, sem confirmação de titularidade.
Links opcionais aceitam HTTP/HTTPS com domínio válido e sem credenciais embutidas.
Os testes automatizados simulam a rede e não enviam mensagens ao Google Forms.
