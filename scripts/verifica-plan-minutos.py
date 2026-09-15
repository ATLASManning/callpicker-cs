"""Replica lib/plan-minutos.ts sobre el archivo real y compara contra el %% del archivo.

   Dos cosas que este script tiene que probar:
     1. los planes por extensiones dejan de publicar porcentajes absurdos
     2. los planes con bolsa REAL conservan su bolsa — LI Financiera es el caso
        testigo: «50 Extensiones Visibilidad y Control IP» con 12,500 minutos de
        verdad y un 6.82%% correcto. Si el arreglo se la toca, esta mal.
"""
import sys, io, re, collections, openpyxl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

MIN_POR_EXT = 1500
MIN_POR_EXT_PLAUSIBLE = 50
RX_EXT = re.compile(r'(\d+)\s*(?:extensi[oó]n(?:es)?|ext\b)', re.I)
RX_EXT_ABREV = re.compile(r'^(\d+)\s+\S.*\bIL\b', re.I)
RX_SIN_VOZ = re.compile(r'\bchat\b|\bagentes?\s+cp\b|sin\s+saldo|n[uú]meros?\s+virtuales?|whatsapp', re.I)
BOLSA_MINIMA = 3


def base_minutos(plan, incl):
    """Replica exacta de baseMinutos() en TypeScript."""
    nombre = plan or ''
    m = RX_EXT.search(nombre) or RX_EXT_ABREV.search(nombre)
    ext = int(m.group(1)) if m else None
    if RX_SIN_VOZ.search(nombre) and not ext:
        return None, ext, 'sin_medicion'
    if ext and ext > 0:
        porExt = (incl / ext) if incl > 0 else 0
        if porExt >= MIN_POR_EXT_PLAUSIBLE:
            return incl, ext, 'bolsa'
        return ext * MIN_POR_EXT, ext, 'extensiones'
    if incl >= BOLSA_MINIMA:
        return incl, ext, 'bolsa'
    return None, ext, 'sin_medicion'


wb = openpyxl.load_workbook(r'D:\Windows\Projects\callpicker-cs\data\cortes-facturacion.xlsx',
                            data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
i = {n: cab.index(n) for n in ('CID', 'Nombre del Cliente', 'Nombre del Plan',
                               'Minutos Incluidos', 'Minutos Consumidos', '% Consumo')}

origen = collections.Counter()
absurdosAntes = absurdosDespues = 0
liFin = []
cambian = []
for r in it:
    f = {k: r[v] for k, v in i.items()}
    plan = str(f['Nombre del Plan'] or '')
    incl = f['Minutos Incluidos'] or 0
    cons = f['Minutos Consumidos'] or 0
    archivo = f['% Consumo'] or 0
    base, ext, org = base_minutos(plan, incl)
    origen[org] += 1
    nuevo = (100 * cons / base) if base else None
    if archivo > 1000:
        absurdosAntes += 1
    if nuevo is not None and nuevo > 1000:
        absurdosDespues += 1
    if 'li financiera' in str(f['Nombre del Cliente'] or '').lower():
        liFin.append((plan, incl, cons, archivo, base, nuevo, org))
    if nuevo is not None and abs(nuevo - archivo) > 1:
        cambian.append((abs(nuevo - archivo), plan, incl, cons, archivo, base, nuevo, org))

print('=== de dónde sale la base de cada corte ===')
for k, n in origen.most_common():
    print('  %-14s %s cortes' % (k, format(n, ',')))

print()
print('=== porcentajes absurdos (> 1000%%) ===')
print('  con el %% del archivo : %s' % format(absurdosAntes, ','))
print('  con la regla         : %s' % format(absurdosDespues, ','))

print()
print('=== CASO TESTIGO · LI Financiera (bolsa real, NO debe cambiar) ===')
print('  %-44s %7s %6s %8s %7s %8s %s' % ('plan', 'incl', 'cons', 'archivo', 'base', 'nuevo', 'origen'))
for plan, incl, cons, archivo, base, nuevo, org in liFin[:4]:
    print('  %-44s %7s %6s %7s%% %7s %7.2f%% %s'
          % (plan[:44], incl, cons, archivo, base, nuevo, org))
igual = all(abs(x[5] - x[3]) < 0.05 for x in liFin if x[5] is not None)
print('  -> %s' % ('INTACTA: el nuevo %% coincide con el del archivo'
                   if igual else '** SE MOVIO, revisar'))

print()
print('=== los cortes que más cambian ===')
print('  %-42s %6s %7s %11s %8s %9s' % ('plan', 'incl', 'cons', 'archivo', 'base', 'nuevo'))
for d, plan, incl, cons, archivo, base, nuevo, org in sorted(cambian, reverse=True)[:8]:
    print('  %-42s %6s %7s %10s%% %8s %8.1f%%' % (plan[:42], incl, cons, archivo, base, nuevo))
print()
print('  cortes cuyo %% cambia: %s de %s' % (format(len(cambian), ','), format(sum(origen.values()), ',')))
