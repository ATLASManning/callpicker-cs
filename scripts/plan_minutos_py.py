# -*- coding: utf-8 -*-
u"""LA BASE DE MINUTOS DE UN PLAN, LEIDA DE `lib/plan-minutos.ts`.

   Modulo compartido. No se ejecuta solo: lo importan los guiones que miden
   consumo contra plan —`mide-cortes-cuenta.py` (una cuenta) y
   `mide-brecha-plan.py` (la cartera entera)—, para que exista UNA sola copia
   de esta regla en Python y no dos que se separen.

   POR QUE EXISTE
   `mide-cortes-cuenta.py` nacio copiando las constantes a mano y copio TRES
   mal: `BOLSA_MINIMA` 250 en vez de 3, `MIN_POR_EXT_PLAUSIBLE` 100 en vez de
   50, y un `RX_SIN_VOZ` que incluia «agente virtual» cuando el de verdad no
   lo trae. Imprimirlas «para poder cotejarlas» no es cotejarlas: nadie lo
   hizo. Desde entonces se LEEN del `.ts`. Al aparecer un segundo medidor, la
   respuesta correcta no era copiar el espejo otra vez, sino quedarse con uno.

   Si alguna constante desaparece del `.ts`, esto NO sigue con un valor por
   omision: revienta. Un medidor que adivina una constante es peor que no
   tener medidor. Y al importarse corre un CONTROL con los casos que el propio
   `.ts` documenta en sus comentarios: si el espejo esta roto, nadie mide.

   Es de SOLO LECTURA.
"""
import io
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_RUTA_TS = os.path.join(RAIZ, 'lib', 'plan-minutos.ts')
TS = io.open(_RUTA_TS, encoding='utf-8').read()


class EspejoRoto(RuntimeError):
    u"""El `.ts` ya no dice lo que este modulo da por supuesto."""


def _const_num(nombre):
    m = re.search(r'\b' + nombre + r'\s*=\s*(\d+)', TS)
    if not m:
        raise EspejoRoto(u'lib/plan-minutos.ts ya no define «%s». '
                         u'No se puede medir sin ella.' % nombre)
    return int(m.group(1))


def _const_rx(nombre):
    m = re.search(r'\b' + nombre + r'\s*=\s*/(.+)/([gimsuy]*)\s*$',
                  TS, re.MULTILINE)
    if not m:
        raise EspejoRoto(u'lib/plan-minutos.ts ya no define «%s».' % nombre)
    cuerpo = m.group(1)
    senales = re.I if 'i' in m.group(2) else 0
    try:
        return re.compile(cuerpo, senales)
    except re.error as e:
        raise EspejoRoto(u'«%s» no se puede traducir a Python: %s' % (nombre, e))


MINUTOS_POR_EXTENSION = _const_num('MINUTOS_POR_EXTENSION')
BOLSA_MINIMA = _const_num('BOLSA_MINIMA')
MIN_POR_EXT_PLAUSIBLE = _const_num('MIN_POR_EXT_PLAUSIBLE')
RX_EXTENSIONES = _const_rx('RX_EXTENSIONES')
RX_EXT_ABREVIADO = _const_rx('RX_EXT_ABREVIADO')
RX_SIN_VOZ = _const_rx('RX_SIN_VOZ')


def base_minutos(plan, incl):
    u"""Devuelve (base, origen). Espejo de `baseMinutos`, en su mismo orden."""
    nombre = plan or u''
    m = RX_EXTENSIONES.search(nombre) or RX_EXT_ABREVIADO.search(nombre)
    ext = int(m.group(1)) if m else None
    if RX_SIN_VOZ.search(nombre) and not ext and incl < BOLSA_MINIMA:
        return None, u'sin_medicion'
    if ext and ext > 0:
        por_ext = (incl / float(ext)) if incl > 0 else 0
        if por_ext >= MIN_POR_EXT_PLAUSIBLE:
            return incl, u'bolsa'
        return ext * MINUTOS_POR_EXTENSION, u'extensiones'
    if incl >= BOLSA_MINIMA:
        return incl, u'bolsa'
    return None, u'sin_medicion'


# ── EL CONTROL, que corre al importar ───────────────────────────────────────
# Los tres casos que el propio `.ts` documenta en sus comentarios. Si alguno
# deja de dar lo que ahi dice, el espejo esta roto y no se mide nada.
_CASOS = [(u'13 Extensiones Ilimitadas', 1, 13 * MINUTOS_POR_EXTENSION, u'extensiones'),
          (u'50 Extensiones Visibilidad y Control IP', 12500, 12500, u'bolsa'),
          (u'AV 1,000 min Agente Virtual', 1, None, u'sin_medicion')]
for _p, _i, _b, _o in _CASOS:
    _rb, _ro = base_minutos(_p, _i)
    if (_rb, _ro) != (_b, _o):
        raise EspejoRoto(
            u'«%s» con %s incluidos deberia dar (%s, %s) y da (%s, %s).'
            % (_p, _i, _b, _o, _rb, _ro))


# ── Lectura del corte, que tambien era codigo repetido ──────────────────────
def mes(v):
    import datetime
    if isinstance(v, datetime.datetime):
        return v.strftime('%Y-%m')
    if isinstance(v, datetime.date):
        return v.strftime('%Y-%m')
    if isinstance(v, (int, float)):
        d = datetime.date(1899, 12, 30) + datetime.timedelta(days=int(v))
        return d.strftime('%Y-%m')
    return str(v or u'')[:7]


def num(v):
    try:
        return float(v or 0)
    except Exception:
        try:
            return float(re.sub(r'[^0-9.\-]', '', str(v)) or 0)
        except Exception:
            return 0.0


COLUMNAS_EXIGIDAS = ('CID', 'Nombre del Plan', 'Minutos Incluidos',
                     'Minutos Consumidos', 'Fecha de corte')


def abre_corte(ruta=None):
    u"""Devuelve (filas, ix, ruta). `filas` es una lista de tuplas.

       Comprueba que esten las cinco columnas que la medicion necesita; si
       falta una, revienta diciendo CUAL y listando las que hay — un KeyError
       mas adelante no dice nada.
    """
    from openpyxl import load_workbook
    ruta = ruta or os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx')
    wb = load_workbook(ruta, data_only=True, read_only=True)
    ws = wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    cab = [str(x or u'').strip() for x in next(it)]
    ix = {c: i for i, c in enumerate(cab)}
    faltan = [c for c in COLUMNAS_EXIGIDAS if c not in ix]
    if faltan:
        raise EspejoRoto(u'el corte no trae la(s) columna(s) %s. Trae: %s'
                         % (u', '.join(faltan), u', '.join(cab)))
    return list(it), ix, ruta


def celda(fila, ix, col):
    return fila[ix[col]] if col in ix and ix[col] < len(fila) else None


if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    print(__doc__)
    print(u'  El espejo esta sano. Constantes leidas de lib/plan-minutos.ts:')
    print(u'    MINUTOS_POR_EXTENSION %s' % MINUTOS_POR_EXTENSION)
    print(u'    BOLSA_MINIMA          %s' % BOLSA_MINIMA)
    print(u'    MIN_POR_EXT_PLAUSIBLE %s' % MIN_POR_EXT_PLAUSIBLE)
