import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validarBlocos} from '../lib/editorial-blocks.mjs';
import {renderEditorialPage} from '../lib/editorial-page.mjs';
test('blocos especiais são opcionais e não inventam conteúdo',()=>{
 assert.deepEqual(validarBlocos({}),{});const html=renderEditorialPage({titulo:'Título',texto:'Texto'});assert.ok(!html.includes('<blockquote>'));assert.ok(!html.includes('<table>'));
});
test('citação exige fonte e dados são estruturados sem executar HTML',()=>{
 assert.throws(()=>validarBlocos({citacao:'Fala sem origem'}));assert.throws(()=>validarBlocos({dadosTexto:'Linha sem separador'}));assert.throws(()=>validarBlocos({dadosTexto:Array(21).fill('a | b').join('\n')}));
 const html=renderEditorialPage({titulo:'Título',texto:'Texto',citacao:'<fala>',citacaoFonte:'Fonte registrada',dadosTexto:'Medida | <valor>'});assert.match(html,/&lt;fala&gt;/);assert.match(html,/&lt;valor&gt;/);assert.match(html,/<table>/);
});
