# -*- coding: utf-8 -*-
"""
Publica el lote de auditorias del 26 nov 2026 en public/auditorias/.

    python -I scripts/publica-auditorias-2026-11-26.py [--origen <carpeta>] [--seco]

Un solo generador para los OCHO documentos, con una tabla de
(origen, destino, correcciones). Dos invariantes, y si alguna se rompe NO SE
ESCRIBE NADA:

  1. Cada sustitucion declara cuantas veces debe aparecer su texto. Si aparece
     otro numero de veces, el guion aborta nombrando el documento y la frase.
     Una correccion que no encuentra su sujeto es una correccion que no se hizo,
     y un guion que la da por hecha es peor que no tenerlo.
  2. Ninguna cifra del encabezado de la nota se teclea: el conteo de
     correcciones se calcula de la propia tabla.

Las correcciones van VISIBLES dentro del documento: una nota de conciliacion al
abrir el cuerpo, y cada frase corregida se conserva con su texto original y la
medicion al lado. No se borra ni una palabra del origen.

El origen por omision es el Escritorio del usuario (de donde llegaron). Los
archivos de origen son datos que no escribimos nosotros: solo se leen, nunca se
ejecuta nada de su carpeta.
"""
from __future__ import annotations

import io
import os
import re
import shutil
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO_DIR = os.path.join(RAIZ, 'public', 'auditorias')
ORIGEN_POR_OMISION = os.path.join(
    os.path.expanduser('~'), 'OneDrive', 'Escritorio')

MARCA = 'cp-nota-conciliacion'

# ─────────────────────────────────────────────────────────────────────────────
# ed(buscar, nota, veces=1)
#   buscar : el texto TAL CUAL esta en el documento de origen
#   nota   : lo medido, que se agrega al lado sin borrar el original
#   veces  : cuantas veces debe aparecer. Si no coincide, aborta.
# ─────────────────────────────────────────────────────────────────────────────


def ed(buscar: str, nota: str, veces: int = 1) -> dict:
    return {'buscar': buscar, 'nota': nota, 'veces': veces}


