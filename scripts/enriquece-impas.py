# -*- coding: utf-8 -*-
u"""Escribe en la ficha de IMPAS (Z63) lo que dirección investigó.

   POR QUE EXISTE
   --------------
   Direccion compilo el 13 oct 2026 la ficha institucional del organismo —del
   sitio del Municipio de Chihuahua— y pidio DOS cosas: «colocar en la cuenta»
   esa informacion, y hacer la auditoria. Yo hice la segunda y me salte la
   primera: el expediente quedo escrito y la ficha de la cuenta siguio igual,
   con el director equivocado, el telefono en ceros y la facturacion en $0.

   Una auditoria que vive solo en su propio modulo no sirve de nada al asesor
   que abre la cuenta. El dato tiene que estar DONDE se trabaja.

   LO QUE CAMBIA, Y DE DONDE SALE CADA COSA
   ----------------------------------------
     facturacion      $0 -> $65,640   del GRC por CID, y cuadra al centavo con
                                      lo contratado ($63,450 + $2,190)
     contacto_*       Erick Lucero -> Dr. Luis Antonio Arrieta Trevizo, que es
                                      quien el directorio municipal nombra como
                                      director general. El telefono estaba en
                                      «0000000000».
     contactos_json   2 -> 15         los 14 del directorio publico + el
                                      contratante que ya estaba
     num_oficinas     vacio -> 8      las ubicaciones de referencia
     giro             se precisa a gobierno municipal / salud publica
     notas            se reescriben con el contexto real del organismo
     observaciones_kam  se le AÑADE un addendum fechado; NO se borra lo que
                        escribio el asesor, que es su registro

   LO QUE **NO** SE ESCRIBE, Y ES DELIBERADO
   -----------------------------------------
     · `total_empleados` y `tamano_empresa` se quedan VACIOS. La propia
       investigacion dice que el personal total «no esta identificado
       publicamente con suficiente certeza». Un hueco marcado es mejor que una
       estimacion que luego alguien cita como dato. [[feedback-cero-sin-medicion]]
     · Los CORREOS de los 12 funcionarios que el directorio publica SIN correo
       no se construyen por patron, aunque el patron sea evidente
       (nombre.apellido@mpiochih.gob.mx). Solo van los DOS verificados.
       [[feedback-servicios-no-inferir]]
     · `num_oficinas = 8` lleva su reserva escrita en las notas: es una cifra
       «de referencia», no un inventario certificado.

   USO
       python scripts/enriquece-impas.py              # SIMULACRO (por omision)
       python scripts/enriquece-impas.py --aplica
"""
import io
import os
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APLICA = '--aplica' in sys.argv
CONS = 'Z63'


def env(c):
    for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        l = l.strip()
        if l.startswith(c + '='):
            return l.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
       'Content-Type': 'application/json', 'Prefer': 'return=representation'}

