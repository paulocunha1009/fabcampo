import express from 'express';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const repo = 'paulocunha1009/fabcampo';
const failure = (status, message) => Object.assign(new Error(message), { status });

export async function normalizeEditorialImage(bytes) {
  if(!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 1024 * 1024)
    throw failure(400, 'Envie uma imagem WebP de até 1 MB.');
  try {
    const image = sharp(bytes, { limitInputPixels: 40000000, animated: false });
    const meta = await image.metadata();
    if(meta.format !== 'webp' || meta.width !== 1200 || meta.height !== 675 || (meta.pages || 1) !== 1)
      throw new Error();
    // Re-encode on the server: no EXIF, GPS or original file metadata is kept.
    return await image.webp({ quality: 82 }).toBuffer();
  } catch { throw failure(400, 'Prepare uma imagem WebP de 1200 × 675 pixels no painel.'); }
}

export function createImageStore({ token = process.env.EDITORIAL_GITHUB_TOKEN || '',
  branch = process.env.EDITORIAL_UPLOAD_BRANCH || '', request = fetch } = {}) {
  const configured = Boolean(token && /^editorial-[a-z0-9-]+$/.test(branch));
  async function save(bytes) {
    if(!configured) throw failure(503, 'O envio de imagens ainda não está configurado.');
    const hash = createHash('sha256').update(bytes).digest('hex');
    const path = `img/editorial/${hash}.webp`;
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' };
    const options = { headers, redirect: 'error' };
    const blobSha = createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');
    const existing = await request(`${url}?ref=${encodeURIComponent(branch)}`, { ...options, signal: AbortSignal.timeout(10000) });
    let saved = false;
    if(existing.ok) {
      const data = await existing.json();
      if(data.sha !== blobSha) throw failure(409, 'O arquivo já existe com outro conteúdo. A equipe deve conferir.');
      saved = true;
    } else if(existing.status !== 404) throw failure(502, 'Não foi possível consultar o GitHub. Tente novamente.');
    if(!saved) {
      const response = await request(url, { ...options, method:'PUT', signal: AbortSignal.timeout(10000),
        body:JSON.stringify({ message:'Adicionar imagem de rascunho editorial',
          content:bytes.toString('base64'), branch }) });
      if(!response.ok) throw failure(response.status === 409 || response.status === 422 ? 409 : 502,
        'O GitHub não confirmou o envio. Confira antes de tentar novamente.');
    }
    return { path, previewUrl:`https://raw.githubusercontent.com/${repo}/${branch}/${path}`,
      status:'rascunho', width:1200, height:675, type:'image/webp', bytes:bytes.length };
  }
  return { configured, save };
}

export function createEditorialImageRouter({ auth, store = createImageStore() }) {
  const router = express.Router();
  router.post('/api/editorial/imagens', async (req, res, next) => {
    try { await auth.authenticate(req.headers.authorization); next(); }
    catch(error) { res.status([401,403,503].includes(error.status) ? error.status : 503)
      .json({ error:'Entre com uma conta autorizada para enviar imagens.' }); }
  }, (req, res, next) => {
    if(!store.configured) return res.status(503).json({ error:'O envio de imagens ainda não está configurado.' });
    if(!req.is('image/webp')) return res.status(415).json({ error:'Envie uma imagem WebP preparada pelo painel.' });
    next();
  }, express.raw({ type:'image/webp', limit:'1mb' }), async (req, res) => {
    try { res.status(201).json(await store.save(await normalizeEditorialImage(req.body))); }
    catch(error) { res.status([400,409,502,503].includes(error.status) ? error.status : 502)
      .json({ error:error.status ? error.message : 'Não foi possível confirmar o envio. Tente novamente.' }); }
  });
  return router;
}