LOTE = [
    {
        'origen': 'Campestre los Viveros.html',
        'destino': 'Auditoria-Campestre-Los-Viveros-2026.html',
        'cuenta': u'Campestre Los Viveros · Z35 · CID 38444',
        'asesor': 'Dan',
        'notas': [
            u'«17 llegaron entre medianoche y las 5 h y todas terminaron perdidas, SIN BUZÓN»: '
            u'la propia serie horaria del documento trae 7 llamadas a buzón en esa franja '
            u'(h0 2, h1 2, h2 1, h5 2). Son 24 llamadas: 17 perdidas y 7 a buzón.',
            u'«31% del plan de 400 min usado (último corte)» viene de la ficha («capacidad ociosa '
            u'69%»), no de la medición — y el propio documento cuestiona esa ficha dos secciones '
            u'más abajo. Medido: el mes de mayor consumo es enero con 111 min (27.8%) y el último '
            u'mes cerrado, octubre, 107 min (26.8%).',
            u'VERIFICADO: los cinco repartos (mes, destino, periodo, día y hora) cierran contra '
            u'las 782 entrantes, y los cuatro desenlaces suman el total (260 + 286 + 194 + 42). '
            u'El MRR publicado ($1,069) coincide con el institucional del GRC.',
        ],
        'ediciones': [],
    },
    {
        'origen': 'Auditoria_Llamadas_SANSON_COCITEC_CID17297.html',
        'destino': 'Auditoria-SAN-SON-2026.html',
        'cuenta': u'SAN-SON (Sanson y Coffee Depot) · D10 · CID 17297',
        'asesor': 'Dan',
        'notas': [
            u'MRR institucional NO MEDIBLE: el GRC no trae fila para el CID 17297 ni por el '
            u'nombre «SAN-SON». La ficha guarda $12,554 y ésa NO es la cifra institucional. '
            u'No se puede citar un MRR para esta cuenta (el documento tampoco lo hace).',
            u'«COCITEC» no aparece en ninguna de nuestras fuentes —cartera, DIDs, GRC, '
            u'activaciones ni contratos—. La cuenta es SAN-SON, con las marcas Sanson y '
            u'Coffee Depot.',
            u'La tabla por sucursal declara excluir «3 números con comportamiento atípico '
            u'(207 llamadas)», pero sus 12 filas suman EXACTAMENTE las 9,095 del total: la '
            u'exclusión no se puede reconstruir desde la tabla.',
            u'«Sábado después de las 14 h: 129 llamadas, todas sin atender»: el mapa de calor '
            u'publicado tiene ventana de 7 a 20 h y sólo enseña 125. Las otras 4 caen después '
            u'de las 20 h.',
            u'VERIFICADO: las seis series cierran contra las 9,095 llamadas del periodo cerrado, '
            u'y el DID 229 456 0121 ($99) y el Agente CP Chat ($898, con el chat inactivo) están '
            u'los dos en la ficha de servicios, como afirma el documento.',
        ],
        'ediciones': [],
    },
    {
        'origen': 'Auditoria_Llamadas_Sellomatic_Impresores_CID43584.html',
        'destino': 'Auditoria-Sellomatic-Impresores-2026.html',
        'cuenta': u'Sellomatic Impresores · D27 · CID 43584',
        'asesor': 'Dan',
        'notas': [
            u'LO QUE EL DOCUMENTO NO VE: el GRC trae esta cuenta con movimiento «Churn '
            u'confirmado», MRR final $0 y pérdida de $7,333, y a la vez verificada como viva por '
            u'cartera. Paga al corriente, usa el 66% de su plan y tuvo contacto el 26 nov 2026. '
            u'Se sube a dirección; NO es autorización de baja.',
            u'El veredicto dice que el número 9032 «genera el 61% de las sin contestar», pero el '
            u'§10 define «sin atender» como perdida + abandono en menú. Lo medido es 60.8% de las '
            u'PERDIDAS (59.0% de los abandonos); un combinado caería entre las dos cifras.',
            u'El guion para el cliente dice «una llamada de regreso el mismo día»; lo medido es '
            u'«en ≤ 24 h», que no es lo mismo.',
            u'VERIFICADO: la ficha de servicios suma $7,333 ($4,039 de plan + 6 extensiones con '
            u'SIM + 6 complementos de datos), exactamente el MRR del GRC. El DID de la cuenta es '
            u'el mismo teléfono de la apoderada legal: llamar a la titular es llamar al conmutador.',
        ],
        'ediciones': [],
    },
    {
        'origen': 'Auditoria_Forense_Hospital_Santa_Rosa.html',
        'destino': 'Hospital-Santa-Rosa-Auditoria-Forense-2026-11-26.html',
        'cuenta': u'Hospital Santa Rosa · C4',
        'asesor': 'Erick',
        'notas': [
            u'EL HALLAZGO CENTRAL VALE EL DOBLE: el documento dice que la comunicación interna es '
            u'el 38.2% de la telefonía, y es el 73.98% (66,017 de 89,238 registros). El 38.2% es '
            u'sólo su mitad saliente.',
            u'«15.9% salientes externas»: lo medido es 7.93% (7,079 de 89,238).',
            u'Las tres cuotas del resumen suman 108.0%: los cubos se traslapan. El reparto que '
            u'cierra al 100.00% es: entrantes internas 32,653 (36.59%), entrantes externas 15,349 '
            u'(17.20%), entrantes anómalas 104 (0.12%), salientes internas 33,364 (37.39%), '
            u'salientes externas 7,079 (7.93%) y salientes inválidas 689 (0.77%).',
            u'Minutos: 55,613 + 36,736 = 92,349, y el encabezado declara 93,036. Difieren en 687.',
            u'«Sin mejora observable» y un piso de 22%: OCTUBRE ES EL MEJOR MES CERRADO DEL AÑO en '
            u'ambas direcciones (19.3% y 20.2%, contra 22.9% y 23.6% en enero). Sí hubo mejora.',
            u'«24.7% de pérdida promedio»: de extensión a extensión es 23.89%. El 24.7% sale de '
            u'incluir las 689 marcaciones inválidas (24.68%).',
            u'GRC: la cuenta aparece con movimiento «Churn confirmado», MRR final $0 y pérdida de '
            u'$18,345, y a la vez viva, con estado activo y contacto el 26 nov. Va a dirección; '
            u'NO es baja.',
        ],
        'ediciones': [],
    },
    {
        'origen': 'Auditoria_Llamadas_Grupo_Neruc.html',
        'destino': 'Auditoria-Grupo-Neruc-2026.html',
        'cuenta': u'Grupo Neruc · Sede Central C9 · CID 73660 · 5 CIDs',
        'asesor': 'Erick',
        'notas': [
            u'«19,801 llamadas no atendidas en cuatro cuentas» es la cifra del GRUPO COMPLETO. '
            u'Esas cuatro suman 1,952; las otras 17,849 son de Kia Corregidora, que sí tiene '
            u'recuperación (789, el 4.4%). La afirmación infla por diez el problema de las cuatro.',
            u'«Fuera de horario / fin de semana: 19.5%» suma poblaciones que se traslapan. Se lee '
            u'«HASTA 19.5%», no como una suma.',
            u'CUIDADO al leer las gráficas: la caída de minutos de Kia entre agosto y septiembre '
            u'(8,832 → 3,630) es efecto de la migración a su propio CID, no una caída de tráfico.',
            u'MRR: el institucional de C9 es $2,433 (GRC). Los $15,705 de la factura de agosto no '
            u'son el MRR. Y `cuentas.servicio` todavía describe el plan eliminado de 10,000 min '
            u'y 123 DIDs.',
            u'VERIFICADO: la reestructuración que pedía el corte de julio está EJECUTADA — cinco '
            u'CIDs reales en Zoho y el plan de Sede Central en 500 min, al 27.0% en octubre. '
            u'El «127.6% de consumo» del corte anterior es histórico.',
        ],
        'ediciones': [],
    },
    {
        'origen': 'auditoria_easo.html',
        'destino': 'Auditoria-EASO-2026.html',
        'cuenta': u'EASO (Transportes EASO) · C14 · CID 31044',
        'asesor': 'Erick',
        'notas': [
            u'El KPI de portada compara el 53.4% de Bitácora 1 de NOVIEMBRE contra el 16.8% de '
            u'enero, cuando el propio §Método dice que noviembre va en tránsito y «no se compara '
            u'como mes cerrado». El dato cerrado equivalente es el 59.4% de octubre.',
            u'La tabla por destino suma 142,205 entrantes contra las 155,406 del encabezado y no '
            u'declara su universo. La diferencia (13,201) son casi todos los 13,129 abandonos de '
            u'menú, que por definición no tienen destino; quedan 72 llamadas (0.05%) sin explicar.',
            u'«9,753 terminaron en el menú y sólo 4,548 llegaron a una persona» sobre 15,019 '
            u'llamadas deja 718 (el 4.8% de la línea) fuera de la frase: son las perdidas de esa '
            u'línea.',
            u'La tabla de evaluaciones suma 4,379 (4,059 positivas + 320 negativas) contra las '
            u'4,409 que declara el texto: faltan 30, y el 92.4% publicado es 92.7% sobre lo que '
            u'la tabla enseña. Y «contestadas» aparece como 126,331 en el bloque de encuesta '
            u'mientras la resta de las series cerradas da 126,349.',
            u'DENOMINADOR NO VERIFICABLE: el plan de 19,500 minutos sale de «13 extensiones × '
            u'1,500 min», y ese conteo no tiene respaldo en nuestras fuentes (la ficha de '
            u'servicios de la cuenta está VACÍA). Toda la lectura de «120%–149% sobre plan» '
            u'cuelga de ahí. No se propone cambio de plan antes de conciliarlo.',
            u'VERIFICADO: las series mensual, horaria y por día de la semana cierran exacto '
            u'(155,406 llamadas y 15,928 perdidas), y los tres incidentes se reconstruyen al '
            u'dígito. MRR institucional $13,021 (GRC); la ficha guarda $10,678.',
        ],
        'ediciones': [],
    },
    {
        'origen': 'auditoria_ehi_global.html',
        'destino': 'Auditoria-EHI-Global-2026.html',
        'cuenta': u'EHI Global (Grupo Antyr) · D8 · CID 147935',
        'asesor': 'Dan',
        'notas': [
            u'«En la franja que sí se cubre (9–14 h, lunes a viernes) se pierde 25.6%»: el 25.6% '
            u'es una cuenta correcta sobre otra población — sale de sumar los SIETE días '
            u'(550 de 2,147), con un fin de semana que pierde el 100% y que el mismo párrafo cita '
            u'aparte como «325 de 325». De lunes a viernes, 9–14 h, el mapa de calor da 349 de '
            u'1,946 = 17.9%. Corregirlo REFUERZA el argumento: la franja cubierta está mejor de '
            u'lo publicado y el fin de semana es un problema propio, que es justo lo que resuelve '
            u'el desborde a Bitrix.',
            u'VERIFICADO: el universo cierra al dígito por tres caminos independientes, el MRR '
            u'de $15,099 se confirma DOS veces (GRC y ficha de servicios: troncal SIP con Bitrix '
            u'$15,000 + DID $99) y la bitácora del KAM del 15 oct respalda palabra por palabra '
            u'la lectura de la salida a Telmex y el interés en portar. La ficha de facturación '
            u'guarda $15,607: desalineada por $508.',
        ],
        'ediciones': [],
    },
    {
        'origen': 'ALTERNET_Auditoria_2026.html',
        'destino': 'Auditoria-ALTERNET-2026.html',
        'cuenta': u'ALTERNET · C10 · CID 122421',
        'asesor': 'Erick',
        'notas': [
            u'LO QUE ESTE DOCUMENTO NO MENCIONA: el 25 de septiembre de 2026 el cliente SOLICITÓ '
            u'LA BAJA por escrito, y el agente comercial llamó el mismo día a confirmarla. La '
            u'alerta lleva 62 días abierta en severidad crítica. El motivo que dio el cliente '
            u'—«estamos en etapa de automatización e integraciones de agentes IA, y buscamos '
            u'mayor control de nuestras métricas y estadísticas»— es exactamente el portafolio '
            u'que este documento recomienda venderle.',
            u'LA CURVA NO ES DE DESEMPEÑO: las llamadas CONTESTADAS cayeron de 1,166 en mayo a '
            u'471 en septiembre (−60%) y el consumo del plan nunca pasó del 19% y bajó a 9%. '
            u'Agosto «mejora» a 30.3% porque entra menos, no porque atienda más.',
            u'La pérdida HUMANA es 34.1% (3,696 de 10,846), no 43.3%: las cinco extensiones mal '
            u'configuradas arrastran 1,772 perdidas. El documento dice que «contaminan el índice» '
            u'y nunca calcula el limpio.',
            u'El «43.3% global» es sólo la mitad ENTRANTE. Las salientes pierden 57.6% '
            u'(4,899 de 8,505, ene–sep cerrados) con 8.3 pp de dispersión en nueve meses, y este '
            u'corte no las mide. Las dos direcciones juntas: 9,871 de 19,865 = 49.7%.',
            u'Noviembre trae 479 llamadas contra una media de 1,232 de los meses anteriores — el '
            u'39% de un mes típico. El «rebrote al 42.4%» se construyó sobre un mes en tránsito.',
            u'El KPI de duración del encabezado (1.31 min) contradice al propio cuerpo del '
            u'documento (0.84 min). La ponderada por contestadas es 0.80 min; 1.31 es el valor de '
            u'noviembre.',
            u'La tabla de agentes suma 12,712 de 12,796: 84 llamadas y 71 perdidas sin cubo '
            u'«sin agente / otros». Es el único corte del documento que no cierra.',
            u'Ningún mes del año alcanzó el 70% de atención: el techo fue agosto con 69.7%, y fue '
            u'el segundo mes de menor volumen.',
            u'34 llamadas que el menú RESOLVIÓ van rotuladas «abandonadas» y sumadas a la '
            u'pérdida. Mueve 43.3% a 43.0%: inmaterial en magnitud, equivocado en etiqueta.',
            u'MRR institucional $8,176 (GRC, «MRR estable», pérdida $0). `cuentas.facturacion` '
            u'guarda $16,548 — 2.02× — y el cliente ya preguntó por su facturación en septiembre.',
        ],
        'ediciones': [
            ed(u'El resto del equipo opera entre 48% y 55% de pérdida',
               u'MEDIDO: la banda deja fuera a Miriam Flores (37.8%) por debajo y a Gerardo '
               u'Ligorio (55.6%) por arriba.'),
            ed(u'son los únicos agentes en zona de alerta aceptable',
               u'MEDIDO: la tabla de esta misma sección marca TRES en verde — M. G. Fuentes '
               u'Acosta va en 26.0%, mejor que Lilian.'),
            ed(u'en el mayor volumen del equipo',
               u'MEDIDO: el mayor volumen es de Lilian Araujo, con 4,071 llamadas contra las '
               u'3,504 de Ximena. Ximena sigue siendo el mejor índice, no el mayor volumen.'),
            ed(u'5,539 perdidas sin devolución',
               u'MEDIDO: sin devolución son 5,008. El renglón de arriba dice que 531 sí se '
               u'devolvieron.'),
            ed(u'Calificación neta positiva',
               u'MEDIDO: el valor de este renglón es NETO NEGATIVO — 101 positivas contra 119 '
               u'negativas (−18).'),
            # El documento menciona «1,866» tres veces: una bien («1,866 llamadas con tasas de
            # perdida entre 86.7% y 100%») y dos mal, con dos verbos distintos. Van como dos
            # sustituciones de una aparicion cada una, no como una de dos: el assert fallo
            # cuando se declararon juntas y por eso se encontro la tercera mencion.
            ed(u'acumulan 1,866 llamadas perdidas',
               u'MEDIDO: 1,866 es el total ASIGNADO a esas extensiones; sus perdidas son 1,772. '
               u'Otro párrafo de este documento lo dice bien.'),
            ed(u'suman 1,866 llamadas perdidas',
               u'MEDIDO: 1,866 es el total ASIGNADO a esas extensiones; sus perdidas son 1,772. '
               u'Otro párrafo de este documento lo dice bien.'),
        ],
    },
]


