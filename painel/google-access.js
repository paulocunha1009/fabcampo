// This only checks access. It never writes content or creates a browser session.
export function createGoogleAccess({ endpoint, identityEndpoint, request = fetch, onState = () => {} }) {
  let generation = 0;
  let pending;
  function clear() {
    generation++;
    pending?.abort();
    pending = null;
    onState({ status: 'signed-out' });
  }
  async function signIn(credential) {
    clear();
    const current = generation;
    if (typeof credential !== 'string' || !credential || credential.length > 12000) {
      onState({ status: 'invalid' }); return;
    }
    const controller = new AbortController();
    pending = controller;
    const timer = setTimeout(() => controller.abort(), 10000);
    onState({ status: 'checking' });
    try {
      const response = await request(endpoint, { method: 'GET',
        headers: { Authorization: `Bearer ${credential}` },
        credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal });
      if (current !== generation) return;
      if (!response.ok) {
        if(identityEndpoint && [403,503].includes(response.status)) {
          const identity = await request(identityEndpoint,{method:'GET',headers:{Authorization:`Bearer ${credential}`},credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
          if(current !== generation) return;
          if(identity.ok){
            const data=await identity.json();
            if(current !== generation) return;
            if(data.role==='pending' && typeof data.account?.id==='string' && data.account.id && typeof data.account?.email==='string') {
              onState({status:'pending',email:data.account.email,id:data.account.id});return;
            }
          }
        }
        onState({ status: ({ 401: 'invalid', 403: 'denied', 503: 'unavailable' })[response.status] || 'error' });
        return;
      }
      const data = await response.json();
      if (current !== generation) return;
      if (data?.role !== 'editor' || typeof data.account?.id !== 'string' || !data.account.id ||
          typeof data.account?.email !== 'string' || !data.account.email.includes('@')) {
        onState({ status: 'error' }); return;
      }
      // Do not retain ID tokens, even after success. Future writes must implement
      // their own server authorization; this result never enables publication.
      onState({ status: 'authorized', email: data.account.email });
      return data.account;
    } catch {
      if (current === generation) onState({ status: 'error' });
    } finally {
      clearTimeout(timer);
      if (current === generation) pending = null;
    }
  }
  return { signIn, clear };
}
