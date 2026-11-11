// Teacher/editor session only. Never persists credentials in browser storage.
export function createEditorSession({ clock=Date.now, maxDuration=10*60*1000, onExpire=()=>{} }={}) {
  let token, deadline=0, timer;
  function clear(){token=undefined;deadline=0;clearTimeout(timer);timer=undefined;}
  function expire(){const hadToken=Boolean(token);clear();if(hadToken)onExpire();}
  function remember(credential, expiresAt){
    clear();
    if(typeof credential!=='string' || !credential || !Number.isFinite(expiresAt))return;
    deadline=Math.min(expiresAt-10000,clock()+maxDuration);
    if(deadline<=clock())return;
    token=credential;timer=setTimeout(expire,deadline-clock());timer?.unref?.();
  }
  function get(){if(clock()>=deadline)expire();return token;}
  return {remember,get,clear};
}