# ── EL DIRECTORIO PUBLICO DEL ORGANISMO ──────────────────────────────────────
# Conmutador (614) 200-4800. Solo DOS correos estan publicados; los demas van
# sin correo a proposito — ver la nota de arriba.
EXT = u'(614) 200-4800 ext. %s'
DIRECTORIO = [
    (u'Dr. Luis Antonio Arrieta Trevizo',        u'Director general',
     u'2264', u'antonio.arrieta@mpiochih.gob.mx'),
    (u'C.P. Miguel de los Santos Arévalo',       u'Subdirector administrativo — DECISOR de contratación y presupuesto',
     u'2255', u'miguel.delossantos@mpiochih.gob.mx'),
    (u'Mtro. Jaime Omar Bustillos Villalobos',   u'Secretario técnico',                      u'2380', u''),
    (u'Lic. Luisa Fernanda Fuentes Luévano',     u'Asesoría jurídica',                       u'2268', u''),
    (u'C.P. Yesica Flores Lugo',                 u'Coordinadora administrativa',             u'2253', u''),
    (u'Lic. Liliana Gutiérrez Nava',             u'Coordinadora administrativa',             u'2275', u''),
    (u'Lic. Lizet Alejandra Echavarría Delgado', u'Coordinadora administrativa',             u'2386', u''),
    (u'Lic. Braulio Gutiérrez Chávez',           u'Coordinador administrativo',              u'2383', u''),
    (u'Dr. Luis Carlos Esquivel Ruiz',           u'Subdirector de Promoción y Atención a la Salud', u'2258', u''),
    (u'Dra. Elsa Britsel Bojórquez Chaparro',    u'Coordinadora',                            u'2279', u''),
    (u'Dr. Rodrigo Contreras Juvenal',           u'Coordinador',                             u'2251', u''),
    (u'Dr. Fernando Israel Ponce Ramírez',       u'Subdirector de Rehabilitación',           u'2389', u''),
    (u'Mtra. Diana Marcela de las Casas Martínez',
     u'Subdirectora de Salud Mental — OJO: una versión anterior del directorio nombra a César Iván Ruíz Varela. Confirmar antes de tratarla como decisora.',
     u'2277', u''),
    (u'Mtra. Gabriela Lacombre Heredia',         u'Coordinadora de Salud Mental',            u'2271', u''),
]

CONTACTOS = [{'nombre': n, 'cargo': c, 'tel': EXT % e, 'email': m}
             for n, c, e, m in DIRECTORIO]
# El contratante que ya estaba en la ficha: se CONSERVA. Es la unica via que
# alguna vez funciono y forma parte del historial de la cuenta.
CONTACTOS.append({
    'nombre': u'Luis Álvarez', 'cargo': u'Contratante (histórico) — no responde correos desde sep 2026',
    'tel': u'614 132 2909', 'email': u'luisalvarez21@yahoo.com.mx',
})

NOTAS = (
    u'Instituto Municipal de Prevención y Atención a la Salud (IMPAS). Organismo '
    u'público DESCENTRALIZADO del Municipio de Chihuahua, creado por acuerdo '
    u'municipal en noviembre de 2021. Da consulta médica y dental, salud mental, '
    u'rehabilitación física/ocupacional/de lenguaje, salud metabólica y una línea '
    u'de atención a crisis 24/7 (*800 «Hablar Salva Vidas»).\n\n'
    u'ESTRUCTURA: 8 ubicaciones DE REFERENCIA —no es un inventario certificado—: '
    u'4 sedes (Calle Cuarta 2007 · Calle Sexta 408 Salud Mental · Clínica '
    u'Metabólica Av. Independencia 2013 · Gimnasio Adaptado El Palomar), 3 '
    u'Unidades Básicas de Rehabilitación con teléfono PROPIO publicado (UBR La '
    u'Esperanza 614 434 4065 · UBR Nombre de Dios 614 424 5194 · UBR Villa Juárez '
    u'614 446 0586, de un comunicado de oct 2024: confirmar que sigan operativos) '
    u'y 1 Centro Municipal de Equinoterapia. Las clínicas Chanita, Lupita y Dr. '
    u'Pedro Leal son COLABORADORAS por convenio, NO oficinas del IMPAS.\n\n'
    u'TELEFONÍA: conmutador (614) 200-4800 y línea municipal 072 (ext. 2259, 2260, '
    u'2261). En sep 2026 el Municipio publicó el 072 ext. 5495 para agendar '
    u'consultas dentales, 8:00–18:00 — o sea que hay FLUJOS DIFERENCIADOS por '
    u'servicio. Horario administrativo publicado: L–V 8:00–15:00.\n\n'
    u'NO MEDIDO (y no se estima): personal total y presupuesto vigente no están '
    u'validados documentalmente en ninguna fuente pública.\n\n'
    u'Investigación institucional de dirección, 13 oct 2026. Fuentes: '
    u'impas.mpiochih.gob.mx y el directorio de municipiochihuahua.gob.mx.'
)

