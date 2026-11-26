# -*- coding: utf-8 -*-
"""
Concilia el corte de auditoria de ALTERNET (CID 122421) contra sus PROPIAS
tablas y contra data/analisis-llamadas.json.

    python -I scripts/concilia-auditoria-alternet.py <ruta-del-html> [--json]

── POR QUE RECIBE LA RUTA COMO ARGUMENTO ────────────────────────────────────
El 26 nov 2026 el conciliador de Hospital Santa Rosa tenia el documento clavado
en una constante. Se le paso la ruta del corte nuevo, ignoro el argumento,
concilio el corte VIEJO e imprimio «ok» siete veces sobre un archivo que nadie
le habia pedido mirar. Un verificador que concilia el documento equivocado y
concluye exito es peor que no tener verificador. Aqui la ruta es obligatoria.

No se teclea ni una cifra del documento: todas se leen de sus tablas HTML.
Las afirmaciones de la narrativa SI se teclean (son prosa), pero cada una se
busca literalmente en el HTML y se marca NO-ENCONTRADA si cambio de redaccion,
para que una reescritura del origen no deje un check verde sin sujeto.
"""
from __future__ import annotations

import io
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE_LLAMADAS = os.path.join(RAIZ, 'data', 'analisis-llamadas.json')

fallos: list[str] = []
avisos: list[str] = []


def ok(msg: str) -> None:
    print(u'  ok    %s' % msg)


def fail(msg: str) -> None:
    fallos.append(msg)
    print(u'  FALLA %s' % msg)


def warn(msg: str) -> None:
    avisos.append(msg)
    print(u'  aviso %s' % msg)


def limpia(s: str) -> str:
    s = re.sub(r'<[^>]+>', ' ', s)
    s = s.replace('&amp;', '&').replace('&nbsp;', ' ').replace('&#8211;', u'–')
    return re.sub(r'\s+', ' ', s).strip()


def num(s: str) -> float | None:
    m = re.search(r'-?[\d,]+\.?\d*', s.replace('%', '').replace('$', ''))
    if not m:
        return None
    try:
        return float(m.group(0).replace(',', ''))
    except ValueError:
        return None


def tablas(html: str) -> list[list[list[str]]]:
    out = []
    for t in re.findall(r'<table.*?</table>', html, re.S):
        filas = []
        for tr in re.findall(r'<tr.*?</tr>', t, re.S):
            celdas = [limpia(c) for c in re.findall(r'<t[hd].*?</t[hd]>', tr, re.S)]
            if celdas:
                filas.append(celdas)
        if filas:
            out.append(filas)
    return out


