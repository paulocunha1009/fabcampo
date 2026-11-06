import { requestAuthorizedAction } from './login.js';
import { EDITORIAL_API } from './auth-config.js';
const $ = id => document.getElementById(id);
const canvas = $('capa-preparada');
let photo, prepared, generation = 0, upload;
const recordKey = () => document.querySelector('[data-tipo][aria-pressed="true"]').dataset.tipo+':'+$('registro-editorial').value;
function info(text) { $('estado-imagem').textContent = text; }
async function draw() {
  if(!photo) return;
  const current = ++generation;
  const fraction = Number($('posicao-imagem').value) / 100;
  const scale = Math.max(1200/photo.width, 675/photo.height);
  const width = 1200/scale, height = 675/scale;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff'; context.fillRect(0,0,1200,675);
  context.drawImage(photo, (photo.width-width)*fraction, (photo.height-height)*fraction, width,height,0,0,1200,675);
  canvas.hidden = false;
  prepared = null;
  $('enviar-imagem').disabled = $('baixar-imagem').disabled = true;
  const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/webp',0.82));
  if(current !== generation) return;
  if(!blob || blob.type !== 'image/webp' || blob.size > 1024*1024) { info('Não foi possível preparar uma capa WebP de até 1 MB. Escolha outra foto.'); return; }
  prepared = blob;
  $('enviar-imagem').disabled = $('baixar-imagem').disabled = false;
  info(`Capa preparada: 1200 × 675 pixels, WebP, ${Math.ceil(blob.size/1024)} KB. Confira o recorte. Ainda não enviada.`);
}
$('arquivo-imagem').addEventListener('change', async event => {
  const current = ++generation;
  photo?.close(); photo = null; prepared = null;
  canvas.hidden = true;
  $('enviar-imagem').disabled = $('baixar-imagem').disabled = true;
  const file = event.target.files[0];
  if(!file) { info('Nenhuma foto selecionada.'); return; }
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12*1024*1024) { info('Escolha JPEG, PNG ou WebP de até 12 MB.'); return; }
  info('Preparando a foto...');
  try {
    const decoded = await createImageBitmap(file, { imageOrientation:'from-image' });
    if(current !== generation) { decoded.close(); return; }
    if(decoded.width*decoded.height > 40000000 || decoded.width < 1200 || decoded.height < 675) {
      decoded.close(); info('Escolha uma foto com pelo menos 1200 × 675 pixels e no máximo 40 megapixels.'); return;
    }
    photo = decoded; $('posicao-imagem').value = '50'; await draw();
  } catch { if(current === generation) info('Não foi possível abrir essa imagem. Escolha outro arquivo.'); }
});
$('posicao-imagem').addEventListener('input', () => { void draw(); });
$('baixar-imagem').addEventListener('click', () => {
  if(!prepared) return;
  const url = URL.createObjectURL(prepared);
  const link = document.createElement('a'); link.href = url; link.download = 'capa-reportagem.webp'; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
$('enviar-imagem').addEventListener('click', () => {
  if(!prepared || upload) return;
  const blob = prepared;
  const target = recordKey();
  info('Confirme sua conta no botão Google para enviar esta capa. A reportagem ainda não será publicada.');
  requestAuthorizedAction(async credential => {
    if(prepared !== blob || upload || target !== recordKey()) { info('O registro ou a capa mudou. Confira e solicite o envio novamente.'); return; }
    const controller = new AbortController(); upload = controller;
    $('enviar-imagem').disabled = true;
    const timer = setTimeout(() => controller.abort(),30000);
    try {
      const response = await fetch(EDITORIAL_API.replace(/\/me$/, '/imagens'), { method:'POST',
        headers:{ Authorization:`Bearer ${credential}`, 'Content-Type':'image/webp' },
        body:blob, credentials:'omit', cache:'no-store', redirect:'error', signal:controller.signal });
      if(!response.ok) throw new Error(response.status === 503 ? 'O envio ainda não foi ativado no servidor.' : 'O envio não foi confirmado. Confira o acesso e tente novamente.');
      const result = await response.json();
      if(controller.signal.aborted) return;
      if(!/^img\/editorial\/[a-f0-9]{64}\.webp$/.test(result.path) || result.status !== 'rascunho') throw new Error('Resposta de envio inválida.');
      if(target !== recordKey()) { info('Imagem enviada para o rascunho anterior. O registro aberto não foi alterado. Endereço: '+result.path); return; }
      $('imagem').value = result.path;
      $('imagem').dispatchEvent(new Event('input',{bubbles:true}));
      info('Imagem enviada ao GitHub como rascunho. Guarde o registro para associar o endereço à reportagem. A matéria não foi publicada.');
    } catch(error) { if(!controller.signal.aborted) info(error.message || 'Não foi possível confirmar o envio.'); }
    finally { clearTimeout(timer); upload = null; $('enviar-imagem').disabled = !prepared; }
  });
});
function cancelUpload() { upload?.abort(); }
function resetPhoto() {
  generation++; photo?.close(); photo = null; prepared = null;
  canvas.hidden = true; $('arquivo-imagem').value = '';
  $('enviar-imagem').disabled = $('baixar-imagem').disabled = true;
  info('Nenhuma foto selecionada para este registro.');
}
$('registro-editorial').addEventListener('change', resetPhoto);
document.querySelectorAll('[data-tipo]').forEach(button => button.addEventListener('click', resetPhoto));
$('cancelar-edicao').addEventListener('click', resetPhoto);
document.addEventListener('editorial-access-cleared', cancelUpload);
window.addEventListener('pagehide', () => { generation++; cancelUpload(); photo?.close(); photo = null; prepared = null; });
