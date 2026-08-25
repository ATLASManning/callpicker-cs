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
SRC = os.path.join(ROOT, 'app', 'churn', 'page.tsx')
OUT = os.path.join(ROOT, 'lib', 'churn-cancelados-data.ts')


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', s)


src = open(SRC, encoding='utf-8').read()

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
for m in re.finditer(r"const (REPORTE_\w+): ChurnReporte = \{(.*?)\n\}", src, re.S):
    nombre, cuerpo = m.group(1), m.group(2)
    blk = re.search(r'cancelados:\s*\[(.*?)\n  \]', cuerpo, re.S)
    if not blk:
        continue
    for c in re.finditer(r"cliente:\s*'([^']+)'", blk.group(1)):
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
