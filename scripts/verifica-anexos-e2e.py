# -*- coding: utf-8 -*-
"""Anexos de punta a punta contra PRODUCCION: subir, bajar, ficha, borrar.

   POR QUE EXISTE
   --------------
   No hay Node en la maquina de trabajo: no se puede compilar ni levantar el
   servidor. La unica prueba que vale es contra produccion, con archivos
   REALES, comprobando contra la BASE y el BUCKET — no contra la respuesta del
   POST, que fue justamente el error que dejo 55 reuniones huerfanas: un 200
   que no correspondia a lo guardado.

   QUE COMPRUEBA (26 aserciones)
   -----------------------------
   - Que la tabla exista (si no, no tiene sentido seguir).
   - Sube un PDF, un .docx y un .xlsx validos; verifica la fila en la base y
     el objeto en el bucket, y que la descarga devuelva el MISMO archivo byte
     por byte, con su nombre intacto.
   - Que la ficha de la cuenta muestre el panel, liste los documentos, el
     resumen por tema CIERRE, y que ningun enlace de descarga termine en
     extension (el middleware deja pasar esas rutas sin sesion).
   - AL REVES, ocho cosas que NO deben entrar: sin cuenta, sin nombre, tema
     inventado, sin archivo, cuenta inexistente, tipo prohibido, ejecutable
     disfrazado de .pdf, y mas de 4 MB.
   - Que sin sesion la descarga no entregue nada.
   - Que el DELETE retire TAMBIEN el objeto del bucket.

   Limpia todo al terminar, pase lo que pase. Usa la cuenta ASUQ (CID 179822)
   y marca las filas con «ZZ PRUEBA AUTOMATICA».

   USO
   ---
       python scripts/verifica-anexos-e2e.py
"""
import sys, io, os, json, time, hmac, hashlib, base64, zipfile, uuid
import urllib.request, urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE = "https://callpicker-cs.vercel.app"
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUENTA = '749ac336-74e4-4f8d-8d9f-60e67032586f'   # ASUQ · CID 179822
MARCA = 'ZZ PRUEBA AUTOMATICA'

env = {}
for l in io.open(os.path.join(P, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
sec = env['JWT_SECRET'].encode(); now = int(time.time())
h = b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(',', ':')).encode())
pl = b64(json.dumps({"email": "josel@callpicker.com", "nombre": "JM", "rol": "admin",
                     "asesor_nombre": None, "iat": now, "exp": now + 7200},
                    separators=(',', ':')).encode())
TOK = h + '.' + pl + '.' + b64(hmac.new(sec, (h + '.' + pl).encode(), hashlib.sha256).digest())
SB, KEY = env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']

fallas, creados = [], []
def prueba(etq, cond, det=''):
    if not cond: fallas.append(etq)
    print('  %-50s %s  %s' % (etq[:50], 'OK      ' if cond else '** FALLA', det))

def sb(metodo, ruta, cuerpo=None, ctype=None):
    r = urllib.request.Request(f'{SB}{ruta}', method=metodo)
    r.add_header('apikey', KEY); r.add_header('Authorization', 'Bearer ' + KEY)
    if cuerpo is not None:
        r.add_header('Content-Type', ctype or 'application/json')
        r.data = cuerpo if isinstance(cuerpo, bytes) else json.dumps(cuerpo).encode()
    try:
        with urllib.request.urlopen(r, timeout=60) as x:
            return x.status, x.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()

def multipart(campos, archivo):
    """campos: dict. archivo: (nombre, mime, bytes) o None."""
    lim = '----cp' + uuid.uuid4().hex
    out = b''
    for k, v in campos.items():
        out += (f'--{lim}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n').encode()
    if archivo:
        n, m, b = archivo
        out += (f'--{lim}\r\nContent-Disposition: form-data; name="archivo"; filename="{n}"\r\n'
                f'Content-Type: {m}\r\n\r\n').encode() + b + b'\r\n'
    out += f'--{lim}--\r\n'.encode()
    return out, f'multipart/form-data; boundary={lim}'

def api(metodo, ruta, cuerpo=None, ctype=None, con_sesion=True, crudo=False):
    r = urllib.request.Request(BASE + ruta, method=metodo)
    if con_sesion: r.add_header('Cookie', 'cp_session=' + TOK)
    if cuerpo is not None:
        r.add_header('Content-Type', ctype); r.data = cuerpo
    try:
        with urllib.request.urlopen(r, timeout=180) as x:
            d = x.read()
            if crudo:
                return x.status, d, dict(x.headers), x.geturl()
            # Sin sesion el middleware redirige a /acceso y `urlopen` lo sigue:
            # lo que llega es el HTML del login con 200, no JSON. Es el mismo
            # «redirect que parece exito» que este repositorio ya padecio.
            try: j = json.loads(d.decode() or '{}')
            except Exception: j = {'_html': d[:200].decode('utf-8', 'replace')}
            return x.status, j, dict(x.headers), x.geturl()
    except urllib.error.HTTPError as e:
        d = e.read()
        try: j = json.loads(d.decode() or '{}')
        except Exception: j = {'_html': d[:200].decode('utf-8', 'replace')}
        return e.code, j, dict(e.headers), ruta

