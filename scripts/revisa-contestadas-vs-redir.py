# -*- coding: utf-8 -*-
u"""¿Cuantas auditorias publican `c` como «contestadas»? Es un error de rotulo.

   POR QUE EXISTE
   --------------
   `lib/llamadas-cuenta.ts` define el campo `c` de cada destino asi:

       «NO PERDIDAS por este destino: todo lo que no fue Lost. No es
        "contestadas", aunque se publico con ese rotulo hasta el 7 oct 2026:
        dentro van las que resolvio el menu y las que cayeron al buzon. Para
        atencion por una persona, `redir`.»

   O sea que `c` = redir + ivr + buzon. Publicar `c` como «contestadas» infla
   la atencion con las llamadas que resolvio una maquina o que murieron en un
   buzon. El 13 oct 2026 lo cometi en la auditoria de PROBEMEDIC —dije «se
   contesta el 97.6% de las veces» cuando por persona es el 96.0%— y lo tenia
   DOCUMENTADO en memoria desde antes.

   Este guion mide, para cada CID con auditoria escrita, cuanto se separan las
   dos lecturas. Donde la separacion es grande, la auditoria hay que releerla.

   USO
       python scripts/revisa-contestadas-vs-redir.py
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Las cuentas con auditoria escrita, por CID.
AUDITADAS = [
    ('130723', 'Torres Corzo (D1)'),
    ('2094',   'Tech People (C1)'),
    ('167954', 'System OOAPAS (D2)'),
    ('12526',  'Seccion Amarilla (F3)'),
    ('177810', 'IMPAS (Z63)'),
    ('164581', 'ECODELI (C2)'),
    ('162545', 'ODONTOPREV (C13)'),
    ('112478', 'PROBEMEDIC (F7)'),
    ('24924',  'Ancona (F4)'),
]

txt = io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'), encoding='utf-8').read()

print(u'  Las DOS lecturas de «atendida», por cuenta auditada.')
print(u'  · `c` (lo que publique) = redir + ivr + buzon')
print(u'  · `redir` = las que llegaron a UNA PERSONA, que es la definicion de la casa\n')
print(u'  %-24s %9s %9s %9s %9s %8s %8s %7s'
      % (u'cuenta', u'entrantes', u'c', u'redir', u'ivr+buzon', u'%c', u'%redir', u'delta'))
print(u'  ' + u'─' * 96)

peores = []
for cid, nombre in AUDITADAS:
    m = re.search(r'^\s*"' + cid + r'":\s*(\{.*\}),\s*$', txt, re.M)
    if not m:
        print(u'  %-24s SIN LECTURA DE LLAMADAS' % nombre)
        continue
    d = json.loads(m.group(1))
    e = d.get('ent') or {}
    dest = e.get('dest') or []
    tot = e.get('total', 0)
    c = sum(x.get('c', 0) for x in dest)
    redir = sum(x.get('redir', 0) for x in dest)
    ivr = sum(x.get('ivr', 0) for x in dest)
    buzon = sum(x.get('buzon', 0) for x in dest)
    # El contrato dice que redir+ivr+buzon tiene que cerrar contra c. Si no
    # cierra, el archivo no trae el desglose y no se puede medir.
    cierra = (redir + ivr + buzon) == c
    pc = 100.0 * c / tot if tot else 0
    pr = 100.0 * redir / tot if tot else 0
    marca = u''
    if cierra and (pc - pr) >= 1.0:
        marca = u'  <<< RELEER'
        peores.append((nombre, pc - pr, ivr + buzon))
    print(u'  %-24s %9s %9s %9s %9s %7.2f%% %7.2f%% %+6.2f%s'
          % (nombre[:24], u'{:,}'.format(tot), u'{:,}'.format(c), u'{:,}'.format(redir),
             u'{:,}'.format(ivr + buzon), pc, pr, pc - pr,
             marca if cierra else u'  (no cierra: sin desglose)'))

print(u'\n  ══ LAS QUE HAY QUE RELEER ══')
if not peores:
    print(u'  ninguna se separa mas de un punto.')
else:
    for n, delta, ib in sorted(peores, key=lambda x: -x[1]):
        print(u'  %-26s infla %.2f puntos · %s llamadas que no llegaron a una persona'
              % (n, delta, u'{:,}'.format(ib)))
print(u'\n  Una separacion grande NO significa que la auditoria este mal: si dijo')
print(u'  con palabras que contestaba una maquina, el numero esta bien usado.')
print(u'  Significa que hay que LEERLA para comprobar cual de las dos cosas dice.')
