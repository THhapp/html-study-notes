"""Conservative dependency/reference checks; not a security or accessibility certification."""
from __future__ import annotations
import argparse
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote

class NoteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.errors, self.tags = [], [], [], Counter()
        self.styles, self.scripts = [], []
        self.raw = None
        self.doctype = False
        self.svg_depth = 0

    def handle_decl(self, decl):
        if decl.lower() == 'doctype html': self.doctype = True

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'svg': self.svg_depth += 1
        if tag != 'title' or not self.svg_depth: self.tags[tag] += 1
        if attrs.get('id'): self.ids.append(attrs['id'])
        for key in ('aria-labelledby','aria-describedby','aria-controls','for'):
            self.refs.extend(attrs.get(key,'').split())
        if tag == 'html' and not attrs.get('lang'): self.errors.append('html: missing lang')
        if tag in {'iframe','object','embed','base','link','form'}: self.errors.append(f'unsupported dependent/active element: {tag}')
        if tag == 'meta' and attrs.get('http-equiv','').lower() == 'refresh': self.errors.append('meta refresh is unsupported')
        if tag == 'script' and attrs.get('type','').lower() == 'module': self.errors.append('module scripts are unsupported')
        for key,value in attrs.items():
            if key.startswith('on'): self.errors.append(f'{tag}: inline event handler; use scoped listeners')
            if key in {'srcset','srcdoc','action','formaction','poster','data'}: self.errors.append(f'{tag}: unsupported {key}')
            if key in {'href','xlink:href','src'}:
                if value and value.startswith('#') and key != 'src': self.refs.append(unquote(value[1:]))
                elif tag == 'img' and key == 'src' and value and value.startswith(('data:image/png;base64,','data:image/jpeg;base64,','data:image/webp;base64,','data:image/gif;base64,')): pass
                else: self.errors.append(f'{tag}: nonlocal or unsupported {key}: {value}')
            if key in {'style','fill','stroke','filter','clip-path','mask','marker-end','marker-start','marker-mid'} and value:
                self.styles.append(value)
        if tag in {'style','script'}: self.raw = tag

    def handle_startendtag(self, tag, attrs): self.handle_starttag(tag,attrs)
    def handle_endtag(self, tag):
        if tag == self.raw: self.raw = None
        if tag == 'svg': self.svg_depth = max(0, self.svg_depth - 1)
    def handle_data(self, data):
        if self.raw == 'style': self.styles.append(data)
        elif self.raw == 'script': self.scripts.append(data)

def audit(source: str) -> list[str]:
    parser = NoteParser()
    parser.feed(source)
    errors = parser.errors
    if not parser.doctype: errors.append('missing HTML doctype')
    for tag in ('html','head','title','body','main'):
        if parser.tags[tag] != 1: errors.append(f'expected one {tag}, got {parser.tags[tag]}')
    if not re.search(r'<meta\s+[^>]*charset\s*=',source,re.I): errors.append('missing charset')
    if not re.search(r'<meta\s+[^>]*name\s*=\s*[\"\x27]viewport[\"\x27]',source,re.I): errors.append('missing viewport')
    for id_,count in Counter(parser.ids).items():
        if count > 1: errors.append(f'duplicate id: {id_}')
    css = '\n'.join(parser.styles)
    if re.search(r'@import\b|@font-face\b',css,re.I): errors.append('CSS import/font-face is unsupported')
    for raw in re.findall(r'url\(\s*([^)]*?)\s*\)',css,re.I):
        value = raw.strip('\"\x27 ')
        if value.startswith('#'): parser.refs.append(value[1:])
        else: errors.append(f'nonlocal CSS url: {value}')
    ids = set(parser.ids)
    for ref in set(parser.refs):
        if ref not in ids: errors.append(f'missing referenced id: {ref}')
    js = '\n'.join(parser.scripts)
    for pattern,label in [
        (r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|importScripts|Worker|SharedWorker)\s*\(', 'network/worker API'),
        (r'\bimport\s*(?:\(|[\w*{])','module import'),
        (r'\b(?:eval|Function)\s*\(', 'dynamic code execution'),
        (r'\b(?:sendBeacon|serviceWorker)\b','background network API'),
    ]:
        if re.search(pattern,js): errors.append(f'unsupported JavaScript pattern: {label}')
    if re.search(r'@@[A-Z]+@@',source): errors.append('unresolved template marker')
    return sorted(set(errors))

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file',type=Path)
    args = parser.parse_args()
    errors = audit(args.file.read_text(encoding='utf-8'))
    print('\n'.join(errors) if errors else 'PASS: static single-file checks (limited scope)')
    return int(bool(errors))

if __name__ == '__main__': raise SystemExit(main())
