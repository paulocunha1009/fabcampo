// Intercepta o clique antes dos handlers que descartam campos e fotos locais.
const descartar=document.getElementById('cancelar-edicao'),dialog=document.getElementById('confirmar-descarte-local');
let autorizado=false;
descartar.addEventListener('click',event=>{
 if(autorizado||descartar.hidden){autorizado=false;return;}
 event.preventDefault();event.stopImmediatePropagation();
 if(!dialog.open)dialog.showModal();
 document.getElementById('continuar-edicao-local').focus();
},true);
document.getElementById('continuar-edicao-local').addEventListener('click',()=>dialog.close());
document.getElementById('descartar-edicao-local').addEventListener('click',()=>{
 dialog.close();autorizado=true;
 try{descartar.click();}finally{autorizado=false;}
});
dialog.addEventListener('close',()=>{if(!descartar.hidden&&!descartar.closest('[hidden]'))descartar.focus();});
