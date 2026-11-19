# -*- coding: utf-8 -*-
u"""Reconcilia la auditoría v4.0 de ODONTOPREV (CID 162545) contra sus propias
tablas y contra nuestras fuentes.

    python -I scripts/concilia-auditoria-odontoprev.py [ruta.html]

Sin argumento usa el documento publicado en `public/auditorias/`. Acepta una
COPIA para probar que sabe fallar sin tocar el publicado.

── POR QUÉ ESTE ES DISTINTO A LOS OTROS ───────────────────────────────────────
Este reporte NO trae `const D`: sus cifras viven en tres tablas de HTML
—destinos, líneas y recuperación— y en el texto. Así que se leen las tablas y se
suman columnas. Que una cifra esté en un `<td>` y no en un `<script>` no la
vuelve menos publicada.

── LO QUE ESTE DOCUMENTO SÍ HACE BIEN, Y HAY QUE DECIRLO ──────────────────────
Las tres columnas de la tabla de destinos CIERRAN AL RÉCORD contra el total
(93,929 entrantes, 90,381 atendidas, 2,821 sin contestar), y la de líneas
también. La columna «nunca volvieron» de la tabla de recuperación suma 712
exactos. Eso es raro y conviene no estropearlo.

── LO QUE NO CIERRA ───────────────────────────────────────────────────────────
1. Las horas de conversación se publican TRES veces con TRES valores: 13,268 en
   el resumen, 13,267 en la tabla de correcciones y 13,266 sumando la tabla. La
   contradicción interna es el detector más barato que hay.
2. «Entre las dos cosas cabe el 62% de lo que se pierde» suma 42.47% + 19.6%
   SIN declarar si las dos poblaciones se solapan: una perdida de esa extensión
   fuera de las 7–20 h cuenta en los dos sitios.
3. Las 21:00 publican 492 entradas, 4 atendidas y 298 perdidas: faltan 190 por
   explicar (menú y buzón, que el documento cuenta aparte pero no aquí).
4. La tabla de recuperación sólo trae destinos con 5 o más pérdidas, así que
   cubre 2,816 de 2,821, y el 63.2% se mide sobre 2,816 mientras el 74.8% se
   mide sobre 2,821.

── Y LO QUE SÓLO SE VE MIRANDO NUESTRO REPOSITORIO ────────────────────────────
Las OCHO cifras que la v4 retira de la v3.0 coinciden AL RÉCORD con lo que hoy
tiene `data/analisis-llamadas.json`. O sea: nuestra fuente viva sigue siendo la
exportación truncada, y el tablero sigue enseñando los números retirados. Eso no
lo arregla el documento; lo tiene que decir el expediente.
"""
from __future__ import division

import io
import json
import os
import re
import sys
import urllib.request

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POR_DEFECTO = os.path.join(RAIZ, 'public', 'auditorias',
                           'Auditoria-Odontoprev-Trafico-2026.html')
CID = '162545'

fallos = []
avisos = []


def ok(cond, titulo, detalle=u''):
    print(u'   %s  %s' % (u'[ OK ]' if cond else u'[FALLA]', titulo))
    if detalle:
        print(u'           %s' % detalle)
    if not cond:
        fallos.append(titulo)
    return cond


def aviso(titulo, detalle=u''):
    print(u'   [aviso] %s' % titulo)
    if detalle:
        print(u'           %s' % detalle)
    avisos.append(titulo)


def seccion(t):
    print(u'\n   ' + t)
    print(u'   ' + u'-' * (len(t) + 2))


def mil(n):
    return u'{:,}'.format(int(round(n)))


def num(s):
    s = re.sub(r'[^\d.\-]', u'', s or u'')
    try:
        return float(s)
    except ValueError:
        return None


# ───────────────────────────────────────────────────────────────────────────────
ruta = sys.argv[1] if len(sys.argv) > 1 else POR_DEFECTO
if not os.path.exists(ruta):
    print(u'*** No existe el documento: %s' % ruta)
    sys.exit(1)

bruto = io.open(ruta, 'r', encoding='utf-8', errors='replace').read()

print(u'\n   RECONCILIACIÓN · ODONTOPREV v4.0 · CID %s' % CID)
print(u'   ' + u'=' * 72)
print(u'   documento: %s (%s bytes)' % (os.path.basename(ruta), mil(len(bruto))))

