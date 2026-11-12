import {pendenciasPublicacao} from './editorial-core.js?v=20261112-20';
const nomes={titulo:'Título',resumo:'Resumo',fonte:'Fonte ou autoria',categoria:'Categoria',modelo:'Modelo da reportagem',texto:'Texto completo',local:'Local',nome:'Nome do evento',descricao:'Descrição',data:'Data confirmada',horario:'Horário confirmado',publico:'Público',participacao:'Como participar',responsavel:'Equipe responsável',contato:'Contato institucional',fotos:'Fotos: enviar ao menos uma capa e conferir legendas, créditos e descrições',legenda:'Legenda da imagem',credito:'Crédito da imagem',textoAlternativo:'Descrição acessível da imagem',video:'Link do vídeo',cards:'Cards',citacao:'Citação',citacaoFonte:'Fonte da citação',dadosTexto:'Dados da tabela',dadosTitulo:'Título da tabela',pesquisa:'Pesquisa',pesquisaArquivo:'Arquivo de pesquisa',link:'Link de referência',subtitulo:'Subtítulo',imagem:'Imagem'};
export function listarPendenciasRevisao(tipo,valor){
 const campos=tipo==='noticias'?['titulo','resumo','fonte','categoria','local','texto']:['nome','descricao','data','horario','local','publico','participacao','responsavel','contato'];
 const pendentes=new Map();
 const add=(campo,detalhe='')=>{if(nomes[campo])pendentes.set(campo,{campo,rotulo:nomes[campo],detalhe});};
 campos.filter(campo=>!String(valor[campo]||'').trim()).forEach(campo=>add(campo));
 if(tipo==='noticias'&&(!Array.isArray(valor.fotos)||!valor.fotos.length))add('fotos');
 try{pendenciasPublicacao(tipo,valor).forEach(campo=>add(campo));}catch(error){add(error.campo,error.message);}
 return [...pendentes.values()];
}
