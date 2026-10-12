# -*- coding: utf-8 -*-
u"""¿Cuanto riesgo escrito se esta perdiendo por no leer las REUNIONES?

   `lib/alertas-detectar.ts:175` lo dice con todas sus letras: «la prosa del
   equipo, de sus TRES fuentes» — seguimientos, observaciones_kam y notas. La
   tabla `reuniones` no esta. Y es donde viven `resumen`, `acuerdos` y
   `proximos_pasos`, que es la prosa mas rica que captura el equipo.

   Este guion NO dicta veredicto. Saca las frases CANDIDATAS para leerlas a
   mano, por dos razones medidas:

   · Replicar el detector en Python miente confirmando. Ya paso: en JS `\\w`
     es [A-Za-z0-9_] y NO lleva acentos, asi que `solicit\\w*\\s+` no encuentra
     «solicito la baja»; en Python `\\w` si es Unicode. La replica conto 16
     donde produccion contaba 12. Aqui se usa la MISMA clase LETRA que el TS.
   · Las tres guardas del detector —negacion, «baja» como adjetivo, plantilla,
     desmentido— son justo donde se decide si una frase vale. Portarlas seria
     portar el juicio. Se marcan las sospechas y se leen.

   Credenciales: de `.env.local`, y NO se imprimen.
"""
import io
import os
import re
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        print(u'  *** no hay .env.local'); sys.exit(2)
    for linea in io.open(p, encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not KEY:
    print(u'  *** faltan credenciales en .env.local'); sys.exit(2)


def trae(tabla, select, extra=u''):
    filas, desde, paso = [], 0, 1000
    while True:
        u = u'%s/rest/v1/%s?select=%s%s&offset=%d&limit=%d' % (
            URL, tabla, select, extra, desde, paso)
        r = urllib.request.Request(u, headers={
            'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
        try:
            lote = json.loads(urllib.request.urlopen(r, timeout=60).read().decode('utf-8'))
        except Exception as e:
            print(u'  *** %s: %s' % (tabla, e)); sys.exit(2)
        filas.extend(lote)
        if len(lote) < paso:
            return filas
        desde += paso


# ── El MISMO vocabulario del TS. LETRA, no \w. ─────────────────────────────
L = u'[A-Za-z0-9_ÁÉÍÓÚÜÑáéíóúüñ]'

RX_BAJA = re.compile(u'|'.join([
    u'solicit' + L + u'*\\s+(?:la|su)\\s+(?:baja|cancelaci[oó]n)\\s+(?:de\\s+(?:la\\s+)?(?:cuenta|servicio|l[ií]nea)|del\\s+servicio)',
    u'solicitando\\s+la\\s+baja\\s+de\\s+la\\s+cuenta',
    u'pid(?:e|i[oó])\\s+la\\s+baja\\s+de\\s+la\\s+cuenta',
    u'(?:quiere|desea|va\\s+a)\\s+cancelar\\s+(?:el\\s+servicio|la\\s+cuenta)',
    u'confirm' + L + u'+\\s+(?:la\\s+)?cancelaci[oó]n\\s+(?:de\\s+)?(?:la\\s+cuenta|del\\s+servicio)',
    u'informa' + L + u'*\\s+(?:que\\s+)?se\\s+dan?\\s+de\\s+baja',
    u'en\\s+riesgo\\s+de\\s+cancelaci[oó]n',
]), re.I)

RX_RIESGO = re.compile(u'|'.join([
    u'alto\\s+riesgo\\s+de\\s+(?:cancelaci[oó]n|descontinuaci[oó]n|p[eé]rdida|churn)',
    u'riesgo\\s+de\\s+(?:cancelaci[oó]n|descontinuaci[oó]n|churn)',
    u'riesgo\\s+de\\s+p[eé]rdida\\s+de\\s+la\\s+cuenta',
    u'indicadores\\s+de\\s+riesgo',
    u'cuenta\\s+en\\s+riesgo',
    u'riesgo\\s+de\\s+perder\\s+(?:la\\s+)?(?:cuenta|cliente)',
    u'cotiz' + L + u'+\\s+con\\s+otr',
]), re.I)

RX_REDUCCION = re.compile(u'|'.join([
    u'solicit' + L + u'*\\s+(?:la\\s+)?baja\\s+de\\s+'
    u'(?:algun' + L + u'*|\\d+|' + L + u'+\\s+)?(?:dids?|extensiones|l[ií]neas)',
    u'baja\\s+de\\s+\\d+\\s*/\\s*\\d+\\s+dids?',
    u'(?:bajar|reducir)\\s+(?:de\\s+)?plan',
    u'reducir\\s+extensiones',
]), re.I)

PATRONES = [('baja_declarada', RX_BAJA), ('riesgo_escrito', RX_RIESGO),
            ('reduccion_declarada', RX_REDUCCION)]

print(u'\n  ── LO QUE HAY EN `reuniones` ──────────────────────────────────')
reu = trae('reuniones', 'id,fecha,tipo,titulo,resumen,acuerdos,proximos_pasos,cuenta_id,empresa')
print(u'  %d reunion(es) en total' % len(reu))

con_cuenta = [r for r in reu if r.get('cuenta_id')]
print(u'  %d vinculadas a una cuenta (%d sin vinculo: no alimentan nada)'
      % (len(con_cuenta), len(reu) - len(con_cuenta)))

CAMPOS = ('resumen', 'acuerdos', 'proximos_pasos')


def prosa(r):
    return u' '.join((r.get(c) or u'') for c in CAMPOS).strip()


con_texto = [r for r in con_cuenta if prosa(r)]
letras = sum(len(prosa(r)) for r in con_texto)
print(u'  %d con prosa · %s caracteres que el motor NO lee hoy'
      % (len(con_texto), u'{:,}'.format(letras)))

por_campo = {c: sum(1 for r in con_cuenta if (r.get(c) or u'').strip()) for c in CAMPOS}
for c in CAMPOS:
    print(u'      %-16s %3d reunion(es) lo traen' % (c, por_campo[c]))

# ── Candidatas, para LEERLAS ───────────────────────────────────────────────
print(u'\n  ── FRASES CANDIDATAS (hay que leerlas, no contarlas) ──────────')
hits = []
for r in con_texto:
    t = prosa(r)
    for tipo, rx in PATRONES:
        for m in rx.finditer(t):
            ini = max(0, m.start() - 80)
            fin = min(len(t), m.end() + 100)
            frag = u' '.join(t[ini:fin].split())
            hits.append({
                'tipo': tipo, 'cuenta': r['cuenta_id'],
                'empresa': r.get('empresa') or u'(sin empresa)',
                'fecha': str(r.get('fecha') or u'')[:10],
                'reunion': r.get('titulo') or u'',
                'frase': m.group(0), 'contexto': frag,
            })

if not hits:
    print(u'  ninguna. Las reuniones no traen riesgo declarado hoy —')
    print(u'  pero el hueco sigue abierto para la proxima que lo traiga.')
else:
    cuentas = sorted({h['cuenta'] for h in hits})
    print(u'  %d coincidencia(s) en %d cuenta(s) distintas.\n' % (len(hits), len(cuentas)))
    for h in hits:
        print(u'  [%s] %s · %s' % (h['tipo'], h['empresa'], h['fecha']))
        print(u'      reunion: %s' % h['reunion'][:80])
        print(u'      coincide: «%s»' % h['frase'])
        print(u'      contexto: …%s…\n' % h['contexto'])

# ── ¿Cuales de esas cuentas NO tienen ya senal por otra via? ───────────────
if hits:
    print(u'  ── ¿Ya se sabia por otra fuente? ────────────────────────────')
    seg = trae('seguimientos', 'cuenta_id,descripcion')
    cue = trae('cuentas', 'id,empresa,observaciones_kam,notas')
    otra = {}
    for c in cue:
        otra.setdefault(c['id'], []).append(
            u' '.join([c.get('observaciones_kam') or u'', c.get('notas') or u'']))
    for s in seg:
        if s.get('cuenta_id') and s.get('descripcion'):
            otra.setdefault(s['cuenta_id'], []).append(s['descripcion'])
    nombre = {c['id']: c.get('empresa') or c['id'][:8] for c in cue}
    nuevas = 0
    for cid in sorted({h['cuenta'] for h in hits}):
        texto = u' '.join(otra.get(cid, []))
        ya = any(rx.search(texto) for _, rx in PATRONES)
        if not ya:
            nuevas += 1
        print(u'      %-42s %s' % (
            nombre.get(cid, cid[:8])[:42],
            u'ya se sabia por otra fuente' if ya
            else u'*** SOLO SE SABE POR LA REUNION'))
    print(u'\n  %d cuenta(s) cuyo riesgo escrito HOY ES INVISIBLE.' % nuevas)
