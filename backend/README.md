# API do Portal da Comunidade

Backend Express para o **SabIA — Inteligência do Território**, atividades da Expedição e do Catálogo e notícias externas. A API usa Google Gemini e foi preparada para execução local e na Vercel.

## Rotas

- `GET /health` — estado da configuração, modelo e limites ativos;
- `GET /api/noticias` — notícias externas com resposta local no frontend;
- `POST /api/assistente` — assistente educacional;
- `POST /api/atividade` — atividades ancoradas no acervo do portal.

As notícias usam prazo de 2,5 segundos por fonte e compartilham consultas simultâneas
dentro da mesma instância. O cache dura 30 minutos; se as fontes falharem, o último
resultado disponível é retornado com `stale: true`. Sem cache, a lista vazia permite
ao frontend manter seu conteúdo local. Datas ausentes ou inválidas ficam vazias,
e apenas links HTTP/HTTPS são aceitos. O cache em memória não é compartilhado entre
instâncias da Vercel.

## Desenvolvimento local

```bash
npm install
copy .env.example .env
npm start
```

O servidor local usa `http://localhost:3001`. Sem uma chave Gemini válida, `/health` funciona para diagnóstico e as rotas de IA retornam `503`, permitindo testar a contingência do frontend.

## Acervo e validação das respostas

O SabIA consulta trechos públicos extraídos das páginas do portal, com a identificação
da origem. O arquivo `data/acervo.json` acompanha o backend na implantação; não depende
de acesso às páginas por rede em cada pergunta. Isso não verifica os fatos publicados:
a pesquisa e a curadoria continuam sob responsabilidade da equipe escolar.

Após alterações nas páginas, execute na raiz do repositório:

```bash
python tools/build_ai_acervo.py
```

Inclua o snapshot atualizado na mesma revisão. Os testes conferem os hashes das páginas
para detectar conteúdo desatualizado. A busca é textual e limitada: a ausência de um
trecho não demonstra ausência da informação no site. Por enquanto, ela usa a pergunta
atual, sem pesquisa semântica ou banco vetorial.

O mesmo comando também gera `data/busca.json`, usado na busca pública do portal.
Esse índice contém os trechos do acervo e a página de mudas, sem reescrever os textos.
Inclua os dois arquivos gerados ao alterar as páginas; os testes detectam índices
desatualizados. A busca pública não envia as consultas para a API de IA.

Mensagens, quizzes e recomendações são validados antes do envio ao navegador.
Respostas vazias ou incompletas retornam `502 INVALID_AI_RESPONSE`, acionando a
contingência local já existente. Links de recomendação precisam corresponder às páginas
do acervo. Essa validação estrutural não garante a veracidade da resposta gerada.

## Testes locais

Execute `npm test` na pasta `backend`. Os testes usam um provedor controlado e
não precisam de chave Gemini nem de Upstash. `createApp` permite testar as rotas
com esse provedor, mantendo o app padrão usado pela Vercel.

O workflow `Validação do backend e acervo` executa essa suíte no GitHub em mudanças
relevantes na branch `main` e em pull requests para ela, sem credenciais de produção.
Uma falha sinaliza o problema na revisão; esse workflow não bloqueia sozinho a
implantação automática da Vercel. Se o acervo estiver desatualizado, gere novamente
o arquivo com o comando acima e inclua a atualização no commit.

`DOTENV_CONFIG_PATH` permite indicar um arquivo de configuração separado nos testes,
evitando carregar credenciais do `.env` local. Os testes cobrem também o contexto
enviado ao provedor, links, respostas truncadas e falhas de cota.

Para validar a geração real, use uma implantação de teste com as credenciais já
configuradas na hospedagem. Um teste no endpoint público de produção não valida
mudanças que ainda existem somente no checkout local.

## Segurança e privacidade

