# Ajustes do SabIA e retorno da turma - 17/11/2026

## Motivo

Retorno dos estudantes após a conferência das fontes usadas no site. Essa demanda pedagógica foi concluída, conforme confirmação do professor. Os problemas identificados no SabIA geraram esta rodada técnica separada.

## Aparência

Cores do painel aberto, mensagens de pergunta e resposta, boas-vindas, modos, campo de texto, indicação de digitação, quiz, opções corretas/incorretas, explicações e recomendações adaptadas ao modo escuro. O diálogo passou a respeitar a altura disponível, com rolagem interna. Regras de tema não sobrepõem o alto contraste e não afetam a impressão.

Verificação no Chrome com respostas simuladas: 32 estados (boas-vindas, resposta, quiz respondido e recomendações; claro/escuro; 1440, 768, 390 e 320 pixels), sem problemas calculáveis de contraste e sem painel fora da área visível. Captura de exemplo em `tmp/sabia-20261117/`. O teste não consome Gemini nem demonstra a precisão de uma resposta real do provedor.

## Conteúdo e fontes

Adicionada à História a seção `#escola-ppp`, também extraída para o índice de busca e para o acervo da API:

- início de funcionamento em 03/03/2011: PPP de 2025, páginas 3 e 7 do PDF;
- diretora indicada no documento: Maria Ivaniza Martins de Sousa Nascimento, páginas 7 e 80, quadro da gestão 2025-2027;
- criação como conquista coletiva das comunidades, MST e poder público estadual/SEDUC: páginas 2-4;
- Francisco Araújo Barros como liderança homenageada, sem apresentá-lo como fundador: páginas 16-17;
- não identificação da primeira diretora e distinção entre funcionamento, autorização, inauguração e campo de fundação com data divergente.

A referência do decreto na página foi substituída por atribuição ao PPP, distinguindo o início em março da autorização citada para abril. Não foi feita nova validação normativa do ato original. O arquivo integral do PPP, dados de outros funcionários e a proposta assinada não foram publicados. A proposta de atualização não foi tratada como documento já incorporado ao PPP.

Preservada a alteração manual recente da linha do tempo nas branches master e main. Cada branch recebeu somente a mudança necessária à sua função; hashes do acervo foram gerados a partir das páginas correspondentes de cada histórico.

## Verificação

- Suíte do workspace: 312 testes aprovados, sem ignorados.
- Teste novo verifica recuperação de trechos para ano de criação, direção, fundação coletiva e primeira diretora não identificada.
- A geração do acervo não altera credenciais, permissões, limites de IA ou publicações editoriais.
- Validação do navegador usa serviços simulados; a confirmação de resposta real depende da implantação ativa da API.

Comandos: `node tools/test-sabia-aparencia.cjs`; na pasta backend, `node --test --test-reporter=spec`.

## Correção da seleção de trechos

A primeira pergunta real após a implantação revelou que uma consulta longa com o nome da escola podia priorizar títulos repetidos e excluir o trecho específico da diretora. Corrigido o ranqueamento: palavras completas, frequência dos termos no acervo e maior peso da ocorrência no texto. Um teste de regressão exige o nome da diretora e a ressalva sobre a primeira diretora nos três primeiros trechos da consulta longa.

Após a correção: 312 testes no workspace e 228 na versão isolada da API, todos aprovados. A implantação deve ser acompanhada de nova pergunta real para confirmar o resultado. Os 32 estados visuais usam respostas simuladas.

## Implantação e contingência

API `45bf61c` promovida manualmente na Vercel para o domínio oficial em 17/11. O estado Ready/Production sem Current era apenas uma implantação preparada, com atribuição de domínio ignorada; não indicava que o endpoint oficial já usava a versão nova.

