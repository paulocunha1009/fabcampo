import {validarPesquisaArquivo,validarArquivoSelecionado,decodificarMarkdown,extrairPaginasPDF} from './pesquisa-core.js';
import {EDITORIAL_API} from './auth-config.js';
const $=id=>document.getElementById(id);
let attachment=null,version=0,loadingTask;
function notify(message){$('estado-arquivo-pesquisa').textContent=message;}
function commit(){
  $('pesquisaArquivo').value=JSON.stringify(attachment);$('pesquisaArquivo').dispatchEvent(new Event('input',{bubbles:true}));
  document.dispatchEvent(new Event('editorial-research-changed'));
}
function draw(){
  $('revisao-arquivo-pesquisa').hidden=!attachment;
  $('texto-arquivo-pesquisa').value=attachment?.texto||'';
  $('conferir-arquivo-pesquisa').checked=attachment?.conferido||false;
  $('nome-arquivo-pesquisa').textContent=attachment ? attachment.nome+(attachment.paginas?' · '+attachment.paginas+' páginas':'')+' · '+attachment.texto.length.toLocaleString('pt-BR')+' de 40.000 caracteres':'';
}
export async function extrairPDF(bytes,{onTask=()=>{}}={}){
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('O arquivo não é um PDF válido.');
  const pdfjs=await import('./vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
  const task=pdfjs.getDocument({data:bytes,isEvalSupported:false,disableFontFace:true,useSystemFonts:false,useWasm:false,stopAtErrors:true,
    cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href});
  onTask(task);
  try{
    const pdf=await task.promise;
    return await extrairPaginasPDF(pdf);
  }catch(error){if(error.name==='PasswordException')throw new Error('Use um PDF sem senha para importar a pesquisa.');throw error;}
  finally{await task.destroy();}
}
$('arquivo-pesquisa').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  const current=++version;let timer;
  $('arquivo-pesquisa').disabled=true;$('estruturar-reportagem').disabled=true;notify('Lendo o arquivo neste computador...');
  try{
    const tipo=validarArquivoSelecionado(file),bytes=new Uint8Array(await file.arrayBuffer());
    timer=setTimeout(()=>{loadingTask?.destroy();},30000);
    const result=tipo==='pdf'?await extrairPDF(bytes,{onTask:task=>{loadingTask=task;}}):{texto:decodificarMarkdown(bytes),paginas:0};
    const next=validarPesquisaArquivo({nome:file.name,tipo,...result,conferido:false});
    if(current!==version)return;
    attachment=next;commit();draw();notify('Texto importado sem cortes. Confira a leitura abaixo e marque a confirmação antes de solicitar a reportagem.');
  }catch(error){if(current===version)notify((error.message||'Não foi possível ler o arquivo.')+' A pesquisa anterior foi preservada.');}
  finally{clearTimeout(timer);loadingTask=null;$('arquivo-pesquisa').disabled=false;$('estruturar-reportagem').disabled=false;}
});
$('texto-arquivo-pesquisa').addEventListener('input',()=>{
  if(!attachment)return;
  attachment={...attachment,texto:$('texto-arquivo-pesquisa').value,conferido:false};commit();
  $('conferir-arquivo-pesquisa').checked=false;
  $('nome-arquivo-pesquisa').textContent=attachment.nome+' · '+attachment.texto.length.toLocaleString('pt-BR')+' de 40.000 caracteres';
});
$('conferir-arquivo-pesquisa').addEventListener('change',()=>{if(attachment){attachment.conferido=$('conferir-arquivo-pesquisa').checked;commit();}});
$('remover-arquivo-pesquisa').addEventListener('click',()=>{version++;loadingTask?.destroy();attachment=null;commit();draw();notify('Referência removida desta edição. O arquivo original no computador não foi alterado.');});
document.addEventListener('editorial-record-loaded',()=>{version++;loadingTask?.destroy();attachment=validarPesquisaArquivo(JSON.parse($('pesquisaArquivo').value||'null'));draw();notify(attachment?'Texto do arquivo recuperado do rascunho privado. Confira antes de usar.':'Nenhum arquivo de pesquisa importado.');});
window.addEventListener('pagehide',()=>{version++;loadingTask?.destroy();});
fetch(EDITORIAL_API.replace(/\/api\/editorial\/me$/,'/health'),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(5000)})
  .then(response=>{if(!response.ok)throw new Error();return response.json();})
  .then(value=>{const {globalDay,globalMinute}=value.limits||{};if(!Number.isInteger(globalDay)||!Number.isInteger(globalMinute))return;
    $('cota-reportagem').textContent='Cota atual do portal: até '+globalDay+' solicitações de IA por dia e '+globalMinute+' por minuto, compartilhadas com o SabIA e os cards. Cada geração ou nova tentativa usa uma solicitação. Importar e conferir arquivos não usa IA. Esses números não garantem reportagens aprovadas: a revisão é obrigatória.';}).catch(()=>{});
