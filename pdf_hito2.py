"""Hito 2: escribir respuestas sobre el PDF oficial de 10 páginas, sin anexos."""
import fitz, io
from pathlib import Path

ROOT=Path(__file__).resolve().parent

# Cajas en coordenadas de la referencia visual 768 x 1024 (escaladas a PDF).
BOXES={
  0:{
    'hora':(282,172,689,198),'variable':(282,200,689,232),'codigo':(282,234,689,265),
    'valor':(282,266,689,298),'diferencia':(282,365,689,420),
    'tipo':(410,600,670,628),'justificacion':(280,642,687,706),
    'escalamiento':(286,716,685,747),'ticket':(290,783,670,828)},
  1:{
    'confirmacion':(304,355,686,421),'hora_confirmacion':(302,426,686,460),
    'supervisor':(302,515,684,557),'canal':(316,565,682,603),
    'hora_notificacion':(302,607,686,648),'acuse':(325,653,684,695),
    'instruccion':(310,746,690,832),'hora_instruccion':(302,841,687,872)},
  2:{
    'accion':(307,76,683,151),'hora_accion':(310,163,681,193),
    'estado_tras_accion':(308,198,686,243),'resuelta':(310,275,682,310),
    'hora_cierre':(393,303,551,338),'valor_cierre':(308,340,681,383),
    'operador_bitacora':(163,708,429,735),'fecha_bitacora':(496,708,627,735),
    'turno_bitacora':(667,707,700,734),
  },
  3:{'operador_final':(99,763,643,790),'hora_envio':(238,791,362,814),'firma_final':(467,791,660,814)}
}
# La hoja oficial muestra las partes editables en páginas 3,4,5,6,7 y 8.
# Tabla bitácora: página 5 filas 2-4, página 6 filas 5-8.
BIT_ROWS=[(4,826,855),(4,858,887),(4,890,919),(5,69,101),(5,103,135),(5,137,169),(5,171,203)]
REV_ROWS=[(6,389,417),(6,419,447),(6,449,477),(6,479,508)]

def stamp(page,coords,value,fontsize=8,align=0):
    value=str(value or '').strip()
    if not value:return
    x0,y0,x1,y1=coords;scale_x=page.rect.width/768;scale_y=page.rect.height/1024
    r=fitz.Rect(x0*scale_x,y0*scale_y,x1*scale_x,y1*scale_y)
    # Inserta texto en caja sin perder bytes. Se reduce tipografía para respuestas largas.
    for size in (fontsize,fontsize*.88,fontsize*.76,fontsize*.64,fontsize*.52,4.1):
        rc=page.insert_textbox(r,value,fontsize=size,fontname='helv',color=(.1,.13,.37),align=align,overlay=True)
        if rc>=0:return
    # Si no cabe la respuesta, dejar advertencia visible; el contenido íntegro sigue guardado en la plataforma.
    page.insert_text((r.x0,r.y0+7),'[Revisar texto largo]',fontsize=6,color=(.7,.1,.2),overlay=True)

def generate_hito2_pdf(name,generation,blocks):
    source=ROOT/'Hito_2_original.pdf'
    doc=fitz.open(source)
    if len(doc)!=10:raise ValueError('El Hito 2 oficial debe tener 10 páginas')
    a,b,c,d=blocks
    for key,rect in BOXES[0].items():stamp(doc[2],rect,a.get(key),7.5 if key not in ('justificacion','ticket') else 7)
    for key,rect in BOXES[1].items():stamp(doc[3],rect,b.get(key),7.5 if key not in ('confirmacion','instruccion') else 6.5)
    for key,rect in BOXES[2].items():stamp(doc[4],rect,b.get(key) if key not in ('operador_bitacora','fecha_bitacora','turno_bitacora') else c.get(key),6.7)
    # Tablas de bitácora. Proyección de 4 columnas dentro de fila oficial.
    for i,(p,y0,y1) in enumerate(BIT_ROWS):
        row=c.get('fila'+str(i+2),{})
        if not isinstance(row,dict):continue
        # páginas 5/6 tabla empieza 93 y termina 695 con cortes en x=168/418/554.
        for key,xa,xb,fs in [('hora',121,168,6.8),('accion',172,416,6.4),('canal',422,550,6.1),('informado',558,690,6.1)]:
            stamp(doc[p],(xa,y0,xb,y1),row.get(key),fs)
    for i,(p,y0,y1) in enumerate(REV_ROWS):
        row=d.get('error'+str(i+1),{})
        if not isinstance(row,dict):continue
        for key,x0,x1 in [('fragmento',127,297),('explicacion',300,482),('correccion',486,695)]:
            stamp(doc[p],(x0,y0,x1,y1),row.get(key),6.3)
    stamp(doc[6],(101,539,692,617),d.get('omisiones'),7)
    # Reporte ocupa el espacio amplio en páginas 7 y 8. Respeta el PDF sin anexar páginas.
    report=str(d.get('reporte','')).strip();p7=report[:1250];p8=report[1250:]
    stamp(doc[6],(103,728,692,952),p7,7.8)
    stamp(doc[7],(103,68,688,395),p8,7.8)
    stamp(doc[7],(110,414,620,445),d.get('operador_final') or name,8)
    stamp(doc[7],(258,445,365,477),d.get('hora_envio'),8)
    stamp(doc[7],(465,445,638,477),d.get('firma_final'),8)
    doc.set_metadata({'title':'Hito 2 - '+name,'subject':'Hito 2 del estudiante, sin anexo'})
    result=doc.tobytes(garbage=3,deflate=True)
    doc.close();return result
