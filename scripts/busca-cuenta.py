# -*- coding: utf-8 -*-
u"""TODO LO QUE LA HERRAMIENTA SABE DE UNA CUENTA, EN UNA CORRIDA.

   ── POR QUE EXISTE ────────────────────────────────────────────────────────
   Antes de decir «este dato no lo tenemos» hay que haber MIRADO, y mirar son
   once fuentes que viven en sitios distintos: un .xlsx, seis .json y varias
   tablas de Supabase. Declarar un hueco sin barrerlas es inventar una
   ausencia, que cuesta igual que inventar un dato: el Addendum 3 de ProMujer
   se capturo «sin vendedor» cuando Activaciones 2.0 lo tenia desde 2023.

   Esto convierte «busca en toda la herramienta» en algo que se corre.

   ── LAS DOS REGLAS QUE LO HACEN FIABLE ────────────────────────────────────

   1. SE CRUZA POR CID, NUNCA POR NOMBRE. Buscando «mujer» salen «Centro para
      la Mujer» y «Centro Panamericano de la Mujer», que son OTRAS cuentas.
      Los parecidos de nombre se muestran aparte y rotulados como lo que son:
      pistas que hay que confirmar, no coincidencias. [[dids-fuente]]

   2. LO QUE NO SE PUDO LEER SE DICE. Una fuente caida que no imprime nada se
      lee igual que una fuente vacia, y entonces «no hay dato» puede querer
      decir «no se miro». Al final sale la lista de las que fallaron, y el
      guion devuelve 1 si falto alguna. [[feedback-cero-sin-medicion]]

   Es de SOLO LECTURA. Las credenciales se leen de `.env.local` aqui dentro y
   NO se imprimen nunca.

   USO
       python -I scripts/busca-cuenta.py 144195
       python -I scripts/busca-cuenta.py "ProMujer"
       python -I scripts/busca-cuenta.py 144195 --sin-supabase
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RAIZ, 'data')

#: Tablas de Supabase colgadas de una cuenta. La FK es `cuenta_id` en todas.
TABLAS_CUENTA = ('seguimientos', 'reuniones', 'actividades', 'adopcion_producto',
                 'anexos', 'alertas_episodios', 'buzon_cliente', 'oportunidades',
                 'health_score_historial', 'radar_respuestas', 'snapshot_semanal')

#: Archivos de `data/` que ya tienen seccion propia: no se repiten en el barrido.
YA_MIRADOS = ('activaciones.xlsx', 'grc-zoho.json', 'contratos.json', 'dids.json')

no_leidas = []


def titulo(t):
    print(u'\n  ' + t)
    print(u'  ' + u'─' * 70)


def falla(fuente, por_que):
    no_leidas.append(u'%s — %s' % (fuente, por_que))
    print(u'  *** NO SE PUDO LEER: %s — %s' % (fuente, por_que))


# ── .env.local ────────────────────────────────────────────────────────────
def entorno():
    u"""Lee `.env.local`. Devuelve el dict; NADIE imprime sus valores."""
    ruta = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(ruta):
        return {}
    d = {}
    for linea in io.open(ruta, encoding='utf-8'):
        linea = linea.strip()
        if not linea or linea.startswith('#') or '=' not in linea:
            continue
        k, v = linea.split('=', 1)
        d[k.strip()] = v.strip().strip('"').strip("'")
    return d


def rest(env, tabla, consulta):
    u"""GET contra PostgREST. Devuelve (filas, error)."""
    base = env.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
    llave = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    if not base or not llave:
        return None, u'faltan credenciales en .env.local'
    url = u'%s/rest/v1/%s?%s' % (base, tabla, consulta)
    pet = urllib.request.Request(url, headers={
        'apikey': llave, 'Authorization': 'Bearer %s' % llave, 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(pet, timeout=25) as r:
            return json.loads(r.read().decode('utf-8')), None
    except urllib.error.HTTPError as e:
        cuerpo = e.read().decode('utf-8', 'replace')[:160]
        return None, u'HTTP %s · %s' % (e.code, cuerpo)
    except Exception as e:                                    # noqa: BLE001
        return None, u'%s' % e


# ── Las fuentes, una por una ──────────────────────────────────────────────
def pinta(fila, sangria=u'    '):
    for k, v in fila.items():
        if v is None or (isinstance(v, str) and not v.strip()):
            continue
        print(u'%s%-26s %s' % (sangria, k, v))


def de_activaciones(cid, texto):
    titulo(u'ACTIVACIONES 2.0  ·  data/activaciones.xlsx')
    ruta = os.path.join(DATA, 'activaciones.xlsx')
    if not os.path.exists(ruta):
        return falla(u'activaciones.xlsx', u'no existe')
    try:
        import openpyxl
    except ImportError:
        return falla(u'activaciones.xlsx', u'falta openpyxl')
    try:
        wb = openpyxl.load_workbook(ruta, data_only=True, read_only=True)
        ws = wb[wb.sheetnames[0]]
        filas = list(ws.iter_rows(values_only=True))
    except Exception as e:                                    # noqa: BLE001
        return falla(u'activaciones.xlsx', u'%s' % e)

    cab = [u'' if c is None else str(c).strip() for c in filas[0]]
    # La cabecera repite «Apertura Ticket» y «Cierre Ticket», y trae una vacia:
    # sin desambiguar, un dict se come la primera de cada par en silencio.
    vistos, cols = {}, []
    for i, n in enumerate(cab):
        n = n or (u'columna %d' % (i + 1))
        vistos[n] = vistos.get(n, 0) + 1
        cols.append(n if vistos[n] == 1 else u'%s (%d)' % (n, vistos[n]))

    def dic(f):
        return {c: (u'' if v is None else v) for c, v in zip(cols, f)}

    exactas = [dic(f) for f in filas[1:]
               if f and re.sub(r'\D', '', str(f[0] or '')) == cid] if cid else []
    for d in exactas:
        print(u'    ── fila por CID %s ──' % cid)
        pinta(d, u'      ')

    if not exactas:
        print(u'    sin fila para el CID.' if cid else u'    (no se dio CID)')
    nombres = [str(d.get('Cliente') or '').strip() for d in exactas]

    # Parecidos de nombre: PISTAS, no coincidencias.
    if texto:
        t = texto.lower()
        pistas = [dic(f) for f in filas[1:]
                  if f and t in str(f[1] or '').lower()
                  and re.sub(r'\D', '', str(f[0] or '')) != cid]
        if pistas:
            print(u'\n    --- %d parecido(s) DE NOMBRE, que NO son esta cuenta ---' % len(pistas))
            print(u'        cruzar por nombre mezcla cuentas; se listan para descartarlas.')
            for d in pistas:
                print(u'        ID %-8s %-38s vendedor %s'
                      % (d.get('ID'), d.get('Cliente'), d.get('Vendedor') or u'—'))
    return nombres


def de_grc(cid, nombres):
    u"""EL GRC CASI NUNCA TRAE CID: 3,424 de sus 3,644 filas vienen sin el.

       Cruzarlo solo por CID es declarar «no factura» a casi todo el padron —
       Promujer sale con $4,983 de MRR y `cid: null`, y este barrido la daba
       por ausente—. Asi que aqui el nombre NO es un lujo: es la unica llave
       que esta fuente tiene casi siempre. Va rotulado como lo que es, un
       cruce por nombre que hay que confirmar. [[grc-fuente-zoho]]
    """
    titulo(u'GROSS REVENUE · data/grc-zoho.json')
    ruta = os.path.join(DATA, 'grc-zoho.json')
    if not os.path.exists(ruta):
        return falla(u'grc-zoho.json', u'no existe')
    try:
        d = json.load(io.open(ruta, encoding='utf-8'))
    except Exception as e:                                    # noqa: BLE001
        return falla(u'grc-zoho.json', u'%s' % e)
    filas = d.get('filas', [])
    meta = d.get('meta', {})
    sin_cid = sum(1 for f in filas if not f.get('cid'))
    print(u'    corte %s · mes vivo %s · %d fila(s), %d SIN CID (%.0f%%)'
          % (meta.get('origen') or u'sin rotulo', meta.get('mesVivo') or u'—',
             len(filas), sin_cid, 100.0 * sin_cid / max(1, len(filas))))

    por_cid = [f for f in filas
               if cid and re.sub(r'\D', '', str(f.get('cid') or '')) == cid]
    for f in por_cid:
        print(u'    ── por CID ──')
        pinta(f, u'      ')
    if not por_cid:
        print(u'    por CID: ninguna. Con %d filas sin CID, eso NO quiere decir'
              % sin_cid)
        print(u'             que no facture — sigue el cruce por nombre.')

    # Un nombre de tres letras cruza con media base; por debajo de cuatro no
    # se busca, que un falso positivo masivo es tan inutil como no buscar.
    candidatos = sorted({n.strip() for n in nombres if n and len(n.strip()) >= 4})
    if not candidatos:
        print(u'\n    sin nombre con el que cruzar: NO se busco por nombre.')
        no_leidas.append(u'grc-zoho.json — sin nombre candidato, solo se cruzo por CID')
        return len(por_cid)

    print(u'\n    nombres con los que se cruza: %s' % u', '.join(
        u'«%s»' % c for c in candidatos))
    vistas, hubo = [], False
    for cand in candidatos:
        t = cand.lower()
        for f in filas:
            cliente = str(f.get('cliente') or '')
            if t in cliente.lower() and f not in por_cid and id(f) not in vistas:
                vistas.append(id(f))
                if not hubo:
                    print(u'    --- por NOMBRE (confirmar: el nombre NO es llave) ---')
                    hubo = True
                print(u'      %-34s cid=%-8s clasif=%-4s mrrIni=%-10s mrrFin=%-10s %s'
                      % (cliente, f.get('cid') or u'—', f.get('clasif') or u'—',
                         f.get('mrrIni'), f.get('mrrFin'), f.get('movimiento') or u''))
    if not hubo:
        print(u'    por nombre: ninguna.')
    return len(por_cid)


def de_contratos(cid):
    titulo(u'CONTRATOS · data/contratos.json')
    ruta = os.path.join(DATA, 'contratos.json')
    if not os.path.exists(ruta):
        return falla(u'contratos.json', u'no existe')
    d = json.load(io.open(ruta, encoding='utf-8'))
    hits = [c for c in d['contratos'] if (c.get('cid') or '') == cid]
    if not hits:
        print(u'    el CID no tiene contrato en la hoja.')
        return []
    for c in sorted(hits, key=lambda x: x.get('inicio') or ''):
        print(u'    %-28s %-11s %s → %s · vendedor %s %s'
              % (c.get('contenido') or u'—', c['estado'],
                 c.get('inicio') or u'sin inicio', c.get('fin') or u'sin fin',
                 c.get('vendedor') or u'—',
                 u'[capa local]' if c.get('origenLocal') else u'[hoja]'))
    return [str(c.get('cuenta') or '').strip() for c in hits]


def de_dids(cid):
    titulo(u'DIDs · data/dids.json')
    ruta = os.path.join(DATA, 'dids.json')
    if not os.path.exists(ruta):
        return falla(u'dids.json', u'no existe')
    d = json.load(io.open(ruta, encoding='utf-8'))
    por = d.get('porCid') or {}
    reg = por.get(cid)
    if not reg:
        print(u'    el CID no tiene numeros.')
        return 0
    print(u'    %s' % json.dumps(reg, ensure_ascii=False)[:600])
    return 1


def resto_de_data(cid, texto):
    u"""Los demas archivos de `data/`. Generico a proposito: una fuente nueva
       no deberia quedarse fuera del barrido solo porque nadie actualizo esto."""
    titulo(u'RESTO DE data/  (barrido generico, para que nada quede fuera)')
    for nombre in sorted(os.listdir(DATA)):
        if nombre in YA_MIRADOS or nombre.startswith('.'):
            continue
        ruta = os.path.join(DATA, nombre)
        if os.path.isdir(ruta):
            print(u'    %-44s carpeta — se revisa aparte' % nombre)
            continue
        if not nombre.endswith('.json'):
            print(u'    %-44s no es JSON — se revisa aparte' % nombre)
            continue
        try:
            crudo = io.open(ruta, encoding='utf-8').read()
        except Exception as e:                                # noqa: BLE001
            falla(nombre, u'%s' % e)
            continue
        n_cid = crudo.count(cid) if cid else 0
        n_txt = crudo.lower().count(texto.lower()) if texto else 0
        if n_cid or n_txt:
            print(u'    %-44s CID×%d  nombre×%d   ← MIRAR' % (nombre, n_cid, n_txt))
        else:
            print(u'    %-44s —' % nombre)


def de_supabase(env, cid, texto):
    titulo(u'SUPABASE · cartera y tablas colgadas de la cuenta')
    filtro = u'cid=eq.%s&select=*' % urllib.parse.quote(cid) if cid else \
             u'empresa=ilike.%s&select=*' % urllib.parse.quote(u'*%s*' % texto)
    filas, err = rest(env, 'cuentas', filtro)
    if err:
        falla(u'supabase/cuentas', err)
        return None
    if not filas:
        print(u'    la cuenta NO esta en la cartera CS.')
        return None
    cuenta = filas[0]
    for f in filas:
        print(u'    ── cuenta %s ──' % (f.get('consecutivo') or f.get('id')))
        pinta({k: v for k, v in f.items() if v not in (None, '')}, u'      ')

    cid_id = cuenta.get('id')
    print(u'')
    for tabla in TABLAS_CUENTA:
        fs, err = rest(env, tabla, u'cuenta_id=eq.%s&select=*&limit=200'
                       % urllib.parse.quote(str(cid_id)))
        if err:
            falla(u'supabase/%s' % tabla, err)
            continue
        print(u'    %-26s %d registro(s)%s'
              % (tabla, len(fs), u'   ← MIRAR' if fs else u''))
    return cuenta


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__)
        return 2
    consulta = args[0]
    cid = re.sub(r'\D', '', consulta)
    texto = u'' if cid == consulta else consulta

    print(u'\n  QUE SABE LA HERRAMIENTA DE «%s»' % consulta)
    print(u'  ' + u'═' * 70)
    print(u'  CID: %s · nombre: %s' % (cid or u'(no se dio)', texto or u'(no se dio)'))

    env = entorno()
    cuenta = None
    if '--sin-supabase' not in sys.argv:
        cuenta = de_supabase(env, cid, texto)
    else:
        print(u'\n  (--sin-supabase: la cartera y sus tablas NO se miraron)')
        no_leidas.append(u'supabase — omitido con --sin-supabase')

    # Si Supabase dio el nombre de la empresa, el barrido por nombre mejora.
    if cuenta and not texto:
        texto = (cuenta.get('empresa') or u'').strip()
        if texto:
            print(u'\n  nombre en cartera: «%s» — se usa para los parecidos.' % texto)

    # ORDEN A PROPOSITO: primero las fuentes que tienen CID, porque de ellas
    # salen los NOMBRES con los que luego se cruza el GRC —que casi nunca trae
    # CID—. Al reves, una cuenta fuera de la cartera se queda sin nombre con
    # el que buscar y el GRC la da por ausente teniendo su MRR.
    nombres = [texto] if texto else []
    if cuenta and (cuenta.get('empresa') or '').strip():
        nombres.append(cuenta['empresa'].strip())
    nombres += de_activaciones(cid, texto) or []
    nombres += de_contratos(cid) or []
    de_grc(cid, nombres)
    de_dids(cid)
    resto_de_data(cid, texto or (nombres[0] if nombres else u''))

    print(u'\n  ' + u'═' * 70)
    if no_leidas:
        print(u'  *** %d FUENTE(S) NO SE PUDIERON LEER. Un hueco aqui NO prueba'
              % len(no_leidas))
        print(u'      que el dato no exista: prueba que no se miro.')
        for f in no_leidas:
            print(u'      · %s' % f)
        return 1
    print(u'  Se barrieron TODAS las fuentes. Un hueco aqui si es un hueco.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
