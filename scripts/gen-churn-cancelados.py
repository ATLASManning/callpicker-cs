"""
Genera lib/churn-cancelados-data.ts a partir de los reportes semanales de
Churn > Análisis DATA que viven en app/churn/page.tsx.

Por qué existe:
  app/churn/page.tsx es un componente 'use client' y sus reportes no se
  exportan, así que el backend no puede importarlos. Las reglas de
  elegibilidad de Actividades SAC necesitan la lista de clientes cancelados
  para no generar actividades sobre ellos. Este script extrae solo esos
  nombres a un módulo plano que sí puede importarse desde el servidor.

Cuándo correrlo:
  Cada vez que se agregue un reporte semanal nuevo a app/churn/page.tsx
  (bloque `cancelados:` dentro de un REPORTE_*).

Uso:
  python scripts/gen-churn-cancelados.py
"""
import io
import re
import os
import sys
import unicodedata

# La consola de Windows va en cp1252 y los nombres traen emoji de riesgo: sin
# esto, imprimir el informe revienta y el archivo se queda a medio generar.
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8',
                              line_buffering=True)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# El corte vigente vive en su propio módulo (Atlas lo consume del lado del
# servidor); los cortes anteriores quedan archivados dentro de page.tsx.
SRCS = [
    os.path.join(ROOT, 'app', 'churn', 'page.tsx'),
    os.path.join(ROOT, 'app', 'churn', 'reporte-actual.ts'),
]
OUT = os.path.join(ROOT, 'lib', 'churn-cancelados-data.ts')


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', s)


src = '\n'.join(
    open(f, encoding='utf-8').read() for f in SRCS if os.path.exists(f)
)

# Cada reporte trae su periodo; se conserva para poder rastrear el origen.
periodos = {}
for m in re.finditer(r"const (REPORTE_\w+): ChurnReporte = \{(.*?)\n\}", src, re.S):
    nombre, cuerpo = m.group(1), m.group(2)
    per = re.search(r"periodo:\s*'([^']*)'", cuerpo)
    periodos[nombre] = per.group(1) if per else nombre

# Los reportes incluyen filas agregadas que no son clientes: cruzarlas contra
# `cuentas` produciría coincidencias falsas.
#
# LA REGLA ES EL PREFIJO «+», Y NADA MÁS. La versión anterior exigía un DÍGITO
# detrás (`^\s*\+\s*\d+`), así que cazaba «+ 23 cuentas adicionales» y dejaba
# pasar «+ Resto de cancelaciones del mes — 33 clientes…», que es la forma que
# usan los cortes desde la semana 25. Tres cubos entraron a la lista como si
# fueran clientes.
#
# «Empieza por +» es la MISMA convención que ya usan `sinCubo()` en page.tsx y
# el contexto de Atlas para filtrar cubos de cierre. Tenerla escrita de otra
# manera aquí era el bug. [[feedback-tablas-deben-cerrar]]
RX_AGREGADO = re.compile(r'^\s*\+|cuentas?\s+adicionales', re.I)

# EL NOMBRE NO ES EL CAMPO `cliente`: ES SU PRIMER TROZO.
# -------------------------------------------------------
# Desde que los cortes escriben el análisis DENTRO de `cliente` —emoji, el
# nombre, « — » y párrafos de prosa—, este extractor se llevaba la prosa
# entera. 86 de 172 nombres quedaron así, y un nombre de 400 caracteres no
# empata con `cuentas.empresa` NUNCA: la puerta de Análisis DATA del circuito
# de Dormidas se quedó medio ciega sin que nada fallara. Jason de México, una
# cuenta TOP publicada como baja por dos cortes, salía en el corte TOP con
# puerta «GRC+DIRECCIÓN» en vez de «GRC+DATA».
#
# El corte separa nombre y análisis con un GUIÓN LARGO RODEADO DE ESPACIOS, y
# los emoji de riesgo van delante. Se corta ahí, y si no hay guión se conserva
# entero: un nombre corto es un nombre. [[feedback-verificar-antes-asegurar]]
RX_ADORNO = re.compile(
    u'^[\\s‍☀-➿\U0001f000-\U0001faff️⬀-⯿]+')


def nombre_solo(crudo):
    u"""El nombre del cliente dentro de un campo `cliente` con prosa."""
    s = RX_ADORNO.sub(u'', crudo).strip()
    for sep in (u' — ', u' – '):   # em dash, en dash
        if sep in s:
            s = s.split(sep, 1)[0].strip()
            break
    # OJO: NO se recorta el punto final. «GANA A.C.» y «S.A. de C.V.» llevan el
    # punto DENTRO del nombre, y quitarlo convertía «GANA A.C.» en «GANA A.C».
    # El cruce aguantaba —`norm()` tira la puntuación— pero el nombre que se
    # MUESTRA quedaba mal escrito, y un nombre mal escrito en una lista de bajas
    # es lo que luego se copia a un correo.
    return s.strip(u' ,:;—–')

