"""Comprueba el cableado del corte de churn vigente y sus cifras.

   La cadena es: reporte-actual.ts exporta UN corte vigente, y lo leen
   app/churn/page.tsx (cliente) y lib/atlas-context.ts (servidor). Si esos dos
   apuntan a cortes distintos, la pantalla y Atlas dicen cosas diferentes del
   mismo mes — que es justo lo que este archivo separado vino a evitar.

   Tambien recalcula las sumas del corte para que ninguna cifra escrita a mano
   se quede sin verificar.
"""
import sys, io, os, re, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = r'D:\Windows\Projects\callpicker-cs'
leer = lambda p: io.open(os.path.join(RAIZ, p), encoding='utf-8').read()

actual = leer(r'app\churn\reporte-actual.ts')
page   = leer(r'app\churn\page.tsx')
atlas  = leer(r'lib\atlas-context.ts')

exportado = re.findall(r'export const (REPORTE_\w+): ChurnReporte', actual)
print('=== CABLEADO ===')
print('  reporte-actual.ts exporta : %s' % (exportado or '** ninguno'))
if len(exportado) != 1:
    print('  ** debe exportar exactamente uno')
vig = exportado[0]

importa_page  = re.search(r"import \{ (REPORTE_\w+) \} from '\./reporte-actual'", page)
importa_atlas = re.search(r"import \{ (REPORTE_\w+) \} from '@/app/churn/reporte-actual'", atlas)
print('  page.tsx importa          : %s' % (importa_page.group(1) if importa_page else '** ninguno'))
print('  atlas-context.ts importa  : %s' % (importa_atlas.group(1) if importa_atlas else '** ninguno'))
ok_cable = (importa_page and importa_page.group(1) == vig
            and importa_atlas and importa_atlas.group(1) == vig)
print('  -> %s' % ('los tres apuntan al mismo corte' if ok_cable else '** DESALINEADOS'))

print('  page.tsx lo registra en allReportes : %s'
      % ('si' if re.search(r'allReportes[^\n]*%s' % vig, page) else '** NO'))
print('  page.tsx lo usa por omision         : %s'
      % ('si' if ('?? ' + vig) in page else '** NO'))

# El archivado no debe dejar el simbolo anterior exportado ni duplicado
dobles = [n for n in set(re.findall(r'const (REPORTE_\w+): ChurnReporte', page))
          if page.count('const %s: ChurnReporte' % n) > 1]
print('  simbolos duplicados en page.tsx     : %s' % (dobles or 'ninguno'))
print('  el corte anterior quedo archivado   : %s'
      % ('si' if 'const REPORTE_S19_SEPTIEMBRE_2026: ChurnReporte' in page else '** NO'))

# ── Cifras del corte vigente ────────────────────────────────────────────────
def num(campo):
    m = re.search(campo + r':\s*([0-9.]+)', actual)
    return float(m.group(1)) if m else None

def suma(bloque, campo):
    m = re.search(bloque + r':\s*\[(.*?)\n  \]', actual, re.S)
    if not m:
        return None
    return round(sum(float(x) for x in re.findall(campo + r':\s*([0-9.]+)', m.group(1))), 2)

print()
print('=== CIFRAS DEL CORTE VIGENTE ===')
pruebas = [
    ('cartera Activo',  suma('pendientes', 'monto'),        num('pendientesTotalReal')),
    ('downgrades',      suma('downgrades', 'perdida'),      num('downgradeTotalReal')),
    ('suspendidos',     suma('suspendidos', 'importe'),     num('suspendidosTotalReal')),
]
for etq, calc, decl in pruebas:
    ok = calc is not None and decl is not None and abs(calc - decl) < 0.01
    print('  %-16s suma %14s   declarado %14s   %s'
          % (etq, format(calc, ',') if calc is not None else '—',
             format(decl, ',') if decl is not None else '—',
             'cuadra' if ok else '** REVISAR'))

# Las filas de CIERRE —las que agrupan «el resto de la cartera»— tienen que
# empezar con «+»: lib/atlas-context.ts filtra por ese prefijo para no pasarle
# un total al modelo como si fuera un cliente. Sin el «+», Atlas reporta un
# cliente llamado «Resto de la cartera» con el monto agregado. Paso por ahi el
# 15 sep 2026 y lo detecte antes de publicar; queda comprobado de aqui en
# adelante.
m = re.search(r'pendientes:\s*\[(.*?)\n  \]', actual, re.S)
sospechosas = []
if m:
    for cli in re.findall(r"cliente:\s*'([^']+)'", m.group(1)):
        esCierre = re.search(r'\brest\w|\badicional\w|\botras? cuentas\b|no desglosa', cli, re.I)
        if esCierre and not cli.startswith('+'):
            sospechosas.append(cli[:70])
print()
print('=== FILAS DE CIERRE (deben empezar con «+» para que Atlas las ignore) ===')
print('  sin el prefijo: %s' % (sospechosas or 'ninguna'))

ant = suma('antiguedadSaldos', 'monto')
porVencer = float(re.search(r"'Por vencer',\s*monto:\s*([0-9.]+)", actual).group(1))
vencido = round(ant - porVencer, 2)
print('  %-16s tramos %12s   por vencer %13s   vencido %s'
      % ('antigüedad', format(ant, ','), format(porVencer, ','), format(vencido, ',')))
print('  vencido == suspendidos: %s'
      % ('si' if abs(vencido - (num('suspendidosTotalReal') or 0)) < 0.01 else '** no'))
