# -*- coding: utf-8 -*-
u"""Las tareas programadas: que lo que se anuncia, lo que se programa y lo que
   existe sean la MISMA lista.

   POR QUE EXISTE
   --------------
   `/api/cron/estado` es el unico sitio en linea que contesta que esta
   programado, y existe porque `refresh-tenure` paso meses sin correr y nadie
   se entero. Su propio comentario pedia revisarlo a mano al tocar
   `vercel.json`. **A mano ya fallo dos veces, y las dos mintiendo en las dos
   direcciones a la vez:**

     · 8 oct 2026 — se retiro el generador SAC y la lista siguio anunciando un
       «lote semanal de actividades» cuya ruta ya no existia, mientras callaba
       `snapshot-prediccion`.
     · 12 oct 2026 — el snapshot se FUSIONO dentro de `/api/cron/diario`, y la
       lista se quedo anunciando `/api/cron/snapshot-prediccion` —ruta muerta y
       cron inexistente— mientras callaba `diario`, que corre TODOS los dias.

   Y la misma ruta muerta estaba en `next.config.js`, declarando el trazado de
   ficheros de una lambda que no se construye.

   El modo de fallo es el peor que hay: un cron que no corre no da error, y un
   panel de estado que miente convierte «no se entero nadie» en «el panel decia
   que estaba bien».

   QUE COMPRUEBA
   -------------
   1. Toda ruta de `vercel.json` tiene su `app/api/cron/<x>/route.ts`.
   2. La lista `tareas` de `/api/cron/estado` trae EXACTAMENTE las mismas rutas
      que `vercel.json`, y con el MISMO horario.
   3. Ningun `app/api/cron/*/route.ts` se queda sin entrada en `vercel.json`
      — salvo el propio `estado`, que se consulta a mano y no se programa.
   4. Toda llave de `outputFileTracingIncludes` de `next.config.js` apunta a una
      ruta que de verdad existe (`route.ts` o `page.tsx`).
   5. `outputFileTracingIncludes` esta DENTRO de `experimental`. En Next 14 vive
      ahi; en la raiz, Next la rechaza entera con un aviso que se pierde entre
      la salida del build y NINGUNA de las declaraciones se aplica.

   USO
       python scripts/revisa-crons.py
"""
import io
import os
import re
import sys
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(RAIZ, 'app')
fallas = []


def lee(*partes):
    # `utf-8-sig` y no `utf-8`: PowerShell escribe BOM con `Set-Content
    # -Encoding utf8`, y con BOM `json.loads` revienta con una traza en vez de
    # decir lo que pasa. Me lo hice yo mismo probando este guion. `utf-8-sig`
    # lee igual de bien un archivo sin BOM, asi que no cuesta nada.
    with io.open(os.path.join(RAIZ, *partes), encoding='utf-8-sig') as f:
        return f.read()


def existe_ruta(ruta):
    u"""¿Hay un route.ts o un page.tsx para esta ruta de Next?"""
    rel = ruta.strip('/')
    base = os.path.join(APP, *rel.split('/')) if rel else APP
    return (os.path.exists(os.path.join(base, 'route.ts'))
            or os.path.exists(os.path.join(base, 'route.tsx'))
            or os.path.exists(os.path.join(base, 'page.tsx')))


