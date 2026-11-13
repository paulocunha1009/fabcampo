import {mascarasCaravana} from './caravana-mascaras.mjs?v=20261113-3';
import {criarSessaoCamera,transformarMascara,centrosDosOlhos} from './caravana-camera.mjs?v=20261113-3';
const $=id=>document.getElementById(id),tela=$('tela'),ctx=tela.getContext('2d'),video=$('video');
let atual=0,modoDemo=true,FaceLandmarker,FilesetResolver,photoURL,captureVersion=0,lastFaces=-1;
const images=new Map(),buttons=[],calibration={scale:1,offset:0};
const say=text=>{$('estado-camera').textContent=text;};
function drawDemo(){
 if(!modoDemo)return;const portrait=matchMedia('(max-width:520px)').matches,W=1000,H=portrait?1333:760;tela.width=W;tela.height=H;const gradient=ctx.createRadialGradient(W/2,H*.45,30,W/2,H*.45,portrait?950:650);gradient.addColorStop(0,'#3b6550');gradient.addColorStop(1,'#112e26');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#d6aa4c66';ctx.lineWidth=2;ctx.strokeRect(22,22,W-44,H-44);ctx.beginPath();ctx.ellipse(W/2,H*.48,portrait?350:230,portrait?480:270,0,0,Math.PI*2);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#eac56f';ctx.font='700 18px Segoe UI';ctx.fillText('PRÉVIA DA MÁSCARA',500,75);
 const image=images.get(mascarasCaravana[atual].id);if(image){const scale=Math.min((portrait?900:510)/image.naturalHeight,(portrait?760:550)/image.naturalWidth),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,(W-w)/2,portrait?155:105,w,h);}
 ctx.fillStyle='#f3e9cf';ctx.font=portrait?'700 40px Segoe UI':'700 30px Segoe UI';ctx.fillText(mascarasCaravana[atual].nome,W/2,H-100);ctx.fillStyle='#c8d4c5';ctx.font='18px Segoe UI';ctx.fillText('Demonstração • câmera desligada • não é uma fotografia',W/2,H-56);ctx.textAlign='start';
}
function select(index){atual=index;buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));$('cartaoNome').textContent=mascarasCaravana[index].nome;$('cartaoInfo').textContent=mascarasCaravana[index].info;if(modoDemo)drawDemo();}
for(const [index,mask] of mascarasCaravana.entries()){
 const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed',String(index===0));const image=new Image();image.alt='';image.width=80;image.height=88;image.decoding='async';image.addEventListener('load',()=>{images.set(mask.id,image);if(atual===index&&modoDemo)drawDemo();});image.addEventListener('error',()=>{button.disabled=true;if(atual===index)say('Esta arte não carregou. Escolha outra máscara ou recarregue a página.');});image.src=mask.imagem;const label=document.createElement('span');label.textContent=mask.nome;button.append(image,label);button.addEventListener('click',()=>select(index));buttons.push(button);$('mascaras').append(button);
}
async function loadDetector(){
 if(!FaceLandmarker)({FaceLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'));
 const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
 const options=delegate=>({baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate},runningMode:'VIDEO',numFaces:$('modo-rostos').value==='4'?4:1});
 try{return await FaceLandmarker.createFromOptions(files,options('GPU'));}catch{return FaceLandmarker.createFromOptions(files,options('CPU'));}
}
function render({video,faces}){
 tela.width=video.videoWidth;tela.height=video.videoHeight;ctx.save();ctx.setTransform(-1,0,0,1,tela.width,0);ctx.drawImage(video,0,0,tela.width,tela.height);
 const mask=mascarasCaravana[atual],image=images.get(mask.id);
 if(image)for(const points of faces){
  const eyes=centrosDosOlhos(points,tela.width,tela.height);if(!eyes)continue;const transform=transformarMascara(eyes[0],eyes[1],{...mask,width:image.naturalWidth,height:image.naturalHeight},{...calibration,chin:points[152]?{x:points[152].x*tela.width,y:points[152].y*tela.height}:null});if(!transform)continue;
  ctx.save();ctx.translate(transform.x,transform.y);ctx.rotate(transform.angle);ctx.scale(transform.scale,transform.scaleY);ctx.drawImage(image,-transform.sourceX,-transform.sourceY);ctx.restore();
 }
 ctx.restore();$('btnFoto').disabled=!image||faces.length===0;
 if(faces.length!==lastFaces){lastFaces=faces.length;say(faces.length?`${faces.length} ${faces.length===1?'rosto detectado.':'rostos detectados.'} Confira o encaixe e tire a foto.`:'Posicione o rosto de frente para a câmera, com boa iluminação.');}
}
const session=criarSessaoCamera({video,mediaDevices:navigator.mediaDevices,carregarDetector:loadDetector,onFrame:render,onState(state){
 const loading=['opening','loading'].includes(state.status);$('btnCamera').disabled=loading;$('btnCamera').hidden=state.status==='active';$('modo-rostos').disabled=loading||state.status==='active';$('btnFoto').disabled=true;$('aviso').hidden=!loading;lastFaces=-1;
 if(state.status==='opening'){$('aviso').textContent='Permita o uso da câmera no navegador. O microfone não será usado.';say('Aguardando a câmera…');}
 if(state.status==='loading'){$('aviso').textContent='Preparando o filtro. Na primeira abertura, aguarde o carregamento com internet.';say('Carregando o filtro…');}
 if(state.status==='active'){modoDemo=false;$('modo-camera').textContent='Câmera ativa';say('Posicione o rosto na câmera.');}
 if(['idle','error'].includes(state.status)){modoDemo=true;$('modo-camera').textContent='Demonstração';drawDemo();if(state.status==='idle')say('Câmera desligada. Você pode explorar as máscaras na demonstração.');else say(({permission:'A câmera foi bloqueada. Confira a permissão do site e toque em Abrir câmera novamente.',missing:'Nenhuma câmera foi encontrada. Neste computador, use a demonstração; teste a captura no celular.',processing:'O filtro parou neste aparelho. Feche outros aplicativos, use uma pessoa por foto e tente novamente.'}[state.reason])||'Não foi possível preparar a câmera ou o filtro. Confira a internet e tente novamente.');}
}});
$('btnCamera').addEventListener('click',()=>{if(!images.get(mascarasCaravana[atual].id)){say('Aguarde a máscara carregar ou escolha outra opção.');return;}void session.start();});
$('btnDemo').addEventListener('click',()=>session.stop());
for(const [id,key,convert] of [['ajuste-tamanho','scale',v=>v/100],['ajuste-altura','offset',v=>v/100]])$(id).addEventListener('input',()=>{calibration[key]=convert(Number($(id).value));$('valor-'+id).textContent=$(id).value+(key==='scale'?'%':'');});
$('restaurar-encaixe').addEventListener('click',()=>{calibration.scale=1;calibration.offset=0;$('ajuste-tamanho').value='100';$('ajuste-altura').value='0';$('valor-ajuste-tamanho').textContent='100%';$('valor-ajuste-altura').textContent='0';});
function clearPhoto(){captureVersion++;if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;$('previa').removeAttribute('src');$('baixar').removeAttribute('href');$('resultado').hidden=true;$('compartilhar').hidden=true;$('compartilhar').onclick=null;}
$('btnFoto').addEventListener('click',()=>{
 if(!session.active||$('btnFoto').disabled)return;const version=++captureVersion,w=tela.width,h=tela.height,u=Math.min(w,h)*.04,band=Math.round(u*5),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h+band;const c=canvas.getContext('2d');c.drawImage(tela,0,0);c.fillStyle='#17382b';c.fillRect(0,h,w,band);c.fillStyle='#dfb34b';c.fillRect(0,h,w,Math.max(3,u/6));c.textBaseline='middle';c.fillStyle='#f8ecd1';c.font=`800 ${u*1.4}px Segoe UI`;c.fillText('Caravana Afro',u,h+band*.32);c.font=`${u*.68}px Segoe UI`;c.fillText('EEMPC Francisco Araújo Barros',u,h+band*.63);c.fillStyle='#e1c985';c.fillText('08 de dezembro de 2026 • Campo Digital',u,h+band*.83);session.stop();say('Preparando a fotografia…');
 canvas.toBlob(blob=>{if(version!==captureVersion)return;if(!blob){say('Não foi possível preparar a foto. Abra a câmera e tente novamente.');return;}if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(blob);$('previa').src=photoURL;$('baixar').href=photoURL;$('baixar').download='caravana-afro-'+Date.now()+'.jpg';let file;try{file=new File([blob],$('baixar').download,{type:'image/jpeg'});}catch{}const share=$('compartilhar');share.hidden=!(file&&navigator.share&&navigator.canShare?.({files:[file]}));share.onclick=async()=>{try{await navigator.share({files:[file],title:'Caravana Afro — Campo Digital'});}catch(error){if(error.name!=='AbortError')say('Este navegador não concluiu o compartilhamento. Use Baixar foto.');}};$('resultado').hidden=false;$('resultado').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});say('Foto pronta neste aparelho. Ela não foi enviada nem publicada no portal.');},'image/jpeg',.9);
});
$('nova-foto').addEventListener('click',()=>{clearPhoto();$('btnCamera').scrollIntoView({block:'center'});$('btnCamera').focus();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)session.stop();});
window.addEventListener('resize',()=>{if(modoDemo)drawDemo();});
window.addEventListener('pagehide',()=>{session.stop();clearPhoto();});
select(0);say('Explore as máscaras. Abra a câmera somente quando quiser fotografar.');





