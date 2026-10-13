# -*- coding: utf-8 -*-
u"""Escribe en la ficha de ODONTOPREV (C13) lo que direccion investigo.

   Mismo patron que `enriquece-impas.py`: SIMULACRO por omision, enseña campo
   por campo el antes y el ahora, y tras aplicar LEE DE VUELTA. Un PATCH que
   devuelve 200 no prueba que haya escrito lo que uno cree.

   LO QUE LA INVESTIGACION RESOLVIO, Y NO ES POCO
   ----------------------------------------------
   La ficha decia «pequeño-mediano, entre 11 y 50 empleados» y eso chocaba con
   76,385 llamadas entrantes y 11,083 horas de conversacion. Parecia que el
   tamaño estaba mal capturado. **No lo estaba**: OdontoPrev es una aseguradora
   que administra coberturas a traves de una RED DE PRESTADORES, no una cadena
   de clinicas. Plantilla chica, operacion enorme — 1 millon de asegurados y
   320 clientes corporativos. La contradiccion era mia, no de la ficha.

   Y explico los destinos de llamadas: entro a Mexico en 2015 en joint venture
   con Grupo IKE, y `CAT GENERAL ODONTOPREV IKE` es el segundo destino mas
   grande. Los demas —Bradescard, Zurich Santander, OCESA, Welbe— son clientes
   corporativos, o sea parte de esos 320.

   LO QUE **NO** SE ESCRIBE, Y ES DELIBERADO
   -----------------------------------------
     · El vinculo con **Bradesco** que la ficha afirmaba NO se da por bueno: la
       investigacion identifica como matriz a Odontoprev Brasil y como alianza
       de entrada a Grupo IKE, sin mencionarlo. Se reescribe como lo que SI se
       puede sostener, y se anota aparte lo que si esta MEDIDO: que Bradescard
       es su mayor destino de llamadas. Una cosa es la estructura societaria y
       otra la relacion comercial. [[feedback-servicios-no-inferir]]
     · Los cargos marcados «vigencia por confirmar» en la investigacion entran
       CON esa marca, no como hechos.
     · No se inventa un responsable de telefonia: la investigacion dice
       explicitamente que no identifico ninguno, y nuestro unico contacto
       declaro el 22 jul que ya no participa en la operacion. Ese hueco se
       escribe con palabras.

   USO
       python scripts/enriquece-odontoprev.py            # SIMULACRO
       python scripts/enriquece-odontoprev.py --aplica
"""
import io
import os
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APLICA = '--aplica' in sys.argv
CONS = 'C13'


def env(c):
    for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        l = l.strip()
        if l.startswith(c + '='):
            return l.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
       'Content-Type': 'application/json', 'Prefer': 'return=representation'}

CONTACTOS = [
    {'nombre': u'Oscar Guillermo Cisneros Linares',
     'cargo': u'Líder de Operaciones CAT — OJO: el 22 jul 2026 declaró que YA NO participa de forma directa en la operación. Sigue siendo el único contacto que nos ha respondido.',
     'tel': u'55 7112 6459', 'email': u'olinares@odontoprev.com.mx'},
    {'nombre': u'Mércia Leite Nagem',
     'cargo': u'CEO / Directora General México — identificada públicamente por la Cámara México-Brasil (2026). Sin teléfono ni correo público verificable.',
     'tel': u'', 'email': u''},
    {'nombre': u'Maria Fernanda Lechón Moreno',
     'cargo': u'Gerente de Recursos Humanos — cargo publicado en una vacante corporativa, VIGENCIA POR CONFIRMAR',
     'tel': u'', 'email': u''},
    {'nombre': u'Elsen Carvalho',
     'cargo': u'Presidente de Odontoprev Brasil (matriz) — nombramiento anunciado en 2024, estructura actual por verificar',
     'tel': u'', 'email': u''},
    {'nombre': u'Centro de atención (institucional)',
     'cargo': u'Número publicado en el directorio de la AMIS',
     'tel': u'55 5480 0911', 'email': u''},
    {'nombre': u'Conmutador corporativo (institucional)',
     'cargo': u'Directorio comercial — VIGENCIA POR COMPROBAR',
     'tel': u'55 5080 0200', 'email': u''},
    {'nombre': u'Teléfono alterno (institucional)',
     'cargo': u'Directorio comercial — VIGENCIA POR COMPROBAR',
     'tel': u'55 5480 0777', 'email': u''},
    {'nombre': u'RESPONSABLE DE TELEFONÍA',
     'cargo': u'SIN IDENTIFICAR. Ni la investigación pública ni nuestra ficha tienen un CIO, gerente de infraestructura o responsable de telefonía. Es el hueco que hay que cerrar: es quien decide sobre este servicio.',
     'tel': u'', 'email': u''},
]

