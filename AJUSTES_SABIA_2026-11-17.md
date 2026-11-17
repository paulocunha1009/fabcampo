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

- Suíte do workspace: 311 testes aprovados, sem ignorados.
- Teste novo verifica recuperação de trechos para ano de criação, direção, fundação coletiva e primeira diretora não identificada.
- A geração do acervo não altera credenciais, permissões, limites de IA ou publicações editoriais.
- Validação do navegador usa serviços simulados; a confirmação de resposta real depende da implantação ativa da API.

Comandos: `node tools/test-sabia-aparencia.cjs`; na pasta backend, `node --test --test-reporter=spec`.
