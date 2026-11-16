const dialog=document.querySelector('#foto-portal');
const imagem=dialog.querySelector('img');
const legenda=dialog.querySelector('p');
document.querySelectorAll('[data-foto-portal]').forEach(button=>button.addEventListener('click',()=>{
 const original=button.querySelector('img');imagem.src=original.src;imagem.alt=original.alt;
 legenda.textContent=button.dataset.legenda;dialog.showModal();
}));
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});

