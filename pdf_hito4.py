"""Hito 4: mantiene las 12 páginas oficiales y agrega anexos de respuesta cuando hace falta espacio."""
from pathlib import Path
import fitz
import textwrap
ROOT=Path(__file__).resolve().parent

# Respuestas extensas: no rechazarlas ni reducirlas a una letra ilegible.
# La lista se crea para cada PDF dentro de generate_hito4_pdf.
_OVERFLOW = []
_FONT = 'helv'

def _font(page):
    global _FONT
    fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    if Path(fontfile).exists():
        try:
            page.insert_font(fontname='DINI',fontfile=fontfile)
            _FONT='DINI'
            return _FONT
        except Exception:
            pass
    _FONT='helv'
    return _FONT

def put(page,rect,value,label='',fs=7.0):
    value=str(value or '').strip()
    if not value:return
    r=fitz.Rect(rect[0]*page.rect.width/600,rect[1]*page.rect.height/780,rect[2]*page.rect.width/600,rect[3]*page.rect.height/780)
    font=_font(page)
    # No reducir la fuente a 3.5 pt: es prácticamente ilegible.
    for size in (max(fs,6.2),6.2,5.8):
        sh=page.new_shape()
        remains=sh.insert_textbox(r,value,fontsize=size,fontname=font,lineheight=1.12,color=(.09,.15,.36))
        if remains>=0:
            sh.commit(overlay=True)
            return
    # La respuesta se conserva COMPLETA en páginas adicionales.
    ref=len(_OVERFLOW)+1
    _OVERFLOW.append((ref,page.number+1,label,value))
    note=f'Ver anexo {ref}'
    sh=page.new_shape()
    for size in (6.2,5.5,4.8):
        if sh.insert_textbox(r,note,fontsize=size,fontname=font,color=(.14,.25,.58))>=0:
            sh.commit(overlay=True)
            return
        sh=page.new_shape()
    # Cuadro extremadamente estrecho: la referencia se verá al menos en el anexo.

