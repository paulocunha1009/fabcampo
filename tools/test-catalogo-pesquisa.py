"""Verifica integridade e separação entre originais públicos e cópias locais."""
import hashlib, json, unittest
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / 'documentos/pesquisa'

class CatalogoTest(unittest.TestCase):
    def test_referencias_e_fichas(self):
        sources = json.loads((BASE/'catalogo.json').read_text(encoding='utf-8'))['sources']
        self.assertEqual({s['id'] for s in sources}, {f'{n:02}' for n in range(1,21)})
        self.assertEqual(len(sources),20)
        for source in sources:
            self.assertTrue(source['approved'])
            self.assertTrue((BASE/'fichas'/(source['id']+'.md')).exists())
            self.assertTrue(source['url'].startswith('https://'))
            if not source.get('public_file'): continue
            name=source['public_file']
            self.assertTrue(name.startswith('arquivos/'))
            self.assertNotIn('..',name)
            self.assertTrue(source.get('license_evidence'))
            self.assertNotEqual(source['license'],'Redistribuição não confirmada')
            raw=(BASE/name).read_bytes()
            self.assertEqual(hashlib.sha256(raw).hexdigest(),source['sha256'])
            if name.endswith('.pdf'): self.assertTrue(raw.startswith(b'%PDF'))

    def test_indice_integral_privado(self):
        ignore=(BASE.parents[1]/'.gitignore').read_text(encoding='utf-8')
        self.assertIn('documentos/pesquisa/_local/',ignore)
        self.assertFalse((BASE/'indice-textual.json').exists())

if __name__=='__main__': unittest.main()
