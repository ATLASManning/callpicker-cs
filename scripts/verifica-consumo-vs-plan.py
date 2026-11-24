# -*- coding: utf-8 -*-
u"""QUE EL `.html` DE «CONSUMO VS PLAN CONTRATADO» SEA LO QUE DICE SER.

   Un reporte que se entrega como archivo no tiene servidor que lo desmienta:
   si trae una dependencia externa, abre bien HOY —con conexion— y sale en
   blanco el dia que alguien lo abre en un avion. Y si un archivo individual
   lleva por dentro cuentas de otro asesor, la pantalla no lo muestra y el
   dato igual viajo. Las dos cosas se comprueban leyendo los BYTES.

   LO QUE COMPRUEBA
   1. AUTOCONTENCION — ni una referencia externa, ni una API de red.
   2. SIN SECRETOS — ni claves, ni tokens, ni URL de Supabase.
   3. SIN DATO PERSONAL — ni telefonos, ni correos, ni llamadas individuales.
   4. EL DATO INCRUSTADO CIERRA — el semaforo suma contra las filas, cada
      nivel casa con su utilizacion, y excedente y utilizacion no se
      contradicen. Se recalcula desde el JSON del archivo, no se cree su
      resumen.
   5. CONTROL NEGATIVO DEL REPARTO — un archivo `--asesor` no contiene
      ninguna cuenta ajena: ni nombre, ni CID, ni consecutivo, ni en los
      totales. Se comprueba contra la cartera COMPLETA, que es la unica forma
      de saber que falta lo que tiene que faltar.

   USO
       python -I scripts/verifica-consumo-vs-plan.py D:\\Archivos\\Reportes
       python -I scripts/verifica-consumo-vs-plan.py D:\\...\\consumo-vs-plan.html
       python -I scripts/verifica-consumo-vs-plan.py --autoprueba

   Sale 1 si algo falla. Las credenciales se leen de `.env.local` y NO se
   imprimen.
"""
import glob
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

FALLOS = []


def ok(cond, que, extra=u''):
    print(u'  %s  %s%s' % (u'ok  ' if cond else u'FALLA', que,
                           u'   %s' % extra if extra else u''))
    if not cond:
        FALLOS.append(que)
    return cond