def _wrap_line(line,font,size,maxwidth):
    if not line:return ['']
    words=line.split(' ')
    lines=[];acc=''
    for word in words:
        if not word:continue
        candidate=(acc+' '+word).strip()
        if fitz.get_text_length(candidate,fontname=font,fontsize=size)<=maxwidth:
            acc=candidate;continue
        if acc:lines.append(acc);acc=''
        # Separar palabras y códigos larguísimos sin eliminar caracteres.
        while word and fitz.get_text_length(word,fontname=font,fontsize=size)>maxwidth:
            end=max(1,len(word)//2)
            while end<len(word) and fitz.get_text_length(word[:end+1],fontname=font,fontsize=size)<=maxwidth:end+=1
            while end>1 and fitz.get_text_length(word[:end],fontname=font,fontsize=size)>maxwidth:end-=1
            lines.append(word[:end]);word=word[end:]
        acc=word
    if acc:lines.append(acc)
    return lines

def append_answers(doc, entries, student, generation):
    """Crea tantas páginas como haga falta, sin cortar ni inventar respuestas."""
    if not entries:return
    pw,ph=doc[0].rect.width,doc[0].rect.height
    margin=46
    y=0;page=None;fontname='helv';lineh=13.7
    def newpage():
        nonlocal page,y,fontname
        page=doc.new_page(width=pw,height=ph)
        fontname=_font(page)
        page.draw_rect(fitz.Rect(0,0,pw,46),color=None,fill=(.15,.12,.33))
        page.insert_text((margin,29),'HITO 4 | ANEXO DE RESPUESTAS',fontsize=13,fontname=fontname,color=(1,1,1))
        page.insert_text((margin,ph-25),f'{student} · {generation}  |  Página adicional {len(doc)-12}',fontsize=8,fontname=fontname,color=(.32,.34,.43))
        y=72
    newpage()
    for number,orig_page,label,value in entries:
        if y>ph-105:newpage()
        title=f'{"ANEXO " + str(number) + " · Pág. original " + str(orig_page) + " · " if number else ""}{label}'
        for txt in _wrap_line(title,'helv',10,pw-2*margin):
            if y>ph-90:newpage()
            page.insert_text((margin,y),txt,fontsize=10,fontname=fontname,color=(.20,.16,.49))
            y+=15
        y+=4
        for para in str(value).replace('\r','').split('\n'):
            # Insertar todas las líneas y paginar para evitar overflow.
            # Se usa fuente base para medir de forma conservadora.
            for txt in _wrap_line(para,'helv',9.5,pw-2*margin):
                if y>ph-64:newpage()
                page.insert_text((margin,y),txt,fontsize=9.5,fontname=fontname,color=(.12,.15,.24))
                y+=lineh
        y+=18

def mark(page,rect,value,expected='Confirmado'):
    if value==expected:put(page,rect,'X',fs=8)

def generate_hito4_pdf(student,generation,blocks):
    global _OVERFLOW
    _OVERFLOW=[]
    doc=fitz.open(ROOT/'Hito_4_original.pdf')
    if len(doc)!=12:raise ValueError('El PDF original del Hito 4 debe tener 12 páginas')
    a,b,c,d,e,f,g=blocks
    # Página 3: checklist y primeras entradas del protocolo.
    p=doc[2]
    for i,y in enumerate((332,349,363,377,392)):mark(p,(81,y,91,y+11),a.get(f'apertura{i+1}'))
    for k,r in {'nombre':(122,401,292,418),'hora':(397,401,523,418),'firma':(116,418,291,430)}.items():put(p,r,a.get(k),k,6.2)
    for k,r in {'a_variable':(205,578,530,604),'a_dato':(205,609,530,642),'b_variable':(205,663,530,690)}.items():put(p,r,b.get(k),k,6.5)
    mark(p,(222,645,233,661),b.get('a_tipo'),'Informativa');mark(p,(334,645,346,661),b.get('a_tipo'),'Operacional');mark(p,(434,645,446,661),b.get('a_tipo'),'Crítica')
    # Página 4: segunda alerta, priorización, escalamiento, gestión operacional.
    p=doc[3]
    put(p,(207,53,528,78),b.get('b_dato'),'B datos',6.2)
    for option,r in [('Informativa',(222,85,234,101)),('Operacional',(318,85,332,101)),('Crítica',(413,85,426,101))]:mark(p,r,b.get('b_tipo'),option)
    for k,r in {
      'primero':(206,166,530,205),'justificacion':(206,209,530,260),'hora_critica':(206,294,530,318),
      'supervisor':(206,321,530,349),'hora_notificacion':(206,349,530,366),
      'instruccion':(206,369,530,423),'accion_critica':(206,427,530,462),
      'estado_critica':(206,464,530,522),'hora_operacional':(206,546,530,577),
      'accion_operacional':(206,605,530,657),'supervisor_operacional':(206,660,530,691),
    }.items():put(p,r,b.get(k),k,6.0)
    mark(p,(222,579,235,599),b.get('inspeccion'),'Sí')
    mark(p,(415,579,429,599),b.get('inspeccion'),'No')
    # Página 5: reflexión sobre acciones paralelas.
    p=doc[4]
    put(p,(206,76,530,159),b.get('simultaneo'),'Gestión simultánea',6.2)
    # Página 6: CT-01 y respuesta ejecutiva.
    p=doc[5]
    put(p,(206,85,540,154),c.get('descripcion'),'Descripción CT01',6.0)
    put(p,(206,157,540,198),c.get('impacto'),'Impacto CT01',6.0)
    if c.get('continuidad','').startswith('Sí'):put(p,(222,200,235,224),'X',fs=8)
    elif c.get('continuidad','').startswith('No'):put(p,(405,200,418,224),'X',fs=8)
    else:put(p,(245,224,535,235),'Pendiente de autorización',fs=5)
    put(p,(206,232,540,257),c.get('hora_registro'),'Hora registro',6.4)
    for k,r in {'autor':(250,499,375,519),'hora_respuesta':(388,499,537,519),
                'situaciones':(80,527,536,554),'acciones':(80,558,536,604),'proyeccion':(80,610,536,643)}.items():put(p,r,d.get(k),k,6.5)
    # Página 8: cuatro errores del borrador, solicitud a mantenimiento.
    p=doc[7]
    for i,(y0,y1) in enumerate([(129,151),(154,183),(185,207),(210,239)]):
        row=e.get('error'+str(i+1)) or {}
        if not isinstance(row,dict):continue
        put(p,(95,y0,249,y1),row.get('fragmento'),'Error fragmento',5.5)
        put(p,(253,y0,390,y1),row.get('problema'),'Error problema',5.5)
        put(p,(395,y0,526,y1),row.get('correccion'),'Error corrección',5.5)
    put(p,(76,251,527,282),e.get('omisiones'),'Omisiones',6.0)
    for k,r in {
      'ticket':(265,379,528,401),'equipo':(265,402,528,420),'ubicacion':(265,422,528,443),
      'descripcion':(81,507,525,555),'impacto':(81,563,525,598),
      'solicitante':(265,629,525,647)
    }.items():put(p,r,f.get(k),k,6.2)
    for option,r in [('Correctivo urgente',(269,444,281,460)),('Correctivo programado',(405,444,417,460)),('Preventivo',(357,454,370,473))]:
        # Opciones impresas en una fila compacta.
        if f.get('tipo')==option:put(p,r,'X',fs=8)
    for option,r in [('Inmediata (< 2 hrs)',(269,480,281,493)),('Urgente (< 8 hrs)',(404,480,417,493)),('Normal (< 48 hrs)',(269,492,281,505))]:mark(p,r,f.get('prioridad'),option)
    if f.get('acceso')=='Solo mantenimiento':put(p,(269,603,282,620),'X',fs=8)
    elif f.get('acceso')=='Requiere detención de proceso':put(p,(415,603,427,620),'X',fs=8)
    else:put(p,(291,614,523,629),'Pendiente de autorización',fs=5)
    # Página 9: cierre e indicadores de verificación.
    p=doc[8]
    for k,r in {
      'operador_cierre':(79,86,526,106),'situaciones':(79,108,528,151),
      'acciones':(79,154,528,200),'estado_final':(79,203,528,250),
      'pendientes':(79,254,528,272),'firma':(236,276,528,307)
    }.items():put(p,r,f.get(k),k,6.5)
    for i,y in enumerate([378,402,440,477,502,539,564,588]):mark(p,(81,y,93,y+11),f.get(f'trz{i+1}'))
    # El apartado 7 corresponde a preparación de la exposición oral y no
    # tenía representación alguna en el generador original: ahora se conserva.
    for key,title in [('hechos','Hechos del turno'),('decisiones','Criterio y decisiones'),
                      ('revision_ia','Revisión crítica del texto de IA'),('competencias','Competencias demostradas')]:
        val=str(g.get(key,'') or '').strip()
        if val:_OVERFLOW.append((0,10,'Apartado 7 · Preparación oral · '+title,val))
    append_answers(doc,_OVERFLOW,student,generation)
    doc.set_metadata({'title':'Hito 4 - '+student,'subject':'12 páginas oficiales y anexos de respuestas cuando corresponda'})
    out=doc.tobytes(garbage=3,deflate=True);doc.close();return out
