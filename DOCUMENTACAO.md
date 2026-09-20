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

### 19.4 Próximos passos de SEO

- **Google Business Profile**: criar perfil em [business.google.com](https://business.google.com) com nome `EEMPC Francisco Araújo Barros`, endereço Assentamento Lagoa do Mineiro, Itarema – CE, telefone (88) 99324-1011 e site `https://fabcampo.com.br`;
- **Google Search Console**: submeter o sitemap em [search.google.com/search-console](https://search.google.com/search-console) após publicar as mudanças de SEO;
- **GA4**: substituir o placeholder `G-XXXXXXXXXX` pelo ID real assim que a propriedade for criada;
- **ALT das fotos da galeria**: melhorar os `alt` das imagens `rolo-01.jpg` a `rolo-05.jpg` quando o conteúdo fotográfico real estiver definido;
- **Schema.org nas páginas internas**: considerar adicionar tipo `Article` nas reportagens quando houver data de publicação e autoria definidos.

