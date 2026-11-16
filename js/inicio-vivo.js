let destaques=[
 {titulo:'A Escola que Nasce da Terra',categoria:'REPORTAGEM · EDUCAÇÃO DO CAMPO',resumo:'Conheça a escola, sua trajetória e a relação com o território.',img:'img/galeria/educacao-escola.jpg',alt:'Fachada da Escola Francisco Araújo Barros',link:'pages/reportagem-educacao.html',acao:'Ler reportagem'},
 {titulo:'IA na Educação',categoria:'REPORTAGEM · TECNOLOGIA',resumo:'Uma leitura sobre inteligência artificial e educação no portal.',img:'img/galeria/educacao-projeto.jpg',alt:'Estudantes apresentando projeto educativo',link:'pages/materia_ia_educacao_v2.html',acao:'Ler reportagem'},
 {titulo:'As raízes que nos definem',categoria:'PÁGINA · NOSSA HISTÓRIA',resumo:'Explore a história do assentamento e da nossa comunidade.',img:'img/galeria/rolo-03.jpg',alt:'Encontro da comunidade no território',link:'pages/historia.html',acao:'Conhecer a história'}
];
let indice=0,pausado=matchMedia('(prefers-reduced-motion: reduce)').matches,hover=false;
const painel=document.querySelector('.painel-destaques'),chamada=document.querySelector('#chamada-principal'),pause=document.querySelector('#destaque-pausar');
function mostrar(n){indice=(n+destaques.length)%destaques.length;const d=destaques[indice];chamada.href=d.link;const image=document.querySelector('#chamada-imagem');image.src=d.img;image.alt=d.alt;image.onerror=()=>{image.onerror=null;image.src='img/galeria/educacao-escola.jpg'};document.querySelector('#chamada-titulo').textContent=d.titulo;document.querySelector('#chamada-categoria').textContent=d.categoria;document.querySelector('#chamada-resumo').textContent=d.resumo;const action=chamada.querySelector('strong');action.textContent=d.acao+' ↗';document.querySelector('.chamada-numero').textContent=`${String(indice+1).padStart(2,'0')} / ${String(destaques.length).padStart(2,'0')}`;document.querySelectorAll('[data-indice]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===indice)))}
function sync(){pause.textContent=pausado?'▶':'Ⅱ';pause.setAttribute('aria-label',pausado?'Retomar alternância automática':'Pausar alternância automática')}
document.querySelector('.destaques-pontos').addEventListener('click',event=>{const b=event.target.closest('[data-indice]');if(b){pausado=true;sync();mostrar(Number(b.dataset.indice))}});
document.querySelector('#destaque-anterior').addEventListener('click',()=>{pausado=true;sync();mostrar(indice-1)});
document.querySelector('#destaque-proximo').addEventListener('click',()=>{pausado=true;sync();mostrar(indice+1)});
pause.addEventListener('click',()=>{pausado=!pausado;sync()});painel.addEventListener('mouseenter',()=>hover=true);painel.addEventListener('mouseleave',()=>hover=false);
setInterval(()=>{if(!pausado&&!hover&&!document.hidden&&!painel.contains(document.activeElement))mostrar(indice+1)},8000);sync();

const destaquesFixos=destaques;
let carregando=false,assinatura='';
async function atualizarReportagens(){
 if(carregando||document.hidden||painel.contains(document.activeElement))return;
 carregando=true;
 try{
  const response=await fetch('data/site.json',{cache:'no-store',signal:AbortSignal.timeout(7000)});
  if(!response.ok)throw Error('Lista indisponível');
  const data=await response.json();
  if(!Array.isArray(data.noticias))throw Error('Lista inválida');
  const noticias=data.noticias.filter(n=>n&&typeof n.editorialId==='string'&&typeof n.titulo==='string'&&/^pages\/[\w%-]+\.html$/.test(n.link||'')).sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))).filter((n,i,arr)=>arr.findIndex(x=>x.link===n.link)===i).slice(0,5);
  const novaAssinatura=JSON.stringify(noticias);
  if(novaAssinatura===assinatura)return;
  const lista=await Promise.all(noticias.map(async n=>{
   let img='img/galeria/educacao-escola.jpg',alt=n.titulo;
   try{
    const page=await fetch(n.link,{cache:'no-store',signal:AbortSignal.timeout(7000)});
    if(!page.ok) return null;
    const doc=new DOMParser().parseFromString(await page.text(),'text/html');
    const capa=doc.querySelector('meta[property="og:image"]')?.content;
    if(capa){const u=new URL(capa,new URL(n.link,location.href));if(u.origin===location.origin&&/\.(?:webp|png|jpe?g)$/i.test(u.pathname))img=u.href;}
   }catch{/* Preserva o destaque com imagem de contingência em falhas temporárias. */}
   return {titulo:n.titulo,categoria:'REPORTAGEM · '+String(n.categoria||'CAMPO DIGITAL').toUpperCase(),resumo:String(n.resumo||'Leia a reportagem completa no portal.'),img,alt,link:n.link,acao:'Ler reportagem'};
  }));
  if(painel.contains(document.activeElement))return;
  destaques=lista.filter(Boolean);if(!destaques.length)destaques=destaquesFixos;
  assinatura=novaAssinatura;
  const pontos=document.querySelector('.destaques-pontos');pontos.replaceChildren();
  destaques.forEach((d,i)=>{const button=document.createElement('button');button.type='button';button.dataset.indice=String(i);button.setAttribute('aria-label','Mostrar: '+d.titulo);pontos.append(button)});
  mostrar(0);
 }catch{/* Sem rede, mantém a seleção já disponível. */}
 finally{carregando=false}
}
atualizarReportagens();
setInterval(atualizarReportagens,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)atualizarReportagens()});
