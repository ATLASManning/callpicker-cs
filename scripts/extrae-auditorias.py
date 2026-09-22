# -*- coding: utf-8 -*-
"""Saca de los 33 archivos `app/auditoria/*-data.ts` la candidatura ya escrita.

   Cada auditoria es un objeto TypeScript con, entre otras cosas:
     nombre, sector, estado, asesor, necesidad_negocio,
     potencial_corto[]  — lo que se puede mover en semanas
     potencial_largo[]  — lo que se puede mover en meses
     tacticas[]         — nombre, descripcion, impacto
     senal_alarma       — lo que frena

   No se parsea TypeScript de verdad: se extraen los campos con expresiones
   regulares ancladas al nombre del campo. Es fragil por definicion, asi que
   el script CUENTA lo que saca y falla si un archivo no entrega su nombre —
   un archivo mudo que pase de largo seria una auditoria perdida en silencio.
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(RAIZ, 'app', 'auditoria')
SALIDA = os.path.join(RAIZ, 'data', 'auditorias-candidatura.json')


def campo_texto(t, nombre):
    """`nombre: '...'` o `nombre: "..."` o con backticks."""
    for comilla in ("'", '"', '`'):
        m = re.search(r'\b%s\s*:\s*%s((?:\\.|[^%s\\])*)%s' % (nombre, comilla, comilla, comilla), t, re.S)
        if m:
            return re.sub(r'\s+', ' ', m.group(1).replace("\\'", "'").replace('\\"', '"')).strip()
    return ''


def campo_lista(t, nombre):
    """`nombre: [ '...', '...' ]` — soporta multilinea."""
    m = re.search(r'\b%s\s*:\s*\[' % nombre, t)
    if not m:
        return []
    i = m.end()
    prof, fin = 1, None
    while i < len(t):
        if t[i] == '[':
            prof += 1
        elif t[i] == ']':
            prof -= 1
            if prof == 0:
                fin = i
                break
        i += 1
    if fin is None:
        return []
    cuerpo = t[m.end():fin]
    piezas = []
    for comilla in ("'", '"', '`'):
        piezas += re.findall(r'%s((?:\\.|[^%s\\])*)%s' % (comilla, comilla, comilla), cuerpo, re.S)
    return [re.sub(r'\s+', ' ', p.replace("\\'", "'").replace('\\"', '"')).strip()
            for p in piezas if p.strip()]


archivos = sorted(f for f in os.listdir(DIR) if f.endswith('-data.ts'))
print('Archivos de auditoria encontrados: %d' % len(archivos))

casos = []
mudos = []
for fn in archivos:
    t = io.open(os.path.join(DIR, fn), encoding='utf-8').read()
    nombre = campo_texto(t, 'nombre')
    if not nombre:
        mudos.append(fn)
        continue
    casos.append({
        'archivo': fn,
        'nombre': nombre,
        'sector': campo_texto(t, 'sector'),
        'estado': campo_texto(t, 'estado'),
        'asesor': campo_texto(t, 'asesor'),
        'tipo_cliente': campo_texto(t, 'tipo_cliente'),
        'fecha_auditoria': campo_texto(t, 'fecha_auditoria'),
        'necesidad_negocio': campo_texto(t, 'necesidad_negocio'),
        'potencial_corto': campo_lista(t, 'potencial_corto'),
        'potencial_largo': campo_lista(t, 'potencial_largo'),
        'hallazgos': campo_lista(t, 'hallazgos'),
        'senal_alarma': campo_texto(t, 'senal_alarma'),
        'problema_raiz': campo_texto(t, 'problema_raiz'),
    })

if mudos:
    raise SystemExit('%d archivo(s) no entregaron `nombre` y se habrian perdido sin avisar: %s'
                     % (len(mudos), ', '.join(mudos)))

# ── Que tan completo salio ────────────────────────────────────────────────
con_corto = sum(1 for c in casos if c['potencial_corto'])
con_largo = sum(1 for c in casos if c['potencial_largo'])
con_alarma = sum(1 for c in casos if c['senal_alarma'])
print('  con potencial_corto: %d · con potencial_largo: %d · con senal de alarma: %d'
      % (con_corto, con_largo, con_alarma))
assert con_corto + con_largo > 0, 'no se extrajo ni una candidatura: la regex ya no casa'

# ── Que producto nombra cada candidatura ──────────────────────────────────
# Se busca en el texto que ESCRIBIO el analista, no en el plan facturado.
PROD = [
    ('Asistente Virtual', re.compile(r'asistente\s+virtual|agente\s+virtual|\bIVR\b|men[uú]\s+(?:de\s+)?opciones|desbordamiento', re.I)),
    ('Callpicker Chat',   re.compile(r'\bchat\b|whats\s*app|redes\s+sociales|canal(?:es)?\s+de\s+texto', re.I)),
    ('Integración API',   re.compile(r'\bAPI\b|\bCRM\b|integraci[oó]n|webhook|HubSpot|Salesforce|Zoho\s+CRM', re.I)),
    ('Visibilidad y Control', re.compile(r'visibilidad\s*y\s*control|\bVyC\b|grabaci[oó]n|monitoreo|reportes?\s+por\s+extensi', re.I)),
    ('Más capacidad',     re.compile(r'ampliar|expansi[oó]n|m[aá]s\s+(?:l[ií]neas|extensiones|minutos)|crece|excedente|upgrade|subir\s+de\s+plan', re.I)),
]

for c in casos:
    texto = ' | '.join(c['potencial_corto'] + c['potencial_largo']
                       + [c['necesidad_negocio']])
    c['productos_que_nombra'] = [p for p, rx in PROD if rx.search(texto)]
    c['texto_candidatura'] = texto

io.open(SALIDA, 'w', encoding='utf-8').write(
    json.dumps({'casos': casos}, ensure_ascii=False, indent=1))

print('\n=== QUE PRODUCTO NOMBRA CADA AUDITORIA ===')
from collections import Counter
cp = Counter(p for c in casos for p in c['productos_que_nombra'])
for p, n in cp.most_common():
    print('  %-24s %2d auditorias' % (p, n))
sin_prod = [c['nombre'] for c in casos if not c['productos_que_nombra']]
print('  %-24s %2d  %s' % ('(ninguno nombrado)', len(sin_prod), ', '.join(sin_prod[:4])))

print('\n=== LAS 33, UNA POR RENGLON ===')
for c in sorted(casos, key=lambda x: x['nombre']):
    print('  %-32s %-14s %s' % (c['nombre'][:32], c['estado'],
                                ', '.join(c['productos_que_nombra']) or '—'))

print('\n  detalle en %s' % os.path.relpath(SALIDA, RAIZ))
