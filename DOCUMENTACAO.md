# Documentação Técnica — Portal da Comunidade

> **Estado atual:** o frontend está no GitHub Pages e o backend oficial está no projeto Vercel `fabcampo-api`, com limites no Upstash. As referências abaixo a backend “opcional”, Render, Railway ou outros provedores são históricas. Para a operação vigente, consulte `OPERACAO_E_RECUPERACAO.md` e `backend/DEPLOY_VERCEL.md`.

Projeto educacional desenvolvido para o Ceará Científico, com foco em memória comunitária, educação do campo, produção agrícola, biodiversidade, plantas medicinais, reportagens escolares e uso responsável de inteligência artificial.

O portal combina um frontend estático em HTML, CSS e JavaScript publicado no GitHub Pages com um backend Node.js publicado na Vercel. O backend conecta o assistente ao Gemini sem expor chaves no navegador e usa Upstash para proteger a cota gratuita.

---

## 1. Visão Geral

### Nome do projeto

**Portal da Comunidade | Ceará Científico**

### Objetivo

Criar uma plataforma digital escolar para:

- registrar a história e a memória da comunidade;
- valorizar saberes do campo;
- organizar conteúdos sobre agricultura, plantas nativas e plantas medicinais;
- publicar reportagens educativas;
- oferecer recursos interativos para estudantes e professores;
- oferecer assistência e atividades educativas com IA, sempre com contingência local.

### Público-alvo

- estudantes;
- professores;
- comunidade escolar;
- moradores da comunidade;
- visitantes do Ceará Científico;
- avaliadores de projetos escolares e científicos.

---

## 2. Tecnologias Utilizadas

### Frontend

- HTML5;
- CSS3;
- JavaScript moderno com módulos ES;
- JSON local para conteúdo dinâmico leve;
- acessibilidade com ARIA, foco visível e mensagens acessíveis;
- layout responsivo para desktop, tablet e celular.

### Backend em produção

- Node.js;
- Express;
- CORS;
- Dotenv;
- Google Gemini API via `@google/genai`;
- Upstash Redis para limites persistentes;
- testes automatizados com Node Test Runner.

### Hospedagem

- GitHub Pages pela branch `master` para o frontend;
- Vercel pela branch `main` para o backend de IA;
- domínio oficial `https://fabcampo.com.br`.

---

## 3. Estrutura de Pastas

```text
fabcampo/
├── index.html
├── contato.html
├── DOCUMENTACAO.md
├── README.md
├── DEPLOY.md
├── data/
│   └── site.json
├── css/
│   ├── portal.css
│   ├── portal-responsivo.css
│   ├── estilo.css
│   └── responsivo.css
├── js/
│   ├── app.js
│   ├── chat-standalone.js
│   ├── config.js
│   ├── config.example.js
│   ├── main.js
│   ├── noticias.js
│   ├── components/
│   │   ├── carrossel.js
│   │   ├── chat-widget.js
│   │   ├── conteudo.js
│   │   ├── formulario.js
│   │   ├── imagens.js
│   │   └── menu.js
│   └── services/
│       └── ai-service.js
├── pages/
│   ├── historia.html
│   ├── memoria.html
│   ├── agricola.html
│   ├── Plantação-Nativa.html
│   ├── Plantas-Medicinaisv2.html
│   ├── mudas.html
│   ├── reportagem-educacao.html
│   ├── reportagem-clima.html
│   ├── materia_ia_educacao_v2.html
│   ├── plantas-do-ceara.html
│   ├── plantasdoceara.html
│   └── Plantas-Medicinais.html
├── img/
│   ├── banner/
│   ├── galeria/
│   ├── icones/
│   └── logo/
└── backend/
    ├── server.js
    ├── package.json
    ├── package-lock.json
    ├── .env.example
    ├── exemplo-openai-proxy.js
    └── README.md
```

---

## 4. Páginas do Projeto

### Páginas principais

| Arquivo | Função |
|---|---|
| `index.html` | Página inicial, hero, rolo de fotos, atalhos, reportagens, notícias, eventos e assistente IA. |
| `contato.html` | Página de contato e envio de contribuição. |

### Páginas internas

| Arquivo | Função |
|---|---|
| `pages/historia.html` | História da comunidade, linha do tempo e registros históricos. |
| `pages/memoria.html` | Memória oral, depoimentos, saberes e relatos da comunidade. |
| `pages/agricola.html` | Produção agrícola, cultivos, práticas sustentáveis e dados do campo. |
| `pages/Plantação-Nativa.html` | Página oficial de plantas nativas, preservação ambiental e biodiversidade regional. |
| `pages/Plantas-Medicinaisv2.html` | Página oficial de plantas medicinais, usos tradicionais e pesquisa escolar responsável. |
| `pages/mudas.html` | Produção de mudas, cultivo, sustentabilidade e educação ambiental. |
| `pages/reportagem-educacao.html` | Reportagem sobre Educação do Campo e Pedagogia da Alternância. |
| `pages/reportagem-clima.html` | Reportagem sobre mudanças climáticas, campo e agricultura. |
| `pages/materia_ia_educacao_v2.html` | Reportagem padronizada sobre IA na Educação. |

### Páginas de redirecionamento

