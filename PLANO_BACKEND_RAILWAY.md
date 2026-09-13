# Plano de implantação do backend de IA

## Campo Digital - Portal da Comunidade

> **Documento histórico e substituído.** O Railway não faz parte da produção atual. A decisão executada usa GitHub Pages, Vercel e Upstash. Consulte `DECISOES_IMPLANTACAO_VERCEL.md`, `backend/DEPLOY_VERCEL.md` e `OPERACAO_E_RECUPERACAO.md`. Não execute os passos deste plano como procedimento atual.

Este documento registra o problema atual, a solução proposta e as decisões que a equipe precisa estudar antes de reativar os recursos de inteligência artificial do portal.

> Estado do documento: proposta para discussão da equipe. As configurações no Railway e no Registro.br ainda não foram executadas.

## 1. Situação atual

O site público está funcionando em:

- `https://fabcampo.com.br`
- Hospedagem do frontend: GitHub Pages
- Repositório atual: `paulocunha1009/fabcampo`

O frontend tenta acessar o assistente pelo endereço:

```text
https://portal-da-comunidade-production.up.railway.app/api/assistente
```

Esse endereço atualmente responde com `404 Application not found`. Isso indica que o domínio não está mais ligado a uma aplicação ativa no Railway.

Como consequência, o portal continua abrindo normalmente, mas estes recursos ficam indisponíveis:

- assistente educacional;
- desafios gerados pela Expedição no Território;
- desafio de identificação do Catálogo do Território.

## 2. Por que o GitHub Pages não executa o backend

O GitHub Pages hospeda arquivos estáticos, como HTML, CSS, JavaScript, imagens e JSON. Ele não mantém um servidor Node.js em execução.

Por isso, o projeto precisa de duas partes:

```text
Visitante
   |
   +--> fabcampo.com.br --------> GitHub Pages (site público)
   |
   +--> api.fabcampo.com.br ----> Railway (servidor Node.js)
                                      |
                                      +--> API do Gemini
```

A chave do Gemini deve existir apenas no Railway. Ela nunca deve ser colocada no HTML, JavaScript público ou repositório GitHub.

## 3. Arquitetura proposta

Manter o site no GitHub Pages e hospedar somente o backend no Railway:

| Componente | Endereço proposto | Hospedagem |
|---|---|---|
| Portal | `https://fabcampo.com.br` | GitHub Pages |
| API | `https://api.fabcampo.com.br` | Railway |
| Código do backend | pasta `backend/` | GitHub |
| Chave Gemini | variável privada `GEMINI_API_KEY` | Railway |

### Vantagens

- endereço profissional e fácil de lembrar;
- a chave do Gemini permanece protegida;
- o site continua independente caso a IA fique temporariamente fora do ar;
- o domínio público do Railway pode mudar sem obrigar a alterar o endereço usado pelo portal;
- frontend e backend continuam separados, facilitando manutenção e diagnóstico.

## 4. Decisões que a equipe precisa tomar

Antes da implantação, registrar as respostas:

- Quem será o responsável pela conta e pelo projeto no Railway?
- Quem possui acesso ao DNS de `fabcampo.com.br` no Registro.br?
- Qual conta Google será responsável pela chave Gemini?
- O plano e os limites do Railway atendem ao período da feira e ao uso posterior?
- Qual limite diário ou mensal de uso da IA a equipe considera aceitável?
- Quem será avisado quando o backend apresentar falha?
- O portal deverá oferecer atividades alternativas quando a IA estiver indisponível?

Não compartilhar senhas ou chaves em grupos de mensagens. Os acessos devem ser concedidos individualmente pelas plataformas.

## 5. Preparação no Railway

### 5.1 Criar o serviço

1. Entrar no Railway.
2. Criar um projeto ou abrir o projeto existente.
3. Escolher **Deploy from GitHub repo**.
4. Selecionar `paulocunha1009/fabcampo`.
5. Configurar o diretório raiz do serviço como `backend`.
6. Confirmar o comando de inicialização `npm start`.
7. Configurar a branch de produção usada pela equipe.

O servidor já utiliza a porta fornecida pela variável `PORT`, como exigido pelo Railway.

### 5.2 Variáveis de ambiente

Adicionar no painel do Railway, nunca no GitHub:

```text
GEMINI_API_KEY=<chave privada>
GEMINI_MODEL=<modelo disponível para a conta>
MAX_TOKENS=1500
RATE_LIMIT_PER_MIN=20
ALLOWED_ORIGINS=https://fabcampo.com.br,https://www.fabcampo.com.br
```

Cuidados:

- não copiar a chave para prints, documentos ou mensagens;
- não criar um arquivo `backend/.env` dentro do GitHub;
- se uma chave for exposta, revogá-la e criar outra imediatamente;
- revisar periodicamente consumo e limites da API.

### 5.3 Health check e domínio temporário

1. Configurar o caminho de verificação como `/health`.
2. Fazer o primeiro deploy.
3. Em **Settings > Networking > Public Networking**, gerar um domínio público do Railway.
4. Testar:

```text
https://DOMINIO-GERADO.up.railway.app/health
```

Resposta esperada:

