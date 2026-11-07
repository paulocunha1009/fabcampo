import assert from 'node:assert/strict';
import {test} from 'node:test';
import {RESEARCH_FILE_LIMITS,validarPesquisaArquivo,validarArquivoSelecionado,decodificarMarkdown,extrairPaginasPDF} from '../../painel/pesquisa-core.js';
import {validateResearch,researchSource} from '../lib/editorial-report.js';
import {validateDraftInput} from '../lib/editorial-drafts.js';
import {validarRegistro} from '../../painel/editorial-core.js';
const arquivo={nome:'pesquisa.md',tipo:'markdown',paginas:0,texto:'Trecho original de teste. '.repeat(600)+'\nRessalva final: esta informação ainda não foi confirmada.',conferido:true};
test('referência maior que 12 mil caracteres chega inteira à IA e ao rascunho privado',()=>{
  const source=validateResearch({pesquisa:'',arquivo});
  assert.equal(source.arquivo.texto,arquivo.texto);
  assert.ok(researchSource(source).trechos.at(-1).texto.includes('ainda não foi confirmada'));
  const registro={titulo:'Teste',resumo:'Resumo',categoria:'Portal',fonte:'Equipe',pesquisaArquivo:arquivo};
  assert.equal(validarRegistro('noticias',registro).pesquisaArquivo.texto,arquivo.texto);
  assert.equal(validateDraftInput({tipo:'noticias',registro,revisao:0}).registro.pesquisaArquivo.texto,arquivo.texto);
  assert.throws(()=>validateResearch({pesquisa:'',arquivo:{...arquivo,conferido:false}}));
});
test('arquivos ou textos acima do limite são recusados, nunca truncados',()=>{
  for(const value of [{...arquivo,texto:'x'.repeat(40001)},{...arquivo,texto:'界'.repeat(40000)},{...arquivo,paginas:51},{...arquivo,nome:'../fora.md'}])assert.throws(()=>validarPesquisaArquivo(value));
  for(const file of [{name:'a.exe',size:10},{name:'a.pdf',size:RESEARCH_FILE_LIMITS.bytes+1},{name:'a.md',size:0}])assert.throws(()=>validarArquivoSelecionado(file));
  assert.equal(validarArquivoSelecionado({name:'PESQUISA.PDF',size:100}),'pdf');
});
test('Markdown é texto UTF-8 literal: não executa HTML nem busca links',()=>{
  const texto='# Pesquisa\n<script>não executar</script>\n[referência](https://example.test)';
  assert.equal(decodificarMarkdown(new TextEncoder().encode(texto)),texto);
  assert.equal(decodificarMarkdown(new TextEncoder().encode('linha 1\r\nlinha 2')),'linha 1\nlinha 2');
  assert.throws(()=>decodificarMarkdown(Uint8Array.from([255,254,1])));
  assert.throws(()=>decodificarMarkdown(new TextEncoder().encode('arquivo\0binário')));
});
test('PDF recusa página sem texto, excesso de páginas e de texto sem retornar conteúdo parcial',async()=>{
  const pdf=lines=>({numPages:lines.length,getPage:async number=>({getTextContent:async()=>({items:[{str:lines[number-1],hasEOL:true}]}),cleanup(){}})});
  assert.deepEqual(await extrairPaginasPDF(pdf(['primeira página','última página'])),{texto:'[Página 1]\nprimeira página\n\n[Página 2]\núltima página',paginas:2});
  await assert.rejects(()=>extrairPaginasPDF(pdf(['texto',''])),/OCR/);
  await assert.rejects(()=>extrairPaginasPDF(pdf(Array(51).fill('texto'))),/50 páginas/);
  await assert.rejects(()=>extrairPaginasPDF(pdf(['x'.repeat(40000)])),/40.000/);
});
