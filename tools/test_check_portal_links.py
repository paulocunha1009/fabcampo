import tempfile
import unittest
from pathlib import Path

from check_portal_links import check


class PortalLinksTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.write('sitemap.xml', '<urlset><url><loc>https://fabcampo.com.br/</loc></url></urlset>')

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8')

    def test_encoded_paths_fragments_and_module_dependencies(self):
        self.write('index.html', '<a href="pages/Planta%C3%A7%C3%A3o.html#topo">Plantas</a><script src="js/app.js?v=1"></script>')
        self.write('pages/Plantação.html', '<main id="topo"><a href="../index.html">Início</a></main>')
        self.write('js/app.js', "import './component.js?v=1';")
        self.write('js/component.js', "new URL('../css/base.css?v=1', import.meta.url);")
        self.write('css/base.css', 'body { color: black; }')
        errors, pages, dependencies = check(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(pages, 2)
        self.assertEqual(dependencies, 5)

    def test_missing_module_wrong_case_and_missing_fragment_are_reported(self):
        self.write('index.html', '<a href="pages/historia.html">História</a><a href="pages/Historia.html#ausente">Seção</a><script src="js/app.js"></script>')
        self.write('pages/Historia.html', '<main id="topo">História</main>')
        self.write('js/app.js', "import { missing } from './ausente.js';")
        errors, _, _ = check(self.root)
        self.assertTrue(any('pages/historia.html' in e and 'maiúsculas' in e for e in errors))
        self.assertTrue(any('#ausente' in e for e in errors))
        self.assertTrue(any('js/ausente.js' in e for e in errors))

    def test_resource_directory_is_checked_without_requiring_index(self):
        self.write('index.html', '<script src="js/app.js"></script>')
        self.write('js/app.js', "new URL('../assets/fonts/', import.meta.url);")
        self.write('assets/fonts/font.bin', 'fixture')
        self.assertEqual(check(self.root)[0], [])

    def test_missing_resource_directory_is_reported(self):
        self.write('index.html', '<script src="js/app.js"></script>')
        self.write('js/app.js', "new URL('../assets/missing/', import.meta.url);")
        self.assertTrue(any('assets/missing' in error for error in check(self.root)[0]))

    def test_navigation_directory_still_requires_index(self):
        self.write('index.html', '<a href="pages/">Páginas</a>')
        self.write('pages/other.html', '<main>Outra</main>')
        self.assertTrue(any('pages/index.html' in error for error in check(self.root)[0]))

    def test_mjs_dependencies_are_checked_recursively(self):
        self.write('index.html', '<script type="module" src="js/app.mjs"></script>')
        self.write('js/app.mjs', "export { value } from './nested/core.mjs?v=1';")
        self.write('js/nested/core.mjs', "import '../missing.mjs';")
        self.assertTrue(any('js/missing.mjs' in error for error in check(self.root)[0]))

    def test_literal_dynamic_imports_are_checked(self):
        self.write('index.html', '<script src="js/app.js"></script>')
        self.write('js/app.js', "await import('./feature.mjs?v=2');")
        self.write('js/feature.mjs', "import './absent.js';")
        self.assertTrue(any('js/absent.js' in error for error in check(self.root)[0]))

    def test_valid_module_graph_with_cycle_is_visited_once(self):
        self.write('index.html', '<script type="module" src="js/app.mjs"></script>')
        self.write('js/app.mjs', "import './child.mjs';")
        self.write('js/child.mjs', "import('./app.mjs');")
        errors, pages, dependencies = check(self.root)
        self.assertEqual(errors, [])
        self.assertEqual((pages, dependencies), (1, 3))

    def test_external_links_and_pending_images_are_not_requested(self):
        self.write('index.html', '<a href="https://example.test/fora">Externo</a><a href="mailto:teste@example.test">Contato</a><img src="imagem-pendente.jpg">')
        errors, pages, dependencies = check(self.root)
        self.assertEqual(errors, [])
        self.assertEqual((pages, dependencies), (1, 1))


if __name__ == '__main__':
    unittest.main()