```json
{"ok":true,"model":"...","timestamp":"..."}
```

Só continuar para o domínio personalizado depois que esse teste funcionar.

## 6. Criar `api.fabcampo.com.br`

No serviço do Railway:

1. Abrir **Settings > Networking**.
2. Escolher **Custom Domain**.
3. Informar `api.fabcampo.com.br`.
4. Anotar exatamente os registros CNAME e TXT fornecidos.

No painel do Registro.br:

1. Abrir a zona DNS de `fabcampo.com.br`.
2. Criar o CNAME de `api` apontando para o destino indicado pelo Railway.
3. Criar também o TXT de verificação indicado pelo Railway.
4. Não alterar os registros usados pelo domínio principal e pelo GitHub Pages.
5. Aguardar a validação e o certificado HTTPS.

O Railway informa que CNAME e TXT são necessários para validar o domínio. A ausência do TXT pode fazer o endereço responder com erro 404.

Referências oficiais:

- [Domínios públicos e personalizados no Railway](https://docs.railway.com/networking/domains/working-with-domains)
- [Solução de problemas de domínio e certificado](https://docs.railway.com/networking/troubleshooting/ssl)

## 7. Conectar o portal à nova API

Após `https://api.fabcampo.com.br/health` funcionar, alterar `js/config.js` para:

```js
window.PORTAL_AI_ENDPOINT = 'https://api.fabcampo.com.br/api/assistente';
```

As páginas Expedição e Catálogo derivam desse endereço a rota `/api/atividade`.

Depois da alteração:

1. revisar o código;
2. criar um commit;
3. enviar para as branches publicadas pelo projeto;
4. aguardar o GitHub Pages concluir o deploy;
5. testar em aba anônima.

## 8. Testes de aceite

### Infraestrutura

- [ ] `https://api.fabcampo.com.br/health` responde com status 200.
- [ ] O Railway mostra o deploy como ativo e saudável.
- [ ] A chave Gemini não aparece no GitHub nem no navegador.
- [ ] Requisições vindas de domínio não autorizado são bloqueadas.
- [ ] O certificado HTTPS de `api.fabcampo.com.br` está válido.

### Portal

- [ ] O assistente do portal responde.
- [ ] A Expedição mostra sete paradas.
- [ ] A parada de 1986 gera três questões relacionadas ao acervo.
- [ ] A parada de 1987 permanece sem quiz e sem pontuação.
- [ ] A pergunta aberta devolve um comentário sem nota.
- [ ] O Catálogo carrega nove fichas e seus contadores.
- [ ] A busca por `mangue` encontra Mangue-Vermelho.
- [ ] O filtro `Nativa e medicinal` encontra Aroeira.
- [ ] O desafio do Catálogo não revela o nome antes do palpite.
- [ ] As páginas continuam utilizáveis quando a IA está temporariamente fora do ar.
- [ ] Os testes funcionam no computador e no celular.

## 9. Monitoramento e manutenção

A equipe deve acompanhar:

- logs de erro do Railway;
- reinícios e falhas de deploy;
- consumo e limites do Gemini;
- respostas 429, que indicam excesso de requisições;
- respostas 500, que indicam falha interna ou problema com a chave;
- validade do domínio e do certificado;
- funcionamento do `/health` antes de apresentações.

Antes da feira, testar o sistema em aba anônima e em uma rede diferente da escola.

## 10. Plano de contingência

Se a IA não estiver disponível durante uma apresentação:

- o conteúdo normal do portal permanece acessível;
- o Catálogo continua oferecendo busca, filtros e fichas;
- a Expedição continua exibindo a linha do tempo;
- a equipe pode usar prints ou vídeo previamente gravado dos desafios;
- nunca colocar a chave da API diretamente no navegador como solução rápida.

Uma melhoria futura recomendada é criar desafios locais de reserva, sem IA, para uso durante quedas de internet ou indisponibilidade do serviço.

## 11. Reversão

Antes da implantação das páginas, foi criada a branch remota:

```text
codex/backup-pre-expedicao-catalogo-20260909
```

Ela aponta para o commit anterior:

```text
25badb0a7f84286422a8457a88cba868f29f4979
```

Não apagar essa branch enquanto a equipe estiver avaliando a melhoria. Qualquer reversão deve ser feita por uma pessoa responsável pelo repositório, preferencialmente com um novo commit de reversão, mantendo o histórico registrado.

## 12. Registro da implantação

Preencher durante a execução:

| Item | Registro |
|---|---|
| Responsável pelo Railway | |
| Responsável pelo Registro.br | |
| Data da implantação | |
| Domínio público temporário | |
| Domínio final da API | `api.fabcampo.com.br` |
| Commit publicado | |
| Resultado do health check | |
| Resultado dos testes no computador | |
| Resultado dos testes no celular | |
| Pendências encontradas | |

## 13. Resumo para apresentar à equipe

O portal não será transferido para o Railway. Ele continuará no GitHub Pages usando `fabcampo.com.br`. O Railway hospedará somente o servidor que protege a chave e conversa com o Gemini. A equipe pretende publicar esse servidor em `api.fabcampo.com.br`, testar primeiro o domínio temporário e somente depois apontar o portal para a nova API.
