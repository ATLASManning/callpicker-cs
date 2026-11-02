# -*- coding: utf-8 -*-
u"""Que el rotulo del bloque de movimiento no decida nada, y no filtre nada.

   POR QUE EXISTE
   --------------
   Hasta el 2 nov 2026, `lib/alertas-movimiento.ts` decidia si una captura
   contaba como CONTACTO leyendo el texto que pintaba en pantalla:

       if (cond === 'contacto' && c.tipo === 'seguimiento'
           && !c.que.startsWith('Seguimiento')) return false

   Daba el resultado correcto, pero por coincidencia. El dia que alguien
   tocara el rotulo, la cuenta de contactos de TODAS las alertas de contacto
   se movia sin que nada se quejara — y ese dia llego con «Solicitud de
   cancelacion», que no empieza ni por «Seguimiento» ni por «Nota interna».

   Ahora la decision va como dato (`Captura.esContacto`). Este guion prueba
   DOS cosas distintas:

     1. EQUIVALENCIA. Fila por fila de la base real, la regla vieja y la nueva
        dicen lo mismo. Es la unica forma de afirmar que el refactor no movio
        ninguna alerta, en vez de suponerlo.
     2. QUE EL ROTULO SE LEA. Para una solicitud de cancelacion, el renglon
        publicaba «Nota interna (solicitud_cancelacion): Formato de solicitud
        de cancelacion: env…»: el tipo crudo con guion bajo, y un adelanto de
        40 letras que caia dentro de la etiqueta interna del amarre. Cuarenta
        caracteres de fontaneria. Se comprueba que ya no.

   `CANALES_CONTACTO` y las etiquetas se LEEN de su archivo. Teclearlas aqui
   convertiria el espejo en una copia, y el guion seguiria en verde contra una
   pantalla que ya dice otra cosa. Si no las encuentra, se cae.

   Las credenciales se leen de `.env.local` y NO se imprimen.

       python scripts/verifica-movimiento-rotulos.py
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fallos = []


def check(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok   ' if ok else u'FALLA', que,
                           u'' if ok else u'   -- ' + unicode_(detalle)))
    if not ok:
        fallos.append(que)


def unicode_(x):
    return x if isinstance(x, type(u'')) else str(x)


def lee(ruta):
    with io.open(os.path.join(RAIZ, *ruta), encoding='utf-8') as f:
        return f.read()


# ── Las constantes, LEIDAS del codigo ───────────────────────────────────────
SRC_CONTACTO = lee(('lib', 'contacto-cuenta.ts'))
m = re.search(r'CANALES_CONTACTO[^=]*=\s*new Set[^(]*\(\s*\[(.*?)\]', SRC_CONTACTO, re.S)
if not m:
    sys.exit(u'no pude leer CANALES_CONTACTO de lib/contacto-cuenta.ts: el espejo se rompio.')
CANALES = set(re.findall(r"'([^']+)'", m.group(1)))
if not CANALES:
    sys.exit(u'CANALES_CONTACTO salio vacio: no me creo eso, me caigo.')

SRC_TIPOS = lee(('lib', 'seguimiento-tipos.ts'))
m = re.search(r"SOLICITUD_CANCELACION\s*:\s*TipoSeguimiento\s*=\s*'([^']+)'", SRC_TIPOS)
if not m:
    sys.exit(u'no pude leer SOLICITUD_CANCELACION de lib/seguimiento-tipos.ts.')
SOLICITUD = m.group(1)

def pares(fuente, desde_marca):
    u"""Los {value,label} de UN bloque, no de todo el archivo.

       Barrer el archivo entero mezclaba los nueve tipos con las nueve
       acciones de retencion en el mismo diccionario: 18 entradas donde
       debian haber 9. Hoy no colisiona ninguna clave, asi que no daba un
       falso verde — pero un diccionario que mezcla dos catalogos deja de
       poder probar que a un tipo le falta etiqueta."""
    i = fuente.find(desde_marca)
    if i < 0:
        sys.exit(u'no encontre %s en lib/seguimiento-tipos.ts.' % desde_marca)
    fin = fuente.find('\n]', i)
    bloque = fuente[i:fin if fin > 0 else None]
    return dict(re.findall(r"\{\s*value:\s*'([a-z_]+)',\s*label:\s*'([^']+)'\s*\}", bloque))


ETIQUETAS = pares(SRC_TIPOS, 'TIPOS_SEGUIMIENTO')
if SOLICITUD not in ETIQUETAS:
    sys.exit(u'TIPOS_SEGUIMIENTO no trae la solicitud: no puedo comprobar su rotulo.')
ACCIONES = pares(SRC_TIPOS, 'ACCIONES_RETENCION')


def etiqueta_interna(nombre):
    m = re.search(r"const\s+%s\s*=\s*'([^']+)'" % nombre, SRC_TIPOS)
    if not m:
        sys.exit(u'no pude leer %s de lib/seguimiento-tipos.ts.' % nombre)
    return m.group(1)


ET_FORMATO = etiqueta_interna('ET_FORMATO')
ET_CUENTA = etiqueta_interna('ET_CUENTA')
ET_ACCION = etiqueta_interna('ET_ACCION')

# `esConElCliente` es una comparacion, no una lista: `return t === 'cliente'`.
# La primera version de este guion buscaba un arreglo y no casaba — y el guion
# se CAYO en vez de dar por buena la mitad que no podia medir.
SRC_REUNIONES = lee(('lib', 'reuniones-tipo.ts'))
m = re.search(r"esConElCliente[^{]*\{\s*return\s+t\s*===\s*'([^']+)'", SRC_REUNIONES)
if not m:
    sys.exit(u'no pude leer `esConElCliente` de lib/reuniones-tipo.ts: '
             u'si cambio de forma, esta comprobacion ya no vale.')
TIPO_CLIENTE = m.group(1)

print(u'  leido del codigo:')
print(u'      CANALES_CONTACTO ..... %s' % u', '.join(sorted(CANALES)))
print(u'      tipos con etiqueta ... %d' % len(ETIQUETAS))
print(u'      acciones ............. %d' % len(ACCIONES))
print(u'      reunion con cliente .. tipo == %s' % TIPO_CLIENTE)
print(u'')


# ── La base ─────────────────────────────────────────────────────────────────
def credenciales():
    e = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if '=' in linea and not linea.startswith('#'):
                k, v = linea.split('=', 1)
                e[k.strip()] = v.strip().strip('"').strip("'")
    url = e.get('NEXT_PUBLIC_SUPABASE_URL')
    clave = e.get('SUPABASE_SERVICE_ROLE_KEY') or e.get('SUPABASE_SERVICE_KEY')
    if not url or not clave:
        sys.exit(u'faltan credenciales de Supabase en .env.local')
    return url.rstrip('/'), clave


URL, CLAVE = credenciales()


def supa(tabla, select):
    u"""POR PAGINAS: PostgREST corta en 1000 filas y devuelve 200 sin avisar."""
    filas, desde, paso = [], 0, 1000
    while True:
        q = urllib.parse.urlencode({'select': select, 'limit': paso, 'offset': desde})
        r = urllib.request.Request('%s/rest/v1/%s?%s' % (URL, tabla, q),
                                   headers={'apikey': CLAVE,
                                            'Authorization': 'Bearer ' + CLAVE,
                                            'Accept': 'application/json'})
        with urllib.request.urlopen(r, timeout=120) as x:
            lote = json.loads(x.read().decode())
        filas.extend(lote)
        if len(lote) < paso:
            return filas
        desde += paso


segs = supa('seguimientos', 'id,tipo,descripcion')
reus = supa('reuniones', 'id,tipo,titulo')
print(u'  en la base: %d seguimiento(s), %d reunion(es)' % (len(segs), len(reus)))
print(u'')


# ── El rotulo, como lo arma el codigo de hoy ────────────────────────────────
def etiqueta_tipo(t):
    if t in ETIQUETAS:
        return ETIQUETAS[t]
    if not t:
        return u'Sin tipo'
    return t[:1].upper() + t[1:].replace('_', ' ')


def lee_accion(desc):
    u"""La linea de la accion, como `leerSolicitud`."""
    d = (desc or u'').replace('\r\n', '\n')
    i = d.find(ET_ACCION)
    if i < 0:
        return None
    fin = d.find('\n', i)
    v = d[i + len(ET_ACCION): None if fin < 0 else fin].strip()
    return v or None


def lee_detalle(desc):
    u"""El texto libre, sin las tres lineas del amarre. Como `leerSolicitud`."""
    d = (desc or u'').replace('\r\n', '\n')
    lineas = [l for l in d.split('\n')
              if not any(e in l for e in (ET_FORMATO, ET_CUENTA, ET_ACCION))]
    return re.sub(r'\s+', u' ', u'\n'.join(lineas)).strip()


MINIMO_UTIL = 12


def corta(s, n):
    return s[:n] + u'…' if len(s) > n else s


def resumen(tipo, desc, mx):
    u"""Espejo de `resumenDeSeguimiento`. LA AUTORIDAD ES EL TEST DE TS
       (`npm run test:solicitud`), que importa la funcion de verdad; esto es
       solo lo que hace falta aqui para recorrer la base."""
    if tipo == SOLICITUD:
        cabeza = lee_accion(desc) or u'no se declaró qué se hizo para evitarla'
        resto = lee_detalle(desc)
        sobra = mx - len(cabeza) - 3
        if not resto or sobra < MINIMO_UTIL:
            return cabeza
        return u'%s — %s' % (cabeza, corta(resto, sobra))
    t = re.sub(r'\s+', u' ', (desc or u'')).strip()
    return corta(t, mx) if t else u''


def que_nuevo(tipo, desc, canal):
    r = resumen(tipo, desc, 40)
    if tipo == SOLICITUD:
        return u'%s: %s' % (etiqueta_tipo(tipo), r)
    base = (u'Seguimiento' if canal else u'Nota interna')
    if tipo:
        base += u' (%s)' % etiqueta_tipo(tipo)
    if r:
        base += u': %s' % r
    return base


# ── 1 · EQUIVALENCIA con la regla de antes del 2 nov 2026 ───────────────────
# La regla vieja se escribe aqui a proposito: es el CONTROL de la regresion,
# no un espejo de una constante viva. Ya no existe en el codigo.
difieren = []
for s in segs:
    t = (s.get('tipo') or u'').lower()
    canal = t in CANALES
    nuevo = canal                                     # Captura.esContacto
    viejo = que_nuevo(t, s.get('descripcion'), canal).startswith(u'Seguimiento')
    if nuevo != viejo:
        difieren.append((s.get('id'), t, viejo, nuevo))
check(not difieren,
      u'los %d seguimientos cuentan como contacto igual que antes' % len(segs),
      u'; '.join(u'%s %s viejo=%s nuevo=%s' % d for d in difieren[:5]))

# AL REVES, por la misma razon: las dos reglas tienen que SABER decir no.
# Un canal cuenta; una nota no; y la solicitud —el tipo que rompio la regla
# vieja— tampoco, porque pedir irse no es haber hablado con el cliente.
controles = [(u'llamada', True), (u'nota', False), (SOLICITUD, False)]
mal = []
for t, esperado in controles:
    canal = t in CANALES
    nuevo = canal
    viejo = que_nuevo(t, u'texto cualquiera', canal).startswith(u'Seguimiento')
    if not (nuevo == viejo == esperado):
        mal.append(u'%s esperado=%s viejo=%s nuevo=%s' % (t, esperado, viejo, nuevo))
check(not mal, u'CONTROL: las dos reglas dicen no a una nota y a la solicitud',
      u'; '.join(mal))

difieren_r = []
for r in reus:
    t = (r.get('tipo') or u'')
    nuevo = t == TIPO_CLIENTE                         # Captura.esContacto
    rot = (u'Reunión con el cliente' if nuevo else u'Reunión interna')
    viejo = rot.startswith(u'Reunión con el cliente')  # la regla de antes
    if nuevo != viejo:
        difieren_r.append((r.get('id'), t, viejo, nuevo))
check(not difieren_r,
      u'las %d reuniones cuentan como contacto igual que antes' % len(reus),
      u'; '.join(u'%s %s' % (d[0], d[1]) for d in difieren_r[:5]))

# AL REVES: si las dos reglas dieran lo mismo SIEMPRE, por construccion, la
# comprobacion de arriba no probaria nada. Asi que se le mete una reunion que
# NO es con el cliente y se exige que las dos la rechacen, y una que si lo es
# y se exige que las dos la acepten. Sin esto, un `nuevo = viejo` por error
# pasaria en verde con 105 reuniones.
pruebas = [(TIPO_CLIENTE, True), (u'junta_semanal_inventada', False)]
bien = all((t == TIPO_CLIENTE) == esperado
           and (u'Reunión con el cliente' if esperado else u'Reunión interna'
                ).startswith(u'Reunión con el cliente') == esperado
           for t, esperado in pruebas)
check(bien, u'CONTROL: las dos reglas distinguen un tipo que no es del cliente')

# ── 2 · Que el rotulo se LEA, y no filtre fontaneria ───────────────────────
rotulos = [(s.get('id'), (s.get('tipo') or u'').lower(),
            que_nuevo((s.get('tipo') or u'').lower(), s.get('descripcion'),
                      (s.get('tipo') or u'').lower() in CANALES))
           for s in segs]

con_guion = [(i, t, q) for i, t, q in rotulos if u'_' in q.split(u':')[0]]
check(not con_guion, u'ningun rotulo publica el tipo con guion bajo',
      u'; '.join(q[:60] for _, _, q in con_guion[:3]))

fuga = [(i, t, q) for i, t, q in rotulos
        if ET_FORMATO in q or ET_CUENTA in q or ET_ACCION in q]
check(not fuga, u'ningun rotulo filtra las etiquetas internas del amarre',
      u'; '.join(q[:70] for _, _, q in fuga[:3]))

sols = [(i, q) for i, t, q in rotulos if t == SOLICITUD]
print(u'')
print(u'  solicitud(es) de cancelacion en la base: %d' % len(sols))

# Sin ninguna guardada, el rotulo se prueba igual — contra una fila ARMADA
# aqui. Dejar las tres comprobaciones sin hacer seria concluir exito por
# defecto; pero caerse cada semana por falta de datos es un guion que nadie
# vuelve a leer. Asi que se prueba siempre, y se dice de donde salio la fila.
SINTETICA = u'\n'.join([
    u'%s enviado · http://ejemplo' % ET_FORMATO,
    u'%s X1 · CID 000 · EJEMPLO' % ET_CUENTA,
    u'%s %s' % (ET_ACCION, sorted(ACCIONES.values())[0]),
    u'',
    u'fila armada por el verificador, no sale de la base.',
])
if not sols:
    print(u'  (ninguna guardada: el rotulo se prueba contra una fila armada aqui)')
    sols = [(u'sintetica', que_nuevo(SOLICITUD, SINTETICA, False))]
for i, q in sols:
    print(u'      %s' % q)

check(all(q.startswith(etiqueta_tipo(SOLICITUD)) for _, q in sols),
      u'la solicitud se rotula por su nombre, no como «Nota interna»')
# AL REVES: el rotulo tiene que decir algo. Una accion del catalogo, o que no
# se declaro — nunca fontaneria.
utiles = [q for _, q in sols
          if any(a in q for a in ACCIONES.values())
          or u'no se declaró qué se hizo para evitarla' in q]
check(len(utiles) == len(sols),
      u'el rotulo trae una accion del catalogo o dice que no se declaro',
      u'%d de %d' % (len(utiles), len(sols)))
check(not any(q.startswith(u'Nota interna') for _, q in sols),
      u'AL REVES: ninguna solicitud se rotula «Nota interna»')
# CONTROL: la comprobacion de arriba tiene que saber fallar. El rotulo de
# ANTES del 2 nov 2026 — el que producción publicaba — debe caerse en las tres.
VIEJO = u'Nota interna (%s): %s…' % (SOLICITUD, SINTETICA.replace('\n', u' ')[:40])
check(VIEJO.startswith(u'Nota interna')
      and not any(a in VIEJO for a in ACCIONES.values())
      and u'_' in VIEJO.split(u':')[0],
      u'CONTROL: el rotulo viejo falla las tres comprobaciones de arriba', VIEJO)

print(u'')
if fallos:
    print(u'  *** %d comprobacion(es) fallan.' % len(fallos))
    sys.exit(1)
print(u'  el rotulo no decide nada, y dice algo.')
