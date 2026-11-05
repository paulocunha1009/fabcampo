export const CATEGORIAS = {
  Portal:{ icone:'📌', classe:'badge--portal' },
  Tecnologia:{ icone:'🤖', classe:'badge--tech' },
  Agroecologia:{ icone:'🌱', classe:'badge--agro' },
  Educação:{ icone:'🎓', classe:'badge--educacao' },
  Cultura:{ icone:'🎭', classe:'badge--portal' }
};
function erro(campo, mensagem){ const error = new Error(mensagem); error.campo = campo; throw error; }
function texto(campo, value, max){
  if(typeof value !== 'string' || !value.trim()) erro(campo, 'Preencha este campo.');
  const result = value.trim();
  if(result.length > max) erro(campo, `Use até ${max} caracteres.`);
  return result;
}
function data(value, obrigatoria){
  const result = typeof value === 'string' ? value.trim() : '';
  if(!result && !obrigatoria) return '';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(result)) erro('data', 'Informe uma data válida.');
  const date = new Date(result+'T12:00:00Z');
  if(Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== result) erro('data', 'Confira o dia, o mês e o ano.');
  return result;
}
export function validarRegistro(tipo, value){
  if(!value || typeof value !== 'object' || Array.isArray(value)) erro('', 'Registro inválido.');
  if(tipo === 'eventos') return {
    nome:texto('nome', value.nome, 160), data:data(value.data, true),
    descricao:texto('descricao', value.descricao, 1200)
  };
  if(tipo !== 'noticias') erro('', 'Tipo de registro inválido.');
  const titulo = texto('titulo', value.titulo, 160);
  const resumo = texto('resumo', value.resumo, 1200);
  if(!Object.hasOwn(CATEGORIAS, value.categoria)) erro('categoria', 'Escolha uma categoria.');
  const fonte = texto('fonte', value.fonte, 160);
  const link = texto('link', value.link, 2000);
  try {
    const parsed = new URL(link, 'https://fabcampo.com.br/');
    if(!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || /[\s\\]/.test(link) || link.startsWith('//')) throw new Error();
  } catch { erro('link', 'Use um link HTTP/HTTPS ou o caminho de uma página do portal, sem espaços.'); }
  return { titulo, resumo, data:data(value.data, false), categoria:value.categoria,
    fonte, link, ...CATEGORIAS[value.categoria] };
}
export function montarRascunho(value){
  if(!value || !Array.isArray(value.noticias) || !Array.isArray(value.eventos)) erro('', 'As listas de notícias e eventos são obrigatórias.');
  return { version:1, status:'rascunho', noticias:value.noticias.map(n => validarRegistro('noticias', n)),
    eventos:value.eventos.map(e => validarRegistro('eventos', e)) };
}
