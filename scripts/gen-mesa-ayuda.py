# -*- coding: utf-8 -*-
"""Saca el corte diario de la mesa de ayuda del reporte de Zoho Desk.

   POR QUE EXISTE
   --------------
   El modulo Tickets del tablero se alimenta de `lib/tickets-data.json`, que
   viene del export de Zoho. Ese export SOLO trae tickets CERRADOS: de sus
   5,871 filas, dos no tienen fecha de cierre. Mientras tanto la mesa real
   tiene ~139 abiertos, ~140 en espera y once fuera de SLA.

   O sea: el tablero no puede ver un solo ticket abierto. El KPI `abiertos`
   que ya calcula `lib/tickets-cuenta.ts` —y que consumen la lista de cuentas,
   el Radar, el Panel de Asesores y el contexto de la IA— vale cero siempre.
   Un indicador que nunca cambia entrena a no mirarlo.

   Esto tapa la mitad urgente de ese hueco leyendo una fuente que YA EXISTE: el
   Reporte Diario de Mesa de Ayuda que la tarea programada genera de lunes a
   viernes. Trae los vencidos con cuenta, dias fuera de SLA, dias sin
   actividad, estado, propietario y canal.

   LO QUE NO TAPA, y hay que decirlo: los ~279 abiertos que NO estan vencidos.
   Para esos hace falta que el export de Zoho deje de filtrar por cerrado. Son
   dos huecos distintos y este cubre el mas urgente, no el mas grande.

   COMO CRUZA CON LA CARTERA
   -------------------------
   El reporte nombra la cuenta como «12283 - GRUPO 2711»: el CID primero. Se
   cruza por CID, NUNCA por nombre. Cruzar por nombre es justo lo que fallo con
   GRC, donde «GRUPO 2711» y «GRUPO 2711 (BATERIAS SENDERO)» no empataban y la
   alerta de churn no disparaba.

   USO
   ---
       python scripts/gen-mesa-ayuda.py                  # el mas reciente
       python scripts/gen-mesa-ayuda.py --todos          # rellena el historico
       python scripts/gen-mesa-ayuda.py <ruta.docx>      # uno concreto
"""
import glob
import io
import json
import os
import re
import sys
import time
import zipfile
from datetime import datetime, timedelta, timezone
from xml.etree import ElementTree as ET

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'data', 'mesa-ayuda')
# Donde la tarea programada deja los reportes. Se LEE de aqui; nada se escribe.
PATRON = r'C:\Users\manni\Downloads\Reporte_Diario_ZohoDesk_*.docx'

# La tabla de vencidos, por sus encabezados. NO por su posicion: el reporte
# tiene mas de treinta tablas y el orden puede cambiar entre versiones.
CABECERA = ('folio', 'asunto', 'contacto', 'cuenta')


def parrafos_y_tablas(ruta):
    z = zipfile.ZipFile(ruta)
    raiz = ET.fromstring(z.read('word/document.xml'))
    texto = []
    for p in raiz.iter(W + 'p'):
        t = ''.join(x.text or '' for x in p.iter(W + 't')).strip()
        if t:
            texto.append(t)
    tablas = []
    for tbl in raiz.iter(W + 'tbl'):
        filas = []
        for tr in tbl.iter(W + 'tr'):
            celdas = []
            for tc in tr.iter(W + 'tc'):
                celdas.append(' '.join(
                    ''.join(x.text or '' for x in p.iter(W + 't')).strip()
                    for p in tc.iter(W + 'p')).strip())
            if any(celdas):
                filas.append(celdas)
        if filas:
            tablas.append(filas)
    return texto, tablas


def tabla_de_vencidos(tablas):
    """La tabla ancha de vencidos: la que trae asunto, contacto y cuenta."""
    mejor, mejor_n = None, 0
    for t in tablas:
        cab = [c.lower() for c in t[0]]
        if all(any(k in c for c in cab) for k in CABECERA) and len(t) - 1 > mejor_n:
            mejor, mejor_n = t, len(t) - 1
    return mejor


def col(cab, *claves):
    for k in claves:
        for i, c in enumerate(cab):
            if k in c.lower():
                return i
    return None


def entero(s):
    m = re.search(r'-?\d+', str(s or '').replace(',', ''))
    return int(m.group(0)) if m else None