ADDENDUM = (
    u'\n\n─── ACTUALIZACIÓN 13 oct 2026 (auditoría Z63) ───\n'
    u'Lo de arriba queda como registro de lo que se sabía entonces, y tres de sus '
    u'afirmaciones ya están desmentidas:\n\n'
    u'1) «No cuenta con un número Callpicker asignado ni con extensiones '
    u'configuradas»: la cuenta paga $63,450 al mes por un número de Marcación '
    u'Corta (el 072 del Municipio) y el Ayuntamiento publica 14 extensiones en el '
    u'rango 2251–2389, más la 5495 que abrió en septiembre para citas dentales.\n\n'
    u'2) «No se identificó presencia relevante en LinkedIn»: el cliente es una '
    u'dependencia de gobierno. Su directorio es información pública y está '
    u'publicado con nombre, cargo, correo institucional y extensión. Ya está '
    u'capturado en los contactos de esta ficha. Para gobierno, el directorio '
    u'oficial es la fuente, no LinkedIn.\n\n'
    u'3) «Todas las llamadas aparecen con estatus de perdidas»: el tablero dice '
    u'0% sin contestar. Las dos lecturas son del mismo dato: de 352 llamadas, las '
    u'352 las contestó el MENÚ y NINGUNA llegó a una persona, con cero minutos de '
    u'conversación. El indicador cuenta la llamada como contestada porque contestó '
    u'la máquina.\n\n'
    u'PENDIENTE QUE VA ANTES QUE TODO: confirmar si la línea de crisis 24/7 '
    u'«Hablar Salva Vidas» viaja sobre este servicio. No suponerlo en ninguna '
    u'dirección.\n'
    u'Y ojo: no hay una sola llamada registrada desde el 21 ene 2026 ni un mes con '
    u'dato de consumo, en una cuenta de $65,640 al mes.'
)

CAMBIOS = {
    'facturacion': 65640.0,
    'contacto_nombre': u'Dr. Luis Antonio Arrieta Trevizo',
    'contacto_cargo': u'Director general',
    'contacto_email': u'antonio.arrieta@mpiochih.gob.mx',
    'contacto_tel': EXT % u'2264',
    'contactos_json': CONTACTOS,
    'num_oficinas': 8,
    'giro': u'Gobierno municipal — salud pública (organismo público descentralizado)',
    'notas': NOTAS,
}


def trae(ruta):
    r = urllib.request.Request(URL + '/rest/v1/' + ruta, headers=CAB)
    return json.loads(urllib.request.urlopen(r, timeout=90).read().decode('utf-8'))


fila = trae('cuentas?select=*&consecutivo=eq.' + CONS)
if not fila:
    print(u'  *** no encontre el consecutivo %s' % CONS)
    sys.exit(1)
c = fila[0]
print(u'\n  ══ %s · %s ══' % (CONS, c.get('empresa')))
print(u'  id %s · CID %s\n' % (c['id'], c.get('cid')))

# `observaciones_kam` se ARMA aqui porque depende de lo que ya hay: se le añade
# el addendum una sola vez, y nunca se pisa lo que escribio el asesor.
kam = (c.get('observaciones_kam') or u'').rstrip()
if u'ACTUALIZACIÓN 13 oct 2026' in kam:
    print(u'  el addendum de observaciones_kam YA ESTA puesto: no se repite.\n')
else:
    CAMBIOS['observaciones_kam'] = kam + ADDENDUM


def corto(v, n=118):
    s = json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else str(v)
    s = s.replace('\n', ' ⏎ ')
    return s[:n] + (u' …' if len(s) > n else u'')