def nota_html(doc: dict) -> str:
    filas = u''.join(
        u'<li style="margin:0 0 10px 0;line-height:1.55">%s</li>' % n for n in doc['notas'])
    n_corr = len(doc['notas'])
    n_edi = sum(e['veces'] for e in doc['ediciones'])
    detalle = u'%d punto%s de conciliación' % (n_corr, u's' if n_corr != 1 else u'')
    if n_edi:
        detalle += u' · %d frase%s anotada%s dentro del texto' % (
            n_edi, u's' if n_edi != 1 else u'', u's' if n_edi != 1 else u'')
    return (
        u'<section id="%s" style="margin:0 0 28px 0;padding:24px 28px;'
        u'border:2px solid #b45309;border-left:8px solid #b45309;border-radius:0 12px 12px 0;'
        u'background:#fffbeb;color:#1f2937;font-family:system-ui,-apple-system,Segoe UI,sans-serif">'
        u'<div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;'
        u'color:#b45309;margin:0 0 6px 0">Nota de conciliación · Dirección SAC</div>'
        u'<h2 style="margin:0 0 4px 0;font-size:21px;color:#1f2937">%s</h2>'
        u'<p style="margin:0 0 16px 0;font-size:14px;color:#4b5563">'
        u'Conciliado el 26 de noviembre de 2026 contra cartera, el Gross Revenue y las fuentes de '
        u'llamadas. %s. Asesor de la cuenta: <strong>%s</strong>. '
        u'Nada del texto original se borró: lo corregido queda al lado de lo publicado.</p>'
        u'<ol style="margin:0;padding-left:22px;font-size:14.5px">%s</ol>'
        u'</section>'
        % (MARCA, doc['cuenta'], detalle, doc['asesor'], filas)
    )


