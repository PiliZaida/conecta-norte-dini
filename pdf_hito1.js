/* DINI V4: respuestas y PDF gestionados por el servidor, sin bibliotecas externas. */
(function(){
let guided=null,downloading=false;
const questions=[
  panels[0].fields.map(([name,type])=>({key:name,label:name,type})),
  [...panels[1].epp.flatMap((e,i)=>[{key:'e'+i,label:`EPP ${i+1}: ${e}. Selecciona ✔ o ✘ según la foto y la especificación oficial.`,type:'select'},{key:'eo'+i,label:`¿Cuál es la observación del EPP ${i+1}? Si no tienes, escribe "Sin observación".`,type:'text'}]),{key:'Nombre y firma de verificación',label:'¿Qué nombre firmará la verificación EPP?',type:'text'},{key:'Hora de verificación',label:'¿Cuál es la hora de verificación? (HH:MM)',type:'time'}],
  panels[2].variables.flatMap((v,i)=>[{key:'Valor actual '+i,label:`Tablero, ${v}: ¿qué valor aparece?`,type:'text'},{key:'Unidad '+i,label:`¿Cuál es la unidad?`,type:'text'},{key:'Estado '+i,label:'¿Qué indica el sistema: NORMAL o ALERTA?',type:'select'},{key:'¿Requiere acción y por qué? '+i,label:`¿Requiere acción ${v}? ¿Por qué?`,type:'textarea'}]),
  panels[3].fields.map(([name,type])=>({key:name,label:name,type}))
];
function allAnswers(){return [0,1,2,3].map(i=>storage()[sid()+'|H1|'+i]||{});}
function filled(){const a=allAnswers();let total=0,complete=0;questions.forEach((set,i)=>set.forEach(k=>{total++;if(String(a[i][k.key]||'').trim())complete++}));return {total,complete};}
// Los campos de referencia no cuentan como pendientes. Observaciones son
// opcionales, salvo cuando un EPP se marca con ✘.
const labels=['Ingreso','EPP','Tablero','Novedad'];
function requiredFor(i,a){
 if(i===0)return panels[0].fields.map(x=>x[0]).filter(k=>k!=='Observaciones sobre aptitud');
 if(i===1){const r=panels[1].epp.map((_,j)=>'e'+j);
   panels[1].epp.forEach((_,j)=>{if(String(a['e'+j]||'').trim().startsWith('✘'))r.push('eo'+j)});
   return [...r,'Nombre y firma de verificación','Hora de verificación'];}
 if(i===2)return panels[2].variables.flatMap((_,j)=>['Valor actual '+j,'Unidad '+j,'Estado '+j,'¿Requiere acción y por qué? '+j]);
 return panels[3].fields.map(x=>x[0]);
}
function sectionStatus(i){
 const a=allAnswers()[i]; const required=requiredFor(i,a);
 const pending=required.filter(k=>!String(a[k]??'').trim());
 const entered=Object.values(a).some(v=>String(v??'').trim());
 return {state:pending.length===0?'complete':entered?'partial':'empty',done:required.length-pending.length,total:required.length,pending};
}
function statusWord(s){return s==='complete'?'🟢 Completo':s==='partial'?'🟡 Incompleto':'⚪ Sin comenzar'}
function statusPanel(){
 const statuses=panels.map((_,i)=>sectionStatus(i));
 const done=statuses.reduce((n,x)=>n+x.done,0),total=statuses.reduce((n,x)=>n+x.total,0);
 const complete=statuses.filter(x=>x.state==='complete').length;
 return `<div class="progressCard" aria-live="polite"><div class="progressHead"><strong>📊 Avance del Hito 1</strong><span>${complete}/4 cuadros completos · ${done}/${total} campos obligatorios</span></div><div class="progressTrack"><div id="sectionProgressFill" style="width:${Math.round(100*done/total)}%"></div></div><div class="statusGrid">${statuses.map((x,i)=>`<button type="button" class="statusItem ${x.state}" onclick="goStep(${i})" title="Los cuadros se completan en orden"><b>${i+1}. ${labels[i]}</b><span>${statusWord(x.state)}</span><small>${x.done}/${x.total} campos</small></button>`).join('')}</div><p class="smallprint">Los campos fijos no se completan. Las observaciones de EPP solo son obligatorias si marcas ✘. El indicador mide campos respondidos, no la corrección técnica de las respuestas.</p></div>`;
}
function refreshStatusPanel(){
 const target=document.getElementById('liveStatusPanel');if(target)target.innerHTML=statusPanel();
 const status=sectionStatus(step),label=document.getElementById('currentStatus');
 if(label)label.textContent=`${statusWord(status.state)} · ${status.done}/${status.total} campos obligatorios`;
 const missing=document.getElementById('missingFields');
 if(missing)missing.innerHTML=status.pending.length?`<strong>Falta completar:</strong> ${status.pending.map(esc).join(' · ')}`:'✅ Todos los campos obligatorios de este cuadro tienen una respuesta.';
}
function banner(){if(!session||currentHito!==1)return '';const d=filled();return `<div class="pdfbar"><h2>📄 Tu Hito 1 se completa progresivamente</h2><p class="pdfhint">Los antecedentes fijos se mantienen impresos y los campos de respuesta se guardan al escribir. El PDF oficial se crea desde el servidor y se completa en sus casillas originales y no agrega anexos.</p><div class="progress"><div style="width:${Math.round(100*d.complete/d.total)}%"></div></div><span class="status" id="pdfProgress">${d.complete} de ${d.total} campos respondidos</span><div class="actions">${canDownload()?`<button class="btn" onclick="downloadOriginalPdf()">⬇ Descargar PDF completado</button>`:`<button class="btn secondary" disabled title="Completa primero los cuatro cuadros">🔒 PDF disponible al finalizar</button>`}<button class="btn secondary" onclick="beginGuided()">💬 Responder con DINI</button><a class="btn secondary" href="Hito_1_original.pdf" target="_blank" rel="noopener">📖 Ver Hito original completo</a></div><p class="smallprint">Revisa el documento generado antes de subirlo al LMS. Tus respuestas deben ser personales; DINI puede ayudarte a estudiar, no resolver la evaluación por ti.</p></div>`;}
const previews=[
 {pages:[1,2],caption:'Contexto oficial del ingreso al turno y formulario de identificación / aptitud.'},
 {pages:[3,4],caption:'Fotografía ORIGINAL del trabajador y las ocho filas del checklist de EPP.'},
 {pages:[4,5],caption:'Tablero SCADA original y tabla de registro de las cinco variables de proceso.'},
 {pages:[1,5,6,7],caption:'Briefing del operador saliente, tablero original y plantilla de novedad de turno.'}
];
function sourcePanel(i){const p=previews[i];return `<div class="card official"><h2>📚 Antecedentes originales del Hito 1</h2><p class="muted">${p.caption} Estos antecedentes son los que deben leer para contestar; no están reemplazados por ejemplos inventados.</p><div class="sourceGrid">${p.pages.map(n=>`<figure><a href="Hito_1_original.pdf#page=${n}" target="_blank" title="Abrir página ${n} en tamaño completo"><img loading="lazy" src="hito1_p${n}.webp" alt="Página oficial ${n} del Hito 1"></a><figcaption>Página ${n} · Toca para ampliar</figcaption></figure>`).join('')}</div><details><summary>Ver documento oficial íntegro (9 páginas)</summary><iframe title="Hito 1 original completo" src="Hito_1_original.pdf#page=${p.pages[0]}" loading="lazy" class="pdfFrame"></iframe></details></div>`;}
const oldRender=renderStep;
renderStep=function(){oldRender();const steps=$('main').querySelector('.steps');if(steps)steps.insertAdjacentHTML('beforebegin',`<div id="liveStatusPanel">${statusPanel()}</div>`+banner());const cards=$('main').querySelectorAll('.card');if(cards.length)cards[0].insertAdjacentHTML('afterend',sourcePanel(step)); const form=$('formFields');if(form)form.insertAdjacentHTML('beforebegin',`<div class="currentStatus" id="currentStatus"></div><div class="missingFields" id="missingFields"></div>`);refreshStatusPanel();};
const oldSet=setAnswer;
setAnswer=function(k,v){oldSet(k,v);const d=filled(),label=$('pdfProgress');if(label)label.textContent=`${d.complete} de ${d.total} campos respondidos`;const bar=document.querySelector('.pdfbar .progress div');if(bar)bar.style.width=`${Math.round(100*d.complete/d.total)}%`;refreshStatusPanel();const dl=document.querySelector('.pdfbar .actions button');if(dl){const ready=canDownload();dl.disabled=!ready;dl.textContent=ready?'⬇ Descargar PDF completado':'🔒 PDF disponible al finalizar';dl.title=ready?'Descargar evaluación completada':'Responde todos los campos obligatorios antes de descargar';}};
window.beginGuided=function(){if(!session)return;if(currentHito!==1)pick(1);guided={part:step,index:0};askNext()};
function askNext(){if(!guided)return;const a=allAnswers();while(guided.part<4){const set=questions[guided.part];
  while(guided.index<set.length){const q=set[guided.index];const optional=(q.key==='Observaciones sobre aptitud'||(/eo[0-7]/.test(q.key)&&!String(a[guided.part]['e'+q.key.slice(2)]||'').startsWith('✘')));
    if(optional||String(a[guided.part][q.key]||'').trim()){guided.index++;continue}break;}
  if(guided.index<set.length){if(step!==guided.part)goStep(guided.part);const k=set[guided.index];bubble(`📝 ${panels[guided.part].title}: ${k.label}. Revisa los antecedentes oficiales. Este campo es obligatorio; responde aquí o completa el campo en el formulario.`);return}
  if(sectionStatus(guided.part).state!=='complete'){if(step!==guided.part)goStep(guided.part);explainPending(guided.part);return}
  guided.part++;guided.index=0;
}guided=null;bubble('✅ Están respondidos todos los campos obligatorios. Revisa tus respuestas y descarga el PDF.');}
const oldHome=home;
home=function(){oldHome();if(session){const first=$('main').querySelector('.hitos');if(first)first.insertAdjacentHTML('beforebegin',`<div id="liveStatusPanel">${statusPanel()}</div>`);}};
function canDownload(){return [0,1,2,3].every(i=>sectionStatus(i).state==='complete')}
function firstUnfinishedBefore(target){for(let i=0;i<target;i++){if(sectionStatus(i).state!=='complete')return i}return -1}
function explainPending(i){const missing=sectionStatus(i).pending;const msg=`Para continuar, completa primero ${labels[i]}. Faltan ${missing.length} campo(s): ${missing.join(' · ')}.`;
 bubble('🔒 '+msg);const el=document.getElementById('missingFields');if(el&&step===i){el.innerHTML='<strong>⚠️ Debes completar estos campos antes de avanzar:</strong> '+missing.map(esc).join(' · ');el.scrollIntoView({behavior:'smooth',block:'center'})}
 return false;
}
const baseGoStep=goStep;
goStep=function(i){if(!Number.isInteger(i)||i<0||i>3)return;const blocked=firstUnfinishedBefore(i);if(blocked!==-1){if(step!==blocked)baseGoStep(blocked);return explainPending(blocked)}
 baseGoStep(i);return true};
nextStep=function(){if(sectionStatus(step).state!=='complete')return explainPending(step);
 if(step<3){goStep(step+1);return}
 if(!canDownload())return explainPending([0,1,2,3].find(i=>sectionStatus(i).state!=='complete'));
 guided=null;
 $('main').innerHTML=`<div class="eyebrow">Hito 1 · revisión final</div><h1>Revisión antes de descargar</h1><div id="liveStatusPanel">${statusPanel()}</div><div class="card"><p class="reviewOk">✅ Todos los campos obligatorios están respondidos.</p><p>Esto verifica la presencia de respuestas, no garantiza que sean correctas. Revisa que tus datos coincidan con la evaluación original y sean coherentes con tu declaración personal.</p><div class="actions"><button class="btn" onclick="downloadOriginalPdf()">⬇ Descargar mi Hito 1 completo</button><button class="btn secondary" onclick="goStep(0)">Revisar las respuestas</button></div></div>`;
};
const oldSend=send;
function guidedSend(){const input=$('msg'),s=input.value.trim();if(!s)return;if(!guided){oldSend();return}
 bubble(s,'user');input.value='';const k=questions[guided.part][guided.index];let value=s;
 if(/^saltar$/i.test(s)){bubble('Este campo es obligatorio. Puedes responderlo aquí o seleccionarlo en el formulario antes de continuar.');return}
 if(/^e[0-7]$/.test(k.key)){if(/^(✘|x|no|falta|dañado|dañada)$/i.test(s))value='✘ Falta, está dañado o no cumple';else if(/^(✔|si|sí|presente)$/i.test(s))value='✔ Presente y en buen estado';else{bubble('Selecciona ✔ o ✘. Si la foto no permite confirmar un requisito, explica la limitación en Observaciones.');return}}
 else if(k.key.startsWith('Estado ')){if(!/^(normal|alerta)$/i.test(s)){bubble('Indica únicamente NORMAL o ALERTA, según el tablero oficial.');return}value=s.toUpperCase()}
 else if(k.type==='select'&&/^¿/.test(k.key)){if(!/^(sí|si|no)$/i.test(s)){bubble('Elige Sí o No. No completaré tu declaración por ti.');return}value=/^s/i.test(s)?'Sí':'No'}
 setAnswer(k.key,value);bubble('✅ Respuesta guardada en tu formulario.');guided.index++;askNext();}
$('send').onclick=guidedSend;$('msg').onkeydown=e=>{if(e.key==='Enter')guidedSend()};$('guided').onclick=window.beginGuided;
$('pdfDownloadSide').onclick=()=>window.downloadOriginalPdf();
window.downloadOriginalPdf=async function(){if(!session||downloading)return;if(!canDownload()){const i=[0,1,2,3].find(j=>sectionStatus(j).state!=='complete');goStep(i);explainPending(i);return}downloading=true;const btn=$('pdfDownloadSide');btn.textContent='Generando PDF…';try{
 const response=await fetch('/api/pdf/hito1',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({answers:allAnswers()})});
 if(!response.ok){const err=await response.json().catch(()=>({error:'Error del servidor'}));throw Error(err.error||'No se pudo crear el PDF');}
 const blob=await response.blob();if(blob.type!=='application/pdf' || blob.size<1500)throw Error('El servidor no devolvió un PDF válido.');
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Hito_1_'+session.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_')+'.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);bubble('📄 PDF generado con los campos de la evaluación sin anexos. Ábrelo y revísalo antes de subirlo al LMS.');
}catch(err){bubble('No se pudo generar el PDF: '+err.message);alert('Error al generar PDF: '+err.message)}finally{btn.textContent='📄 Mi PDF';downloading=false;}};
})();
