# -*- coding: utf-8 -*-
u"""Escribe en la ficha de PROBEMEDIC (F7) lo que direccion investigo.

   Mismo patron que `enriquece-impas.py` y `enriquece-odontoprev.py`: SIMULACRO
   por omision, antes/ahora campo por campo, y relectura tras aplicar.

   LO QUE LA INVESTIGACION DESTAPO AL CRUZARLA CON NUESTROS DATOS
   --------------------------------------------------------------
   Direccion aporto el localizador oficial —7 sucursales en 6 estados— y
   advirtio que «el inventario de extensiones, numeros DID y servicios
   contratados puede abarcar mas ubicaciones que las visibles en la pagina
   comercial». Se comprobo contra `data/dids.json` y el resultado es el
   hallazgo de la cuenta, pero al reves de lo que la advertencia sugeria:

     · Los 34 numeros (30 del CID 112478 + 4 del fusionado 68328) NO estan
       etiquetados por sucursal. Estan por ASEGURADORA, LABORATORIO y HOSPITAL:
       `800 AXA`, `Abbvie`, `Botox`, `Pint Farma`, `CIMESA` x3,
       `HOPE M CENTER`, `AMBULANCIAS_SOS`, `Enfermeria SOS`.
     · 13 de los 30 son numeros 800, que es lo que usa un programa de pacientes.
     · Por plaza: 15 en Monterrey, 2 en CDMX y 13 nacionales. **CERO en
       Guadalajara, Puebla, Tijuana y Leon**, que son cuatro de sus siete
       sucursales y tienen telefono propio publicado que NO es nuestro.

   O sea: Probemedic no nos usa para atender sus farmacias, nos usa para
   operar LINEAS DE PROGRAMA DE PACIENTES de laboratorios y aseguradoras. Eso
   encaja con lo que la investigacion describe —convenios con aseguradoras y
   hospitales, medicamentos de alta especialidad de tratamiento prolongado,
   seguimiento continuo a pacientes— y cambia que significa una llamada
   perdida en esta cuenta.

   LO QUE **NO** SE ESCRIBE, A PROPOSITO
   -------------------------------------
     · La RAZON SOCIAL no se da por cerrada. La investigacion la deja
       «pendiente de confirmar mediante constancia fiscal», y aunque varios
       directorios externos dicen «Probemedic Distribuciones, S.A. de C.V.»,
       un directorio no es una constancia. Se anota con su reserva.
     · Los tres nombres del Comite de Etica entran CON la marca de «confirmar
       vigencia», que es como la investigacion los entrega.
     · Los cuatro perfiles de LinkedIn sin cargo verificado NO entran como
       directivos. La investigacion lo pide explicitamente y tiene razon.
     · `num_oficinas` pasa de «10» a decir las DOS cifras y de donde sale cada
       una, en vez de elegir la que suene mejor.

   USO
       python scripts/enriquece-probemedic.py            # SIMULACRO
       python scripts/enriquece-probemedic.py --aplica
"""
import io
import os
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APLICA = '--aplica' in sys.argv
CONS = 'F7'


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
    # Los dos que YA estaban en la ficha: se conservan, son los que el equipo usa.
    {'nombre': u'Enrique Manuel Castillo Morales', 'cargo': u'Director General — titular de la cuenta',
     'tel': u'(81) 2073-4041', 'email': u'ecastillo@probemedic.mx'},
    {'nombre': u'Rafael Garcia Torres', 'cargo': u'Soporte técnico',
     'tel': u'55 4674 1020', 'email': u'rafael.garcia@probemedic.mx'},
    # El que aparecio el 13 oct 2026 reportando el incidente del hotfix y que
    # NO estaba capturado. Es contacto operativo real.
    {'nombre': u'Daniel Olivares',
     'cargo': u'Operación — reportó el 13 oct 2026 el cambio de plataforma que les afectó la búsqueda en call details. NO estaba capturado.',
     'tel': u'', 'email': u''},
    # Del Codigo de Etica oficial. Fuente mas fiable que redes sociales, y la
    # investigacion pide confirmar vigencia antes de tratarlos como decisores.
    {'nombre': u'Elena Guadalupe Rodríguez Torres',
     'cargo': u'Dirección de Recursos Humanos (Comité de Ética) — CONFIRMAR VIGENCIA',
     'tel': u'', 'email': u''},
    {'nombre': u'Adrián García Villarreal',
     'cargo': u'Dirección de Almacenes y Logística (Comité de Ética) — CONFIRMAR VIGENCIA',
     'tel': u'', 'email': u''},
    {'nombre': u'Ceydi Yolotzi Cortés Hernández',
     'cargo': u'Cumplimiento Normativo y Gestión de Calidad (Comité de Ética) — CONFIRMAR VIGENCIA',
     'tel': u'', 'email': u''},
    # Lineas institucionales publicadas.
    {'nombre': u'Atención general (institucional)', 'cargo': u'L–V 8:00–20:00 · sáb 9:00–14:00',
     'tel': u'81 2474 0080', 'email': u'informacion.farmacia@probemedic.mx'},
    {'nombre': u'Atención a pacientes asegurados (institucional)',
     'cargo': u'Línea 800 dedicada a convenios con aseguradoras',
     'tel': u'800 522 5268', 'email': u''},
    {'nombre': u'Quejas y sugerencias (institucional)', 'cargo': u'Canal formal de queja',
     'tel': u'81 1765 9247', 'email': u'transparencia@probemedic.mx'},
    {'nombre': u'WhatsApp empresarial (institucional)', 'cargo': u'Canal publicado en su sitio',
     'tel': u'81 1763 9974', 'email': u''},
    {'nombre': u'PENDIENTES DE IDENTIFICAR',
     'cargo': u'Dirección General, Dirección Comercial, Gerencia de TI, Responsable de Call Center, E-commerce, Compras y Operaciones de Sucursales. Ninguno tiene teléfono ni correo público confirmado.',
     'tel': u'', 'email': u''},
]

