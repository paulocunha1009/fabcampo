import {createEditorialEnrollment} from './editorial-enrollment.js';
import { OAuth2Client } from 'google-auth-library';

const google = new OAuth2Client();
const deny = (status, code) => Object.assign(new Error(code), { status, code });

// No cookies or application session are created here. Every editorial request
// must supply a Google ID token; policy is checked again on each request.
export function createEditorialAuth({
  clientId = process.env.EDITORIAL_GOOGLE_CLIENT_ID || '',
  allowedSubjects = process.env.EDITORIAL_GOOGLE_SUBJECTS || '',
  draftSubjects = process.env.EDITORIAL_DRAFT_GOOGLE_SUBJECTS || '',
  approvedPublisherEmails = process.env.EDITORIAL_ENROLL_PUBLISH_EMAILS || '',
  enrollment = createEditorialEnrollment(),
  verifyIdToken = options => google.verifyIdToken(options),
  clock = Date.now,
} = {}) {
  const subjects = new Set(allowedSubjects.split(',').map(s => s.trim()).filter(Boolean));
  const preparers = new Set(draftSubjects.split(',').map(s => s.trim()).filter(Boolean));
  const emails=approvedPublisherEmails.split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
  const approvedEmails=new Set(emails.length<=20&&emails.every(email=>email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&!email.includes('*'))?emails:[]);
  const publisherAccounts=new WeakSet();
  const configured = Boolean(clientId.trim() && subjects.size);

  async function identify(authorization) {
    if (!clientId.trim()) throw deny(503, 'EDITORIAL_NOT_CONFIGURED');
    if (typeof authorization !== 'string' || authorization.length > 12000 ||
        !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization)) {
      throw deny(401, 'EDITORIAL_SIGN_IN_REQUIRED');
    }
    let payload;
    try {
      const ticket = await verifyIdToken({ idToken: authorization.slice(7), audience: clientId });
      payload = ticket.getPayload();
    } catch {
      // Never return or log tokens, Google's error text or account details.
      throw deny(401, 'EDITORIAL_SIGN_IN_REQUIRED');
    }
    // The official library verifies signature, issuer, audience and expiry.
    // Recheck policy claims and reject expired tokens without clock leeway.
    if (!payload || payload.aud !== clientId ||
        !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss) ||
        !Number.isFinite(payload.exp) || payload.exp <= clock() / 1000 ||
        typeof payload.sub !== 'string' || !payload.sub || payload.email_verified !== true ||
        typeof payload.email !== 'string' || !payload.email.includes('@')) {
      throw deny(401, 'EDITORIAL_SIGN_IN_REQUIRED');
    }
    return { id: payload.sub, email: payload.email, expiresAt:payload.exp*1000 };
  }
  async function authenticate(authorization, {publicar=false}={}) {
    if (!configured) throw deny(503, 'EDITORIAL_NOT_CONFIGURED');
    const account = await identify(authorization);
    let publisher=subjects.has(account.id);
    if(!publisher&&approvedEmails.has(account.email.toLowerCase())){
      // Only Google-signed verified claims reach this point. Bind once, atomically.
      publisher=await enrollment.bind(account);
      if(!publisher)throw deny(403,'EDITORIAL_ACCOUNT_BINDING_MISMATCH');
    }
    if (!publisher && !preparers.has(account.id)) throw deny(403, 'EDITORIAL_ACCESS_DENIED');
    if (publicar && !publisher) throw deny(403, 'EDITORIAL_PUBLISH_DENIED');
    if(publisher)publisherAccounts.add(account);
    return account;
  }

  return { configured, authenticate, identify, permissions:account=>({rascunhos:publisherAccounts.has(account)||subjects.has(account.id)||preparers.has(account.id),publicar:publisherAccounts.has(account)||subjects.has(account.id)}) };
}
