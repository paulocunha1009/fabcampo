import {validarPosicaoFoto} from '../backend/lib/editorial-photo-layout.mjs';
export function validarVideo(value = '') {
  if(value === '') return '';
  if(typeof value !== 'string') throw new Error('Informe um único link do YouTube.');
  try {
    const url = new URL(value.trim());
    if(url.protocol !== 'https:' || url.username || url.password) throw new Error();
    let id;
    if(url.hostname === 'youtu.be') id = url.pathname.slice(1);
    else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)) {
      if(url.pathname === '/watch') id = url.searchParams.get('v');
      else id = /^\/(?:shorts|embed)\/([^/]+)$/.exec(url.pathname)?.[1];
    } else if(url.hostname === 'www.youtube-nocookie.com') id = /^\/embed\/([^/]+)$/.exec(url.pathname)?.[1];
    if(!/^[A-Za-z0-9_-]{11}$/.test(id || '')) throw new Error();
    return `https://www.youtube.com/watch?v=${id}`;
  } catch { throw new Error('Use um único link HTTPS válido de vídeo do YouTube.'); }
}
export function videoEmbed(value) {
  const url = validarVideo(value);
  return url ? `https://www.youtube-nocookie.com/embed/${new URL(url).searchParams.get('v')}?autoplay=0` : '';
}

export function validarFotos(value = []) {
  if(!Array.isArray(value) || value.length > 10) throw new Error('Use no máximo 10 fotos, incluindo a capa.');
  const ids = new Set();
  let covers = 0;
  const text = (value, max) => {
    if(value === undefined) return '';
    if(typeof value !== 'string' || value.length > max) throw new Error('Confira os textos das fotos.');
    return value.trim();
  };
  const path = value => {
    const result = text(value,2000);
    if(!result) return '';
    const url = new URL(result,'https://fabcampo.com.br/');
    if(!['http:','https:'].includes(url.protocol) || url.username || url.password || /[\s\\]/.test(result) || result.startsWith('//'))
      throw new Error('Confira o endereço da foto.');
    return result;
  };
  return value.map(photo => {
    if(!photo || typeof photo !== 'object' || typeof photo.id !== 'string' ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(photo.id) || ids.has(photo.id)) throw new Error('Identificação de foto inválida.');
    ids.add(photo.id);
    if(photo.capa !== undefined && typeof photo.capa !== 'boolean') throw new Error('Confira a escolha da capa.');
    if(photo.capa && ++covers > 1) throw new Error('Escolha somente uma foto de capa.');
    return { id:photo.id, imagem:path(photo.imagem), capaImagem:path(photo.capaImagem), capa:photo.capa === true,
      legenda:text(photo.legenda,400),credito:text(photo.credito,240),textoAlternativo:text(photo.textoAlternativo,400),...(photo.aposParagrafo!==undefined?{aposParagrafo:validarPosicaoFoto(photo.aposParagrafo)}:{}) };
  });
}
// Imagens editoriais permanecem na branch de preparação até a publicação.
export function imagemPrevia(value) {
  if (/^img\/editorial\/[a-f0-9]{64}\.webp$/.test(value)) {
    return 'https://raw.githubusercontent.com/paulocunha1009/fabcampo/editorial-rascunhos/' + value;
  }
  const url = new URL(value, 'https://fabcampo.com.br/');
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Endereço de imagem inválido.');
  return url.href;
}