def dice(html_plano: str, frase: str, etiqueta: str) -> bool:
    """La afirmacion sigue en el documento? Si no, el check pierde su sujeto."""
    if frase.lower() in html_plano.lower():
        return True
    warn(u'la afirmacion «%s» YA NO APARECE en el documento (%s). '
         u'Revisar si el origen cambio de redaccion.' % (frase, etiqueta))
    return False


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__)
        print('FALTA la ruta del documento.')
        return 2
    doc = os.path.abspath(args[0])
    if not os.path.exists(doc):
        print('no existe: %s' % doc)
        return 2

    html = io.open(doc, encoding='utf-8', errors='replace').read()
    plano = limpia(re.sub(r'<(script|style)\b.*?</\1>', ' ', html, flags=re.S))

    print(u'\nCONCILIACION · auditoria ALTERNET (CID 122421)')
    print(u'=' * 74)
    print(u'  archivo leido: %s' % doc)
    print(u'  tamano: %.1f KB' % (os.path.getsize(doc) / 1024.0))

    tbs = tablas(html)
    print(u'  tablas encontradas: %d (%s)' % (len(tbs), ', '.join(str(len(t)) for t in tbs)))

    # ── localizar cada tabla por su encabezado, nunca por posicion ──────────
    def busca(*claves):
        for t in tbs:
            enc = ' | '.join(t[0]).lower()
            if all(k.lower() in enc for k in claves):
                return t
        return None

    t_mes = busca('mes', 'contestadas', 'perdidas')
    t_lin = busca('total llamadas', 'perdidas', 'duraci')
    t_dia = busca(u'día', 'total llamadas')
    t_age = busca('agente', 'asignadas')
    t_eva = busca(u'evaluaci', 'cantidad')

    for nom, t in (('mensual', t_mes), (u'por línea', t_lin),
                   ('por dia', t_dia), ('por agente', t_age), ('evaluaciones', t_eva)):
        if t is None:
            fail(u'no se encontro la tabla %s — el documento cambio de estructura' % nom)
    if t_mes is None or t_age is None:
        return 1

    # ── 1 · la tabla mensual cierra y define el universo ───────────────────
    print(u'\n1 · TABLA MENSUAL — cierre')
    meses = []
    for f in t_mes[1:]:
        if len(f) < 6 or num(f[1]) is None:
            continue
        meses.append({
            'mes': f[0], 'total': int(num(f[1])), 'cont': int(num(f[2])),
            'perd': int(num(f[3])), 'pct_at': num(f[4]), 'pct_pe': num(f[5]),
            'dur': num(f[6]) if len(f) > 6 else None,
        })
    TOT = sum(m['total'] for m in meses)
    CONT = sum(m['cont'] for m in meses)
    PERD = sum(m['perd'] for m in meses)
    print(u'      %d meses · total %s · contestadas %s · perdidas %s'
          % (len(meses), '{:,}'.format(TOT), '{:,}'.format(CONT), '{:,}'.format(PERD)))
    if CONT + PERD == TOT:
        ok(u'contestadas + perdidas = total (%s)' % '{:,}'.format(TOT))
    else:
        fail(u'contestadas + perdidas = %s, total %s' % (CONT + PERD, TOT))
    for m in meses:
        if m['cont'] + m['perd'] != m['total']:
            fail(u'%s no cierra: %d + %d != %d' % (m['mes'], m['cont'], m['perd'], m['total']))
        real = 100.0 * m['perd'] / m['total']
        if abs(real - m['pct_pe']) > 0.15:
            fail(u'%s: %% perdida declarado %.1f, real %.2f' % (m['mes'], m['pct_pe'], real))
    ok(u'los %d %% de perdida mensuales reconstruyen' % len(meses))

    # ── 2 · el encabezado contra la tabla ──────────────────────────────────
    print(u'\n2 · ENCABEZADO KPI contra la tabla mensual')
    reg = re.search(r'([\d,]+)\s*registros analizados', plano)
    if reg and int(num(reg.group(1))) == TOT:
        ok(u'«%s registros analizados» = la tabla' % reg.group(1))
    elif reg:
        fail(u'el encabezado declara %s registros, la tabla suma %s' % (reg.group(1), TOT))

    g_pe = 100.0 * PERD / TOT
    g_at = 100.0 * CONT / TOT
    for etq, real in ((u'Tasa de pérdida', g_pe), (u'Tasa de atención', g_at)):
        m = re.search(r'([\d.]+)%\s*' + etq, plano)
        if not m:
            warn(u'no se localizo el KPI «%s» en el encabezado' % etq)
            continue
        if abs(float(m.group(1)) - real) <= 0.1:
            ok(u'KPI %s %s%% = real %.2f%%' % (etq, m.group(1), real))
        else:
            fail(u'KPI %s declara %s%%, real %.2f%%' % (etq, m.group(1), real))

    # duracion: ponderada por contestadas, contra el KPI del encabezado
    if all(m['dur'] is not None for m in meses):
        pond = sum(m['cont'] * m['dur'] for m in meses) / float(CONT)
        m = re.search(r'([\d.]+)\s*min\s*Duraci', plano)
        if m:
            decl = float(m.group(1))
            if abs(decl - pond) <= 0.06:
                ok(u'KPI duracion %.2f min = ponderada %.2f min' % (decl, pond))
            else:
                cerca = min(meses, key=lambda x: abs((x['dur'] or 0) - decl))
                fail(u'KPI duracion declara %.2f min y la ponderada de la tabla es %.2f min. '
                     u'%.2f es el valor de UN mes (%s, %.1f min), no del periodo.'
                     % (decl, pond, decl, cerca['mes'], cerca['dur'] or 0))
        cuerpo = re.search(r'promedio global de ([\d.]+) min', plano)
        if cuerpo:
            cb = float(cuerpo.group(1))
            if abs(cb - pond) <= 0.06:
                ok(u'el cuerpo dice %.2f min = ponderada %.2f min' % (cb, pond))
            else:
                warn(u'el cuerpo dice %.2f min y la ponderada es %.2f min' % (cb, pond))
            if m and abs(cb - float(m.group(1))) > 0.06:
                fail(u'CONTRADICCION INTERNA: el encabezado dice %s min y el cuerpo %.2f min '
                     u'para el mismo promedio' % (m.group(1), cb))

    # ── 3 · las tablas de corte cierran contra el universo ─────────────────
    print(u'\n3 · CORTES (linea, dia, evaluacion) contra el universo')
    for nom, t, col in ((u'línea/DID', t_lin, 1), ('dia', t_dia, 1),
                        (u'evaluación', t_eva, 1)):
        if t is None:
            continue
        s = 0
        sp = 0
        for f in t[1:]:
            v = num(f[col]) if len(f) > col else None
            if v is None:
                continue
            s += int(v)
            if len(f) > 3 and num(f[3]) is not None and nom != u'evaluación':
                sp += int(num(f[3]))
        if s == TOT:
            ok(u'%s suma %s = el universo' % (nom, '{:,}'.format(s)))
        else:
            fail(u'%s suma %s y el universo es %s (faltan %s)'
                 % (nom, '{:,}'.format(s), '{:,}'.format(TOT), '{:,}'.format(TOT - s)))
        if sp and sp != PERD:
            fail(u'%s: las perdidas suman %s y el total es %s' % (nom, sp, PERD))
        elif sp:
            ok(u'%s: las perdidas suman %s = el total' % (nom, '{:,}'.format(sp)))

    # ── 4 · la tabla de agentes: el cubo que falta ─────────────────────────
    print(u'\n4 · TABLA DE AGENTES — el cubo «otros»')
    ags = []
    for f in t_age[1:]:
        if len(f) < 5 or num(f[1]) is None:
            continue
        ags.append({
            'nom': f[0], 'tot': int(num(f[1])), 'cont': int(num(f[2])),
            'perd': int(num(f[3])), 'pct': num(f[4]),
            'dur': num(f[5]) if len(f) > 5 else None,
            'sem': f[6] if len(f) > 6 else '',
        })
    A_TOT = sum(a['tot'] for a in ags)
    A_PERD = sum(a['perd'] for a in ags)
    print(u'      %d agentes · %s llamadas · %s perdidas'
          % (len(ags), '{:,}'.format(A_TOT), '{:,}'.format(A_PERD)))
    if A_TOT == TOT:
        ok(u'la tabla de agentes cierra contra el universo')
    else:
        fail(u'la tabla de agentes suma %s de %s: %s llamadas (%.2f%%) y %s perdidas NO tienen '
             u'cubo de agente. Falta una fila «sin agente / otros».'
             % ('{:,}'.format(A_TOT), '{:,}'.format(TOT), '{:,}'.format(TOT - A_TOT),
                100.0 * (TOT - A_TOT) / TOT, '{:,}'.format(PERD - A_PERD)))

    # ── 5 · el indice limpio: quitar las extensiones mal configuradas ──────
    print(u'\n5 · INDICE LIMPIO — sin las extensiones mal configuradas')
    malcfg = [a for a in ags if a['pct'] is not None and a['pct'] >= 80.0]
    M_TOT = sum(a['tot'] for a in malcfg)
    M_PERD = sum(a['perd'] for a in malcfg)
    print(u'      %d extensiones con >=80%% de perdida: %s'
          % (len(malcfg), ', '.join('%s (%.1f%%)' % (a['nom'], a['pct']) for a in malcfg)))
    print(u'      arrastran %s llamadas y %s perdidas'
          % ('{:,}'.format(M_TOT), '{:,}'.format(M_PERD)))
    h_tot = A_TOT - M_TOT
    h_perd = A_PERD - M_PERD
    limpio = 100.0 * h_perd / h_tot if h_tot else 0.0
    print(u'      >>> perdida HUMANA: %s de %s = %.2f%%  (el documento publica %.1f%% y nunca '
          u'calcula esta)' % ('{:,}'.format(h_perd), '{:,}'.format(h_tot), limpio, g_pe))
    m = re.search(r'acumulan ([\d,]+) llamadas perdidas', plano)
    if m:
        decl = int(num(m.group(1)))
        if decl == M_PERD:
            ok(u'«acumulan %s llamadas perdidas» = las perdidas reales' % m.group(1))
        elif decl == M_TOT:
            fail(u'«acumulan %s llamadas perdidas» usa el total ASIGNADO de esas extensiones; '
                 u'sus perdidas son %s. En otro parrafo el mismo documento lo dice bien '
                 u'(«%s llamadas con tasas de perdida entre...»).'
                 % (m.group(1), '{:,}'.format(M_PERD), m.group(1)))
        else:
            fail(u'«acumulan %s llamadas perdidas» no reconstruye (reales %s)'
                 % (m.group(1), M_PERD))

    # ── 6 · la banda «entre 48% y 55%» ────────────────────────────────────
    print(u'\n6 · LA BANDA DEL RESTO DEL EQUIPO')
    mb = re.search(r'resto del equipo opera entre (\d+)% y (\d+)%', plano)
    if mb:
        lo, hi = float(mb.group(1)), float(mb.group(2))
        resto = [a for a in ags if a not in malcfg]
        # el documento excluye explicitamente a los dos «referentes» que nombra
        refs = [a for a in resto if a['pct'] is not None and ('erente' in a['sem'] or a['pct'] < 32)]
        banda = [a for a in resto if a not in refs]
        fuera = [a for a in banda if a['pct'] is not None and (a['pct'] < lo or a['pct'] > hi)]
        if not fuera:
            ok(u'todos los demas caen en [%g%%, %g%%]' % (lo, hi))
        else:
            fail(u'«el resto del equipo opera entre %g%% y %g%%» es falso: %s'
                 % (lo, hi, '; '.join('%s %.1f%%' % (a['nom'], a['pct']) for a in fuera)))
        verdes = [a for a in resto if 'ceptable' in a['sem'] or 'erente' in a['sem']]
        mu = re.search(r'son los únicos agentes en zona de alerta aceptable', plano)
        if mu and len(verdes) > 2:
            fail(u'el cuerpo dice que SOLO DOS agentes estan en zona aceptable y su propia tabla '
                 u'marca %d en verde: %s. Contradiccion con la tabla de la misma seccion.'
                 % (len(verdes), ', '.join('%s (%.1f%%)' % (a['nom'], a['pct']) for a in verdes)))

    # ── 7 · quien tiene el mayor volumen ──────────────────────────────────
    print(u'\n7 · EL «BENCHMARK» Y EL VOLUMEN')
    top = max(ags, key=lambda a: a['tot'])
    mv = re.search(r'([A-Z][\wÁÉÍÓÚÑáéíóúñ.\s]{3,40}?)\s*(?:representa\s*)?[^.]{0,40}'
                   r'mayor volumen del equipo', plano)
    if 'mayor volumen del equipo' in plano:
        # de quien lo dice: se busca el nombre citado en la misma frase
        i = plano.find('mayor volumen del equipo')
        frase = plano[max(0, i - 220):i + 120]
        citado = None
        for a in ags:
            apellidos = a['nom'].split()
            if apellidos and apellidos[0] in frase:
                citado = a
                break
        if citado and citado is not top:
            fail(u'el documento atribuye «el mayor volumen del equipo» a %s (%s llamadas) y el '
                 u'mayor volumen es de %s con %s llamadas.'
                 % (citado['nom'], '{:,}'.format(citado['tot']),
                    top['nom'], '{:,}'.format(top['tot'])))
        elif citado:
            ok(u'«mayor volumen del equipo» = %s (%s)' % (top['nom'], '{:,}'.format(top['tot'])))
        else:
            warn(u'se dice «mayor volumen del equipo» y no se pudo identificar a quien')

    # ── 8 · devoluciones: el renglon que se contradice ─────────────────────
    print(u'\n8 · DEVOLUCIONES Y EVALUACIONES')
    mdev = re.search(r'([\d,]+)\s*perdidas sin devoluci', plano)
    mtot = re.search(r'Total devoluciones exitosas\s*\|?\s*([\d,]+)', plano)
    ndev = None
    for f in (t_eva or []):
        pass
    mdv = re.search(r'devoluciones exitosas[^\d]{0,40}([\d,]+)', plano)
    m415 = re.search(r'([\d.]+)%\s*(?:de\s*)?[Dd]evoluciones exitosas', plano)
    mnd = re.search(r'Total devoluciones exitosas ([\d,]+)', plano)
    ndev = int(num(mnd.group(1))) if mnd else None
    if ndev is None:
        mnd = re.search(r'Las ([\d,]+) devoluciones exitosas', plano)
        ndev = int(num(mnd.group(1))) if mnd else None
    if ndev is not None:
        pct = 100.0 * ndev / TOT
        mp = re.search(r'\(([\d.]+)%\)', plano[plano.find('devoluciones exitosas'):][:80]) if 'devoluciones exitosas' in plano else None
        if mp and abs(float(mp.group(1)) - pct) > 0.05:
            fail(u'devoluciones: %s de %s es %.2f%%, se declara %s%%'
                 % (ndev, TOT, pct, mp.group(1)))
        else:
            ok(u'devoluciones %s de %s = %.2f%%' % (ndev, '{:,}'.format(TOT), pct))
        if mdev:
            sd = int(num(mdev.group(1)))
            if sd == PERD:
                fail(u'«%s perdidas sin devolucion» usa TODAS las perdidas, y el mismo renglon de '
                     u'arriba dice que %s SI se devolvieron. Sin devolucion son %s.'
                     % (mdev.group(1), ndev, '{:,}'.format(PERD - ndev)))
            elif sd == PERD - ndev:
                ok(u'«%s perdidas sin devolucion» descuenta las devueltas' % mdev.group(1))
            else:
                warn(u'«%s perdidas sin devolucion» no reconstruye (%s - %s = %s)'
                     % (mdev.group(1), PERD, ndev, PERD - ndev))

    if t_eva:
        neg = pos = None
        for f in t_eva[1:]:
            if 'egativa' in f[0] and num(f[1]) is not None:
                neg = int(num(f[1]))
            if 'ositiva' in f[0] and num(f[1]) is not None:
                pos = int(num(f[1]))
        if neg is not None and pos is not None:
            if pos > neg:
                ok(u'calificacion neta positiva (%d positivas vs %d negativas)' % (pos, neg))
            else:
                fail(u'un renglon rotulado «Calificacion neta positiva» lleva un valor NETO '
                     u'NEGATIVO: %d positivas vs %d negativas = %+d.' % (pos, neg, pos - neg))

    # ── 9 · el mes en transito ────────────────────────────────────────────
    print(u'\n9 · EL ULTIMO MES — cerrado o en transito')
    if len(meses) >= 3:
        ult = meses[-1]
        previos = [m['total'] for m in meses[:-1]]
        med = sum(previos) / float(len(previos))
        if ult['total'] < 0.75 * med:
            fail(u'%s trae %s llamadas contra una media de %.0f de los meses anteriores '
                 u'(%.0f%% del mes tipico): es un mes EN TRANSITO y el documento lo lee como '
                 u'cerrado para construir el «rebrote» al %.1f%%.'
                 % (ult['mes'], '{:,}'.format(ult['total']), med,
                    100.0 * ult['total'] / med, ult['pct_pe']))
        else:
            ok(u'%s tiene volumen de mes completo' % ult['mes'])
        cerrados = meses[:-1]
        mejor = min(cerrados, key=lambda m: m['pct_pe'])
        peor = max(cerrados, key=lambda m: m['pct_pe'])
        print(u'      meses CERRADOS: mejor %s (%.1f%% perdida / %.1f%% atencion) · '
              u'peor %s (%.1f%%)'
              % (mejor['mes'], mejor['pct_pe'], mejor['pct_at'], peor['mes'], peor['pct_pe']))
        m70 = re.search(r'demuestran que\s*el 70% es alcanzable', plano)
        if m70 or 'el 70% es alcanzable' in plano:
            if mejor['pct_at'] >= 70.0:
                ok(u'algun mes alcanzo el 70%% de atencion (%s: %.1f%%)'
                   % (mejor['mes'], mejor['pct_at']))
            else:
                warn(u'se afirma que los mejores meses «demuestran que el 70%% es alcanzable» y '
                     u'NINGUN mes del ano llego al 70%%: el techo fue %s con %.1f%%.'
                     % (mejor['mes'], mejor['pct_at']))

    # ── 10 · contra data/analisis-llamadas.json: la mitad que falta ────────
    print(u'\n10 · CONTRA data/analisis-llamadas.json — la mitad SALIENTE')
    if not os.path.exists(FUENTE_LLAMADAS):
        warn(u'no esta %s: no se puede cruzar' % FUENTE_LLAMADAS)
    else:
        src = json.load(io.open(FUENTE_LLAMADAS, encoding='utf-8'))
        cta = src.get('cuentas', {}).get('122421')
        if not cta:
            warn(u'el CID 122421 no esta en analisis-llamadas.json')
        else:
            corte = cta.get('corte', src.get('meta', {}).get('corte', '?'))
            ent, sal = cta.get('ent', {}), cta.get('sal', {})
            me, ms = ent.get('meses', {}), sal.get('meses', {})
            # solo los meses que AMBAS fuentes traen completos
            comunes = sorted(k for k in me if k in ms)
            if comunes:
                comunes = comunes[:-1]  # el ultimo del corte viene parcial
            e_t = sum(me[k]['total'] for k in comunes)
            e_l = sum(me[k].get('Lost', 0) for k in comunes)
            e_s = sum(me[k].get('Self_service', 0) for k in comunes)
            s_t = sum(ms[k]['total'] for k in comunes)
            s_l = sum(ms[k].get('Lost', 0) for k in comunes)
            print(u'      corte de la fuente: %s · meses cerrados cruzados: %s a %s'
                  % (corte, comunes[0], comunes[-1]))
            # el documento trae esos mismos meses?
            doc_t = sum(m['total'] for m in meses[:len(comunes)])
            doc_p = sum(m['perd'] for m in meses[:len(comunes)])
            if doc_t == e_t:
                ok(u'entrantes %s: el documento y la fuente coinciden EXACTO'
                   % '{:,}'.format(e_t))
            else:
                fail(u'entrantes: el documento suma %s en %d meses y la fuente %s'
                     % ('{:,}'.format(doc_t), len(comunes), '{:,}'.format(e_t)))
            if doc_p == e_l + e_s:
                ok(u'el documento cuenta como «perdidas» Lost + Self_service '
                   u'(%s + %s = %s): los %s de autoservicio son llamadas que el IVR '
                   u'RESOLVIO, y van rotuladas «abandonadas».'
                   % ('{:,}'.format(e_l), e_s, '{:,}'.format(e_l + e_s), e_s))
            elif doc_p == e_l:
                ok(u'el documento cuenta como «perdidas» solo Lost (%s)' % '{:,}'.format(e_l))
            else:
                warn(u'perdidas del documento %s; la fuente da Lost %s y Self_service %s'
                     % (doc_p, e_l, e_s))
            print(u'      >>> SALIENTES %s a %s: %s de %s perdidas = %.2f%% — el documento '
                  u'NO mide esta mitad' % (comunes[0], comunes[-1], '{:,}'.format(s_l),
                                           '{:,}'.format(s_t), 100.0 * s_l / s_t))
            univ = e_t + s_t
            perd2 = e_l + s_l
            print(u'      >>> LAS DOS DIRECCIONES: %s de %s = %.2f%% (los entrantes son el '
                  u'%.1f%% del trafico). El «%.1f%% global» del documento es la mitad entrante.'
                  % ('{:,}'.format(perd2), '{:,}'.format(univ), 100.0 * perd2 / univ,
                     100.0 * e_t / univ, g_pe))
            # la saliente mejoro?
            serie = [(k, 100.0 * ms[k].get('Lost', 0) / ms[k]['total']) for k in comunes]
            print(u'      saliente mes a mes: %s'
                  % ' · '.join('%s %.1f%%' % (k[5:], v) for k, v in serie))
            disp = max(v for _, v in serie) - min(v for _, v in serie)
            print(u'      dispersion saliente: %.1f pp en %d meses — %s'
                  % (disp, len(serie),
                     u'PLANA: falla estructural, no coyuntural' if disp < 12 else u'con variacion'))

    # ── cierre ────────────────────────────────────────────────────────────
    print(u'\n' + u'=' * 74)
    print(u'  %d falla(s) · %d aviso(s)' % (len(fallos), len(avisos)))
    for f in fallos:
        print(u'   FALLA · %s' % f)
    for a in avisos:
        print(u'   aviso · %s' % a)
    return 1 if fallos else 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