def extrae(ruta):
    texto, tablas = parrafos_y_tablas(ruta)
    plano = '\n'.join(texto)

    # La fecha, del nombre del archivo — es el dato mas fiable que hay.
    m = re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(ruta))
    fecha = m.group(1) if m else None
    assert fecha, 'el nombre del archivo no trae fecha ISO: %s' % ruta

    t = tabla_de_vencidos(tablas)
    vencidos = []
    if t:
        cab = t[0]
        i_folio = col(cab, 'folio')
        i_asunto = col(cab, 'asunto')
        i_cont = col(cab, 'contacto')
        i_cta = col(cab, 'cuenta')
        i_vence = col(cab, 'venció el', 'vencio el', 'vence')
        i_sla = col(cab, 'días fuera', 'dias fuera')
        i_act = col(cab, 'última actividad', 'ultima actividad')
        i_mudo = col(cab, 'días sin mover', 'dias sin mover', 'sin actualizar')
        i_est = col(cab, 'estado')
        i_resp = col(cab, 'responsable', 'propietario')
        i_canal = col(cab, 'canal')
        for fila in t[1:]:
            def v(i):
                return fila[i].strip() if i is not None and i < len(fila) else ''
            cuenta = v(i_cta)
            # «12283 – GRUPO 2711» -> cid 12283. El guion puede ser – o -.
            mc = re.match(r'\s*(\d+)\s*[–\-]\s*(.+)$', cuenta)
            vencidos.append({
                'folio':      v(i_folio).lstrip('#'),
                'asunto':     v(i_asunto),
                'contacto':   v(i_cont),
                'cid':        mc.group(1) if mc else '',
                'cuenta':     mc.group(2).strip() if mc else cuenta,
                'vence':      v(i_vence),
                'diasSLA':    entero(v(i_sla)),
                'ultimaAct':  v(i_act),
                'diasSinMover': entero(v(i_mudo)),
                'estado':     v(i_est),
                'responsable': v(i_resp),
                'canal':      v(i_canal),
            })

    # Los KPIs de la mesa, de la tabla de indicadores.
    kpis = {}
    ETIQ = {
        'abiertos': 'Tickets abiertos', 'enEspera': 'Tickets en espera',
        'vencidos': 'Tickets vencidos', 'noAsignados': 'Tickets no asignados',
        'nuevos24h': 'Nuevos en la ventana', 'cerrados24h': 'Cerrados en la ventana',
    }
    for tbl in tablas:
        for fila in tbl:
            if not fila:
                continue
            etiqueta = fila[0].strip()
            for clave, pref in ETIQ.items():
                if clave in kpis:
                    continue
                if etiqueta.lower().startswith(pref.lower()):
                    n = entero(fila[1]) if len(fila) > 1 else None
                    if n is not None:
                        kpis[clave] = n

    hora = re.search(r'cerrada a las ([\d:]+\s*h)', plano)
    return {
        'fecha': fecha,
        'horaCorte': hora.group(1) if hora else None,
        'origen': os.path.basename(ruta),
        'kpis': kpis,
        'ticketsVencidos': vencidos,
    }


def escribe(corte):
    os.makedirs(DESTINO, exist_ok=True)
    ruta = os.path.join(DESTINO, corte['fecha'] + '.json')
    io.open(ruta, 'w', encoding='utf-8').write(
        json.dumps(corte, ensure_ascii=False, indent=2))
    return ruta


def elige_por_fecha(rutas):
    """Un solo reporte por fecha, elegido A PROPOSITO y diciendo cual se descarta.

       La tarea programada deja duplicados: el 4, el 7 y el 15 de septiembre hay
       un `_1.docx` ademas del original. Y el del 15 NO es una copia — los dos
       difieren (11 vencidos contra 12), porque se generaron a las 09:14 y a las
       11:51 del mismo dia.

       Antes ganaba el ultimo por orden alfabetico (`_1` va despues), o sea por
       accidente, y se imprimian las dos lineas sin avisar de nada. Ahora gana el
       mas RECIENTE por fecha de modificacion —el corte posterior es el estado mas
       actual del dia— y se dice en voz alta cual se dejo fuera.
    """
    por_fecha = {}
    for r in rutas:
        m = re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(r))
        if not m:
            print('  *** sin fecha en el nombre, se omite: %s' % os.path.basename(r))
            continue
        por_fecha.setdefault(m.group(1), []).append(r)

    elegidas = []
    for fecha in sorted(por_fecha):
        cands = sorted(por_fecha[fecha], key=lambda p: os.path.getmtime(p))
        gana = cands[-1]
        elegidas.append(gana)
        if len(cands) > 1:
            print('  ! %s: hay %d reportes. Se usa el mas reciente.' % (fecha, len(cands)))
            for c in cands:
                marca = '<- se usa' if c == gana else '   se descarta'
                print('      %s  %s  %s'
                      % (os.path.basename(c),
                         time.strftime('%H:%M', time.localtime(os.path.getmtime(c))), marca))
            # Si difieren en el KPI, no es una copia: es otro corte del dia.
            kpis = []
            for c in cands:
                try:
                    kpis.append((os.path.basename(c), extrae(c)['kpis'].get('vencidos')))
                except Exception:
                    kpis.append((os.path.basename(c), None))
            distintos = {v for _, v in kpis if v is not None}
            if len(distintos) > 1:
                print('      *** NO son copias: el KPI «vencidos» difiere -> %s'
                      % ', '.join('%s=%s' % kv for kv in kpis))
    return elegidas


