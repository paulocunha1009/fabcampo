# Operação, monitoramento e recuperação do FabCampo

Documento de referência para estudantes, professores e demais participantes responsáveis pelo portal.

**Atualizado em:** 13 de setembro de 2026.

## 1. Arquitetura oficial

| Componente | Serviço | Endereço ou projeto | Branch de produção |
|---|---|---|---|
| Portal público | GitHub Pages | `https://fabcampo.com.br` | `master` |
| Código-fonte | GitHub | `paulocunha1009/fabcampo` | `main` e `master` sincronizadas |
| Backend da IA | Vercel | projeto `fabcampo-api` | `main` |
| API pública | Vercel | `https://fabcampo-api.vercel.app` | — |
| Inteligência artificial | Google Gemini API | `gemini-2.5-flash-lite` | — |
| Limites de uso | Upstash Redis | integração do projeto Vercel | — |
| Contribuições | Google Forms | formulário da SEDUC-CE | — |

O Railway e o Render não fazem parte da arquitetura atual.

## 2. O que deve funcionar

- `https://fabcampo.com.br` abre com HTTPS;
- menu, imagens e páginas internas carregam sem erro;
- `https://fabcampo-api.vercel.app/health` responde com `ok: true`;
- o health informa `aiConfigured: true` e `limiter: "upstash"`;
- o formulário de Contato valida os campos e mostra confirmação após o envio;
- o assistente responde ou oferece a contingência local quando a cota acaba;
- `robots.txt` e `sitemap.xml` permanecem acessíveis.

## 3. Rotina gratuita de monitoramento

### Toda semana

1. Abrir a página inicial no celular e no computador.
2. Visitar História, Catálogo, Expedição, Contato e Privacidade.
3. Abrir o menu no celular e confirmar que ele fecha normalmente.
4. Consultar `/health` e conferir os campos descritos acima.
5. Fazer no máximo uma pergunta simples ao assistente, evitando dados pessoais.
6. Conferir no GitHub se o último deploy de Pages terminou sem erro.
7. Conferir na Vercel se o último deploy de produção está com status `Ready`.

### Todo mês

1. Executar `npm --prefix backend test` — devem passar todos os testes.
2. Verificar o consumo gratuito no painel da Vercel, Gemini e Upstash.
3. Conferir se a chave Gemini continua válida, sem revelar seu valor.
4. Revisar contribuições recebidas e apagar testes que não precisam ser mantidos.
5. Conferir se as informações de contato e a Política de Privacidade continuam atuais.
6. Criar uma branch de backup antes de qualquer lote relevante de mudanças.

### Antes de uma apresentação ou aula

- testar portal e API pelo menos 30 minutos antes;
- abrir previamente as páginas que serão usadas;
- lembrar que somente 10 solicitações de IA por minuto passam no portal inteiro;
- organizar perguntas em grupos ou usar a atividade local de contingência;
- não aumentar limites nem cadastrar cobrança para contornar a cota gratuita.

## 4. Diagnóstico rápido

### O portal inteiro não abre

1. Verificar a página **Actions** e **Settings > Pages** do repositório.
2. Confirmar que a branch publicada é `master` e a pasta é `/ (root)`.
3. Confirmar que o arquivo `CNAME` contém somente `fabcampo.com.br`.
4. Conferir os registros DNS conforme `DOMINIO_OFICIAL.md`.
5. Testar temporariamente `https://paulocunha1009.github.io/fabcampo/` para separar falha de deploy de falha de domínio.

### O portal abre, mas a IA não responde

1. Abrir `https://fabcampo-api.vercel.app/health`.
2. Se a API não abrir, conferir o deploy do projeto `fabcampo-api` na Vercel.
3. Se `aiConfigured` for `false`, revisar `GEMINI_API_KEY` no painel da Vercel.
4. Se `limiter` não for `upstash`, revisar as variáveis Upstash.
5. Se aparecer `429`, aguardar o limite e usar a contingência local — isso é esperado.
6. Se aparecer `503`, não remover a proteção; conferir integrações e variáveis.

### O formulário não envia

1. Confirmar que todos os campos obrigatórios foram preenchidos.
2. Abrir o link “Abrir formulário oficial” exibido na mensagem da página.
3. Verificar se o Google Forms ainda aceita respostas.
4. Não substituir o formulário nem alterar os códigos `entry.*` sem novo teste autorizado.

### Uma página ou imagem está quebrada