NOTAS = (
    u'PROBEMEDIC · «Farmacias ProbeMedic Especializadas». Fundada en 2011, sede '
    u'en Monterrey, N.L. Comercializa y distribuye MEDICAMENTOS DE ALTA '
    u'ESPECIALIDAD —para enfermedades crónicas, degenerativas o graves, de '
    u'tratamiento prolongado—, medicamentos de patente, genéricos, equipo médico '
    u'e insumos. Razón social fiscal exacta PENDIENTE de confirmar por constancia '
    u'(varios directorios dicen «Probemedic Distribuciones, S.A. de C.V.», pero '
    u'un directorio no es una constancia).\n\n'
    u'MODELO — B2C, B2B y atención a pacientes asegurados, con seis unidades que '
    u'comunican distinto: farmacias, comercio electrónico, alta especialidad, '
    u'convenios con aseguradoras, logística y programas de lealtad.\n\n'
    u'COBERTURA — 7 sucursales en el localizador oficial, en 6 estados: '
    u'Revolución y San Pedro (NL), CDMX, Guadalajara, Puebla (Cholula), Tijuana '
    u'y León. LinkedIn conserva 4 direcciones más en Monterrey (Dr. Cantú, José '
    u'Benítez, Doctors Hospital y Madero) que NO están en el localizador actual: '
    u'puede ser histórico o puede ser otro formato, y hay que validarlo. La ficha '
    u'decía 10 oficinas; las dos cifras conviven hasta que alguien lo cierre.\n\n'
    u'TELÉFONOS PÚBLICOS — General 81 2474 0080 · WhatsApp 81 1763 9974 · '
    u'Pacientes asegurados 800 522 5268 · Quejas y sugerencias 81 1765 9247. '
    u'Correos: informacion.farmacia@probemedic.mx y transparencia@probemedic.mx. '
    u'Horario publicado: L–V 8:00–20:00 y sábados 9:00–14:00.\n\n'
    u'PARA QUÉ NOS USA, Y ES LO IMPORTANTE — Nuestros 34 números (30 del CID '
    u'112478 + 4 del fusionado 68328) NO están etiquetados por sucursal sino por '
    u'ASEGURADORA, LABORATORIO y HOSPITAL: «800 AXA», «Abbvie», «Botox», «Pint '
    u'Farma», «CIMESA» ×3, «HOPE M CENTER», «AMBULANCIAS_SOS», «Enfermería SOS». '
    u'Trece de los treinta son números 800. Son LÍNEAS DE PROGRAMA DE PACIENTES, '
    u'no conmutadores de farmacia — coherente con sus convenios y con el '
    u'seguimiento continuo que exige la alta especialidad.\n\n'
    u'Y EL HUECO DE CRECIMIENTO ES CONCRETO: por lada tenemos 15 números en '
    u'Monterrey, 2 en CDMX y 13 nacionales. CERO en Guadalajara, Puebla, Tijuana '
    u'y León — cuatro de sus siete sucursales, con teléfono propio publicado que '
    u'no pasa por nosotros.\n\n'
    u'Señales previas de la ficha: BAJO_CONSUMO (39.2% de su bolsa de 50,000 min). '
    u'[FUSIÓN 31 Ago 2026] Subcuenta integrada: PROBEMEDIC (Z17, CID 68328), '
    u'duplicado eliminado por conciliación de dirección.\n\n'
    u'Investigación institucional de dirección, 13 oct 2026. Fuentes: sitio '
    u'oficial, Código de Ética, localizador de sucursales y LinkedIn corporativo.'
)

