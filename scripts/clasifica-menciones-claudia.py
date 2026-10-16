# -*- coding: utf-8 -*-
u"""¿CUALES DE LAS 1,284 «Claudia» SON LA ASESORA?

   Encargo de direccion, 15 oct 2026: «lo que tenga Claudia hoy cargado le
   cambias el nombre por Erick Sanchez».

   POR QUE HAY QUE CLASIFICAR ANTES
   --------------------------------
   Porque «Claudia» no siempre es la asesora. En los datos hay personas DE
   LOS CLIENTES que se llaman igual:

       «GALLARDO CLAUDIA (90 llamadas salientes)»  <- una extension del cliente
       agentes de la mesa de ayuda, contactos de cuenta, firmantes...

   Un reemplazo a ciegas renombraria a empleados de los clientes y falsearia
   sus propios reportes. Esto separa unos de otros ANTES de tocar nada.

   COMO LOS SEPARA
   ---------------
   ASESORA   cuando aparece como valor de un campo de cartera --`asesor`,
             `asesor_nombre`, `kam`-- o junto a palabras del rol.
   AJENA     cuando va en mayusculas dentro de un nombre compuesto, o en
             campos de personas del cliente (extension, agente, contacto).
   DUDOSA    el resto: se listan una a una para mirarlas, no se tocan.

   NO ESCRIBE NADA.

   USO
       python scripts/clasifica-menciones-claudia.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#: El nombre en cualquier caja, pero como palabra entera.
RX = re.compile(r'\bclaudia\b', re.I)

#: Señales de que ESA mencion es la asesora.
ASESORA = [
    re.compile(r'"?asesor(_nombre)?"?\s*[:=]\s*[\'"]?\s*Claudia', re.I),
    re.compile(r'\bkam\b[^\n]{0,24}Claudia', re.I),
    re.compile(r'Claudia[^\n]{0,24}\b(cartera|asesora|ejecutiva|KAM)\b', re.I),
    re.compile(r'\b(asesora|ejecutiva|KAM)\b[^\n]{0,24}Claudia', re.I),
]
#: Señales de que NO lo es: gente del cliente.
AJENA = [
    re.compile(r'\bCLAUDIA\b[^a-z]'),              # en versales: nombre completo
    re.compile(r'[A-ZÁÉÍÓÚÑ]{3,}\s+CLAUDIA'),      # «GALLARDO CLAUDIA»
    re.compile(r'CLAUDIA\s+[A-ZÁÉÍÓÚÑ]{3,}'),
    re.compile(r'"(extension|agente|contacto|nombre_contacto|propietario|'
               r'destino|usuario)"\s*:\s*"[^"]*Claudia', re.I),
]


def clasifica(linea):
    for rx in AJENA:
        if rx.search(linea):
            return 'ajena'
    for rx in ASESORA:
        if rx.search(linea):
            return 'asesora'
    return 'dudosa'


def main():
    total = {'asesora': 0, 'ajena': 0, 'dudosa': 0}
    por_archivo = {}
    ejemplos = {'asesora': [], 'ajena': [], 'dudosa': []}

    for base in ('app', 'components', 'lib', 'data', 'docs', 'scripts'):
        for dp, _d, fs in os.walk(os.path.join(RAIZ, base)):
            if '.next' in dp or 'node_modules' in dp:
                continue
            for f in fs:
                if not f.endswith(('.ts', '.tsx', '.json', '.md', '.py', '.sql')):
                    continue
                r = os.path.join(dp, f)
                rel = os.path.relpath(r, RAIZ).replace('\\', '/')
                try:
                    src = io.open(r, encoding='utf-8').read()
                except Exception:
                    continue
                if not RX.search(src):
                    continue
                cuenta = {'asesora': 0, 'ajena': 0, 'dudosa': 0}
                for i, ln in enumerate(src.split('\n'), 1):
                    for _ in RX.finditer(ln):
                        c = clasifica(ln)
                        cuenta[c] += 1
                        total[c] += 1
                        if len(ejemplos[c]) < 6:
                            ejemplos[c].append((rel, i, ln.strip()[:88]))
                if any(cuenta.values()):
                    por_archivo[rel] = cuenta

    print(u'\n  ¿QUE «Claudia» ES LA ASESORA?')
    print(u'  ' + u'=' * 74)
    print(u'  asesora: %d   ajena (gente de clientes): %d   dudosa: %d'
          % (total['asesora'], total['ajena'], total['dudosa']))

    for clase in ('asesora', 'ajena', 'dudosa'):
        print(u'\n  --- %s ---' % clase.upper())
        for rel, i, ln in ejemplos[clase]:
            print(u'    %s:%d' % (rel, i))
            print(u'      %s' % ln)

    print(u'\n  POR ARCHIVO (los que mas tienen):')
    orden = sorted(por_archivo.items(), key=lambda x: -sum(x[1].values()))
    print(u'    %-50s %7s %6s %7s' % (u'archivo', u'asesora', u'ajena', u'dudosa'))
    for rel, c in orden[:16]:
        print(u'    %-50s %7d %6d %7d' % (rel[:50], c['asesora'], c['ajena'], c['dudosa']))

    print(u'\n  ' + u'=' * 74)
    print(u'  Nada tocado. Las DUDOSAS se miran una a una antes de decidir.\n')


if __name__ == '__main__':
    main()
