import {header,footer} from './editorial-chrome.mjs';
const origin='https://fabcampo.com.br';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function text(value,max){if(typeof value!=='string'||value.length>max)throw new Error('Conteúdo da reportagem inválido.');return value;}
function url(value,{preview=false,image=false}={}){
  if(!value)return '';
  if(typeof value!=='string'||value.length>2000||/[\s\\]/.test(value)||value.startsWith('//'))throw new Error('Endereço inválido.');
  if(preview && /^img\/editorial\/[a-f0-9]{64}\.webp$/.test(value))return 'https://raw.githubusercontent.com/paulocunha1009/fabcampo/editorial-rascunhos/'+value;
  const parsed=new URL(value,origin+'/');
  if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw new Error('Use endereço HTTPS.');
  if(image && !/\.(?:webp|png|jpe?g)(?:$|\?)/i.test(parsed.pathname+parsed.search))throw new Error('Formato de imagem inválido.');
  return parsed.href;
}
export function renderEditorialPage(record,{preview=true}={}){
  // Whitelist explícita: pesquisa original, arquivo e credenciais nunca entram no HTML.
  const title=text(record.titulo,160),subtitle=text(record.subtitulo||record.resumo||'',1200),body=text(record.texto||'',12000);
  if(!title.trim())throw new Error('Informe um título antes de conferir a página.');
  if(!['destaques','dados',undefined].includes(record.modelo))throw new Error('Modelo inválido.');
  const photos=record.fotos||[],cards=record.cards||[];
  if(!Array.isArray(photos)||photos.length>10||!Array.isArray(cards)||cards.length>3||photos.filter(p=>p.capa).length>1)throw new Error('Confira as fotos e os cards.');
  const cover=photos.find(photo=>photo.capa && (photo.capaImagem||photo.imagem));
  const coverURL=cover?url(cover.capaImagem||cover.imagem,{preview,image:true}):'';
  const caption=photo=>[photo.legenda,photo.credito?'Crédito: '+photo.credito:''].filter(Boolean).map(value=>escape(text(value,650))).join(' — ');
  let section=0,hasLead=false;const toc=[];
  const content=body.split(/\n\s*\n/).map(block=>{
    const lines=block.split('\n');let result='';
    for(let index=0;index<lines.length;){
      const heading=/^##\s+(.+)$/.exec(lines[index]);
      if(heading){const id='secao-'+(++section);toc.push({id,title:heading[1]});result+='<h2 class="artigo-titulo-secao" id="'+id+'">'+escape(heading[1])+'</h2>';index++;}
      else{const paragraph=[];while(index<lines.length&&!/^##\s+/.test(lines[index]))paragraph.push(lines[index++]);const lead=!hasLead;hasLead=true;result+='<p'+(lead?' class="artigo-lead"':'')+'>'+escape(paragraph.join('\n')).replace(/\n/g,'<br>')+'</p>';}
    }
    return result;
  }).join('');
  const gallery=photos.filter(photo=>photo.imagem && !photo.capa).map(photo=>{
    const src=url(photo.imagem,{preview,image:true});
    return '<figure><img src="'+escape(src)+'" alt="'+escape(text(photo.textoAlternativo||'',400))+'" loading="lazy" decoding="async"><figcaption>'+caption(photo)+'</figcaption></figure>';
  }).join('');
  const highlights=cards.length?'<section class="editorial-cards editorial-cards--'+(record.modelo||'destaques')+'" aria-label="Destaques da reportagem">'+cards.map(card=>'<section><h2>'+escape(text(card.titulo,90))+'</h2><p>'+escape(text(card.texto,500))+'</p></section>').join('')+'</section>':'';
  let video='';
  if(record.video){const parsed=new URL(record.video);const id=parsed.searchParams.get('v');if(parsed.origin!=='https://www.youtube.com'||parsed.pathname!=='/watch'||!/^[A-Za-z0-9_-]{11}$/.test(id||''))throw new Error('Vídeo inválido.');video='<section class="editorial-video"><h2>Vídeo da reportagem</h2><button type="button" class="botao" data-video="'+id+'">Carregar vídeo do YouTube</button><p>O vídeo será carregado somente ao clicar.</p></section>';}
  let date='';
  if(record.data){if(!/^\d{4}-\d{2}-\d{2}$/.test(record.data))throw new Error('Data inválida.');const parsed=new Date(record.data+'T12:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==record.data)throw new Error('Data inválida.');date='<time datetime="'+record.data+'">'+parsed.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})+'</time>';}
  const source=escape(text(record.fonte||'',160)),place=escape(text(record.local||'',240));
  const reference=record.link?'<p><a href="'+escape(url(record.link))+'" target="_blank" rel="noopener noreferrer">Consultar fonte de referência</a></p>':'';
  const missing=preview?'<div class="editorial-aviso" role="note"><strong>Prévia privada — não publicada.</strong> Confira fatos, fontes, fotos e créditos antes de publicar.</div>':'';
  const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="robots" content="'+(preview?'noindex,nofollow':'index,follow')+'"><meta name="description" content="'+escape(text(record.resumo||subtitle,1200))+'"><meta name="referrer" content="no-referrer">'+ 
    '<title>'+escape(title)+' | Campo Digital</title><link rel="icon" href="../img/logo/favicon-campo-digital.png"><link rel="stylesheet" href="../css/portal.css?v=20261105-3"><link rel="stylesheet" href="../css/portal-responsivo.css?v=20261105-1"><link rel="stylesheet" href="../css/reportagem-editorial.css"></head><body data-page="reportagem-editorial"><a class="link-pular" href="#conteudo" target="_self">Pular para o conteúdo</a>'+header+missing+
    '<section class="hero editorial-hero'+(coverURL?' editorial-hero--foto':'')+'">'+(coverURL?'<div class="hero__imagem"><img src="'+escape(coverURL)+'" alt="'+escape(text(cover.textoAlternativo||'',400))+'"></div>':'')+'<div class="container hero__conteudo"><p class="selo">'+escape(text(record.categoria||'Reportagem',90))+'</p><h1>'+escape(title)+'</h1><p>'+escape(subtitle)+'</p>'+(place?'<p>'+place+'</p>':'')+'</div></section>'+
    '<div class="artigo-barra"><div class="container artigo-barra__conteudo"><div class="artigo-barra__info">'+date+(source?'<span>Fonte/autoria: '+source+'</span>':'')+'</div></div></div>'+
    '<main id="conteudo"><div class="container artigo-layout"><article class="artigo-corpo">'+(cover?'<p class="editorial-legenda-capa">'+caption(cover)+'</p>':'')+content+highlights+(gallery?'<section class="editorial-galeria" aria-label="Fotos da reportagem"><h2>Fotos da reportagem</h2>'+gallery+'</section>':'')+video+
    '<section class="editorial-creditos"><h2>Fontes e créditos</h2>'+(source?'<p>'+source+'</p>':'')+reference+'</section></article><aside class="editorial-lateral" aria-label="Navegação da reportagem">'+(toc.length?'<nav class="card-lateral" aria-label="Nesta reportagem"><h2>Nesta reportagem</h2><ul>'+toc.map(item=>'<li><a href="#'+item.id+'" target="_self">'+escape(item.title)+'</a></li>').join('')+'</ul></nav>':'')+'<div class="card-lateral"><h2>Explore o portal</h2><p><a href="reportagem-educacao.html">Educação do Campo</a></p><p><a href="reportagem-clima.html">Clima e Campo</a></p><p><a href="../contato.html">Fale com o projeto</a></p></div></aside></div></main>'+footer+
    '<script type="module">import {iniciarMenu} from "'+origin+'/js/components/menu.js?v=20261105-1";import {iniciarAltoContraste} from "'+origin+'/js/components/alto-contraste.js?v=20261105-1";iniciarMenu();iniciarAltoContraste();document.querySelectorAll("[data-video]").forEach(button=>button.addEventListener("click",()=>{const frame=document.createElement("iframe");frame.src="https://www.youtube-nocookie.com/embed/"+button.dataset.video+"?autoplay=0";frame.title="Vídeo da reportagem";frame.allowFullscreen=true;frame.referrerPolicy="no-referrer";button.replaceWith(frame);}));document.querySelectorAll("a").forEach(link=>link.addEventListener("click",event=>{const href=link.getAttribute("href")||"";if(!href.startsWith("#"))return;const target=document.getElementById(href.slice(1));if(target){event.preventDefault();target.scrollIntoView();target.tabIndex=-1;target.focus({preventScroll:true});}}));</script></body></html>';
  return html.replace(/(href|src)="([^"]+)"/g,(attribute,key,value)=>value.startsWith('#')?attribute:key+'="'+new URL(value,origin+'/pages/').href+'"');
}
