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
function opcional(campo, value, max){
  if(value === undefined || value === '') return '';
  if(typeof value !== 'string') erro(campo, 'Use texto neste campo.');
  if(!value.trim()) return '';
  return texto(campo, value, max);
}
function endereco(campo, value){
  const link = opcional(campo, value, 2000);
  if(!link) return '';
  try {
    const parsed = new URL(link, 'https://fabcampo.com.br/');
    if(!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || /[\s\\]/.test(link) || link.startsWith('//')) throw new Error();
  } catch { erro(campo, 'Use um link HTTP/HTTPS ou o caminho de uma página do portal, sem espaços.'); }
  return link;
}
export function validarRegistro(tipo, value){
  if(!value || typeof value !== 'object' || Array.isArray(value)) erro('', 'Registro inválido.');
  const comum = { local:opcional('local', value.local, 240), imagem:endereco('imagem', value.imagem),
    legenda:opcional('legenda', value.legenda, 400), credito:opcional('credito', value.credito, 240),
    textoAlternativo:opcional('textoAlternativo', value.textoAlternativo, 400) };
  const horario = opcional('horario', value.horario, 5);
  if(horario && !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) erro('horario', 'Informe um horário válido.');
  if(tipo === 'eventos') return {
    nome:texto('nome', value.nome, 160), data:data(value.data, false),
    descricao:texto('descricao', value.descricao, 1200), ...comum, horario,
    publico:opcional('publico', value.publico, 400), participacao:opcional('participacao', value.participacao, 1200),
    responsavel:opcional('responsavel', value.responsavel, 240), contato:opcional('contato', value.contato, 400)
  };
  if(tipo !== 'noticias') erro('', 'Tipo de registro inválido.');
  const titulo = texto('titulo', value.titulo, 160);
  const resumo = texto('resumo', value.resumo, 1200);
  if(!Object.hasOwn(CATEGORIAS, value.categoria)) erro('categoria', 'Escolha uma categoria.');
  const fonte = texto('fonte', value.fonte, 160);
  const link = endereco('link', value.link);
  const modelo = value.modelo || 'destaques';
  if(!['destaques','dados'].includes(modelo)) erro('modelo', 'Escolha um modelo de reportagem.');
  const cards = value.cards || [];
  if(!Array.isArray(cards) || cards.length > 3) erro('cards', 'Use até três cards.');
  const validados = cards.map(card => ({ titulo:texto('cards',card?.titulo,90), texto:texto('cards',card?.texto,500) }));
  return { titulo, resumo, data:data(value.data, false), categoria:value.categoria,
    fonte, link, ...CATEGORIAS[value.categoria], ...comum, texto:opcional('texto', value.texto, 12000), modelo, cards:validados };
}
export function pendenciasPublicacao(tipo, value){
  const registro = validarRegistro(tipo, value);
  const obrigatorios = tipo === 'noticias' ? ['local','texto']
    : ['data','horario','local','publico','participacao','responsavel','contato'];
  if(registro.imagem) obrigatorios.push('legenda','credito','textoAlternativo');
  return obrigatorios.filter(campo => !registro[campo]);
}
export function montarRascunho(value){
  if(!value || !Array.isArray(value.noticias) || !Array.isArray(value.eventos)) erro('', 'As listas de notícias e eventos são obrigatórias.');
  return { version:2, status:'rascunho', noticias:value.noticias.map(n => validarRegistro('noticias', n)),
    eventos:value.eventos.map(e => validarRegistro('eventos', e)) };
}
