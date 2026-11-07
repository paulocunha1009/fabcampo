import {obterRegistroAtual} from './painel.js';
import {renderEditorialPage} from '../backend/lib/editorial-page.mjs';
const $=id=>document.getElementById(id);
$('abrir-pagina-reportagem').addEventListener('click',()=>{
  try{
    const {tipo,registro}=obterRegistroAtual();
    if(tipo!=='noticias')throw new Error('A prévia da página completa está disponível para reportagens.');
    $('pagina-reportagem-frame').srcdoc=renderEditorialPage(registro,{preview:true});
    $('pagina-reportagem-frame').style.width='100%';
    $('pagina-reportagem-dialog').showModal();
    $('estado-pagina-reportagem').textContent='Prévia da edição atual. Nenhum salvamento ou publicação foi feito.';
  }catch(error){$('estado-pagina-reportagem').textContent=error.message||'Confira os campos da reportagem antes de abrir a página.';}
});
$('fechar-pagina-reportagem').addEventListener('click',()=>$('pagina-reportagem-dialog').close());
$('pagina-reportagem-dialog').addEventListener('close',()=>{$('pagina-reportagem-frame').srcdoc='';$('abrir-pagina-reportagem').focus();});
for(const [id,width] of [['pagina-desktop','100%'],['pagina-celular','390px']])$(id).addEventListener('click',()=>{$('pagina-reportagem-frame').style.width=width;});
