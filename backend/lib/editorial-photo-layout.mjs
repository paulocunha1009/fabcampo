// Shared by editor, preview and publisher: headings do not count as paragraphs.
export function blocosTexto(texto=''){
 const blocks=[];
 for(const block of texto.replace(/\r\n?/g,'\n').split(/\n\s*\n/)){
  const lines=block.split('\n');
  for(let index=0;index<lines.length;){
   const heading=/^##\s+(.+)$/.exec(lines[index]);
   if(heading){blocks.push({tipo:'titulo',texto:heading[1]});index++;}
   else{const paragraph=[];while(index<lines.length&&!/^##\s+/.test(lines[index]))paragraph.push(lines[index++]);const value=paragraph.join('\n').trim();if(value)blocks.push({tipo:'paragrafo',texto:value});}
  }
 }
 return blocks;
}
export function validarPosicaoFoto(value){if(value===undefined)return undefined;if(!Number.isSafeInteger(value)||value<1||value>6000)throw Error('Escolha uma posição válida para a foto no texto.');return value;}
export function conferirPosicoesFotos(fotos,texto){const total=blocosTexto(texto).filter(block=>block.tipo==='paragrafo').length;for(const foto of fotos){validarPosicaoFoto(foto.aposParagrafo);if(!foto.capa&&foto.aposParagrafo>total)throw Error('O texto mudou: escolha novamente a posição das fotos nos parágrafos existentes.');}return total;}