notas = re.findall(r'(?s)<!--NOTA:INICIO-->(.*?)<!--NOTA:FIN-->', bruto)
texto_html = re.sub(r'(?s)<!--NOTA:INICIO-->.*?<!--NOTA:FIN-->', u' ', bruto)
plano = re.sub(r'\s+', u' ', re.sub(r'<[^>]+>', u' ', texto_html))

mm = re.search(r'<!--\s*CONCILIACION:MARCADOS\s+([^>]*?)-->', bruto)
marcados = set(x.strip() for x in (mm.group(1) if mm else u'').split(',') if x.strip())


def cierra(clave, titulo, detalle=u''):
    if clave in marcados:
        print(u'   [dicho] %s' % titulo)
        if detalle:
            print(u'           %s' % detalle)
        return True
    fallos.append(u'NO CIERRA Y NO ESTÁ DECLARADO: ' + titulo)
    print(u'   [FALLA] NO CIERRA Y NADIE LO DECLARA · %s' % titulo)
    if detalle:
        print(u'           %s' % detalle)
    return False


# ───────────────────────────────────────────────────────────────────────────────
# 1 · el candado del lector
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'1 · EL LECTOR ANTES DE CUALQUIER CUENTA')


def tablas():
    out = []
    for t in re.findall(r'(?s)<table.*?</table>', texto_html):
        filas = []
        for fila in re.findall(r'(?s)<tr.*?</tr>', t):
            cel = re.findall(r'(?s)<t[dh][^>]*>(.*?)</t[dh]>', fila)
            cel = [re.sub(r'\s+', u' ', re.sub(r'<[^>]+>', u'', c)).strip() for c in cel]
            if any(cel):
                filas.append(cel)
        if filas:
            out.append(filas)
    return out


T = tablas()
print(u'           %d tabla(s) con filas: %s'
      % (len(T), u' · '.join(u'%d×%d' % (len(f), max(len(r) for r in f)) for f in T)))


def busca_tabla(*cabeceras):
    u"""La tabla cuya primera fila contenga todas estas cabeceras."""
    for filas in T:
        cab = u' | '.join(filas[0]).lower()
        if all(c.lower() in cab for c in cabeceras):
            return filas
    return None


t_dest = busca_tabla(u'Entrantes', u'Atendidas', u'% p', u'Horas')
t_lin = busca_tabla(u'Línea', u'Destino principal')
t_rec = busca_tabla(u'Recuperadas', u'Nunca volvieron')
t_sal = busca_tabla(u'Extensión', u'Conectadas')
t_corr = busca_tabla(u'La auditoría v3.0 publicaba')

if not ok(all(x is not None for x in (t_dest, t_lin, t_rec, t_sal, t_corr)),
          u'EL LECTOR SÍ ENCONTRÓ LAS CINCO TABLAS',
          u'destinos %s · líneas %s · recuperación %s · salientes %s · correcciones %s'
          % tuple(u'%d filas' % (len(x) - 1) if x else u'NO' for x in
                  (t_dest, t_lin, t_rec, t_sal, t_corr))):
    print(u'\n      *** Se para aquí. Un verde construido sobre tablas que no se')
    print(u'          leyeron es peor que no tener guion.')
    sys.exit(1)

TOT, ATE, SIN, NUNCA = 93929, 90381, 2821, 712

# ───────────────────────────────────────────────────────────────────────────────
# 2 · las tablas cierran (o no)
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'2 · LAS TABLAS CONTRA EL TOTAL DEL PERIODO')


def columna(filas, i, desde=1):
    v = []
    for r in filas[desde:]:
        if len(r) > i:
            x = num(r[i])
            if x is not None:
                v.append(x)
    return v


d_ent = sum(columna(t_dest, 1))
d_ate = sum(columna(t_dest, 2))
d_sin = sum(columna(t_dest, 3))
d_hrs = sum(columna(t_dest, 7))

ok(d_ent == TOT, u'destinos · la columna «Entrantes» CIERRA en el total',
   u'%s = %s sobre %d destinos' % (mil(d_ent), mil(TOT), len(t_dest) - 1))
