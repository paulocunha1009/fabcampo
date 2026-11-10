import {parse} from 'parse5';
import {createHash} from 'node:crypto';
export const acervoCatalogo=[{path:'pages/reportagem-educacao.html',titulo:'A Escola que Nasce da Terra'},{path:'pages/reportagem-clima.html',titulo:'Mudanças Climáticas Ameaçam o Futuro do Campo'},{path:'pages/materia_ia_educacao_v2.html',titulo:'IA na Educação'}];
export const acervoPath=path=>acervoCatalogo.some(item=>item.path===path);
const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=message=>Object.assign(new Error(message),{status:409});
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function tituloAcervo(html){
  function plain(node){return node.tagName==='br'?' ':node.nodeName==='#text'?node.value:(node.childNodes||[]).map(plain).join('');}
  function find(node){if(node.tagName==='h1')return plain(node).replace(/\s+/g,' ').trim();for(const child of node.childNodes||[]){const title=find(child);if(title)return title;}return '';}
  const title=find(parse(html));if(!title||title.length>160)throw fail('O título da página deve ter até 160 caracteres.');return title;
}
export function validarAcervo(value){
  if(!value||!acervoPath(value.path)||typeof value.original!=='string'||Buffer.byteLength(value.original)>180000||hash(value.original)!==value.baseHash||!Array.isArray(value.edicoes)||value.edicoes.length>1500)throw fail('Registro do acervo inválido. Importe novamente pelo painel.');
  const seen=new Set();for(const edit of value.edicoes){if(!Number.isInteger(edit.indice)||edit.indice<0||seen.has(edit.indice)||typeof edit.texto!=='string'||edit.texto.length>12000||!edit.texto.trim())throw fail('Confira os trechos editados.');seen.add(edit.indice);}
  return {path:value.path,original:value.original,baseHash:value.baseHash,edicoes:value.edicoes.map(edit=>({indice:edit.indice,texto:edit.texto}))};
}
export function analisarAcervo(html){
  const document=parse(html,{sourceCodeLocationInfo:true}),fields=[];let group='Apresentação';
  function plain(node){return node.tagName==='br'?' ':node.nodeName==='#text'?node.value:(node.childNodes||[]).map(plain).join(node.tagName==='br'?' ':'');}
  function visit(node,active=false,blocked=false){
    const attrs=Object.fromEntries((node.attrs||[]).map(item=>[item.name,item.value])),classes=(attrs.class||'').split(/\s+/);
    active=active||node.tagName==='main'||classes.includes('hero');
    blocked=blocked||['script','style','noscript','template','nav','form','button','input','textarea','select','iframe','svg','aside'].includes(node.tagName)||classes.includes('trilha')||classes.includes('faixa-contribuir');
    if(active&&!blocked&&/^h[1-6]$/.test(node.tagName||''))group=plain(node).replace(/\s+/g,' ').trim();
    if(active&&!blocked&&node.nodeName==='#text'&&node.value.trim()&&node.sourceCodeLocation){const {startOffset:start,endOffset:end}=node.sourceCodeLocation;fields.push({indice:fields.length,grupo:group,tipo:node.parentNode?.tagName||'texto',texto:node.value.trim(),start,end,prefix:node.value.match(/^\s*/)[0],suffix:node.value.match(/\s*$/)[0]});}
    for(const child of node.childNodes||[])visit(child,active,blocked);
  }
  visit(document);if(!fields.length||fields.length>1500)throw fail('Não foi possível identificar os textos desta página.');return fields;
}
export function aplicarAcervo(value){
  const record=validarAcervo(value),fields=analisarAcervo(record.original),changes=new Map(record.edicoes.map(edit=>[edit.indice,edit.texto]));
  if([...changes.keys()].some(index=>index>=fields.length))throw fail('Um trecho não pertence à página importada.');
  let html=record.original;for(const field of [...fields].reverse()){const changed=changes.get(field.indice);if(changed!==undefined&&changed!==field.texto)html=html.slice(0,field.start)+field.prefix+escape(changed)+field.suffix+html.slice(field.end);}
  return {html,campos:fields.map(({start,end,prefix,suffix,...field})=>({...field,texto:changes.get(field.indice)??field.texto}))};
}
