/* Regras do desafio de identificação, sem dependência da IA. */
(function(root){
  'use strict';
  const texto = value => typeof value === 'string' && value.trim().length > 0;
  const normalizar = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  function contemNome(value, planta){
    const frase = ' ' + normalizar(value) + ' ';
    const nomes = [planta.nome].concat(String(planta.nome || '').split(/\s+e\s+/i), String(planta.cientifico || '').split('/'));
    return nomes.filter(texto).some(nome => frase.includes(' ' + normalizar(nome) + ' '));
  }
  function validarEnigma(value, planta){
    if(!texto(value) || value.length > 1800 || contemNome(value, planta)) throw new Error('Enigma inválido ou com resposta revelada.');
    return value.trim();
  }
  function fichaSemNome(planta){
    return {
      ambiente:contemNome(planta.ambiente, planta) ? '' : planta.ambiente,
      usos:planta.usos.filter(uso => !contemNome(uso, planta)),
      texto:contemNome(planta.texto, planta) ? '' : planta.texto
    };
  }
  function enigmaLocal(planta){
    const ficha = fichaSemNome(planta);
    const usos = ficha.usos.slice(0,2).join(' e ');
    return (ficha.ambiente ? 'Eu vivo em ' + ficha.ambiente + '. ' : '') +
      (usos ? 'Minha ficha registra ' + usos + '. ' : '') +
      'Qual das plantas abaixo corresponde às pistas da ficha?';
  }
  function embaralhar(items, random = Math.random){
    const result = items.slice();
    for(let i=result.length-1;i>0;i--){
      const j = Math.floor(random()*(i+1));
      [result[i],result[j]] = [result[j],result[i]];
    }
    return result;
  }
  function opcoesPara(base, escolhida, random = Math.random){
    const outras = embaralhar(base.filter(p => p.id !== escolhida.id), random).slice(0,3);
    if(outras.length !== 3) throw new Error('São necessárias quatro fichas distintas.');
    return embaralhar([...outras, escolhida], random);
  }
  function validarBase(value){
    if(!value || !Array.isArray(value.especies)) throw new Error('Formato do catálogo inválido.');
    const ids = new Set(), nomes = new Set();
    const especies = value.especies.map(p => {
      if(!p || !texto(p.id) || !texto(p.nome) || !texto(p.texto) || ids.has(p.id) || nomes.has(normalizar(p.nome))) throw new Error('Ficha incompleta ou repetida.');
      ids.add(p.id);nomes.add(normalizar(p.nome));
      return { ...p, cientifico:typeof p.cientifico === 'string' ? p.cientifico : '',
        ambiente:typeof p.ambiente === 'string' ? p.ambiente : '',
        usos:Array.isArray(p.usos) ? p.usos.filter(texto) : [],
        comunidades:Array.isArray(p.comunidades) ? p.comunidades.filter(texto) : [],
        nativa:p.nativa === true, medicinal:p.medicinal === true };
    });
    return { especies, pendentes_nativas:Array.isArray(value.pendentes_nativas) ? value.pendentes_nativas.filter(texto) : [],
      pendentes_medicinais:typeof value.pendentes_medicinais === 'string' ? value.pendentes_medicinais : '' };
  }
  root.CatalogoCore = { normalizar, contemNome, validarEnigma, fichaSemNome, enigmaLocal, opcoesPara, validarBase };
})(globalThis);