Após a promoção, a conferência real retornou HTTP 429 do provedor Gemini. Não foi alterada chave, plano ou cota para contornar o limite. Acrescentadas respostas locais nos dois clientes do SabIA para as perguntas sobre início de funcionamento, direção, primeira diretora e fundação coletiva. Essas respostas são explicitamente identificadas como acervo local, sem geração por IA, e remetem à seção do PPP na História. O restante do fluxo de IA e dos modos Quiz/Explorar foi preservado.

Oito testes adicionais verificam a contingência com API 429 nos dois clientes (`node --test tools/test-sabia-ppp.cjs`). A recuperação de trechos da API está testada; a qualidade da geração real não é considerada aprovada enquanto o provedor estiver limitado.


## Retorno das duas turmas — 23/11/2026

A avaliação enviada pelo professor abrange 39 estudantes, em pré e pós-teste de 19 e 20/11. A origem da escola teve o menor aproveitamento final (78%), tornando-se prioridade de conteúdo. As sugestões dos estudantes incluem história, resumos, desempenho da IA, cultura, audiovisual e mapas; são demandas, não funcionalidades concluídas.

Conferência local: os marcos do PPP já estavam presentes. Acrescentado um resumo na seção `escola-ppp` e ampliada a contingência dos dois clientes para perguntas sobre origem, surgimento e resumo da história da escola. A resposta mantém criação coletiva, início em 03/03/2011, homenagem a Francisco Araújo Barros e ressalvas sobre os marcos documentais. Nenhum fundador individual ou primeira diretora foi inferido. A resposta local continua identificada como tal e só é usada quando o serviço falha ou não está configurado.

Acervo e busca regenerados. Validação: 14 testes de contingência nos dois clientes (API simulada com erro 429) e 2 testes de recuperação do acervo aprovados. Isso não testa a geração real do Gemini nem atendimento simultâneo. Mudanças desta rodada preparadas no workspace, sem implantação de produção.

Pendências: conferir ato original e divergências documentais de datas; investigar limites e latência com 16 alunos/32 perguntas; preparar pesquisas culturais com fontes e autorizações; revisar mapas. Não adicionar informações históricas apenas por constarem nas respostas dos questionários.

A revisão anterior dos calendários segue separada: a última matriz local completou 912 vistas, com 4 falhas de altura do cabeçalho e nenhum erro JavaScript. Ainda não considerar a responsividade integralmente aprovada.


### Respostas diretas e atendimento coletivo

Perguntas básicas exatas sobre surgimento, origem, resumo, início de funcionamento, direção e fundador agora usam o acervo local antes da rede, com identificação explícita de resposta sem IA. Perguntas abertas, compostas e pedidos de quiz seguem para o serviço. O aviso distingue consulta direta de indisponibilidade, evitando anunciar falha de conexão quando a IA sequer foi chamada.

No código, os limites padrão são 15 solicitações globais/minuto, 30 por endereço/minuto e 200 globais/dia, configuráveis por ambiente; não são confirmação da configuração ativa nem da cota Gemini. Os clientes aguardam até 25 segundos nas chamadas de rede. Não foram elevadas cotas ou alteradas credenciais.

Teste simulado: 32 consultas básicas simultâneas por cliente, todas respondidas sem chamadas de rede; perguntas compostas e quiz preservam a chamada ao serviço. 16 testes aprovados. Essa verificação comprova o desvio local destas perguntas, não capacidade ou latência do Gemini para 32 perguntas abertas, nem desempenho da rede da escola. Implementação local, ainda não publicada.


### Preparação da publicação — 23/11/2026

Atualização isolada sobre master, sem incluir alterações pendentes de calendário ou do backend. Busca pública regenerada a partir das páginas desta versão; referências de cache dos dois clientes atualizadas. Conferência no Chrome: 390 e 1440 pixels, claro e escuro, com pergunta sobre a origem da escola e API interceptada; quatro estados aprovados, sem chamada ao assistente. Captura inspecionada no modo escuro móvel. A publicação desta rodada entrega conteúdo e respostas locais; não modifica a configuração ativa do Gemini. O resumo adicional ainda não foi implantado no acervo da API.