ok(d_ate == ATE, u'destinos · «Atendidas» CIERRA', u'%s = %s' % (mil(d_ate), mil(ATE)))
ok(d_sin == SIN, u'destinos · «Sin contestar» CIERRA', u'%s = %s' % (mil(d_sin), mil(SIN)))

l_ent = sum(columna(t_lin, 2))
l_sin = sum(columna(t_lin, 3))
l_hrs = sum(columna(t_lin, 5))
ok(l_ent == TOT, u'líneas · «Entrantes» CIERRA en el total',
   u'%s = %s sobre %d líneas' % (mil(l_ent), mil(TOT), len(t_lin) - 1))
ok(l_sin == SIN, u'líneas · «Sin contestar» CIERRA', u'%s = %s' % (mil(l_sin), mil(SIN)))
ok(len(t_lin) - 1 == 21, u'líneas · son 21, las que el texto dice contratadas',
   u'%d filas' % (len(t_lin) - 1))

# Un ID de línea que no es un número no es un ID. Y dos líneas con el mismo ID
# serían la misma línea contada dos veces: la tabla cerraría igual y el cliente
# vería un inventario falso. Las sumas no cazan ninguna de las dos cosas.
ids = [r[0].strip() for r in t_lin[1:] if r]
no_num = [x for x in ids if not re.match(r'^\d+$', x)]
ok(not no_num, u'líneas · los 21 identificadores son números',
   u'no numéricos: %s' % (u', '.join(no_num) if no_num else u'ninguno'))
ok(len(set(ids)) == len(ids), u'líneas · no hay dos con el mismo identificador',
   u'%d distintos de %d filas' % (len(set(ids)), len(ids)))

r_sin = sum(columna(t_rec, 1))
r_24 = sum(columna(t_rec, 2))
r_nun = sum(columna(t_rec, 4))
ok(r_nun == NUNCA, u'recuperación · «Nunca volvieron» suma EXACTAMENTE las 712',
   u'%s = %s' % (mil(r_nun), mil(NUNCA)))
if r_sin != SIN:
    cierra('recuperacion-solo-5-o-mas',
           u'la tabla de recuperación no cubre todas las perdidas',
           u'cubre %s de %s: faltan %d, las de destinos con menos de 5 pérdidas '
           u'(el pie de la tabla lo dice, pero no el tamaño)'
           % (mil(r_sin), mil(SIN), SIN - r_sin))
else:
    ok(True, u'recuperación · cubre todas las perdidas', mil(r_sin))

p24a = r_24 * 100.0 / r_sin
p24b = r_24 * 100.0 / SIN
sem = (SIN - NUNCA) * 100.0 / SIN
if abs(p24b - 63.2) > 0.1:
    cierra('recuperacion-dos-bases',
           u'el 63.2% y el 74.8% no se miden sobre la misma base',
           u'63.2%% sale de %s / %s = %.2f%% (la base de la TABLA); sobre las %s '
           u'perdidas del periodo da %.2f%%. El 74.8%% sí usa las %s: '
           u'(%s−%s)/%s = %.2f%%'
           % (mil(r_24), mil(r_sin), p24a, mil(SIN), p24b, mil(SIN),
              mil(SIN), mil(NUNCA), mil(SIN), sem))
else:
    ok(True, u'las dos tasas de recuperación usan la misma base')

s_lla = sum(columna(t_sal, 1))
s_con = sum(columna(t_sal, 2))
ok(s_lla == 56 and len(t_sal) - 1 == 2,
   u'salientes · 56 llamadas desde 2 extensiones',
   u'%d llamadas · %d extensiones' % (s_lla, len(t_sal) - 1))
ok(abs(s_con * 100.0 / s_lla - 60.7) < 0.1,
   u'salientes · la conexión del 60.7% sale de sus partes',
   u'%d de %d = %.1f%% — sobre 56 llamadas, y el documento lo llama anécdota'
   % (s_con, s_lla, s_con * 100.0 / s_lla))

# ───────────────────────────────────────────────────────────────────────────────
# 3 · las horas de conversación: tres valores para una cifra
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'3 · LA CONTRADICCIÓN INTERNA: LAS HORAS DE CONVERSACIÓN')

dichas = sorted(set(int(x.replace(',', '')) for x in
                    re.findall(r'\b(13,2\d\d)\b', plano)))
