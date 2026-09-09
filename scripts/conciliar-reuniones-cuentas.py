"""
Vincula las reuniones de tipo `cliente` con su cuenta (reuniones.cuenta_id).

REQUIERE haber ejecutado antes scripts/migracion-reuniones-cuenta.sql.

Cómo decide a qué cuenta pertenece cada reunión, en este orden de confianza:
  1. DOMINIO DEL CORREO de los participantes contra el sitio web o el correo de
     contacto de la cuenta. Es la señal más fuerte: 'jorge.garcia@grupotorrescorzo.com'
     identifica a GRUPO TORRES CORZO sin ambigüedad.
  2. NOMBRE COMPLETO de la cuenta contenido en el título de la reunión.
  3. TOKENS significativos compartidos entre título y nombre de la cuenta.

Nunca adivina: si una reunión no resuelve a UNA sola cuenta, se reporta como
pendiente de decisión y NO se escribe. Vincular mal una reunión contamina el
relacionamiento y el Health Score de dos cuentas a la vez.

Uso:
    python scripts/conciliar-reuniones-cuentas.py            # simulacro
    python scripts/conciliar-reuniones-cuentas.py --aplicar  # escribe
"""
import sys, io, os, re, json, unicodedata, urllib.request, urllib.error

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

RAIZ = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
APLICAR = '--aplicar' in sys.argv

