# -*- coding: utf-8 -*-
u"""DONDE VIVE «Claudia» ANTES DE SUSTITUIRLA POR «Erick».

   Encargo de direccion, 15 oct 2026: Erick Sanchez sustituye a Claudia
   Hernandez. Cambiar el nombre donde aparezca, y en Auditoria de cuentas el
   prefijo de consecutivo «C» pasa a «E».

   POR QUE SE MIDE ANTES
   ---------------------
   Porque el consecutivo NO es una etiqueta: es el IDENTIFICADOR con el que se
   citan las cuentas en auditorias, alertas, episodios y snapshots. «C21» esta
   escrito en prosa dentro de expedientes y en memoria. Un reemplazo a ciegas
   rompe referencias que nadie volveria a cruzar.

   Y porque el historico no se reescribe igual que el presente: `cuentas.asesor`
   dice de quien es la cartera HOY --eso cambia--, pero `alertas_episodios.
   asesor_apertura` dice quien la tenia cuando se abrio el episodio, que es un
   hecho del pasado y mover lo falsea.

   NO ESCRIBE NADA. Solo cuenta.

   USO
       python scripts/mide-alcance-claudia.py
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def entorno():
    d = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as fh:
        for ln in fh:
            ln = ln.strip()
            if ln and not ln.startswith('#') and '=' in ln:
                k, v = ln.split('=', 1)
                d[k.strip()] = v.strip().strip('"').strip("'")
    return d


def supabase(tabla, params):
    E = entorno()
    url = E['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + '/rest/v1/' + tabla
    key = E.get('SUPABASE_SERVICE_ROLE_KEY') or E['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    out, desde = [], 0
    while True:
        q = dict(params); q['offset'] = str(desde); q['limit'] = '1000'
        pide = urllib.request.Request(
            url + '?' + '&'.join('%s=%s' % (k, v) for k, v in q.items()),
            headers={'apikey': key, 'Authorization': 'Bearer ' + key,
                     'Accept': 'application/json'})
        try:
            lote = json.loads(urllib.request.urlopen(pide, timeout=60).read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            return {'_error': '%s %s' % (e.code, e.read().decode('utf-8', 'replace')[:120])}
        out.extend(lote)
        if len(lote) < 1000:
            return out
        desde += 1000


def main():
    print(u'\n  ALCANCE DEL CAMBIO: Claudia Hernandez -> Erick Sanchez')
    print(u'  ' + u'=' * 74)

    # ── 1. SUPABASE ────────────────────────────────────────────────────────
    print(u'\n  (1) EN LA BASE DE DATOS')
    cuentas = supabase('cuentas', {'select': 'id,consecutivo,empresa,asesor,estado'})
    if isinstance(cuentas, dict):
        print(u'      *** no pude leer `cuentas`: %s' % cuentas['_error']); sys.exit(2)
    suyas = [c for c in cuentas if str(c.get('asesor') or '').strip().lower().startswith('claudia')]
    vivas = [c for c in suyas if c.get('estado') in ('activo', 'en_riesgo')]
    conC = [c for c in cuentas if re.match(r'^C\d', str(c.get('consecutivo') or ''))]
    print(u'      cuentas con asesor Claudia ....... %d  (%d vivas)' % (len(suyas), len(vivas)))
    print(u'      consecutivos que empiezan por C .. %d' % len(conC))
    # ¿Coinciden los dos conjuntos? Si no, el prefijo y la cartera no dicen lo mismo.
    ids_suyas = {c['id'] for c in suyas}
    ids_conC = {c['id'] for c in conC}
    print(u'      en AMBOS conjuntos ............... %d' % len(ids_suyas & ids_conC))
    solo_asesor = ids_suyas - ids_conC
    solo_prefijo = ids_conC - ids_suyas
    if solo_asesor:
        print(u'      *** %d son suyas y NO llevan C:' % len(solo_asesor))
        for c in [x for x in suyas if x['id'] in solo_asesor][:6]:
            print(u'          %-6s %s' % (c.get('consecutivo'), str(c.get('empresa'))[:40]))
    if solo_prefijo:
        print(u'      *** %d llevan C y NO son suyas:' % len(solo_prefijo))
        for c in [x for x in conC if x['id'] in solo_prefijo][:6]:
            print(u'          %-6s %-28s asesor=%s'
                  % (c.get('consecutivo'), str(c.get('empresa'))[:28], c.get('asesor')))

    # Las demas tablas que guardan su nombre.
    for tabla, campo in (('usuarios', 'asesor_nombre'), ('usuarios', 'nombre'),
                         ('alertas_episodios', 'asesor_apertura'),
                         ('seguimientos', 'autor'), ('reuniones', 'asesor')):
        filas = supabase(tabla, {'select': campo})
        if isinstance(filas, dict):
            print(u'      %-22s %-18s (no accesible)' % (tabla, campo))
            continue
        n = sum(1 for f in filas
                if 'claudia' in str(f.get(campo) or '').strip().lower())
        marca = u''
        if tabla == 'alertas_episodios':
            marca = u'  <- HISTORICO: dice quien la tenia al abrirse'
        print(u'      %-22s %-18s %4d fila(s)%s' % (tabla, campo, n, marca))

    # ── 2. EL CODIGO Y LOS DATOS DEL REPO ──────────────────────────────────
    print(u'\n  (2) EN EL REPOSITORIO')
    patron = re.compile(r'claudia', re.I)
    por_archivo = {}
    for base in ('app', 'components', 'lib', 'data', 'docs', 'scripts'):
        for dp, _d, fs in os.walk(os.path.join(RAIZ, base)):
            if '.next' in dp or 'node_modules' in dp:
                continue
            for f in fs:
                if not f.endswith(('.ts', '.tsx', '.json', '.md', '.py', '.sql')):
                    continue
                r = os.path.join(dp, f)
                try:
                    src = io.open(r, encoding='utf-8').read()
                except Exception:
                    continue
                n = len(patron.findall(src))
                if n:
                    por_archivo[os.path.relpath(r, RAIZ).replace('\\', '/')] = n
    for rel, n in sorted(por_archivo.items(), key=lambda x: -x[1])[:18]:
        print(u'      %-54s %4d' % (rel, n))
    print(u'      %d archivo(s), %d mencion(es) en total'
          % (len(por_archivo), sum(por_archivo.values())))

    # ── 3. LOS CONSECUTIVOS EN PROSA ───────────────────────────────────────
    print(u'\n  (3) CONSECUTIVOS «C<numero>» CITADOS EN PROSA')
    print(u'      Son los que un reemplazo a ciegas romperia: estan DENTRO de')
    print(u'      frases de auditorias y expedientes, no en un campo.')
    cites = {}
    for dp, _d, fs in os.walk(os.path.join(RAIZ, 'app', 'auditoria')):
        for f in fs:
            if not f.endswith('.ts'):
                continue
            r = os.path.join(dp, f)
            src = io.open(r, encoding='utf-8').read()
            hs = re.findall(r'\bC\d{1,3}\b', src)
            if hs:
                cites[os.path.relpath(r, RAIZ).replace('\\', '/')] = len(hs)
    for rel, n in sorted(cites.items(), key=lambda x: -x[1])[:10]:
        print(u'      %-54s %4d' % (rel, n))
    print(u'      %d expediente(s) citan un consecutivo C' % len(cites))

    print(u'\n  ' + u'=' * 74)
    print(u'  Leer esto ANTES de escribir el cambio. No se ha tocado nada.\n')


if __name__ == '__main__':
    main()
