"""Comprueba el orden del menu y la pantalla de inicio de cada rol.

   Dos cosas que pidio direccion el 17 sep 2026: los apartados en orden
   alfabetico, y que al iniciar se muestre Asesores.

   La trampa de la segunda: el rol `perfilamiento` NO tiene /asesores en su
   lista de paginas. Darle esa pantalla de inicio lo mete en un bucle —pide
   Asesores, no puede, lo mandan a su inicio, que seria Asesores otra vez— y
   ese rol no vuelve a entrar. Aqui se verifica que cada rol pueda ABRIR la
   pantalla con la que arranca.
"""
import sys, io, re, unicodedata
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

R = r'D:\Windows\Projects\callpicker-cs'
sb = io.open(R + r'\components\Sidebar.tsx', encoding='utf-8').read()
pm = io.open(R + r'\lib\permisos.ts', encoding='utf-8').read()

# ── Las etiquetas del menu, en el orden en que estan escritas ──────────────
i = sb.index('const NAV_ENTRADAS')
j = sb.index('const etiquetaDe')
bloque = sb[i:j]
entradas = []
for m in re.finditer(r"group:\s*'([^']+)'|label:\s*'([^']+)'", bloque):
    g, l = m.group(1), m.group(2)
    # Los `label` de los hijos van indentados dentro de children: se saltan
    entradas.append(('grupo', g) if g else ('item', l))

# Reconstruir solo el primer nivel: un grupo se lleva sus hijos
primer_nivel, saltar = [], 0
partes = re.split(r'\n  \},?\n', bloque)
for tipo, et in entradas:
    if tipo == 'grupo':
        primer_nivel.append(et)
        saltar = 2          # los dos hijos del grupo
    elif saltar:
        saltar -= 1
    else:
        primer_nivel.append(et)


def clave(s):
    """Replica de localeCompare('es', {sensitivity:'base'}): sin acentos."""
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if not (0x300 <= ord(c) <= 0x36f))
    return s.lower()


ordenado = sorted(primer_nivel, key=clave)

print('=== EL MENU, COMO SE VA A VER ===')
for k, et in enumerate(ordenado, 1):
    print('  %2d. %s' % (k, et))

print()
print('  apartados: %d' % len(ordenado))
print('  estaba ya alfabetico en el codigo: %s' % (primer_nivel == ordenado))
if primer_nivel != ordenado:
    print('  (no importa: el componente lo ordena en tiempo de render)')

print()
print('=== ¿EL COMPONENTE ORDENA DE VERDAD? ===')
print("  deriva NAV de NAV_ENTRADAS : %s" % ('const NAV: NavEntry[] = [...NAV_ENTRADAS].sort' in sb))
print("  usa locale 'es'            : %s" % ("'es', { sensitivity: 'base'" in sb))
print("  etiquetaDe cubre grupos    : %s" % ('isGroup(e) ? e.group : e.label' in sb))
print("  se define isGroup antes    : %s" % (sb.index('function isGroup') < sb.index('const etiquetaDe')))

# ── Pantalla de inicio por rol ────────────────────────────────────────────
print()
print('=== PANTALLA DE INICIO POR ROL ===')
roles = re.findall(r"(\w+):\s*\{\s*\n\s*label:\s*'([^']+)'[^}]*?inicio:\s*'([^']+)'", pm, re.S)
paginas = {}
for m in re.finditer(r"(\w+):\s*\{\s*\n\s*label:\s*'[^']+'.*?paginas:\s*(null|\[)", pm, re.S):
    paginas[m.group(1)] = m.group(2)

for rol, label, inicio in roles:
    acceso_total = paginas.get(rol) == 'null'
    if acceso_total:
        puede = True
    else:
        # ¿el inicio esta en su lista de paginas?
        bloque_rol = pm[pm.index("%s: {" % rol):]
        bloque_rol = bloque_rol[:bloque_rol.index('inicio:')]
        puede = ("'%s'" % inicio) in bloque_rol
    print('  %-14s inicio %-12s acceso total: %-5s puede abrirlo: %s'
          % (label, inicio, acceso_total, 'SI' if puede else '** NO — BUCLE'))

print()
print('=== EL LOGIN MANDA A LA PANTALLA DEL ROL ===')
ac = io.open(R + r'\app\acceso\page.tsx', encoding='utf-8').read()
print('  usa ROLES[rol].inicio : %s' % ('ROLES[data.rol as Rol]?.inicio' in ac))
print('  ya no empuja a «/»    : %s' % ("router.push('/')" not in ac))
