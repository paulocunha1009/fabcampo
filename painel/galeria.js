import { requestAuthorizedAction } from './login.js';
import { EDITORIAL_API } from './auth-config.js';
const $ = id => document.getElementById(id);
let photos = [], version = 0, busy = false, upload;
const files = new Map();
const key = () => document.querySelector('[data-tipo][aria-pressed="true"]').dataset.tipo+':'+$('registro-editorial').value;
function info(text) { $('estado-galeria').textContent = `${photos.length} de 10 fotos. ${text}`; }
function save() { $('fotos').value = JSON.stringify(photos); $('fotos').dispatchEvent(new Event('input',{bubbles:true})); }
function button(text, action, disabled = false) { const node=document.createElement('button'); node.type='button'; node.className='botao-secundario'; node.textContent=text; node.disabled=disabled; if(text.startsWith('Mover foto')){node.textContent=text.endsWith('cima') ? '↑':'↓';node.setAttribute('aria-label',text);node.title=text;} if(text.startsWith('Remover foto')){node.textContent='Remover';node.setAttribute('aria-label',text);} node.addEventListener('click',action); return node; }
function draw() {
  const list=$('lista-galeria'); list.replaceChildren();
  photos.forEach((photo,index)=>{
    const box=document.createElement('section'); box.className='foto-editorial';
    const title=document.createElement('h4'); title.textContent=`Foto ${index+1}${photo.capa ? ' — capa':''}`; box.append(title);
    const local=files.get(photo.id);
    if(local?.url || photo.imagem){ const image=document.createElement('img'); image.src=local?.url || new URL(photo.imagem,'https://fabcampo.com.br/').href; image.alt=photo.textoAlternativo || 'Foto em preparação'; image.referrerPolicy='no-referrer'; box.append(image); }
    const metadata=document.createElement('details');const metadataTitle=document.createElement('summary');metadataTitle.textContent='Legenda, crédito e descrição';metadata.append(metadataTitle);box.append(metadata);
    for(const [field,name,max] of [['legenda','Legenda',400],['credito','Crédito',240],['textoAlternativo','Descrição acessível',400]]) {
      const label=document.createElement('label'); label.textContent=name+' da foto '+(index+1);
      const input=document.createElement('input'); input.value=photo[field] || ''; input.maxLength=max; input.disabled=busy;
      input.addEventListener('input',()=>{photo[field]=input.value; save();}); label.append(input); metadata.append(label);
    }
    box.append(button(photo.capa ? 'Foto de capa':'Usar como capa',()=>{
      if(local && (local.width<1200 || local.height<675)){info('Para a capa, escolha uma foto com pelo menos 1200 × 675 pixels.');return;}
      photos.forEach(item=>{item.capa=item===photo;}); save();draw();
    },photo.capa || busy));
    if(local && photo.capa){
      const crop=document.createElement('details');const cropTitle=document.createElement('summary');cropTitle.textContent='Ajustar recorte da capa';crop.append(cropTitle);box.append(crop);
      const label=document.createElement('label'); label.textContent='Posição do recorte da capa';
      const range=document.createElement('input'); range.type='range';range.min='0';range.max='100';range.value=String(local.position ?? 50);range.disabled=busy;
      const canvas=document.createElement('canvas'); canvas.width=1200;canvas.height=675;canvas.className='recorte-galeria';canvas.setAttribute('aria-label','Prévia do recorte da capa');canvas.setAttribute('role','img');
      const render=()=>{ const scale=Math.max(1200/local.width,675/local.height);const w=1200/scale,h=675/scale;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1200,675);ctx.drawImage(local.bitmap,(local.width-w)*Number(range.value)/100,(local.height-h)*Number(range.value)/100,w,h,0,0,1200,675); };
      range.addEventListener('input',()=>{local.position=Number(range.value);photo.capaImagem='';render();save();});label.append(range);crop.append(label,canvas); render(); local.canvas=canvas;
    }
    box.append(button('Mover foto '+(index+1)+' para cima',()=>{[photos[index-1],photos[index]]=[photos[index],photos[index-1]];save();draw();},index===0 || busy),
      button('Mover foto '+(index+1)+' para baixo',()=>{[photos[index],photos[index+1]]=[photos[index+1],photos[index]];save();draw();},index===photos.length-1 || busy),
      button('Remover foto '+(index+1),()=>{photos.splice(index,1);save();draw();info('Foto removida do rascunho. Nenhum arquivo foi excluído do GitHub.');},busy));
    const replacement=document.createElement('details');const replaceTitle=document.createElement('summary');replaceTitle.textContent='Trocar esta foto';replacement.append(replaceTitle);box.append(replacement);
    const replaceLabel=document.createElement('label');replaceLabel.textContent='Substituir foto '+(index+1);
    const replace=document.createElement('input');replace.type='file';replace.accept='image/jpeg,image/png,image/webp';replace.disabled=busy;
    replace.addEventListener('change',()=>{if(replace.files[0]) void add([replace.files[0]],index);});replaceLabel.append(replace);replacement.append(replaceLabel);
    const status=document.createElement('p');status.textContent=photo.imagem ? 'Foto enviada ou endereço registrado.' : 'Foto local: envio ao GitHub pendente.';box.append(status);list.append(box);
  });
  $('enviar-galeria').disabled=busy || !photos.some(photo=>files.has(photo.id) && (!photo.imagem || (photo.capa && !photo.capaImagem)));
  $('arquivos-galeria').disabled=busy;
}
async function prepare(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>12*1024*1024) throw new Error('Escolha JPEG, PNG ou WebP de até 12 MB por foto.');
  const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
  if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error('Cada foto deve ter até 40 megapixels.');}
  const canvas=document.createElement('canvas');const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.82));
  if(!blob || blob.type!=='image/webp' || blob.size>1024*1024){bitmap.close();throw new Error('Essa foto não pôde ser preparada em WebP de até 1 MB.');}
  return {bitmap,width:bitmap.width,height:bitmap.height,blob,url:URL.createObjectURL(blob),position:50};
}
async function add(selected,replacement) {
  if(busy) return;
  if(replacement===undefined && photos.length+selected.length>10){info('O limite é 10 fotos, incluindo a capa. Nenhuma foto desse lote foi adicionada.');return;}
  const current=version; busy=true;draw();info('Preparando fotos...');
  try {
    for(const file of selected){
      const local=await prepare(file);
      if(current!==version){local.bitmap.close();URL.revokeObjectURL(local.url);break;}
      const id=crypto.randomUUID();const previous=replacement===undefined ? null:photos[replacement];
      if(previous?.capa && (local.width<1200 || local.height<675)){local.bitmap.close();URL.revokeObjectURL(local.url);throw new Error('A foto anterior foi preservada: a substituta da capa precisa de pelo menos 1200 × 675 pixels.');}
      files.set(id,local);
      const photo={id,imagem:'',capaImagem:'',capa:previous?.capa || (!photos.length && local.width>=1200 && local.height>=675),legenda:previous?.legenda || '',credito:previous?.credito || '',textoAlternativo:previous?.textoAlternativo || ''};
      if(replacement===undefined) photos.push(photo);else photos[replacement]=photo;
      save();
    }
    if(current===version) info('Fotos preparadas. Escolha a capa, confira os textos e envie quando o acesso estiver ativo.');
  } catch(error){if(current===version)info(error.message);}
  finally {busy=false;draw();}
}
$('arquivos-galeria').addEventListener('change',event=>{const selected=[...event.target.files];event.target.value='';void add(selected);});
async function send(blob,usage,credential,signal) {
  const response=await fetch(EDITORIAL_API.replace(/\/me$/,'/imagens')+'?uso='+usage,{method:'POST',headers:{Authorization:`Bearer ${credential}`,'Content-Type':'image/webp'},body:blob,credentials:'omit',cache:'no-store',redirect:'error',signal});
  if(!response.ok) throw new Error('Envio não confirmado. As fotos locais e os envios já confirmados foram preservados.');
  const result=await response.json();if(!/^img\/editorial\/[a-f0-9]{64}\.webp$/.test(result.path) || result.status!=='rascunho')throw new Error('Resposta de envio inválida.');return result.path;
}
$('enviar-galeria').addEventListener('click',()=>{
  if(busy || !photos.length) return;
  const originalKey=key(),current=version;
  info('Confirme sua conta no botão Google para enviar as fotos.');
  requestAuthorizedAction(async credential=>{
    if(current!==version || originalKey!==key() || busy)return;
    busy=true;draw();const controller=new AbortController();upload=controller;const timer=setTimeout(()=>controller.abort(),120000);
    try {
      for(const photo of photos){
        const local=files.get(photo.id);if(!local)continue;
        if(!photo.imagem){photo.imagem=await send(local.blob,'galeria',credential,controller.signal);if(current!==version || controller.signal.aborted)return;save();}
        if(photo.capa && !photo.capaImagem && local.canvas){const blob=await new Promise(resolve=>local.canvas.toBlob(resolve,'image/webp',0.82));if(!blob)throw new Error('Não foi possível preparar o recorte.');photo.capaImagem=await send(blob,'capa',credential,controller.signal);if(current!==version || controller.signal.aborted)return;save();}
      }
      info('Envios confirmados. Guarde o rascunho para conferir a reportagem. Nenhuma matéria foi publicada.');
    } catch(error){if(!controller.signal.aborted)info(error.message);else if(current===version)info('Envio interrompido. Os envios já confirmados foram preservados.');}
    finally {clearTimeout(timer);upload=null;busy=false;draw();}
  });
});
document.addEventListener('editorial-record-loaded',()=>{
  version++;upload?.abort();photos=JSON.parse($('fotos').value || '[]');
  if(!photos.length && $('imagem').value)photos=[{id:'capa-anterior',imagem:$('imagem').value,capaImagem:$('imagem').value,capa:true,legenda:$('legenda').value,credito:$('credito').value,textoAlternativo:$('textoAlternativo').value}];
  $('fotos').value=JSON.stringify(photos);draw();info('Confira as fotos deste rascunho.');
});
document.addEventListener('editorial-preview-media',event=>{
  const {area,registro}=event.detail;
  for(const photo of [...(registro.fotos || [])].sort((a,b)=>Number(b.capa)-Number(a.capa))){
    const local=files.get(photo.id),path=photo.capa ? photo.capaImagem || photo.imagem:photo.imagem;
    if(!local?.url && !path)continue;
    const figure=document.createElement('figure');const img=document.createElement('img');img.src=photo.capa && local?.canvas ? local.canvas.toDataURL('image/webp',0.82) : local?.url || new URL(path,'https://fabcampo.com.br/').href;img.alt=photo.textoAlternativo || '';img.loading='lazy';img.referrerPolicy='no-referrer';img.className='foto-previa';
    const caption=document.createElement('figcaption');caption.textContent=[photo.capa ? 'Capa':'',photo.legenda,photo.credito ? 'Crédito: '+photo.credito:''].filter(Boolean).join(' — ');figure.append(img,caption);area.append(figure);
  }
});
document.addEventListener('editorial-access-cleared',()=>upload?.abort());
window.addEventListener('pagehide',()=>{version++;upload?.abort();for(const local of files.values()){local.bitmap.close();URL.revokeObjectURL(local.url);}files.clear();});
