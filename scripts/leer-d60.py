"""Lee de vuelta la fila D60 tal como quedo en Supabase."""
import sys, io, json, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

r = urllib.request.Request(
    URL + '/rest/v1/cuentas?select=*&consecutivo=eq.D60',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
c = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())[0]

print('=== FILA D60 EN BASE ===')
for k in sorted(c):
    v = c[k]
    if v is None:
        print('  %-24s (null)' % k)
    elif isinstance(v, (list, dict)):
        print('  %-24s %s' % (k, json.dumps(v, ensure_ascii=False)[:100] + '...'))
    else:
        s = str(v).replace('\n', ' ⏎ ')
        print('  %-24s %s' % (k, s[:100] + ('...' if len(s) > 100 else '')))

print()
print('contactos_json — %d entradas:' % len(c['contactos_json'] or []))
for x in (c['contactos_json'] or []):
    print('  · %-32s %s' % (x['nombre'], x['nota'][:70]))

print()
print('Cuentas de Dan tras el alta:')
r2 = urllib.request.Request(
    URL + '/rest/v1/cuentas?select=consecutivo,empresa,cid,estado&asesor=eq.Dan&order=consecutivo',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
lista = json.loads(urllib.request.urlopen(r2, timeout=60).read().decode())
print('  total: %d' % len(lista))
for x in lista[-4:]:
    print('  %-5s %-40s CID %-8s %s' % (x['consecutivo'], x['empresa'][:40], x['cid'] or '—', x['estado']))
