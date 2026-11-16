/* DINI V14: Hito 4 integrador, siete cuadros, siete apartados y documento oficial. */
(function(){
const $=id=>document.getElementById(id),titles=['Apertura y seguridad','Alertas simultáneas','Inspección de CT-01','Respuesta a jefatura','Revisión crítica de IA','Solicitud y cierre','Preparación de presentación'];
const fields=[
[
['apertura1','Verifiqué el estado de todos los módulos del sistema','check'],['apertura2','Leí las novedades del turno anterior','check'],['apertura3','Confirmé el estado del tablero al inicio (06:00)','check'],['apertura4','Identifiqué pendientes del turno anterior','check'],['apertura5','Registré mi ingreso y apertura del turno','check'],['nombre','Nombre del operador/a','text'],['hora','Hora de apertura','time'],['firma','Firma simulada','text']],
[
['a_variable','Alerta A: variable','text'],['a_dato','Código, valor y límite (Alerta A)','text'],['a_tipo','Tipo de alerta A','select',['Informativa','Operacional','Crítica']],['b_variable','Alerta B: variable','text'],['b_dato','Código, valor y límite (Alerta B)','text'],['b_tipo','Tipo de alerta B','select',['Informativa','Operacional','Crítica']],
['primero','¿Cuál alerta atiendes primero?','select',['A','B']],['justificacion','Justificación técnica de la priorización','textarea'],
['hora_critica','Hora de detección y confirmación de alerta crítica','text'],['supervisor','Supervisor/a notificado/a y canal','text'],['hora_notificacion','Hora de notificación','text'],['instruccion','Instrucción recibida (si no consta, indícalo sin inventarla)','textarea'],['accion_critica','Acción ejecutada y hora, o pendiente de autorización','textarea'],['estado_critica','Estado de la alerta al responder a jefatura / cierre','textarea'],
['hora_operacional','Hora de detección de la alerta operacional','text'],['inspeccion','¿Requiere inspección física?','select',['Sí','No']],['accion_operacional','Acción inmediata tomada (o gestión de la ronda)','textarea'],['supervisor_operacional','Supervisor notificado y hora (si no consta, indica pendiente)','text'],['simultaneo','¿Cómo gestionaste ambas situaciones simultáneamente?','textarea']],
[
['descripcion','Descripción técnica de CT-01: síntomas, dónde, cuándo, cuánto','textarea'],['impacto','Impacto en el proceso si falla','textarea'],['continuidad','¿Puede seguir operando? (explica estado según evidencia)','select',['Sí, con monitoreo reforzado','No, debe detenerse','Pendiente de evaluación y autorización']],['hora_registro','Hora de registro en sistema','time']],
[
['autor','De: nombre del operador/a','text'],['hora_respuesta','Hora de respuesta (antes de 08:30)','time'],['situaciones','Situaciones activas','textarea'],['acciones','Acciones tomadas y pendientes verificables','textarea'],['proyeccion','Estado proyectado al cierre, sin inventar resultados','textarea']],
[
...Array.from({length:3},(_,i)=>['error'+(i+1),'Error '+(i+1)+' del borrador IA','review']),['error4','Error adicional (opcional)','review_optional'],['omisiones','¿Qué omitió la IA que el destinatario debe saber?','textarea']],
[
['ticket','Número de solicitud (si no existe, señalar pendiente)','text'],['equipo','Equipo y código','text'],['ubicacion','Ubicación','text'],['tipo','Tipo de solicitud','select',['Correctivo urgente','Correctivo programado','Preventivo','Pendiente de definir']],['prioridad','Prioridad','select',['Inmediata (< 2 hrs)','Urgente (< 8 hrs)','Normal (< 48 hrs)','Pendiente de autorizar']],['descripcion','Descripción técnica corregida para mantenimiento','textarea'],['impacto','Impacto sobre el proceso','textarea'],['acceso','Acceso requerido / detención: no asumir permiso para intervenir energizado','select',['Solo mantenimiento','Requiere detención de proceso','Pendiente de evaluación y permiso']],['solicitante','Solicitante / fecha / hora','text'],
['operador_cierre','Operador/a / fecha / turno','text'],['situaciones','Situaciones gestionadas durante el turno','textarea'],['acciones','Acciones con hora, evitando afirmar lo no confirmado','textarea'],['estado_final','Estado de todas las variables al cierre (solo comprobadas)','textarea'],['pendientes','Condiciones abiertas y pendientes para turno siguiente','textarea'],['firma','Nombre / firma / hora de cierre','text'],
...Array.from({length:8},(_,i)=>['trz'+(i+1),['Apertura registrada','Alerta NV-F02 clasificada, escalada y registrada','Ficha CT-01 terminada','Solicitud CMMS con ticket real','Jefatura informada dentro de plazo','Errores del reporte IA revisados','Cierre completo y trazable','Cadena documental reconstruible'][i],'check'])],
[
['hechos','Guion, 1 min: ¿qué ocurrió en el turno?','textarea'],['decisiones','Guion, 1,5 min: ¿cómo priorizaste y qué criterio usaste?','textarea'],['revision_ia','Guion, 1 min: ¿qué errores de IA identificaste?','textarea'],['competencias','Guion, 1,5 min: competencias digitales con evidencia concreta','textarea']]
];
const pages=[[2,3],[3,4,5],[5,6],[6],[7,8],[8,9],[10]];
const sessions=[
['Sesión 1: apertura en máxima complejidad'],['Sesión 2: gestión y priorización de alertas','Sesión 5: turno integrado I','Sesión 6: información parcial'],
['Sesión 3: coordinación con mantenimiento y jefatura','Sesión 5: operaciones y mantenimiento'],['Sesión 3: coordinación simultánea','Sesión 4: reporte integrado a jefatura'],
['Sesión 8: IA crítica en alta complejidad','Sesión 9: ajuste técnico'],['Sesión 4: reporte integrado','Sesión 7: consolidación digital','Sesión 10: turno autónomo I'],['Sesión 12: consolidación de certificación','Sesión 13: evaluación integral']];
const notes=[
'El checklist hace referencia al estado heredado a las 06:00, no a las alertas que surgieron a las 07:23 y 07:25.',
'La fuente oficial NO entrega la instrucción específica de supervisor ni mediciones posteriores. Registra “pendiente/no informada” si no existe evidencia, en vez de inventar.',
'Rodrigo informó a las 07:31 una ronda de las 07:28: motor caliente, zumbido continuo, olor a quemado. No afirmó daño visible ni filtraciones.',
'La solicitud de jefatura llega a las 07:45. Un resumen ejecutivo debe indicar situación, acciones y estado proyectado; no se deben declarar acciones que no constan.',
'La IA del documento describe incorrectamente distintos hechos. Contrasta cada afirmación con el tablero y el reporte de campo, sin dar por verdadera una frase por estar bien escrita.',
'Para trazabilidad, marca Confirmado solamente si existe evidencia. Un ticket no puede inventarse ni una instrucción no registrada tratarse como ejecutada.',
'La presentación es oral y presencial, de 5 minutos. DINI ayuda a practicar, pero NO la realiza ni la valida por el estudiante.'
];
let part=0,guide=null,pending=false,history=[];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=p=>sid()+'|H4|'+p;
function get(){let st=storage();return titles.map((_,p)=>st[key(p)]||{})}
function fieldVal(p,n){return get()[p][n]??''}
function required(p){return fields[p].filter(x=>x[2]!=='review_optional')}
function valid(p,field,value){if(field[2]==='review'||field[2]==='review_optional'){return typeof value==='object'&&['fragmento','problema','correccion'].every(k=>String(value[k]??'').trim())}
return String(value??'').trim().length>0}
function stats(p){let fs=required(p),done=fs.filter(f=>valid(p,f,fieldVal(p,f[0]))).length;return {done,total:fs.length,complete:done===fs.length,started:done>0}}
const ready=()=>titles.every((_,p)=>stats(p).complete);
function storeField(p,name,val){let st=storage(),obj=st[key(p)]||{};obj[name]=val;st[key(p)]=obj;saveStorage(st);
 let stamp=$('h4saved');if(stamp)stamp.textContent='Guardado local ✓ · Sincronizando…';
 fetch('/api/answer',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({hito:4,panel:p,field:name,value:JSON.stringify(val)})}).then(r=>{if(!r.ok)throw Error('Servidor rechazó guardado');if(stamp)stamp.textContent='Guardado en servidor ✓'}).catch(()=>{if(stamp)stamp.textContent='⚠ Sin conexión al servidor; conserva la página abierta y revisa antes de cerrar.'});refresh()}
function renderField(p,f){let [n,label,type,options]=f,v=fieldVal(p,n),body='';
 if(type==='textarea')body=`<textarea data-h4="${n}" maxlength="3000">${esc(v)}</textarea>`;
 else if(type==='select'||type==='check'){let opts=type==='check'?['Confirmado','Pendiente / no verificable']:options;body=`<select data-h4="${n}"><option value="">Seleccionar…</option>${opts.map(opt=>`<option value="${esc(opt)}" ${opt===v?'selected':''}>${esc(opt)}</option>`).join('')}</select>`}
 else if(type==='review'||type==='review_optional'){let o=typeof v==='object'?v:{};body=`<div class="h2row">${[['fragmento','Fragmento exacto de IA'],['problema','Qué está mal y por qué'],['correccion','Corrección justificada']].map(([k,label])=>`<label>${label}<textarea data-h4obj="${n}" data-part="${k}" maxlength="900">${esc(o[k]||'')}</textarea></label>`).join('')}</div>`}
 else body=`<input data-h4="${n}" type="${type}" value="${esc(v)}">`;
 return `<div class="field"><label>${esc(label)}${type==='review_optional'?' (opcional)':''}</label>${body}</div>`}
function fixed(){let text=[
'🔒 Estado heredado a las 06:00: T-M01 71°C, VB-03 1,8 mm/s, NV-F02 68%, FW-A01 295 L/min; CT-01 sin novedades previas.',
'🔒 Tablero 07:25: NV-F02 42%, mínimo 55%, CRÍTICA desde 07:23. T-CT01 88°C, máximo 75°C, OPERACIONAL desde 07:25. Ambos requieren gestión de acuerdo con su clasificación.',
'🔒 07:31, Rodrigo V. comunica ronda 07:28: motor CT-01 caliente al tacto, zumbido continuo, olor a quemado, sin daño visible ni filtración reportados.',
'🔒 A las 07:45, JEF-MCN-01 solicita estado del proceso antes de las 08:30.',
'🔒 Borrador de IA no validado: revisa el texto completo de la página 7 y registra errores en la tabla original.',
'🔒 Completar solicitud de mantenimiento, reporte de cierre y 8 comprobaciones de trazabilidad. La falta de evidencias NO debe ocultarse.',
'🎤 Estructura de 5 minutos: hechos 1 min, decisiones 1,5 min, IA 1 min, competencias 1,5 min. La evaluación oral ocurre ante el curso.'
 ];return `<div class="fixed-box"><p>${esc(text[part])}</p></div>`}
function source(){return `<div class="card official"><h2>📄 Hito 4 original · documentos de referencia</h2><div class="sourceGrid">${pages[part].map(n=>`<figure><a href="Hito_4_original.pdf#page=${n}" target="_blank" rel="noopener"><img loading="lazy" src="hito4_p${n}.webp" alt="Hito 4 página ${n}"><figcaption>Página ${n} · ampliar</figcaption></a></figure>`).join('')}</div><details><summary>Abrir PDF original completo, 12 páginas</summary><iframe class="pdfFrame" src="Hito_4_original.pdf" loading="lazy"></iframe></details></div>`}
function progress(){let ss=titles.map((_,i)=>stats(i)),done=ss.reduce((a,b)=>a+b.done,0),total=ss.reduce((a,b)=>a+b.total,0);return `<div class="progressCard"><div class="progressHead"><strong>📊 Avance del Hito 4</strong><span>${ss.filter(x=>x.complete).length}/7 apartados · ${done}/${total} campos</span></div><div class="progressTrack"><div style="width:${Math.floor(100*done/total)}%"></div></div><div class="statusGrid">${ss.map((x,i)=>`<button class="statusItem ${x.complete?'complete':x.started?'partial':''}" onclick="h4Go(${i})"><b>${i+1}. ${esc(titles[i])}</b><span>${x.complete?'🟢 Completo':x.started?'🟡 En progreso':'⚪ Sin comenzar'}</span><small>${x.done}/${x.total}</small></button>`).join('')}</div></div>`}
function render(){currentHito=4;nav();$('main').innerHTML=`<div class="eyebrow">Hito 4 · Proyecto integrador · Turno digital completo</div><h1>${esc(titles[part])}</h1><p class="muted">Siete apartados, 12 páginas oficiales y presentación oral presencial. DINI te orienta con sesiones del módulo 4.</p><div id="h4progress">${progress()}</div><div class="steps">${titles.map((t,p)=>`<button class="${p===part?'selected':''}" onclick="h4Go(${p})">${p+1}. ${esc(t)}</button>`).join('')}</div><div class="card"><h2>📚 Sesiones recomendadas</h2><ul class="study">${sessions[part].map(t=>`<li>${esc(t)}</li>`).join('')}</ul><div class="tip">💡 ${esc(notes[part])}</div></div>${source()}<div class="card"><h2>✍️ ${esc(titles[part])}</h2>${fixed()}${fields[part].map(f=>renderField(part,f)).join('')}<div class="status" id="h4saved">Guardado automático</div><div class="actions"><button class="btn" onclick="h4Next()">${part===6?'Revisar y descargar':'Siguiente apartado →'}</button><button class="btn secondary" onclick="h4Guide()">💬 Estudiar con DINI</button><button class="btn secondary" id="h4download" ${ready()?'':'disabled'} onclick="h4Download()">${ready()?'⬇ Descargar Hito 4':'🔒 PDF al completar'}</button></div></div>`;
 $('main').querySelectorAll('[data-h4]').forEach(input=>{input.oninput=input.onchange=()=>storeField(part,input.dataset.h4,input.value)});
 $('main').querySelectorAll('[data-h4obj]').forEach(input=>{input.oninput=input.onchange=()=>{const n=input.dataset.h4obj,k=input.dataset.part,old=fieldVal(part,n);storeField(part,n,{...(typeof old==='object'?old:{}),[k]:input.value})}});
}
function refresh(){if(currentHito!==4)return;let p=$('h4progress');if(p)p.innerHTML=progress();let b=$('h4download');if(b){b.disabled=!ready();b.textContent=ready()?'⬇ Descargar Hito 4':'🔒 PDF al completar'}}
function guard(to){for(let p=0;p<to;p++)if(!stats(p).complete){part=p;render();bubble('🔒 Completa primero el apartado '+(p+1)+': '+titles[p]);return false}return true}
window.h4Go=p=>{if(!Number.isInteger(p)||p<0||p>=7||!guard(p))return;part=p;render()};
window.h4Next=()=>{if(!stats(part).complete){bubble('🔒 Completa las preguntas obligatorias de '+titles[part]+' antes de seguir. Si el dato no consta, deja indicado que está pendiente o no informado; no lo inventes.');return}if(part<6){part++;render()}else window.h4Download()};
window.h4Guide=()=>{guide=part;bubble('📚 '+titles[part]+'. '+notes[part]+' Escríbeme qué concepto necesitas comprender; puedo enseñarte con ejemplos sin completar tu evaluación por ti.')};
window.h4Download=async()=>{if(!ready()){bubble('🔒 Para generar el PDF se deben completar los siete apartados, incluido el esquema de exposición.');return}try{const res=await fetch('/api/pdf/hito4',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({answers:get()})});if(!res.ok){let e=await res.json();throw Error(e.error||'Error generando PDF')}const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Hito_4_'+session.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'_')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);bubble('📄 PDF oficial generado. Revisa todas las páginas. La exposición oral se realiza presencialmente y no la certifica este PDF.')}catch(e){bubble('No pude descargar: '+e.message)}};
const prevPick=pick;pick=function(n){if(n===4){part=0;render();return}prevPick(n)};
const prevHome=home;home=function(){prevHome();const cards=$('main').querySelectorAll('.hito');if(cards[3]){const pill=cards[3].querySelector('.pill');pill.classList.add('green');pill.textContent='Disponible';const caption=cards[3].querySelectorAll('span');if(caption.length>=2)caption[1].textContent='Proyecto integrador · Turno completo'}};
const prevEnter=enter;enter=function(u){prevEnter(u);setTimeout(async()=>{try{const r=await fetch('/api/answers',{credentials:'same-origin'});if(!r.ok)return;const data=await r.json(),st=storage();for(let p=0;p<7;p++){const obj={};for(const [key,v] of Object.entries(data.answers?.['H4|'+p]||{})){try{obj[key]=JSON.parse(v)}catch{obj[key]=v}}st[k2(p)]={...obj,...(st[k2(p)]||{})}}saveStorage(st)}catch(e){}},150)};
function k2(p){return sid()+'|H4|'+p}
const prevSend=$('send').onclick;async function sendH4(){if(currentHito!==4)return prevSend();let q=$('msg').value.trim();if(!q||pending)return;$('msg').value='';bubble(q,'user');pending=true;$('send').disabled=true;const bubbleNode=document.createElement('div');bubbleNode.className='bubble';bubbleNode.textContent='Consultando las sesiones del módulo 4…';$('chat').appendChild(bubbleNode);try{let a=await api('/api/chat',{hito:4,panel:part,message:q,history:history.slice(-10)});bubbleNode.textContent=a.reply;history.push({role:'user',text:q},{role:'model',text:a.reply});history=history.slice(-10)}catch(e){bubbleNode.textContent='No pude responder: '+e.message}finally{pending=false;$('send').disabled=false}};
$('send').onclick=sendH4;$('msg').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();sendH4()}};
const prevGuide=window.beginGuided;window.beginGuided=function(){if(currentHito===4)return window.h4Guide();return prevGuide()};
const prevPdf=window.downloadOriginalPdf;window.downloadOriginalPdf=function(){if(currentHito===4)return window.h4Download();return prevPdf()};
$('guided').onclick=()=>window.beginGuided();$('pdfDownloadSide').onclick=()=>window.downloadOriginalPdf();
})();
