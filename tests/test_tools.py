"""Behavioral regressions for packing and detecting broken standalone output."""
from pathlib import Path
import sys
import tempfile
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_note import build
from audit_note import audit

SHELL = (ROOT/'assets/note-shell.html').read_text(encoding='utf-8')
CONTENT = '<main id="root"><h1>Test</h1><a href="#root">Top</a></main>'

class ToolsTests(unittest.TestCase):
    def pack(self,content=CONTENT,css='',script=''):
        return build('A < B & C',content,css,'',script,SHELL)

    def test_title_is_text_and_assembled_output_passes(self):
        output = self.pack()
        self.assertIn('<title>A &lt; B &amp; C</title>',output)
        self.assertEqual([],audit(output))

    def test_svg_titles_and_internal_markers_are_valid(self):
        content = CONTENT.replace('</main>','<svg><title id="diagram-title">Graph</title><defs><marker id="tip"/></defs><path marker-end="url(#tip)" aria-labelledby="diagram-title"/></svg></main>')
        self.assertEqual([],audit(self.pack(content)))

    def test_bad_references_fail(self):
        for fragment in ['<a href="#absent">bad</a>','<p id="root">duplicate</p>','<p aria-describedby="missing">bad</p>']:
            with self.subTest(fragment=fragment), self.assertRaises(ValueError):
                self.pack(CONTENT.replace('</main>',fragment+'</main>'))

    def test_dependency_paths_and_active_elements_fail(self):
        for fragment in ['<script src="./app.js"></script>','<img src="https://example.com/a.png">','<a href="other.html">jump</a>','<iframe srcdoc="text"></iframe>','<link rel="stylesheet" href="x.css">']:
            with self.subTest(fragment=fragment), self.assertRaises(ValueError):
                self.pack(CONTENT.replace('</main>',fragment+'</main>'))

    def test_network_css_and_dynamic_execution_fail(self):
        for css in ['@import "remote.css";','p{background:url(../a.svg)}']:
            with self.subTest(css=css), self.assertRaises(ValueError): self.pack(css=css)
        for js in ['fetch("x")','import("./x.js")','new Function("x")','new WebSocket("wss://x")']:
            with self.subTest(js=js), self.assertRaises(ValueError): self.pack(script=js)

    def test_raw_closing_sequence_and_markers_fail(self):
        for js in ['const a = "</ScRiPt >";', 'const a = "@@CSS@@";']:
            with self.subTest(js=js), self.assertRaises(ValueError): self.pack(script=js)
        with self.assertRaises(ValueError): self.pack(css='/* </style> */')
        self.assertEqual([],audit(self.pack(script=r'const a = "<\/script>";')))

    def test_cli_does_not_overwrite_without_flag(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)/'note.html'
            output.write_text('keep me',encoding='utf-8')
            run = subprocess.run([sys.executable,str(ROOT/'scripts/build_note.py'),'--title','Test','--content',str(ROOT/'examples/reachability-content.html'),'--script',str(ROOT/'examples/reachability.js'),'--output',str(output)],capture_output=True)
            self.assertNotEqual(0,run.returncode)
            self.assertEqual('keep me',output.read_text(encoding='utf-8'))

    def test_published_example_is_reproducible(self):
        expected = build('有向图与可达性',(ROOT/'examples/reachability-content.html').read_text(encoding='utf-8'),(ROOT/'assets/note.css').read_text(encoding='utf-8'),(ROOT/'assets/note.js').read_text(encoding='utf-8'),(ROOT/'examples/reachability.js').read_text(encoding='utf-8'),SHELL)
        self.assertEqual(expected,(ROOT/'assets/reachability-note.html').read_text(encoding='utf-8'))

    def test_main_example_is_reproducible(self):
        scripts='\n;\n'.join((ROOT/file).read_text(encoding='utf-8') for file in ['assets/diagrams.js','examples/representation.js'])
        expected=build('信息副本与投影',(ROOT/'examples/representation-content.html').read_text(encoding='utf-8'),(ROOT/'assets/note.css').read_text(encoding='utf-8'),(ROOT/'assets/note.js').read_text(encoding='utf-8'),scripts,SHELL)
        self.assertEqual(expected,(ROOT/'assets/reference-note.html').read_text(encoding='utf-8'))

if __name__ == '__main__': unittest.main()