clientes = {}   # norm -> (nombre original, periodo)
descartados = []
recortados = []
def arreglo_de(cuerpo, clave):
    """Contenido del arreglo `clave: [...]`, contando corchetes.

    NO usar un regex tipo `clave:\\s*\\[(.*?)\\n  \\]`. Un reporte sin bajas
    escribe `cancelados: []` en una sola línea; ese regex no puede cerrar ahí
    y se sigue expandiendo hasta el primer `\\n  ]` posterior — que es el
    cierre del bloque SIGUIENTE, `downgrades:`. Resultado: los downgrades
    entraban a la lista de bajas.

    Costó 17 nombres falsos de 110 (tres reportes: Semana 4 y 5 de mayo y
    Semana 11 de julio). S&G LOCALIZACION salía como baja confirmada cuando
    solo había reducido su Extension VyC de $9,429.02 a $6,286 — y
    lib/elegibilidad.ts la bloqueaba para Actividades SAC como si estuviera
    muerta. Lo detectó José Manuel el 12 sep 2026.
    """
    m = re.search(re.escape(clave) + r'\s*:\s*\[', cuerpo)
    if not m:
        return None
    ini = m.end() - 1
    prof = 0
    for j in range(ini, len(cuerpo)):
        if cuerpo[j] == '[':
            prof += 1
        elif cuerpo[j] == ']':
            prof -= 1
            if prof == 0:
                return cuerpo[ini + 1:j]
    return None


for m in re.finditer(r"const (REPORTE_\w+): ChurnReporte = \{(.*?)\n\}", src, re.S):
    nombre, cuerpo = m.group(1), m.group(2)
    blk = arreglo_de(cuerpo, 'cancelados')
    if not blk or not blk.strip():
        continue
    for c in re.finditer(r"cliente:\s*'([^']+)'", blk):
        crudo = c.group(1)
        if RX_AGREGADO.search(crudo):
            descartados.append(crudo[:60])
            continue
        limpio = nombre_solo(crudo)
        if not limpio:
            descartados.append(crudo[:60])
            continue
        if len(limpio) < len(crudo):
            recortados.append((crudo[:50], limpio))
        k = norm(limpio)
        if k and k not in clientes:
            clientes[k] = (limpio, periodos.get(nombre, ''))

filas = sorted(clientes.items(), key=lambda x: x[1][0].lower())
print('Reportes leidos      :', len(periodos))
print('Clientes cancelados  :', len(filas))
print('Filas agregadas descartadas:', len(descartados))
for d in descartados:
    print('   cubo:', d)
# QUE EL RECORTE SE VEA. Sin esto, arreglar la extraccion es indistinguible de
# no haberla arreglado: el archivo cambia y nadie sabe cuanto.
print('Nombres recortados de prosa:', len(recortados))
for a, b in recortados[:5]:
    print('   %-52s -> %s' % (a, b))
# NINGUN NOMBRE DEBE SEGUIR SIENDO PROSA. Un nombre largo no empata con
# `cuentas.empresa` y la puerta se queda ciega en silencio, que es justo el
# fallo que esto vino a cerrar.
largos = [n for _k, (n, _p) in filas if len(n) > 60]
if largos:
    print('*** %d NOMBRES SIGUEN SIENDO PROSA, la puerta no los vera:' % len(largos))
    for n in largos:
        print('   ', n[:90])
    raise SystemExit(1)
print('Ningun nombre pasa de 60 caracteres: todos son nombres, no analisis.')

with open(OUT, 'w', encoding='utf-8', newline='') as f:
    f.write("""/* ═══════════════════════════════════════════════════════════════════════
   CLIENTES CANCELADOS — derivado de Churn > Análisis DATA
   GENERADO — no editar a mano.
   Regenerar con: python scripts/gen-churn-cancelados.py

   Los reportes semanales viven dentro de app/churn/page.tsx, que es un
   componente 'use client' y no los exporta. Este módulo extrae solo los
   nombres de clientes cancelados para que el backend pueda consumirlos:
   lib/elegibilidad.ts los usa para no generar Actividades SAC sobre
   cuentas ya canceladas.
═══════════════════════════════════════════════════════════════════════ */

export interface ClienteCancelado {
  cliente: string
  periodo: string
}

export const CLIENTES_CANCELADOS: ClienteCancelado[] = [
""")
    for _, (nombre, per) in filas:
        f.write("  { cliente: %s, periodo: %s },\n"
                % (repr(nombre).replace('"', "'"), repr(per).replace('"', "'")))
    f.write("]\n")

print('Escrito en', OUT)
