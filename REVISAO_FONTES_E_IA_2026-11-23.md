# Revisão das fontes e da SábiaIA — 23/11/2026

## Conteúdo revisado

- História: corrigida a data/finalidade da referência do Decreto 92.826 (26/06/1986, declaração de interesse social para desapropriação). Diferenciada da Portaria 573 de 13/07/1987 citada pelo Incra.
- História e reportagem Educação do Campo: retirado o ano de 2025 dos números de 249 estudantes/oito turmas/25 comunidades. O estudo de Nascimento e Diniz é histórico e reúne entrevistas de 2016; não temos matrícula atual conferida.
- Incluída contextualização dos estudos de Lima e Vasconcelos, Paz e Vasconcelos e Alves e colaboradores, com links aos originais e limites dos estudos. Eles não avaliam o portal atual.

## IA

- Acrescentado contexto separado com cinco sínteses documentais e atribuição/localizador. Somente trechos lidos entram como evidência; as vinte fichas não equivalem a vinte textos integralmente validados.
- Geração de reportagens continua usando somente a pesquisa enviada pelo usuário. A base externa não é acrescentada silenciosamente à apuração do aluno.
- Números e falas passaram a ser validados também nos trechos efetivamente citados, não apenas em algum ponto da pesquisa inteira. Isso bloqueia alguns apoios incorretos, mas não substitui revisão humana de relações, nomes e datas.
- Mantidos modelo, contas, cotas e autenticação existentes.

## Verificação e limites

238 testes do backend passaram, incluindo recuperação das fontes, números históricos, marcos distintos e rejeição de número/fala sem suporte no trecho citado. Prévia da reportagem conferida no navegador em modo escuro. Não foi feita nova auditoria de todos os tamanhos de tela nesta revisão textual.

Datas de posse divergentes, primeira direção, matrícula atual e outros dados não conferidos continuam pendentes. Esta etapa cobre História, Educação do Campo e a base textual da SábiaIA; não é uma revisão completa de todas as reportagens.

## Implantação confirmada

- Portal publicado em master: revisão d04758f, seguida do ajuste de referência oficial 6139996.
- API: cdbe21d, verificações automáticas aprovadas, implantação CtLXSazvNoyhruA1EPNmECgETE9X promovida como Production Current no domínio fabcampo-api.vercel.app.
- Antes da promoção, a API pública ainda usava a versão anterior e respondeu incorretamente que os 249 alunos eram de 2025. Depois da promoção, o teste real retornou HTTP 200, atribuiu o dado a Nascimento e Diniz, página 3 do PDF, e esclareceu que não comprova matrícula de 2025/2026.
- Foram usadas duas chamadas reais ao assistente para essa conferência; os testes automatizados não usam o Gemini real. Uma resposta correta não garante ausência de erros em todas as perguntas; a revisão humana permanece necessária.

## Segunda rodada — atribuição dos relatos e datas divergentes

- Relatos de Francisca Martins, Maria Expedita Irineu da Silva e Cosma Damasceno passaram a ser apresentados como sínteses, com as páginas do trabalho de Nascimento e Diniz e as datas das entrevistas de 2016. Não são entrevistas realizadas pela equipe do portal; o cargo de Cosma é identificado como registro daquele período. A síntese preserva a ressalva sobre as dificuldades do campo experimental.
- A página História atribui 19/09/1986 ao relatório Ipea (2016, p. 29 impressa, posição 31 do PDF) e explicita a diferença para 25/07/1986 no PPP (2025, páginas 12 e 15 do PDF). A conciliação dos documentos permanece pendente.
- A SábiaIA recebe a divergência com prioridade no contexto, inclusive em perguntas amplas. O início de funcionamento em 03/03/2011 não é confundido com autorização ou campo de fundação de 2012. A primeira direção continua sem identificação confirmada na base.
- 239 testes do backend e duas verificações de integridade do catálogo passaram, além da conferência dos links internos. Nenhuma cota ou conta foi alterada.
