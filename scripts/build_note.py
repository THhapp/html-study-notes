"""Pack trusted authoring files into one offline HTML. Python 3.10+, stdlib only."""
from __future__ import annotations
import argparse
import html
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit_note import audit

def build(title: str, content: str, css: str, runtime: str, domain: str, shell: str) -> str:
    values = {'TITLE': html.escape(title, quote=True), 'CONTENT': content,
              'CSS': css, 'RUNTIME': runtime, 'DOMAIN': domain}
    for key, value in values.items():
        if re.search(r'@@[A-Z]+@@', value):
            raise ValueError(f'{key}: reserved template marker in source')
        closing = 'style' if key == 'CSS' else 'script' if key in {'RUNTIME', 'DOMAIN'} else None
        if closing and re.search(rf'</{closing}(?=[\s/>])', value, re.I):
            raise ValueError(f'{key}: raw closing {closing} must be escaped in source')
    for key in values:
        if shell.count(f'@@{key}@@') != 1:
            raise ValueError(f'shell requires exactly one {key} marker')
    output = re.sub(r'@@([A-Z]+)@@', lambda m: values[m[1]], shell)
    problems = audit(output)
    if problems:
        raise ValueError('assembled HTML failed audit:\n' + '\n'.join(problems))
    return output

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--title', required=True)
    parser.add_argument('--content', type=Path, required=True)
    parser.add_argument('--script', type=Path, action='append', default=[])
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--css', type=Path, default=ROOT/'assets/note.css')
    parser.add_argument('--shell', type=Path, default=ROOT/'assets/note-shell.html')
    parser.add_argument('--overwrite', action='store_true')
    args = parser.parse_args()
    try:
        read = lambda path: path.read_text(encoding='utf-8')
        output = build(args.title, read(args.content), read(args.css),
                       read(ROOT/'assets/note.js'), '\n;\n'.join(map(read,args.script)), read(args.shell))
        # Exclusive creation by default; no partial output on failed validation.
        with args.output.open('w' if args.overwrite else 'x', encoding='utf-8', newline='\n') as file:
            file.write(output)
    except (OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    print(f'Built {args.output} ({len(output.encode("utf-8"))} bytes)')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
