# FabCampo — melhorias e revisão de 16/11/2026

Este registro descreve o que foi alterado, como conferir e o que continua pendente. Não substitui a revisão da pesquisa pelos estudantes e pelo professor.

## Entregas desta sequência

| Entrega | Comportamento atual | Registro de produção |
| --- | --- | --- |
| Página inicial | Banner antigo e rolo de fotos substituídos por apresentação do projeto e destaques clicáveis | `cc8776d` |
| Destaques editoriais | Fotos, títulos, resumos e links; troca a cada 8 segundos, controles manuais e pausa | `9f7736c` |
| Reportagens novas | Até cinco reportagens com `editorialId` na lista pública; título e resumo vêm de `data/site.json`, capa vem da página da matéria; consulta a cada 60 segundos quando a página está visível e sem foco no destaque | `9f7736c` |
| Identidade | Creme com textura discreta, verde, azul, dourado e detalhes terrosos; fonte Segoe UI/Arial; identificação da escola; seção Nossa escola em movimento | `e643257` |
| Busca | Formulário na inicial, busca no cabeçalho, páginas, catálogo e reportagens acrescentadas ao índice público | `0d9fdb8` |
| Capa do projeto de mudas | Foto do acervo do próprio projeto em Cultivando Vida | `0d9fdb8` |
| Identificação editorial | Rótulo Data da reportagem; atribuições existentes preservadas; acesso às referências em Educação e Clima; orientações de autoria, fontes e créditos no painel | `e46e8eb` |
| Claro, Escuro e Sistema | Sol/lua junto à logo; opção automática; escolha salva no aparelho; busca e menu mantidos | `7fea30d` |
| Revisão corretiva | Linha do tempo, avisos, blocos informativos, plantas, reportagens, Expedição, contato, privacidade e partes da Caravana receberam combinações de fundo/texto próprias para cada tema | Revisão corretiva deste documento |
| Imagens em carregamento ou falha | Mensagem legível, sem caminho técnico para o visitante; falha não remove a legenda; a foto reaparece se carregar depois | Revisão corretiva deste documento |

### O que não é automático

- Publicar exige a revisão e a confirmação editorial já existentes no painel. Rascunhos não entram no banner.
- Nossa escola em movimento é uma seleção manual de páginas já existentes. Não é um feed do Instagram nem um resumo de conquistas não cadastradas.
- A lista externa Educação & Inovação tem seu próprio carregador. Não é a mesma lista de reportagens escolares do banner.
- A aparência não cria autoria, datas, fontes ou fotografias. Trocar o estilo não altera a data da pesquisa.
- O mural da Caravana tem composição própria para projeção. Ele não recebe o seletor do cabeçalho comum.

## Arquivos que controlam a aparência

| Arquivo | Responsabilidade |
| --- | --- |
| `css/portal.css` | Base do portal, tema creme, componentes e organização da inicial |
| `css/inicio-vivo.css` | Banner e chamadas da inicial |
| `css/aparencia.css` | Paleta escura, correções por componente, cabeçalho com seletor e regras de impressão |
| `js/tema-inicial.js` | Lê a preferência antes da pintura; padrão Sistema |
| `js/components/aparencia.js` | Seletor, persistência, mudança do sistema e sincronização entre abas |
| `js/components/menu.js` | Navegação e carregamento do controle nas páginas que usam o cabeçalho compartilhado |
| `js/inicio-vivo.js` | Seleção e alternância dos destaques; leitura das reportagens públicas |
| `js/components/busca-global.js` | Busca de páginas, plantas e trechos indexados |
| `js/components/imagens.js` | Imagens carregadas, pendentes e recuperação após falha |

A chave `campo-digital-tema` guarda apenas `claro`, `escuro` ou `sistema` no localStorage. Ela não identifica alunos e não envia a preferência à API. Alto contraste continua sendo uma função separada e tem prioridade sobre o tema. Sem armazenamento disponível, a escolha funciona na página aberta. Sem escolha salva, acompanha a configuração do dispositivo.

## Revisão realizada

O problema enviado pelo professor mostrou a limitação da primeira conferência: verificar largura e primeira tela não detectou os blocos claros mais abaixo. A nova rotina mede textos de todo o DOM renderizado, inclusive referências abertas, e exige capturas de componentes no meio e no fim das páginas.