print(u'           la tabla de destinos suma %s h · la de líneas %s h'
      % (mil(d_hrs), mil(l_hrs)))
print(u'           el texto publica: %s' % u' · '.join(mil(x) for x in dichas))
ok(d_hrs == l_hrs, u'las dos tablas coinciden entre sí en las horas',
   u'%s = %s' % (mil(d_hrs), mil(l_hrs)))
if len(dichas) > 1 or (dichas and dichas[0] != d_hrs):
    cierra('horas-tres-valores',
           u'las horas de conversación se publican con %d valores distintos' % (
               len(set(dichas + [int(d_hrs)]))),
           u'resumen y tabla de correcciones dicen %s; las tablas suman %s. '
           u'Diferencia máxima: %d horas sobre %s (%.3f%%). No mueve ninguna '
           u'conclusión, pero una cifra con tres valores en el mismo documento se '
           u'le nota al cliente.'
           % (u' y '.join(mil(x) for x in dichas), mil(d_hrs),
              max(dichas + [int(d_hrs)]) - min(dichas + [int(d_hrs)]), mil(d_hrs),
              (max(dichas + [int(d_hrs)]) - min(dichas + [int(d_hrs)])) * 100.0 / d_hrs))
else:
    ok(True, u'las horas publicadas son las que suman las tablas')

minprom = d_hrs * 60.0 / ATE
ok(abs(minprom - 8.8) < 0.05, u'«8.8 min por llamada atendida» se reconstruye',
   u'%s h × 60 / %s atendidas = %.2f min' % (mil(d_hrs), mil(ATE), minprom))

# ───────────────────────────────────────────────────────────────────────────────
# 4 · los porcentajes del texto, dividiendo
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'4 · LOS PORCENTAJES DEL TEXTO SE RECONSTRUYEN')

ok(abs(ATE * 100.0 / TOT - 96.22) < 0.01, u'«96.22% atendidas»',
   u'%s / %s = %.3f%%' % (mil(ATE), mil(TOT), ATE * 100.0 / TOT))
ok(abs(SIN * 100.0 / TOT - 3.00) < 0.01, u'«3.00% sin contestar»',
   u'%s / %s = %.3f%%' % (mil(SIN), mil(TOT), SIN * 100.0 / TOT))
ok(abs(NUNCA * 100.0 / TOT - 0.76) < 0.01, u'«712 son el 0.76% del tráfico»',
   u'%s / %s = %.3f%%' % (mil(NUNCA), mil(TOT), NUNCA * 100.0 / TOT))

# la extensión
fila_ext = [r for r in t_dest[1:] if r and u'Rojas' in r[0]]
ok(bool(fila_ext), u'la extensión con nombre de persona está en la tabla de destinos')
if fila_ext:
    r = fila_ext[0]
    e, a, s = num(r[1]), num(r[2]), num(r[3])
    ok(e == 1291 and s == 1198 and a == 93 and a + s == e,
       u'la extensión: 1,291 entrantes = 93 atendidas + 1,198 sin contestar',
       u'%s + %s = %s' % (mil(a), mil(s), mil(e)))
    ok(abs(s * 100.0 / e - 92.8) < 0.05, u'«el 92.8% de lo que entra ahí»',
       u'%s / %s = %.2f%%' % (mil(s), mil(e), s * 100.0 / e))
    ok(abs(s * 100.0 / SIN - 42.47) < 0.01, u'«el 42.47% de todas las pérdidas»',
       u'%s / %s = %.3f%%' % (mil(s), mil(SIN), s * 100.0 / SIN))
    ok(abs(e * 100.0 / TOT - 1.37) < 0.01, u'«sobre el 1.37% del volumen»',
       u'%s / %s = %.3f%%' % (mil(e), mil(TOT), e * 100.0 / TOT))
    # la línea recibe MÁS que el destino
    fl = [x for x in t_lin[1:] if x and u'Rojas' in u' '.join(x)]
    if fl:
        le = num(fl[0][2])
        ok(le > e, u'la LÍNEA recibe más que el DESTINO, y el texto usa las dos cifras',
           u'la línea %s recibe %s y el destino %s: %d llamadas de esa línea '
           u'fueron a otra parte y se atendieron. Las %s perdidas son las mismas '
           u'en los dos sitios (%.1f%% de la línea, %.1f%% del destino).'
           % (fl[0][0], mil(le), mil(e), le - e, mil(s), s * 100.0 / le,
              s * 100.0 / e))

