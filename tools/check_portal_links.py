"""Confere páginas do sitemap e dependências locais, sem acessar a internet."""
import posixpath
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://fabcampo.com.br/'


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'a' and attrs.get('href'):
            self.refs.append((attrs['href'], True))
        elif tag == 'script' and attrs.get('src'):
            self.refs.append((attrs['src'], False))
        elif tag == 'link' and 'stylesheet' in attrs.get('rel', '').split() and attrs.get('href'):
            self.refs.append((attrs['href'], False))


def local_path(url, directory=False):
    parsed = urlsplit(url)
    if parsed.scheme not in ('http', 'https') or parsed.hostname not in ('fabcampo.com.br', 'www.fabcampo.com.br'):
        return None
    path = unquote(parsed.path)
    if path.endswith('/') and not directory:
        path += 'index.html'
    return posixpath.normpath('/' + path.lstrip('/')).lstrip('/')


def check(root):
    errors = []
    visited = set()
    pages = {}
    dependencies = set()

    def require(url, source, directory=False):
        relative = local_path(url, directory)
        if relative is None:
            return None
        current = root
        for part in filter(None, relative.split('/')):
            if not current.is_dir() or part not in {p.name for p in current.iterdir()}:
                errors.append(f'{source}: destino ausente ou com maiúsculas/minúsculas diferentes: {relative}')
                return None
            current = current / part
        if directory:
            if not current.is_dir():
                errors.append(f'{source}: destino não é pasta: {relative}')
            return None
        if not current.is_file():
            errors.append(f'{source}: destino não é arquivo: {relative}')
            return None
        dependencies.add(relative)
        return relative

    def visit(url, source):
        relative = require(url, source)
        if not relative or relative in visited:
            return
        visited.add(relative)
        text = (root / relative).read_text(encoding='utf-8-sig')
        base = urljoin(ORIGIN, relative)
        if relative.endswith('.html'):
            page = Page()
            page.feed(text)
            pages[relative] = page
            for ref, anchor in page.refs:
                target_url = urljoin(base, ref)
                target = require(target_url, relative)
                if not target:
                    continue
                if target.endswith(('.html', '.js', '.mjs', '.css')):
                    visit(target_url, relative)
                fragment = unquote(urlsplit(target_url).fragment)
                if anchor and fragment and target.endswith('.html') and target in pages and fragment not in pages[target].ids:
                    errors.append(f'{relative}: âncora não encontrada: {target}#{fragment}')
        elif relative.endswith(('.js', '.mjs')):
            patterns = [
                r'\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?[\'\"]([^\'\"]+)[\'\"]',
                r'new\s+URL\(\s*[\'\"]([^\'\"]+)[\'\"]\s*,\s*import\.meta\.url',
                r'\bimport\(\s*[\'\"]([^\'\"]+)[\'\"]\s*\)',
            ]
            for pattern_index, pattern in enumerate(patterns):
                for ref in re.findall(pattern, text):
                    if ref.startswith(('.', '/')):
                        dependency = urljoin(base, ref)
                        target = require(dependency, relative, directory=pattern_index == 1 and urlsplit(dependency).path.endswith('/'))
                        if target and target.endswith(('.js', '.mjs', '.css')):
                            visit(dependency, relative)

    sitemap = ElementTree.parse(root / 'sitemap.xml')
    for loc in sitemap.findall('.//{*}loc'):
        if loc.text:
            visit(loc.text.strip(), 'sitemap.xml')
    return sorted(set(errors)), len(pages), len(dependencies)


if __name__ == '__main__':
    errors, pages, dependencies = check(ROOT)
    for error in errors:
        print(error)
    print(f'Verificadas {pages} páginas e {dependencies} arquivos locais referenciados.')
    print('Escopo: links internos, âncoras estáticas, scripts, módulos e folhas de estilo. Imagens e links externos não são validados.')
    raise SystemExit(1 if errors else 0)
