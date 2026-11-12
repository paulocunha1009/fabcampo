// Controla apenas as telas. Toda operação privada continua autorizada na API.
const $=id=>document.getElementById(id);
const badge=$('situacao-acesso');
let conectado=false;
function tela(nome,foco=true){
  for(const [id,valor] of [['entrada-painel','entrada'],['inicio-painel','inicio'],['trabalho-painel','trabalho']])$(id).hidden=nome!==valor;
  if(foco){const alvo=$(nome==='entrada'?'titulo-entrada':nome==='inicio'?'titulo-inicio':'titulo-atalhos');alvo?.scrollIntoView({block:'start'});alvo?.focus();}
}
function conferir(){
  const autorizado=badge.dataset.estado==='conectada';
  if(autorizado===conectado)return;
  conectado=autorizado;
  if(!conectado)for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
  tela(conectado?'inicio':'entrada');
}
function abrirFuncao(tipo){
  if(!conectado)return;
  const botao=document.querySelector(`[data-tipo="${tipo}"]`);
  const selecionado=botao.getAttribute('aria-pressed')==='true';
  if(!selecionado&&botao.disabled){$('estado-funcoes').textContent='Existe uma edição em andamento. Volte à função aberta e guarde a prévia ou descarte a edição antes de trocar de função. Para retomar depois, salve também no painel.';return;}
  if(!selecionado)botao.click();
  $('estado-funcoes').textContent='';document.dispatchEvent(new CustomEvent('editorial-funcao-aberta',{detail:tipo}));tela('trabalho');return true;
}
$('abrir-reportagens').addEventListener('click',()=>{if(abrirFuncao('noticias')){$('titulo-edicao').scrollIntoView({block:'start'});$('titulo-edicao').focus();}});
$('abrir-eventos').addEventListener('click',()=>{if(abrirFuncao('eventos')){$('titulo-edicao').scrollIntoView({block:'start'});$('titulo-edicao').focus();}});
function abrirLista(publicadas){
 if(!conectado)return;
 tela('trabalho',false);$('materias-equipe').open=true;
 $('filtro-materias').value='ativas';$('tipo-materias').value='todos';$('estado-materias').value=publicadas?'no-ar':'todos';$('busca-materias').value='';
 $('estado-materias').dispatchEvent(new Event('change'));
 $('materias-equipe').scrollIntoView({block:'start'});$('listar-rascunhos').focus();
}
$('abrir-rascunhos-central').addEventListener('click',()=>abrirLista(false));
$('abrir-publicacoes-central').addEventListener('click',()=>abrirLista(true));
const orientacaoReportagem=$('orientacao-trabalho').innerHTML;
function ajustarFuncao(){
  const evento=document.querySelector('[data-tipo="eventos"]').getAttribute('aria-pressed')==='true';
  for(const id of ['ir-publicacao','area-publicacao','acervo-equipe'])$(id).hidden=evento;
  $('publicacao-evento').hidden=!evento;
  document.querySelector('[data-atalho-painel="acervo"]').hidden=evento;
  document.querySelector('[data-atalho-painel="edicao"] strong').textContent=evento?'Dados, imagem e revisão':'Texto, fotos e revisão';
  $('orientacao-trabalho').innerHTML=evento?'Salve seu evento no painel e aguarde a confirmação da revisão. Atualizar a prévia não salva no servidor. Para publicar, abra Publicação do evento na agenda e confirme as informações.':orientacaoReportagem;
}
document.addEventListener('editorial-record-loaded',()=>queueMicrotask(ajustarFuncao));
ajustarFuncao();
$('voltar-inicio-painel').addEventListener('click',()=>{if(conectado)tela('inicio');});
new MutationObserver(conferir).observe(badge,{attributes:true,attributeFilter:['data-estado']});
tela('entrada',false);conferir();