NOTAS = (
    u'OdontoPrev México · razón social **Odontored Seguros Dentales, S.A. de C.V.** '
    u'Aseguradora de salud dental (seguros colectivos y planes B2B/B2C). Inició '
    u'operaciones en México en 2015, de la mano de su matriz brasileña Odontoprev, '
    u'mediante JOINT VENTURE CON GRUPO IKÉ.\n\n'
    u'TAMAÑO — Y OJO CON LEERLO MAL: la plantilla en México son 11–50 empleados '
    u'(LinkedIn), pero la OPERACIÓN es grande: ~1 millón de asegurados y 320 '
    u'clientes corporativos. El grupo global ronda los 2,000 colaboradores. '
    u'**NO es una cadena de clínicas propias**: administra coberturas a través de '
    u'una red de odontólogos afiliados, y una red de prestadores NO equivale a '
    u'sucursales. Por eso una plantilla chica mueve 76,385 llamadas y 11,083 '
    u'horas de conversación al periodo.\n\n'
    u'SEDE — Una sola oficina corporativa: Av. Paseo de la Reforma 373, Piso 11, '
    u'Col. Cuauhtémoc, C.P. 06500, CDMX. No se identificó un directorio público '
    u'verificable de sucursales comerciales. La Cámara México-Brasil mencionó en '
    u'2026 planes de expansión comercial en Querétaro, Guanajuato y Nuevo León, '
    u'pero NO confirma apertura de oficinas físicas.\n\n'
    u'TELÉFONOS PÚBLICOS — 55 5480 0911 (directorio AMIS) · 55 5080 0200 y '
    u'55 5480 0777 (directorios comerciales, vigencia por comprobar).\n\n'
    u'GRUPO — La matriz es Odontoprev Brasil. El vínculo con Bradesco que esta '
    u'ficha afirmaba NO está confirmado por la investigación, así que se deja '
    u'como pendiente de verificar. Lo que SÍ está medido es otra cosa y es '
    u'importante: **Bradescard es su mayor destino de llamadas** —17,960 al '
    u'periodo, 222,233 minutos—, o sea que la relación COMERCIAL con el grupo '
    u'Bradesco es real aunque la societaria esté sin confirmar.\n\n'
    u'Investigación institucional de dirección, 13 oct 2026. Fuentes: CNSF, AMIS, '
    u'Cámara México-Brasil, LinkedIn y odontoprev.com.mx.'
)

ADDENDUM = (
    u'\n\n─── ACTUALIZACIÓN 13 oct 2026 (auditoría C13) ───\n'
    u'QUIÉN DECIDE AQUÍ SIGUE SIN SABERSE, Y ES EL PENDIENTE PRINCIPAL. El único '
    u'contacto que nos ha respondido —Guillermo Cisneros, Líder de Operaciones '
    u'CAT— nos dijo el 22 de julio que «actualmente no participa de forma directa '
    u'en la operación» y que validaría con su equipo. No hubo retroalimentación '
    u'posterior, y van 83 días de silencio. La investigación pública tampoco '
    u'identifica un responsable de telefonía. Hay CEO con nombre (Mércia Leite '
    u'Nagem) pero sin vía de contacto verificable.\n\n'
    u'EL SERVICIO DE VOZ VA BIEN Y MEJORANDO: la pérdida pasó de 5.0% en enero a '
    u'1.9% en agosto, y el mes cerrado está 1.58 puntos POR DEBAJO de su propia '
    u'base — 163 llamadas perdidas MENOS de lo normal. Las líneas de negocio '
    u'están impecables: Bradescard 0.5%, CAT IKÉ 1.5%.\n\n'
    u'PERO LA MITAD DE LAS PÉRDIDAS CABEN EN TRES DESTINOS QUE SON EL 1.92% DEL '
    u'VOLUMEN: «Rojas Chávez Carlos Alberto Octaviano» pierde 918 de 1,009 '
    u'(91.0%), «(sin destino registrado)» 322 de 450 (71.6%) y «WELBE» 7 de 8. '
    u'Entre los tres, 1,247 de las 2,420 pérdidas totales. Arreglar esos tres '
    u'enrutamientos vale más que cualquier otra cosa en la cuenta.\n\n'
    u'Y EL PROBLEMA REAL NO ES LA VOZ, ES EL CHAT: los 30 tickets de la mesa son '
    u'de chat casi en su totalidad, y 20 de ellos sobre envíos masivos y '
    u'campañas. Hay 5 fallas registradas (alerta `sac_fallas_recurrentes` abierta '
    u'el 12 oct) y un ticket de Envío Masivo WhatsApp que lleva 5,908 horas '
    u'abierto: 246 días.'
)

