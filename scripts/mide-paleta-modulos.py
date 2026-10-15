# -*- coding: utf-8 -*-
u"""QUE MODULOS SIGUEN CON LA PALETA ANTERIOR, y cuanto hay en cada uno.

   Encargo de direccion, 15 oct 2026: llevar Churn --y TODOS los modulos-- a los
   colores del Customer Success Operating System.

   Antes de tocar nada hay que saber el tamaño del trabajo por modulo: cuantos
   hex de la paleta vieja, cuantas clases Tailwind de color, y si el archivo
   tiene `.cp-card` (isla OSCURA, letra clara) o no (isla CLARA, letra oscura).
   Esa distincion decide que tono va en cada sitio y no se puede adivinar.
   [[atlas-dashboard-contrast-architecture]]

   USO
       python scripts/mide-paleta-modulos.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#: Hex de la paleta ANTERIOR y de Tailwind que hay que sustituir.
VIEJOS = ['#1B3FCC', '#3b82f6', '#8b5cf6', '#6366f1', '#0f172a', '#7dd3fc',
          '#E2E8F0', '#F8FAFC', '#F1F5F9', '#F3F4F6', '#F9FAFB', '#E5E7EB',
          '#475569', '#374151', '#64748B', '#6b7280', '#94a3b8', '#9ca3af',
          '#DBEAFE', '#BFDBFE', '#EFF6FF', '#D1D5DB', '#1E40AF', '#2563EB']

#: Los que ya son del documento: si un archivo solo tiene de estos, esta hecho.
NUEVOS = ['#082742', '#10355D', '#1D6CAA', '#39ABD8', '#8AD7F8', '#202E3B',
          '#3D4B5C', '#667384', '#6A7889', '#A8BACB', '#DFE8EF', '#EDF2F7',
          '#EAF0F5', '#EAF2F8', '#BBD4E6', '#F5F8FB']

CLASES = re.compile(
    r'\b(bg|text|border|from|to|ring|divide)-(gray|slate|blue|indigo|violet|'
    r'purple|sky|zinc|neutral|cyan)-\d{2,3}\b')


def mide(ruta):
    src = io.open(ruta, encoding='utf-8').read()
    # Los comentarios no pintan: se blanquean antes de contar.
    limpio = re.sub(r'/\*[\s\S]*?\*/', ' ', src)
    limpio = re.sub(r'//[^\n]*', ' ', limpio)
    viejos = sum(len(re.findall(re.escape(h) + r'(?![0-9a-fA-F])', limpio, re.I))
                 for h in VIEJOS)
    nuevos = sum(len(re.findall(re.escape(h) + r'(?![0-9a-fA-F])', limpio, re.I))
                 for h in NUEVOS)
    return {
        'lineas': src.count('\n') + 1,
        'viejos': viejos,
        'nuevos': nuevos,
        'clases': len(CLASES.findall(limpio)),
        'cpcard': 'cp-card' in limpio,
        'capa': bool(re.search(r'cp-(tickets|doc)\b', limpio)),
    }


def main():
    app = os.path.join(RAIZ, 'app')
    filas = []
    for dirpath, _dirnames, files in os.walk(app):
        if 'page.tsx' not in files:
            continue
        rel = os.path.relpath(dirpath, app).replace('\\', '/')
        if rel.startswith('acceso') or rel.startswith('api'):
            continue
        m = mide(os.path.join(dirpath, 'page.tsx'))
        m['modulo'] = '/' if rel == '.' else '/' + rel
        filas.append(m)

    filas.sort(key=lambda f: -(f['viejos'] + f['clases']))
    print(u'\n  MODULOS DEL TABLERO — ¿que falta por llevar a la paleta?')
    print(u'  ' + u'=' * 78)
    print(u'  %-26s %6s %7s %7s %7s %6s %5s'
          % (u'modulo', u'lineas', u'viejos', u'nuevos', u'clases', u'card?', u'capa'))
    print(u'  ' + u'-' * 78)
    pend_v = pend_c = 0
    for f in filas:
        falta = f['viejos'] > 0 or (f['clases'] > 0 and not f['capa'])
        print(u'  %-26s %6d %7d %7d %7d %6s %5s  %s'
              % (f['modulo'], f['lineas'], f['viejos'], f['nuevos'], f['clases'],
                 u'SI' if f['cpcard'] else u'no',
                 u'si' if f['capa'] else u'--',
                 u'<- FALTA' if falta else u'hecho'))
        if falta:
            pend_v += f['viejos']
            pend_c += f['clases']
    print(u'  ' + u'-' * 78)
    print(u'  %d modulo(s) pendientes · %d hex viejos · %d clases Tailwind'
          % (sum(1 for f in filas if f['viejos'] > 0 or (f['clases'] > 0 and not f['capa'])),
             pend_v, pend_c))
    print(u'\n  «card?» = tiene `.cp-card`: isla OSCURA, letra clara.')
    print(u'  Si no la tiene es isla CLARA, letra oscura — y el tono cambia.\n')


if __name__ == '__main__':
    main()
