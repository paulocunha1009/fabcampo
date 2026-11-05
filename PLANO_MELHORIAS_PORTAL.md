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
| Verificar links internos e dependências locais das páginas do sitemap | Automatizado no GitHub; não exige publicação do portal |
| Melhorar falhas, datas e carregamento de notícias | Publicado em 05/11/2026 |
| Expedição começar limpa em cada abertura, adequada ao laboratório | Publicado em 05/11/2026 |
| Consultar e baixar registros da atividade | Publicado em 05/11/2026 |
| Guardar pergunta e resposta juntas durante a atividade | Publicado em 05/11/2026 |
| Limpar a conversa do SabIA na troca de aluno | Publicado em 05/11/2026 |
| Revisar campos, avisos e foco por teclado da Expedição | Publicado; teste de uso com alunos pendente |
| SabIA: foco ao abrir e fechar, seleção acessível dos modos e preservação do texto durante espera | Publicado; teste de uso com alunos pendente |
| Catálogo: avisos de resultados e carregamento, resposta textual e foco na ficha | Publicado; teste de uso com alunos pendente |
| Contato: validação, mensagens de envio e preservação do texto | Publicado; teste de uso com alunos pendente |
| Menu: submenus ocultos fora da navegação, Escape e devolução de foco | Publicado; teste de uso com alunos pendente |
| Galerias: controle de movimento, preferência do sistema e cópias acessíveis | Publicado; teste de uso com alunos pendente |
| Modo de alto contraste | Publicado; teste de uso com alunos pendente |
| Busca interna: links das páginas temáticas, termos em outra ordem e atualização das fichas | Publicado; teste de uso com alunos pendente |
| Busca dentro dos textos, com trecho original e carregamento sob demanda | Publicado em 05/11/2026; exemplo conferido no domínio oficial |
| Painel para edição de notícias da comunidade e eventos escolares | Levantamento concluído; aguardando definição dos papéis pelo professor |

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

## Publicação concluída em 5 de novembro de 2026

Publicação autorizada pelo professor após retorno ao PC de casa. A conferência
funcional incluiu alto contraste, busca por nome científico, menu e Escape,
consulta e download de registros, encerramento da sessão, conversa real com SabIA,
limpeza de conversa, galeria estática, validação do formulário sem envio real e
uma parada da Expedição com três questões e conclusão por alternativa local.

- Frontend publicado em `master`: `273ef8189434d93ed7dc9b860e5d1fe4fcd1f66b`.
- API promovida: `a46d068390687fc7d75732ed2b80b013fc14b646`.
- Implantação Vercel: `EXXxjY4WQtvXH97BUSggfz9Tm2hg`.
- GitHub Pages: execução `42123792063`, concluída com sucesso.
- Conferência após publicação: os 28 arquivos entregues responderam HTTP 200 e
  coincidiram com a versão revisada, após normalização de finais de linha.
- `/health`: HTTP 200, IA configurada, Upstash ativo, 15 pedidos globais por minuto
  e 200 por dia. `/api/noticias`: HTTP 200 com cinco notícias na conferência.
- `/diagnostico`: HTTP 404, sem expor a ferramenta de preview.
- Antes da publicação: 87 testes JavaScript e três testes do verificador aprovados,
  mais a checagem de 14 páginas e 38 arquivos locais.
- Retorno do frontend: commit anterior `4530fdf`, preservado no histórico e na
  branch local `codex/backup-portal-antes-laboratorio-20261105`.

O teste de uso pelos alunos no laboratório permanece como próxima etapa. Não houve
envio real de contribuição ao Google Forms nem auditoria formal com leitores de tela.

O próximo desenvolvimento do roadmap é detalhado em `PLANO_PAINEL_EDITORIAL.md`,
com a estrutura atual dos conteúdos e as decisões necessárias para a edição.

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

A ampliação da busca usa `data/busca.json`, gerado pelo mesmo comando do acervo.
São 11 páginas temáticas, incluindo a página de mudas. O índice só é carregado ao
abrir a busca. O resultado pode exibir um trecho original, limitado a 220 caracteres,
e prioriza correspondências nos títulos. A consulta não é enviada à IA. Quando o
índice falha, os nomes de páginas e as fichas de plantas continuam pesquisáveis.
Somente destinos já conhecidos da navegação são aceitos para os textos indexados.

Ampliação publicada no frontend em `eb3de2a0db0588e704d97d0e5d78d1d9d45a8fb0`,
com origem em `bd15ecc6e86780c83ef53a918de9e0869714c0c3`. A execução do GitHub
Pages `42126816719` concluiu com sucesso. Os 18 arquivos entregues responderam HTTP
200 e coincidiram com a versão revisada. No domínio oficial, a consulta
`decreto 92.826` encontrou História com o trecho original correspondente.
Os 91 testes JavaScript, três testes do verificador e a checagem de links passaram.
Esta entrega atua na busca do frontend, sem alteração de rotas ou limites da API.

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

## Menu e submenus

Com JavaScript ativo, os submenus abrem por seus botões (clique ou ativação nativa
pelo teclado), com `aria-controls` e `aria-expanded` sincronizados. Fechados, usam
`hidden` e não deixam links invisíveis no percurso do Tab. O CSS mantém a alternativa
de hover/foco no desktop antes da inicialização do script.

`Escape` fecha primeiro o submenu e devolve foco ao seu botão; no menu móvel, uma
segunda ação fecha a navegação e retorna ao botão Menu. A tecla só atua se o foco
estiver na navegação. Sair da navegação fecha o menu móvel. O tratamento de resize
agora acompanha o limite de 1.180 pixels já usado no CSS responsivo.

## Galerias e movimento

As galerias automáticas oferecem `Ver fotos sem movimento`. O modo estático mostra
somente as fotos originais e permite percorrer a galeria horizontalmente. Dar foco
à região também interrompe o movimento para navegação pelo teclado. A preferência
`prefers-reduced-motion` do sistema é respeitada, inclusive quando muda com a página
aberta. Sem essa detecção, o botão continua disponível.

As cópias necessárias à animação são marcadas como `aria-hidden` e `inert`, com IDs
removidos para evitar duplicações no documento. Fotos, legendas e demais conteúdos
do acervo não são alterados por essa revisão. A conferência real da rolagem e das
animações continua pendente com as demais mudanças de interface.

## Verificação de links e dependências

`python tools/check_portal_links.py` confere as páginas declaradas no sitemap,
links locais, âncoras estáticas, scripts, importações estáticas de módulos e arquivos
de estilo referenciados. Também detecta diferenças de maiúsculas/minúsculas que
poderiam passar despercebidas no Windows e falhar na hospedagem. A checagem não
acessa a internet nem valida fatos, imagens pendentes ou destinos externos.

O workflow de validação executa essa checagem e os testes do próprio verificador.
Mudanças em HTML da raiz, sitemap, dados e ferramentas também acionam a validação,
além das pastas de backend, páginas, JavaScript e CSS já acompanhadas.