CAMBIOS = {
    'facturacion': 23325.0,
    # El correo vivia DENTRO del campo de nombre y `contacto_email` estaba vacio.
    # Mismo defecto que en Torres Corzo y ECODELI.
    'contacto_nombre': u'Oscar Guillermo Cisneros Linares',
    'contacto_email': u'olinares@odontoprev.com.mx',
    'contacto_cargo': u'Líder de Operaciones CAT — declaró el 22 jul 2026 que ya no participa directamente en la operación',
    'contactos_json': CONTACTOS,
    'tamano_empresa': u'Plantilla pequeña (11–50 en México) y operación grande: ~1 millón de asegurados y 320 clientes corporativos',
    'total_empleados': u'11–50 en México (LinkedIn) · ~2,000 en el grupo global',
    'num_oficinas': u'1 oficina corporativa (CDMX). NO es cadena de clínicas: red de prestadores afiliados.',
    'giro': u'Seguros dentales y planes de salud bucal — administra coberturas vía red de prestadores',
    'grupo_empresarial': u'Odontoprev Brasil (matriz) · entrada a México en 2015 por joint venture con Grupo IKÉ. El vínculo con Bradesco, POR CONFIRMAR.',
    'direccion_fiscal': u'Av. Paseo de la Reforma 373, Piso 11, Col. Cuauhtémoc, C.P. 06500, Ciudad de México, CDMX',
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

kam = (c.get('observaciones_kam') or u'').rstrip()
if u'ACTUALIZACIÓN 13 oct 2026' in kam:
    print(u'  el addendum de observaciones_kam YA ESTA puesto: no se repite.\n')
else:
    CAMBIOS['observaciones_kam'] = kam + ADDENDUM


def corto(v, n=116):
    s = json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else str(v)
    return s.replace('\n', ' ⏎ ')[:n] + (u' …' if len(str(s)) > n else u'')


def igual(a, b):
    u"""Compara sin que el tipo de la columna produzca falsas alarmas.

       Varias columnas de `cuentas` son de TEXTO aunque guarden numeros
       (`num_oficinas`, `total_empleados`). Comparar los JSON en crudo declara
       «NO COINCIDE» sobre escrituras correctas y rompe la idempotencia — me
       paso en `enriquece-impas.py`. [[feedback-verificar-antes-asegurar]]
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
print(u'  %-26s %s' % (u'servicio', u'ya describe CP Chat + SMS + VyC + DID'))
print(u'  %-26s %s' % (u'estado / activo_desde', u'no son parte de esta correccion'))
print(u'  %-26s %s' % (u'tiene_pago_automatico', u'esta en FALSO y adopcion dice ALTO:'))
print(u'  %-26s %s' % (u'', u'es una contradiccion que resuelve el cliente, no yo'))
print(u'\n  Y el vinculo con BRADESCO no se afirma: la investigacion no lo')
print(u'  confirma. Se reescribe como «por confirmar» y se anota aparte que')
print(u'  Bradescard SI es su mayor destino de llamadas, que es un hecho medido.')

if not reales:
    print(u'\n  nada que escribir.')
    sys.exit(0)

if not APLICA:
    print(u'\n  ══ SIMULACRO — no se escribio nada ════════════════════════')
    print(u'  %d campo(s) listos. Para aplicar:' % len(reales))
    print(u'      python scripts/enriquece-odontoprev.py --aplica')
    sys.exit(0)

req = urllib.request.Request(
    URL + '/rest/v1/cuentas?consecutivo=eq.' + CONS,
    data=json.dumps(reales, ensure_ascii=False).encode('utf-8'),
    headers=CAB, method='PATCH')
res = json.loads(urllib.request.urlopen(req, timeout=90).read().decode('utf-8'))
print(u'\n  ══ APLICADO ═══════════════════════════════════════════════')
print(u'  %d fila(s) actualizadas.' % len(res))

v = trae('cuentas?select=*&consecutivo=eq.' + CONS)[0]
fallos = []
for k, esperado in reales.items():
    ok = igual(v.get(k), esperado)
    if not ok:
        fallos.append(k)
    print(u'  %-20s %s' % (k, u'OK' if ok else u'** NO COINCIDE'))
print(u'\n  contactos en la ficha: %d' % len(v.get('contactos_json') or []))
print(u'  %s' % (u'todo escrito y comprobado.' if not fallos
                 else u'*** NO coinciden: %s' % u', '.join(fallos)))
sys.exit(1 if fallos else 0)