# fuera de horario
m = re.search(r'entran (\d[\d,]*) llamadas, apenas el', plano)
fuera = int(m.group(1).replace(',', '')) if m else 938
ok(abs(553 * 100.0 / fuera - 59.0) < 0.1, u'fuera de 7–20 h: «553 de 938 = 59.0%»',
   u'553 / %s = %.2f%%' % (mil(fuera), 553 * 100.0 / fuera))
ok(abs(553 * 100.0 / SIN - 19.6) < 0.05, u'«el 19.6% de todas las pérdidas»',
   u'553 / %s = %.2f%%' % (mil(SIN), 553 * 100.0 / SIN))
ok(abs(fuera * 100.0 / TOT - 1.0) < 0.05, u'«apenas el 1.0% del tráfico»',
   u'%s / %s = %.2f%%' % (mil(fuera), mil(TOT), fuera * 100.0 / TOT))

# el 62% suma dos poblaciones que pueden solaparse
suma62 = 42.47 + 19.6
if re.search(u'cabe el 62%', plano):
    cierra('solape-extension-y-horario',
           u'«el 62% entre las dos cosas» suma sin declarar si se solapan',
           u'42.47%% + %.1f%% = %.2f%%, pero una perdida de esa extensión ocurrida '
           u'fuera de las 7–20 h cuenta en los DOS conjuntos. El documento no '
           u'publica la intersección, así que el 62%% es un TECHO, no una suma '
           u'limpia.' % (19.6, suma62))

# las 21:00
m = re.search(r'entran (\d+) llamadas, un agente toma (\d+) y se pierden (\d+)', plano)
if m:
    e21, a21, p21 = (int(x) for x in m.groups())
    resto = e21 - a21 - p21
    if resto:
        cierra('hora-21-no-cierra',
               u'las 21:00 publican tres cifras que no suman su total',
               u'%d entradas − %d atendidas − %d perdidas = %d sin explicar. Son '
               u'menú y buzón, que el documento cuenta aparte en «Definiciones» '
               u'pero no aquí.' % (e21, a21, p21, resto))
    else:
        ok(True, u'las 21:00 cierran', u'%d = %d + %d' % (e21, a21, p21))

# las 989 sin destino
m = re.search(r'(\d+) las resolvió el menú y (\d+) quedaron sin contestar', plano)
if m:
    a989, b989 = int(m.group(1)), int(m.group(2))
    fd = [r for r in t_dest[1:] if r and u'sin destino' in r[0]]
    tot989 = num(fd[0][1]) if fd else 989
    ok(a989 + b989 == tot989,
       u'las 989 sin destino se reparten sin hueco',
       u'%d menú + %d sin contestar = %d' % (a989, b989, a989 + b989))

# ───────────────────────────────────────────────────────────────────────────────
# 5 · la tabla de correcciones contra NUESTRA fuente
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'5 · LO QUE LA v4 RETIRA DE LA v3.0, CONTRA data/analisis-llamadas.json')

an = None
p = os.path.join(RAIZ, 'data', 'analisis-llamadas.json')
if os.path.exists(p):
    an = json.load(io.open(p, 'r', encoding='utf-8'))
if an is None:
    aviso(u'no se pudo leer data/analisis-llamadas.json',
          u'la comprobación más importante de este guion queda SIN HACER')
