import {criarCalendario} from './calendario-campo.mjs?v=20261118-1';
import {gerarCalendarioEvento} from './agenda-calendario.mjs?v=20261112-10';
import {agruparEventos} from './agenda-core.mjs?v=20261112-8';
const destino=document.getElementById('lista-agenda-escola'),estado=document.getElementById('estado-agenda-escola');
function texto(tag,value,parent){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
function cardEvento(item,parent,hoje){
 const card=document.createElement('article');card.className='agenda-evento';
 if(item.data===hoje)texto('p','Hoje',card).className='selo';
 const titulo=texto('h4',item.nome,card);
 if(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(item.id||'')){titulo.id='titulo-evento-'+item.id;card.setAttribute('aria-labelledby',titulo.id);}
 const dados=document.createElement('dl');dados.className='agenda-evento-dados';
 const data=new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeZone:'America/Fortaleza'}).format(new Date(item.data+'T12:00:00Z'));
 for(const [label,value] of [['Data',data],['Horário',item.horario],['Local',item.local]]){texto('dt',label,dados);const dd=texto('dd','',dados);if(label==='Data'||label==='Horário'){const tempo=texto('time',value,dd);tempo.dateTime=label==='Data'?item.data:item.horario;}else dd.textContent=value;}card.append(dados);
 texto('p',item.descricao,card);
 for(const [key,label] of [['publico','Público'],['participacao','Como participar'],['responsavel','Responsável'],['contato','Contato institucional']]){const p=document.createElement('p');texto('strong',label+': ',p);p.append(document.createTextNode(item[key]));card.append(p);}
 if(/^img\/editorial\/[a-f0-9]{64}\.webp$/.test(item.imagem||'')){const image=document.createElement('img');image.src=item.imagem;image.alt=item.textoAlternativo||'';image.loading='lazy';card.append(image);texto('p',(item.legenda||'')+' · Crédito: '+(item.credito||''),card).className='agenda-legenda';}
 if(item.data>=hoje&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(item.id||'')){
  const botao=texto('button','Adicionar ao calendário',card);botao.type='button';botao.className='agenda-calendario';botao.setAttribute('aria-label','Adicionar ao calendário: '+item.nome);
  const ajuda=texto('p','Baixa um arquivo de calendário com o início do evento. Abra no seu aplicativo para adicionar. O arquivo não acompanha mudanças posteriores da agenda.',card);ajuda.className='agenda-legenda';ajuda.id='ajuda-calendario-'+item.id;ajuda.setAttribute('role','status');botao.setAttribute('aria-describedby',ajuda.id);
  botao.addEventListener('click',()=>{let url;const link=document.createElement('a');try{url=URL.createObjectURL(new Blob([gerarCalendarioEvento(item)],{type:'text/calendar;charset=utf-8'}));link.href=url;link.download='fabcampo-evento-'+item.id+'.ics';document.body.append(link);link.click();ajuda.textContent='Download solicitado. Abra o arquivo no seu aplicativo de calendário e confira os dados antes de adicionar.';}catch{ajuda.textContent='Não foi possível gerar o arquivo. Confira os dados do evento na agenda.';}finally{link.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}});
 }
 parent.append(card);
}
if(destino&&estado){
const assinatura=document.createElement('details');assinatura.className='agenda-assinatura';assinatura.innerHTML='<summary>Acompanhar a agenda no Google</summary><p>Adicione esta agenda por URL no Google Agenda, pelo computador. Depois, os eventos publicados serão atualizados conforme a consulta do Google. Esta assinatura contém somente eventos da escola, sem reportagens ou rascunhos.</p><label for="url-agenda-escolar">URL da agenda escolar</label><input id="url-agenda-escolar" readonly value="https://fabcampo-api.vercel.app/api/agenda-escola.ics"><p><a href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl" target="_blank" rel="noopener noreferrer">Abrir Google Agenda para adicionar por URL</a></p>';destino.before(assinatura);
const calendario=criarCalendario(document.getElementById('calendario-escola'),{titulo:'Calendário dos eventos da escola',onSelect:data=>{for(const card of destino.querySelectorAll('.agenda-evento'))card.hidden=card.querySelector('time')?.dateTime!==data;}});const todos=texto('button','Mostrar todos os eventos',document.createDocumentFragment());todos.type='button';todos.className='agenda-calendario agenda-mostrar-todos';document.getElementById('calendario-escola').after(todos);todos.addEventListener('click',()=>{calendario.selecionar('');for(const card of destino.querySelectorAll('.agenda-evento'))card.hidden=false;});
 const atualizar=texto('button','Atualizar agenda',document.createDocumentFragment());atualizar.type='button';atualizar.id='atualizar-agenda-escola';atualizar.className='agenda-calendario';atualizar.setAttribute('aria-controls','lista-agenda-escola');destino.before(atualizar);
 let carregando=false,carregada=false;
 async function carregar(){
  if(carregando)return;const devolverFoco=document.activeElement===atualizar;carregando=true;atualizar.disabled=true;atualizar.textContent='Carregando…';destino.setAttribute('aria-busy','true');estado.textContent=carregada?'Atualizando os eventos…':'Carregando agenda…';
  try{
  const url=new URL('../data/eventos-escola.json',import.meta.url);url.searchParams.set('v',String(Date.now()));
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error();const data=await response.json();if(data.version!==1)throw Error();const grupos=agruparEventos(data.eventos),conteudo=document.createDocumentFragment();
  texto('h3','Próximos eventos',conteudo);
  if(!grupos.proximos.length)texto('p','Nenhum evento divulgado para hoje ou para os próximos dias.',conteudo);
  for(const item of grupos.proximos)cardEvento(item,conteudo,grupos.hoje);
  if(grupos.anteriores.length){const anteriores=document.createElement('details');anteriores.className='agenda-anteriores';texto('summary',`Eventos anteriores (${grupos.anteriores.length})`,anteriores);texto('p','Eventos com data anterior a hoje, do mais recente ao mais antigo.',anteriores);for(const item of grupos.anteriores)cardEvento(item,anteriores,grupos.hoje);conteudo.append(anteriores);}
  destino.replaceChildren(conteudo);calendario.atualizar(data.eventos.map(e=>({data:e.data,titulo:e.horario+' · '+e.nome})));carregada=true;atualizar.textContent='Atualizar agenda';estado.textContent=data.eventos.length?'Datas organizadas pelo horário de Fortaleza. Os eventos de hoje permanecem em Próximos eventos durante todo o dia.':'Nenhum evento foi divulgado nesta agenda ainda.';
  }catch{estado.textContent=carregada?'Não foi possível atualizar a agenda. Os eventos exibidos são da consulta anterior. Tente novamente.':'Não foi possível carregar a agenda. Use Tentar novamente para consultar os eventos.';atualizar.textContent='Tentar novamente';}
  finally{carregando=false;atualizar.disabled=false;destino.setAttribute('aria-busy','false');if(devolverFoco&&(document.activeElement===document.body||document.activeElement===atualizar))atualizar.focus({preventScroll:true});}
 }
 atualizar.addEventListener('click',carregar);void carregar();
}
