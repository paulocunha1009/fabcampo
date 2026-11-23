// Aplica a preferência antes da pintura e carrega o controle sem bloquear o menu.
(()=>{
  let preferencia='sistema';
  try{const salva=localStorage.getItem('campo-digital-tema');if(['claro','escuro','sistema'].includes(salva))preferencia=salva}catch{}
  const escuro=preferencia==='escuro'||(preferencia==='sistema'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.tema=escuro?'escuro':'claro';
  const modulo=new URL('components/aparencia.js?v=20261116-1',document.currentScript.src).href;
  const iniciar=()=>import(modulo).catch(()=>{/* O portal continua acessível se o controle não carregar. */});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