def igual(a, b):
    u"""¿Es lo mismo lo que hay en la base que lo que quiero escribir?

       NO se comparan los JSON en crudo. `num_oficinas` es una columna de
       TEXTO: mando 8 y vuelve '8'. Con la comparacion estricta, (a) el
       verificador declaraba «NO COINCIDE» sobre una escritura que SI habia
       funcionado, y (b) el guion no era idempotente — cada corrida volvia a
       escribir ese campo por un cambio que no existia.

       **Un verificador que grita sobre un exito se desactiva igual de rapido
       que uno que calla sobre un fallo.** [[feedback-verificar-antes-asegurar]]

       Listas y diccionarios se comparan estructuralmente; los escalares, por
       su representacion de texto, que es lo que la columna guarda.
    """
    if isinstance(a, (list, dict)) or isinstance(b, (list, dict)):
        return json.dumps(a, ensure_ascii=False, sort_keys=True) == \
               json.dumps(b, ensure_ascii=False, sort_keys=True)
    if a is None or b is None:
        return a is None and b is None
    if isinstance(a, float) or isinstance(b, float):
        try:
            return abs(float(a) - float(b)) < 0.005
        except (TypeError, ValueError):
            pass
    return str(a) == str(b)


print(u'  ══ LO QUE CAMBIA ══════════════════════════════════════════')
reales = {}
for k, nuevo in CAMBIOS.items():
    viejo = c.get(k)
    if igual(viejo, nuevo):
        print(u'  %-18s SIN CAMBIO' % k)
        continue
    reales[k] = nuevo
    print(u'  %s' % k)
    print(u'      antes: %s' % corto(viejo))
    print(u'      ahora: %s' % corto(nuevo))

print(u'\n  ══ LO QUE **NO** SE TOCA, A PROPOSITO ═════════════════════')
for k, por_que in ((u'total_empleados', u'el personal total NO esta validado publicamente'),
                   (u'tamano_empresa', u'se deriva del personal, que no se sabe'),
                   (u'servicio / servicios_json', u'ya son correctos y detallados'),
                   (u'direccion_fiscal', u'coincide con la sede publicada'),
                   (u'estado / activo_desde', u'no son parte de esta correccion')):
    print(u'  %-26s %s' % (k, por_que))
print(u'\n  Y los correos de los 12 funcionarios sin correo publicado NO se')
print(u'  construyen por patron, aunque el patron se vea: solo van los 2')
print(u'  verificados en el directorio.')

if not reales:
    print(u'\n  nada que escribir.')
    sys.exit(0)

if not APLICA:
    print(u'\n  ══ SIMULACRO — no se escribio nada ════════════════════════')
    print(u'  %d campo(s) listos. Para aplicar:' % len(reales))
    print(u'      python scripts/enriquece-impas.py --aplica')
    sys.exit(0)

req = urllib.request.Request(
    URL + '/rest/v1/cuentas?consecutivo=eq.' + CONS,
    data=json.dumps(reales, ensure_ascii=False).encode('utf-8'),
    headers=CAB, method='PATCH')
res = json.loads(urllib.request.urlopen(req, timeout=90).read().decode('utf-8'))
print(u'\n  ══ APLICADO ═══════════════════════════════════════════════')
print(u'  %d fila(s) actualizadas.' % len(res))

# COMPROBAR DESPUES DE APLICAR, leyendo de vuelta. Un PATCH que devuelve 200 no
# prueba que haya escrito lo que yo creo. [[feedback-verificar-antes-asegurar]]
v = trae('cuentas?select=*&consecutivo=eq.' + CONS)[0]
fallos = []
for k, esperado in reales.items():
    real = v.get(k)
    ok = igual(real, esperado)
    if not ok:
        fallos.append(k)
    nota = u''
    if ok and type(real) is not type(esperado):
        nota = u'  (la columna es %s, no %s — se guardo igual)' % (
            type(real).__name__, type(esperado).__name__)
    print(u'  %-20s %s%s' % (k, u'OK' if ok else u'** NO COINCIDE', nota))
print(u'\n  contactos en la ficha: %d' % len(v.get('contactos_json') or []))
print(u'  %s' % (u'todo escrito y comprobado.' if not fallos
                 else u'*** NO coinciden: %s' % u', '.join(fallos)))
sys.exit(1 if fallos else 0)