def main():
    # ── 1. vercel.json ────────────────────────────────────────────────────
    vercel = json.loads(lee('vercel.json'))
    programadas = {c['path']: c['schedule'] for c in vercel.get('crons', [])}
    if not programadas:
        fallas.append('vercel.json no declara NINGUN cron: o se borraron, o '
                      'este guion esta leyendo mal el archivo')
        print(u'  ** vercel.json no declara ningun cron\n')
    print(u'  PROGRAMADAS EN vercel.json (%d)' % len(programadas))
    for ruta, horario in sorted(programadas.items()):
        ok = existe_ruta(ruta)
        if not ok:
            fallas.append(u'vercel.json programa %s y esa ruta NO existe' % ruta)
        print(u'    %-34s %-14s %s'
              % (ruta, horario, u'ok' if ok else u'** la ruta NO existe'))

    # ── 2. la lista que el panel de estado anuncia ────────────────────────
    estado = lee('app', 'api', 'cron', 'estado', 'route.ts')
    m = re.search(r'tareas:\s*\[(.*?)\]', estado, re.S)
    if not m:
        fallas.append(u'no se pudo leer la lista `tareas` de /api/cron/estado: '
                      u'sin ella NO se comprueba nada, y eso es un fallo')
        print(u'\n  ** no se pudo leer `tareas` de /api/cron/estado')
        anunciadas = {}
    else:
        anunciadas = {a: b for a, b in re.findall(
            r"ruta:\s*'([^']+)'\s*,\s*horario:\s*'([^']+)'", m.group(1))}

    print(u'\n  ANUNCIADAS EN /api/cron/estado (%d)' % len(anunciadas))
    for ruta, horario in sorted(anunciadas.items()):
        if ruta not in programadas:
            fallas.append(u'/api/cron/estado anuncia %s, que NO esta en '
                          u'vercel.json (se anuncia un cron que no corre)' % ruta)
            print(u'    %-34s %-14s ** NO esta en vercel.json' % (ruta, horario))
        elif programadas[ruta] != horario:
            fallas.append(u'%s: estado dice «%s» y vercel.json dice «%s»'
                          % (ruta, horario, programadas[ruta]))
            print(u'    %-34s %-14s ** vercel.json dice «%s»'
                  % (ruta, horario, programadas[ruta]))
        else:
            print(u'    %-34s %-14s ok' % (ruta, horario))

    for ruta in sorted(set(programadas) - set(anunciadas)):
        fallas.append(u'/api/cron/estado CALLA %s, que si esta programado '
                      u'(si falla, nadie se entera)' % ruta)
        print(u'    %-34s %-14s ** el panel lo CALLA' % (ruta, u'—'))

    # ── 3. rutas de cron que nadie programa ───────────────────────────────
    dir_cron = os.path.join(APP, 'api', 'cron')
    existentes = {u'/api/cron/' + d for d in sorted(os.listdir(dir_cron))
                  if os.path.isdir(os.path.join(dir_cron, d))}
    # `estado` es un diagnostico que se consulta a mano: no lleva cron.
    huerfanas = existentes - set(programadas) - {u'/api/cron/estado'}
    print(u'\n  RUTAS DE CRON SIN PROGRAMAR (%d)' % len(huerfanas))
    for ruta in sorted(huerfanas):
        fallas.append(u'%s existe y NO esta en vercel.json: no corre nunca' % ruta)
        print(u'    %-34s ** existe pero no corre nunca' % ruta)
    if not huerfanas:
        print(u'    ninguna')

    # ── 4 y 5. el trazado de ficheros de next.config.js ───────────────────
    cfg = lee('next.config.js')
    m = re.search(r'outputFileTracingIncludes:\s*\{(.*?)\n  \}', cfg, re.S)
    claves = re.findall(r"^\s*'([^']+)':\s*\[", m.group(1), re.M) if m else []
    print(u'\n  TRAZADO DE FICHEROS · %d ruta(s) declarada(s)' % len(claves))
    if not claves:
        fallas.append(u'no se pudo leer `outputFileTracingIncludes` de '
                      u'next.config.js: sin eso no se comprueba nada')
        print(u'    ** no se pudo leer la declaracion')
    for ruta in claves:
        ok = existe_ruta(ruta)
        if not ok:
            fallas.append(u'next.config.js declara trazado para %s, que NO '
                          u'existe: esa declaracion no hace nada' % ruta)
        print(u'    %-34s %s' % (ruta, u'ok' if ok else u'** la ruta NO existe'))

    # Que este dentro de `experimental`. En la raiz, Next 14 la rechaza ENTERA.
    #
    # Y se comprueba el EFECTO, no la grafia: la declaracion puede estar escrita
    # ahi mismo o venir de un `...CONST` que la contiene. La primera version de
    # este bloque buscaba el literal dentro del bloque `experimental` y acusaba
    # en falso a la forma que el propio archivo usa — un detector que exige UNA
    # redaccion acaba obligando a escribir el codigo peor.
    exp = re.search(r'experimental:\s*\{(.*?)\n  \}', cfg, re.S)
    cuerpo_exp = exp.group(1) if exp else ''
    dentro = 'outputFileTracingIncludes' in cuerpo_exp
    if not dentro:
        for const in re.findall(r'\.\.\.(\w+)', cuerpo_exp):
            m2 = re.search(r'const\s+' + const + r'\s*=\s*\{(.*?)\n\}', cfg, re.S)
            if m2 and 'outputFileTracingIncludes' in m2.group(1):
                dentro = True
                break
    print(u'\n  outputFileTracingIncludes dentro de `experimental`: %s'
          % (u'si' if dentro else u'** NO — Next 14 la rechaza entera'))
    if not dentro:
        fallas.append(u'`outputFileTracingIncludes` no esta dentro de '
                      u'`experimental`: Next 14 la rechaza y NINGUNA de las '
                      u'declaraciones se aplica')

    print()
    if fallas:
        print(u'  %d FALLAS' % len(fallas))
        for f in fallas:
            print(u'    - %s' % f)
        return 1
    print(u'  lo programado, lo anunciado y lo que existe son la misma lista')
    return 0


if __name__ == '__main__':
    sys.exit(main())
