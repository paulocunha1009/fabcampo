export function agruparEventos(eventos,agora=new Date()){
 if(!Array.isArray(eventos)||eventos.length>100)throw new Error('Agenda inválida.');
 const partes=new Intl.DateTimeFormat('en-US',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(agora);
 const valor=tipo=>partes.find(parte=>parte.type===tipo).value;
 const hoje=`${valor('year')}-${valor('month')}-${valor('day')}`;
 for(const item of eventos){const data=typeof item?.data==='string'?new Date(item.data+'T12:00:00Z'):null;if(!item||!['nome','descricao','local','publico','participacao','responsavel','contato'].every(key=>typeof item[key]==='string'&&item[key].trim())||!/^\d{4}-\d{2}-\d{2}$/.test(item.data)||!data||Number.isNaN(data.getTime())||data.toISOString().slice(0,10)!==item.data||!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.horario))throw new Error('Evento inválido.');}
 const comparar=(a,b)=>(a.data+a.horario).localeCompare(b.data+b.horario);
 return {hoje,proximos:eventos.filter(item=>item.data>=hoje).sort(comparar),anteriores:eventos.filter(item=>item.data<hoje).sort((a,b)=>comparar(b,a))};
}
