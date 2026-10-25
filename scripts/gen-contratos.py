# -*- coding: utf-8 -*-
u"""GENERA `data/contratos.json` DESDE EL EXPORT DE LA HOJA DE CONTRATOS.

   Direccion comparte «Contratos con Clientes.zip», que es un export de Google
   Sheets a HTML. Esto lo normaliza UNA vez para que todas las vistas cuenten
   lo mismo — el patron de `lib/tickets-norm.ts`.

   ── LO QUE SE NORMALIZA AQUI, Y POR QUE ───────────────────────────────────

   1. «fima» ES «firma» SIN LA R, escrito asi 16 veces. Si cada pantalla lo
      arregla por su cuenta, dos pantallas cuentan distinto el mismo contrato.
      Y el dedazo que hay que cubrir es la letra que FALTA: un patron como
      `f[ia]rma` cubre «firma» y «farma» pero NO «fima», y deja 16 contratos
      firmados contados como «sin estatus». Me paso al medir.

   2. LAS FECHAS VIENEN «28-feb-2027», en español y con mes abreviado.

   3. «NA», «-» y vacio NO son la misma cosa que una fecha lejana: son
      AUSENCIA DE FECHA. Un contrato sin fin y sin plazo «libre» no es «no
      vence nunca», es que no se sabe. Se marca `finMedible: false` y ninguna
      cuenta de vencimientos lo incluye. [[feedback-cero-sin-medicion]]

   4. EL COLOR DE LA CELDA NO SE USA COMO ESTADO. En la hoja hay rojo, gris y
      naranja, pero el mismo estatus aparece en los tres colores —«enviado
      para firma digital» sale negro, azul y rojo—, asi que el color NO es una
      dimension fiable. Se conserva en `colorHoja` por si algun dia se
      confirma que significa algo, y NO se interpreta.

   USO
       python scripts/gen-contratos.py "D:\\Archivos\\Contratos\\contratos.html"
"""
import datetime
import io
import json
import os
import re
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'data', 'contratos.json')