env = {}
for line in open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['SUPABASE_SERVICE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}


def api(metodo, ruta, cuerpo=None):
    data = json.dumps(cuerpo).encode() if cuerpo is not None else None
    r = urllib.request.Request(URL + '/rest/v1/' + ruta, data=data, method=metodo, headers=H)
    try:
        with urllib.request.urlopen(r, timeout=90) as x:
            raw = x.read().decode('utf-8', 'replace')
            return json.loads(raw) if raw.strip() else []
    except urllib.error.HTTPError as e:
        return {'ERR': e.read().decode('utf-8', 'replace')[:400]}


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


RUIDO = {'de', 'del', 'la', 'el', 'los', 'las', 'y', 'ft', 'callpicker', 'revision',
         'seguimiento', 'analisis', 'sesion', 'informativa', 'reporte', 'reportes',
         'avanzado', 'cuenta', 'con', 'satisfaccion', 'al', 'cliente', 'dudas',
         'propuesta', 'servicios', 'uso', 'minutos', 'consumo', 'integracion',
         'chat', 'sa', 'cv', 'grupo', 'sc', 'com', 'mx', 'www'}

GENERICOS = {'gmail', 'hotmail', 'outlook', 'yahoo', 'live', 'icloud', 'callpicker'}


def dominios(texto):
    """Dominios de correo que no sean genéricos ni de Callpicker."""
    out = set()
    for m in re.findall(r'[\w.+-]+@([\w.-]+\.\w+)', str(texto or '')):
        base = m.lower().split('.')[0]
        if base and base not in GENERICOS:
            out.add(base)
    return out


def main():
    reuniones = api('GET', 'reuniones?select=*&order=fecha.asc&limit=500')
    cuentas = api('GET', 'cuentas?select=id,consecutivo,cid,empresa,pagina_web,contacto_email,contactos_json&limit=3000')
    for r in (reuniones, cuentas):
        if isinstance(r, dict):
            print('Error al leer: %s' % r); return 1

    if reuniones and 'cuenta_id' not in reuniones[0]:
        print('FALTA LA MIGRACION: la tabla reuniones no tiene la columna cuenta_id.')
        print('Ejecuta primero scripts/migracion-reuniones-cuenta.sql en Supabase.')
        return 1

    # Índices
    por_dominio, por_nombre, por_token = {}, [], {}
    for c in cuentas:
        nom = norm(c.get('empresa'))
        if nom:
            por_nombre.append((nom, c))
            for t in nom.split():
                if len(t) >= 3 and t not in RUIDO:
                    por_token.setdefault(t, set()).add(c['id'])
        for campo in (c.get('pagina_web'), c.get('contacto_email')):
            for d in dominios(campo) or set():
                por_dominio.setdefault(d, set()).add(c['id'])
        web = str(c.get('pagina_web') or '')
        m = re.search(r'https?://(?:www\.)?([\w-]+)\.', web)
        if m and m.group(1).lower() not in GENERICOS:
            por_dominio.setdefault(m.group(1).lower(), set()).add(c['id'])
        try:
            cj = c.get('contactos_json')
            arr = cj if isinstance(cj, list) else (json.loads(cj) if cj else [])
            for x in arr:
                for d in dominios(x.get('email')):
                    por_dominio.setdefault(d, set()).add(c['id'])
        except Exception:
            pass
    por_id = {c['id']: c for c in cuentas}

    # Nombre de cada cuenta sin espacios, para comparar contra dominios de
    # correo: "GRUPO TORRES CORZO" -> "grupotorrescorzo", que es exactamente el
    # dominio de jorge.garcia@grupotorrescorzo.com.
    por_nombre_junto = {}
    for c in cuentas:
        j = norm(c.get('empresa')).replace(' ', '')
        if len(j) >= 6:
            por_nombre_junto.setdefault(j, set()).add(c['id'])

    def por_tokens(texto):
        """Cuenta única cuyos tokens coinciden más con el texto dado."""
        toks = [t for t in norm(texto).split() if len(t) >= 3 and t not in RUIDO]
        pts = {}
        for t in toks:
            for cid in por_token.get(t, ()):
                pts[cid] = pts.get(cid, 0) + 1
        if not pts:
            return None
        mx = max(pts.values())
        top = [i for i, v in pts.items() if v == mx]
        return por_id[top[0]] if len(top) == 1 else None

    def resolver(r):
        texto = ' '.join(str(r.get(k) or '') for k in ('participantes', 'resumen', 'acuerdos', 'proximos_pasos'))
        doms = dominios(texto)

        # 1 · dominio de correo contra el sitio/correo registrado de la cuenta
        ids = set()
        for d in doms:
            ids |= por_dominio.get(d, set())
        if len(ids) == 1:
            return por_id[next(iter(ids))], 'dominio de correo de participantes'

        # 2 · dominio de correo contra el NOMBRE de la cuenta sin espacios
        ids = set()
        for d in doms:
            ids |= por_nombre_junto.get(d, set())
        if len(ids) == 1:
            return por_id[next(iter(ids))], 'dominio de correo = nombre de la cuenta'

        # 3 · nombre completo de la cuenta contenido en el título
        tn = norm(r.get('titulo'))
        exactos = [c for n, c in por_nombre if len(n) >= 4 and re.search(r'\b' + re.escape(n) + r'\b', tn)]
        if len(exactos) >= 1:
            mejor = sorted(exactos, key=lambda c: -len(norm(c.get('empresa'))))
            if len(mejor) == 1 or len(norm(mejor[0]['empresa'])) > len(norm(mejor[1]['empresa'])):
                return mejor[0], 'nombre de la cuenta en el titulo'

        # 4 · tokens del título
        c = por_tokens(r.get('titulo'))
        if c:
            return c, 'token compartido con el titulo'

        # NO se buscan tokens en participantes/resumen. Se probó y es una
        # heurística peligrosa: el cuerpo de la reunión menciona nombres de
        # personas, lugares y productos, y produjo un falso positivo grave —
        # "Seguimiento RDS ELITE CONDOS PDC" (cliente Invest Vacay, que no
        # existe como cuenta) quedaba atribuido a "Colegio NWL". Un vínculo
        # equivocado contamina el relacionamiento de DOS cuentas: la que no
        # tuvo la reunión y la que sí. Es preferible dejarla pendiente.
        return None, 'sin coincidencia unica'

    cli = [r for r in reuniones if r.get('tipo') == 'cliente']
    print('Reuniones de tipo cliente: %d' % len(cli))
    print('Modo: %s\n' % ('APLICAR (escribe en la base)' if APLICAR else 'SIMULACRO (no escribe)'))

    resueltas, pendientes, yavinculadas = [], [], 0
    for r in cli:
        if r.get('cuenta_id'):
            yavinculadas += 1
            continue
        c, criterio = resolver(r)
        if c:
            resueltas.append((r, c, criterio))
        else:
            pendientes.append((r, criterio))

    print('%-11s %-46s %-32s %s' % ('FECHA', 'TITULO', 'CUENTA', 'CRITERIO'))
    print('-' * 126)
    for r, c, crit in resueltas:
        print('%-11s %-46s %-32s %s' % (r['fecha'], str(r['titulo'])[:45],
              ('%s · %s' % (c.get('consecutivo'), c.get('empresa')))[:31], crit))

    print('\nya vinculadas: %d · resueltas ahora: %d · pendientes: %d'
          % (yavinculadas, len(resueltas), len(pendientes)))

    if pendientes:
        print('\n=== PENDIENTES DE DECISION (no se escriben) ===')
        for r, crit in pendientes:
            print('  %s · %s   [%s]' % (r['fecha'], r['titulo'], crit))
            print('      participantes: %s' % str(r.get('participantes'))[:110])

    if not APLICAR:
        print('\nSimulacro. Vuelve a ejecutar con --aplicar para escribir.')
        return 0

    ok = 0
    for r, c, _ in resueltas:
        res = api('PATCH', 'reuniones?id=eq.%s' % r['id'],
                  {'cuenta_id': c['id'], 'cid': c.get('cid'), 'empresa': c.get('empresa')})
        if isinstance(res, dict) and 'ERR' in res:
            print('  ERROR en %s: %s' % (r['titulo'][:40], res['ERR'][:160]))
        else:
            ok += 1
    print('\nreuniones vinculadas: %d de %d' % (ok, len(resueltas)))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
