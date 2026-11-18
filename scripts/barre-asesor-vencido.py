# -*- coding: utf-8 -*-
u"""
UN NOMBRE DE ASESOR EN EL LADO EQUIVOCADO DEL RELEVO
=====================================================

    python scripts/barre-asesor-vencido.py            # revisa y NO escribe
    python scripts/barre-asesor-vencido.py --escribe  # aplica

EL PROBLEMA
-----------
El 15 oct 2026 la cartera de Claudia Hernández pasó a Erick Sánchez. Se
corrigió `cuentas.asesor` en la tabla y el campo `asesor:` de los expedientes.
No se corrigió **la prosa**: once expedientes seguían diciendo
`asesor: 'Erick'` arriba y `responsable: 'Claudia'` en sus planes. ALTERNET
llegaba al extremo de que su `senal_alarma` —el campo que
`veredicto-candidatura.py` publica recortado a 200 caracteres y que lee quien
redacta el siguiente reporte de cliente— decía «Claudia debe identificar el
estado de esa cuenta».

QUÉ NO SE TOCA, Y POR QUÉ ES LA MITAD DEL TRABAJO
--------------------------------------------------
Una entrada de cronología que dice qué hizo Claudia en junio de 2026 es un
DATO CORRECTO. Borrarla no arregla nada: inventa un pasado en el que la cuenta
no tuvo asesora. Lo mismo con las frases que describen un acto suyo —«Claudia
ofreció las dos contraofertas», «Claudia abre el ticket de alcance»— y con el
hallazgo de NERUC que manda confirmar una cifra CON ella, porque ella es la
fuente de esa cifra.

LA REGLA, QUE SE PUEDE COMPROBAR
---------------------------------
En una línea de un expediente:

  · lleva `fecha:`                      -> es cronología. HISTORIA, no se toca.
  · lleva `accion:` o `impacto:`
    y un `responsable:` con Claudia     -> es instrucción VIVA. Pasa a Erick.
  · todo lo demás                       -> va en la lista explícita de abajo,
                                           revisada una por una.

Al final el guion EXIGE que cada «Claudia» que siga en pie esté en una línea
con `fecha:` o en la lista de historia declarada. Un nombre que no esté en
ninguna de las dos es un hallazgo, no un descuido.
[[erick-sustituye-a-claudia]] [[feedback-auditorias-verificar]]
"""
from __future__ import print_function
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(RAIZ, 'app', 'auditoria')
ESCRIBE = '--escribe' in sys.argv

SALE, ENTRA = u'Claudia', u'Erick'
RAYA = u'─'   # la raya de los rótulos de `registry.ts`

