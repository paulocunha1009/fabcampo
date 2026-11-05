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
| Modo de alto contraste | Previsto no roadmap; ainda não implementado nesta etapa |

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
