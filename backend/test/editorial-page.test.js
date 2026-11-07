import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderEditorialPage} from '../lib/editorial-page.mjs';
const photo=(index=0)=>({imagem:'img/editorial/'+'a'.repeat(63)+index+'.webp',capaImagem:'img/editorial/'+'b'.repeat(63)+index+'.webp',capa:index===0,legenda:'Legenda conferida',credito:'Crédito informado',textoAlternativo:'Descrição informada'});
const record={titulo:'Título da reportagem',resumo:'Resumo',subtitulo:'Subtítulo',texto:'Abertura conferida.\n\n## Assunto documentado\nTexto da pesquisa.',fonte:'Equipe',categoria:'Educação',fotos:[photo(),photo(1)],cards:[{titulo:'Destaque',texto:'Trecho conferido.'}]};
test('página reutiliza identidade, navegação, estrutura do artigo e rodapé',()=>{
  const html=renderEditorialPage(record);
  for(const expected of ['class="cabecalho"','class="rodape"','portal-responsivo.css','class="artigo-lead"','class="artigo-titulo-secao"','Nesta reportagem','noindex,nofollow','Fontes e créditos'])assert.ok(html.includes(expected),expected);
  assert.ok(html.includes('href="#secao-1"'));assert.ok(!html.includes('<base'));
  assert.ok(html.includes('https://fabcampo.com.br/pages/reportagem-educacao.html'));
});
test('pesquisa e arquivo privados não entram no HTML; textos não executam marcação',()=>{
  const html=renderEditorialPage({...record,titulo:'<script>alert("x")</script>',pesquisa:'PESQUISA_PRIVADA_123',pesquisaArquivo:{nome:'ARQUIVO_PRIVADO_456',texto:'SEGREDO_789'}});
  assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>alert'));
  for(const secret of ['PESQUISA_PRIVADA_123','ARQUIVO_PRIVADO_456','SEGREDO_789'])assert.ok(!html.includes(secret));
});
test('prévia usa imagens da branch de rascunhos e página final usa o domínio oficial',()=>{
  assert.ok(renderEditorialPage(record).includes('raw.githubusercontent.com/paulocunha1009/fabcampo/editorial-rascunhos/'));
  const html=renderEditorialPage(record,{preview:false});assert.ok(!html.includes('raw.githubusercontent.com'));assert.ok(html.includes('https://fabcampo.com.br/img/editorial/'));
  for(const input of [{...record,fotos:Array.from({length:11},(_,i)=>photo(i))},{...record,fotos:[{...photo(),imagem:'javascript:alert(1)',capaImagem:''}]},{...record,video:'https://evil.test/watch?v=abcdefghijk'},{...record,data:'2026-02-30'}])assert.throws(()=>renderEditorialPage(input));
});
test('vídeo só carrega por clique e data ausente não vira data atual',()=>{
  const html=renderEditorialPage({...record,video:'https://www.youtube.com/watch?v=abcdefghijk'});
  assert.ok(html.includes('data-video="abcdefghijk"'));assert.ok(html.includes('autoplay=0'));assert.ok(!html.includes('<iframe'));
  assert.ok(!html.includes('<time'));assert.ok(!html.includes('Itarema — CE'));
});
