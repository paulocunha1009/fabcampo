// A revisão só é considerada salva quando o conteúdo coincide com o confirmado pelo servidor.
export function descreverEstadoEdicao(binding,snapshot){
  if(!binding?.revisao)return {estado:'novo',texto:'Esta edição ainda não foi salva no painel. Use “Salvar no painel” para retomar em outro momento.'};
  if(typeof snapshot!=='string'||snapshot!==binding.snapshot)return {estado:'pendente',texto:`Há alterações não salvas no painel. Última revisão confirmada: ${binding.revisao}. Atualizar a prévia não salva no servidor.`};
  return {estado:'salvo',texto:`Revisão ${binding.revisao} salva no painel. O conteúdo desta edição corresponde à revisão confirmada. Salvar não publica.`};
}
