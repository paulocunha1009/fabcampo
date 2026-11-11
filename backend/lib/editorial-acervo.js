import {validarOpcoesAcervo} from './editorial-acervo-opcoes.mjs';
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
  return {...validarOpcoesAcervo(value),path:value.path,original:value.original,baseHash:value.baseHash,edicoes:value.edicoes.map(edit=>({indice:edit.indice,texto:edit.texto}))};
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
// Ajusta somente os metadados de título existentes quando o h1 foi editado.
function sincronizarTitulo(html,titulo){
  const document=parse(html,{sourceCodeLocationInfo:true}),patches=[];
  function visit(node,inHead=false){
    inHead=inHead||node.tagName==='head';
    if(inHead&&node.tagName==='title'&&node.sourceCodeLocation?.endTag){
      const anterior=(node.childNodes||[]).map(child=>child.value||'').join('');
      const sufixo=anterior.includes(' | ')?anterior.slice(anterior.indexOf(' | ')):'';
      patches.push({start:node.sourceCodeLocation.startTag.endOffset,end:node.sourceCodeLocation.endTag.startOffset,texto:escape(titulo+sufixo)});
    }
    if(inHead&&node.tagName==='meta'){
      const attrs=Object.fromEntries((node.attrs||[]).map(attr=>[attr.name,attr.value]));
      if(attrs.property?.toLowerCase()==='og:title'||attrs.name?.toLowerCase()==='twitter:title'){
        const loc=node.sourceCodeLocation?.attrs?.content;
        if(loc){const anterior=attrs.content||'',sufixo=anterior.includes(' | ')?anterior.slice(anterior.indexOf(' | ')):'';patches.push({start:loc.startOffset,end:loc.endOffset,texto:'content="'+escape(titulo+sufixo)+'"'});}
      }
    }
    for(const child of node.childNodes||[])visit(child,inHead);
  }
  visit(document);for(const patch of patches.sort((a,b)=>b.start-a.start))html=html.slice(0,patch.start)+patch.texto+html.slice(patch.end);
  return html;
}
function aplicarChamada(html,record){
  if(record.resumo===undefined&&!record.capa)return html;
  const doc=parse(html,{sourceCodeLocationInfo:true}),patches=[];let capaImg=null,heroConteudo=null;
  const attr=(node,name)=>(node.attrs||[]).find(item=>item.name===name)?.value||'';
  function patchAttr(node,name,value){const loc=node.sourceCodeLocation?.attrs?.[name];if(loc)patches.push({start:loc.startOffset,end:loc.endOffset,texto:name+'="'+escape(value)+'"'});}
  function visit(node,inImage=false){
    const classes=attr(node,'class').split(/\s+/);inImage=inImage||classes.includes('hero__imagem');
    if(inImage&&node.tagName==='img'&&!capaImg)capaImg=node;
    if(classes.includes('hero__conteudo'))heroConteudo=node;
    if(node.tagName==='meta'){
      const key=(attr(node,'property')||attr(node,'name')).toLowerCase();
      if(record.resumo!==undefined&&['description','og:description','twitter:description'].includes(key))patchAttr(node,'content',record.resumo);
      if(record.capa&&['og:image','twitter:image'].includes(key))patchAttr(node,'content','https://fabcampo.com.br/'+record.capa.imagem);
    }
    for(const child of node.childNodes||[])visit(child,inImage);
  }
  visit(doc);
  if(record.capa){
    if(!capaImg?.sourceCodeLocation||!heroConteudo?.sourceCodeLocation?.endTag)throw fail('Não foi possível identificar a capa deste modelo. Procure a equipe.');
    const attrs=new Map((capaImg.attrs||[]).map(item=>[item.name,item.value]));
    for(const name of ['srcset','sizes','data-fallback-hidden','hidden'])attrs.delete(name);
    attrs.set('src','../'+record.capa.imagem);attrs.set('alt',record.capa.textoAlternativo);attrs.set('loading','eager');attrs.set('style',(attrs.get('style')||'')+';display:block!important;width:100%;height:100%;object-fit:cover;object-position:center');
    patches.push({start:capaImg.sourceCodeLocation.startOffset,end:capaImg.sourceCodeLocation.endOffset,texto:'<img '+[...attrs].map(([name,value])=>name+'="'+escape(value)+'"').join(' ')+'>'});
    const at=heroConteudo.sourceCodeLocation.endTag.startOffset;
    patches.push({start:at,end:at,texto:'<p class="editorial-capa-credito" style="font-size:.85rem;margin-top:1rem">'+escape(record.capa.legenda)+' · Crédito: '+escape(record.capa.credito)+'</p>'});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))html=html.slice(0,patch.start)+patch.texto+html.slice(patch.end);
  return html;
}
export function resumoOriginalAcervo(html){
 let resumo='';function visit(node){const attrs=Object.fromEntries((node.attrs||[]).map(item=>[item.name,item.value]));if(node.tagName==='meta'&&attrs.name==='description')resumo=attrs.content||'';for(const child of node.childNodes||[])visit(child);}visit(parse(html));return resumo.slice(0,1200);
}
export function aplicarAcervo(value){
  const record=validarAcervo(value),fields=analisarAcervo(record.original),changes=new Map(record.edicoes.map(edit=>[edit.indice,edit.texto]));
  if([...changes.keys()].some(index=>index>=fields.length))throw fail('Um trecho não pertence à página importada.');
  let html=record.original;for(const field of [...fields].reverse()){const changed=changes.get(field.indice);if(changed!==undefined&&changed!==field.texto)html=html.slice(0,field.start)+field.prefix+escape(changed)+field.suffix+html.slice(field.end);}
  if(/<h1(?:\s|>)/i.test(record.original)){const anterior=tituloAcervo(record.original),atual=tituloAcervo(html);if(anterior!==atual)html=sincronizarTitulo(html,atual);}
  html=aplicarChamada(html,record);
  return {html,campos:fields.map(({start,end,prefix,suffix,...field})=>({...field,texto:changes.get(field.indice)??field.texto}))};
}
