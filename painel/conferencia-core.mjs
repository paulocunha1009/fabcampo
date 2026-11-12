const labels={titulo:'Título',subtitulo:'Subtítulo',resumo:'Resumo',texto:'Texto completo',categoria:'Categoria',fonte:'Fonte ou autoria',link:'Referência',data:'Data',local:'Local',modelo:'Modelo da reportagem',fotos:'Fotos, capa e créditos',video:'Vídeo',cards:'Cards',citacao:'Citação',citacaoFonte:'Fonte da citação',dadosTitulo:'Título da tabela',dadosTexto:'Dados da tabela',nome:'Nome do evento',descricao:'Descrição',horario:'Horário',publico:'Público',participacao:'Como participar',responsavel:'Equipe responsável',contato:'Contato institucional',imagem:'Imagem',legenda:'Legenda',credito:'Crédito',textoAlternativo:'Descrição acessível'};
const fields={noticias:['titulo','subtitulo','resumo','texto','categoria','fonte','link','data','local','modelo','fotos','video','cards','citacao','citacaoFonte','dadosTitulo','dadosTexto'],eventos:['nome','descricao','data','horario','local','publico','participacao','responsavel','contato','imagem','legenda','credito','textoAlternativo']};
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));return value??'';}
function value(record,key){return canonical(record[key]??(['fotos','cards'].includes(key)?[]:''));}
function display(value,key){
 if(typeof value==='string')return value||'Não informado';
 if(Array.isArray(value)&&!value.length)return 'Nenhum item';
 if(key==='cards'&&Array.isArray(value))return value.map((item,index)=>`Card ${index+1}: ${item.titulo||'Sem título'}\n${item.texto||''}`).join('\n\n');
 if(key==='fotos'&&Array.isArray(value))return value.map((item,index)=>`Foto ${index+1}${item.capa?' — capa':''}\nPosição: ${item.capa?'cabeçalho':item.aposParagrafo===undefined?'galeria final':'após o parágrafo '+item.aposParagrafo}\nArquivo: ${item.imagem||'Não informado'}${item.capaImagem?'\nArquivo da capa: '+item.capaImagem:''}\nLegenda: ${item.legenda||'Não informada'}\nCrédito: ${item.credito||'Não informado'}\nDescrição acessível: ${item.textoAlternativo||'Não informada'}`).join('\n\n');
 return JSON.stringify(value,null,2);
}
export function conferirVersaoSalva(draft,publication,binding){
 if(!draft||draft.id!==binding.id||publication?.id!==binding.id||draft.revisao!==binding.revisao||!fields[draft.tipo]||draft.tipo!==binding.tipo||!draft.registro||draft.lixeira)throw Error('A revisão salva mudou ou não pôde ser conferida. Busque e abra o rascunho novamente.');
 const common={alteracoes:[],revisaoSalva:draft.revisao};
 if(publication.status==='nao-enviada')return {...common,estado:'rascunho',texto:'Rascunho salvo. Nenhuma publicação deste registro foi encontrada. Será uma nova publicação.'};
 if(publication.status==='retirada')return {...common,estado:'retirada',texto:'Conteúdo retirado do ar. O rascunho está preservado; publicar novamente recolocará o conteúdo no portal.'};
 if(publication.status==='aguardando')return {...common,estado:'aguardando',texto:'Atualização em andamento ou ainda não confirmada. Confira novamente antes de enviar outra vez.'};
 if(publication.status!=='publicada'||!Number.isSafeInteger(publication.revisao)||publication.revisao<1)return {...common,estado:'desconhecida',texto:'Não foi possível identificar a revisão publicada. Abra o portal e confira o estado novamente.'};
 const revision=publication.revisao;
 if(revision>draft.revisao)throw Error('O portal está em uma revisão mais recente. Busque e abra o rascunho novamente.');
 const base={...common,revisaoPublicada:revision};
 if(revision===draft.revisao)return {...base,estado:'publicada',texto:`Revisão ${revision} confirmada no portal. A revisão salva é a mesma que está publicada.`};
 const previous=(Array.isArray(draft.historico)?draft.historico:[]).find(item=>item.revisao===revision&&item.tipo===draft.tipo);
 if(!previous?.registro||previous.registro.acervo||draft.registro.acervo)return {...base,estado:'pendente',texto:`No portal: revisão ${revision}. Salva no painel: revisão ${draft.revisao}. A revisão publicada não está disponível para comparação neste formulário. O histórico guarda até cinco revisões anteriores; confira a página no portal.`};
 const alteracoes=fields[draft.tipo].filter(key=>JSON.stringify(value(previous.registro,key))!==JSON.stringify(value(draft.registro,key))).map(key=>({campo:key,rotulo:labels[key],antes:display(value(previous.registro,key),key),depois:display(value(draft.registro,key),key)}));
 return {...base,estado:'pendente',alteracoes,texto:`No portal: revisão ${revision}. Salva no painel: revisão ${draft.revisao}. `+(alteracoes.length?`${alteracoes.length} ${alteracoes.length===1?'campo público diferente, listado':'campos públicos diferentes, listados'} abaixo.`:'Nenhuma diferença nos campos públicos comparados. A pesquisa de apoio não faz parte dessa comparação.')};
}
