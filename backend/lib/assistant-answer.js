import { portalPages } from './acervo.js';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
function invalid() { throw new Error('INVALID_ASSISTANT_ANSWER'); }

export function normalizeAnswer(raw) {
  if (!nonempty(raw)) return invalid();
  let value;
  try {
    value = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    for (let i = 0; i < 2 && value?.type === 'message' && typeof value.content === 'string' && value.content.trim().startsWith('{'); i++) {
      value = JSON.parse(value.content);
    }
  } catch { return invalid(); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  if (value.type === 'message' && nonempty(value.content)) {
    return { type: 'message', content: value.content.trim() };
  }
  if (value.type === 'quiz' && nonempty(value.topic) && Array.isArray(value.questions) && value.questions.length >= 2 && value.questions.length <= 5) {
    const questions = value.questions.map(q => {
      if (!q || !nonempty(q.q) || !Array.isArray(q.opts) || q.opts.length !== 4 || !q.opts.every(nonempty) ||
          !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3 || !nonempty(q.explanation)) return invalid();
      return { q: q.q, opts: q.opts, correct: q.correct, explanation: q.explanation };
    });
    return { type: 'quiz', topic: value.topic, questions };
  }
  if (value.type === 'recommendations' && nonempty(value.content) && Array.isArray(value.pages)) {
    const pages = value.pages.flatMap(page => {
      if (!page || !nonempty(page.url) || !nonempty(page.reason)) return [];
      let parsed;
      try { parsed = new URL(page.url, 'https://fabcampo.com.br/pages/'); } catch { return []; }
      if (parsed.origin !== 'https://fabcampo.com.br' || parsed.search || parsed.hash) return [];
      const path = decodeURI(parsed.pathname).replace(/^\//, '').replace(/^pages\/pages\//, 'pages/');
      const known = portalPages.find(p => p.url === path);
      // Caminho absoluto na origem funciona tanto na home quanto em /pages/.
      return known ? [{ title: known.title, url: `/${known.url}`, reason: page.reason }] : [];
    });
    if (!pages.length) return invalid();
    return { type: 'recommendations', content: value.content, pages: pages.slice(0, 5) };
  }
  return invalid();
}
