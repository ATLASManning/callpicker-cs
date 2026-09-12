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
import re
import os
import unicodedata

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

# Los reportes incluyen filas agregadas ("+ 23 cuentas adicionales") que no
# son clientes: cruzarlas contra `cuentas` produciría coincidencias falsas.
RX_AGREGADO = re.compile(r'^\s*\+\s*\d+|cuentas?\s+adicionales|^\s*\+\s*\d+\s*cuentas?', re.I)

clientes = {}   # norm -> (nombre original, periodo)
descartados = []
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
            descartados.append(crudo)
            continue
        k = norm(crudo)
        if k and k not in clientes:
            clientes[k] = (crudo, periodos.get(nombre, ''))

filas = sorted(clientes.items(), key=lambda x: x[1][0].lower())
print('Reportes leidos      :', len(periodos))
print('Clientes cancelados  :', len(filas))
print('Filas agregadas descartadas:', len(descartados), descartados)

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