- Escopo automatizado de cor: 17 destinos em duas rodadas, larguras 1440 e 390 px — 68 visualizações. Nas 15 páginas com seletor, as rodadas usam Claro e Escuro. Mural e entrada pública do painel mantêm sua identidade própria e não recebem um tema que não possuem. Inclui páginas do sitemap, Caravana, mural e entrada pública do painel.
- Critério de triagem: contraste de 4,5:1 para texto comum e 3:1 para texto grande, conforme [W3C — Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Resultado local após a correção: zero alertas abaixo dessa referência nos pares de cores que a ferramenta consegue calcular. As partes do título do mural foram classificadas para revisão visual, porque a faixa é pintada em `::before`; a mesma composição aparece repetida pelas rodadas e larguras do relatório.
- A rotina considera cores e paradas de gradientes calculadas; não certifica texto sobre fotografias, vídeos, mapas, canvas, PDFs, iframes externos ou todos os estados possíveis.
- Revisão visual: linha do tempo, ficha medicinal, blocos de Educação, recurso financeiro, Expedição e mural, nos dois temas.
- Rotina funcional após publicação: 15 páginas, 51 visualizações, com a inicial entre 320 e 1920 px; menu, busca, preferência salva, modo Sistema, alto contraste e Escape. Nenhuma rolagem lateral indevida nessa matriz.
- As fotos são carregadas/decodificadas antes das capturas de revisão. Uma área ainda carregando não deve ser confundida com ausência do arquivo.
- Links internos, âncoras estáticas, módulos e estilos foram conferidos com o verificador do projeto.
- Testes de regressão relacionados ao frontend: 70 passaram (menu, busca, índices, contraste, catálogo, Expedição, agenda, formulário e estruturas editoriais/Caravana). Outros três testes cobrem imagem já falha antes da inicialização, falha tardia, recuperação e foto válida.
- Os hashes do índice público foram atualizados sem apagar entradas ou reescrever trechos. A cópia local do acervo recebeu os hashes correspondentes; a API não precisou de redeploy porque seus trechos de consulta não foram alterados.

Os resultados devem ser repetidos no domínio oficial após o GitHub Pages concluir. O relatório não é certificação integral de acessibilidade nem prova de aprendizagem, desempenho pedagógico ou veracidade das afirmações históricas.

## Como repetir

Em ambiente com Node, Playwright e Chrome disponíveis:

```text
node tools/auditar-aparencia.cjs --root . --output tmp/auditoria-local
node tools/auditar-aparencia.cjs --publicado --output tmp/auditoria-publicada
node tools/testar-responsividade.cjs
node --test tools/test-imagens.cjs
python tools/check_portal_links.py
python tools/verificar-documentacao.py
```

O auditor de aparência não abre câmera, não envia formulários, não publica matérias e não faz login. A entrada do painel é conferida sem sessão privada; os fluxos privados exigem testes separados com conta autorizada. Sua saída JSON fica em `tmp/`, sem publicação automática.

### Passagem visual obrigatória

1. Percorrer a página inteira em Claro e Escuro; abrir detalhes de leitura e referências.
2. Conferir títulos, datas, textos pequenos, avisos, tabelas, cards, botões, rodapé e imagens.
3. Abrir busca, submenu e preferências de aparência; usar teclado e Escape.
4. Conferir 360, 390, 768, 1024, 1180, 1280, 1440 e 1920 px na inicial; repetir as páginas afetadas em celular.
5. Ativar alto contraste sobre cada tema e voltar; o contraste deve ter prioridade.
6. Conferir impressão sem transformar texto em claro sobre papel branco.
7. Só registrar “conferido” para os estados efetivamente observados.

## Auditoria da documentação

Foram atualizados README, Documentação Técnica, Operação e Recuperação e Imagens Pendentes para apontar a este estado atual. Os relatos datados de implantações antigas permanecem históricos.

Correções documentais: retirada do rolo da inicial; distinção entre painel e edição manual de JSON; descrição dos destaques; chave do tema; prioridade do alto contraste; fluxo separado de `master` e `main`; privacidade do armazenamento local; e limites da revisão anterior.

O verificador de Markdown confere a existência dos destinos locais nos documentos técnicos da raiz e do backend. Não verifica a atualidade de cada afirmação, âncoras de sites externos ou fontes acadêmicas. Índices de busca mantêm seus caminhos e trechos; seus hashes devem acompanhar os HTMLs efetivamente publicados.

## Pendências preservadas

- A entrega das fotos históricas continua com a curadoria. O inventário HTML encontrou 20 usos de marcadores de documentação e nenhum caminho local de imagem ausente no conjunto examinado; isso não comprova crédito, autorização ou correspondência histórica das imagens.
- Fontes e números de cada pesquisa precisam da validação pedagógica. A revisão técnica não verificou, por exemplo, os percentuais apresentados como dados para debate sobre IA, nem acrescentou referências para justificá-los.
- Câmera real em celulares, enquadramento facial, envio de fotos, consentimentos e exibição no mural precisam dos testes de campo já combinados. Nenhuma foto de pessoa foi enviada nesta revisão.
- Gestão de equipe, rascunhos e publicação privados não foram operados nesta auditoria sem sessão do professor.
- Debate da proposta de aprendizagem: 17/11; devolutiva proposta à gestão: 18/11. A aplicação do instrumento continua a definir.
- Agenda aprovada para entrada da Caravana no menu: 07/12 às 15h30, Fortaleza. A auditoria pública não consultou nem alterou a programação privada.

## Publicação e recuperação

Frontend: GitHub Pages, branch `master`. Backend: Vercel, branch `main`. Os históricos divergem; não usar force push nem sincronização integral para uma correção visual. Enviar somente arquivos revisados sobre a versão atual de produção, aguardar o build e repetir a conferência pública.

Para reverter esta rodada, identificar o commit da correção no histórico de `master` e aplicar um revert específico. Não apagar matérias, fotos, rascunhos ou preferências para corrigir CSS. Consulte [Operação e Recuperação](OPERACAO_E_RECUPERACAO.md).

## Confirmação no portal publicado

Correção e documentação publicadas no commit `4716dc4` da `master`, sobre a versão estável `7fea30d`. Aguardado o build do GitHub Pages e repetidas as verificações no domínio oficial.

- Auditoria pública: 17 destinos, 68 visualizações; zero alertas de contraste calculável, zero rolagem lateral indevida e zero sobreposições detectadas no cabeçalho. O título do mural, com fundo pintado em pseudoelemento, foi revisto visualmente; suas observações repetidas não foram tratadas como medição de cor simples.
- Rotina funcional pública: 15 páginas, 51 visualizações, incluindo 320 px e o menu de preferências aberto em cada largura da inicial. Busca, menu móvel, preferência salva, Sistema, Escape e prioridade do alto contraste passaram.
- `/health`: respondeu `ok: true`, IA configurada e limitador Upstash. Não foi enviada pergunta ao Gemini nesta revisão; saúde da configuração não comprova a resposta da IA nem fluxos privados.
- Documentação da branch pública: 11 arquivos Markdown técnicos, 15 destinos locais existentes e nenhum link local ausente no conjunto examinado. Os arquivos internos do checkout também foram conferidos separadamente.
- Impressão: cores de texto e visibilidade dos controles conferidas por emulação do navegador, sem alegar teste de impressora física.

As capturas da linha do tempo publicada foram conferidas em 1440 e 390 px. Os relatórios JSON e capturas ficam em `tmp/auditoria-20261116/`; não contêm credenciais e não são publicados automaticamente.


## Complemento — painel, câmera e envio

- Suíte completa do backend e interfaces: **310 testes aprovados**, nenhum reprovado ou ignorado. Inclui autenticação, permissões, conta administradora, rascunhos, publicação/retirada, equipe, agenda, agendamento, importação, câmera, autorização de envio e mural. Serviços externos são simulados; isso não representa uma sessão Google real.
- Revisão visual isolada de sete estados do painel (entrada, central, edição, acervo, mural, agendamentos e equipe), em 1440, 768, 390 e 320 pixels: **28 visualizações**, sem transbordamento ou problemas de contraste nos textos renderizados medidos após as correções. Nesta verificação, o HTML é exibido localmente sem os scripts de autenticação, sem acesso a dados privados. Listas dinâmicas preenchidas e prévias de matérias específicas não são avaliadas por este teste visual.
- Ajustados os tons dos textos opcionais, etapas inativas, resumo da revisão, prévia vazia, legendas e placeholders do editor. A identidade verde e a tipografia existentes foram preservadas.
- Removida mensagem desatualizada do envio que indicava liberação automática apenas em 08/12. O resultado agora distingue foto liberada e recebimento privado conforme o estado devolvido pelo backend; o período e as autorizações existentes não foram alterados.
- Teste no Chrome com câmera sintética e API interceptada: câmera inicialmente desligada; abertura por clique; detecção sintética; captura JPEG e desligamento da câmera; download local; nenhum envio antes da autorização; autorização para reportagem independente; envio simulado único; limpeza das escolhas ao preparar outra foto. **Nenhuma foto ou autorização foi criada no servidor real.**

Para repetir, com Playwright e Chrome instalados:

```powershell
node --test --test-reporter=spec backend/test/*.test.js
node tools/auditar-painel-interno.cjs
node tools/testar-camera-simulada.cjs
```

Os testes HTTP locais exigem permissão para conexões em 127.0.0.1. Relatórios e capturas ficam em `tmp/auditoria-20261116/`, sem publicação automática.

### Limites do aceite deste complemento

A revisão automatizada e simulada foi concluída. A permissão real da câmera no celular, a precisão do encaixe em rostos reais, o envio persistente com autorização e uma sessão Google verdadeira continuam exigindo os respectivos aparelhos/usuários. Não se deve substituir essas conferências por uma afirmação de funcionamento integral em produção. Os testes de permissões usam contas fictícias e não alteram os acessos da equipe.
