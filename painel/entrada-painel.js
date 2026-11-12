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
$('abrir-reportagens').addEventListener('click',()=>{if(conectado)tela('trabalho');});
$('voltar-inicio-painel').addEventListener('click',()=>{if(conectado)tela('inicio');});
new MutationObserver(conferir).observe(badge,{attributes:true,attributeFilter:['data-estado']});
tela('entrada',false);conferir();
