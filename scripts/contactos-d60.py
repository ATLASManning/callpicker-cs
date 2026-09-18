"""Agrega a D60 los dos contactos que aporto direccion, y registra Sunshine
   Delivers como lo que resulto ser.

   Los correos llegaron con dominio @sunshine-delivers.com, que no es el de la
   cuenta. NO se pegaron por asumir: sunshine-delivers.com declara en su propio
   sitio «Sunshine Delivers is a project by Supreme Resources», con el MISMO
   domicilio (Ana Bolena 63, Col. La Nopalera, CDMX) y el MISMO telefono
   (+52 55 8854 4330) que la cuenta. Direccion lo confirmo ademas por escrito.

   Los nombres se derivan del buzon (oscar.zamora -> Oscar Zamora). Eso es una
   lectura, no un dato confirmado, y el cargo no se conoce: ambos van marcados
   con palabras. La minuta de la reunion que sigue es la que debe corregirlos.
"""
import sys, io, json, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}
ID = '26a15fd8-92b2-4c3c-a9ca-a6045e9bb096'

r = urllib.request.Request(URL + '/rest/v1/cuentas?select=contactos_json,observaciones_kam,notas&id=eq.' + ID,
                           headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
act = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())[0]

CARGO = 'Cargo NO confirmado — correo aportado por dirección 14 sep 2026; definir en la minuta'

NUEVOS = [
    {'nombre': 'Oscar Zamora',   'cargo': CARGO, 'tel': '', 'email': 'oscar.zamora@sunshine-delivers.com'},
    {'nombre': 'Gerardo Gómez',  'cargo': CARGO, 'tel': '', 'email': 'gerardo.gomez@sunshine-delivers.com'},
]

# Los interlocutores reales primero; el conmutador al final, que no es persona.
previos = [c for c in (act['contactos_json'] or []) if c.get('nombre') != 'Conmutador general']
conmut = [c for c in (act['contactos_json'] or []) if c.get('nombre') == 'Conmutador general']
ya = {c.get('email', '').lower() for c in (act['contactos_json'] or []) if c.get('email')}
agregar = [c for c in NUEVOS if c['email'].lower() not in ya]
CONTACTOS = agregar + previos + conmut

BLOQUE = """

SUNSHINE DELIVERS — SEGUNDA MARCA DE LA MISMA EMPRESA (verificado 14 sep 2026).
sunshine-delivers.com declara en su propio sitio «Sunshine Delivers is a project
by Supreme Resources». Es la MISMA operación, no otro cliente: mismo domicilio
(Ana Bolena 63, Col. La Nopalera, CDMX) y mismo teléfono (55 8854 4330) que la
cuenta. Por eso los correos @sunshine-delivers.com pertenecen aquí.

Qué es: flota de reparto 100% eléctrica alimentada con energía solar, la primera
de México según ellos. Opera CDMX y zona metropolitana desde abril 2023, y
declaran que para finales de 2026 el corredor logístico conectará los hubs clave
del país. Transporta las materias primas que la propia Supreme Resources
distribuye.

QUÉ CAMBIA PARA CALLPICKER. La cuenta ya no es «un distribuidor químico que casi
no habla». Es un distribuidor CON una operación de última milla en expansión
geográfica, y el reparto es un negocio que vive del teléfono: confirmación de
entrega, reagendado, incidencia en ruta, cliente preguntando dónde va su carga.
Consumir 39 de 400 minutos con una flota en la calle no cuadra. La pregunta para
la reunión no es por qué consumen poco — es por dónde están pasando esas
llamadas hoy, porque en algún lado están.

Su propio sitio dice «Our Supply Chain executives are ready to hear to your
transportation needs»: hay un equipo de supply chain atendiendo demanda entrante.
Ese es el área a mapear.

OJO CON EL CÓDIGO POSTAL. El sitio de Sunshine publica C.P. 13200; el registro
fiscal de la cuenta trae 13220. No se corrigió ninguno de los dos sin confirmar
cuál es el bueno."""

