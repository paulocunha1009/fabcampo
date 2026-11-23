"""Reúne fontes públicas; guarda separadamente cópias sem redistribuição confirmada."""
import json,pathlib,urllib.request,hashlib,concurrent.futures,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1];DEST=ROOT/'documentos/pesquisa'
PDF={
'02':'https://repositorio.ufc.br/bitstream/riufc/50247/1/2019_dis_fcpereira.pdf',
'03':'https://periodicos.ufsm.br/geografia/article/download/71125/61175/390633',
'04':'https://periodicos.ufpe.br/revistas/mutiro/article/download/258897/44359',
'05':'https://periodicos.ufc.br/educacaoemdebate/article/download/83142/227471',
'06':'https://periodicos.ufv.br/rever/article/download/3348/1609/15608',
'07':'https://sistemas.uvanet.br/sadoc/participante/trabalho/trab_pos_e9a9e829440d600e4bf750fb045fa338.pdf',
'08':'https://repositorio.ufc.br/bitstream/riufc/75624/3/2022_tcc_amnsales.pdf',
'09':'https://www.repositorio.ufc.br/bitstream/riufc/65319/1/1997_tcc_japereira.pdf',
'10':'https://repositorio.ufc.br/bitstream/riufc/75858/3/2023_tese_mlvsilva.pdf',
'11':'https://portalantigo.ipea.gov.br/agencia/images/stories/PDFs/relatoriopesquisa/160621_relatorio_pnera_ceara.pdf',
'13':'https://pesquisa.in.gov.br/imprensa/servlet/INPDFViewer?captchafield=firstAccess&data=27%2F12%2F2002&jornal=1&pagina=373',
'15':'https://repositorio.ufc.br/bitstream/riufc/14623/1/2015_dis_mesabreu.pdf',
'16':'https://mapacultural.icapui.ce.gov.br/files/agent/10497/01_relatorio_ponto_cultura_minc_2005_-_2007.pdf',
'18':'https://periodicos.ufc.br/eu/article/download/86002/231772'}
LICENSE={
'03':('CC BY-NC-SA 4.0','https://periodicos.ufsm.br/geografia/article/view/71125'),
'04':('CC BY 4.0 (declaração no artigo indexado)','https://periodicos.ufpe.br/revistas/mutiro/article/download/258897/44359'),
'05':('CC BY-NC-ND 4.0 — PDF original, sem alterações','https://periodicos.ufc.br/educacaoemdebate/article/view/83142'),
'11':('Reprodução não comercial com citação da fonte — aviso na página 6 do PDF','https://portalantigo.ipea.gov.br/agencia/images/stories/PDFs/relatoriopesquisa/160621_relatorio_pnera_ceara.pdf#page=6'),
'12':('Ato oficial — texto original','https://planalto.gov.br/ccivil_03/decreto/1980-1989/1985-1987/d92826impressao.htm'),
'13':('Publicação oficial — texto original','https://pesquisa.in.gov.br/')}
LICENSE['18']=('Creative Commons Attribution — versão não indicada na página', 'https://periodicos.ufc.br/eu/article/view/86002')
def reunir(row):
 id=row['id'];row=dict(row)
 row['license'],row['license_evidence']=LICENSE.get(id,('Redistribuição não confirmada',None))
 if id in ['17','19','20']:
  row['offline_status']='Somente ficha bibliográfica; integral pendente ou audiovisual não baixado';return row
 try:
  url=PDF.get(id,row['url']);req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; CampoDigitalResearch/1.0)'})
  if id=='06' and (ROOT/'tmp/pdfs/fontes-curadoria-20261123/sistematizacao.pdf').exists():
   raw=(ROOT/'tmp/pdfs/fontes-curadoria-20261123/sistematizacao.pdf').read_bytes();final=url
  else:
   with urllib.request.urlopen(req,timeout=22) as r:raw=r.read(30*1024*1024);final=r.url
  if id in PDF:
   if not raw.startswith(b'%PDF'):raise ValueError('Resposta não é PDF; pode ser página de erro ou verificação')
   suffix='.pdf'
  else:
   if b'<html' not in raw[:3000].lower() and b'<!doctype' not in raw[:3000].lower():raise ValueError('Resposta HTML inválida')
   suffix='.html'
  folder='arquivos' if id in LICENSE else '_local/originais'
  p=DEST/folder/(id+suffix);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
  row.update(offline_status='Integral obtido' if id in PDF else 'Página de catálogo obtida; não equivale a trabalho integral',download_url=url,download_final=final,sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw))
  if id in LICENSE:row['public_file']=p.relative_to(DEST).as_posix()
  else:row['local_file']=p.relative_to(DEST).as_posix()
 except Exception as e:row.update(offline_status='Download pendente',download_error=str(e).splitlines()[0][:180])
 print(json.dumps({'id':id,'status':row['offline_status'],'public_file':row.get('public_file')},ensure_ascii=True),flush=True)
 return row
if __name__=='__main__':
 catalog=json.loads((DEST/'catalogo.json').read_text(encoding='utf-8'))
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:catalog['sources']=list(pool.map(reunir,catalog['sources']))
 (DEST/'catalogo.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Catálogo atualizado',flush=True)
