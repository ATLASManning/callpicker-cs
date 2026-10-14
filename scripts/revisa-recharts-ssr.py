# -*- coding: utf-8 -*-
u"""Graficas de recharts renderizadas en el SERVIDOR: el bug de los clipPath.

EL DEFECTO (14 oct 2026, visto en /activaciones)
------------------------------------------------
recharts numera sus `clipPath` con un contador de MODULO:

    Prop `id` did not match. Server: "recharts1-clip" Client: "recharts2-clip"

En el servidor el contador arranca en 1 y avanza una vez por grafica; en el
navegador vuelve a arrancar, pero las graficas montan en otro orden y con otra
cuenta, asi que los ids no casan. React tira TODO el HTML del servidor y
re-renderiza la pagina entera en cliente —«the entire root will switch to
client rendering»—, que es mas lento y deja un error permanente en consola que
tapa los que si importan.

No se arregla con `suppressHydrationWarning`: eso calla el aviso y deja el
re-render. Se arregla NO renderizando la grafica en el servidor, que ademas no
cuesta nada: recharts mide el DOM para dibujar, asi que su render de servidor
no produce nada util.

QUE BUSCA ESTE DETECTOR
-----------------------
Una pagina de `app/` que NO declara `'use client'` —o sea, un Server
Component— y que importa un componente que usa recharts. Ese es el par que
produce el defecto.

La escotilla es importar por `next/dynamic` con `ssr: false`, y como eso solo
vale dentro de un modulo cliente, el patron del repo es un envoltorio
`*-cliente.tsx`. Un envoltorio asi se reconoce y no se acusa.

Uso:  python scripts/revisa-recharts-ssr.py
Sale con 1 si encuentra algun par sin envoltorio.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALTAR = {'node_modules', '.next', '.git', 'public', 'data'}


def lee(p):
    return io.open(p, encoding='utf-8', errors='replace').read()


def sin_comentarios(t):
    """Un import citado en un comentario no monta nada."""
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    return re.sub(r'(?m)^\s*//.*$', '', t)


def es_cliente(t):
    cab = t.lstrip()[:40]
    return cab.startswith("'use client'") or cab.startswith('"use client"')


def autoprueba():
    u"""Probar la validacion AL REVES: metiendole lo que NO debe pasar.

    Un detector que sale en verde sin que nadie compruebe que sabe ponerse en
    rojo es peor que no tenerlo. Aqui se le dan seis casos cuyo veredicto se
    conoce de antemano, incluidos los tres que ya le fallaron de verdad:
    el `import type`, el arnes que solo reexporta, y el comodin perezoso que
    cruzaba lineas y devolvia el nombre de otro import.
    """
    CASOS = [
        (u'pagina de servidor que monta recharts sin envolver', True,
         u"import Grafica from '@/components/charts/G'\n"
         u"export default function P(){ return <Grafica dato={1} /> }\n"),

        (u'la misma, envuelta en SoloEnCliente', False,
         u"import Grafica from '@/components/charts/G'\n"
         u"import SoloEnCliente from '@/components/charts/SoloEnCliente'\n"
         u"export default function P(){ return (\n"
         u"  <SoloEnCliente reserva={null}><Grafica dato={1} /></SoloEnCliente>) }\n"),

        (u'DOS usos y solo uno envuelto — tiene que seguir acusando', True,
         u"import Grafica from '@/components/charts/G'\n"
         u"import SoloEnCliente from '@/components/charts/SoloEnCliente'\n"
         u"export default function P(){ return (<>\n"
         u"  <SoloEnCliente><Grafica dato={1} /></SoloEnCliente>\n"
         u"  <Grafica dato={2} />\n"
         u"</>) }\n"),

        (u'pagina CLIENTE: no hay render de servidor', False,
         u"'use client'\n"
         u"import Grafica from '@/components/charts/G'\n"
         u"export default function P(){ return <Grafica dato={1} /> }\n"),

        (u'solo `import type`: no arrastra nada', False,
         u"import type { Fila } from '@/components/charts/G'\n"
         u"export default function P(){ const x: Fila[] = []; return <div>{x.length}</div> }\n"),

        (u'el comodin perezoso NO debe cruzar imports', True,
         u"import PageHeader from '@/components/PageHeader'\n"
         u"import Grafica from '@/components/charts/G'\n"
         u"export default function P(){ return <Grafica dato={1} /> }\n"),
    ]

    fallos = 0
    print(u'  AUTOPRUEBA — seis casos de veredicto conocido\n')
    for etq, debe_acusar, src in CASOS:
        t = sin_comentarios(src)
        acusa = False
        if not es_cliente(t):
            tramos = []
            for m in re.finditer(r'<SoloEnCliente\b', t):
                fin = t.find('</SoloEnCliente>', m.end())
                tramos.append((m.start(), fin if fin >= 0 else len(t)))
            d = '@/components/charts/G'
            mm = re.search(
                r"(?m)^\s*import\s+(\w+)[^;\n]*?from\s+'%s'" % re.escape(d), t)
            if mm:
                nombre = mm.group(1)
                usos = [u.start() for u in re.finditer(r'<%s\b' % re.escape(nombre), t)]
                if usos and not all(
                        any(a <= i <= b for a, b in tramos) for i in usos):
                    acusa = True
        ok = acusa == debe_acusar
        fallos += 0 if ok else 1
        print(u'    %s  %-52s  (acusa=%s, esperado=%s)'
              % ('ok  ' if ok else '*** ', etq, acusa, debe_acusar))
    print(u'\n  %s' % (u'los seis casos dan el veredicto esperado.' if not fallos
                       else u'*** %d caso(s) mal' % fallos))
    return 1 if fallos else 0


def main():
    if '--autoprueba' in sys.argv:
        return autoprueba()

    # ── 1. quien usa recharts, directa o indirectamente ──────────────────
    usa_recharts = set()
    importa = {}        # archivo -> set de modulos locales que importa
    todos = []

    for raiz, dirs, archivos in os.walk(RAIZ):
        dirs[:] = [d for d in dirs if d not in SALTAR]
        for a in archivos:
            if not a.endswith(('.tsx', '.ts')):
                continue
            p = os.path.join(raiz, a)
            rel = os.path.relpath(p, RAIZ).replace('\\', '/')
            t = sin_comentarios(lee(p))
            todos.append(rel)
            if re.search(r"from\s+'recharts'", t):
                usa_recharts.add(rel)
            # UN `import type` NO ARRASTRA NADA: TypeScript lo borra al
            # compilar, asi que no monta el modulo ni su recharts. Contarlo
            # acusaba en falso a `ActivacionesGrandes`, que sólo toma de
            # `ActivacionesCharts` la interfaz `RegistroItem`. Un detector con
            # falsos positivos deja de leerse, que es peor que no tenerlo.
            destinos = set()
            for m in re.finditer(
                    r"(?m)^\s*import\s+(type\s+)?([^;]*?)from\s+'(@/[^']+|\./[^']+|\.\./[^']+)'",
                    t):
                if m.group(1):                       # import type { X } from
                    continue
                if re.match(r'^\s*\{\s*type\s', m.group(2)):   # import { type X }
                    continue
                destinos.add(m.group(3))
            importa[rel] = destinos

    def resuelve(desde, spec):
        """Un especificador a la ruta relativa del repo, probando extensiones."""
        if spec.startswith('@/'):
            base = spec[2:]
        else:
            base = os.path.normpath(
                os.path.join(os.path.dirname(desde), spec)).replace('\\', '/')
        for ext in ('.tsx', '.ts', '/index.tsx', '/index.ts'):
            if base + ext in importa:
                return base + ext
        return None

    # cierre transitivo: quien arrastra recharts aunque sea de tercera mano
    arrastra = set(usa_recharts)
    cambio = True
    while cambio:
        cambio = False
        for rel, destinos in importa.items():
            if rel in arrastra:
                continue
            for d in destinos:
                r = resuelve(rel, d)
                if r and r in arrastra:
                    arrastra.add(rel)
                    cambio = True
                    break

    print(u'  %d archivo(s) revisados · %d usan recharts directamente · '
          u'%d lo arrastran' % (len(todos), len(usa_recharts), len(arrastra)))

    # ── 2. paginas de servidor que montan algo que arrastra recharts ─────
    acusados = []
    for rel in sorted(importa):
        if not rel.startswith('app/') or not rel.endswith('page.tsx'):
            continue
        # Los arneses locales de `app/acceso/vista-*` sólo reexportan la página
        # real; no son una pantalla aparte y se arreglan con ella. Acusarlos
        # duplica cada hallazgo y esconde cuántos sitios hay DE VERDAD.
        if rel.startswith('app/acceso/vista-'):
            continue
        t = sin_comentarios(lee(os.path.join(RAIZ, *rel.split('/'))))
        if es_cliente(t):
            continue                      # es cliente: no hay render de servidor
        # ── Los tramos protegidos de este archivo ────────────────────────
        # No basta con que la pagina IMPORTE el envoltorio: hay que comprobar
        # que CADA uso del componente cae dentro de uno. Si no, basta con
        # envolver una grafica y dejar otra fuera para que el detector calle
        # con el defecto puesto — y entonces no sirve de nada.
        tramos = []
        for m in re.finditer(r'<SoloEnCliente\b', t):
            # Hasta su cierre; si no lo tiene, hasta el final (JSX mal formado
            # lo caza `revisa-jsx.py`, aqui no se adivina).
            fin = t.find('</SoloEnCliente>', m.end())
            tramos.append((m.start(), fin if fin >= 0 else len(t)))

        def protegido(i):
            return any(a <= i <= b for a, b in tramos)

        for d in sorted(importa[rel]):
            r = resuelve(rel, d)
            if not r or r not in arrastra:
                continue
            if r.endswith('-cliente.tsx'):
                continue
            # El nombre con el que se monta, tal como se importo por defecto.
            #
            # `[^;\n]` y no `[^;]`: sin excluir el salto de linea el comodin
            # perezoso CRUZA IMPORTS —no hay `;` entre ellos— y devuelve el
            # nombre de un import anterior. Medido: para
            # `@/components/DashAlertasGraficas` devolvia `PageHeader`, y el
            # detector acusaba a una pagina ya arreglada. Es la misma familia
            # que el «ancla de la ultima linea que empieza por import» de
            # [[atlas-dashboard-contrast-architecture]]: un import se lee en SU
            # linea, nunca a traves de varias.
            mm = re.search(
                r"(?m)^\s*import\s+(\w+)[^;\n]*?from\s+'%s'" % re.escape(d), t)
            if not mm:
                acusados.append((rel, r))
                continue
            nombre = mm.group(1)
            usos = [u.start() for u in re.finditer(r'<%s\b' % re.escape(nombre), t)]
            if not usos:
                continue                      # importado y no montado: no renderiza
            if all(protegido(i) for i in usos):
                continue                      # todos los usos, dentro del envoltorio
            # `dynamic(..., {ssr:false})` es la otra escotilla valida.
            if re.search(r"ssr\s*:\s*false", t) and nombre in t:
                continue
            acusados.append((rel, r))

    if not acusados:
        print(u'\n  ninguna pagina de servidor renderiza recharts.')
        return 0

    print(u'\n  *** %d par(es) pagina-de-servidor -> recharts:' % len(acusados))
    for pagina, comp in acusados:
        print(u'      %-34s monta  %s' % (pagina, comp))
    print(u'\n  Arreglo: importar el componente desde un envoltorio cliente con\n'
          u'  `dynamic(() => import(...), { ssr: false })`. El patron del repo es\n'
          u'  un archivo hermano `<nombre>-cliente.tsx` con `\'use client\'`.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