def hoy_en_mexico():
    """La fecha de hoy en Mexico. UTC-6 todo el ano desde 2022.

       Se ancla a UTC a proposito y NO se usa `datetime.now()` a secas: esa
       depende del reloj de la maquina, y la regla de la casa es que las fechas
       se anclen a Mexico siempre. (`utcnow()` esta deprecada; la forma con
       `timezone.utc` es la que no lo esta.)
    """
    return (datetime.now(timezone.utc) - timedelta(hours=6)).strftime('%Y-%m-%d')


def avisa_si_no_es_de_hoy(ruta):
    """El reporte mas reciente NO es de hoy: la tarea programada no corrio.

       Sin este aviso el script agarraria el del viernes un lunes por la manana,
       lo re-escribiria tal cual y el check diario daria verde — sin que nada
       hubiera cambiado y sin que nadie se enterara. Un falso verde es peor que
       un rojo: el rojo se atiende.

       NO bloquea: el corte se escribe igual (es el mismo dato, es idempotente).
       Solo cambia el codigo de salida para que no pase desapercibido.
    """
    m = re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(ruta))
    if not m:
        return False
    fecha, hoy = m.group(1), hoy_en_mexico()
    if fecha == hoy:
        return False
    try:
        dias = (datetime.strptime(hoy, '%Y-%m-%d') - datetime.strptime(fecha, '%Y-%m-%d')).days
    except ValueError:
        dias = None
    print()
    print('  ' + '=' * 68)
    print('  *** EL REPORTE MAS RECIENTE NO ES DE HOY')
    print('      el mas nuevo es del %s y hoy es %s%s'
          % (fecha, hoy, (' (%d dia(s) de atraso)' % dias) if dias else ''))
    print('      La tarea programada de Zoho Desk no ha corrido, o el archivo no')
    print('      llego a %s' % os.path.dirname(PATRON))
    print('      El corte se escribe igual, pero NO es el estado de hoy:')
    print('      lo que se vea sera el del %s.' % fecha)
    print('  ' + '=' * 68)
    return True


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    todos = '--todos' in sys.argv
    viejo = False

    if args:
        rutas = args
    else:
        crudas = sorted(glob.glob(PATRON))
        assert crudas, 'no hay reportes en %s' % PATRON
        rutas = elige_por_fecha(crudas)
        if not todos:
            rutas = rutas[-1:]
            viejo = avisa_si_no_es_de_hoy(rutas[0])

    print('  %d reporte(s) a procesar' % len(rutas))
    print()
    print('  %-12s %-6s %-9s %s' % ('FECHA', 'VENC.', 'KPIs', 'CUENTAS CON VENCIDOS'))
    resumen = []
    for r in rutas:
        try:
            c = extrae(r)
        except Exception as e:
            print('  *** %s: %s' % (os.path.basename(r), e))
            continue
        escribe(c)
        cuentas = sorted({v['cuenta'][:16] for v in c['ticketsVencidos'] if v['cuenta']})
        print('  %-12s %-6d %-9d %s' % (c['fecha'], len(c['ticketsVencidos']),
                                        len(c['kpis']), ', '.join(cuentas)[:58]))
        resumen.append(c)

    print()
    print('  escritos en %s' % os.path.relpath(DESTINO, RAIZ))

    # CIERRE: el numero de vencidos extraidos tiene que coincidir con el KPI
    # que el propio reporte declara. Si no, se extrajo de mas o de menos.
    malos = [c for c in resumen
             if c['kpis'].get('vencidos') is not None
             and c['kpis']['vencidos'] != len(c['ticketsVencidos'])]
    if malos:
        print()
        print('  *** NO CUADRAN: el KPI «vencidos» y las filas extraidas difieren')
        for c in malos:
            print('     %s: KPI dice %s, se extrajeron %d'
                  % (c['fecha'], c['kpis']['vencidos'], len(c['ticketsVencidos'])))
        return 1
    print('  CIERRA: en cada corte, las filas extraidas = el KPI «vencidos».')
    if viejo:
        # Codigo 2, distinto del 1 de «no cuadra»: el dato esta bien extraido,
        # lo que pasa es que NO es de hoy.
        print('  (codigo 2: el corte es correcto pero esta atrasado — ver el aviso de arriba)')
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
