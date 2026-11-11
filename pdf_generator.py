"""Genera Hito 1 sobre el PDF oficial, sin servicios externos ni CDN.
Incluye un anexo íntegro cuando las celdas oficiales no permiten texto extenso.
"""
import io, re, unicodedata
from pathlib import Path
import fitz

SOURCE = Path(__file__).resolve().parent / 'Hito_1_original.pdf'
COL=(0.12,0.12,0.30)
BLUE=(0.33,0.18,0.65)
LABELS=[
 ['Nombre completo','RUT','Fecha','Hora de ingreso','Turno','Zona asignada','Empresa / área','Cargo / rol','¿Descansaste al menos 8 horas?','¿Estás en condiciones físicas y mentales para trabajar?','¿Consumes medicamentos que puedan afectar reflejos?','¿Presentas fatiga, mareos o enfermedad?','Observaciones sobre aptitud','Nombre y firma (simulada)'],
 ['Casco de seguridad','Lentes de seguridad / antiparras','Protector auditivo','Mascarilla semifacial con filtro','Guantes resistentes a químicos','Calzado de seguridad','Chaleco reflectante','Overol de trabajo','Nombre y firma de verificación','Hora de verificación'],
 ['Temperatura motor molino SAG M-01','Nivel celda de flotación N°2','Flujo agua de proceso línea A','Presión bomba de pulpa B-03','Vibración motor bomba B-03'],
 ['Operador/a responsable','Fecha y hora de inicio','Zona / área','1. Estado general del proceso al inicio','2. Condiciones de EPP verificadas','3. Novedades del turno anterior','4. Observaciones relevantes, alertas y acciones','5. Condiciones pendientes para el relevo','Nombre de quien registra','Hora del registro']
]

def safe(v):
    """Latin-1 compatible with built-in Helvetica; no emojis break rendering."""
    s=str(v if v is not None else '')
    s=s.replace('✔','SI').replace('✘','NO').replace('✓','SI').replace('⚠','ALERTA')
    s=s.replace('–','-').replace('—','-').replace('…','...').replace('•','-').replace('°','°')
    s=''.join(ch if ord(ch)<256 and ch not in '\x00\x0b\x0c' else '?' for ch in s)
    return s.strip()

def wrap(s,width,fontsize=9):
    words=re.split(r'\s+',safe(s))
    words=[w for w in words if w]
    rows=[];line=''
    for w in words:
        combined=(line+' '+w).strip()
        if fitz.get_text_length(combined,fontname='helv',fontsize=fontsize)<=width:
            line=combined;continue
        if line: rows.append(line)
        line=w
        while fitz.get_text_length(line,fontname='helv',fontsize=fontsize)>width and len(line)>1:
            n=max(1,int(len(line)*width/fitz.get_text_length(line,fontname='helv',fontsize=fontsize))-1)
            rows.append(line[:n]);line=line[n:]
    if line:rows.append(line)
    return rows

def paint(page,x,y,value,w,h,fs=9):
    """Layout within a fixed rectangular field. Append full text in annex if truncated."""
    val=safe(value)
    if not val:return False
    original=val
    for size in [fs, fs-0.5, fs-1, fs-1.5, 6.7, 6.2]:
        if size<=0:continue
        lines=wrap(val,max(12,w-5),size)
        max_rows=max(1,int((h-3)/(size+2)))
        if len(lines)<=max_rows:break
    truncated=len(lines)>max_rows
    if truncated:
        lines=lines[:max_rows]
        if lines[-1]:lines[-1]=lines[-1][:max(0,len(lines[-1])-4)]+'...'
    for i,line in enumerate(lines):
        page.insert_text((x,y+size+1+i*(size+2)),line,fontname='helv',fontsize=size,color=COL,overlay=True)
    return truncated

def mark(page,x,y,cond):
    if cond:page.insert_text((x,y+12),'X',fontsize=12,fontname='hebo',color=COL,overlay=True)