else:
    cu = (an.get('cuentas') or {}).get(CID)
    if not cu:
        aviso(u'el CID %s no está en analisis-llamadas.json' % CID)
    else:
        ent, sal = cu['ent'], cu['sal']
        hrs = sum(d.get('min', 0) for d in ent['dest']) / 60.0
        sep = ent['meses'].get('2026-09') or {}
        rc = [d for d in ent['dest'] if u'Rojas' in d['d']]
        we = [d for d in ent['dest'] if d['d'] == 'WELBE']
        comp = [
            (u'entrantes del corte v3.0', ent['total'], 76385),
            (u'fecha de corte v3.0', ent.get('hasta'), '2026-09-14'),
            (u'salientes v3.0', sal['total'], 11),
            (u'primera saliente v3.0', sal.get('desde'), '2026-04-13'),
            (u'% sin columna de destino',
             round(ent['sinCol'] * 100.0 / ent['total'], 1), 51.4),
            (u'septiembre parcial: llamadas', sep.get('total'), 4575),
            (u'septiembre parcial: tasa',
             round((sep.get('Lost') or 0) * 100.0 / (sep.get('total') or 1), 2), 1.57),
            (u'concentración del destino',
             round((rc[0]['l'] if rc else 0) * 100.0 / ent['tipos']['Lost'], 1), 37.9),
            (u'Welbe: sin contestar de entrantes',
             u'%d de %d' % ((we[0]['l'] if we else 0),
                            (we[0]['l'] + we[0]['c']) if we else 0), u'7 de 8'),
            (u'horas de conversación', int(round(hrs)), 11083),
        ]
        malas = []
        for etiq, nuestro, publicado in comp:
            igual = (str(nuestro) == str(publicado)
                     or (isinstance(nuestro, float) and abs(nuestro - publicado) < 0.06))
            print(u'           %s %-36s nuestro %-14s v3.0 publicó %s'
                  % (u'=' if igual else u'≠', etiq, nuestro, publicado))
            if not igual:
                malas.append(etiq)
        ok(not malas,
           u'las %d cifras que la v4 retira son EXACTAMENTE las que hoy tiene '
           u'nuestra fuente' % len(comp),
           u'o sea: la v4 cuenta bien lo que la v3.0 decía, Y nuestra fuente viva '
           u'sigue siendo la exportación TRUNCADA. El tablero sigue sirviendo los '
           u'números retirados.')
        cierra('fuente-viva-truncada',
               u'data/analisis-llamadas.json sigue con el corte truncado',
               u'%s entrantes hasta el %s (la v4 mide %s hasta el 5 nov) y %d '
               u'salientes contra 56. Mientras no se recargue, el expediente y el '
               u'tablero dicen cosas distintas de la misma cuenta.'
               % (mil(ent['total']), ent.get('hasta'), mil(TOT), sal['total']))

# ───────────────────────────────────────────────────────────────────────────────
# 6 · contra nuestras fuentes de cuenta
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'6 · CONTRA NUESTRAS FUENTES (GRC · DIDs · tickets · chat · Supabase)')


def data(nombre):
    pp = os.path.join(RAIZ, nombre)
    return json.load(io.open(pp, 'r', encoding='utf-8')) if os.path.exists(pp) else None


grc = data(os.path.join('data', 'grc-zoho.json'))
if grc is None:
    aviso(u'no se pudo leer data/grc-zoho.json — el MRR queda SIN COMPROBAR')
else:
    fil = [r for r in grc.get('filas', []) if str(r.get('cid') or '') == CID]
    tot_mrr = sum(float(r.get('mrrFin') or 0) for r in fil)
    for r in fil:
        print(u'           GRC · %s · %s · $%s · %s meses · %s%s'
              % (r.get('cliente'), r.get('clasif'), mil(r.get('mrrFin') or 0),
                 r.get('meses'), r.get('movimiento'),
                 u' · agrupada' if r.get('agrupada') else u''))
    ok(len(fil) == 2 and abs(tot_mrr - 23681.4) < 1,
       u'el MRR institucional del CID son $%s, en DOS líneas' % mil(tot_mrr),
       u'el documento publica $23,325, que es lo que valía antes del alza de '
       u'$356.40 de la línea ATC')
    if abs(tot_mrr - 23325) > 1:
        cierra('mrr-23325-desactualizado',
               u'el documento usa $23,325 y el corte vivo dice $%s' % mil(tot_mrr),
               u'desfase de $%.2f (%.2f%%). Su aritmética interna sí cuadra: '
               u'$23,325 + $10,740.10 = $34,065.10 y 46.0%%. Con la base viva serían '
               u'$%s y %.1f%%. La cifra NO se parchea: el documento es consistente '
               u'consigo mismo y el expediente lleva la vigente.'
               % (tot_mrr - 23325, (tot_mrr - 23325) * 100.0 / 23325,
                  mil(tot_mrr + 10740.10), 10740.10 * 100.0 / tot_mrr))
    ok(abs(10740.10 * 100.0 / 23325 - 46.0) < 0.1,
       u'el «46.0%» del cargo de Meta sí sale de la base que el documento usa',
       u'$10,740.10 / $23,325 = %.2f%% · 30,686 mensajes × $0.35 = $%.2f'
       % (10740.10 * 100.0 / 23325, 30686 * 0.35))

