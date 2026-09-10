"""Genera app/churn/grc-eventos-corte.ts: los eventos de Churn confirmado /
   Downgrade que YA existian al corte, para que solo cuenten los nuevos."""
import sys, io, os, re, unicodedata
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
P = r"D:\Windows\Projects\callpicker-cs"
CORTE = '2026-09-09'

src = open(os.path.join(P, 'app', 'churn', 'aaa-grc-data.ts'), encoding='utf-8').read()

def norm(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s.lower())

# Recorre el archivo en orden: cada  mes: 'X'  abre un bloque; cada fila trae
# cliente + movimiento. Asi cada fila queda atada a SU mes.
eventos = []
mes = None
for m in re.finditer(r"mes:\s*'([^']+)'|cliente:\s*'((?:[^'\\]|\\.)*)'[^\n]*?movimiento:\s*'([^']*)'", src):
    if m.group(1):
        mes = m.group(1)
        continue
    cliente, mov = m.group(2), m.group(3)
    if 'Churn confirmado' in mov: tipo = 'churn'
    elif 'Downgrade' in mov:      tipo = 'downgrade'
    else:                         continue
    eventos.append((norm(cliente), (mes or '?').upper(), tipo))

eventos = sorted(set(eventos))
meses = list(dict.fromkeys(e[1] for e in eventos))
print('eventos al corte: %d  (churn %d · downgrade %d)'
      % (len(eventos), sum(1 for e in eventos if e[2] == 'churn'),
         sum(1 for e in eventos if e[2] == 'downgrade')))
print('meses: %s' % ', '.join(meses))

claves = ['%s|%s|%s' % e for e in eventos]
cuerpo = '\n'.join("  '%s'," % k for k in claves)

out = '''/* ═══════════════════════════════════════════════════════════════════════
   CORTE DE EVENTOS GRC — %(corte)s
   GENERADO — no editar a mano. Regenerar con scripts/gen-grc-corte.py

   POR QUÉ EXISTE
   Instrucción de dirección (9-sep-2026): "a partir de hoy en adelante, si
   existe una cuenta con estas características de Churn confirmado o Downgrade
   sí generas la actividad, y no se cierra hasta cumplir con el requisito de la
   aclaración explícita, con las acciones previas".

   "A PARTIR DE HOY" necesita un punto de partida explícito, o la primera
   ejecución trataría los 8 meses de historial como si acabaran de ocurrir y
   generaría 70 actividades de golpe (Fátima 38, Dan 18, Claudia 14). Este
   archivo congela lo que YA había ocurrido al corte: todo evento que aparezca
   en GRC-AAA-2026 y NO esté en esta lista es nuevo y exige aclaración.

   Cubre los meses: %(meses)s.
   Cuando se cargue septiembre en adelante, sus movimientos no estarán aquí y
   dispararán la actividad automáticamente. No hay que tocar este archivo.

   Clave: <cliente normalizado>|<MES>|<churn|downgrade>
═══════════════════════════════════════════════════════════════════════ */

/** Fecha en que se fijó el corte. Solo informativa/auditable. */
export const GRC_CORTE_FECHA = '%(corte)s'

/** Meses ya considerados históricos al momento del corte. */
export const GRC_CORTE_MESES: readonly string[] = [%(mesesArr)s]

/** %(n)d eventos de Churn confirmado / Downgrade previos al corte. */
export const GRC_EVENTOS_PREVIOS: ReadonlySet<string> = new Set([
%(cuerpo)s
])
''' % {
    'corte': CORTE,
    'meses': ', '.join(meses),
    'mesesArr': ', '.join("'%s'" % m for m in meses),
    'n': len(eventos),
    'cuerpo': cuerpo,
}

dest = os.path.join(P, 'app', 'churn', 'grc-eventos-corte.ts')
open(dest, 'w', encoding='utf-8', newline='\n').write(out)
print('escrito: %s (%d bytes)' % (dest, len(out)))
