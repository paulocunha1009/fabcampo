import { GOOGLE_CLIENT_ID, EDITORIAL_API, GOOGLE_ALLOWED_ORIGINS } from './auth-config.js';
import { createGoogleAccess } from './google-access.js?v=20261112-18';
import { createEditorSession } from './editor-session.js?v=20261110-9';

const start = document.getElementById('preparar-login');
const signOut = document.getElementById('sair-painel');
const slot = document.getElementById('botao-google');
const status = document.getElementById('estado-acesso');
let sdk;
let loading;
let pageVersion = 0;
let pendingAction;
let initializedVersion=-1;
const badge=document.getElementById('situacao-acesso');
const session=createEditorSession({onExpire(){badge.textContent='Entre novamente';badge.dataset.estado='pendente';status.textContent='Seu acesso expirou. Clique no botão Google nesta aba para continuar. Os textos abertos foram preservados.';}});
export function requestAuthorizedAction(action) {
  const credential=session.get();
  if(credential){void action(credential);return;}
  pendingAction = action;
  start.closest('details').open = true;
  start.hidden = false;
  start.scrollIntoView({block:'center'});
  start.click();
}
const messages = {
  'signed-out': 'Nenhuma conta conectada. A prévia local de rascunhos continua disponível.',
  checking: 'Conferindo sua conta no servidor...',
  invalid: 'A entrada não pôde ser validada. Tente novamente com o Google.',
  denied: 'Esta conta não está autorizada para o painel. Procure o professor responsável.',
  unavailable: 'A configuração de acesso ainda não foi concluída no servidor. Nenhuma publicação foi liberada.',
  error: 'Não foi possível conferir o acesso. Tente novamente. Seu rascunho foi preservado.',
};
const access = createGoogleAccess({ endpoint: EDITORIAL_API, identityEndpoint:EDITORIAL_API.replace(/\/me$/,'/identidade'), onState(state) {
  document.dispatchEvent(new CustomEvent('editorial-permissions',{detail:state.status==='authorized'?state.permissions:null}));
  status.dataset.googleSubject=state.status === 'pending' ? state.id:'';
  status.textContent = state.status === 'pending' ? `Conta Google confirmada: ${state.email}. O acesso de editor ainda precisa ser autorizado pelo responsável.` : state.status === 'authorized'
    ? `Conta conferida: ${state.email}. Confira a revisão salva antes de publicar.` : messages[state.status];
  signOut.hidden = !['authorized', 'checking','pending'].includes(state.status);
  badge.textContent=state.status==='authorized'?'Conta conectada':state.status==='checking'?'Conferindo conta…':'Entrada necessária';
  badge.dataset.estado=state.status==='authorized'?'conectada':'pendente';
  // A response to an access check is not a persistent login session.
} });

function loadSdk() {
  if (sdk) return Promise.resolve(sdk);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => { clearTimeout(timer); script.remove(); loading = null; reject(new Error('SDK unavailable')); };
    const timer = setTimeout(fail, 10000);
    script.src = 'https://accounts.google.com/gsi/client?hl=pt-BR';
    script.async = true;
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timer);
      if (!window.google?.accounts?.id) { fail(); return; }
      sdk = window.google.accounts.id; resolve(sdk);
    };
    document.head.append(script);
  });
  return loading;
}

start.addEventListener('click', async () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_ALLOWED_ORIGINS.includes(location.origin)) {
    status.textContent = 'Esta prévia local não está autorizada para entrada Google. A validação real será feita no endereço oficial do portal.';
    return;
  }
  const version = pageVersion;
  start.disabled = true;
  status.textContent = 'Preparando o botão Google...';
  try {
    const google = await loadSdk();
    if (version !== pageVersion) return;
    if(initializedVersion!==version){google.initialize({ client_id: GOOGLE_CLIENT_ID, auto_select: false,
      ux_mode: 'popup', callback: async response => {
        if (version !== pageVersion) return;
        session.clear();
        const action = pendingAction;
        pendingAction = null;
        const account = await access.signIn(response?.credential);
        if(account && version === pageVersion){session.remember(response.credential,account.expiresAt);if(action)await action(response.credential);}
      } });initializedVersion=version;}
    if(!slot.childElementCount)google.renderButton(slot, { type: 'standard', theme: 'outline', size: 'large',
      text: 'signin_with', locale: 'pt-BR' });
    start.hidden = true;
    status.textContent = 'Use o botão Google para escolher sua conta. Somente a equipe autorizada terá acesso.';
  } catch {
    if (version === pageVersion) status.textContent = 'Não foi possível carregar o botão Google. Tente novamente.';
  } finally { start.disabled = false; }
});

function leave() {
  pageVersion++;
  session.clear();
  pendingAction = null;
  access.clear();
  document.dispatchEvent(new Event('editorial-access-cleared'));
  sdk?.cancel();
  sdk?.disableAutoSelect();
  slot.replaceChildren();
  start.hidden = false;
  start.disabled = false;
}
signOut.addEventListener('click', leave);
window.addEventListener('pagehide', leave);
window.addEventListener('pageshow', event => { if (event.persisted) leave(); });
// Prepara somente o botão; a escolha da conta continua sendo feita pelo professor.
if(GOOGLE_CLIENT_ID&&GOOGLE_ALLOWED_ORIGINS.includes(location.origin))start.click();
