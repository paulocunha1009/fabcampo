import { GOOGLE_CLIENT_ID, EDITORIAL_API, GOOGLE_ALLOWED_ORIGINS } from './auth-config.js';
import { createGoogleAccess } from './google-access.js';

const start = document.getElementById('preparar-login');
const signOut = document.getElementById('sair-painel');
const slot = document.getElementById('botao-google');
const status = document.getElementById('estado-acesso');
let sdk;
let loading;
let pageVersion = 0;
const messages = {
  'signed-out': 'Nenhuma conta conectada. A prévia local de rascunhos continua disponível.',
  checking: 'Conferindo sua conta no servidor...',
  invalid: 'A entrada não pôde ser validada. Tente novamente com o Google.',
  denied: 'Esta conta não está autorizada para o painel. Procure o professor responsável.',
  unavailable: 'A configuração de acesso ainda não foi concluída no servidor. Nenhuma publicação foi liberada.',
  error: 'Não foi possível conferir o acesso. Tente novamente. Seu rascunho foi preservado.',
};
const access = createGoogleAccess({ endpoint: EDITORIAL_API, onState(state) {
  status.textContent = state.status === 'authorized'
    ? `Conta conferida: ${state.email}. Publicação ainda em preparação.` : messages[state.status];
  signOut.hidden = !['authorized', 'checking'].includes(state.status);
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
    google.initialize({ client_id: GOOGLE_CLIENT_ID, auto_select: false,
      ux_mode: 'popup', callback: response => {
        if (version === pageVersion) void access.signIn(response?.credential);
      } });
    slot.replaceChildren();
    google.renderButton(slot, { type: 'standard', theme: 'outline', size: 'large',
      text: 'signin_with', locale: 'pt-BR' });
    start.hidden = true;
    status.textContent = 'Use o botão Google para escolher sua conta. Somente a equipe autorizada terá acesso.';
  } catch {
    if (version === pageVersion) status.textContent = 'Não foi possível carregar o botão Google. Tente novamente.';
  } finally { start.disabled = false; }
});

function leave() {
  pageVersion++;
  access.clear();
  sdk?.cancel();
  sdk?.disableAutoSelect();
  slot.replaceChildren();
  start.hidden = false;
  start.disabled = false;
}
signOut.addEventListener('click', leave);
window.addEventListener('pagehide', leave);
window.addEventListener('pageshow', event => { if (event.persisted) leave(); });