# ── Lo que la regla de línea no alcanza, revisado uno por uno ───────────────
# (archivo, texto exacto que está, texto que debe quedar)
EXPLICITOS = [
    # ALTERNET · el peor caso: la ficha, la señal de alarma que se publica, la
    # conclusión y la recomendación central.
    ('alternet-data.ts',
     u'13,234 llamadas analizadas · Asesor: Claudia ·',
     u'13,234 llamadas analizadas · Asesor: Erick ·'),
    ('alternet-data.ts',
     u'Claudia debe identificar el estado de esa cuenta',
     u'Erick debe identificar el estado de esa cuenta'),
    ('alternet-data.ts',
     u"area: 'Claudia / Equipo SAC'",
     u"area: 'Erick / Equipo SAC'"),
    ('alternet-data.ts',
     u"area: 'Equipo Alternet / Claudia'",
     u"area: 'Equipo Alternet / Erick'"),
    ('alternet-data.ts',
     u'Claudia tiene 2 semanas para capitalizarla',
     u'Erick tiene 2 semanas para capitalizarla'),
    ('alternet-data.ts',
     u'Claudia posicionada como asesora estratégica, no reactiva',
     u'Erick posicionado como asesor estratégico, no reactivo'),
    ('alternet-data.ts',
     u'Claudia debe actuar en dos frentes esta semana.',
     u'Erick debe actuar en dos frentes esta semana.'),
    ('alternet-data.ts',
     u'El movimiento es de Claudia.',
     u'El movimiento es de Erick.'),

    # LABSUS · la reunión bisagra y el evento pendiente de la cronología. El
    # evento lleva `fecha:` pero su fecha es «Lunes (pending)», que no es una
    # fecha pasada: es una tarea. La regla de línea lo protegería por error.
    ('labsus-data.ts',
     u"{ fecha: 'Lunes (pending)', responsable: 'José Manuel + Claudia + Jennyffer'",
     u"{ fecha: 'Lunes (pending)', responsable: 'José Manuel + Erick + Jennyffer'"),
    ('labsus-data.ts',
     u"area: 'José Manuel + Claudia + Jennyffer'",
     u"area: 'José Manuel + Erick + Jennyffer'"),

    # SOFIA · la ventana abierta («Esta semana», «Hoy»): tareas, no historia.
    ('sofia-data.ts',
     u"{ fecha: 'Esta semana',     responsable: 'Claudia / Dirección SAC'",
     u"{ fecha: 'Esta semana',     responsable: 'Erick / Dirección SAC'"),
    ('sofia-data.ts',
     u"area: 'Claudia / Dirección'",
     u"area: 'Erick / Dirección'"),

    # VAEO · el campo de ficha que se lee como la asignación vigente.
    ('vaeo-business-club-data.ts',
     u'Consecutivo C51 · Asesor SAC: Claudia',
     u'Consecutivo C51 · Asesor SAC: Erick'),

    # TRAVELLING · tres frases en PRESENTE sobre una negociación en curso.
    ('travelling-data.ts',
     u'Receptor del análisis de consumo y ajuste de plan que gestiona Claudia',
     u'Receptor del análisis de consumo y ajuste de plan que gestiona Erick'),
    ('travelling-data.ts',
     u'El ajuste de plan que Claudia evalúa es consistente',
     u'El ajuste de plan que Erick evalúa es consistente'),
    ('travelling-data.ts',
     u'El ajuste de plan que Claudia está negociando resuelve',
     u'El ajuste de plan que Erick está negociando resuelve'),

    # NERUC · el flujo describe un acto PASADO suyo; lo que cambia es quién
    # tiene que confirmarlo hoy, y eso está en `plan_*` (lo ve la regla).

    # REGISTRY · el rótulo del bloque. Es un comentario, pero es el padrón que
    # lee una persona para saber de quién es cada expediente, y decía Claudia.
    # Los guiones de los rótulos se CONSTRUYEN, no se teclean: contarlos a
    # mano ya falló una vez aquí mismo y el guion abortó sin encontrar la
    # línea. [[feedback-verificar-antes-asegurar]]
    ('registry.ts',
     u'  // ' + RAYA * 2 + u' Claudia ' + RAYA * 63,
     u'  // ' + RAYA * 2 + u' Erick · la cartera que recibió el 15 oct 2026 '
     + RAYA * 20 + u'\n'
     u'  //    (Era la cartera de Claudia Hernández. El rótulo decía su nombre\n'
     u'  //     hasta el 18 nov 2026, un mes después del relevo: `cuentas.asesor`\n'
     u'  //     ya decía Erick y este padrón no. Ver [[erick-sustituye-a-claudia]].)'),
    ('registry.ts',
     u'  // ' + RAYA * 2 + u' Erick ' + RAYA * 65 + u'\n'
     u'  //    (El bloque rotulado «Claudia» de arriba también es cartera de Erick\n'
     u'  //     desde el 15 oct 2026; el rótulo se dejó como estaba para no mezclar\n'
     u'  //     este cambio con ese. Ver [[erick-sustituye-a-claudia]].)',
     u'  // ' + RAYA * 2 + u' Erick · altas posteriores al relevo ' + RAYA * 36 + u'\n'
     u'  //    (Dos expedientes del bloque «Dan» de arriba también son suyos según\n'
     u'  //     `cuentas.asesor`: VAEO Business Club (C51) y NERUC Sede Central\n'
     u'  //     (C9). No se movieron de sitio porque el orden de este arreglo no\n'
     u'  //     es el agrupamiento, y moverlos cambiaría algo que no se ha medido.\n'
     u'  //     Lo comprueba `scripts/mide-cartera-asesor.py` contra la tabla.)'),
]

