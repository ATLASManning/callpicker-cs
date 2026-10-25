# -*- coding: utf-8 -*-
u"""INVARIANTES DEL MODULO DE CONTRATOS.

   Lo que tiene que seguir siendo cierto despues de cada carga de la hoja. No
   mira la pantalla: mira el dato y las reglas que la pantalla promete.

   LAS PROMESAS QUE SE COMPRUEBAN
   ------------------------------
   1. Los cuatro estados AGOTAN los contratos. Si llega un estatus nuevo que
      ninguna regla reconoce, cae en `sin_estatus` — y eso se leeria como un
      hueco de captura cuando en realidad es vocabulario nuevo. Se grita.
   2. Las TRES clases de vencimiento agotan los contratos: con fecha, «libre»,
      y no se sabe. Son tres y no dos a proposito.
   3. Ningun contrato con fecha de fin se cuenta como «sin vencimiento».
   4. El CID, cuando esta, es numerico: por ahi cruza con la cartera y un CID
      con basura no cruza y nadie se entera.
   5. «fima» NO debe quedar sin normalizar: si aparece un estatus con ese
      dedazo que el regex no cubre, se dice.

   Es de SOLO LECTURA.

   USO
       python scripts/verifica-contratos.py
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA = os.path.join(RAIZ, 'data', 'contratos.json')

ESTADOS = ('firmado', 'en_proceso', 'no_firmado', 'sin_estatus')
fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'\n          ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


def main():
    if not os.path.exists(RUTA):
        print(u'  *** no existe %s — correr gen-contratos.py primero.' % RUTA)
        return 2
    d = json.load(io.open(RUTA, encoding='utf-8'))
    cs, meta = d['contratos'], d['meta']

    print(u'\n  CONTRATOS — invariantes')
    print(u'  ' + u'=' * 68)
    print(u'  %d contrato(s) · origen %s · generado %s'
          % (len(cs), meta.get('origen'), meta.get('generado', '')[:16]))

    # 1 · los estados agotan
    print(u'\n  ESTADOS')
    por = {}
    for c in cs:
        por[c['estado']] = por.get(c['estado'], 0) + 1
    for e in ESTADOS:
        print(u'    %-14s %3d' % (e, por.get(e, 0)))
    exige(sum(por.values()) == len(cs), u'los estados agotan los contratos')
    exige(all(e in ESTADOS for e in por), u'no hay ningun estado fuera del vocabulario',
          u'sobrantes: %s' % [e for e in por if e not in ESTADOS])

    # 2 · las tres clases de vencimiento
    print(u'\n  VENCIMIENTO — tres clases, no dos')
    conFin = [c for c in cs if c['finMedible']]
    libres = [c for c in cs if c['sinVencimiento']]
    nose = [c for c in cs if not c['finMedible'] and not c['sinVencimiento']]
    print(u'    con fecha de fin ....... %3d' % len(conFin))
    print(u'    sin vencimiento (libre)  %3d' % len(libres))
    print(u'    NO SE SABE ............. %3d' % len(nose))
    exige(len(conFin) + len(libres) + len(nose) == len(cs),
          u'las tres clases agotan los contratos')
    exige(not [c for c in cs if c['finMedible'] and c['sinVencimiento']],
          u'ninguno con fecha se cuenta ademas como «sin vencimiento»')

    # 3 · el CID cruza
    print(u'\n  CID')
    conCid = [c for c in cs if c['cid']]
    malos = [c for c in conCid if not re.fullmatch(r'\d+', c['cid'])]
    print(u'    con CID ................ %3d de %d' % (len(conCid), len(cs)))
    exige(not malos, u'todos los CID son numericos',
          u'con basura: %s' % [(c['cuenta'], c['cid']) for c in malos][:4])

    # 4 · el dedazo
    print(u'\n  EL DEDAZO «fima»')
    fima = [c for c in cs
            if c.get('estatusHoja') and re.search(r'\bfima\b', c['estatusHoja'], re.I)]
    sin_normalizar = [c for c in fima if c['estado'] == 'sin_estatus']
    print(u'    estatus con «fima» ..... %3d' % len(fima))
    exige(not sin_normalizar,
          u'ningun «fima» se quedo sin normalizar',
          u'quedaron: %s' % [(c['cuenta'], c['estatusHoja']) for c in sin_normalizar][:4])

    # 5 · la meta dice la verdad
    print(u'\n  LA META CUADRA CON LAS FILAS')
    exige(meta['total'] == len(cs), u'meta.total es el numero de filas',
          u'%s contra %d' % (meta['total'], len(cs)))
    exige(meta['conFin'] == len(conFin), u'meta.conFin cuadra')
    exige(meta['noMedibles'] == len(nose), u'meta.noMedibles cuadra')

    print(u'\n  ' + u'=' * 68)
    if fallos:
        print(u'  *** %d COMPROBACION(ES) FALLAN: %s' % (len(fallos), u' · '.join(fallos)))
        return 1
    print(u'  Todas las promesas del modulo se sostienen.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
