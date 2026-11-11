const cardSelector='.pilar-card,.mistica-card,.dado-card,.dado-escola,.cultivo-card,.card-personagem,.solucao-card,.card-link,.bloco-numero,.grade-dados > article';
function documentoEditavel(original,fields){
  const doc=new DOMParser().parseFromString(original,'text/html'),nodes=[];
  function visit(node,active=false,blocked=false){
    const tag=node.nodeType===1?node.localName:'',classes=node.nodeType===1?node.classList:[];
    active=active||tag==='main'||classes.contains?.('hero');
    blocked=blocked||['script','style','noscript','template','nav','form','button','input','textarea','select','iframe','svg','aside'].includes(tag)||classes.contains?.('trilha')||classes.contains?.('faixa-contribuir');
    if(active&&!blocked&&node.nodeType===3&&node.nodeValue.trim())nodes.push(node);
    for(const child of node.childNodes)visit(child,active,blocked);
  }
  visit(doc);if(nodes.length!==fields.length||fields.some((field,index)=>field.indice!==index))throw new Error('A estrutura desta página precisa de conferência. Nenhum texto foi alterado.');
  const map=new Map(),cards=[];
  nodes.forEach((node,index)=>{
    const el=node.parentElement.closest(cardSelector);if(!el)return;
    if(!map.has(el)){const card={id:cards.length,campos:[],el};map.set(el,card);cards.push(card);}
    const card=map.get(el),parent=node.parentElement,classes=parent.className||'';
    let label=/icone|emoji|__foto/.test(classes)?'Símbolo':/__numero|__valor/.test(classes)||(/^h[1-6]$/.test(parent.localName)&&/^[\d.,%+−– -]+$/.test(fields[index].texto))?'Número ou indicador':/^h[1-6]$/.test(parent.localName)||/__titulo|__nome/.test(classes)?'Título':'Texto';
    card.campos.push({indice:index,label});
  });
  for(const card of cards){const title=card.campos.find(field=>field.label==='Título')||card.campos.find(field=>field.label==='Número ou indicador')||card.campos.find(field=>field.label!=='Símbolo');card.titulo=title?fields[title.indice].texto:'Card';}
  return {doc,nodes,cards};
}
export function obterCardsVisuais(original,fields){return documentoEditavel(original,fields).cards.map(({el,...card})=>card);}
export function tituloVisualAcervo(original,fields){
 const {doc,nodes}=documentoEditavel(original,fields);nodes.forEach((node,index)=>{node.nodeValue=fields[index].texto;});const title=doc.querySelector('h1');if(!title)return '';title.querySelectorAll('br').forEach(el=>el.replaceWith(doc.createTextNode(' ')));return title.textContent.replace(/\s+/g,' ').trim();
}
export function montarPreviaVisual(original,fields,nonce,options={}){
  if(!/^[a-f0-9-]{36}$/.test(nonce))throw new Error('Identificação da prévia inválida.');
  const {doc,nodes,cards}=documentoEditavel(original,fields);
  // O HTML público é somente a referência visual. Seus scripts e controles nunca são executados aqui.
  doc.querySelectorAll('script,noscript,iframe,object,embed,base,meta[http-equiv]').forEach(el=>el.remove());
  doc.querySelectorAll('*').forEach(el=>{for(const attribute of [...el.attributes])if(/^on/i.test(attribute.name)||attribute.name==='srcdoc')el.removeAttribute(attribute.name);});
  const base=doc.createElement('base');base.href='https://fabcampo.com.br/pages/';doc.head.prepend(base);
  nodes.forEach((node,index)=>{const span=doc.createElement('span');span.dataset.acervoTexto=String(index);span.className='acervo-texto-editavel';span.tabIndex=0;span.setAttribute('role','button');span.setAttribute('aria-label','Editar: '+fields[index].texto.slice(0,100));span.textContent=fields[index].texto;const leading=node.nodeValue.match(/^\s*/)[0],trailing=node.nodeValue.match(/\s*$/)[0];node.replaceWith(doc.createTextNode(leading),span,doc.createTextNode(trailing));});
  cards.forEach(card=>{card.el.dataset.acervoCard=String(card.id);card.el.classList.add('acervo-card-editavel');card.el.tabIndex=0;card.el.setAttribute('role','button');card.el.setAttribute('aria-label','Editar card: '+card.titulo);card.el.querySelectorAll('[data-acervo-texto]').forEach(span=>{span.removeAttribute('role');span.removeAttribute('tabindex');span.removeAttribute('aria-label');});});
  if(options.capa){
    const capa=options.capa;if(!/^img\/editorial\/[a-f0-9]{64}\.webp$/.test(capa.imagem))throw new Error('Confira a capa enviada.');
    const image=doc.querySelector('.hero__imagem img'),content=doc.querySelector('.hero__conteudo');if(!image||!content)throw new Error('Capa não identificada neste modelo.');
    image.src='https://fabcampo.com.br/'+capa.imagem;image.alt=capa.textoAlternativo||'';for(const name of ['srcset','sizes','data-fallback-hidden','hidden'])image.removeAttribute(name);image.style.setProperty('display','block','important');image.style.objectFit='cover';image.style.objectPosition='center';
    const credit=doc.createElement('p');credit.className='editorial-capa-credito';credit.style.fontSize='.85rem';credit.style.marginTop='1rem';credit.textContent=(capa.legenda||'')+' · Crédito: '+(capa.credito||'');content.append(credit);
  }
  const style=doc.createElement('style');style.textContent='.acervo-texto-editavel{cursor:text;border-radius:3px;scroll-margin-top:110px}.acervo-texto-editavel:hover,.acervo-texto-editavel:focus-visible{outline:2px dashed #c58b13;outline-offset:3px}.acervo-texto-editavel[aria-pressed="true"]{outline:3px solid #d39415;outline-offset:3px;background:#fff3be!important;color:#173c25!important}body.acervo-sem-marcas .acervo-texto-editavel{outline:none!important;background:transparent!important;color:inherit!important}.acervo-card-editavel{cursor:pointer;scroll-margin-top:110px}.acervo-card-editavel:hover,.acervo-card-editavel:focus-visible{outline:2px dashed #c58b13;outline-offset:4px}.acervo-card-editavel[aria-pressed="true"]{outline:3px solid #d39415;outline-offset:4px;box-shadow:0 0 0 7px #fff3be}.acervo-card-editavel .acervo-texto-editavel{outline:none!important;background:transparent!important;color:inherit!important;cursor:pointer}body.acervo-sem-marcas .acervo-card-editavel{outline:none!important;box-shadow:none!important}header,footer{pointer-events:none}html{scroll-behavior:smooth}';doc.head.append(style);
  const script=doc.createElement('script');
  script.textContent=`(()=>{const nonce=${JSON.stringify(nonce)};let active=null;function selectCard(card,notify){if(active)active.removeAttribute('aria-pressed');active=card;active.setAttribute('aria-pressed','true');if(notify)parent.postMessage({tipo:'acervo-card',nonce,cardId:Number(card.dataset.acervoCard)},'*');}function select(index,notify,onlyScroll=false){const span=document.querySelector('[data-acervo-texto="'+index+'"]');if(!span)return;const card=span.closest('[data-acervo-card]');if(card){selectCard(card,notify);if(!notify)card.scrollIntoView({block:'center'});return;}if(active)active.removeAttribute('aria-pressed');active=span;active.setAttribute('aria-pressed','true');if(notify)parent.postMessage({tipo:'acervo-selecao',nonce,indice:Number(index)},'*');else{span.scrollIntoView({block:'center'});if(!onlyScroll)span.focus({preventScroll:true});}}document.addEventListener('click',event=>{event.preventDefault();const card=event.target.closest('[data-acervo-card]');if(card){selectCard(card,true);return;}const span=event.target.closest('[data-acervo-texto]')||event.target.closest('p,h1,h2,h3,h4,h5,h6,li,td,th,figcaption,blockquote')?.querySelector('[data-acervo-texto]');if(span)select(span.dataset.acervoTexto,true);});document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-acervo-texto],[data-acervo-card]')){event.preventDefault();const card=event.target.closest('[data-acervo-card]');if(card)selectCard(card,true);else select(event.target.dataset.acervoTexto,true);}});window.addEventListener('message',event=>{if(event.source!==parent||event.data?.nonce!==nonce)return;const data=event.data;if(data.tipo==='acervo-focar')select(data.indice,false,data.apenasRolar===true);if(data.tipo==='acervo-atualizar'&&Number.isInteger(data.indice)&&typeof data.texto==='string'){const span=document.querySelector('[data-acervo-texto="'+data.indice+'"]');if(span)span.textContent=data.texto;}if(data.tipo==='acervo-marcas')document.body.classList.toggle('acervo-sem-marcas',data.ocultar===true);});})();`;
  doc.body.append(script);return '<!doctype html>'+doc.documentElement.outerHTML;
}
