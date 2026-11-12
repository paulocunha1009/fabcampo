// Atalhos apenas abrem seções e movem o foco. Não trocam registros nem enviam dados.
const destinos={edicao:{alvo:'titulo-edicao'},rascunhos:{secao:'materias-equipe',alvo:'listar-rascunhos'},acervo:{secao:'acervo-equipe',alvo:'listar-acervo'}};
for(const button of document.querySelectorAll('[data-atalho-painel]')){
 const destino=destinos[button.dataset.atalhoPainel];if(!destino)continue;
 button.addEventListener('click',()=>{const alvo=document.getElementById(destino.alvo),secao=destino.secao?document.getElementById(destino.secao):null;if(!alvo)return;if(secao)secao.open=true;(secao||alvo).scrollIntoView({block:'start'});alvo.focus({preventScroll:true});});
}

// Reutiliza a ação e o bloqueio do salvamento existente, sem segunda requisição.
const salvarOriginal=document.getElementById('salvar-no-painel');
const salvarTopo=document.getElementById('salvar-no-topo');
if(salvarOriginal&&salvarTopo){
  const sincronizar=()=>{salvarTopo.disabled=salvarOriginal.disabled;salvarTopo.textContent=salvarOriginal.disabled?'Salvando…':'Salvar no painel';};
  salvarTopo.addEventListener('click',()=>salvarOriginal.click());
  new MutationObserver(sincronizar).observe(salvarOriginal,{attributes:true,attributeFilter:['disabled']});
  sincronizar();
}
