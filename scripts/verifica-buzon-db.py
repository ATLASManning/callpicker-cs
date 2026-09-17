"""Verifica que la tabla buzon_cliente quedo bien creada.

   No basta con que la tabla exista: lo que importa es que las reglas de
   coherencia REALMENTE rechacen lo incoherente. Un CHECK mal escrito se ve
   igual que uno bueno hasta que deja pasar el primer dato malo.

   Por eso se prueba a la inversa: se intenta insertar lo que NO debe entrar y
   se comprueba que la base lo rechace. Todas las filas de prueba llevan una
   marca y se borran al final, pase lo que pase.
"""
import sys, io, json, urllib.request, urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
U = env['NEXT_PUBLIC_SUPABASE_URL']
K = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
H = {'apikey': K, 'Authorization': 'Bearer ' + K, 'Content-Type': 'application/json'}

MARCA = '__PRUEBA_VERIFICACION__'


def rest(path, metodo='GET', cuerpo=None, extra=None):
    h = dict(H)
    if extra:
        h.update(extra)
    r = urllib.request.Request(U + '/rest/v1/' + path,
                               data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
                               headers=h, method=metodo)
    try:
        with urllib.request.urlopen(r, timeout=45) as x:
            t = x.read().decode()
            return x.status, (json.loads(t) if t.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')[:190]


def limpiar():
    rest('buzon_cliente?cliente=eq.' + MARCA, 'DELETE')


BASE = {
    'cliente': MARCA, 'solicitud': 'fila de prueba, se borra sola',
    'area': 'producto', 'canal': 'email', 'prioridad': 'media',
}

try:
    print('=== 1 · ¿EXISTE LA TABLA? ===')
    cod, d = rest('buzon_cliente?select=id&limit=1')
    print('  HTTP %s  -> %s' % (cod, 'la tabla responde' if cod == 200 else d))
    if cod != 200:
        raise SystemExit('La tabla no existe o no es accesible. Revisa que el SQL se haya ejecutado completo.')

    limpiar()

    print()
    print('=== 2 · ¿ACEPTA UN REGISTRO VALIDO? ===')
    cod, d = rest('buzon_cliente', 'POST', BASE, {'Prefer': 'return=representation'})
    ok = cod in (200, 201)
    print('  HTTP %s  -> %s' % (cod, 'aceptado' if ok else d))
    if ok:
        f = d[0] if isinstance(d, list) else d
        print('    estado por omisión   : %s   (debe ser «recibida»)' % f.get('estado'))
        print('    solucion por omisión : %r   (debe ser None: el ciclo sigue abierto)' % f.get('solucion'))
        print('    avisado por omisión  : %s   (debe ser False)' % f.get('avisado_al_cliente'))
        print('    fecha_solicitud      : %s   (debe ser hoy)' % f.get('fecha_solicitud'))

    print()
    print('=== 3 · ¿RECHAZA LO INCOHERENTE? (esto es lo que importa) ===')
    PRUEBAS = [
        ('entregada SIN fecha de entrega',
         dict(BASE, estado='entregada', solucion='si')),
        ('entregada SIN solucion=si',
         dict(BASE, estado='entregada', fecha_entrega='2026-09-17')),
        ('no_procede SIN motivo',
         dict(BASE, estado='no_procede', solucion='no')),
        ('no_procede con motivo VACIO',
         dict(BASE, estado='no_procede', solucion='no', motivo_respuesta='   ')),
        ('avisado al cliente con el ciclo ABIERTO',
         dict(BASE, estado='en_analisis', avisado_al_cliente=True)),
        ('area inventada',
         dict(BASE, area='marketing')),
        ('canal inventado',
         dict(BASE, canal='paloma_mensajera')),
        ('prioridad inventada',
         dict(BASE, prioridad='urgentisima')),
        ('solucion con un valor raro',
         dict(BASE, solucion='quiza')),
        # Las dos que destaparon el agujero del NULL en el CHECK.
        ('abierta PERO con veredicto ya puesto',
         dict(BASE, estado='en_analisis', solucion='si')),
        ('no_procede con motivo pero SIN solucion',
         dict(BASE, estado='no_procede', motivo_respuesta='No es viable.')),
    ]
    fallos = 0
    for etiqueta, fila in PRUEBAS:
        cod, d = rest('buzon_cliente', 'POST', fila)
        rechazado = cod >= 400
        if not rechazado:
            fallos += 1
        print('  %s %-42s HTTP %s' % ('ok  ' if rechazado else '** ', etiqueta, cod))
        if not rechazado:
            print('      LA BASE LO ACEPTO Y NO DEBERIA')

    print()
    print('=== 4 · ¿ACEPTA LOS CIERRES BIEN FORMADOS? ===')
    BUENAS = [
        ('entregada completa',
         dict(BASE, estado='entregada', solucion='si', fecha_entrega='2026-09-17')),
        ('no_procede con su motivo',
         dict(BASE, estado='no_procede', solucion='no', motivo_respuesta='No es viable con la arquitectura actual.')),
        ('entregada y avisada al cliente',
         dict(BASE, estado='entregada', solucion='si', fecha_entrega='2026-09-17',
              avisado_al_cliente=True, fecha_aviso='2026-09-17')),
    ]
    for etiqueta, fila in BUENAS:
        cod, d = rest('buzon_cliente', 'POST', fila)
        aceptado = cod in (200, 201)
        if not aceptado:
            fallos += 1
        print('  %s %-42s HTTP %s %s' % ('ok  ' if aceptado else '** ', etiqueta, cod, '' if aceptado else d))

    print()
    print('=== 5 · COLUMNAS QUE QUEDARON ===')
    cod, d = rest('buzon_cliente?select=*&cliente=eq.' + MARCA + '&limit=1')
    if cod == 200 and d:
        cols = sorted(d[0].keys())
        print('  %d columnas: %s' % (len(cols), ', '.join(cols)))
        ESPERADAS = ['area', 'asesor', 'avisado_al_cliente', 'canal', 'cid', 'cliente',
                     'created_at', 'cuenta_id', 'estado', 'fecha_aviso', 'fecha_compromiso',
                     'fecha_entrega', 'fecha_solicitud', 'id', 'motivo_respuesta',
                     'prioridad', 'registrado_por', 'seguimiento', 'solicitud', 'solucion',
                     'tema', 'updated_at']
        faltan = [c for c in ESPERADAS if c not in cols]
        print('  faltantes: %s' % (faltan or 'ninguna'))
        if faltan:
            fallos += 1

    print()
    print('=== 6 · VINCULO CON cuentas ===')
    cod, cu = rest('cuentas?select=id,empresa,cid&limit=1')
    if cod == 200 and cu:
        c0 = cu[0]
        cod, d = rest('buzon_cliente', 'POST',
                      dict(BASE, cuenta_id=c0['id'], cid=c0.get('cid'), cliente=MARCA),
                      {'Prefer': 'return=representation'})
        print('  enlazar a «%s»: HTTP %s %s' % (str(c0['empresa'])[:28], cod,
                                                'ok' if cod in (200, 201) else d))
        if cod not in (200, 201):
            fallos += 1

    print()
    print('RESULTADO: %s' % ('la tabla quedó correcta y las reglas sí funcionan'
                             if fallos == 0 else '%d prueba(s) fallaron — REVISAR' % fallos))
finally:
    limpiar()
    cod, d = rest('buzon_cliente?select=id&cliente=eq.' + MARCA)
    print('limpieza: quedan %d filas de prueba' % (len(d) if isinstance(d, list) else -1))
    cod, d = rest('buzon_cliente?select=id')
    print('filas reales en el buzón: %d' % (len(d) if isinstance(d, list) else -1))
