"""Hito 3, PDF oficial de 11 páginas. Nunca agrega un anexo ni inventa datos."""
import fitz
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def put(page, rect, text, size=7.4, label='campo'):
    """Insertar texto en coordenadas de referencia 768x1024; rechazar desbordes."""
    text=str(text or '').strip()
    if not text:return
    x0,y0,x1,y1=rect
    r=fitz.Rect(x0*page.rect.width/768,y0*page.rect.height/1024,x1*page.rect.width/768,y1*page.rect.height/1024)
    for fs in (size,size*.9,size*.8,size*.7,size*.6,4.3):
        # Test sin modificar página mediante shape (commit only when fits).
        sh=page.new_shape()
        remainder=sh.insert_textbox(r,text,fontsize=fs,fontname='helv',lineheight=1.10,color=(.1,.16,.36))
        if remainder>=0:
            sh.commit(overlay=True)
            return
    raise ValueError(f'La respuesta «{label}» es demasiado extensa para su casilla original. Acórtala antes de generar el PDF.')

def flag(page,rect,v,expected='Sí'):
    if v==expected:put(page,rect,'X',size=10)

def row3(page,rects,obj,label):
    if not isinstance(obj,dict):return
    for key,rect in rects.items():put(page,rect,obj.get(key,''),6.1,label+' '+key)

