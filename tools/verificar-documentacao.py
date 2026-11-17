"""Confere destinos locais em links Markdown; não certifica o conteúdo dos documentos."""
from pathlib import Path
from urllib.parse import unquote,urlsplit
import re,json,argparse

parser=argparse.ArgumentParser()
parser.add_argument('--root',default='.')
parser.add_argument('--output',default='tmp/auditoria-20261116/documentacao.json')
args=parser.parse_args();root=Path(args.root).resolve()
files=sorted(root.glob('*.md'))+sorted((root/'backend').glob('*.md'))
errors=[];checked=0
for file in files:
 text=file.read_text(encoding='utf-8-sig')
 # Os blocos de exemplo não são links navegáveis da documentação.
 text=re.sub(r'```[\s\S]*?```','',text)
 for match in re.finditer(r'!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)',text):
  value=match.group(1).strip('<>');url=urlsplit(value)
  if url.scheme or url.netloc or not url.path:continue
  checked+=1;target=(file.parent/unquote(url.path)).resolve()
  if not target.exists():errors.append({'documento':file.relative_to(root).as_posix(),'destino':value})
out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'documents':len(files),'local_links':checked,'missing':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(files)} documentos; {checked} links locais; {len(errors)} destinos ausentes.')
for error in errors:print(error)
raise SystemExit(bool(errors))
