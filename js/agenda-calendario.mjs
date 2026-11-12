import {agruparEventos} from './agenda-core.mjs?v=20261112-8';
const escapar=value=>String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const utc=value=>value.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
function dobrar(linha){const encoder=new TextEncoder();let resultado='',atual='',bytes=0;for(const caractere of linha){const size=encoder.encode(caractere).length;if(bytes+size>75){resultado+=atual+'\r\n';atual=' ';bytes=1;}atual+=caractere;bytes+=size;}return resultado+atual;}
function inicioUTC(data,horario){
 const desejado=new Date(`${data}T${horario}:00Z`).getTime();let instante=desejado;
 const formatar=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(let i=0;i<2;i++){const partes=formatar.formatToParts(new Date(instante));const get=tipo=>partes.find(p=>p.type===tipo).value;const representado=new Date(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`).getTime();instante+=desejado-representado;}
 return new Date(instante);
}
export function gerarCalendarioEvento(item,agora=new Date()){
 agruparEventos([item],agora);
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(item.id||'')||!Number.isInteger(item.revisao)||item.revisao<1)throw Error('Evento sem identificação válida.');
 const descricao=[item.descricao,'Público: '+item.publico,'Como participar: '+item.participacao,'Responsável: '+item.responsavel,'Contato institucional: '+item.contato,'Horário de término não informado. Consulte a agenda do portal para atualizações.'].join('\n\n');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FabCampo//Agenda escolar//PT-BR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+item.id+'@fabcampo.com.br','DTSTAMP:'+utc(agora),'DTSTART:'+utc(inicioUTC(item.data,item.horario)),'SEQUENCE:'+item.revisao,'SUMMARY:'+escapar(item.nome),'LOCATION:'+escapar(item.local),'DESCRIPTION:'+escapar(descricao),'URL:https://fabcampo.com.br/#agenda-escola','TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR'].map(dobrar).join('\r\n')+'\r\n';
}