| Arquivo | Função |
|---|---|
| `pages/Plantação Nativa.html` | Redireciona para `Plantação-Nativa.html`. |
| `pages/plantas-do-ceara.html` | Redireciona para `Plantação-Nativa.html`. |
| `pages/plantasdoceara.html` | Redireciona para `Plantação-Nativa.html`. |
| `pages/Plantas Medicinais.html` | Redireciona para `Plantas-Medicinaisv2.html`. |
| `pages/Plantas-Medicinais-02.html` | Redireciona para `Plantas-Medicinaisv2.html`. |
| `pages/Plantas-Medicinais.html` | Redireciona para `Plantas-Medicinaisv2.html`. |

Essas páginas existem para evitar erro 404 caso algum visitante acesse um link antigo.

---

## 5. Arquitetura Visual

O visual principal do portal está concentrado em:

- `css/portal.css`;
- `css/portal-responsivo.css`.

### Padrão visual utilizado

- cores verdes ligadas ao campo, território e natureza;
- tons terrosos e amarelos para identidade regional e energia visual;
- cards com bordas suaves;
- foco em legibilidade;
- layout responsivo;
- botões consistentes;
- menu principal com submenus;
- seções com `container` e `secao`;
- rodapé comum.

### Classes importantes

| Classe | Uso |
|---|---|
| `.cabecalho` | Cabeçalho fixo/sticky do portal. |
| `.logo` / `.logo__imagem` | Marca visual do projeto. |
| `.menu` | Menu principal. |
| `.submenu` | Submenus de Plantas e Reportagens. |
| `.hero` | Hero visual da página inicial e de páginas internas antigas. |
| `.titulo-pagina` | Cabeçalho padrão de páginas internas. |
| `.secao` | Bloco de conteúdo com espaçamento padrão. |
| `.grade-cards` | Grade de cards funcionais. |
| `.grade-dados` | Cards de dados e indicadores. |
| `.artigo-layout` | Layout com conteúdo principal e sidebar. |
| `.artigo-corpo` | Corpo textual de artigos/reportagens. |
| `.artigo-sidebar` | Lateral com cards de resumo. |
| `.imagem-destaque` | Imagem grande com legenda. |
| `.galeria-historica` | Galeria em grade. |
| `.faixa-contribuir` | Chamada final para participação. |
| `.rodape` | Rodapé padrão. |

---

## 6. JavaScript

O arquivo principal é:

```text
js/app.js
```

Ele inicializa os componentes do portal:

```js
prepararImagens();
iniciarMenu();
iniciarFormularioContato();
iniciarCarrosseis();
carregarConteudo();
iniciarChatEducacional();
atualizarAno();
```

### Componentes

| Arquivo | Responsabilidade |
|---|---|
| `js/components/menu.js` | Controla menu mobile, submenus, tecla Escape e página ativa. |
| `js/components/formulario.js` | Validação do formulário de contato e mensagens acessíveis. |
| `js/components/carrossel.js` | Comportamento do rolo de fotos. |
| `js/components/imagens.js` | Esconde imagens com erro quando usam `data-fallback-hidden`. |
| `js/components/conteudo.js` | Carrega `data/site.json` e renderiza notícias, eventos e listas. |
| `js/components/chat-widget.js` | Widget modular do assistente educacional. |
| `js/services/ai-service.js` | Comunicação com o backend de IA. |
| `js/chat-standalone.js` | Assistente flutuante independente usado no portal. |

---

## 7. Conteúdo Dinâmico com JSON

O arquivo:

```text
data/site.json
```

alimenta partes da página inicial e listas leves do portal.

### Estrutura atual

```json
{
  "noticias": [],
  "eventos": [],
  "dicasAgricolas": [],
  "plantasNativas": [],
  "plantasMedicinais": []
}
```

### Onde cada campo aparece

| Campo | Uso |
|---|---|
| `noticias` | Lista de notícias da página inicial. |
| `eventos` | Bloco de eventos do mês. |
| `dicasAgricolas` | Lista de dicas agrícolas. |
| `plantasNativas` | Cards de plantas nativas. |
| `plantasMedicinais` | Cards de plantas medicinais. |

### Exemplo de notícia

```json
{
  "data": "2026-06-13",
  "titulo": "Nova atividade do Ceará Científico",
  "resumo": "Estudantes organizam registros da comunidade para alimentar o portal."
}
```

---

## 8. Imagens e Espaços Prefixados

O portal já possui locais preparados para imagens reais dos estudantes, da escola, da comunidade, das plantações e dos eventos.

### Funcionamento dos placeholders

Algumas imagens ainda podem não existir na pasta. Para evitar quebra visual, os elementos usam:

```html
data-fallback-hidden
```

O script `js/components/imagens.js` esconde a imagem caso o arquivo ainda não exista.

### Principais locais de imagem

| Pasta | Uso |
|---|---|
| `img/banner/` | Banners das páginas e imagens principais. |
| `img/galeria/` | Galerias, rolo de fotos, plantas, registros da comunidade. |
| `img/logo/` | Logo do projeto. |
| `img/icones/` | Ícones e recursos visuais auxiliares. |

### Exemplos de imagens esperadas

```text
img/banner/banner-campo-digital.jpg
img/banner/banner-ia-educacao.jpg
img/galeria/rolo-01.jpg
img/galeria/rolo-02.jpg
img/galeria/ia-escola-01.jpg
img/galeria/ia-escola-02.jpg
img/galeria/ia-escola-03.jpg
```

---

## 9. Menu e Navegação

O menu principal está organizado em áreas:

- Início;
- História;
- Memória;
- Produção Agrícola;
- Plantas;
- Reportagens;
- Contato.

### Submenu Plantas

- Plantação Nativa;
- Plantas Medicinais;
- Cultivando Vida.

### Submenu Reportagens