dd = data(os.path.join('data', 'dids.json'))
if dd is None:
    aviso(u'no se pudo leer data/dids.json')
else:
    nums = (dd.get('porCid') or {}).get(CID) or []
    ok(len(nums) == 21,
       u'dids.json confirma las %d líneas contratadas' % len(nums),
       u'la tabla del documento trae %d filas. Coinciden al número.' % (len(t_lin) - 1))
    # Ojo: un `'WA' in etiqueta` casa con «Price WAterhouse». La etiqueta real
    # es «WA API wh4ts», así que se pide la palabra, no la subcadena.
    wa = [n for n in nums
          if re.search(r'\bWA\b|WHATS|WH4TS', (n.get('e') or ''), re.I)]
    if wa:
        ok(True, u'una de las 21 es la de WhatsApp API',
           u'%s «%s» — el canal del cargo de Meta del apartado 09'
           % (wa[0]['n'], wa[0]['e']))

tk = None
p = os.path.join(RAIZ, 'lib', 'tickets-data.json')
if os.path.exists(p):
    tk = [r for r in json.load(io.open(p, 'r', encoding='utf-8')) if r.get('cid') == CID]
if tk is None:
    aviso(u'no se pudo leer lib/tickets-data.json')
else:
    import collections
    prod = collections.Counter(r.get('producto') for r in tk)
    fal = [r for r in tk if r.get('es_falla') == 'Si']
    mes = collections.Counter(r.get('fecha') for r in tk)
    ok(len(tk) == 40,
       u'la mesa tiene %d tickets, no los 30 de la v3.0' % len(tk),
       u'por producto: ' + u' · '.join(u'%s %d' % (k, v) for k, v in prod.most_common())
       + u' (TRES cajones, no dos). Fallas: %d, la última en %s. El mes pico es %s '
         u'con %d. La fuente sólo trae CERRADOS: «abiertos» es NO MEDIBLE.'
       % (len(fal), max(r['fecha'] for r in fal) if fal else u'—',
          mes.most_common(1)[0][0], mes.most_common(1)[0][1]))
    ok(len(fal) == 5,
       u'siguen siendo 5 fallas mientras los tickets pasaron de 30 a 40',
       u'o sea: creció la demanda de asistencia, no la de averías')

p = os.path.join(RAIZ, 'app', 'callpicker-chat', 'chat-data.ts')
if not os.path.exists(p):
    aviso(u'no se pudo leer app/callpicker-chat/chat-data.ts')
else:
    t = io.open(p, 'r', encoding='utf-8').read()
    m = re.search(r'\{[^{}]*"cid": "%s"[^{}]*\}' % CID, t)
    if not m:
        aviso(u'ODONTOPREV no tiene fila en la fuente de Chat')
    else:
        fila = json.loads(m.group(0))
        ok(fila.get('lecturaRota') is True and fila.get('mensajes') == 0,
           u'la lectura de Chat de esta cuenta está ROTA en el corte vigente',
           u'estado=%s · semaforo=%s · mensajes=%s. Último dato fiable: %s mensajes '
           u'en el corte del %s, contra una bolsa de %s. El cargo de Meta del '
           u'apartado 09 (30,686 mensajes de servicio) viene de la FACTURA: '
           u'nuestra fuente de chat no lo puede confirmar ni desmentir, y un cero '
           u'aquí no es desuso.'
           % (fila.get('estado'), fila.get('semaforo'), fila.get('mensajes'),
              mil(fila.get('respaldoMensajes') or 0), fila.get('respaldoPeriodo'),
              mil(fila.get('bolsaMensajes') or 0)))
        if fila.get('respaldoMensajes') and fila.get('bolsaMensajes'):
            r = fila['respaldoMensajes'] * 100.0 / fila['bolsaMensajes']
            ok(r > 100,
               u'el último dato fiable va al %.0f%% de la bolsa contratada' % r,
               u'%s mensajes sobre %s. El apartado 09 pregunta cuántos caben en la '
               u'ventana gratuita de Meta y no menciona que la bolsa propia va '
               u'rebasada.' % (mil(fila['respaldoMensajes']), mil(fila['bolsaMensajes'])))

