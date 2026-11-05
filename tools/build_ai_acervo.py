"""Gera uma cópia consultável do conteúdo público; não valida sua veracidade."""
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    ('História', 'pages/historia.html'),
    ('Memória', 'pages/memoria.html'),
    ('Produção Agrícola', 'pages/agricola.html'),
    ('Educação do Campo', 'pages/reportagem-educacao.html'),
    ('Mudanças Climáticas', 'pages/reportagem-clima.html'),
    ('Plantas Nativas', 'pages/Plantação-Nativa.html'),
    ('Plantas Medicinais', 'pages/Plantas-Medicinaisv2.html'),
    ('Inteligência Artificial na Educação', 'pages/materia_ia_educacao_v2.html'),
    ('Expedição', 'pages/expedicao.html'),
    ('Catálogo do Território', 'pages/catalogo.html'),
]


class Content(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.main = False
        self.skip = 0
        self.block = None
        self.parts = []
        self.blocks = []
        self.section = ''

    def handle_starttag(self, tag, attrs):
        if tag == 'main':
            self.main = True
        if tag in ('script', 'style', 'nav', 'aside', 'form'):
            self.skip += 1
        if self.main and not self.skip and tag in ('h1', 'h2', 'h3', 'p', 'li', 'figcaption') and self.block is None:
            self.block, self.parts = tag, []

    def handle_data(self, text):
        if self.main and not self.skip and self.block:
            self.parts.append(text)

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'aside', 'form'):
            self.skip = max(0, self.skip - 1)
        if tag == self.block:
            text = ' '.join(' '.join(self.parts).split())
            if tag in ('h1', 'h2', 'h3'):
                self.section = text
            elif len(text) >= 35:
                self.blocks.append({'section': self.section, 'text': text})
            self.block = None
        if tag == 'main':
            self.main = False


def extract_page(title, url):
    raw = (ROOT / url).read_bytes().replace(b'\r\n', b'\n')
    parser = Content()
    parser.feed(raw.decode('utf-8'))
    if not parser.blocks:
        raise ValueError(f'Nenhum trecho público extraído: {url}')
    return {'title': title, 'url': url,
            'sha256': hashlib.sha256(raw).hexdigest(), 'chunks': parser.blocks}


pages = [extract_page(title, url) for title, url in PAGES]
dest = ROOT / 'backend/data/acervo.json'
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps({'version': 1, 'pages': pages}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Acervo atualizado: {len(pages)} páginas, {sum(len(p["chunks"]) for p in pages)} trechos.')

# A busca pública usa os mesmos trechos e inclui também a página do viveiro.
# Não adiciona fontes externas nem dados digitados pelos visitantes.
search_pages = pages + [extract_page('Cultivando Vida', 'pages/mudas.html')]
search_dest = ROOT / 'data/busca.json'
search_dest.write_text(json.dumps({'version': 1, 'pages': search_pages}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'Índice de busca atualizado: {len(search_pages)} páginas.')
