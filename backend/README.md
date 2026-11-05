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

Na Expedição, respostas abertas e registros de memória são salvos durante a
digitação no armazenamento do navegador, sem concluir a parada ou atribuir pontos.
O aluno recebe aviso se o salvamento falhar. Os registros não são sincronizados
entre dispositivos nem enviados ao professor; limpar os dados do navegador pode
apagá-los. Retomar um rascunho de resposta aberta ainda exige chegar novamente à
pergunta aberta da parada. A retomada exata da questão em andamento não é persistida.

Os clientes do assistente aguardam até 25 segundos. Em falha de conexão, demora ou
limite da API, exibem um aviso de modo local e oferecem o conteúdo local existente.
Os limites de produção permanecem em 15 pedidos de IA por minuto e 200 por dia.

Os testes simulam 40 pedidos HTTP simultâneos em duas instâncias, usando um contador
compartilhado controlado, tanto na mesma rede quanto em redes diferentes. O resultado
esperado é de 15 respostas da IA e 25 respostas de limite, sem chamadas ao provedor
para os pedidos bloqueados. Esse teste local não é uma medição de capacidade da Vercel
ou do Gemini em produção e não consome serviços externos.