# Lo que convertiria el archivo en dependiente de la red.
EXTERNAS = [
    (r'<script[^>]+\bsrc\s*=', u'<script src=>'),
    (r'<link[^>]+rel\s*=\s*["\']?stylesheet', u'<link rel=stylesheet>'),
    (r'@import\b', u'@import de CSS'),
    (r'<img[^>]+\bsrc\s*=', u'<img src=>'),
    (r'<iframe\b', u'<iframe>'),
    (r'\burl\(\s*["\']?(?:https?:)?//', u'url() a un host'),
    (r'\bsrcset\s*=', u'srcset'),
    (r'<(?:audio|video|embed|object|source|track)\b', u'medio externo'),
    (r'rel\s*=\s*["\']?(?:preconnect|dns-prefetch|preload|prefetch)', u'preconnect/preload'),
    # Estas dos SOLO fallan bajo `file://`, que es justo como se va a abrir:
    # un modulo ES se pide con CORS y el origen `null` de un archivo local lo
    # rechaza, asi que el documento saldria sin una sola grafica y sin error
    # visible en la pagina.
    (r'<script[^>]+type\s*=\s*["\']?module', u'<script type=module> (CORS bajo file://)'),
    (r'\bcrossorigin\b', u'crossorigin (CORS bajo file://)'),
]
RED = [
    (r'\bfetch\s*\(', u'fetch()'),
    (r'\bXMLHttpRequest\b', u'XMLHttpRequest'),
    (r'\bEventSource\b', u'EventSource'),
    (r'\bWebSocket\b', u'WebSocket'),
    (r'\bnavigator\s*\.\s*sendBeacon\b', u'sendBeacon'),
    (r'\bnew\s+Worker\b', u'Worker'),
    (r'\bimport\s*\(', u'import() dinamico'),
    (r'\bserviceWorker\b', u'serviceWorker'),
    (r'\bnavigator\s*\.\s*geolocation\b', u'geolocation'),
    (r'\bgtag\b|\bga\s*\(|googletagmanager|analytics', u'telemetria'),
]
SECRETOS = [
    (r'eyJ[A-Za-z0-9_-]{20,}\.', u'un JWT (clave de Supabase)'),
    (r'\bsupabase\.co\b', u'la URL de Supabase'),
    (r'SERVICE_ROLE|SUPABASE_[A-Z_]*KEY|apikey', u'nombre de variable de credencial'),
    (r'\bBearer\s+[A-Za-z0-9._-]{12,}', u'un Bearer'),
    (r'\bsk-[A-Za-z0-9]{16,}', u'una clave sk-'),
]
PERSONALES = [
    (r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', u'un correo'),
    (r'(?<![\d.,>])(?:\+?52[\s-]?)?(?:\(\d{2,3}\)[\s-]?|\d{2,3}[\s-])\d{3,4}[\s-]\d{4}(?![\d.,<])',
     u'algo con forma de telefono'),
]
# NO se busca la PALABRA «grabacion»: el propio reporte declara en su apartado
# de confidencialidad que no incluye grabaciones, y una busqueda de texto no
# distingue el dato de la frase que dice que no esta. Costo dos falsos
# positivos. Lo que se busca es el MEDIO: un archivo de audio o video, por
# referencia o incrustado. Con cero URL y cero elemento de medio ya
# comprobados, esto cierra la puerta.
MEDIOS = [
    (r'\bdata:(?:audio|video|image)/', u'un medio incrustado como data: URI'),
    (r'\bdata:[a-z]+/[a-z0-9.+-]+;base64,', u'cualquier data: URI en base64'),
    (r'\.(?:mp3|wav|ogg|oga|m4a|aac|flac|mp4|webm|mov|avi)\b', u'un archivo de audio o video'),
]


def cartera_completa():
    env = {}
    for line in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"')
    import urllib.request
    url = env['NEXT_PUBLIC_SUPABASE_URL']
    key = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['SUPABASE_SERVICE_KEY']
    r = urllib.request.Request(
        url + '/rest/v1/cuentas?select=consecutivo,empresa,asesor,estado,cid&limit=2000',
        headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(r, timeout=180) as x:
        c = json.loads(x.read().decode('utf-8', 'replace'))
    return [z for z in c if (z.get('estado') or '') in ('activo', 'en_riesgo')]


RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def clasifica(u_):
    if u_ >= 110:
        return 'sobre_critico'
    if u_ > 100:
        return 'sobre'
    if u_ == 100:
        return 'limite'
    if u_ >= 90:
        return 'cerca'
    if u_ >= 50:
        return 'rango'
    if u_ >= 25:
        return 'subutil'
    return 'bajo_critico'


def extrae_datos(txt):
    u"""El JSON que el archivo incrusta. Se busca `const D = {...};` y se
       recorta contando llaves, porque una expresion regular codiciosa se
       lleva medio documento."""
    i = txt.find('const D = {')
    if i < 0:
        return None
    j = txt.index('{', i)
    prof, k, dentro, esc = 0, j, False, False
    while k < len(txt):
        c = txt[k]
        if dentro:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                dentro = False
        elif c == '"':
            dentro = True
        elif c == '{':
            prof += 1
        elif c == '}':
            prof -= 1
            if prof == 0:
                return json.loads(txt[j:k + 1])
        k += 1
    return None


def revisa(ruta, todas=None):
    print(u'\n  %s' % ruta)
    print(u'  ' + u'-' * 70)
    txt = io.open(ruta, encoding='utf-8').read()
    print(u'  %s KB · %s caracteres' % (u'{:,.0f}'.format(len(txt.encode('utf-8')) / 1024.0),
                                        u'{:,}'.format(len(txt))))

    print(u'\n  1. AUTOCONTENCION')
    for rx, nombre in EXTERNAS:
        m = re.search(rx, txt, re.I)
        ok(not m, u'ninguna referencia externa: %s' % nombre,
           u'encontrado: %s' % txt[max(0, m.start() - 20):m.end() + 40].replace('\n', ' ') if m else u'')
    for rx, nombre in RED:
        m = re.search(rx, txt, re.I)
        ok(not m, u'ninguna API de red: %s' % nombre,
           u'encontrado cerca de: %s' % txt[max(0, m.start() - 30):m.end() + 30].replace('\n', ' ') if m else u'')
    urls = sorted(set(re.findall(r'https?://[^\s"\'<>)]+', txt)))
    ok(not urls, u'cero URL http(s) en todo el archivo',
       u'hay %d: %s' % (len(urls), u', '.join(urls[:4])) if urls else u'')
    ok(txt.lstrip().startswith('<!DOCTYPE html'), u'empieza con DOCTYPE (no entra en quirks mode)')
    ok('<style>' in txt and '<script>' in txt, u'CSS y JS van en linea')

    print(u'\n  2. SIN SECRETOS')
    for rx, nombre in SECRETOS:
        m = re.search(rx, txt)
        ok(not m, u'no aparece %s' % nombre,
           u'en: %s' % txt[max(0, m.start() - 15):m.end() + 15].replace('\n', ' ') if m else u'')

    print(u'\n  3. SIN DATO PERSONAL NI DETALLE INNECESARIO')
    for rx, nombre in PERSONALES:
        hits = sorted(set(re.findall(rx, txt)))
        ok(not hits, u'no aparece %s' % nombre,
           u'%d: %s' % (len(hits), u', '.join(hits[:4])) if hits else u'')
    for rx, nombre in MEDIOS:
        m = re.search(rx, txt, re.I)
        ok(not m, u'no hay %s' % nombre,
           u'en: %s' % txt[max(0, m.start() - 20):m.end() + 20].replace('\n', ' ') if m else u'')

    print(u'\n  4. EL DATO INCRUSTADO CIERRA')
    D = extrae_datos(txt)
    if not ok(D is not None, u'se puede leer el JSON incrustado'):
        return
    filas = D['filas']
    ok(len(filas) == D['asignadas'],
       u'las filas incrustadas son las cuentas asignadas',
       u'%d filas vs asignadas=%d' % (len(filas), D['asignadas']))
    niveles = {n['k'] for n in D['niveles']}
    ok(all(f['sem'] in niveles for f in filas), u'todo nivel existe en la tabla de niveles')
    malos = [f['emp'] for f in filas
             if f['sem'] != 'no_evaluable' and f['sem'] != clasifica(f['u'])]
    ok(not malos, u'cada nivel casa con su utilizacion SIN REDONDEAR',
       u'%d no casan: %s' % (len(malos), malos[:3]) if malos else u'')
    contra = [f['emp'] for f in filas
              if f['sem'] != 'no_evaluable' and (f['exc'] > 0) != (f['u'] > 100)]
    ok(not contra, u'excedente y utilizacion no se contradicen',
       u'%s' % contra[:3] if contra else u'')
    cien = [f for f in filas if f['sem'] != 'no_evaluable' and f['u'] == 100]
    ok(all(f['exc'] == 0 and f['sem'] == 'limite' for f in cien),
       u'un 100% exacto es «limite alcanzado» y sin excedente',
       u'%d casos' % len(cien))
    # un cero medido NO es un hueco
    ceros = [f for f in filas if f['sem'] != 'no_evaluable' and f['c'] == 0]
    ok(all(f['u'] == 0 and f['b'] > 0 for f in ceros),
       u'un consumo cero medido lleva base y publica 0%', u'%d ceros' % len(ceros))
    # la serie no fabrica ceros
    inventados = [(f['emp'], p['m']) for f in filas for p in f['pts']
                  if p['ok'] and p['b'] in (None, 0)]
    ok(not inventados, u'ningun punto comparable sin limite', u'%s' % inventados[:3])
    # la variacion solo existe cuando el plan y el limite no cambiaron
    mal_var = []
    for f in filas:
        if f['sem'] == 'no_evaluable' or f['var'] is None:
            continue
        comp = [p for p in f['pts'] if p['ok']]
        if len(comp) >= 2 and (comp[-1]['pl'] != comp[-2]['pl'] or comp[-1]['b'] != comp[-2]['b']):
            mal_var.append(f['emp'])
    ok(not mal_var, u'ninguna variacion pp cruza un cambio de plan o de limite',
       u'%s' % mal_var[:3] if mal_var else u'')
    # el agregado es suma de minutos, no promedio de porcentajes
    bien = True
    for a in D['agg']:
        c = sum(p['c'] for f in filas for p in f['pts'] if p['m'] == a['m'] and p['ok'])
        b = sum(p['b'] for f in filas for p in f['pts'] if p['m'] == a['m'] and p['ok'])
        n = sum(1 for f in filas for p in f['pts'] if p['m'] == a['m'] and p['ok'])
        if round(c) != round(a['c']) or round(b) != round(a['b']) or n != a['n']:
            bien = False
            print(u'      %s: archivo c=%s b=%s n=%s · recalculado c=%s b=%s n=%s'
                  % (a['m'], a['c'], a['b'], a['n'], c, b, n))
    ok(bien, u'la serie agregada es la suma de los puntos comparables')
    ok(all(0 <= a['n'] <= len(filas) for a in D['agg']),
       u'la cobertura de cada ciclo no excede el universo')

    print(u'\n  5. REPARTO — CONTROL NEGATIVO')
    solo = D.get('soloAsesor')
    if not solo:
        ases = sorted({f['ase'] for f in filas})
        ok(len(ases) > 1 or len(filas) > 0,
           u'consolidado: lleva las %d cuentas de %s' % (len(filas), u', '.join(ases)))
        print(u'      (es el consolidado de Direccion; el control negativo aplica'
              u' a los archivos --asesor)')
    else:
        ok(all(f['ase'] == solo for f in filas),
           u'todas las filas incrustadas son de %s' % solo)
        ok(D['asesores'] == [solo], u'el selector de asesor no ofrece a nadie mas',
           u'%s' % D['asesores'])
        if todas is None:
            print(u'      *** sin la cartera completa no se puede probar la AUSENCIA.')
            FALLOS.append(u'control negativo sin cartera de referencia')
        else:
            ajenas = [c for c in todas if (c.get('asesor') or '') != solo]
            fuga = []
            for c in ajenas:
                emp = (c.get('empresa') or u'').strip()
                cid = str(c.get('cid') or u'').strip()
                cons = (c.get('consecutivo') or u'').strip()
                if emp and len(emp) > 4 and emp in txt:
                    fuga.append((u'nombre', emp))
                if cid and ('"%s"' % cid) in txt:
                    fuga.append((u'CID', cid))
                if cons and ('"%s"' % cons) in txt:
                    fuga.append((u'consecutivo', cons))
            ok(not fuga, u'NINGUNA de las %d cuentas ajenas aparece en los bytes'
               % len(ajenas), u'FUGA: %s' % fuga[:6] if fuga else u'')
            ok(str(len(todas)) not in re.findall(r'"asignadas":\s*(\d+)', txt),
               u'el total de la cartera completa (%d) no viaja como total' % len(todas),
               u'asignadas=%s' % re.findall(r'"asignadas":\s*(\d+)', txt))


def autoprueba():
    print(u'\n  AUTOPRUEBA — el verificador tiene que saber FALLAR')
    import tempfile
    d = tempfile.mkdtemp()
    casos = [
        (u'con <script src>', u'<!DOCTYPE html><html><script src="//x/y.js"></script>'
                              u'<style>a{}</style><script>const D = {"filas":[],"asignadas":0,'
                              u'"niveles":[],"agg":[],"asesores":[]};</script></html>'),
        (u'con fetch()', u'<!DOCTYPE html><html><style>a{}</style><script>'
                         u'fetch("/x");const D = {"filas":[],"asignadas":0,"niveles":[],'
                         u'"agg":[],"asesores":[]};</script></html>'),
        (u'con un correo', u'<!DOCTYPE html><html><style>a{}</style><script>'
                           u'const D = {"filas":[],"asignadas":0,"niveles":[],"agg":[],'
                           u'"asesores":[]};</script></html><p>x@y.com</p>'),
        (u'con el nivel mal asignado',
         u'<!DOCTYPE html><html><style>a{}</style><script>const D = {"filas":'
         u'[{"emp":"X","ase":"A","sem":"rango","u":120,"b":10,"c":12,"exc":2,'
         u'"var":null,"pts":[]}],"asignadas":1,"niveles":[{"k":"rango"}],'
         u'"agg":[],"asesores":["A"]};</script></html>'),
        (u'con un <script type=module>, que solo falla bajo file://',
         u'<!DOCTYPE html><html><style>a{}</style><script type="module">'
         u'const D = {"filas":[],"asignadas":0,"niveles":[],"agg":[],'
         u'"asesores":[]};</script></html>'),
        (u'con un audio incrustado',
         u'<!DOCTYPE html><html><style>a{}</style><p>data:audio/mpeg;base64,AAAA</p>'
         u'<script>const D = {"filas":[],"asignadas":0,"niveles":[],"agg":[],'
         u'"asesores":[]};</script></html>'),
        (u'con una cuenta de otro asesor dentro de un archivo individual',
         u'<!DOCTYPE html><html><style>a{}</style><script>const D = {"filas":'
         u'[{"emp":"X","ase":"A","sem":"no_evaluable","u":null,"b":null,"c":null,'
         u'"exc":null,"var":null,"pts":[]},{"emp":"Y","ase":"B",'
         u'"sem":"no_evaluable","u":null,"b":null,"c":null,"exc":null,'
         u'"var":null,"pts":[]}],"asignadas":2,"niveles":[{"k":"no_evaluable"}],'
         u'"agg":[],"asesores":["A","B"],"soloAsesor":"A"};</script></html>'),
        (u'con el agregado que no es la suma de sus puntos',
         u'<!DOCTYPE html><html><style>a{}</style><script>const D = {"filas":'
         u'[{"emp":"X","ase":"A","sem":"rango","u":50,"b":100,"c":50,"exc":0,'
         u'"var":null,"pts":[{"m":"2026-01","b":100,"c":50,"u":50,"ok":1,'
         u'"pl":"P","sem":"rango"}]}],"asignadas":1,'
         u'"niveles":[{"k":"rango"}],"agg":[{"m":"2026-01","c":999,"b":100,"n":1}],'
         u'"asesores":["A"]};</script></html>'),
    ]
    global FALLOS
    base = len(FALLOS)
    for nombre, cuerpo in casos:
        p = os.path.join(d, re.sub(r'\W+', '_', nombre) + '.html')
        io.open(p, 'w', encoding='utf-8').write(cuerpo)
        antes = len(FALLOS)
        print(u'\n  ── caso que DEBE fallar: %s' % nombre)
        revisa(p)
        detecto = len(FALLOS) > antes
        print(u'  %s  el verificador lo detecto' % (u'ok  ' if detecto else u'FALLA'))
        if not detecto:
            print(u'  *** un verificador que no detecta esto no sirve de puerta.')
            return 1
    FALLOS = FALLOS[:base]   # los fallos provocados no son fallos reales
    print(u'\n  Los %d casos sembrados se detectaron. El verificador muerde.' % len(casos))
    return 0


def main():
    args = [a for a in sys.argv[1:] if a != '--autoprueba']
    if '--autoprueba' in sys.argv:
        return autoprueba()
    if not args:
        args = [os.path.join('D:' + os.sep, 'Archivos', 'Reportes')]
    rutas = []
    for a in args:
        if os.path.isdir(a):
            rutas += sorted(glob.glob(os.path.join(a, 'consumo-vs-plan*.html')))
        else:
            rutas.append(a)
    if not rutas:
        print(u'  no hay ningun consumo-vs-plan*.html en %s' % args)
        return 2
    todas = None
    if any('consumo-vs-plan-' in os.path.basename(r) for r in rutas):
        todas = cartera_completa()
        print(u'  cartera de referencia: %d cuentas vivas (para el control negativo)'
              % len(todas))
    print(u'\n  VERIFICACION DE «CONSUMO VS PLAN CONTRATADO»')
    print(u'  ' + u'=' * 70)
    for r in rutas:
        revisa(r, todas)
    print(u'\n  ' + u'=' * 70)
    if FALLOS:
        print(u'  *** %d FALLAS:' % len(FALLOS))
        for f in FALLOS:
            print(u'      · %s' % f)
        return 1
    print(u'  TODO EN VERDE en %d archivo(s).' % len(rutas))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
