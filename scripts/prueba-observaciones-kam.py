# -*- coding: utf-8 -*-
"""Replica lib/observaciones-kam.ts y lo prueba. Sin Node no hay otra forma.

   Se prueba AL REVES donde importa: se le mete lo que NO deberia parsear.
"""
import datetime
import io
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

MARCA = '━━'
RX_ENCABEZADO = re.compile(
    r'^[ \t]*━+[ \t]*(\d{4})-(\d{2})-(\d{2})[ \t]*(?:·[ \t]*Semana[ \t]*(\d+))?'
    r'[ \t]*(?:·[ \t]*([^━\n]*?))?[ \t]*━*[ \t]*$')
RX_AUTOMATICA = re.compile(r'^\s*(?:🔴|⚠️|🤖|\[Detectado autom)')
RX_SIN_FECHA = re.compile(
    r'^[ \t]*━+[ \t]*sin fecha(?:[ \t]*·[^━\n]*)?[ \t]*━*[ \t]*$', re.I)
CAB_SIN_FECHA = '━━ sin fecha · anterior a la bitacora ━━'


def semana_iso(f):
    """Port literal del TS, para comprobarlo contra isocalendar()."""
    a, m, d = [int(x) for x in f.split('-')]
    dt = datetime.date(a, m, d)
    dow = (dt.weekday())          # lunes = 0, igual que (getUTCDay()+6)%7
    dt = dt + datetime.timedelta(days=-dow + 3)
    pj = datetime.date(dt.year, 1, 4)
    dowpj = pj.weekday()
    pj = pj + datetime.timedelta(days=-dowpj + 3)
    return 1 + round((dt - pj).days / 7.0)


def encabezado(f, autor=None):
    partes = [f, 'Semana %d' % semana_iso(f)]
    if (autor or '').strip():
        partes.append(autor.strip())
    return '%s %s %s' % (MARCA, ' · '.join(partes), MARCA)


def parse(texto):
    t = (texto or '').replace('\r\n', '\n').strip()
    if not t or t == '0':
        return []
    entradas, actual, sueltas = [], None, []

    def cerrar(e, cuerpo):
        e['cuerpo'] = '\n'.join(cuerpo).strip()
        e['automatica'] = bool(RX_AUTOMATICA.match(e['cuerpo']))
        entradas.append(e)

    for ln in t.split('\n'):
        sf = bool(RX_SIN_FECHA.match(ln))
        m = None if sf else RX_ENCABEZADO.match(ln)
        if m or sf:
            if actual:
                cerrar(actual, sueltas)
            elif '\n'.join(sueltas).strip():
                c = '\n'.join(sueltas).strip()
                entradas.append({'fecha': None, 'semana': None, 'autor': None,
                                 'cuerpo': c, 'automatica': bool(RX_AUTOMATICA.match(c))})
            actual = ({'fecha': '%s-%s-%s' % (m.group(1), m.group(2), m.group(3)),
                       'semana': int(m.group(4)) if m.group(4) else None,
                       'autor': (m.group(5) or '').strip() or None,
                       'cuerpo': '', 'automatica': False} if m else
                      {'fecha': None, 'semana': None, 'autor': None,
                       'cuerpo': '', 'automatica': False})
            sueltas = []
            continue
        sueltas.append(ln)

    if actual:
        cerrar(actual, sueltas)
    elif '\n'.join(sueltas).strip():
        c = '\n'.join(sueltas).strip()
        entradas.append({'fecha': None, 'semana': None, 'autor': None,
                         'cuerpo': c, 'automatica': bool(RX_AUTOMATICA.match(c))})
    return [e for e in entradas if e['cuerpo'] != '']


def anteponer(previo, cuerpo, autor=None, fecha=None):
    limpio = (cuerpo or '').strip()
    if not limpio:
        return previo or ''
    anterior = (previo or '').strip()
    bloque = '%s\n%s' % (encabezado(fecha, autor), limpio)
    if not anterior or anterior == '0':
        return bloque
    primera = anterior.split('\n')[0]
    ya = bool(RX_SIN_FECHA.match(primera)) or bool(RX_ENCABEZADO.match(primera))
    cola = anterior if ya else '%s\n%s' % (CAB_SIN_FECHA, anterior)
    return '%s\n\n%s' % (bloque, cola)


fallos = []


def ok(cond, etq, extra=''):
    print('  %-58s %s' % (etq, 'OK' if cond else '*** FALLA'), end='')
    print('' if cond else ('  ' + str(extra)))
    if not cond:
        fallos.append(etq)


print('=== 1. Semana ISO contra datetime.isocalendar() ===')
d = datetime.date(2024, 1, 1)
malas = []
while d <= datetime.date(2030, 12, 31):
    f = d.isoformat()
    if semana_iso(f) != d.isocalendar()[1]:
        malas.append((f, semana_iso(f), d.isocalendar()[1]))
    d += datetime.timedelta(days=1)
