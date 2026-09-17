"""Corrige el choque de nombres y valida la sintaxis del modulo Buzon.

   No hay Node local, asi que la compilacion real no se puede correr aqui. Lo
   que si se puede comprobar sin TypeScript:
     · que no queden choques entre un tipo importado y un componente local
     · que llaves, parentesis y corchetes cierren, ignorando cadenas y
       comentarios (un contador ingenuo se atraganta con las llaves dentro de
       los literales de estilo de JSX)
     · que todo lo que se importa de lib/buzon exista de verdad
"""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

R = r'D:\Windows\Projects\callpicker-cs'
PAG = R + r'\app\buzon\page.tsx'

# ── El choque: `type Area` importado y `function Area` declarado ───────────
t = io.open(PAG, encoding='utf-8').read()
if 'function Area(' in t:
    t = t.replace('function Area({ value, onChange, filas = 3 }',
                  'function AreaTexto({ value, onChange, filas = 3 }', 1)
    t = t.replace('<Area value=', '<AreaTexto value=')
    io.open(PAG, 'w', encoding='utf-8').write(t)
    print('choque «Area» corregido -> AreaTexto')
else:
    print('sin choque «Area» (ya estaba corregido)')
print('  quedan: function Area( = %d · <Area  = %d · AreaTexto = %d'
      % (t.count('function Area('), t.count('<Area '), t.count('AreaTexto')))


def balance(src):
    """Cierre de delimitadores ignorando cadenas, plantillas y comentarios."""
    par = {'(': ')', '[': ']', '{': '}'}
    cierra = {v: k for k, v in par.items()}
    pila, i, modo = [], 0, None
    BARRA = chr(92)
    while i < len(src):
        c = src[i]
        sig = src[i + 1] if i + 1 < len(src) else ''
        if modo in ("'", '"', '`'):
            if c == BARRA:
                i += 2; continue
            if c == modo:
                modo = None
        elif modo == 'linea':
            if c == '\n':
                modo = None
        elif modo == 'bloque':
            if c == '*' and sig == '/':
                modo = None; i += 2; continue
        else:
            if c in ("'", '"', '`'):
                modo = c
            elif c == '/' and sig == '/':
                modo = 'linea'; i += 1
            elif c == '/' and sig == '*':
                modo = 'bloque'; i += 1
            elif c in par:
                pila.append((c, i))
            elif c in cierra:
                if not pila:
                    return 'sobra %r en la posicion %d' % (c, i)
                ab, pos = pila.pop()
                if par[ab] != c:
                    return 'se abrio %r en %d y se cerro con %r en %d' % (ab, pos, c, i)
        i += 1
    if pila:
        return 'sin cerrar: %s' % [(x[0], x[1]) for x in pila[:3]]
    return 'balanceado'


ARCHIVOS = ['app/buzon/page.tsx', 'lib/buzon.ts', 'app/api/buzon/route.ts',
            'components/Sidebar.tsx', 'components/PageTracker.tsx']
print()
print('=== BALANCE DE DELIMITADORES ===')
for f in ARCHIVOS:
    src = io.open(R + '\\' + f.replace('/', '\\'), encoding='utf-8').read()
    print('  %-32s %s' % (f, balance(src)))

# ── Lo que la pagina importa de lib/buzon, ¿existe? ────────────────────────
lib = io.open(R + r'\lib\buzon.ts', encoding='utf-8').read()
m = re.search(r"import \{([^}]+)\} from '@/lib/buzon'", t, re.S)
print()
print('=== IMPORTS DESDE lib/buzon ===')
if not m:
    print('  ** no se encontro el import')
else:
    faltan = []
    for nombre in [x.strip().replace('type ', '') for x in m.group(1).split(',') if x.strip()]:
        existe = re.search(r'export (const|function|type|interface) %s\b' % re.escape(nombre), lib)
        if not existe:
            faltan.append(nombre)
    print('  importa %d simbolos · faltan en lib: %s'
          % (len(m.group(1).split(',')), faltan or 'ninguno'))

# ── Rutas registradas ─────────────────────────────────────────────────────
sb = io.open(R + r'\components\Sidebar.tsx', encoding='utf-8').read()
pt = io.open(R + r'\components\PageTracker.tsx', encoding='utf-8').read()
print()
print('=== REGISTRO ===')
print('  Sidebar tiene /buzon      : %s' % ("href: '/buzon'" in sb))
print('  Sidebar importa Inbox     : %s' % bool(re.search(r'\bInbox\b', sb.split('from')[0])))
print('  PageTracker tiene /buzon  : %s' % ("'/buzon'" in pt))