def generate_pdf(name,generation,blocks):
    a,b,c,d=[(blocks[i] if i<len(blocks) and isinstance(blocks[i],dict) else {}) for i in range(4)]
    doc=fitz.open(SOURCE)
    flags=[]
    def put(page,x,y,v,w,h,fs=9):
        if paint(doc[page],x,y,v,w,h,fs):flags.append((page,v))
    # Página 2: registro de ingreso. Página original siempre queda intacta como base.
    put(1,169,269,a.get('Nombre completo'),140,25)
    put(1,417,269,a.get('RUT'),98,25)
    put(1,169,306,a.get('Fecha'),128,25)
    put(1,411,306,'06:00',98,25)
    mark(doc[1],170,341,True)  # Turno día: fijo en el escenario
    mark(doc[1],170,357,False)
    # Empresa / área y cargo ya vienen impresos en el Hito original; no se sobreescriben.
    for i,k in enumerate(LABELS[0][8:12]):
        y=[472,510,548,596][i]
        v=a.get(k,'')
        mark(doc[1],314,y,v.lower().startswith('s'))
        mark(doc[1],365,y,v.lower().startswith('n'))
    put(1,489,471,a.get('Observaciones sobre aptitud'),31,33,6.2)
    put(1,166,725,a.get('Nombre y firma (simulada)') or a.get('Nombre completo'),134,20,8)
    put(1,412,725,a.get('Nombre y firma (simulada)'),100,20,8)
    # EPP: 3 primeras filas página 3 y 5 restantes página 4.
    for i in range(8):
        page=2 if i<3 else 3
        y=([597,647,707][i] if i<3 else [58,123,187,251,311][i-3])
        v=b.get('e'+str(i),'')
        code='X' if ('✘' in v or 'Falta' in v or 'dañado' in v or 'no cumple' in v) else '✔' if ('✔' in v or 'Presente' in v) else ''
        if code=='✔':
            # Marca de visto bueno dibujada con trazos, compatible con cualquier lector PDF.
            doc[page].draw_line((416,y+10),(421,y+15),color=(0.02,0.42,0.19),width=1.8,overlay=True)
            doc[page].draw_line((421,y+15),(432,y+3),color=(0.02,0.42,0.19),width=1.8,overlay=True)
        elif code=='X':
            put(page,415,y,'X',35,18,11)
        put(page,472,y,b.get('eo'+str(i)),49,34,6.4)
    put(3,199,389,b.get('Nombre y firma de verificación'),187,13,7)
    put(3,450,389,b.get('Nombre y firma de verificación'),67,13,7)
    put(3,296,409,b.get('Hora de verificación'),101,10,7)
    # Lectura del tablero: cinco filas, página 5.
    for i,y in enumerate([366,414,466,517,568]):
        put(4,99,y,LABELS[2][i],117,40,7.5)
        put(4,225,y,c.get('Valor actual '+str(i)),50,35,8)
        put(4,282,y,c.get('Unidad '+str(i)),45,35,8)
        if c.get('Estado '+str(i)):
            # Oculta solo la indicación impresa 'NORMAL / ALERTA' del espacio editable.
            doc[4].draw_rect(fitz.Rect(339,y-2,419,y+43),color=None,fill=(1,1,1),overlay=True)
            put(4,344,y+8,c.get('Estado '+str(i)),70,26,8)
        put(4,431,y,c.get('¿Requiere acción y por qué? '+str(i)),88,39,7)
    # Novedades de turno: página 6 + hora en página 7.
    put(5,202,179,d.get('Operador/a responsable'),308,23,8)
    put(5,202,216,d.get('Fecha y hora de inicio'),308,24,8)
    put(5,202,253,d.get('Zona / área'),308,19,8)
    for i,(y,h) in enumerate(zip([301,381,460,539,630],[74,71,70,79,65])):
        put(5,203,y,d.get(LABELS[3][3+i]),306,h,9)
    put(5,202,736,d.get('Nombre de quien registra'),307,19,8)
    put(6,224,87,d.get('Hora del registro'),275,23,8)
    # Entregar exclusivamente las nueve páginas del documento oficial.
    # Los datos siguen guardados en la plataforma. No se crean anexos.
    doc.set_metadata({'title':'Hito 1 - '+safe(name),'subject':'Documento de trabajo completado por estudiante'})
    result=doc.tobytes(garbage=3,deflate=True)
    doc.close()
    return result
