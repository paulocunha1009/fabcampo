"""Consulta offline dos PDFs obtidos. Não gera respostas nem chama serviços de IA.

Uso: python tools/consultar-pesquisa.py "origem da escola"
Requer pypdf. O índice integral fica em _local, fora do Git público.
"""
import argparse, hashlib, json, re, unicodedata
from pathlib import Path
from pypdf import PdfReader

BASE = Path(__file__).resolve().parents[1] / 'documentos/pesquisa'

def normal(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower()) if not unicodedata.combining(c))

def indexar():
    catalog = json.loads((BASE / 'catalogo.json').read_text(encoding='utf-8'))
    rows = []
    for source in catalog['sources']:
        name = source.get('public_file') or source.get('local_file')
        if not name or not name.endswith('.pdf'):
            continue
        path = BASE / name
        if not path.exists():
            continue
        if hashlib.sha256(path.read_bytes()).hexdigest() != source['sha256']:
            raise ValueError('Arquivo alterado: ' + source['id'])
        for page_number, page in enumerate(PdfReader(path).pages, 1):
            text = page.extract_text() or ''
            if text.strip():
                rows.append({'source_id': source['id'], 'title': source['title'],
                             'url': source['url'], 'pdf_page': page_number, 'text': text})
    dest = BASE / '_local/indice-textual.json'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps({'warning': 'Trechos de pesquisa ainda não validados como fatos do portal. Página é a posição no PDF, não necessariamente a numeração impressa.', 'pages': rows}, ensure_ascii=False), encoding='utf-8')
    return rows

def consultar(question, rows, limit=5):
    stop = {'como', 'qual', 'para', 'sobre', 'quando', 'quem', 'onde', 'quais'}
    terms = set(re.findall(r'\w{4,}', normal(question))) - stop
    ranked = []
    for row in rows:
        text = normal(row['text'])
        hits = sum(term in text for term in terms)
        if hits:
            ranked.append((hits / max(1, len(terms)), row))
    ranked.sort(key=lambda item: item[0], reverse=True)
    result = []
    for score, row in ranked[:limit]:
        text = row['text']
        positions = [normal(text).find(term) for term in terms if term in normal(text)]
        start = max(0, min(positions, default=0) - 180)
        result.append({**{key: value for key, value in row.items() if key != 'text'},
                       'match': round(score, 2), 'excerpt': text[start:start + 1400]})
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pergunta', nargs='?', default='origem escola assentamento')
    args = parser.parse_args()
    rows = indexar()
    print(json.dumps({'mode': 'Pesquisa documental; não é resposta factual validada', 'indexed_pages': len(rows), 'results': consultar(args.pergunta, rows)}, ensure_ascii=False, indent=2))
