/* DINI V12 · Hito 2: evaluación original, avance guiado y PDF sin anexos. */
(function(){
const $id=id=>document.getElementById(id);
const fields=[
 [
  ['hora','Hora de detección','time'],['variable','Variable en alerta','text'],['codigo','Código de instrumento','text'],
  ['valor','Valor registrado (con unidad)','text'],['diferencia','¿En cuánto supera el límite? Muestra el cálculo.','text'],
  ['tipo','Tipo de alerta','select',['Informativa','Operacional','Crítica']],['justificacion','Justificación técnica de la clasificación','textarea'],
  ['escalamiento','¿Requiere escalamiento inmediato?','select',['Sí','No']],['ticket','Número de ticket del sistema (ejemplo simulado si no se asignó)','text']
 ],[
  ['confirmacion','PASO 1: ¿Cómo confirmaste que la señal no era un error de sensor?','textarea'],['hora_confirmacion','PASO 1: Hora de confirmación y registro','time'],
  ['supervisor','PASO 2: Supervisor/a notificado/a','text'],['canal','PASO 2: Canal de notificación','select',['Canal digital del sistema','Radio','Presencial']],
  ['hora_notificacion','PASO 2: Hora de notificación','time'],['acuse','PASO 2: ¿Acusó recibo?','select',['Sí','No']],
  ['instruccion','PASO 3: Instrucción recibida, transcrita fielmente','textarea'],['hora_instruccion','PASO 3: Hora de recepción','time'],
  ['accion','PASO 4: Acción ejecutada','textarea'],['hora_accion','PASO 4: Hora de ejecución','time'],
  ['estado_tras_accion','PASO 4: Estado del proceso después de actuar','textarea'],
  ['resuelta','PASO 5: ¿Se resolvió la alerta?','select',['Sí','No, continúa en seguimiento']],
  ['hora_cierre','PASO 5: Hora de cierre, o indica pendiente','text'],['valor_cierre','PASO 5: Valor al cierre o al entregar turno','text']
 ],[
  ['operador_bitacora','Operador/a','text'],['fecha_bitacora','Fecha','date'],['turno_bitacora','Turno','select',['Día','Noche']],
  ...Array.from({length:7},(_,i)=>['fila'+(i+2),'Acción '+(i+2),'row'])
 ],[
  ...Array.from({length:4},(_,i)=>['error'+(i+1),'Error del reporte IA '+(i+1),'review']),
  ['omisiones','¿Qué información importante omitió el borrador de IA?','textarea'],
  ['reporte','Reporte corregido, versión final del operador/a','textarea'],
  ['operador_final','Nombre del/la operador/a','text'],['hora_envio','Hora de envío','time'],['firma_final','Firma simulada','text']
 ]];
const labels=['Clasificación','Escalamiento','Bitácora','Revisión IA'];
const sessions=[
 [['Sesión 2','Diapositivas 4–11: lectura de tableros y SCADA'],['Sesión 3','Diapositivas 7–18: diferencias respecto de rangos'],['Sesión 4','Diapositivas 4–11: setpoints y niveles de alerta'],['Sesión 5','Diapositivas 6–15: clasificación y priorización']],
 [['Sesión 6','Diapositivas 6–17: notificación y escalamiento'],['Sesión 10','Diapositivas 6–14: verificar señales y sensores'],['Sesión 15','Diapositivas 5–10: cadena de escalamiento']],
 [['Sesión 9','Diapositivas 4–17: registros y bitácoras digitales'],['Sesión 15','Diapositivas 7–11: registros suficientes']],
 [['Sesión 13','Diapositivas 4–18: límites y errores de IA'],['Sesión 16','Diapositivas 9–17: informe IA y revisión crítica']]
];
const hints=[
 'Compara los valores del tablero con sus rangos. Justifica con datos y riesgos, no solo con el color del aviso.',
 'Registra los cinco pasos según el formulario del Hito 2 (el simulador de la sesión 6 usa otro desglose). No declares una lectura posterior como real si el caso no la aporta.',
 'La fila 1 a las 08:47 ya aparece en el documento. Completa al menos cinco acciones propias con hora, canal y persona informada.',
 'El borrador IA es deliberadamente incorrecto: compáralo con tu tablero y tu bitácora. Puedes pedir a DINI orientación conceptual, pero tú validas el resultado.'
];
const refs=[[1,2,3],[1,2,4,5],[5,6],[6,7,8]];
let part=0,guided=null,saving=new Map(),h2History=[],isSending=false;
const originals={pick,home};
const key=p=>sid()+'|H2|'+p;
function all(){return Array.from({length:4},(_,i)=>storage()[key(i)]||{});}
function val(p,k){return all()[p][k]||'';}
function required(i){let ks=fields[i].map(x=>x[0]);if(i===2){return ['operador_bitacora','fecha_bitacora','turno_bitacora',...Array.from({length:5},(_,j)=>'fila'+(j+2))]}
 if(i===3){return [...Array.from({length:3},(_,j)=>'error'+(j+1)),'omisiones','reporte','operador_final','hora_envio','firma_final']};
 return ks;}
function valid(i,k,v){if(k.startsWith('fila')||k.startsWith('error'))return v&&typeof v==='object'&&Object.keys(v).length>=(k.startsWith('fila')?4:3)&&Object.values(v).every(x=>String(x||'').trim());return String(v||'').trim()!==''}
function st(i){const a=all()[i],need=required(i),done=need.filter(k=>valid(i,k,a[k])).length;return {total:need.length,done,complete:done===need.length,started:done>0};}
function save(i,k,value,saveServer=true){const a=storage();let v=typeof value==='string'?value.slice(0,3000):value;a[key(i)]={...(a[key(i)]||{}),[k]:v};saveStorage(a);
 if(saveServer){const q=i+'|'+k;clearTimeout(saving.get(q));saving.set(q,setTimeout(()=>api('/api/answer',{hito:2,panel:i,field:k,value:JSON.stringify(v)}).catch(()=>{const x=$id('h2saved');if(x)x.textContent='⚠ Sin conexión: las respuestas se conservaron en este navegador.'}),650));}
 refresh();}
function refresh(){if(currentHito!==2)return;const target=$id('h2progress');if(target)target.innerHTML=progress();const btn=$id('h2download');if(btn){btn.disabled=!allReady();btn.textContent=allReady()?'⬇ Descargar Hito 2 completado':'🔒 PDF disponible al finalizar'} }
function progress(){const states=labels.map((x,i)=>st(i)),done=states.reduce((n,s)=>n+s.done,0),total=states.reduce((n,s)=>n+s.total,0);
 return `<div class="progressCard"><div class="progressHead"><strong>📊 Avance del Hito 2</strong><span>${states.filter(s=>s.complete).length}/4 cuadros · ${done}/${total} campos obligatorios</span></div><div class="progressTrack"><div style="width:${Math.round(done/total*100)}%"></div></div><div class="statusGrid">${states.map((s,i)=>`<button class="statusItem ${s.complete?'complete':s.started?'partial':''}" onclick="h2Go(${i})"><b>${i+1}. ${labels[i]}</b><span>${s.complete?'🟢 Completo':s.started?'🟡 Incompleto':'⚪ Sin comenzar'}</span><small>${s.done}/${s.total} campos</small></button>`).join('')}</div><p class="smallprint">El progreso registra campos completos, no garantiza que la respuesta sea técnicamente correcta.</p></div>`;}
function allReady(){return [0,1,2,3].every(i=>st(i).complete)}
function escape(s){return esc(String(s??''))}
function makeField(p,f){const [k,label,type,opts]=f,a=all()[p],v=a[k]||'';let el='';
 if(type==='select')el=`<select data-h2="${k}"><option value="">Selecciona</option>${opts.map(o=>`<option ${o===v?'selected':''}>${escape(o)}</option>`).join('')}</select>`;
 else if(type==='textarea')el=`<textarea data-h2="${k}" maxlength="3000" placeholder="Redacta con tus palabras">${escape(v)}</textarea>`;
 else if(type==='row'){let r=typeof v==='object'?v:{};el=`<div class="h2row">${[['hora','Hora (HH:MM)'],['accion','Acción / observación'],['canal','Sistema / canal'],['informado','¿Quién fue informado?']].map(([sub,txt])=>`<label>${txt}<input data-h2row="${k}" data-col="${sub}" value="${escape(r[sub])}" maxlength="500"></label>`).join('')}</div>`}
 else if(type==='review'){let r=typeof v==='object'?v:{};el=`<div class="h2row">${[['fragmento','Fragmento del reporte IA'],['explicacion','Error y justificación'],['correccion','Corrección propuesta']].map(([sub,txt])=>`<label>${txt}<textarea data-h2row="${k}" data-col="${sub}" maxlength="900">${escape(r[sub])}</textarea></label>`).join('')}</div>`}
 else el=`<input type="${type}" data-h2="${k}" maxlength="${type==='time'?'5':type==='date'?'10':'3000'}" value="${escape(v)}">`;
 return `<div class="field"><label>${escape(label)}${!required(p).includes(k)?' <small>(opcional)</small>':''}</label>${el}</div>`;
}
function sourceHTML(){return `<div class="card official"><h2>📚 Material oficial del Hito 2</h2><p class="muted">Observa las páginas originales antes de escribir. Sus datos son de solo lectura. La resolución modelo NO está disponible para estudiantes.</p><div class="sourceGrid">${refs[part].map(n=>`<figure><a href="Hito_2_original.pdf#page=${n}" target="_blank" rel="noopener"><img loading="lazy" src="hito2_p${n}.webp" alt="Página ${n} del Hito 2"><figcaption>Página ${n} · ampliar</figcaption></a></figure>`).join('')}</div><details><summary>Ver el Hito 2 original completo (10 páginas)</summary><iframe class="pdfFrame" loading="lazy" src="Hito_2_original.pdf#page=${refs[part][0]}"></iframe></details></div>`}
function boardInfo(){if(part===0)return `<div class="fixed-box"><h3>🔒 Tablero de referencia, solo lectura</h3><p>T-M01: 97 °C · Rango 60–90 °C · alerta CRÍTICA · 08:47.<br>NV-F02: 71 % · FW-A01: 318 L/min · PB-03: 4,4 bar · VB-03: 2,7 mm/s (todas normales).</p></div>`;
 if(part===1)return `<div class="fixed-box"><h3>🔒 Instrucción oficial del supervisor, 08:51</h3><p>Reducir carga de alimentación del molino SAG M-01 al 70 % inmediatamente; monitorear T-M01 cada 5 minutos y registrar lecturas; si supera 100 °C, detener y activar MCN-EMG-001; informar resultado en 15 minutos.</p></div>`;
 if(part===2)return `<div class="fixed-box"><h3>🔒 Registro automático (fila 1)</h3><p>08:47 · SCADA-MCN: alerta visual y sonora T-M01, 97 °C (límite 90 °C). Esta fila ya está impresa en el PDF original. No se reemplaza.</p></div>`;
 return `<div class="fixed-box"><h3>🔒 Borrador IA: material de solo lectura</h3><p>El documento oficial contiene un reporte con errores intencionales. Compáralo con las páginas 1–6 y completa la revisión crítica.</p></div>`}
function render(){currentHito=2;nav();const a=all()[part];$id('main').innerHTML=`<div class="eyebrow">Hito 2 · Turno incidente digital</div><h1>${escape(labels[part])}</h1><p class="muted">Misma modalidad que Hito 1: estudia las sesiones, examina las páginas originales, responde todos los campos obligatorios y descarga el PDF sin anexos.</p><div id="h2progress">${progress()}</div><div class="steps">${labels.map((s,i)=>`<button class="${i===part?'selected':''}" onclick="h2Go(${i})">${i+1}. ${escape(s)}</button>`).join('')}</div><div class="card"><h2>📘 Qué sesiones debes revisar</h2><ul class="study">${sessions[part].map(x=>`<li><b>${escape(x[0])}</b>: ${escape(x[1])}</li>`).join('')}</ul><div class="tip">💡 ${escape(hints[part])}</div></div>${sourceHTML()}<div class="card"><h2>✍️ Completar ${escape(labels[part])}</h2>${boardInfo()}${fields[part].map(f=>makeField(part,f)).join('')}<div class="status" id="h2saved">Guardado automático al escribir</div><div class="actions"><button class="btn" onclick="h2Next()">${part<3?'Siguiente cuadro →':'Revisar y descargar'}</button><button class="btn secondary" onclick="h2Guide()">💬 Responder con DINI</button><button id="h2download" class="btn secondary" onclick="h2Download()" ${allReady()?'':'disabled'}>${allReady()?'⬇ Descargar Hito 2 completado':'🔒 PDF disponible al finalizar'}</button></div></div>`;
 $id('main').querySelectorAll('[data-h2]').forEach(input=>{input.oninput=()=>save(part,input.dataset.h2,input.value);input.onchange=()=>save(part,input.dataset.h2,input.value)});
 $id('main').querySelectorAll('[data-h2row]').forEach(input=>{input.oninput=()=>{const k=input.dataset.h2row,col=input.dataset.col,row=all()[part][k]||{};save(part,k,{...row,[col]:input.value})}});
}
function guard(target){for(let j=0;j<target;j++){if(!st(j).complete){part=j;render();bubble('🔒 Para avanzar, completa primero el cuadro '+(j+1)+': '+labels[j]+'.');return false}}return true}
window.h2Go=i=>{if(i<0||i>3)return;if(!guard(i))return;part=i;render();};
window.h2Next=()=>{if(!st(part).complete){bubble('🔒 Aún faltan campos obligatorios en '+labels[part]+'. Revisa los campos vacíos.');return;}if(part<3){part++;render()}else{if(allReady())window.h2Download()}};
window.h2Guide=()=>{if(currentHito!==2)pick(2);guided={part,index:0};nextQuestion();};
function nextQuestion(){if(!guided)return;let p=guided.part;let list=fields[p].filter(x=>required(p).includes(x[0]));while(guided.index<list.length&&valid(p,list[guided.index][0],val(p,list[guided.index][0])))guided.index++;
 if(guided.index>=list.length){guided=null;bubble('✅ Este cuadro está completo. Revisa que tus respuestas sean correctas y continúa al siguiente.');return}
 const f=list[guided.index];if(part!==p){part=p;render()};bubble('📝 '+labels[p]+': '+f[1]+'. Puedes contestar aquí o escribir en el campo de la pantalla.');}
function guidedReply(q){if(!guided)return false;const p=guided.part;let list=fields[p].filter(x=>required(p).includes(x[0]));let f=list[guided.index];if(!f){guided=null;return false}let [k,label,type,opts]=f;if(type==='row'||type==='review'){bubble('Para este apartado completa los subcampos en el formulario. DINI no puede repartir una sola respuesta entre columnas.');return true}
 if(type==='select'&&!opts.includes(q)){bubble('Selecciona una de estas opciones: '+opts.join(' / ')+'.');return true}
 save(p,k,q);bubble('✅ Tu respuesta fue guardada en el cuadro.');guided.index++;nextQuestion();return true;}
window.h2Download=async()=>{if(!allReady()){bubble('🔒 Primero debes completar los cuatro cuadros del Hito 2.');return}try{const r=await fetch('/api/pdf/hito2',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({answers:all()})});if(!r.ok){const e=await r.json();throw Error(e.error||'Error del PDF')};const b=await r.blob(),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='Hito_2_'+session.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'_')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),90000);bubble('📄 Hito 2 descargado sin anexos. Revisa que la letra se lea claramente en cada celda.');}catch(e){bubble('No pude generar el PDF: '+e.message)}};
const oldPick=pick;pick=function(n){guided=null;if(n===2){part=0;render();return;}oldPick(n)};
const oldHome=home;home=function(){oldHome();const cards=$id('main').querySelectorAll('.hito');if(cards[1]){cards[1].querySelector('.pill').classList.add('green');cards[1].querySelector('.pill').textContent='Disponible';}};
const oldEnter=enter;enter=function(u){oldEnter(u);setTimeout(async()=>{try{const r=await fetch('/api/answers',{credentials:'same-origin'});if(!r.ok)return;const data=await r.json(),allLocal=storage();for(let i=0;i<4;i++){const remote=data.answers?.['H2|'+i]||{},decoded={};for(const [k,v] of Object.entries(remote)){try{decoded[k]=JSON.parse(v)}catch{decoded[k]=v}}allLocal[key(i)]={...decoded,...(allLocal[key(i)]||{})}}saveStorage(allLocal)}catch{}},100)};
// La función del chat del Hito 1 está enlazada por pdf_hito1.js; sustituir el manejador solo para Hito 2.
const prevSend=$id('send').onclick;async function h2Send(){if(currentHito!==2)return prevSend();const q=$id('msg').value.trim();if(!q||isSending)return;$id('msg').value='';bubble(q,'user');if(guided){guidedReply(q);return};isSending=true;$id('send').disabled=true;const target=document.createElement('div');target.className='bubble';target.textContent='Estoy buscando el fragmento relevante de las sesiones…';$id('chat').appendChild(target);try{const ans=await api('/api/chat',{hito:2,panel:part,message:q,history:h2History.slice(-10)});target.textContent=ans.reply;h2History.push({role:'user',text:q},{role:'model',text:ans.reply});h2History=h2History.slice(-10)}catch(e){target.textContent='No pude responder: '+e.message}finally{isSending=false;$id('send').disabled=false}}
$id('send').onclick=h2Send;$id('msg').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();h2Send()}};
const oldGuide=window.beginGuided;window.beginGuided=function(){if(currentHito===2)return window.h2Guide();return oldGuide()};
const oldPdf=window.downloadOriginalPdf;window.downloadOriginalPdf=function(){if(currentHito===2)return window.h2Download();return oldPdf()};
// Botones laterales utilizan funciones asignadas previamente en V10.
$id('guided').onclick=()=>window.beginGuided();$id('pdfDownloadSide').onclick=()=>window.downloadOriginalPdf();
})();