MESES = {'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
         'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12}

RX_FIRMADO = re.compile(r'f(ir|i)ma(do)?\s+(digital|aut[oó]grafa)'
                        r'|firmado\s+(digitalmente|en\s+f[ií]sico)', re.I)
RX_PROCESO = re.compile(r'enviado|pendiente|revisi[oó]n|ajustes', re.I)
RX_NO_FIRMADO = re.compile(r'\bno\s+firmado\b', re.I)

VACIOS = {'', 'na', 'n/a', '-', '—', 'indefinido', '.'}


def fecha(txt):
    t = (txt or '').strip().lower()
    if t in VACIOS:
        return None
    m = re.match(r'^(\d{1,2})-([a-záéíóú]+)\.?-(\d{4})$', t)
    if not m:
        return None
    mes = MESES.get(m.group(2)[:3])
    if not mes:
        return None
    try:
        return datetime.date(int(m.group(3)), mes, int(m.group(1))).isoformat()
    except ValueError:
        return None


def estado_firma(estatus):
    """firmado · en_proceso · no_firmado · sin_estatus (que NO es «no firmado»)."""
    e = (estatus or '').strip()
    if not e:
        return 'sin_estatus'
    if RX_NO_FIRMADO.search(e):
        return 'no_firmado'
    if RX_FIRMADO.search(e):
        return 'firmado'
    if RX_PROCESO.search(e):
        return 'en_proceso'
    return 'sin_estatus'


def main():
    if len(sys.argv) < 2:
        print(u'  uso: python scripts/gen-contratos.py <contratos.html>')
        return 2
    origen = sys.argv[1]
    if not os.path.exists(origen):
        print(u'  *** no existe: %s' % origen)
        return 2

    tmp = os.path.join(os.environ.get('TEMP', '.'), '_contratos_gen.json')
    r = subprocess.run([sys.executable, '-I',
                        os.path.join(RAIZ, 'scripts', 'lee-contratos-html.py'),
                        origen, '--json', tmp], capture_output=True)
    if r.returncode != 0:
        print(u'  *** el lector fallo:\n%s' % r.stdout.decode('utf-8', 'replace')[:400])
        return 2
    crudo = json.load(io.open(tmp, encoding='utf-8'))

    # La fila 0 son las LETRAS de columna del export (A, B, C…); la cabecera
    # de verdad es la 1. Leer la 0 como cabecera deja todo el esquema en
    # blanco y la pantalla pintando columnas vacias.
    cab = [(c['t'] or '').strip() for c in crudo[1]]
    idx = {n: i for i, n in enumerate(cab) if n}
    filas = crudo[2:]

    def v(f, nombre):
        i = idx.get(nombre)
        return ((f[i]['t'] if i is not None and i < len(f) else '') or '').strip()

    out = []
    for f in filas:
        cuenta = v(f, 'Cuenta')
        if not cuenta:
            continue
        ini, fin = fecha(v(f, 'Inicio')), fecha(v(f, 'Fin'))
        plazo = v(f, 'Plazo')
        libre = plazo.lower() == 'libre'
        cid = re.sub(r'\D', '', v(f, 'Customer ID'))
        out.append({
            'cuenta':      cuenta,
            'cid':         cid or None,
            'vendedor':    v(f, 'Vendedor') or None,
            'solicitud':   fecha(v(f, 'Solicitud')),
            'estatusHoja': v(f, 'Estatus') or None,
            'estado':      estado_firma(v(f, 'Estatus')),
            'plazo':       plazo or None,
            'plazoLibre':  libre,
            'inicio':      ini,
            'fin':         fin,
            # Un contrato «libre» no vence POR DEFINICION; uno sin fecha y sin
            # «libre» es que NO SE SABE. Son cosas distintas y se distinguen.
            'finMedible':  bool(fin),
            'sinVencimiento': libre and not fin,
            'vigencia':    v(f, 'Vigencia') or None,
            'contenido':   v(f, 'Contenido') or None,
            'solicitante': v(f, 'Solicitante') or None,
            'firmante':    v(f, 'Firmante') or None,
            'emailFirmante': v(f, 'Email Firmante') or None,
            'gdoc':        v(f, 'gdoc') or None,
            'firma':       v(f, 'Firma') or None,
            'nota':        v(f, 'Nota') or None,
            # Se guarda, NO se interpreta: el mismo estatus sale en tres
            # colores distintos, asi que no es una dimension fiable.
            'colorHoja':   (f[idx['Cuenta']].get('color') if 'Cuenta' in idx
                            and idx['Cuenta'] < len(f) else None),
        })

    por = {}
    for c in out:
        por[c['estado']] = por.get(c['estado'], 0) + 1

    meta = {
        'origen': os.path.basename(origen),
        'generado': datetime.datetime.now().isoformat(timespec='seconds'),
        'total': len(out),
        'porEstado': por,
        'conFin': sum(1 for c in out if c['finMedible']),
        'sinVencimiento': sum(1 for c in out if c['sinVencimiento']),
        'noMedibles': sum(1 for c in out if not c['finMedible'] and not c['sinVencimiento']),
        'conCid': sum(1 for c in out if c['cid']),
    }

    # ── ASSERTS: no se escribe un archivo que no cierre ────────────────────
    assert sum(por.values()) == len(out), 'los estados no agotan los contratos'
    assert meta['conFin'] + meta['sinVencimiento'] + meta['noMedibles'] == len(out), \
        'las tres clases de vencimiento no agotan los contratos'
    assert len(out) > 0, 'no se extrajo ni un contrato: revisar la cabecera'

    io.open(DESTINO, 'w', encoding='utf-8', newline='\n').write(
        json.dumps({'meta': meta, 'contratos': out}, ensure_ascii=False, indent=1) + '\n')

    print(u'\n  CONTRATOS — generado')
    print(u'  ' + u'=' * 64)
    print(u'  %d contrato(s) · origen %s' % (len(out), meta['origen']))
    for k in ('firmado', 'en_proceso', 'no_firmado', 'sin_estatus'):
        print(u'    %-14s %3d' % (k, por.get(k, 0)))
    print(u'  con fecha de fin ....... %3d' % meta['conFin'])
    print(u'  sin vencimiento (libre)  %3d' % meta['sinVencimiento'])
    print(u'  NO MEDIBLES ............ %3d   (ni fecha ni «libre»)' % meta['noMedibles'])
    print(u'  con CID ................ %3d' % meta['conCid'])
    print(u'\n  escrito %s' % DESTINO)
    return 0


if __name__ == '__main__':
    sys.exit(main())