- Educação do Campo;
- Clima e Campo;
- IA na Educação.

O arquivo `js/components/menu.js` também marca a página atual usando:

```html
data-page
data-page-link
```

Exemplo:

```html
<body data-page="materia-ia">
<a href="materia_ia_educacao_v2.html" data-page-link="materia-ia">IA na Educação</a>
```

---

## 10. Acessibilidade

O projeto possui recursos importantes de acessibilidade:

- link "Pular para o conteúdo";
- foco visível com `:focus-visible`;
- botões com `aria-expanded`;
- menu com `aria-label`;
- submenus navegáveis por teclado;
- fechamento do menu com tecla `Escape`;
- textos alternativos em imagens;
- mensagens de formulário acessíveis;
- estrutura semântica com `header`, `main`, `section`, `article`, `aside` e `footer`.

### Recomendações de manutenção

- Toda imagem deve ter `alt` descritivo.
- Botões devem ter texto claro.
- Não usar texto importante apenas dentro de imagem.
- Manter contraste suficiente entre texto e fundo.
- Testar navegação pelo teclado.
- Validar formulários com mensagens claras.

---

## 11. Assistente de IA

O assistente educacional está ativo em produção e atende também às atividades do Catálogo e da Expedição.

### No frontend

Arquivos relacionados:

```text
js/chat-standalone.js
js/components/chat-widget.js
js/services/ai-service.js
js/config.js
js/config.example.js
```

O frontend nunca deve armazenar chave de API.

### No backend

Pasta:

```text
backend/
```

Arquivos principais:

| Arquivo | Função |
|---|---|
| `backend/server.js` | Servidor Express que conversa com a API Gemini. |
| `backend/.env.example` | Modelo das variáveis de ambiente. |
| `backend/package.json` | Dependências e scripts do backend. |
| `backend/README.md` | Instruções específicas do backend. |

### Segurança

A chave da API deve ficar somente no backend:

```text
backend/.env
```

Esse arquivo não deve ser enviado ao GitHub.

### Endpoint esperado pelo frontend

```js
window.PORTAL_AI_ENDPOINT = "https://fabcampo-api.vercel.app/api/assistente";
```

Quando o endpoint, a chave ou a cota gratuita não está disponível, o portal usa respostas e atividades locais de contingência. As conversas não são armazenadas pelo projeto.

---

## 12. Como Rodar Localmente

Por ser um site estático, é possível abrir `index.html` diretamente no navegador. Porém, para testar `fetch` de JSON e módulos JavaScript com mais segurança, recomenda-se rodar um servidor local.

### Opção com Python

Na raiz do projeto:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

### Backend de IA

Na pasta `backend/`:

```bash
npm install
npm start
```

Servidor padrão:

```text
http://localhost:3001
```

Teste:

```text
http://localhost:3001/health
```

---

## 13. Deploy no GitHub Pages

O projeto é compatível com GitHub Pages porque:

- usa arquivos estáticos;
- não depende de build;
- possui `.nojekyll`;
- usa caminhos relativos;
- mantém CSS e JS dentro da própria pasta do projeto.

### Configuração oficial

1. Repositório: `paulocunha1009/fabcampo`.
2. Em **Settings > Pages**, publicar a branch `master` e a pasta `/ (root)`.
3. Manter o arquivo `CNAME` com `fabcampo.com.br`.
4. Sincronizar `main` e `master` após cada publicação validada.
5. Confirmar o deploy na aba **Actions** e testar o domínio oficial.

URL esperada:

```text
https://fabcampo.com.br
```

O processo completo de backup, publicação e reversão está em `OPERACAO_E_RECUPERACAO.md`.

---

## 14. Convenções de Código

### HTML

- usar `lang="pt-BR"`;
- manter `meta charset="UTF-8"`;
- usar títulos claros;
- manter `body data-page`;
- usar cabeçalho e rodapé padrão;
- preferir classes já existentes no `portal.css`.

### CSS

- concentrar estilos principais em `portal.css`;
- concentrar responsividade em `portal-responsivo.css`;
- evitar estilos inline;
- evitar criar layout totalmente diferente para páginas novas;
- reaproveitar componentes como cards, seções, artigo e sidebar.

### JavaScript

- manter lógica modular em `js/components/`;
- evitar código duplicado nas páginas HTML;
- não colocar chaves de API no frontend;
- validar dados antes de renderizar.

### Imagens

- usar nomes simples e descritivos;
- preferir `.jpg` para fotos;
- usar `.png` para logos ou imagens com transparência;
- compactar imagens antes de publicar;
- manter textos alternativos.

---

## 15. Manutenção de Conteúdo

### Adicionar notícia

Editar `data/site.json`:

```json
{
  "data": "2026-06-13",
  "titulo": "Título da notícia",
  "resumo": "Resumo curto da notícia."
}
```

### Adicionar evento

Editar `data/site.json`:

```json
{
  "data": "2026-06-20",
  "nome": "Nome do evento",
  "descricao": "Descrição curta do evento."
}
```

### Trocar imagem

1. Verificar o caminho indicado no HTML.
2. Salvar a imagem na pasta correta.
3. Manter o mesmo nome do arquivo.
4. Atualizar o `alt` se necessário.

Exemplo:

```text
img/galeria/rolo-01.jpg
```

---

## 16. Pontos de Atenção