def anotacion(nota: str) -> str:
    return (u' <mark style="background:#fef08a;color:#78350f;padding:1px 5px;border-radius:4px;'
            u'font-weight:600">[%s]</mark>' % nota)


def main() -> int:
    seco = '--seco' in sys.argv
    origen_dir = ORIGEN_POR_OMISION
    if '--origen' in sys.argv:
        origen_dir = os.path.abspath(sys.argv[sys.argv.index('--origen') + 1])

    print(u'\nPUBLICACION DEL LOTE DE AUDITORIAS · 26 nov 2026')
    print(u'=' * 74)
    print(u'  origen : %s' % origen_dir)
    print(u'  destino: %s' % DESTINO_DIR)
    if seco:
        print(u'  MODO SECO: se valida todo y no se escribe nada.')

    # ── fase 1: validar TODO antes de escribir nada ───────────────────────
    errores: list[str] = []
    preparados: list[tuple[dict, str]] = []

    for doc in LOTE:
        ruta = os.path.join(origen_dir, doc['origen'])
        if not os.path.exists(ruta):
            errores.append(u'%s: no existe en el origen' % doc['origen'])
            continue
        html = io.open(ruta, encoding='utf-8', errors='replace').read()

        if MARCA in html:
            errores.append(u'%s: ya trae la nota de conciliacion. El origen no debe llevarla; '
                           u'se publica desde el documento limpio.' % doc['origen'])
            continue

        cuerpos = list(re.finditer(r'<body\b[^>]*>', html, re.I))
        if len(cuerpos) != 1:
            errores.append(u'%s: tiene %d etiquetas <body>; se esperaba 1'
                           % (doc['origen'], len(cuerpos)))
            continue

        # cada sustitucion debe encontrar su sujeto el numero exacto de veces
        for e in doc['ediciones']:
            hay = html.count(e['buscar'])
            if hay != e['veces']:
                errores.append(
                    u'%s: la frase «%s» aparece %d vez(ces) y se declararon %d. '
                    u'Una correccion sin sujeto es una correccion que no se hizo.'
                    % (doc['origen'], e['buscar'][:70], hay, e['veces']))
        preparados.append((doc, html))

    if errores:
        print(u'\n  NO SE ESCRIBIO NADA. %d problema(s):' % len(errores))
        for x in errores:
            print(u'   - %s' % x)
        return 1

    # ── fase 2: aplicar y escribir ────────────────────────────────────────
    if not seco and not os.path.isdir(DESTINO_DIR):
        os.makedirs(DESTINO_DIR)

    total_notas = total_edic = 0
    for doc, html in preparados:
        for e in doc['ediciones']:
            html = html.replace(e['buscar'], e['buscar'] + anotacion(e['nota']))
            total_edic += e['veces']
        m = re.search(r'<body\b[^>]*>', html, re.I)
        html = html[:m.end()] + nota_html(doc) + html[m.end():]
        total_notas += len(doc['notas'])

        destino = os.path.join(DESTINO_DIR, doc['destino'])
        if not seco:
            io.open(destino, 'w', encoding='utf-8').write(html)
        print(u'  %-52s %s  (%d nota(s), %d anotacion(es), %.0f KB)'
              % (doc['destino'], u'escrito' if not seco else u'validado',
                 len(doc['notas']), sum(e['veces'] for e in doc['ediciones']),
                 len(html.encode('utf-8')) / 1024.0))

    print(u'\n  %d documento(s) · %d punto(s) de conciliacion · %d frase(s) anotada(s)'
          % (len(preparados), total_notas, total_edic))
    if not seco:
        print(u'  Siguiente: python -I scripts/sonda-documento-auditoria.py /auditorias/<archivo> '
              u'"frase"')
    return 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