# ── Archivos REALES ────────────────────────────────────────────────────────
PDF = (b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'
       b'2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n')
def ooxml(tipo):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        z.writestr('[Content_Types].xml', '<?xml version="1.0"?><Types/>')
        z.writestr('_rels/.rels', '<?xml version="1.0"?><Relationships/>')
        z.writestr(f'{tipo}/document.xml', '<?xml version="1.0"?><doc/>')
    return buf.getvalue()
DOCX = ooxml('word'); XLSX = ooxml('xl')
MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
# Un informe HTML como los que genera el equipo: autonomo y CON un <script>
# dentro, que es el caso que obliga a los candados de la descarga.
HTML = (b'<!doctype html><html><head><meta charset=utf8>'
        b'<title>Informe de prueba</title></head><body>'
        b'<h1>Llamadas perdidas</h1><script>console.log(1)</script>'
        b'</body></html>')

try:
    # ── 1. La tabla ya existe ──────────────────────────────────────────────
    st, j, _, _ = api('GET', '/api/anexos')
    prueba('la tabla `anexos` ya existe', st == 200 and j.get('tablaExiste') is True,
           f"http {st} · tablaExiste={j.get('tablaExiste')} · {len(j.get('rows') or [])} filas")
    if j.get('tablaExiste') is not True:
        raise SystemExit('sin tabla no tiene sentido seguir')

    # ── 2. Subida real de los CUATRO formatos ──────────────────────────────
    print()
    casos = [('Analisis de caso octubre.pdf', 'application/pdf', PDF, 'analisis'),
             ('Propuesta comercial.docx', MIME_DOCX, DOCX, 'venta'),
             ('Consumo de minutos.xlsx', MIME_XLSX, XLSX, 'producto'),
             ('Llamadas perdidas.html', 'text/html', HTML, 'falla')]
    for nombre, mime, data, tema in casos:
        cuerpo, ct = multipart(
            {'cuenta_id': CUENTA, 'nombre_documento': f'{MARCA} {tema}',
             'tema': tema, 'notas': 'fila de prueba, se borra sola'},
            (nombre, mime, data))
        st, j, _, _ = api('POST', '/api/anexos', cuerpo, ct)
        fila = j.get('row') or {}
        if fila.get('id'): creados.append(fila)
        # Contra la BASE, no contra la respuesta.
        stB, cB = sb('GET', f"/rest/v1/anexos?select=*&id=eq.{fila.get('id')}")
        enBase = json.loads(cB.decode()) if stB == 200 else []
        ok = (st == 200 and enBase and enBase[0]['cuenta_id'] == CUENTA
              and enBase[0]['tema'] == tema and enBase[0]['archivo_bytes'] == len(data))
        prueba(f'sube {nombre.split(".")[-1].upper():<4} y queda en la base', ok,
               f"http {st} · {enBase[0]['archivo_bytes'] if enBase else '?'} bytes")

    # ── 3. El archivo ESTA en el bucket y baja IDENTICO ────────────────────
    print()
    for fila, (nombre, mime, data, tema) in zip(creados, casos):
        stO, obj = sb('GET', f"/storage/v1/object/anexos/{fila['archivo_ruta']}")
        prueba(f'el objeto {tema} esta en el bucket', stO == 200 and obj == data,
               f'http {stO} · {len(obj)} bytes')
        st, cont, hdrs, _ = api('GET', f"/api/anexos/{fila['id']}/descargar", crudo=True)
        prueba(f'la descarga de {tema} devuelve el MISMO archivo',
               st == 200 and cont == data, f'http {st} · {len(cont)} bytes')
        # El HTML es el unico que ejecuta codigo: sus candados se comprueban.
        if nombre.endswith('.html'):
            prueba('  el HTML se sirve como ADJUNTO, no inline',
                   'attachment' in hdrs.get('Content-Disposition', ''),
                   hdrs.get('Content-Disposition', '')[:40])
            prueba('  trae CSP sandbox (no corre aunque se renderice)',
                   'sandbox' in (hdrs.get('Content-Security-Policy') or ''),
                   hdrs.get('Content-Security-Policy') or '(sin CSP)')
            prueba('  trae nosniff',
                   'nosniff' in (hdrs.get('X-Content-Type-Options') or ''))
        disp = hdrs.get('Content-Disposition', '')
        prueba(f'  conserva el nombre «{nombre[:22]}»',
               'attachment' in disp and nombre.split('.')[-1] in disp.lower(), disp[:58])

    # ── 4. En la ficha de la cuenta ────────────────────────────────────────
    print()
    r = urllib.request.Request(f'{BASE}/cuentas/{CUENTA}',
                               headers={'Cookie': 'cp_session=' + TOK, 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(r, timeout=180) as x:
        html = x.read().decode('utf-8', 'replace').replace('<!-- -->', '')
    prueba('la ficha muestra el panel «Anexos de la cuenta»', 'Anexos de la cuenta' in html)
    prueba('la ficha lista los 4 documentos de prueba',
           html.count(MARCA) >= 4, f'{html.count(MARCA)} menciones')
    # Las etiquetas van acentuadas y en minuscula: «1 análisis · 1 venta · …».
    # El HTML puede traer la tilde literal o como entidad; se normalizan ambas.
    import unicodedata as _u
    plano = _u.normalize('NFD', html.replace('&#xE1;', 'a').replace('&aacute;', 'a'))
    plano = ''.join(c for c in plano if not (0x300 <= ord(c) <= 0x36f))
    prueba('el panel resume por tema y suma 3',
           '1 analisis' in plano and '1 venta' in plano and '1 producto' in plano,
           [t for t in ('1 analisis', '1 venta', '1 producto') if t not in plano] or 'los tres')
    prueba('los enlaces de descarga NO terminan en extension',
           '/descargar"' in html and '.pdf"' not in html.split('Anexos de la cuenta')[1][:4000])

    # ── 5. AL REVES: lo que NO debe entrar ─────────────────────────────────
    print()
    malos = [
        ('sin cuenta',          {'nombre_documento': 'x', 'tema': 'falla'}, ('a.pdf', 'application/pdf', PDF)),
        ('sin nombre',          {'cuenta_id': CUENTA, 'tema': 'falla'},      ('a.pdf', 'application/pdf', PDF)),
        ('tema inventado',      {'cuenta_id': CUENTA, 'nombre_documento': 'x', 'tema': 'otro'}, ('a.pdf', 'application/pdf', PDF)),
        ('sin archivo',         {'cuenta_id': CUENTA, 'nombre_documento': 'x', 'tema': 'falla'}, None),
        ('cuenta inexistente',  {'cuenta_id': '00000000-0000-0000-0000-000000000000', 'nombre_documento': 'x', 'tema': 'falla'}, ('a.pdf', 'application/pdf', PDF)),
        ('tipo prohibido (.exe)', {'cuenta_id': CUENTA, 'nombre_documento': 'x', 'tema': 'falla'}, ('v.exe', 'application/x-msdownload', b'MZ\x90\x00')),
        ('ejecutable disfrazado de .pdf', {'cuenta_id': CUENTA, 'nombre_documento': 'x', 'tema': 'falla'}, ('v.exe', 'application/pdf', b'MZ\x90\x00')),
        # La tolerancia que se abrio para el .html NO se extiende a lo demas.
        # Si estas dos pasaran, bastaria una extension conocida para colar
        # cualquier binario — que es lo que la pareja MIME+extension cierra.
        ('binario .pdf declarado octet-stream', {'cuenta_id': CUENTA, 'nombre_documento': 'x', 'tema': 'falla'}, ('v.pdf', 'application/octet-stream', b'MZ\x90\x00')),
        ('ejecutable con extension .html', {'cuenta_id': CUENTA, 'nombre_documento': 'x', 'tema': 'falla'}, ('v.exe', 'text/html', b'MZ\x90\x00')),
        ('mas de 4 MB',         {'cuenta_id': CUENTA, 'nombre_documento': 'x', 'tema': 'falla'}, ('g.pdf', 'application/pdf', PDF + b'\0' * (4 * 1024 * 1024 + 500))),
    ]
    for etq, campos, arch in malos:
        cuerpo, ct = multipart(campos, arch)
        st, j, _, _ = api('POST', '/api/anexos', cuerpo, ct)
        if (j.get('row') or {}).get('id'): creados.append(j['row'])
        prueba(f'rechaza: {etq}', st in (400, 413) and not (j.get('row') or {}).get('id'),
               f"http {st} · {str(j.get('mensaje') or j.get('error'))[:46]}")

    # ── 6. Sin sesion no se baja nada ──────────────────────────────────────
    print()
    st, j, _, url = api('GET', f"/api/anexos/{creados[0]['id']}/descargar", con_sesion=False)
    prueba('SIN sesion la descarga no entrega el archivo',
           '/acceso' in url or st in (401, 403, 302) or '_html' in j, f'http {st}')

finally:
    # ── 7. Limpieza, y que el DELETE retire TAMBIEN el objeto ──────────────
    print()
    for fila in creados:
        st, j, _, _ = api('DELETE', f"/api/anexos/{fila['id']}")
        stO, _ = sb('GET', f"/storage/v1/object/anexos/{fila['archivo_ruta']}")
        prueba(f"borra la fila y retira el objeto", st == 200 and stO != 200,
               f"delete {st} · objeto en bucket: {'SIGUE' if stO == 200 else 'retirado'}")
    q = sb('GET', f'/rest/v1/anexos?select=id&nombre_documento=like.{MARCA.replace(" ", "%20")}*')
    resto = json.loads(q[1].decode()) if q[0] == 200 else []
    prueba('no quedan filas de prueba en la base', not resto, f'{len(resto)} restantes')

print()
print(f'  {len(fallas)} FALLAS: ' + ' | '.join(fallas) if fallas else '  TODO CORRECTO DE PUNTA A PUNTA')
sys.exit(1 if fallas else 0)