1. Conferir o caminho e respeitar letras maiúsculas, acentos e extensão do arquivo.
2. Executar a checagem local antes de publicar.
3. Preferir corrigir a referência; não apagar uma URL pública antiga.
4. Para URLs antigas, usar redirecionamento e `noindex,follow`.

## 5. Processo seguro de publicação

1. Atualizar as branches remotas e conferir `git status`.
2. Criar uma branch de backup apontando para o commit estável atual.
3. Fazer alterações pequenas e relacionadas.
4. Testar em desktop e celular.
5. Executar testes do backend e verificação de links.
6. Criar commit com descrição clara.
7. Publicar o mesmo commit em `main` e `master`.
8. Confirmar o domínio público e a API depois da propagação.
9. Registrar commit, backup e resultado dos testes na comunicação da equipe.

Nunca publicar `.env`, chaves, tokens ou capturas que mostrem segredos.

## 6. Recuperação sem apagar o histórico

O método preferido é **reverter o commit que causou o problema**. Não usar `git reset --hard` nem `git push --force`.

### Reverter um único commit problemático

```powershell
git switch main
git pull --ff-only origin main
git revert ID_DO_COMMIT
npm.cmd --prefix backend test
git push origin HEAD:main
git push origin HEAD:master
```

O `git revert` cria um novo commit que desfaz a alteração, mantendo o histórico e permitindo auditoria.

### Recuperar conteúdo a partir de uma branch de backup

1. Identificar o backup correto com `git branch -r`.
2. Comparar antes de restaurar:

```powershell
git diff origin/codex/NOME_DO_BACKUP..origin/main
```

3. Criar uma branch temporária a partir do backup e validar localmente:

```powershell
git switch -c codex/recuperacao origin/codex/NOME_DO_BACKUP
npm.cmd --prefix backend test
```

4. Somente depois da validação, decidir com a equipe quais commits devem ser revertidos na branch oficial.

### Backups remotos existentes

- `codex/backup-pre-expedicao-catalogo-20260909`
- `codex/backup-before-user-updates-20260912`
- `codex/backup-before-vercel-sprint-20260912`
- `codex/backup-before-expedicao-mobile-20260912`
- `codex/backup-before-mobile-core-pages-20260912`
- `codex/backup-before-mobile-secondary-pages-20260913`
- `codex/backup-before-final-audit-20260913`
- `codex/backup-before-banner-optimization-20260913`
- `codex/backup-before-contact-validation-20260913`
- `codex/backup-before-class-load-test-20260913`
- `codex/backup-before-privacy-policy-20260913`

## 7. Variáveis do backend

As variáveis ficam apenas no painel da Vercel, em Production e Preview:

- `GEMINI_API_KEY`;
- `GEMINI_MODEL`;
- `MAX_TOKENS`;
- `RATE_LIMIT_PER_IP_MIN`;
- `RATE_LIMIT_GLOBAL_MIN`;
- `RATE_LIMIT_GLOBAL_DAY`;
- `RATE_LIMIT_PREFIX`;
- `RATE_LIMIT_SALT`;
- `REQUIRE_PERSISTENT_RATE_LIMIT`;
- `ALLOWED_ORIGINS`;
- variáveis da integração Upstash.

Ao trocar uma chave, cadastrar o novo valor diretamente na Vercel, fazer redeploy, testar `/health` e só depois revogar a chave antiga. Nunca copiar a chave para documentação, GitHub ou mensagens.

## 8. Metas operacionais

- **Meta de disponibilidade:** portal e API acessíveis durante aulas e apresentações.
- **Meta de recuperação:** iniciar diagnóstico em até 15 minutos após aviso.
- **Meta de restauração:** recuperar uma versão estável em até 30 minutos quando o GitHub, a Vercel e o DNS estiverem disponíveis.
- **Responsabilidade:** qualquer mudança em produção deve ter commit, testes e backup identificáveis.

Essas metas são referências internas, não garantias contratuais dos serviços gratuitos.

## 9. Contatos e registros

- contato público da escola: `franciscoaraujo@escola.ce.gov.br`;
- telefone público: `(88) 99324-1011`;
- repositório: `https://github.com/paulocunha1009/fabcampo`;
- documentação da API: `backend/DEPLOY_VERCEL.md`;
- domínio e DNS: `DOMINIO_OFICIAL.md`;
- privacidade: `https://fabcampo.com.br/privacidade.html`.

Quando houver incidente, registrar: data e hora, página afetada, mensagem observada, último commit, ação tomada, resultado e responsável pela verificação.