NOTAS = """[FALTA_TC] Alta 14 sep 2026 por instrucción de dirección. Asesor: Dan.

DATOS QUE FALTAN Y POR QUÉ IMPORTAN — no se inventaron:
· CARGOS: SIN CONFIRMAR. Hay dos interlocutores con correo corporativo (Oscar
  Zamora y Gerardo Gómez, aportados por dirección) y siete personas más
  identificadas públicamente, pero de ninguna se conoce el puesto. Los nombres
  de esos dos se leyeron del buzón (oscar.zamora → Oscar Zamora): confirmarlos
  en la minuta.
· MAPA DE DECISORES: SIN CAPTURAR. No se sabe quién autoriza el gasto ni quién
  puede cancelar el servicio.
· CONTACTO PRINCIPAL: sin designar. Hay dos candidatos; la minuta debe decir
  quién lleva la relación antes de fijarlo.
· HEAD COUNT EXACTO: no publicado. LinkedIn declara el rango 11–50. No usar
  "20", "30" ni "40" como cifra.
· ACTIVO_DESDE: sin fecha capturada. Zoho reporta 77 meses activo al corte del
  17 ago 2026; `dias_como_cliente` se deriva de ahí y es aproximado.
· C.P. del domicilio: 13220 en el registro fiscal, 13200 en el sitio de
  Sunshine Delivers. Sin confirmar cuál es correcto.
· Los cuatro scores quedan en su valor por omisión (50) porque no hay medición
  propia todavía. El Health Score que muestre la ficha es ese default, no una
  evaluación.

LO QUE SÍ ESTÁ MEDIDO:
· CID 31510, confirmado contra los cortes de facturación y contra sus tickets.
· Zoho al 17 ago 2026: factura $980, MRR $993, semáforo «1 - Activo», segmento
  Large, 77 meses activo. Se resuelve en vivo por nombre, no se captura a mano.
· 9 cortes de facturación. Plan vigente «Visibilidad y Control 400 minutos»,
  $979/mes. Consumo: 12% en junio, 13.5% en julio, 9.75% en agosto.
· 2 tickets registrados, ninguno clasificado como falla.
· NO aparece en GRC ni en la lista de cancelados: sin señal de baja.
· NO viene en la lectura de llamadas, pese a que su consumo (<40%) debería
  haberla incluido en esa extracción. Es un hueco del archivo, no una cuenta
  sin llamadas: no afirmar nada sobre su tráfico.

PENDIENTE: dirección entregará la minuta de la reunión reciente con el cliente.
Al cargarla, corregir cargos, fijar contacto principal y cerrar el mapa de
decisores."""

PARCHE = {
    'contactos_json': CONTACTOS,
    'observaciones_kam': act['observaciones_kam'].rstrip() + BLOQUE,
    'notas': NOTAS,
}

print('=== CONTACTOS D60 ===')
print('  ya registrados : %d' % len(act['contactos_json'] or []))
print('  se agregan     : %d' % len(agregar))
for c in agregar:
    print('    %-16s %s' % (c['nombre'], c['email']))
print('  quedan         : %d' % len(CONTACTOS))

if '--escribir' not in sys.argv:
    print()
    print('SIMULACION. Nada escrito.')
    raise SystemExit(0)

rq = urllib.request.Request(URL + '/rest/v1/cuentas?id=eq.' + ID,
                            data=json.dumps(PARCHE).encode(),
                            headers=dict(H, **{'Prefer': 'return=representation'}), method='PATCH')
c = json.loads(urllib.request.urlopen(rq, timeout=60).read().decode())[0]
print()
print('=== ACTUALIZADA ===')
for x in c['contactos_json']:
    print('  %-30s %-42s %s' % (x['nombre'], x['email'] or '—', x['cargo'][:44]))
print()
print('  observaciones_kam: %s caracteres' % format(len(c['observaciones_kam']), ','))
print('  notas            : %s caracteres' % format(len(c['notas']), ','))