def generate_hito3_pdf(name,generation,blocks):
    doc=fitz.open(ROOT/'Hito_3_original.pdf')
    if len(doc)!=11:raise ValueError('Documento Hito 3 original no tiene 11 páginas')
    a,b,c,d=blocks
    # Página 3: identificación y síntomas. Se respetan tablas y textos impresos.
    p=doc[2]
    fields={
      'equipo':(282,231,684,260),'codigo':(404,263,683,293),
      'ubicacion':(282,307,685,347),'operador':(283,399,685,439),
      'descripcion':(282,633,684,737),
    }
    for k,r in fields.items():put(p,r,a.get(k),6.4 if k=='descripcion' else 7.2,k)
    put(p,(282,354,466,391),a.get('fecha_inspeccion'),7.2,'fecha inspección')
    put(p,(475,354,685,391),a.get('hora_inspeccion'),7.2,'hora inspección')
    # Marcas de síntomas en las casillas impresas, sin confundir dato de sensor con observación al tacto.
    symptoms=[('s_ruido',509),('s_vibracion',548),('s_temperatura',548),('s_humo',548),('s_aceite',575),('s_dano',603)]
    # Casillas adyacentes en la misma línea: las tres del grupo central tienen distinto desplazamiento x.
    xmap={'s_ruido':(101,116),'s_vibracion':(101,116),'s_temperatura':(385,399),'s_humo':(591,605),'s_aceite':(101,116),'s_dano':(101,116)}
    for key,y in symptoms:
        if a.get(key)=='Sí':
            x0,x1=xmap[key];put(p,(x0,y,x1,y+16),'X',8.5,key)
    if a.get('s_ruido')=='Sí':put(p,(376,504,680,538),a.get('detalle_ruido'),5.6,'detalle ruido')
    if a.get('s_aceite')=='Sí':put(p,(366,565,681,597),a.get('detalle_aceite'),5.5,'detalle aceite')
    if a.get('s_dano')=='Sí':put(p,(390,599,681,625),a.get('detalle_dano'),5.5,'detalle daño')
    # Sección de evaluación, selección en la fila original.
    state=a.get('estado_operacion','')
    put(p,(275,842,288,861),'X',8,'estado operación') if state.startswith('Puede') else put(p,(563,844,576,864),'X',8,'estado operación')
    # Página 4: razones, impacto y disponibilidad del equipo alternativo.
    p=doc[3]
    put(p,(282,75,682,129),a.get('justificacion'),6.3,'justificación')
    put(p,(282,135,682,191),a.get('impacto'),6.3,'impacto')
    put(p,(283,199,681,251),a.get('equipo_alternativo') + (': '+a.get('alternativo_cual','') if a.get('alternativo_cual') else ''),6.4,'equipo alternativo')
    # Página 5: tabla de revisión IA, tres errores y omisiones.
    p=doc[4]
    for i,(y0,y1) in enumerate([(310,383),(388,461),(466,541)]):
        obj=b.get('error'+str(i+1),{})
        row3(p,{'fragmento':(145,y0,288,y1),'problema':(295,y0,443,y1),'correccion':(452,y0,683,y1)},obj,f'error{i+1}')
    put(p,(108,587,682,655),b.get('omisiones'),6.6,'omisiones IA')
    # Página 6: solicitud CMMS.
    p=doc[5]
    for key,r in {
       'ticket':(408,249,682,289),'equipo':(282,292,682,323),'codigo':(282,324,682,352),
       'ubicacion':(282,354,682,384),
       'descripcion':(282,541,682,681),'sensor':(282,688,682,745),
       'impacto':(282,751,682,808)
    }.items():put(p,r,c.get(key),6.1 if key in ('descripcion','impacto','detencion') else 7.0,key)
    # Marcar opciones originales en vez de escribir texto encima de las opciones impresas.
    type_points={'Correctivo urgente':(281,419,294,438),'Correctivo programado':(431,419,444,438),'Preventivo':(282,445,295,462)}
    priority_points={'Inmediata (< 2 hrs)':(281,463,294,482),'Urgente (< 8 hrs)':(420,463,433,482),'Normal (< 48 hrs)':(280,481,293,501),'Programada':(490,482,503,501)}
    for v,lookup in [(c.get('tipo'),type_points),(c.get('prioridad'),priority_points)]:
        if v in lookup:put(p,lookup[v],'X',8,'opción solicitud')
    if c.get('prioridad')=='A confirmar por supervisión':put(p,(555,479,680,501),'A confirmar',6,'prioridad')
    det=c.get('detencion','')
    if det.startswith('Sí'):put(p,(279,846,292,864),'X',8,'detención')
    elif det.startswith('No'):put(p,(579,847,592,864),'X',8,'detención')
    else:put(p,(475,887,682,913),'Por evaluar',6,'detención')
    # Página 7: requisitos de acceso, identificación del solicitante y trazabilidad.
    p=doc[6]
    put(p,(282,73,683,133),c.get('epp'),6.3,'EPP')
    put(p,(282,164,682,208),c.get('solicitante'),7,'solicitante')
    put(p,(282,214,484,252),c.get('fecha_solicitud'),7,'fecha solicitud')
    put(p,(501,214,682,251),c.get('hora_solicitud'),7,'hora solicitud')
    put(p,(282,258,682,305),c.get('supervisor'),6.8,'supervisor')
    # Confirmado únicamente si hay evidencia. 'P' señala pendiente, no una marca de cumplimiento.
    for i,y in enumerate([616,678,757,852]):
        if d.get('trz'+str(i+1))=='Confirmado':put(p,(102,y,116,y+18),'X',9,f'trazabilidad{i+1}')
    p=doc[7]
    if d.get('trz5')=='Confirmado':put(p,(101,76,115,93),'X',9,'trazabilidad5')
    # Página 8: evaluación presencial de un/a compañero/a en rol mantenedor/a.
    put(p,(420,288,680,320),d.get('evaluador'),7,'evaluador')
    for i,(y0,y1) in enumerate([(381,436),(441,497),(502,557),(563,619),(623,678)]):
        obj=d.get('par'+str(i+1),{})
        if isinstance(obj,dict):
            # Marcación respuesta en formulario real, observación en columna derecha.
            put(p,(516,y0,528,y0+20),'X' if obj.get('respuesta')=='Sí' else '',8,'respuesta sí')
            put(p,(516,y0+22,528,y0+38),'X' if obj.get('respuesta')=='No' else '',8,'respuesta no')
            put(p,(538,y0,675,y1),obj.get('observacion'),5.6,'observación par')
    put(p,(613,690,676,734),'X Sí' if d.get('conclusion','').startswith('Sí') else 'X No',6,'conclusión')
    put(p,(108,777,675,844),d.get('feedback'),6.3,'retroalimentación')
    put(p,(108,877,675,936),d.get('compromiso'),6.3,'compromiso')
    doc.set_metadata({'title':'Hito 3 - '+name,'subject':'Documento de 11 páginas del estudiante, sin anexos'})
    result=doc.tobytes(garbage=3,deflate=True)
    doc.close();return result