# ── La historia declarada: cada «Claudia» que se queda, y por qué ───────────
# No es una lista de excepciones: es la razón escrita de cada una. Si mañana
# aparece un nombre que no está aquí ni en una línea con `fecha:`, el guion lo
# señala.
HISTORIA = {
    'labsus-data.ts': [
        (u'Jennyffer y Claudia ya acordaron',
         u'quién acordó el cambio de timbrado, y lo acordó ella'),
    ],
    'rds-invest-vacay-data.ts': [
        (u'cuando Claudia ofreció ajuste de plan',
         u'qué se ofreció en la llamada de cancelación y quién lo ofreció'),
        (u'Claudia ofreció las dos contraofertas disponibles',
         u'la atención de la cancelación fue correcta: es su mérito'),
        (u'compromiso de Claudia',
         u'el compromiso lo asumió ella el 28 ago, antes del relevo'),
    ],
    'neruc-sede-central-data.ts': [
        (u'Pendiente confirmar con Claudia la regla exacta',
         u'ella aplicó la corrección del CRM: es la FUENTE de esa cifra'),
        (u'no usar hasta confirmar con Claudia',
         u'misma razón: la cifra es suya y sólo ella sabe la regla'),
        (u"area: 'CS (Claudia)'",
         u'el flujo describe quién aplicó la corrección, en pasado'),
        (u'Confirmar con Claudia la regla exacta',
         u'el responsable pasa a Erick, pero a quien hay que preguntar es a '
         u'ella: la cifra del CRM la calculó ella'),
    ],
    'sofia-data.ts': [
        (u'Claudia abre ticket de alcance',
         u'quién abrió el ticket el 28 ago, antes del relevo'),
    ],
    'odontoprev-data.ts': [
        (u'✓ HECHO el 13 oct 2026',
         u'lo ejecutó ella el 13 oct, DOS DÍAS antes del relevo: '
         u'reasignarlo pone a una persona del lado equivocado de la fecha'),
        (u"responsable: 'Claudia / Cisneros'",
         u'el último contacto efectivo, del 22 jul 2026'),
    ],
    'hospital-santa-rosa-data.ts': [
        (u'Claudia Hernández',
         u'este expediente YA documenta el relevo y la nombra a propósito'),
        (u'Asesor de apertura: Claudia',
         u'quién abrió las cuatro alertas el 6 oct, antes del relevo'),
        (u'sustitución de Claudia',
         u'el relevo mismo, que es el dato'),
        (u'no Claudia Hernández',
         u'la prohibición de citarla, dicha como prohibición'),
        (u'sustituye a Claudia',
         u'el evento del 15 oct 2026 en la cronología'),
        (u'antes Claudia Hernández',
         u'de quién recibió la cuenta'),
        (u'a Claudia Hernández. Corregido',
         u'la nota de rigor sobre el reporte entregado'),
    ],
    'registry.ts': [
        (u'Era la cartera de Claudia Hernández',
         u'de quién era este bloque antes del 15 oct 2026'),
        (u'El rótulo decía su nombre',
         u'la nota de la propia corrección'),
    ],
}

ARCHIVOS = sorted(f for f in os.listdir(DIR) if f.endswith('.ts'))
cambios_total, pendientes = 0, []

print(u'')
print(u'  BARRIDO DE «%s» EN LOS EXPEDIENTES  %s'
      % (SALE, u'(aplicando)' if ESCRIBE else u'(solo revisa)'))
print(u'  ' + u'═' * 74)

