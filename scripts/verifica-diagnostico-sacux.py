"""Comprueba que cada tabla del Diagnostico SAC/UX pinte lo que anuncia.

   Los dos defectos que se arreglan hoy son de la misma familia: la pantalla
   declara un numero y dibuja otro. Uno por un .slice(0,10) contra un titulo
   que decia 13; el otro por un filtro de una sola cola que escondia 14 filas
   sin mencionarlas.

   Este script busca la clase entera, no los dos casos: recorre cada arreglo de
   CHAT_SACUX, ve cuantas filas tiene y cuantas llegan a pintarse segun el
   .tsx, y marca toda diferencia que no este declarada en pantalla.
"""
import sys, io, re, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

R = r'D:\Windows\Projects\callpicker-cs'
DATOS = R + r'\app\callpicker-chat\chat-data.ts'
TSX = R + r'\app\callpicker-chat\DiagnosticoSacUx.tsx'

lineas = io.open(DATOS, encoding='utf-8').read().split('\n')
SAC = next(json.loads(l.split('=', 1)[1].strip().removesuffix(' as const'))
           for l in lineas if l.startswith('export const CHAT_SACUX'))
tsx = io.open(TSX, encoding='utf-8').read()

print('=== TAMANO REAL DE CADA ARREGLO EN LOS DATOS ===')
arreglos = {k: v for k, v in SAC.items() if isinstance(v, list)}
for k, v in arreglos.items():
    print('  %-16s %3d filas' % (k, len(v)))

print()
print('=== ¿ALGUIEN SIGUE RECORTANDO FILAS SIN DECIRLO? ===')
# Un .slice sobre una CADENA recorta texto y es inofensivo; sobre un ARREGLO
# esconde renglones. Se distinguen porque el de filas va seguido de .map().
recortes = re.findall(r'(\w+)\.slice\(0,\s*(\d+)\)(\.map)?', tsx)
filas_recortadas = [(v, n) for v, n, m in recortes if m]
texto_recortado = [(v, n) for v, n, m in recortes if not m]
print('  recortes de TEXTO (inofensivos): %s' % (texto_recortado or 'ninguno'))
if not filas_recortadas:
    print('  recortes de FILAS: ninguno')
for var, n in filas_recortadas:
    # ¿Se declara cuántas quedaron fuera, cerca del recorte?
    i = tsx.find('%s.slice(0, %s)' % (var, n))
    cerca = tsx[i:i + 1400]
    declara = ('.length - %s' % n) in cerca or ('.length > %s' % n) in cerca
    print('  %s %s.slice(0, %s).map  ·  declara el corte: %s'
          % ('ok  ' if declara else '** ', var, n, declara))

print()
print('=== LOS DOS DEFECTOS ===')
nc = arreglos.get('noCierran', [])
pinta_todo_nc = bool(re.search(r'\{nc\.map\(', tsx))
print('  1 · «no cierran conversaciones»')
print('      filas en datos : %d' % len(nc))
print('      pinta nc.map() : %s   %s' % (pinta_todo_nc, 'las pinta todas' if pinta_todo_nc else '** sigue recortando'))
print('      la pestana dice: %d  (S.noCierran.length)' % len(nc))

bal = arreglos.get('balance', [])
bajo = [x for x in bal if x['valor'] < 0.6]
alto = [x for x in bal if x['valor'] > 1.5]
medio = len(bal) - len(bajo) - len(alto)
tiene_alto = 'balAlto' in tsx
print()
print('  2 · «balance de la conversacion»')
print('      cuentas medidas    : %d' % len(bal))
print('      cola baja  (<0.60) : %d   <- lo unico que se pintaba antes' % len(bajo))
print('      cola alta  (>1.50) : %d   <- no aparecia nunca' % len(alto))
print('      en medio           : %d   (0.60 a 1.50, sin nada que preguntar)' % medio)
print('      el componente pinta la cola alta: %s' % tiene_alto)
print('      suma declarada     : %d + %d + %d = %d %s'
      % (len(bajo), len(alto), medio, len(bajo) + len(alto) + medio,
         '(cierra)' if len(bajo) + len(alto) + medio == len(bal) else '** NO CIERRA'))

print()
print('  los de la cola alta, que nadie habia visto:')
for x in sorted(alto, key=lambda y: -y['valor'])[:8]:
    print('    %-42s %5.2f   %s entrantes de %s mensajes'
          % (x['nombre'][:42], x['valor'], format(x['base'], ','), format(x['mensajes'], ',')))

print()
print('=== EL RESTO DE LAS TABLAS: ¿declaran lo que pintan? ===')
for k, v in arreglos.items():
    usa_length = ('S.%s.length' % k) in tsx
    recortada = any(var.endswith(k[:2]) or var == k for var, _ in recortes)
    print('  %-16s %3d filas · usa .length en pantalla: %-5s · recortada: %s'
          % (k, len(v), usa_length, recortada))
