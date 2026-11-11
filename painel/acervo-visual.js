export function montarPreviaVisual(original,fields,nonce){
  if(!/^[a-f0-9-]{36}$/.test(nonce))throw new Error('Identificação da prévia inválida.');
  const doc=new DOMParser().parseFromString(original,'text/html'),nodes=[];
  function visit(node,active=false,blocked=false){
    const tag=node.nodeType===1?node.localName:'',classes=node.nodeType===1?node.classList:[];
    active=active||tag==='main'||classes.contains?.('hero');
    blocked=blocked||['script','style','noscript','template','nav','form','button','input','textarea','select','iframe','svg','aside'].includes(tag)||classes.contains?.('trilha')||classes.contains?.('faixa-contribuir');
    if(active&&!blocked&&node.nodeType===3&&node.nodeValue.trim())nodes.push(node);
    for(const child of node.childNodes)visit(child,active,blocked);
  }
  visit(doc);
  if(nodes.length!==fields.length||fields.some((field,index)=>field.indice!==index))throw new Error('A estrutura desta página precisa de conferência. Nenhum texto foi alterado.');
  // O HTML público é somente a referência visual. Seus scripts e controles nunca são executados aqui.
  doc.querySelectorAll('script,noscript,iframe,object,embed,base,meta[http-equiv]').forEach(el=>el.remove());
  doc.querySelectorAll('*').forEach(el=>{for(const attribute of [...el.attributes])if(/^on/i.test(attribute.name)||attribute.name==='srcdoc')el.removeAttribute(attribute.name);});
  const base=doc.createElement('base');base.href='https://fabcampo.com.br/pages/';doc.head.prepend(base);
  nodes.forEach((node,index)=>{const span=doc.createElement('span');span.dataset.acervoTexto=String(index);span.className='acervo-texto-editavel';span.tabIndex=0;span.setAttribute('role','button');span.setAttribute('aria-label','Editar: '+fields[index].texto.slice(0,100));span.textContent=fields[index].texto;const leading=node.nodeValue.match(/^\s*/)[0],trailing=node.nodeValue.match(/\s*$/)[0];node.replaceWith(doc.createTextNode(leading),span,doc.createTextNode(trailing));});
  const style=doc.createElement('style');style.textContent='.acervo-texto-editavel{cursor:text;border-radius:3px;scroll-margin-top:110px}.acervo-texto-editavel:hover,.acervo-texto-editavel:focus-visible{outline:2px dashed #c58b13;outline-offset:3px}.acervo-texto-editavel[aria-pressed="true"]{outline:3px solid #d39415;outline-offset:3px;background:#fff3be!important;color:#173c25!important}body.acervo-sem-marcas .acervo-texto-editavel{outline:none!important;background:transparent!important;color:inherit!important}header,footer{pointer-events:none}html{scroll-behavior:smooth}';doc.head.append(style);
  const script=doc.createElement('script');
  script.textContent=`(()=>{const nonce=${JSON.stringify(nonce)};let active=null;function select(index,notify){const span=document.querySelector('[data-acervo-texto="'+index+'"]');if(!span)return;if(active)active.removeAttribute('aria-pressed');active=span;active.setAttribute('aria-pressed','true');if(notify)parent.postMessage({tipo:'acervo-selecao',nonce,indice:Number(index)},'*');else{span.scrollIntoView({block:'center'});span.focus({preventScroll:true});}}document.addEventListener('click',event=>{event.preventDefault();const span=event.target.closest('[data-acervo-texto]')||event.target.closest('p,h1,h2,h3,h4,h5,h6,li,td,th,figcaption,blockquote')?.querySelector('[data-acervo-texto]');if(span)select(span.dataset.acervoTexto,true);});document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-acervo-texto]')){event.preventDefault();select(event.target.dataset.acervoTexto,true);}});window.addEventListener('message',event=>{if(event.source!==parent||event.data?.nonce!==nonce)return;const data=event.data;if(data.tipo==='acervo-focar')select(data.indice,false);if(data.tipo==='acervo-atualizar'&&Number.isInteger(data.indice)&&typeof data.texto==='string'){const span=document.querySelector('[data-acervo-texto="'+data.indice+'"]');if(span)span.textContent=data.texto;}if(data.tipo==='acervo-marcas')document.body.classList.toggle('acervo-sem-marcas',data.ocultar===true);});})();`;
  doc.body.append(script);return '<!doctype html>'+doc.documentElement.outerHTML;
}