- Alguns arquivos antigos ainda existem por compatibilidade, como `estilo.css`, `responsivo.css`, `main.js` e páginas de redirecionamento.
- O padrão visual atual está em `portal.css` e `portal-responsivo.css`.
- Para novas páginas, o ideal é copiar a estrutura de uma página já padronizada, como `materia_ia_educacao_v2.html`, `agricola.html` ou `memoria.html`.
- Não remover páginas de redirecionamento sem verificar se há links antigos publicados.
- Não subir `backend/.env` para o GitHub.
- Evitar nomes de arquivo com acentos em novos arquivos, mesmo que os atuais funcionem.

---

## 17. Roadmap Técnico

### Curto prazo

- criar imagens reais para todos os placeholders;
- revisar todos os textos finais com professores e estudantes;
- revisar com participantes as legendas automáticas do vídeo de memória;
- manter os testes no GitHub Pages após cada alteração.

### Médio prazo

- criar painel simples para edição de notícias e eventos;
- melhorar busca interna;
- criar páginas individuais para notícias;
- adicionar filtros por tema;
- ampliar quizzes educativos;
- criar modo de alto contraste.

### Longo prazo

- criar assistente que recomende conteúdos do próprio portal;
- criar dashboard do projeto científico;
- registrar métricas de participação;
- criar versão PWA para acesso offline.

---

## 18. Resumo para Apresentação

O FabCampo — Campo Digital é uma plataforma educacional do Ceará Científico construída com HTML, CSS e JavaScript, com backend Node.js seguro. O projeto valoriza a cultura regional, a educação do campo, a memória comunitária e a inovação tecnológica. Ele possui páginas informativas, reportagens, galerias, conteúdo dinâmico em JSON, Expedição interativa, Catálogo do Território e assistente de IA ativo com contingência local.

Além de ser um site, o portal funciona como produto pedagógico: estudantes podem alimentar o conteúdo, registrar saberes locais, produzir reportagens, organizar dados científicos e aprender práticas modernas de desenvolvimento web.

---

## 19. SEO Técnico

Implementação de SEO técnico realizada em setembro de 2026 em todas as páginas públicas do portal.

### 19.1 O que foi feito

#### Título (`<title>`)

Todas as páginas seguem o padrão:

```
[Tema da Página] | EEMPC Francisco Araújo Barros
```

Exemplos:
- `EEMPC Francisco Araújo Barros | Escola do Campo em Itarema-CE` (homepage)
- `História da Comunidade | EEMPC Francisco Araújo Barros`
- `Produção Agrícola | EEMPC Francisco Araújo Barros`

#### Meta description

Cada página tem uma descrição única de até ~160 caracteres que menciona o nome da escola, a localização (Assentamento Lagoa do Mineiro, Itarema – CE) e o tema da página.

#### Meta robots

Adicionada em todas as páginas:

```html
<meta name="robots" content="index, follow">
```

#### Open Graph

Tags adicionadas em todas as páginas públicas:

```html
<meta property="og:type" content="website">         <!-- ou "article" para reportagens -->
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="https://fabcampo.com.br/...">
<meta property="og:image" content="https://fabcampo.com.br/img/banner/campo-digital-banner-1280.webp">
<meta property="og:site_name" content="Campo Digital – EEMPC Francisco Araújo Barros">
```

Isso garante que ao compartilhar links nas redes sociais (WhatsApp, Instagram, Facebook, Twitter/X) a prévia do link mostre título, descrição e imagem corretos.

#### Schema.org JSON-LD (homepage)

Adicionado apenas na `index.html`, tipo `School`:

```json
{
  "@context": "https://schema.org",
  "@type": "School",
  "name": "EEMPC Francisco Araújo Barros",
  "url": "https://fabcampo.com.br/",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Assentamento Lagoa do Mineiro, S/N",
    "addressLocality": "Itarema",
    "addressRegion": "CE",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -3.025485,
    "longitude": -39.7533477
  },
  "telephone": "+55 88 99324-1011",
  "email": "franciscoaraujo@escola.ce.gov.br",
  "sameAs": [
    "https://www.instagram.com/francisco_barros_escola/",
    "https://www.google.com/maps/place/E.E.M.+Francisco+Araújo+Barros/..."
  ]
}
```

#### Google Analytics 4 (GA4)

Snippet adicionado em todas as páginas com placeholder `G-XXXXXXXXXX`. Para ativar o monitoramento real:

