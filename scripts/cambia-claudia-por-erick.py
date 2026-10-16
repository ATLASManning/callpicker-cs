# -*- coding: utf-8 -*-
u"""Claudia Hernandez -> Erick Sanchez. El nombre; el prefijo va aparte.

   Encargo de direccion, 15 oct 2026: «Erick Sanchez sustituye a Claudia
   Hernandez. Revisa donde tiene informacion de Claudia y sustituyela».

   QUE CAMBIA, Y QUE NO
   --------------------
   SI  `cuentas.asesor`: de quien es la cartera HOY. Son 71 cuentas.
   SI  El nombre en el codigo y en los datos del repo donde designa al DUEÑO
       de una cartera o al autor de una nota viva.

   NO  `alertas_episodios.asesor_apertura` (258 filas). Ese campo dice quien
       tenia la cuenta CUANDO SE ABRIO el episodio, que es un hecho del
       pasado. Reescribirlo pondria a Erick abriendo alertas de agosto, antes
       de entrar. La propia migracion lo deja dicho: «es HISTORIA».

   NO  Los consecutivos. Van en su propio guion porque el prefijo y la cartera
       YA NO COINCIDEN --51 de las 71 llevan C, 11 cuentas con C son de Dan y
       Fatima-- y porque el consecutivo se cita en prosa dentro de trece
       expedientes: cambiarlo sin tocar esas citas las rompe.

   RESPALDO
   --------
   Antes de escribir, vuelca las filas que va a tocar a un .json con la fecha.
   Si algo sale mal, ahi esta lo que habia.

   USO
       python scripts/cambia-claudia-por-erick.py --simulacro
       python scripts/cambia-claudia-por-erick.py
"""
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VIEJO, NUEVO = u'Claudia', u'Erick'
#: El nombre completo, para la prosa y los documentos.
VIEJO_COMPLETO, NUEVO_COMPLETO = u'Claudia Hernández', u'Erick Sánchez'


def entorno():
    d = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as fh:
        for ln in fh:
            ln = ln.strip()
            if ln and not ln.startswith('#') and '=' in ln:
                k, v = ln.split('=', 1)
                d[k.strip()] = v.strip().strip('"').strip("'")
    return d


E = entorno()
URL = E['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
KEY = E.get('SUPABASE_SERVICE_ROLE_KEY') or E['NEXT_PUBLIC_SUPABASE_ANON_KEY']
CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
       'Content-Type': 'application/json', 'Prefer': 'return=representation'}


def pide(ruta, metodo='GET', cuerpo=None):
    req = urllib.request.Request(
        URL + '/rest/v1/' + ruta,
        data=json.dumps(cuerpo).encode('utf-8') if cuerpo is not None else None,
        headers=CAB, method=metodo)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=90).read().decode('utf-8') or '[]')
    except urllib.error.HTTPError as e:
        sys.stderr.write('HTTP %s en %s\n  %s\n'
                         % (e.code, ruta, e.read().decode('utf-8', 'replace')[:300]))
        raise


def main():
    simulacro = '--simulacro' in sys.argv
    print(u'\n  %s -> %s' % (VIEJO_COMPLETO, NUEVO_COMPLETO))
    print(u'  ' + u'=' * 70)
    print(u'  %s\n' % (u'SIMULACRO: no se escribe nada' if simulacro else u'APLICANDO'))

    suyas = pide('cuentas?select=id,consecutivo,empresa,asesor,estado&asesor=ilike.*claudia*')
    print(u'  cuentas con asesor «Claudia»: %d' % len(suyas))
    if not suyas:
        print(u'  nada que cambiar.\n')
        return

    vivas = [c for c in suyas if c.get('estado') in ('activo', 'en_riesgo')]
    print(u'    de ellas vivas: %d' % len(vivas))
    valores = sorted({str(c.get('asesor')) for c in suyas})
    print(u'    el campo dice: %s' % u' · '.join(valores))

    # ── RESPALDO ───────────────────────────────────────────────────────────
    dest = os.path.join(RAIZ, 'data',
                        'respaldo-asesor-claudia.2026-10-15.json')
    if not simulacro:
        io.open(dest, 'w', encoding='utf-8').write(
            json.dumps(suyas, ensure_ascii=False, indent=1))
        print(u'\n  respaldo: %s' % os.path.relpath(dest, RAIZ))

    # ── EL CAMBIO ──────────────────────────────────────────────────────────
    if simulacro:
        print(u'\n  cambiaria `asesor` a «%s» en %d cuenta(s). Muestra:' % (NUEVO, len(suyas)))
        for c in suyas[:8]:
            print(u'      %-6s %-34s %s -> %s'
                  % (c.get('consecutivo'), str(c.get('empresa'))[:34],
                     c.get('asesor'), NUEVO))
        print(u'\n  (simulacro: no se escribio nada)\n')
        return

    hechas = 0
    for c in suyas:
        pide('cuentas?id=eq.%s' % c['id'], 'PATCH', {'asesor': NUEVO})
        hechas += 1
    print(u'  `cuentas.asesor` actualizado en %d cuenta(s)' % hechas)

    # ── COMPROBACION ───────────────────────────────────────────────────────
    quedan = pide('cuentas?select=id&asesor=ilike.*claudia*')
    nuevas = pide('cuentas?select=id&asesor=eq.%s' % NUEVO)
    print(u'\n  COMPROBADO contra la base:')
    print(u'    cuentas que siguen diciendo «Claudia»: %d  %s'
          % (len(quedan), u'ok' if not quedan else u'*** QUEDAN'))
    print(u'    cuentas que ahora dicen «%s»: %d' % (NUEVO, len(nuevas)))
    if len(quedan) or len(nuevas) != len(suyas):
        print(u'  *** el cambio no cuadra. Revisar antes de seguir.')
        sys.exit(1)
    print(u'')


if __name__ == '__main__':
    main()
