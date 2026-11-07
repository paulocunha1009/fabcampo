import { requestAuthorizedAction } from './login.js';
import { EDITORIAL_API } from './auth-config.js';
import { validarPesquisaArquivo } from './pesquisa-core.js';
const $=id=>document.getElementById(id);
let pending,proposal,version=0;
function countResearch(){const count=$('pesquisa').value.length;$('contador-pesquisa').textContent=count.toLocaleString('pt-BR')+' de 12.000 caracteres'+(count===12000?' — limite atingido.':'');}
$('pesquisa').addEventListener('input',countResearch);
document.addEventListener('editorial-record-loaded',countResearch);
countResearch();
const snapshot=()=>JSON.stringify(['pesquisa','pesquisaArquivo','titulo','subtitulo','resumo','texto','cards'].map(id=>$(id).value));
function reset(){version++;pending?.abort();proposal=null;$('proposta-reportagem').hidden=true;}
function block(label,part){
  const section=document.createElement('section');section.className='parte-reportagem';
  const heading=document.createElement('h4');heading.textContent=label;
  const text=document.createElement('p');text.textContent=part.texto;
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Conferir trechos da pesquisa';details.append(summary);
  part.fontes.forEach(source=>{const quote=document.createElement('blockquote');quote.textContent=source.texto;details.append(quote);});
  section.append(heading,text,details);return section;
}
$('estruturar-reportagem').addEventListener('click',()=>{
  if(pending)return;
  const pesquisa=$('pesquisa').value.trim(),original=snapshot(),current=version;
  let arquivo;
  try{arquivo=validarPesquisaArquivo(JSON.parse($('pesquisaArquivo').value||'null'));}catch{$('estado-reportagem').textContent='Confira o texto e os limites do arquivo importado.';return;}
  if(arquivo && !arquivo.conferido){$('estado-reportagem').textContent='Confira o texto do arquivo e marque a confirmação antes de usar a IA.';return;}
  if((pesquisa+'\n'+(arquivo?.texto||'')).trim().length<120){$('estado-reportagem').textContent='Registre ou importe pelo menos 120 caracteres de pesquisa antes de solicitar a reportagem.';return;}
  $('estado-reportagem').textContent='Confirme sua conta Google para organizar a pesquisa.';
  requestAuthorizedAction(async credential=>{
    if(current!==version || original!==snapshot())return;
    const controller=new AbortController();pending=controller;const timer=setTimeout(()=>controller.abort(),25000);
    $('estruturar-reportagem').disabled=true;proposal=null;$('proposta-reportagem').hidden=true;
    $('estado-reportagem').textContent='Organizando a pesquisa. O original permanece preservado.';
    try{
      const response=await fetch(EDITORIAL_API.replace(/\/me$/,'/reportagem'),{method:'POST',headers:{Authorization:`Bearer ${credential}`,'Content-Type':'application/json'},body:JSON.stringify({pesquisa,arquivo}),credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
      if(!response.ok)throw new Error();
      const value=await response.json();
      if(controller.signal.aborted || current!==version || original!==snapshot())return;
      if(value.requiresReview!==true || !Array.isArray(value.secoes) || !Array.isArray(value.cards) || !Array.isArray(value.lacunas))throw new Error();
      const holder=$('conteudo-proposta');holder.replaceChildren();
      for(const [label,part] of [['Título',value.titulo],['Subtítulo',value.subtitulo],['Abertura',value.abertura]])holder.append(block(label,part));
      value.secoes.forEach(section=>holder.append(block(section.intertitulo,section)));
      const cards=document.createElement('p');cards.textContent='Cards: '+(value.cards.map(card=>card.titulo).join(' · ')||'Nenhum sugerido.');holder.append(cards);
      const gaps=document.createElement('p');gaps.className='painel-aviso';gaps.textContent=value.lacunas.length ? 'Confira na pesquisa: '+value.lacunas.join(', ')+'. Complete somente após confirmar.' : 'A IA não apontou lacunas. Isso não substitui a conferência das fontes e dos fatos.';holder.append(gaps);
      proposal={value,original};$('proposta-reportagem').hidden=false;
      $('estado-reportagem').textContent='Proposta pronta. Confira os trechos de apoio antes de usar. O rascunho ainda não foi alterado.';
    }catch{if(current===version)$('estado-reportagem').textContent='Não foi possível conferir a proposta. A pesquisa e o rascunho foram preservados.';}
    finally{clearTimeout(timer);if(pending===controller)pending=null;$('estruturar-reportagem').disabled=false;}
  });
});
$('aplicar-reportagem').addEventListener('click',()=>{
  if(!proposal || proposal.original!==snapshot()){reset();$('estado-reportagem').textContent='A pesquisa ou a edição mudou. Solicite uma nova proposta.';return;}
  const {value}=proposal;
  $('titulo').value=value.titulo.texto;$('subtitulo').value=value.subtitulo.texto;$('resumo').value=value.subtitulo.texto;
  $('texto').value=[value.abertura.texto,...value.secoes.map(section=>'## '+section.intertitulo+'\n'+section.texto)].join('\n\n');
  $('cards').value=JSON.stringify(value.cards);$('cards').dispatchEvent(new Event('input',{bubbles:true}));
  document.dispatchEvent(new Event('editorial-cards-updated'));reset();
  $('estado-reportagem').textContent='Reportagem aplicada à edição local. A pesquisa original foi mantida. Revise e use “Salvar no painel” para confirmar o salvamento.';
});
$('descartar-reportagem').addEventListener('click',()=>{reset();$('estado-reportagem').textContent='Proposta descartada. A pesquisa e a reportagem foram preservadas.';});
document.addEventListener('editorial-record-loaded',reset);
document.addEventListener('editorial-access-cleared',reset);
document.addEventListener('editorial-research-changed',reset);
window.addEventListener('pagehide',reset);