1. Acesse [analytics.google.com](https://analytics.google.com)
2. Crie uma propriedade GA4 para `fabcampo.com.br`
3. O sistema gera o ID no formato `G-XXXXXXXXXX`
4. Substitua **todas** as ocorrências de `G-XXXXXXXXXX` pelo ID real — são 2 por arquivo (no `src` do script e no `gtag('config', ...)`)

#### robots.txt

Já existia e estava correto. Referencia o sitemap e libera todos os bots:

```
User-agent: *
Allow: /
Sitemap: https://fabcampo.com.br/sitemap.xml
```

#### sitemap.xml

Atualizado com `<changefreq>` e `<priority>` em todas as 14 URLs. `lastmod` da homepage atualizado para a data mais recente.

### 19.2 Páginas com SEO implementado

| Arquivo | Title | Description | robots | Open Graph | GA4 |
|---|:---:|:---:|:---:|:---:|:---:|
| `index.html` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `contato.html` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pages/historia.html` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pages/memoria.html` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pages/agricola.html` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pages/reportagem-educacao.html` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pages/reportagem-clima.html` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pages/expedicao.html` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pages/materia_ia_educacao_v2.html` | ✅ | ✅ | ✅ | ✅ | ✅ |

### 19.3 O que não foi alterado

- identidade visual, cores e estrutura HTML/CSS intactos;
- nenhum keyword stuffing introduzido;
- nenhum ID de medição inventado — GA4 usa placeholder explícito;
- nenhum endereço, telefone ou coordenada inventado — todos os dados vêm do próprio site;
- o `canonical` que já existia foi mantido.

### 19.4 Google Analytics 4 — configuração concluída (20/09/2026)

- Propriedade GA4 criada em [analytics.google.com](https://analytics.google.com) com nome **Campo Digital – EEMPC Francisco Araújo Barros**
- Domínio: `fabcampo.com.br` | Stream ID: `15811898372`
- ID de medição real obtido: **`G-D56GE991YS`**
- Substituído em todos os 9 arquivos HTML (27 ocorrências no total)
- Branch `master` sincronizado com `main` para que o deploy no GitHub Pages refletisse as mudanças

### 19.5 Google Search Console — configuração concluída (20/09/2026)

- Propriedade adicionada: `https://fabcampo.com.br/`
- Método de verificação: **Google Analytics** (aproveitou o código GA4 já presente nas páginas)
- Status: **Propriedade verificada** com sucesso
- Sitemap submetido: `https://fabcampo.com.br/sitemap.xml`
- Resultado imediato: **14 páginas encontradas e processadas**
- O Google vai rastrear e indexar as páginas progressivamente; primeiros resultados esperados em dias a semanas

### 19.6 Próximos passos de SEO

- **Google Business Profile**: criar perfil em [business.google.com](https://business.google.com) com nome `EEMPC Francisco Araújo Barros`, endereço Assentamento Lagoa do Mineiro, Itarema – CE, telefone (88) 99324-1011 e site `https://fabcampo.com.br`;
- **ALT das fotos da galeria**: melhorar os `alt` das imagens `rolo-01.jpg` a `rolo-05.jpg` quando o conteúdo fotográfico real estiver definido;
- **Schema.org nas páginas internas**: considerar adicionar tipo `Article` nas reportagens quando houver data de publicação e autoria definidos.

---

## 20. Organização Financeira Rural

Implementação concluída em 27 de setembro de 2026 para ampliar a pesquisa **Mudanças Climáticas Ameaçam o Futuro do Campo** com uma ferramenta educativa prática. A solução foi criada para famílias produtoras, estudantes e educadores, priorizando pessoas com pouca familiaridade com planilhas e o uso pelo celular.

### 20.1 Objetivos

- organizar entradas, despesas e valores reservados;
- relacionar custos e receitas com as culturas registradas;
- registrar produção esperada, produção realizada e perdas climáticas;
- apoiar a criação de reserva de emergência e metas da família ou da produção;
- apresentar os resultados em indicadores e gráficos automáticos;
- permitir o uso no Microsoft Excel e a importação no Google Planilhas;
- oferecer orientação visual suficiente para reduzir a necessidade de treinamento presencial.

### 20.2 Integração no portal

A seção principal foi adicionada a:

```text
pages/reportagem-clima.html#organizacao-financeira-rural
```

Ela contém:

- apresentação da ferramenta;
- imagem do painel financeiro;
- três passos resumidos: baixar, preencher e acompanhar;
- botão para baixar a planilha;
- botão para abrir o manual;
- aviso de uso responsável e proteção de dados pessoais.

A página `pages/agricola.html` recebeu um card de acesso que encaminha o visitante diretamente para essa seção. Os cards de dados, cultivos e soluções da reportagem também foram reorganizados para melhorar alinhamento, distribuição e leitura em telas grandes e pequenas.

### 20.3 Arquivos publicados

Arquivos disponíveis para o visitante:

```text
downloads/organizacao-financeira/
├── Planilha_Organizacao_Financeira_Rural_Campo_Digital_2026.xlsx
├── Manual_Planilha_Organizacao_Financeira_Rural_Campo_Digital.pdf
└── preview-painel-planilha.png
```

Cópias de preservação usadas pela equipe:

```text
materiais/organizacao-financeira/
├── Planilha_Organizacao_Financeira_Rural_Campo_Digital_2026.xlsx
└── Manual_Planilha_Organizacao_Financeira_Rural_Campo_Digital.pdf
```

As cópias de `downloads/` e `materiais/` devem permanecer idênticas. A pasta `downloads/` é a origem dos links públicos; `materiais/` mantém uma cópia organizada para preservação e manutenção.

### 20.4 Estrutura da planilha

A planilha possui seis abas:

1. `Painel` — indicadores e gráficos automáticos;
2. `Comece aqui` — identificação e instruções iniciais;
3. `Lançamentos` — receitas, despesas e reservas;
4. `Safra e clima` — produção esperada, realizada e perdas;
5. `Metas e reserva` — reserva de emergência e objetivos;
6. `Sobre o projeto` — identificação, finalidade educativa e créditos da ferramenta.

Características técnicas:

- quatro gráficos interativos;
- fórmulas para totais, saldos, custos, perdas e metas;
- listas de seleção para reduzir erros de digitação;
- campos amarelos destinados ao preenchimento;
- campos calculados identificados por outra cor;
- proteção aplicada nas seis abas;
- fórmulas e células críticas bloqueadas para impedir alterações acidentais;
- campos necessários ao usuário mantidos editáveis.

A proteção existe para evitar que o usuário apague fórmulas e interrompa os cálculos, o Painel ou os gráficos. Ela não substitui uma cópia de segurança. A informação administrativa usada para manutenção não deve ser colocada no manual público.

### 20.5 Compatibilidade com Google Planilhas

O arquivo `.xlsx` pode ser aberto no aplicativo Google Planilhas. O fluxo recomendado é:

1. instalar o Google Planilhas pela loja oficial do celular;
2. baixar o arquivo pelo portal;
3. abrir o arquivo no aplicativo;
4. salvar uma cópia antes do primeiro preenchimento;
5. preencher somente os campos amarelos;
6. consultar o Painel e os gráficos;
7. manter uma cópia separada para cada período de uso.

Importante: a proteção de células do Excel pode não ser preservada da mesma maneira após a conversão para o formato nativo do Google Planilhas. A equipe responsável deve configurar uma vez, pelo computador, as opções **Dados > Proteger páginas e intervalos**, definindo quais pessoas podem alterar as fórmulas e os campos críticos. O aplicativo de celular é o meio principal de preenchimento, mas não oferece toda a configuração administrativa de proteção.

### 20.6 Manual visual

O manual foi redesenhado com a identidade visual do Campo Digital e possui 12 páginas. A linguagem foi simplificada sem retirar as informações necessárias.

Conteúdo abordado:

- visão geral do caminho completo;
- instalação do Google Planilhas;
- download pelo portal;
- abertura do arquivo e criação de uma cópia;
- significado das cores e das abas;
- preenchimento pelo celular;
- registro de entradas e saídas;
- registro de safra e impactos climáticos;
- leitura do Painel e dos gráficos;
- criação de reserva e meta;
- explicação dos campos bloqueados;
- cuidados diante de erros e orientação para voltar ao arquivo original.

Foram usados prints reais das principais abas da planilha e telas ilustrativas de celular. O manual orienta o usuário a preencher somente os campos amarelos e explica que os demais campos estão bloqueados para preservar o funcionamento da ferramenta. Informações administrativas de senha não são apresentadas ao usuário.

### 20.7 Scripts de manutenção

Os materiais podem ser atualizados pelos seguintes arquivos:

```text
tools/build_finance_materials.py
tools/build_finance_manual.py
tools/update_finance_workbook.mjs
tools/render_finance_workbook.mjs
```

Responsabilidade de cada arquivo:

- `build_finance_materials.py`: gera a estrutura, fórmulas, estilos e gráficos da planilha;
- `build_finance_manual.py`: gera o manual visual em PDF e copia a versão pública;
- `update_finance_workbook.mjs`: aplica a proteção das abas sem remover gráficos e outros recursos nativos;
- `render_finance_workbook.mjs`: renderiza as abas para inspeção visual e verifica erros de fórmula.

Ao modificar a planilha, conferir se o processo de geração não remove gráficos, validações ou proteções. Depois de gerar os arquivos, comparar as cópias de `downloads/` e `materiais/` por hash ou tamanho e conteúdo.

### 20.8 Testes realizados

Antes da publicação foram executadas as seguintes verificações:

- renderização e inspeção visual das 12 páginas do manual;
- confirmação de que não existem páginas vazias, textos cortados ou conteúdo sobreposto;
- verificação das seis abas protegidas;
- confirmação dos quatro gráficos no arquivo XLSX;
- busca por erros de fórmulas conhecidos;
- verificação de todos os caminhos `href` e `src` nas páginas alteradas;
- teste responsivo em viewport de 390 px;
- confirmação de ausência de rolagem horizontal no celular;
- confirmação de cards e botões em uma coluna no celular;
- teste dos três arquivos públicos com resposta HTTP 200;
- download da planilha e do manual no domínio oficial;
- comparação SHA-256 entre os arquivos publicados e os arquivos locais;
- execução dos cinco testes automatizados do backend, todos aprovados.

### 20.9 Cuidados com Git

O arquivo `.gitattributes` classifica os formatos abaixo como binários:

```gitattributes
*.pdf binary
*.xlsx binary
*.png binary
```

Essa configuração evita conversões de quebra de linha que poderiam corromper o PDF, a planilha ou a imagem durante operações do Git.

Publicação realizada em:

- `main`: commit `0025587` — `feat: publicar organizacao financeira rural`;
- `master`: commit `4b2f1d4` — conteúdo equivalente aplicado sobre o histórico próprio da branch.

As árvores publicadas nas duas branches foram comparadas antes do envio e estavam idênticas.

### 20.10 Atualizações de autoria

Nas páginas e no contexto usado pelo assistente, o nome **Alana dos Santos Felix** foi substituído por **Ana Clara Nascimento Alves**. A alteração foi aplicada nas referências da reportagem, nos créditos, no texto narrativo e no contexto do backend.

Para alterações futuras de nomes, pesquisar primeiro em todo o repositório e revisar páginas, créditos, dados estruturados e conteúdo usado pelo assistente.

## 21. SabIA — Inteligência do Território

### 21.1 Objetivo

O assistente do Campo Digital recebeu uma identidade própria: **SabIA — Inteligência do Território**.

Lema oficial:

> Uma inteligência que aprende com o território para ajudar a aprender, pesquisar e transformar.

SabIA é apresentado como um personagem masculino, acolhedor e ligado à pesquisa escolar, à Educação do Campo e aos saberes do Assentamento Lagoa do Mineiro. O símbolo inicial é o pássaro `🐦`, escolhido pela relação direta com o nome sabiá, com a voz e com o território. O emoji poderá ser substituído futuramente por uma ilustração autoral sem alterar o nome ou o comportamento do assistente.

### 21.2 Sprint 1 — Identidade e interface

Alterações implementadas:

- botão flutuante renomeado para **Fale com o SabIA**;
- símbolo do robô substituído pelo pássaro `🐦`;
- cabeçalho com nome, subtítulo **Inteligência do Território** e estado **Disponível para ajudar**;
- apresentação inicial com o lema oficial;
- abas reorganizadas em **Perguntar**, **Aprender**, **Quiz** e **Explorar**;
- inclusão de botões rápidos para ajudar quem não sabe o que perguntar;
- identidade visual integrada às cores verdes, aos cartões e aos cantos arredondados do portal;
- manutenção dos avisos de privacidade e da navegação por teclado.

### 21.3 Sprint 2 — Apresentação dinâmica por página

O widget lê apenas o caminho público da página atual e adapta a mensagem inicial. Nenhum dado pessoal do visitante é usado ou armazenado.

Contextos previstos:

- início: apresentação geral do Campo Digital;
- História e Memória: linha do tempo, personagens e luta da comunidade;
- Produção Agrícola: cultivos, COPAGLAM e organização financeira;
- Mudanças Climáticas: impactos, dados da pesquisa e quiz;
- Plantas Medicinais: espécies, usos tradicionais e cuidados;
- Plantação Nativa, Catálogo e Mudas: espécies, biomas e biodiversidade;
- Educação do Campo: Alternância, Místicas e relação escola-comunidade;
- Expedição: marcos históricos e orientação da experiência.

Cada contexto oferece três ações iniciais relacionadas ao conteúdo aberto. As ações enviam perguntas completas ao SabIA, mas mostram ao visitante apenas rótulos simples e objetivos.

### 21.4 Sprint 3 — Personalidade e segurança no backend

O prompt principal do backend determina que o SabIA:

- fale em português brasileiro e com linguagem acessível;
- use formas masculinas ao falar de si mesmo;
- seja acolhedor, curioso, respeitoso e encorajador;
- diferencie informações do acervo de conhecimento geral;
- não invente fatos, pessoas, datas, números, fontes ou páginas;
- ajude o estudante a compreender e pesquisar, sem assumir autoria indevida de trabalhos;
- não afirme que aprende ou guarda dados pessoais do visitante;
- trate plantas medicinais como saber tradicional documentado, sem prescrever tratamentos;
- recuse pedidos perigosos ou envolvendo dados pessoais e ofereça alternativa educativa segura.

O endpoint `/health` passa a informar também o nome e o lema públicos do assistente. Nenhuma chave ou configuração secreta é exposta.

### 21.5 Sprint 4 — Continuidade sem conexão

O acervo local continua disponível quando a API ou a cota externa estiver temporariamente indisponível. A mensagem de contingência foi reescrita na identidade do SabIA e orienta o visitante para História, Plantas, Produção Agrícola, Clima, Educação e navegação no portal.

Essa estratégia evita que uma falha externa deixe o widget sem resposta durante aulas ou apresentações.

### 21.6 Arquivos principais

```text
js/chat-standalone.js
css/portal.css
backend/server.js
backend/test/api.test.js
js/components/chat-widget.js
js/services/ai-service.js
```

O arquivo `chat-standalone.js` é o widget efetivamente carregado pelas páginas atuais. O componente modular foi atualizado na identidade textual para impedir que uma futura reutilização recupere o nome antigo.

### 21.7 Validação prevista antes da publicação

- validar sintaxe dos arquivos JavaScript;
- executar todos os testes automatizados do backend;
- conferir apresentação na página inicial e em páginas temáticas;
- testar os quatro modos do widget;
- testar os botões rápidos;
- testar teclado, fechamento por `Esc` e foco do campo;
- verificar visual em desktop e celular;
- confirmar que não existe rolagem horizontal;
- testar resposta real da API e fallback local;
- publicar primeiro em ambiente de validação e somente depois promover à produção.

### 21.8 Resultado da validação local da sprint

Validação executada em 27 de setembro de 2026:

- sintaxe aprovada em `chat-standalone.js`, `chat-widget.js`, `ai-service.js` e `server.js`;
- cinco testes automatizados do backend aprovados;
- apresentação geral conferida na página inicial;
- apresentação contextual conferida na reportagem de mudanças climáticas;
- atalho **Entender os impactos** enviou a pergunta e recebeu resposta válida da API;
- modos **Perguntar**, **Aprender**, **Quiz** e **Explorar** exibidos corretamente;
- viewport móvel validado sem rolagem horizontal (`scrollWidth` igual à largura útil);
- cache dos arquivos `portal.css` e `chat-standalone.js` atualizado nas páginas para a versão `20260927-1`;
- fallback local preservado;
- nenhum segredo foi adicionado ao código ou à documentação.

Nesta etapa, as alterações permanecem para validação visual local antes da publicação nas branches e da promoção do backend no Vercel.

### 21.9 Texto oficial de apresentação

Apresentação geral exibida ao abrir o painel:

> 🐦 Olá! Eu sou o SabIA.<br>
> Estou aqui para ajudar você a aprender, pesquisar e descobrir os saberes do nosso território.<br>
> Uma inteligência que aprende com o território para ajudar a aprender, pesquisar e transformar.

O texto contextual substitui apenas a segunda frase. O nome, o símbolo e o lema permanecem constantes para fortalecer o reconhecimento da identidade.

No celular, o botão mostra apenas o símbolo para economizar espaço. O nome completo permanece disponível no rótulo acessível e aparece no cabeçalho quando o painel é aberto.

### 21.10 Funcionamento dos modos

**Perguntar**

- envia a pergunta digitada sem acrescentar instruções invisíveis;
- atende dúvidas sobre o acervo e perguntas educacionais gerais;
- mantém no máximo as 30 últimas mensagens no navegador e envia ao backend somente as 20 últimas entradas válidas.

**Aprender**

- acrescenta ao pedido a orientação para explicar de forma simples;
- solicita exemplo ligado ao território sempre que isso fizer sentido;
- foi pensado para estudantes e visitantes que precisam de uma explicação inicial.

**Quiz**

- transforma o tema digitado em pedido de três perguntas;
- oferece cinco temas rápidos: História, Plantas Medicinais, Produção Agrícola, Educação e Plantas Nativas;
- aceita de duas a cinco questões retornadas pelo backend;
- mostra resposta correta, explicação e pontuação ao final;
- possui questionários locais para os temas principais caso a API esteja indisponível.

**Explorar**

- transforma a busca em recomendação de páginas internas;
- restringe os links exibidos à mesma origem e a caminhos terminados em `.html`;
- impede que uma resposta externa crie links para destinos não autorizados.

### 21.11 Fluxo técnico

```text
Visitante abre uma página
        ↓
chat-standalone.js identifica somente o caminho público da página
        ↓
SabIA apresenta texto e três atalhos relacionados ao conteúdo
        ↓
Visitante escolhe um atalho ou digita uma pergunta
        ↓
Frontend envia mensagem e histórico limitado para /api/assistente
        ↓
Backend aplica CORS, tamanho máximo e limitador persistente no Redis
        ↓
Gemini recebe a personalidade do SabIA e o contexto editorial do portal
        ↓
Resposta JSON é validada e exibida como mensagem, quiz ou recomendação
        ↓
Se a API falhar, o acervo local assume a resposta
```

A chave do Gemini permanece exclusivamente no Vercel. O navegador conhece apenas o endereço público da API.

### 21.12 Acessibilidade e experiência móvel

- nomes acessíveis atualizados para **SabIA, assistente educacional do Campo Digital**;
- botão flutuante com `aria-expanded` e vínculo com o painel;
- painel identificado como diálogo;
- mensagens novas anunciadas por `aria-live="polite"`;
- abas com papéis e estados de seleção;
- fechamento por botão e tecla `Esc`;
- foco direcionado ao campo quando o painel é aberto;
- botões rápidos utilizáveis pelo teclado;
- largura móvel limitada à área visível;
- aviso de privacidade mantido no rodapé do painel.

### 21.13 Cache e páginas alcançadas

Para evitar que o navegador continue mostrando a identidade antiga, as referências foram atualizadas para:

```text
css/portal.css?v=20260927-1
js/chat-standalone.js?v=20260927-1
```

A atualização foi aplicada à página inicial, Contato, Privacidade e páginas temáticas que utilizam `portal.css` ou o widget. Páginas que não carregam o widget também receberam a versão atual da folha de estilos para preservar consistência visual e facilitar manutenção.

### 21.14 Publicação segura

Sequência recomendada depois da aprovação visual:

1. confirmar que a API pública atual continua saudável;
2. enviar o commit aprovado para `main`;
3. aguardar o Vercel concluir o novo deploy com estado **Ready**;
4. testar `/health` no endereço temporário do deploy;
5. promover o deploy para `fabcampo-api.vercel.app` somente após o teste;
6. conferir o nome `SabIA` e o lema retornados por `/health`;
7. testar uma pergunta real pelo domínio oficial;
8. sincronizar o mesmo conteúdo na branch `master`;
9. conferir os logs do Vercel e a ausência de erros;
10. registrar os commits publicados nesta seção.

O deploy do frontend e a promoção do backend devem ser tratados como uma única entrega, pois o novo comportamento depende tanto do widget quanto do prompt do servidor.

### 21.15 Plano de retorno

Se surgir problema após a publicação:

1. manter o portal acessível — o fallback local continuará respondendo aos temas principais;
2. verificar `/health` e os logs do Vercel;
3. promover novamente o último deploy estável no painel do Vercel;
4. reverter somente o commit do SabIA se o problema estiver no frontend;
5. não apagar chaves, Redis ou domínios durante o diagnóstico;
6. repetir os testes antes de uma nova promoção.

O ponto estável anterior à personalização é o commit `134e4e0`, que contém a correção de capacidade da IA para a apresentação. A implementação local do SabIA está registrada no commit `d347103`.

### 21.16 Estado atual e próximos passos

Estado em 27 de setembro de 2026:

- implementação funcional concluída localmente;
- documentação funcional e técnica concluída;
- commit local: `d347103` — `feat: apresentar SabIA inteligencia do territorio`;
- servidor local disponível em `http://127.0.0.1:4173/index.html` durante a sessão de validação;
- alterações ainda não enviadas às branches remotas;
- Vercel ainda executando a personalidade anterior até a aprovação e publicação.

Melhorias futuras que não bloqueiam a primeira versão:

- substituir o emoji por avatar masculino autoral do SabIA;
- produzir variações reduzida e monocromática do avatar;
- adicionar perguntas rápidas específicas para mais páginas;
- criar testes automatizados de interface para abertura, abas e atalhos;
- medir apenas eventos anônimos de uso, caso a escola aprove essa coleta;
- revisar periodicamente os dados do acervo usados no prompt.

O avatar futuro deve manter o pássaro como assinatura visual, usar as cores verde, azul e amarelo do Campo Digital e evitar aparência de fotografia real. A ilustração precisa funcionar em 24 px no botão, 42 px no cabeçalho e em tamanhos maiores para materiais de apresentação.

