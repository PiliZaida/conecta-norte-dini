/* DINI V13 | Hito 3: cuatro cuadros, páginas oficiales, guardado, tutor contextual y PDF. */
(function(){
const el=id=>document.getElementById(id), labels=['Inspección del equipo','Revisión crítica IA','Solicitud CMMS','Trazabilidad y par'];
const schemas=[
 [
 ['equipo','Nombre del equipo','text'],['codigo','Código del equipo','text'],['ubicacion','Ubicación exacta','text'],['fecha_inspeccion','Fecha de inspección','date'],['hora_inspeccion','Hora de inspección','time'],['operador','Nombre del/la operador/a','text'],
 ['s_ruido','¿Detectaste ruido inusual?','select',['Sí','No']],['detalle_ruido','Tipo y ubicación del ruido (si corresponde)','textarea'],
 ['s_vibracion','¿Vibración perceptible al tacto? (solo si fue observada de forma segura)','select',['Sí','No','No verificable']],
 ['s_temperatura','¿Temperatura elevada al tacto? (solo si consta)','select',['Sí','No','No verificable']],['s_humo','¿Humo o vapor?','select',['Sí','No','No verificable']],
 ['s_aceite','¿Filtración de aceite o fluido?','select',['Sí','No']],['detalle_aceite','Ubicación y características de la filtración (si corresponde)','textarea'],
 ['s_dano','¿Daño visible en estructura o componentes?','select',['Sí','No','No verificable']],['detalle_dano','Descripción de daño visible, si corresponde','textarea',null,true],
 ['descripcion','Descripción técnica: qué observas, dónde, desde cuándo y frecuencia','textarea'],
 ['estado_operacion','¿Puede continuar operando con monitoreo o debe detenerse?','select',['Puede seguir con monitoreo reforzado','Debe detenerse']],
 ['justificacion','Justificación del estado de operación','textarea'],['impacto','Impacto si el equipo falla sin aviso','textarea'],
 ['equipo_alternativo','¿Existe equipo alternativo?','select',['Sí','No','No informado; verificar']],['alternativo_cual','Equipo alternativo, si corresponde','text',null,true]
 ],
 [
 ...Array.from({length:3},(_,i)=>['error'+(i+1),'Problema '+(i+1)+' del borrador IA','review']),
 ['omisiones','¿Qué información omitió la IA que necesita conocer mantenimiento?','textarea']
 ],
 [
 ['ticket','Número de solicitud CMMS (identificador real o simulación identificada)','text'],['equipo','Nombre del equipo','text'],['codigo','Código de equipo','text'],['ubicacion','Ubicación exacta','text'],
 ['tipo','Tipo de solicitud','select',['Correctivo urgente','Correctivo programado','Preventivo']],
 ['prioridad','Prioridad','select',['Inmediata (< 2 hrs)','Urgente (< 8 hrs)','Normal (< 48 hrs)','Programada','A confirmar por supervisión']],
 ['descripcion','Descripción técnica CORREGIDA de la condición anómala','textarea'],['sensor','Dato del sensor al detectar','text'],
 ['impacto','Impacto en el proceso si no se interviene','textarea'],
 ['detencion','¿Debe detenerse para la intervención mecánica?','select',['Sí, coordinar detención con supervisión','No, según procedimiento y autorización expresa','Por definir por mantenimiento y supervisión']],
 ['epp','EPP requerido para zona y trabajo (sujeto a evaluación de riesgos)','textarea'],
 ['solicitante','Solicitado por','text'],['fecha_solicitud','Fecha de solicitud','date'],['hora_solicitud','Hora de solicitud','time'],['supervisor','Supervisor/a que autoriza o estado de autorización','text']
 ],
 [
 ...Array.from({length:5},(_,i)=>['trz'+(i+1),'Trazabilidad '+(i+1),'check']),
 ['evaluador','Nombre de compañero/a en rol de mantenedor/a','text'],
 ...Array.from({length:5},(_,i)=>['par'+(i+1),'Pregunta '+(i+1)+' del mantenedor/a','peer']),
 ['conclusion','¿Se puede actuar con esta documentación?','select',['Sí, puede preparar evaluación','No, necesita más información']],
 ['feedback','Retroalimentación del/la mantenedor/a','textarea'],
 ['compromiso','Respuesta del/la operador/a: qué mejoraré','textarea']
 ]
];
const sessions=[
 [['Sesión 1','Por qué registrar datos'],['Sesión 3','Mantenimiento predictivo y sensores'],['Sesión 4','Detalle y precisión de la documentación'],['Sesión 5','Instrumentación digital y lectura de registros']],
 [['Sesión 10','IA en descripciones técnicas'],['Sesión 13','Revisión y productividad con IA'],['Sesión 16','Práctica de revisión crítica y trazabilidad']],
 [['Sesión 11','CMMS y trazabilidad del activo'],['Sesión 12','Solicitudes de intervención'],['Sesión 6','LOTO y bloqueo'],['Sesión 7','Procedimientos de trabajo seguro'],['Sesión 17','Simulación de documentación y solicitud']],
 [['Sesión 16','Documentación y trazabilidad'],['Sesión 18','Evaluación documental entre pares'],['Sesión 19','Ciclo completo del registro'],['Sesión 22','Retroalimentación técnica']]
];
const refPages=[[1,2,3,4],[4,5],[5,6,7],[7,8]];
const hints=[
 'Dato crucial: 2,9 mm/s NO supera el máximo de 3,0 mm/s, pero el SCADA marca alerta operacional activa. Registra síntomas observados, no diagnósticos sin verificar.',
 'Compara el borrador de IA con el tablero y la ronda. No uses la pauta de resolución como material para los estudiantes.',
 'Un equipo que puede seguir OPERANDO no necesariamente puede ser REPARADO en marcha. La seguridad, aislamiento y permisos se coordinan antes de intervenir.',
 'Este cuadro requiere participación real de un compañero/a. No declares un acuse de mantenimiento o ticket real si todavía no consta en el sistema.'
];
const checklist=[
 'Anomalía registrada con fecha, hora, nombre y código correctos',
 'Solicitud generada con número de ticket asignado por el sistema',
 'Descripción suficiente: síntomas, VB-03, impacto y urgencia',
 'Estado del equipo al cierre registrado',
 'Cadena completa trazable: detección → documentación → solicitud → estado'
];
const peerQuestions=[
 '¿Puedes identificar equipo, código y ubicación sin ambigüedad?',
 '¿La descripción técnica explica exactamente qué ocurre?',
 '¿Está claramente indicada la urgencia?',
 '¿Está explicado el impacto en el proceso?',
 '¿Puedes preparar la evaluación sin llamar al operador/a?'
];
let part=0,guide=null,history=[],sending=false;const timers=new Map();
const k=p=>sid()+'|H3|'+p;
const all=()=>[0,1,2,3].map(p=>storage()[k(p)]||{});
const value=(p,f)=>all()[p][f];
function optional(p,f){if(p===0&&f==='detalle_dano')return value(0,'s_dano')!=='Sí';if(p===0&&f==='alternativo_cual')return value(0,'equipo_alternativo')!=='Sí';
 if(p===0&&f==='detalle_ruido')return value(0,'s_ruido')!=='Sí';if(p===0&&f==='detalle_aceite')return value(0,'s_aceite')!=='Sí';
 if(p===3&&f==='trz2'&&String(value(2,'ticket')||'').toLowerCase().includes('pendiente'))return false;return false}
function required(p){return schemas[p].map(f=>f[0]).filter(f=>!optional(p,f))}
function valid(p,field,v){if(field.startsWith('error')||field.startsWith('par'))return v&&typeof v==='object'&&Object.values(v).length>=(field.startsWith('par')?2:3)&&Object.values(v).every(x=>String(x??'').trim());return typeof v==='string'&&v.trim()!==''}
function stats(p){const a=all()[p],keys=required(p);let done=keys.filter(f=>valid(p,f,a[f])).length;return {done,total:keys.length,complete:done===keys.length,started:done>0}}
function ready(){return [0,1,2,3].every(p=>stats(p).complete)}
function save(p,f,v){v=typeof v==='string'?v.slice(0,3000):v;const store=storage();store[k(p)]={...(store[k(p)]||{}),[f]:v};saveStorage(store);
 const q=p+'|'+f;clearTimeout(timers.get(q));timers.set(q,setTimeout(()=>api('/api/answer',{hito:3,panel:p,field:f,value:JSON.stringify(v)}).catch(()=>{const target=el('h3saved');if(target)target.textContent='⚠ Sin conexión. Copia de respaldo conservada en este navegador.'}),650));refresh()}
function escv(v){return esc(String(v??''))}
function fieldHTML(p,[name,label,type,options]){const v=value(p,name)||'';let html='';
 if(type==='textarea')html=`<textarea data-h3="${name}" maxlength="3000" placeholder="Describe con tus palabras; no inventes datos">${escv(v)}</textarea>`;
 else if(type==='select')html=`<select data-h3="${name}"><option value="">Selecciona…</option>${options.map(o=>`<option value="${escv(o)}" ${v===o?'selected':''}>${escv(o)}</option>`).join('')}</select>`;
 else if(type==='check')html=`<select data-h3="${name}"><option value="">Selecciona solo si hay evidencia…</option><option ${v==='Confirmado'?'selected':''}>Confirmado</option><option ${v==='Pendiente de verificar'?'selected':''}>Pendiente de verificar</option></select><small>${escv(checklist[Number(name.slice(3))-1])}</small>`;
 else if(type==='review'){let obj=typeof v==='object'?v:{};html=`<div class="h2row">${[['fragmento','Frase exacta del borrador IA'],['problema','Por qué es incorrecta'],['correccion','Cómo debería decir']].map(([col,title])=>`<label>${title}<textarea data-h3obj="${name}" data-col="${col}" maxlength="1100">${escv(obj[col])}</textarea></label>`).join('')}</div>`}
 else if(type==='peer'){let obj=typeof v==='object'?v:{};html=`<div class="h2row"><p>${escv(peerQuestions[Number(name.slice(3))-1])}</p><label>Respuesta del/la mantenedor/a<select data-h3obj="${name}" data-col="respuesta"><option value="">Selecciona…</option><option ${obj.respuesta==='Sí'?'selected':''}>Sí</option><option ${obj.respuesta==='No'?'selected':''}>No</option></select></label><label>Fundamento u observaciones (si indica No, qué falta)<textarea data-h3obj="${name}" data-col="observacion" maxlength="850">${escv(obj.observacion)}</textarea></label></div>`}
 else html=`<input data-h3="${name}" type="${type}" value="${escv(v)}">`;
 return `<div class="field"><label>${escv(label)}${optional(p,name)?' <small>(condicional)</small>':''}</label>${html}</div>`
}
function progress(){let a=labels.map((_,p)=>stats(p)),done=a.reduce((x,y)=>x+y.done,0),total=a.reduce((x,y)=>x+y.total,0);return `<div class="progressCard"><div class="progressHead"><strong>📊 Avance del Hito 3</strong><span>${a.filter(s=>s.complete).length}/4 cuadros · ${done}/${total} campos obligatorios</span></div><div class="progressTrack"><div style="width:${Math.round(done/total*100)}%"></div></div><div class="statusGrid">${a.map((s,p)=>`<button class="statusItem ${s.complete?'complete':s.started?'partial':''}" onclick="h3Go(${p})"><b>${p+1}. ${escv(labels[p])}</b><span>${s.complete?'🟢 Completo':s.started?'🟡 Incompleto':'⚪ Sin comenzar'}</span><small>${s.done}/${s.total} campos</small></button>`).join('')}</div><p class="smallprint">Campos respondidos no significan respuestas técnicamente correctas. La evaluación entre pares exige participación real.</p></div>`}
function scenario(){if(part===0)return `<div class="fixed-box"><h3>🔒 Escenario de solo lectura · 10:15</h3><p>Equipo: bomba de pulpa B-03 · VB-03: 2,9 mm/s · rango 0,0–3,0 mm/s · alerta OPERACIONAL activa. Tendencia: 2,4 → 2,7 → 2,9 mm/s. Ronda: ruido metálico intermitente en rodamiento del motor y mancha de aceite oscuro de aprox. 10 cm en base del alojamiento del rodamiento trasero. El sensor no confirma la causa.</p></div>`;
 if(part===1)return `<div class="fixed-box"><h3>🔒 Borrador de IA no validado</h3><p>La descripción errónea de la evaluación está impresa en la página 4. Léela en la imagen y compárala con los datos oficiales antes de registrar tus correcciones.</p></div>`;
 if(part===2)return `<div class="fixed-box"><h3>🔒 Instrucción de SUP-MCN-03 · 10:19</h3><p>Documentar la anomalía y generar solicitud correctiva en CMMS. El equipo puede <strong>seguir operando hasta evaluación presencial</strong> de mantenimiento. El acuse de mantenimiento debe constar en el sistema antes de declararlo recibido.</p></div>`;
 return `<div class="fixed-box"><h3>🤝 Evaluación de un compañero/a</h3><p>El mantenedor/a debe leer tu ficha y solicitud y responder los cinco criterios. Las respuestas del rol mantenedor no deben ser inventadas por DINI ni por el operador/a. En este simulador el compañero puede completar sus campos presencialmente.</p></div>`}
function sources(){return `<div class="card official"><h2>📖 Documento original del Hito 3</h2><p class="muted">Páginas oficiales, solo lectura. La pauta de corrección permanece fuera del sitio estudiantil.</p><div class="sourceGrid">${refPages[part].map(n=>`<figure><a href="Hito_3_original.pdf#page=${n}" target="_blank" rel="noopener"><img loading="lazy" src="hito3_p${n}.webp" alt="Página ${n}"><figcaption>Página ${n} · ampliar</figcaption></a></figure>`).join('')}</div><details><summary>Abrir el documento original completo (11 páginas)</summary><iframe class="pdfFrame" loading="lazy" src="Hito_3_original.pdf#page=${refPages[part][0]}"></iframe></details></div>`}
function render(){currentHito=3;nav();el('main').innerHTML=`<div class="eyebrow">Hito 3 · Documentación digital de intervención</div><h1>${escv(labels[part])}</h1><p class="muted">Trabaja cuadro por cuadro con documentos oficiales. Completa los campos, consulta a DINI para comprender los conceptos y descarga el PDF de 11 páginas sin anexos.</p><div id="h3progress">${progress()}</div><div class="steps">${labels.map((x,p)=>`<button class="${p===part?'selected':''}" onclick="h3Go(${p})">${p+1}. ${escv(x)}</button>`).join('')}</div><div class="card"><h2>📚 Sesiones recomendadas del módulo 3</h2><ul class="study">${sessions[part].map(([s,d])=>`<li><b>${escv(s)}</b>: ${escv(d)}</li>`).join('')}</ul><div class="tip">💡 ${escv(hints[part])}</div></div>${sources()}<div class="card"><h2>✍️ ${escv(labels[part])}</h2>${scenario()}${schemas[part].map(f=>fieldHTML(part,f)).join('')}<div class="status" id="h3saved">Guardado automático al escribir</div><div class="actions"><button class="btn" onclick="h3Next()">${part===3?'Revisar y descargar':'Siguiente cuadro →'}</button><button class="btn secondary" onclick="h3Guide()">💬 Responder con DINI</button><button id="h3download" class="btn secondary" onclick="h3Download()" ${ready()?'':'disabled'}>${ready()?'⬇ Descargar Hito 3 completado':'🔒 PDF disponible al finalizar'}</button></div></div>`;
 el('main').querySelectorAll('[data-h3]').forEach(input=>{input.oninput=()=>save(part,input.dataset.h3,input.value);input.onchange=()=>save(part,input.dataset.h3,input.value)});
 el('main').querySelectorAll('[data-h3obj]').forEach(input=>{input.oninput=()=>{let p=part,k=input.dataset.h3obj,col=input.dataset.col,obj=all()[p][k]||{};save(p,k,{...obj,[col]:input.value})};input.onchange=input.oninput})
}
function refresh(){if(currentHito!==3)return;const prog=el('h3progress');if(prog)prog.innerHTML=progress();const btn=el('h3download');if(btn){btn.disabled=!ready();btn.textContent=ready()?'⬇ Descargar Hito 3 completado':'🔒 PDF disponible al finalizar'}}
function guard(target){for(let p=0;p<target;p++){if(!stats(p).complete){part=p;render();bubble('🔒 Antes de avanzar, completa el cuadro '+(p+1)+': '+labels[p]);return false}}return true}
window.h3Go=p=>{if(!Number.isInteger(p)||p<0||p>3)return;if(!guard(p))return;part=p;render()};
window.h3Next=()=>{if(!stats(part).complete){bubble('🔒 Debes completar los campos obligatorios de '+labels[part]+' antes de continuar.');return}if(part<3){part++;render()}else window.h3Download()};
function guideNext(){if(!guide)return;const p=guide.p,fs=schemas[p].filter(f=>required(p).includes(f[0]));while(guide.i<fs.length&&valid(p,fs[guide.i][0],value(p,fs[guide.i][0])))guide.i++;
 if(guide.i>=fs.length){guide=null;bubble('✅ Completaste los campos de este cuadro. Revisa su exactitud antes de continuar.');return}
 const f=fs[guide.i];if(part!==p){part=p;render()};bubble('📝 '+f[1]+'. Puedes responder en el formulario o en el chat. Para tablas y listas de verificación, utiliza el formulario.');}
window.h3Guide=()=>{if(currentHito!==3)pick(3);guide={p:part,i:0};guideNext()};
function guideReply(q){const p=guide.p,f=schemas[p].filter(x=>required(p).includes(x[0]))[guide.i];if(!f){guide=null;return}if(['review','peer','check'].includes(f[2])){bubble('Completa los subcampos de esa tabla directamente en la página.');return}if(f[2]==='select'&&!f[3].includes(q)){bubble('Selecciona una opción disponible: '+f[3].join(' / '));return}save(p,f[0],q);bubble('✅ Guardado en tu formulario.');guide.i++;guideNext()}
window.h3Download=async()=>{if(!ready()){bubble('🔒 El PDF se habilita al completar los cuatro cuadros, incluida la evaluación entre pares.');return}try{const r=await fetch('/api/pdf/hito3',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({answers:all()})});if(!r.ok){const e=await r.json();throw Error(e.error||'No se pudo generar')};const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Hito_3_'+session.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'_')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),40000);bubble('📄 PDF descargado. Revisa las 11 páginas y verifica que no haya textos cortados antes de entregarlo.')}catch(e){bubble('Error de PDF: '+e.message)}};
const oldPick=pick;pick=function(n){guide=null;if(n===3){part=0;render();return}oldPick(n)};
const oldHome=home;home=function(){oldHome();const cards=el('main').querySelectorAll('.hito');if(cards[2]){const tag=cards[2].querySelector('.pill');if(tag){tag.classList.add('green');tag.textContent='Disponible'}}};
const oldEnter=enter;enter=function(u){oldEnter(u);setTimeout(async()=>{try{const r=await fetch('/api/answers',{credentials:'same-origin'});if(!r.ok)return;const data=await r.json(),store=storage();for(let p=0;p<4;p++){let decoded={};for(let [key,value] of Object.entries(data.answers?.['H3|'+p]||{})){try{decoded[key]=JSON.parse(value)}catch{decoded[key]=value}}store[k(p)]={...decoded,...(store[k(p)]||{})}}saveStorage(store)}catch(e){}},100)};
const priorSend=el('send').onclick;async function h3Send(){if(currentHito!==3)return priorSend();const q=el('msg').value.trim();if(!q||sending)return;el('msg').value='';bubble(q,'user');if(guide){guideReply(q);return};sending=true;el('send').disabled=true;const msg=document.createElement('div');msg.className='bubble';msg.textContent='Consultando las diapositivas relacionadas…';el('chat').appendChild(msg);try{const res=await api('/api/chat',{hito:3,panel:part,message:q,history:history.slice(-10)});msg.textContent=res.reply;history.push({role:'user',text:q},{role:'model',text:res.reply});history=history.slice(-10)}catch(e){msg.textContent='No pude responder: '+e.message}finally{sending=false;el('send').disabled=false}}
el('send').onclick=h3Send;el('msg').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();h3Send()}};
const previousGuide=window.beginGuided;window.beginGuided=function(){if(currentHito===3)return window.h3Guide();return previousGuide()};
const previousPdf=window.downloadOriginalPdf;window.downloadOriginalPdf=function(){if(currentHito===3)return window.h3Download();return previousPdf()};
el('guided').onclick=()=>window.beginGuided();el('pdfDownloadSide').onclick=()=>window.downloadOriginalPdf();
})();