ok(not malas, '2,557 fechas de 2024 a 2030 coinciden', malas[:4])
ok(semana_iso('2026-09-21') == datetime.date(2026, 9, 21).isocalendar()[1],
   '21 sep 2026 -> semana %d' % semana_iso('2026-09-21'))
ok(semana_iso('2027-01-01') == datetime.date(2027, 1, 1).isocalendar()[1],
   '1 ene 2027 (cae en la semana del anio anterior)')

print('\n=== 2. Vacios y marcadores ===')
ok(parse(None) == [], 'None -> sin entradas')
ok(parse('') == [], 'cadena vacia -> sin entradas')
ok(parse('   ') == [], 'solo espacios -> sin entradas')
ok(parse('0') == [], 'el marcador «0» -> sin entradas (no es contenido)')

print('\n=== 3. Texto viejo sin separador: NO se pierde ===')
viejo = 'Relacion estable. Compromiso: enviar cotizacion en octubre.'
e = parse(viejo)
ok(len(e) == 1, 'una sola entrada')
ok(e[0]['fecha'] is None, 'se marca sin fecha, no se le inventa una')
ok(e[0]['cuerpo'] == viejo, 'el cuerpo llega intacto')

print('\n=== 4. Anteponer sobre texto viejo ===')
t = anteponer(viejo, 'Comportamiento: consumo al 78%.\nTickets: 2 abiertos.',
              'Cecilia Ramirez', '2026-09-21')
e = parse(t)
ok(len(e) == 2, 'quedan dos entradas')
ok(e[0]['fecha'] == '2026-09-21', 'la nueva va PRIMERO')
ok(e[0]['autor'] == 'Cecilia Ramirez', 'guarda el autor')
ok(e[0]['semana'] == semana_iso('2026-09-21'), 'guarda la semana')
ok(e[1]['fecha'] is None and e[1]['cuerpo'] == viejo, 'lo viejo sigue abajo e intacto')

print('\n=== 5. Varias entradas y sin autor ===')
t2 = anteponer(t, 'Reunion interna: se aprueba upgrade.', None, '2026-09-28')
e = parse(t2)
ok(len(e) == 3, 'tres entradas')
ok(e[0]['autor'] is None, 'sin autor no rompe el encabezado')
ok([x['fecha'] for x in e] == ['2026-09-28', '2026-09-21', None], 'orden nuevo -> viejo')

print('\n=== 6. Ida y vuelta: lo escrito es lo que se lee ===')
cuerpo = 'Linea 1\nLinea 2 con · punto medio\nLinea 3'
e = parse(anteponer('', cuerpo, 'Ana', '2026-09-21'))
ok(len(e) == 1 and e[0]['cuerpo'] == cuerpo, 'cuerpo multilinea con · intacto')

print('\n=== 7. AL REVES: lo que NO debe parsearse como encabezado ===')
casos_no = [
    ('2026-09-21 revision con el cliente', 'una fecha suelta al inicio de linea'),
    ('--- 2026-09-21 ---', 'guiones en vez de la marca'),
    ('Se vence el 2026-09-21 el contrato', 'fecha a media frase'),
    ('━━ sin fecha aqui ━━', 'la marca pero sin fecha'),
    ('━━ 21-09-2026 ━━', 'fecha en formato dd-mm-yyyy'),
]
for texto, etq in casos_no:
    e = parse(texto)
    ok(len(e) == 1 and e[0]['fecha'] is None, 'NO es encabezado: %s' % etq, e)

print('\n=== 8. Tolerancia al editar a mano ===')
casos_si = [
    ('━━━━ 2026-09-21 ━━━━\ncuerpo', 'mas marcas de las que pone el codigo'),
    ('━━ 2026-09-21 ━━\ncuerpo', 'sin semana ni autor'),
    ('  ━━ 2026-09-21 · Semana 39 · Ana ━━  \ncuerpo', 'con espacios de sobra'),
    ('━━ 2026-09-21 · Semana 39 · Ana\ncuerpo', 'sin cerrar la marca'),
]
for texto, etq in casos_si:
    e = parse(texto)
    ok(len(e) == 1 and e[0]['fecha'] == '2026-09-21' and e[0]['cuerpo'] == 'cuerpo',
       'SI es encabezado: %s' % etq, e)

print('\n=== 9. Encabezado sin cuerpo no ensucia ===')
ok(parse(encabezado('2026-09-21', 'Ana')) == [], 'encabezado solo -> sin entradas')

print('\n=== 10. Nota automatica se reconoce ===')
nota = '🔴 [Detectado automaticamente] Posible intencion de cancelacion.'
e = parse(anteponer(viejo, nota, 'sistema', '2026-09-21'))
ok(e[0]['automatica'] is True, 'la marca como automatica')
ok(e[1]['automatica'] is False, 'la del asesor no')

print()
if fallos:
    print('  %d PRUEBA(S) FALLIDA(S):' % len(fallos))
    for f in fallos:
        print('    - %s' % f)
    raise SystemExit(1)
print('  Todas las pruebas pasan.')
