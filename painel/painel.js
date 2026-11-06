import { validarRegistro, montarRascunho, pendenciasPublicacao } from './editorial-core.js';
import { videoEmbed } from './midias-core.js';
const $ = id => document.getElementById(id);
const campos = ['titulo','resumo','categoria','fonte','link','nome','descricao','data','texto','local','horario','publico','participacao','responsavel','contato','imagem','legenda','credito','textoAlternativo','modelo','cards','fotos','video'];
const nomes = { local:'local', texto:'texto completo', data:'data confirmada', horario:'horário confirmado', publico:'público', participacao:'como participar', responsavel:'equipe responsável', contato:'contato institucional', legenda:'legenda', credito:'crédito da imagem', textoAlternativo:'descrição da imagem para acessibilidade', fotos:'1 a 10 fotos enviadas, com uma capa, legendas, créditos e descrições acessíveis' };
let tipo = 'noticias';
let conteudo = { noticias:[], eventos:[] };
let pronto = false;
function bloquearTroca(alterado){
  document.querySelectorAll('[data-tipo]').forEach(b => { b.disabled = alterado; });
  $('registro-editorial').disabled = alterado;
  $('baixar-rascunho').disabled = alterado || !pronto;
  $('cancelar-edicao').hidden = !alterado;
}
function informar(texto){ $('estado-painel').textContent = texto; }
function listar(selecionado = ''){
  const lista = $('registro-editorial');
  lista.replaceChildren(new Option('Novo registro', ''));
  conteudo[tipo].forEach((registro, indice) => lista.append(new Option(registro.titulo || registro.nome, String(indice))));
  lista.value = selecionado;
}
function limparErros(){ campos.forEach(id => { $(id).removeAttribute('aria-invalid'); $(id).setAttribute('aria-describedby', 'erro-'+id+({data:' ajuda-data',texto:' ajuda-texto'}[id] || '')); $('erro-'+id).textContent = ''; }); }
function previa(registro){
  const area = $('previa-editorial'); area.replaceChildren();
  const titulo = document.createElement('h3'); titulo.textContent = registro.titulo || registro.nome;
  const detalhes = document.createElement('p'); detalhes.textContent = registro.data ? 'Data: '+registro.data : 'Data não informada';
  const texto = document.createElement('p'); texto.textContent = registro.resumo || registro.descricao;
  area.append(titulo, detalhes, texto);
  if(tipo === 'noticias') {
    document.dispatchEvent(new CustomEvent('editorial-preview-media',{detail:{area,registro}}));
    if(registro.video){
      try {
        const src = videoEmbed(registro.video);
        const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Carregar vídeo da reportagem';
        button.addEventListener('click',()=>{const iframe=document.createElement('iframe'); iframe.src=src; iframe.title='Vídeo da reportagem'; iframe.className='video-reportagem'; iframe.allowFullscreen=true; iframe.referrerPolicy='strict-origin-when-cross-origin'; button.replaceWith(iframe);});
        area.append(button);
      } catch {}
    }
  }
  if(Array.isArray(registro.cards) && registro.cards.length){
    const grid = document.createElement('div'); grid.className = 'cards-reportagem cards-reportagem--'+(registro.modelo === 'dados' ? 'dados':'destaques');
    registro.cards.forEach(card => { const box = document.createElement('section'); const h = document.createElement('h4'); h.textContent = card.titulo;
      const p = document.createElement('p'); p.textContent = card.texto; box.append(h,p); grid.append(box); });
    area.append(grid);
  }
  for(const campo of ['local','horario','publico','participacao','responsavel','contato']){
    if(registro[campo]){ const p = document.createElement('p'); p.textContent = nomes[campo]+': '+registro[campo]; area.append(p); }
  }
  if(registro.texto){
    registro.texto.split(/\n\s*\n/).forEach(trecho => { const p = document.createElement('p'); p.textContent = trecho; p.style.whiteSpace = 'pre-wrap'; area.append(p); });
  }
  if(registro.fonte){ const fonte = document.createElement('p'); fonte.textContent = 'Fonte: '+registro.fonte; area.append(fonte); }
  if(registro.link){
    try {
      const validado = validarRegistro('noticias', registro);
      const link = document.createElement('a'); link.textContent = 'Abrir página de referência';
      link.href = new URL(validado.link, 'https://fabcampo.com.br/').href;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; area.append(link);
    } catch {}
  }
  if(registro.imagem){
    try {
      const seguro = validarRegistro(tipo, registro);
      const link = document.createElement('a'); link.textContent = 'Conferir imagem de referência';
      link.href = new URL(seguro.imagem, 'https://fabcampo.com.br/').href;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; area.append(link);
    } catch {}
  }
  for(const campo of ['legenda','credito','textoAlternativo']){
    if(registro[campo]){ const p = document.createElement('p'); p.textContent = nomes[campo]+': '+registro[campo]; area.append(p); }
  }
  try {
    const pendencias = pendenciasPublicacao(tipo, registro);
    $('pendencias-editoriais').textContent = pendencias.length
      ? 'Rascunho incompleto. Antes da revisão, confira: '+pendencias.map(campo => nomes[campo]).join(', ')+'.'
      : 'Campos preenchidos. A revisão do professor/equipe ainda é necessária. Nenhuma publicação foi liberada.';
  } catch { $('pendencias-editoriais').textContent = 'Confira os campos deste registro antes da revisão.'; }
}
function escolher(){
  limparErros();
  const registro = conteudo[tipo][$('registro-editorial').value];
  campos.forEach(id => { $(id).value = ['cards','fotos'].includes(id) ? JSON.stringify(registro?.[id] || []) : (registro?.[id] || ({categoria:'Portal',modelo:'destaques'}[id] || '')); });
  $('midias-reportagem').hidden = tipo !== 'noticias'; $('midia-legada').hidden = tipo === 'noticias';
  document.dispatchEvent(new Event('editorial-record-loaded'));
  if(registro){ previa(registro); informar('Registro carregado para revisão. Nenhuma alteração foi publicada.'); }
  else { $('previa-editorial').replaceChildren(); $('previa-editorial').textContent = 'Preencha os campos e guarde no rascunho para conferir.'; $('pendencias-editoriais').textContent = ''; }
}
document.querySelectorAll('[data-tipo]').forEach(botao => botao.addEventListener('click', () => {
  tipo = botao.dataset.tipo;
  document.querySelectorAll('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b === botao)));
  document.querySelectorAll('[data-campos]').forEach(bloco => { bloco.hidden = bloco.dataset.campos !== tipo; });
  listar(); escolher();
}));
$('registro-editorial').addEventListener('change', escolher);
$('editorial-form').addEventListener('input', () => {
  if(!pronto) return;
  bloquearTroca(true);
  informar('Edição em andamento. Guarde no rascunho ou descarte esta edição antes de trocar de registro.');
});
$('cancelar-edicao').addEventListener('click', () => {
  escolher(); bloquearTroca(false);
  informar('Edição descartada. O restante do rascunho foi preservado.');
});
$('editorial-form').addEventListener('submit', event => {
  event.preventDefault();
  if(!pronto){ informar('Aguarde o carregamento do conteúdo existente antes de preparar o rascunho.'); return; }
  limparErros();
  try {
    const valores = Object.fromEntries(campos.map(id => [id, $(id).value]));
    valores.cards = JSON.parse(valores.cards || '[]');
    valores.fotos = JSON.parse(valores.fotos || '[]');
    const registro = validarRegistro(tipo, valores);
    const posicao = $('registro-editorial').value;
    const indice = posicao === '' ? conteudo[tipo].length : Number(posicao);
    conteudo[tipo][indice] = registro;
    listar(String(indice)); previa(registro);
    bloquearTroca(false);
    informar('Registro guardado somente neste rascunho. Confira a prévia e baixe o arquivo antes de sair.');
    $('titulo-previa').focus();
  } catch(error){
    informar('Confira os campos indicados.');
    if(error.campo){ $(error.campo).setAttribute('aria-invalid', 'true'); $('erro-'+error.campo).textContent = error.message; const target = error.campo === 'fotos' ? $('arquivos-galeria') : error.campo === 'cards' ? $('sugerir-cards') : $(error.campo); document.dispatchEvent(new CustomEvent('editorial-field-error',{detail:target})); target.focus(); }
  }
});
$('baixar-rascunho').addEventListener('click', () => {
  let url;
  const link = document.createElement('a');
  try {
    const arquivo = montarRascunho(conteudo);
    url = URL.createObjectURL(new Blob([JSON.stringify(arquivo,null,2)+'\n'], { type:'application/json;charset=utf-8' }));
    link.href = url; link.download = 'fabcampo-rascunho-editorial.json'; document.body.append(link); link.click();
    informar('Download solicitado. Este arquivo é um rascunho e ainda não foi publicado no portal.');
  } catch(error){ informar('Não foi possível preparar o arquivo: '+error.message); }
  finally { link.remove(); if(url) setTimeout(() => URL.revokeObjectURL(url),1000); }
});
fetch('../data/site.json', { signal:AbortSignal.timeout(5000) })
  .then(response => { if(!response.ok) throw new Error(); return response.json(); })
  .then(dados => {
    if(!Array.isArray(dados.noticias) || !Array.isArray(dados.eventos)) throw new Error();
    conteudo = structuredClone({ noticias:dados.noticias, eventos:dados.eventos });
    pronto = true; listar(); $('baixar-rascunho').disabled = false;
    informar('Conteúdo existente carregado para revisão. Nenhuma alteração foi publicada.');
  })
  .catch(() => informar('Não foi possível carregar o conteúdo existente. Recarregue a página para tentar novamente.'));
