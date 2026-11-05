/* Regras locais da Expedição, sem dependência da IA ou do navegador. */
(function(root){
  'use strict';
  const texto = v => typeof v === 'string' && v.trim().length > 0;
  function validarDesafio(raw){
    const value = typeof raw === 'string'
      ? JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')) : raw;
    if(!value || !Array.isArray(value.questoes) || value.questoes.length !== 3 || !texto(value.aberta)) throw new Error('Desafio incompleto.');
    const questoes = value.questoes.map(q => {
      if(!q || !texto(q.pergunta) || !Array.isArray(q.opcoes) || q.opcoes.length !== 4 ||
        !q.opcoes.every(texto) || new Set(q.opcoes.map(o => o.trim().toLocaleLowerCase('pt-BR'))).size !== 4 ||
        !Number.isInteger(q.correta) || q.correta < 0 || q.correta > 3 || !texto(q.porque)) throw new Error('Questão inválida.');
      return { pergunta:q.pergunta, opcoes:q.opcoes, correta:q.correta, porque:q.porque };
    });
    return { questoes, aberta:value.aberta };
  }
  function normalizarEstado(value, ids){
    const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const result = {
      sementes:Number.isSafeInteger(v.sementes) && v.sementes >= 0 ? v.sementes : 0,
      feitas:Array.isArray(v.feitas) ? [...new Set(v.feitas.filter(id => ids.includes(id)))] : [],
      registro:typeof v.registro === 'string' ? v.registro : '', premiadas:{}, respostas:{}, perguntas:{}
    };
    for(const id of ids){
      const p = v.premiadas?.[id];
      result.premiadas[id] = { questoes:Array.isArray(p?.questoes) ? [...new Set(p.questoes.filter(i => Number.isInteger(i) && i >= 0 && i < 3))] : [], aberta:p?.aberta === true };
      if(typeof v.respostas?.[id] === 'string') result.respostas[id] = v.respostas[id];
      if(typeof v.perguntas?.[id] === 'string') result.perguntas[id] = v.perguntas[id];
    }
    return result;
  }
  function premiar(estado, id, questao, memoriaViva){
    if(memoriaViva || estado.feitas.includes(id)) return false;
    const premio = estado.premiadas[id];
    if(questao === 'aberta'){
      if(premio.aberta) return false;
      premio.aberta = true; estado.sementes += 10;
    }else{
      if(!Number.isInteger(questao) || questao < 0 || questao > 2 || premio.questoes.includes(questao)) return false;
      premio.questoes.push(questao); estado.sementes += 5;
    }
    return true;
  }
  function salvarEstado(storage, chave, estado){
    try { storage.setItem(chave, JSON.stringify(estado)); return true; }
    catch(e){ return false; }
  }
  function exportarRegistros(estado, estacoes, data){
    const atual = normalizarEstado(estado, estacoes.map(e => e.id));
    const linhas = [
      'CAMPO DIGITAL · FABCAMPO', 'Expedição — Meus registros',
      'Data desta cópia: ' + data, '', 'Estudante: ______________________________',
      'Turma: _________________________________', '',
      'Paradas concluídas: ' + atual.feitas.length + '/' + estacoes.length,
      'Sementes: ' + atual.sementes + ' (pontuação da atividade; não é nota escolar)', '',
      'Esta cópia reúne as respostas abertas e o registro de memória disponíveis neste navegador.',
      'Não inclui as perguntas e alternativas dos quizzes nem suas devolutivas.',
      'Não foi enviada automaticamente ao professor. Pode ser entregue ou usada no caderno de campo.',
      'Uma resposta marcada como rascunho ainda pode estar incompleta.', ''
    ];
    for(const estacao of estacoes){
      const resposta = estacao.memoriaViva ? atual.registro : atual.respostas[estacao.id];
      linhas.push('----------------------------------------',
        estacao.local + ' — ' + estacao.titulo,
        'Situação: ' + (atual.feitas.includes(estacao.id) ? 'parada concluída' : resposta?.trim() ? 'rascunho; parada não concluída' : 'sem registro'));
      if(!estacao.memoriaViva && resposta?.trim()) linhas.push('Pergunta aberta:',
        atual.perguntas[estacao.id]?.trim() ? atual.perguntas[estacao.id] : 'A pergunta não foi guardada com este registro.');
      linhas.push(
        estacao.memoriaViva ? 'Registro de memória (sem pontuação):' : 'Resposta aberta:',
        resposta?.trim() ? resposta : 'Nenhum texto registrado.', '');
    }
    return linhas.join('\n');
  }
  root.ExpedicaoCore = { validarDesafio, normalizarEstado, premiar, salvarEstado, exportarRegistros };
})(globalThis);