- chaves ficam somente nas variáveis de ambiente;
- conversas não são gravadas;
- o endereço de rede é transformado em hash antes de entrar no contador;
- CORS aceita somente as origens configuradas;
- corpos JSON têm limite de 20 KB;
- Upstash aplica limites persistentes entre instâncias da Vercel;
- em produção, `REQUIRE_PERSISTENT_RATE_LIMIT=true` impede uso sem a proteção ativa.

## Limites iniciais aprovados

- 30 solicitações por minuto por IP/rede;
- 15 solicitações por minuto no portal inteiro;
- 200 solicitações por dia;
- até 1.000 tokens de saída por resposta.

Todos os valores são configuráveis sem mudança de código. Veja [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) para implantação.

## Uso pela turma

No SabIA, `Nova conversa` limpa as mensagens da tela, o campo de entrada e o histórico
usado na próxima pergunta, e retorna ao modo Perguntar. Respostas pendentes da conversa
anterior são ignoradas. Navegar para fora e voltar pelo histórico também limpa a
conversa; fechar apenas o painel preserva a conversa atual enquanto a página fica aberta.
Não foi adicionado login nem identificação de estudante. O cache local de notícias
contém somente conteúdo público, não respostas de alunos.

Na Expedição, cada abertura inicia uma atividade vazia, sem login nem recuperação
de registros anteriores. Respostas, perguntas e progresso ficam somente em memória
enquanto a página está aberta; não são gravados em localStorage ou sessionStorage.
A chave de localStorage usada na versão antiga é removida quando o armazenamento
permite, sem ler ou importar seu conteúdo nem limpar dados de outras funcionalidades.
O aluno deve baixar os registros antes de atualizar a página, sair ou encerrar.
O navegador pode exibir seu aviso nativo de saída enquanto houver trabalho na página.

`Encerrar atividade` solicita confirmação após lembrar do download e limpa respostas,
pontuação, rascunhos e conversa com o guia. Sair e voltar pelo histórico também começa
limpo, incluindo a restauração pelo cache de navegação. Respostas assíncronas da sessão
encerrada são ignoradas. O encerramento não remove arquivos já baixados do computador;
a orientação de entrega e remoção no laboratório cabe ao professor.

O botão `Baixar meus registros (.txt)` gera no navegador uma cópia das respostas
abertas, do registro de memória e da pontuação atual, organizada por parada. Inclui
rascunhos identificados e espaços para o aluno preencher nome e turma no arquivo.
Não exporta perguntas, alternativas ou devolutivas dos quizzes; gerar o arquivo não
envia registros ao servidor e não altera o progresso. O arquivo é texto UTF-8 com BOM para preservar
acentos em editores comuns no Windows. A interface confirma a solicitação do download,
sem afirmar que o navegador terminou de salvar o arquivo.

`Ver meus registros` permite consultar e copiar os mesmos textos diretamente na
página, sem refazer quizzes. A consulta aberta acompanha os rascunhos da sessão;
abrir ou fechar a consulta não altera pontuação ou conclusão das paradas.
Respostas abertas incluem também a pergunta exibida. Ao voltar à pergunta dentro da
mesma atividade, o rascunho mantém seu contexto mesmo se a IA gerar outro desafio.
A avaliação opcional pela IA continua enviando o texto ao backend quando o aluno
aciona `Enviar resposta`; nenhuma identificação de aluno foi acrescentada.

Os clientes do assistente aguardam até 25 segundos. Em falha de conexão, demora ou
limite da API, exibem um aviso de modo local e oferecem o conteúdo local existente.
Os limites de produção permanecem em 15 pedidos de IA por minuto e 200 por dia.

Os testes simulam 40 pedidos HTTP simultâneos em duas instâncias, usando um contador
compartilhado controlado, tanto na mesma rede quanto em redes diferentes. O resultado
esperado é de 15 respostas da IA e 25 respostas de limite, sem chamadas ao provedor
para os pedidos bloqueados. Esse teste local não é uma medição de capacidade da Vercel
ou do Gemini em produção e não consome serviços externos.