for nombre in ARCHIVOS:
    ruta = os.path.join(DIR, nombre)
    texto = io.open(ruta, encoding='utf-8').read()
    if SALE not in texto:
        continue
    original = texto
    hechos = []

    # 1 · la regla de línea
    lineas = texto.split('\n')
    for i, l in enumerate(lineas):
        if SALE not in l or 'fecha:' in l:
            continue
        # UNA ACCIÓN YA EJECUTADA ES HISTORIA, aunque viva en un `plan_*`.
        #
        # La primera versión de esta regla no lo distinguía y reasignó a Erick
        # el «✓ HECHO el 13 oct 2026» de ODONTOPREV — que Claudia ejecutó DOS
        # DÍAS antes del relevo. Eso no es corregir una asignación vencida: es
        # poner a una persona del lado equivocado de una fecha, que es
        # precisamente una de las ocho clases de error que esta casa persigue.
        # [[feedback-auditorias-verificar]]
        if re.search(r"accion:\s*'\s*(✓|HECHO|YA\s)", l):
            continue
        if ('accion:' in l or 'impacto:' in l) and 'responsable:' in l:
            def _cambia(m):
                return m.group(0).replace(SALE, ENTRA)
            nueva = re.sub(r"responsable:\s*'[^']*'", _cambia, l)
            if nueva != l:
                lineas[i] = nueva
                hechos.append(u'linea %d · responsable de una accion' % (i + 1))
    texto = '\n'.join(lineas)

    # 2 · los explícitos
    for arch, viejo, nuevo in EXPLICITOS:
        if arch != nombre:
            continue
        if viejo not in texto:
            # YA APLICADO no es un error. Este guion hace dos trabajos: la
            # migración de una vez y el candado que se queda. Si un texto
            # viejo falta pero el nuevo ya está, la migración corrió y lo que
            # sigue sirviendo es el candado. Abortar aquí dejaba el guion
            # inservible justo después de usarlo — que es cuando empieza a
            # hacer falta. [[feedback-verificar-antes-asegurar]]
            if nuevo.split('\n')[0] in texto:
                continue
            print(u'    %-30s *** no encuentro NI el texto viejo NI el nuevo:'
                  % nombre)
            print(u'        viejo: %s' % viejo.split('\n')[0][:62])
            print(u'        nuevo: %s' % nuevo.split('\n')[0][:62])
            print(u'        Alguien reescribió esa línea. Hay que mirarla.')
            sys.exit(2)
        texto = texto.replace(viejo, nuevo)
        hechos.append(u'explicito · %s' % viejo[:46])

    if hechos:
        cambios_total += len(hechos)
        print(u'\n  %s' % nombre)
        for h in hechos:
            print(u'      %s' % h)
        if ESCRIBE and texto != original:
            io.open(ruta, 'w', encoding='utf-8', newline='').write(texto)

    # 3 · lo que queda en pie tiene que estar declarado
    #
    # Antes de buscar se VACÍAN los comentarios de bloque `/* */`, que es donde
    # viven las cabeceras que DOCUMENTAN esta misma corrección. Sin esto, la
    # nota de LABSUS —«`responsable` decía Claudia Hernández y la cartera pasó
    # a Erick»— se denunciaba a sí misma y el candado quedaba en rojo para
    # siempre. Un verificador que cita el error que vigila no sirve de nada.
    #
    # Los `//` de una línea NO se recortan: en `registry.ts` los rótulos de
    # bloque son comentarios, y son justo lo que hay que vigilar.
    declarada = HISTORIA.get(nombre, [])
    sin_doc = re.sub(r'/\*[\s\S]*?\*/',
                     lambda m: re.sub(r'[^\n]', u' ', m.group(0)), texto)
    for i, l in enumerate(sin_doc.split('\n')):
        if SALE not in l:
            continue
        if 'fecha:' in l:
            continue
        if any(frase in l for frase, _ in declarada):
            continue
        pendientes.append((nombre, i + 1, re.sub(r'\s+', u' ', l.strip())[:120]))

print(u'')
print(u'  ' + u'═' * 74)
print(u'  %d cambio(s)%s' % (cambios_total, u'' if ESCRIBE else u' por aplicar'))

print(u'')
print(u'  LA HISTORIA QUE SE QUEDA, Y POR QUÉ')
print(u'  ' + u'─' * 74)
for nombre in sorted(HISTORIA):
    for frase, porque in HISTORIA[nombre]:
        print(u'    %-28s «%s»' % (nombre, frase[:34]))
        print(u'    %-28s   %s' % (u'', porque))

if pendientes:
    print(u'')
    print(u'  *** %d «%s» SIN CLASIFICAR ***' % (len(pendientes), SALE))
    print(u'  No están en una línea de cronología ni en la lista de historia.')
    print(u'  Cada una es una decisión: o es instrucción viva y pasa a %s, o es' % ENTRA)
    print(u'  historia y se declara en HISTORIA con su razón escrita.')
    for nombre, n, l in pendientes:
        print(u'      %s:%d  %s' % (nombre, n, l))
    sys.exit(1)

print(u'')
print(u'  Cada «%s» que sigue en pie es cronología o historia declarada.' % SALE)
sys.exit(0)
