# -*- coding: utf-8 -*-
u"""ENVUELVE EN `rico()` LA PROSA DE AuditoriaDetail.tsx.

   Los 42 expedientes se escriben con dos marcas —`**enfasis**` y
   `` `identificador` ``— y la pantalla las publicaba literales. Al 28 oct 2026
   eran 70 marcas de enfasis en seis expedientes, y backticks en casi todos.

   Un solo campo (`necesidad_negocio`) ya las pintaba, con
   `dangerouslySetInnerHTML` y una expresion regular suelta. O sea que la
   intencion estaba, aplicada en uno de treinta y ocho sitios.

   REEMPLAZOS CONTADOS: cada par lleva cuantas veces TIENE que aparecer. Si uno
   solo no cuadra, NO SE ESCRIBE NADA. Un archivo a medio envolver parece
   envuelto. [[feedback-verificar-antes-asegurar]]

   USO
       python scripts/aplica-rico.py            # simulacro, no escribe
       python scripts/aplica-rico.py --aplicar
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA = os.path.join(RAIZ, 'app', 'auditoria', 'AuditoriaDetail.tsx')
APLICAR = '--aplicar' in sys.argv

# (viejo, nuevo, veces). Solo PROSA: nada de etiquetas, numeros ni nombres de
# columna, que no llevan marcas y envolverlos solo anade ruido.
PARES = [
    # — Resumen y hallazgos —
    (u'>{h}</p>', u'>{rico(h)}</p>', 1),
    (u'<span>{h}</span>', u'<span>{rico(h)}</span>', 1),
    (u'{caso.resultado_positivo}</p>', u'{rico(caso.resultado_positivo)}</p>', 1),
    (u'{caso.senal_alarma}</p>', u'{rico(caso.senal_alarma)}</p>', 1),
    (u'{caso.problema_raiz_detalle}</p>', u'{rico(caso.problema_raiz_detalle)}</p>', 1),
    (u'{caso.auditoria_servicio.diagnostico}</p>',
     u'{rico(caso.auditoria_servicio.diagnostico)}</p>', 1),
    (u'{caso.conclusion}</p>', u'{rico(caso.conclusion)}</p>', 1),
    (u'{caso.recomendacion_central}</p>', u'{rico(caso.recomendacion_central)}</p>', 1),
    # — Listas de una linea —
    (u'{i}\n', u'{rico(i)}\n', 4),            # potencial_corto/largo, pierde, gana
    (u'{item}\n', u'{rico(item)}\n', 4),      # las cuatro patas del FODA
    # — Tablas y fichas —
    (u'{r.value}</p>', u'{rico(r.value)}</p>', 1),
    (u'{r.descripcion}</td>', u'{rico(r.descripcion)}</td>', 1),
    (u'{r.impacto}</td>', u'{rico(r.impacto)}</td>', 1),
    (u'{m.lectura}</td>', u'{rico(m.lectura)}</td>', 1),
    (u'{r.causa}</p>', u'{rico(r.causa)}</p>', 1),
    (u'{r.real}</td>', u'{rico(r.real)}</td>', 1),
    (u'{r.ideal}</td>', u'{rico(r.ideal)}</td>', 1),
    # Los tres planes (inmediato, mediano, estrategico) comparten la plantilla.
    (u'{a.accion}</p>', u'{rico(a.accion)}</p>', 3),
    (u'{a.criterio}</span>', u'{rico(a.criterio)}</span>', 3),
    (u'{o.impacto}</p>', u'{rico(o.impacto)}</p>', 1),
    (u'{e.evento}</p>', u'{rico(e.evento)}</p>', 1),
]

t = io.open(RUTA, encoding='utf-8').read()
original = t
fallos, hechos = [], []

for viejo, nuevo, veces in PARES:
    hay = t.count(viejo)
    if hay != veces:
        fallos.append((viejo, veces, hay))
    else:
        hechos.append((viejo, veces))

print(u'\n  ══ ENVOLVER PROSA EN `rico()` · %s ══════════════'
      % (u'APLICANDO' if APLICAR else u'SIMULACRO'))
for viejo, veces in hechos:
    print(u'  ok   %-46s x%d' % (viejo.replace('\n', '\\n')[:46], veces))
for viejo, esp, hay in fallos:
    print(u'  ***  %-46s esperaba %d, hay %d'
          % (viejo.replace('\n', '\\n')[:46], esp, hay))

if fallos:
    print(u'\n  %d par(es) no cuadran. NO SE ESCRIBE NADA: un archivo a medio'
          u' envolver parece envuelto.' % len(fallos))
    sys.exit(1)

for viejo, nuevo, _ in PARES:
    t = t.replace(viejo, nuevo)

# El import, una sola vez y solo si falta.
if u"from './Rico'" not in t:
    ancla = u"import { "
    i = t.index(ancla)
    t = t[:i] + u"import { rico } from './Rico'\n" + t[i:]
    print(u'  ok   import de `rico` anadido')

if t == original:
    print(u'\n  nada que cambiar.')
    sys.exit(0)

if APLICAR:
    io.open(RUTA, 'w', encoding='utf-8', newline='\n').write(t)
    print(u'\n  escrito: %s' % RUTA)
else:
    print(u'\n  %d sitio(s) listos. Correr con --aplicar para escribir.'
          % sum(v for _, v in hechos))