ADDENDUM = (
    u'\n\n─── ACTUALIZACIÓN 13 oct 2026 (auditoría F7) ───\n'
    u'TRES COSAS QUE NO ESTABAN DICHAS.\n\n'
    u'1) PIERDE EL 30.63% DE SUS LLAMADAS Y LLEVA NUEVE MESES ASÍ. 28,357 de '
    u'92,572 entrantes, con una tasa que no se ha movido de ~30% desde enero. Y '
    u'NO hay una sola alerta abierta, porque el motor compara cada cuenta contra '
    u'su PROPIA base: con una base de 30.92%, el mes cerrado al 28.08% se lee '
    u'como mejora. Una cuenta puede normalizar un 30% de pérdida y quedar en '
    u'verde.\n\n'
    u'2) PERO NO ES UN PROBLEMA DE PERSONAL: ES DE ENRUTAMIENTO. Cuando la '
    u'llamada llega a un destino que funciona, se contesta el 97.6% de las veces. '
    u'El 84.2% de TODAS las pérdidas cae en «(sin destino registrado)» —23,881 de '
    u'29,783, el 80.2%, desde 2,251 números distintos y con CERO minutos—. Y tres '
    u'extensiones personales se llevan el resto: Lezly Iohanna Carreón Loera '
    u'(2,053 de 2,142, el 95.8%), Marco Antonio Moreno Ibarra (346 de 346, el '
    u'100% — nunca contestó ninguna) y Azucena Garcia Segura (219 de 351). Entre '
    u'esos cuatro destinos, el 93.4% de las pérdidas.\n\n'
    u'3) EL SÁBADO ES EL PEOR DÍA Y EL DOMINGO NO DEBERÍA EXISTIR. Sábado: 7,244 '
    u'llamadas con 36.7% de pérdida, contra un horario publicado de 9:00 a 14:00. '
    u'Domingo: 1,095 llamadas con 36.5% de pérdida y NINGÚN horario publicado.\n\n'
    u'INCIDENTE ABIERTO HOY (13 oct, 10:50): el cliente —Daniel Olivares, que no '
    u'estaba capturado— reportó que un cambio nuestro en la plataforma les rompió '
    u'la búsqueda en call details (buscaban a 8 dígitos) y el export de llamadas '
    u'a correo. Interno: «no hubo sign off, fue un hotfix». Ticket #117503.'
)

CAMBIOS = {
    'facturacion': 21626.0,
    'contactos_json': CONTACTOS,
    'giro': u'Farmacéutica — distribución de medicamentos de ALTA ESPECIALIDAD, patente y genéricos, equipo médico e insumos',
    'tamano_empresa': u'Mediana — 51–200 empleados (LinkedIn); 121 perfiles asociados, que NO es plantilla verificada',
    'total_empleados': u'51–200 (rango de LinkedIn). Sin cifra verificada.',
    'num_oficinas': u'7 en el localizador oficial (6 estados) · la ficha decía 10 · LinkedIn añade 4 direcciones en Monterrey no listadas. Por cerrar.',
    'direccion_fiscal': u'Orquídea 412, Col. Real de Cumbres, C.P. 64346, Monterrey, Nuevo León',
    'servicio': u'Visibilidad y Control 25,000 min ×2 (bolsa de 50,000) + DIDs. Incluye la subcuenta integrada PROBEMEDIC (CID 68328) desde el 31 ago 2026.',
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
    if igual(c.get(k), nuevo):
        print(u'  %-18s SIN CAMBIO' % k)
        continue
    reales[k] = nuevo
    print(u'  %s' % k)
    print(u'      antes: %s' % corto(c.get(k)))
    print(u'      ahora: %s' % corto(nuevo))

print(u'\n  ══ LO QUE **NO** SE TOCA, A PROPOSITO ═════════════════════')
print(u'  razon social              la investigacion la deja PENDIENTE de')
print(u'                            constancia fiscal. Un directorio no es una.')
print(u'  los 4 perfiles LinkedIn   sin cargo verificado: NO entran como')
print(u'                            directivos, como pide la investigacion.')
print(u'  contacto_* principales    Enrique Castillo sigue siendo el titular')
print(u'  estado / activo_desde     no son parte de esta correccion')

if not reales:
    print(u'\n  nada que escribir.')
    sys.exit(0)

if not APLICA:
    print(u'\n  ══ SIMULACRO — no se escribio nada ════════════════════════')
    print(u'  %d campo(s) listos. Para aplicar:' % len(reales))
    print(u'      python scripts/enriquece-probemedic.py --aplica')
    sys.exit(0)

req = urllib.request.Request(
    URL + '/rest/v1/cuentas?consecutivo=eq.' + CONS,
    data=json.dumps(reales, ensure_ascii=False).encode('utf-8'),
    headers=CAB, method='PATCH')
res = json.loads(urllib.request.urlopen(req, timeout=90).read().decode('utf-8'))
print(u'\n  ══ APLICADO ═══════════════════════════════════════════════')
print(u'  %d fila(s) actualizadas.' % len(res))
v = trae('cuentas?select=*&consecutivo=eq.' + CONS)[0]
fallos = [k for k, esp in reales.items() if not igual(v.get(k), esp)]
for k in reales:
    print(u'  %-20s %s' % (k, u'OK' if k not in fallos else u'** NO COINCIDE'))
print(u'\n  contactos en la ficha: %d' % len(v.get('contactos_json') or []))
print(u'  %s' % (u'todo escrito y comprobado.' if not fallos
                 else u'*** NO coinciden: %s' % u', '.join(fallos)))
sys.exit(1 if fallos else 0)
