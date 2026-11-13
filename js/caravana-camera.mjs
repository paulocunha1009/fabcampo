// No camera is requested at construction. Only start(), called by the button,
// asks for video; stale async results are disposed after stop() or navigation.
export function criarSessaoCamera({video,mediaDevices,carregarDetector,onState=()=>{},onFrame=()=>{},requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,modelTimeout=30000}={}){
 let generation=0,stream=null,detector=null,frame=null,opening=false,active=false,lastTime=-1,lastDetection=-Infinity,faces=[];
 const tracksOff=value=>{for(const track of value?.getTracks()||[])track.stop();};
 function release(){active=false;opening=false;cancelFrame(frame);frame=null;tracksOff(stream);stream=null;video.pause?.();video.srcObject=null;detector?.close();detector=null;faces=[];lastTime=-1;lastDetection=-Infinity;}
 function stop(){generation++;release();onState({status:'idle'});}
 async function start(){
  if(opening||active)return;const version=++generation;opening=true;onState({status:'opening'});
  try{
   if(!mediaDevices?.getUserMedia)throw Object.assign(Error(),{name:'NotSupportedError'});
   const received=await mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:960},height:{ideal:720}},audio:false});
   if(version!==generation){tracksOff(received);return;}stream=received;video.srcObject=stream;await video.play();if(version!==generation)return;
   onState({status:'loading'});const pending=Promise.resolve().then(carregarDetector);let receivedDetector,timer;
   try{receivedDetector=await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('MODEL_TIMEOUT')),modelTimeout);})]);}
   catch(error){pending.then(value=>value.close(),()=>{});throw error;}
   finally{clearTimeout(timer);}
   if(version!==generation){receivedDetector.close();return;}detector=receivedDetector;active=true;opening=false;onState({status:'active'});
   function draw(timestamp){if(version!==generation||!active)return;try{
    if(video.readyState>=2&&video.videoWidth>0&&video.videoHeight>0){
     if(video.currentTime!==lastTime&&timestamp-lastDetection>=1000/12){lastTime=video.currentTime;lastDetection=timestamp;faces=detector.detectForVideo(video,timestamp).faceLandmarks||[];}
     onFrame({video,faces});
    }
    frame=requestFrame(draw);
   }catch{if(version===generation){generation++;release();onState({status:'error',reason:'processing'});}}}
   frame=requestFrame(draw);
  }catch(error){if(version!==generation)return;release();onState({status:'error',reason:['NotAllowedError','SecurityError'].includes(error.name)?'permission':error.name==='NotFoundError'?'missing':'unavailable'});}
 }
 return {start,stop,get active(){return active;}};
}

export function transformarMascara(eyeLeft,eyeRight,asset,{scale=1,offset=0}={}){
 if(!Number.isFinite(scale)||scale<.5||scale>2||!Number.isFinite(offset)||Math.abs(offset)>1)return null;
 const left=asset.olhos[0],right=asset.olhos[1],dx=eyeRight.x-eyeLeft.x,dy=eyeRight.y-eyeLeft.y;
 const sourceDistance=Math.hypot((right.x-left.x)*asset.width,(right.y-left.y)*asset.height),distance=Math.hypot(dx,dy);
 if(!Number.isFinite(distance)||distance<2||!Number.isFinite(sourceDistance)||sourceDistance<=0)return null;
 return {x:(eyeLeft.x+eyeRight.x)/2,y:(eyeLeft.y+eyeRight.y)/2+offset*distance,angle:Math.atan2(dy,dx)-Math.atan2((right.y-left.y)*asset.height,(right.x-left.x)*asset.width),scale:distance/sourceDistance*scale,sourceX:(left.x+right.x)/2*asset.width,sourceY:(left.y+right.y)/2*asset.height};
}