try:
    env = {}
    for ln in io.open(os.path.join(RAIZ, '.env.local'), 'r', encoding='utf-8'):
        ln = ln.strip()
        if ln and not ln.startswith('#') and '=' in ln:
            k, v = ln.split('=', 1)
            env[k.strip()] = v.strip().strip('"\'')
    base = env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
    llave = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    def sb(path):
        rq = urllib.request.Request(base + '/rest/v1/' + path,
                                    headers={'apikey': llave,
                                             'Authorization': 'Bearer ' + llave})
        return json.load(urllib.request.urlopen(rq, timeout=45))

    c = sb('cuentas?select=*&cid=eq.' + CID)[0]
    ok(c['asesor'] == 'Erick', u'el asesor de la cuenta es %s' % c['asesor'])
    ok(abs(float(c['facturacion']) - 23325) < 1,
       u'`cuentas.facturacion` guarda $%s' % mil(c['facturacion']),
       u'se corrigió el 13 oct 2026 y hoy va $%.2f por debajo del GRC'
       % (23681.40 - float(c['facturacion'])))
    al = sb('alertas_episodios?select=tipo,estado,severidad_actual,cerrado_en,'
            'cierre_motivo,evidencia_actual&cuenta_id=eq.' + c['id'])
    abiertas = [a for a in al if a['estado'] == 'abierta']
    ok(len(abiertas) == 3, u'%d alertas ABIERTAS' % len(abiertas),
       u' · '.join(u'%s (%s)' % (a['tipo'], a['severidad_actual']) for a in abiertas))
    sil = [a for a in al if a['tipo'] == 'silencio_60']
    if sil and sil[0]['estado'] == 'cerrada':
        ok(True, u'`silencio_60` se CERRÓ el %s (%s)'
           % (sil[0]['cerrado_en'], sil[0]['cierre_motivo']),
           u'pero su última evidencia guardada sigue diciendo «%s». El cierre hay '
           u'que confirmarlo contra un contacto real: lo más probable es que lo '
           u'rompiera el propio cliente al reclamar el cargo de Meta.'
           % (sil[0]['evidencia_actual'] or u'')[:120])
    scm = [a for a in abiertas if a['tipo'] == 'sin_consumo_medible']
    if scm:
        ok(True, u'`sin_consumo_medible` sigue CRÍTICA y este reporte NO la cierra',
           u'la alerta mide la serie de consumo contra plan de los cortes de '
           u'facturación; el reporte mide minutos de conversación. Son dos cosas, '
           u'y el dueño de esa alerta es ingeniería, no el asesor.')
except Exception as e:
    aviso(u'no se pudo contrastar contra Supabase: %s' % e,
          u'ficha y alertas quedan SIN HACER, que no es lo mismo que estar bien.')

# ───────────────────────────────────────────────────────────────────────────────
seccion(u'7 · EL ASESOR Y LAS NOTAS')

cl = re.findall(r'\bClaudia\b', texto_html)
ok(not cl, u'el documento publicado no nombra a Claudia',
   u'aparece %d vez/veces fuera de las notas' % len(cl))
ok(len(notas) >= 5, u'el documento trae %d nota(s) de corrección visibles' % len(notas))
ok(len(marcados) >= 5, u'declara %d desfase(s) por clave' % len(marcados),
   u', '.join(sorted(marcados)))

print(u'\n   ' + u'=' * 72)
print(u'   %d aviso(s) · %d fallo(s)' % (len(avisos), len(fallos)))
if fallos:
    print(u'\n   LO QUE NO CIERRA:')
    for f in fallos:
        print(u'     · ' + f)
    print(u'\n   *** NO PUBLICAR hasta que cada línea cierre o quede declarada')
    print(u'       con palabras dentro del documento.')
    sys.exit(1)
print(u'\n   TODO LO RECALCULABLE CIERRA. Las tres tablas grandes cierran al')
print(u'   récord; los desfases que quedan están dichos dentro del documento.')
sys.exit(0)
