# -*- coding: utf-8 -*-
u"""Lleva un MODULO DE ISLA CLARA a la paleta del Customer Success Operating System.

   Generaliza `aplica-paleta-tickets.py`, que estaba clavado a un archivo.
   Encargo de direccion, 15 oct 2026: Churn y «todos los modulos».

   HACE DOS COSAS
   --------------
   1. Pone `cp-doc` en el contenedor raiz, que es la llave de la capa de
      globals.css: sin ella las clases Tailwind del archivo siguen con los
      grises y azules de Tailwind, y compila igual — no falla nada, se ve mal.
   2. Sustituye los hex sueltos del JSX, que ninguna capa CSS alcanza.

   SOLO PARA MODULOS SIN `.cp-card`
   --------------------------------
   Un archivo con `.cp-card` pinta islas OSCURAS y ahi el texto va CLARO:
   oscurecerlo lo vuelve ilegible. El guion lo comprueba y se niega.
   `scripts/mide-paleta-modulos.py` dice cual es cual.

   REEMPLAZO CONTADO: cada hex se cuenta antes y despues. Si un archivo no
   queda limpio, se dice. Nada silencioso.

   USO
       python scripts/aplica-paleta-modulo.py churn --simulacro
       python scripts/aplica-paleta-modulo.py churn
       python scripts/aplica-paleta-modulo.py --todos
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#: Los modulos de ISLA CLARA pendientes al 15 oct 2026.
#:
#: `chat` y `base-cs` se quedan FUERA a proposito: son las pantallas de Atlas,
#: que tienen su propio CSS con fondo oscuro aunque no usen la clase
#: `.cp-card`. Aplicarles la capa clara les oscureceria el texto sobre un fondo
#: ya oscuro. Van por su cuenta.
CLAROS = ['churn', 'customer-tenure', 'admin/usuarios', 'buzon', 'auditoria',
          'analisis-llamadas', 'alertas', 'asesores', 'seguimiento']

#: Los 14 modulos que usan `.cp-card`: pagina CLARA con islas OSCURAS dentro.
OSCUROS = ['facturacion/cortes', 'cuentas/[id]', 'admin/uso', 'reuniones',
           'reuniones/anexos', 'facturacion', 'callpicker-chat',
           'cuentas/dormidas', 'cuentas', 'cuentas/nueva', 'perfil-rol',
           'settings', 'chat', 'base-cs']

#: ── LOS INEQUIVOCOS ───────────────────────────────────────────────────────
#:
#: Un modulo con `.cp-card` NO es enteramente oscuro: es una pagina clara con
#: islas oscuras, y el mismo archivo mezcla las dos superficies. Por eso no se
#: le puede aplicar el mapeo claro a ciegas.
#:
#: Pero no todos los hex son ambiguos. Estos tienen el MISMO destino caiga
#: donde caiga, o solo pueden estar en una de las dos superficies:
#:
#:   · `#0f172a` -> `#082742`   marino profundo: fondo oscuro o texto casi
#:                              negro sobre claro. Sirve igual en los dos.
#:   · `#E2E8F0` -> `#DFE8EF`   la linea del documento, practicamente el mismo
#:                              color.
#:   · superficies claras -> `#F5F8FB`. Si estan, es que ahi hay zona clara.
#:   · `#7dd3fc` -> `#8AD7F8`   un cian claro SOLO tiene sentido sobre oscuro.
#:   · `#DBEAFE`/`#BFDBFE` -> plata: azules clarisimos, lo mismo.
#:   · `#475569`/`#374151` -> `#202E3B`. Sobre marino ya serian ilegibles
#:                              (bajo 3:1), asi que donde estan es zona clara.
#:
#: Los AMBIGUOS --`#94a3b8` x57, `#1B3FCC` x42, `#64748B` x28 y los acentos--
#: dependen del fondo REAL y se resuelven mirando la pantalla, no el archivo.
INEQUIVOCOS = [
    ('#0f172a', '#082742', u'marino profundo, vale en las dos superficies'),
    ('#E2E8F0', '#DFE8EF', u'linea -> --line'),
    ('#E5E7EB', '#DFE8EF', u'linea -> --line'),
    ('#D1D5DB', '#DFE8EF', u'linea -> --line'),
    ('#F8FAFC', '#F5F8FB', u'superficie clara -> --wash'),
    ('#F1F5F9', '#F5F8FB', u'superficie clara -> --wash'),
    ('#F3F4F6', '#F5F8FB', u'superficie clara -> --wash'),
    ('#F9FAFB', '#F5F8FB', u'superficie clara -> --wash'),
    ('#EFF6FF', '#F5F8FB', u'el lavado de la paleta anterior'),
    ('#7dd3fc', '#8AD7F8', u'cian claro: solo sobre oscuro'),
    ('#DBEAFE', '#DFE8EF', u'azul clarisimo -> plata'),
    ('#BFDBFE', '#A8BACB', u'azul clarisimo -> plata'),
    ('#475569', '#202E3B', u'texto alto: sobre marino ya seria ilegible'),
    ('#374151', '#202E3B', u'texto alto: idem'),
    ('#6b7280', '#667384', u'texto bajo'),
]

#: ── LOS AMBIGUOS, RESUELTOS POR LUMINOSIDAD ───────────────────────────────
#:
#: No hace falta abrir cada pantalla para saber sobre que fondo vive un tono:
#: lo dice el propio tono, porque solo cabe donde PASA contraste.
#:
#:   `#94a3b8` sobre blanco da 2.80:1 — no llega ni a objeto grafico. Donde
#:             este, esta sobre OSCURO. Va a la plata `#A8BACB` (6.25:1 sobre
#:             navy-700), que es su equivalente en el documento.
#:   `#64748B` sobre blanco da 4.76:1 y sobre marino ~2.5. Al reves: esta
#:             sobre CLARO. Va al medio `#3D4B5C`.
#:   `#1B3FCC` es el unico que vale en los dos sitios, y por eso no cambia de
#:             destino: como texto sobre claro da 8.6:1 y `#10355D` da 12.4;
#:             como fondo solido con blanco encima, 12.4 tambien.
#:   los acentos `#6366f1`, `#3b82f6`, `#8b5cf6` van al azul `#1D6CAA`, que es
#:             el acento de las islas CLARAS — el cian no vale ahi (2.63:1
#:             sobre blanco, ni objeto grafico).
#:
#: Si alguno estuviera sobre la superficie contraria seria un defecto que YA
#: existia --`#94a3b8` sobre blanco ya fallaba-- y lo caza
#: `revisa-contraste-cpcard.py`, que se corre despues.
AMBIGUOS = [
    ('#94a3b8', '#A8BACB', u'gris claro: solo cabe sobre oscuro -> plata'),
    ('#9ca3af', '#A8BACB', u'idem'),
    ('#64748B', '#3D4B5C', u'medio: solo cabe sobre claro -> texto medio'),
    ('#1B3FCC', '#10355D', u'vale en los dos: texto sobre claro y fondo solido'),
    ('#2563EB', '#10355D', u'idem'),
    ('#1E40AF', '#10355D', u'idem'),
    ('#6366f1', '#1D6CAA', u'acento -> --blue'),
    ('#3b82f6', '#1D6CAA', u'acento -> --blue'),
    ('#8b5cf6', '#1D6CAA', u'el documento no tiene morado'),
    ('#a855f7', '#1D6CAA', u'morado -> --blue: el documento no tiene morado'),
    ('#7c3aed', '#10355D', u'morado oscuro -> --navy'),
]

#: ── LOS COMPONENTES COMPARTIDOS ───────────────────────────────────────────
#:
#: El inventario por modulo mira `app/<modulo>/page.tsx` y NO VE esto: un
#: tablero entero puede quedar «en cero hex viejos» mientras la cabecera de su
#: tabla, pintada por un componente, sigue en el azul de antes. Fue justo lo
#: que paso el 15 oct: Churn daba 0 y en pantalla seguian el encabezado azul
#: electrico y un boton morado.
#:
#: Son 223 hex en `components/` mas el `theme-color` del layout, que es el que
#: pinta la BARRA DE LA VENTANA cuando el tablero se abre como PWA — eso no
#: esta en ninguna pantalla y se ve en todas.
COMPONENTES = 'components'

#: (viejo, nuevo, por que). El mismo mapeo medido para Tickets con
#: `scripts/mide-paleta-tickets.py`, contra las DOS superficies claras.
REGLAS = [
    ('#1B3FCC', '#10355D', u'azul electrico -> --navy'),
    ('#2563EB', '#10355D', u'azul 600 -> --navy'),
    ('#1E40AF', '#10355D', u'azul 800 -> --navy'),
    ('#3b82f6', '#1D6CAA', u'azul de series -> --blue'),
    ('#8b5cf6', '#10355D', u'morado: el documento no tiene morado'),
    ('#6366f1', '#082742', u'indigo -> --navy2'),
    ('#0f172a', '#082742', u'casi negro -> --navy2'),
    ('#7dd3fc', '#8AD7F8', u'cian claro, para texto sobre marino'),
    ('#E2E8F0', '#DFE8EF', u'lineas -> --line'),
    ('#E5E7EB', '#DFE8EF', u'lineas -> --line'),
    ('#D1D5DB', '#DFE8EF', u'lineas -> --line'),
    ('#F8FAFC', '#F5F8FB', u'superficie -> --wash'),
    ('#F1F5F9', '#F5F8FB', u'superficie -> --wash'),
    ('#F3F4F6', '#F5F8FB', u'superficie -> --wash'),
    ('#F9FAFB', '#F5F8FB', u'superficie -> --wash'),
    ('#EFF6FF', '#F5F8FB', u'el lavado de la paleta anterior'),
    ('#475569', '#202E3B', u'texto alto -> --ink'),
    ('#374151', '#202E3B', u'texto alto -> --ink'),
    ('#64748B', '#3D4B5C', u'texto medio'),
    ('#6b7280', '#667384', u'texto bajo'),
    ('#94a3b8', '#667384', u'texto bajo'),
    ('#9ca3af', '#667384', u'texto bajo'),
    ('#DBEAFE', '#DFE8EF', u'azul claro de Tailwind -> plata'),
    ('#BFDBFE', '#A8BACB', u'azul claro de Tailwind -> plata'),
]


def ruta_de(mod):
    return os.path.join(RAIZ, 'app', *mod.split('/'), 'page.tsx')


def sin_comentarios(src):
    hueco = lambda m: re.sub(r'[^\n]', ' ', m.group(0))
    return re.sub(r'//[^\n]*', hueco, re.sub(r'/\*[\s\S]*?\*/', hueco, src))


def pon_la_clase(src):
    u"""Mete `cp-doc` en el contenedor raiz del COMPONENTE EXPORTADO.

    ── EL ERROR QUE COSTO UNA RONDA ──────────────────────────────────────────
    La primera version buscaba el PRIMER `return (` del archivo. En `churn`
    —3,384 lineas con ocho componentes— ese primer return es el de un `<span>`
    auxiliar de la linea 1824, no el de la pagina, que esta en la 2415. La
    clase se puso en una pastilla y la pantalla entera siguio sin capa: el
    guion decia «puesta» y en el DOM no habia ninguna `.cp-doc`.

    Se ancla al `export default function`, que es el unico contenedor que
    envuelve el modulo entero.
    """
    if re.search(r'className="[^"]*\bcp-doc\b', src):
        return src, u'ya la tenia'
    # `async` incluido: tres modulos exportan `export default async function`.
    exp = re.search(r'export default (?:async )?function', src)
    if not exp:
        return src, u'*** sin export default'
    m = re.search(r'return \(\s*\n\s*<(\w+)([^>]*?)className="', src[exp.start():])
    if m:
        # Las posiciones son relativas al trozo: se devuelven al archivo.
        corte = exp.start() + m.end()
        return src[:corte] + 'cp-doc ' + src[corte:], u'puesta'
    m = None
    if not m:
        # No es un fallo si el modulo no usa NI UNA clase Tailwind de color:
        # entonces la capa no tiene nada que remapear y sobra. Pasa en buzon,
        # analisis-llamadas y alertas, que pintan todo con estilos en linea.
        clases = re.search(
            r'\b(bg|text|border)-(gray|slate|blue|indigo)-\d{2,3}\b',
            sin_comentarios(src))
        if not clases:
            return src, u'no hace falta'
        return src, u'*** no encuentro el contenedor raiz'
    corte = m.end()
    return src[:corte] + 'cp-doc ' + src[corte:], u'puesta'


def aplica(mod, simulacro, solo_inequivocos=False):
    ruta = ruta_de(mod)
    if not os.path.exists(ruta):
        print(u'  %-20s *** no existe %s' % (mod, ruta))
        return False
    src = io.open(ruta, encoding='utf-8').read()

    oscuro = 'cp-card' in sin_comentarios(src)
    if oscuro and not solo_inequivocos:
        print(u'  %-20s *** TIENE `.cp-card`: es isla OSCURA, no se toca aqui' % mod)
        return False

    antes = src
    # En un modulo oscuro NO se pone la capa clara: oscureceria el texto que
    # vive sobre marino. Solo se sustituyen los hex inequivocos.
    nota = u'(oscuro: sin capa)' if oscuro else None
    if not oscuro:
        src, nota = pon_la_clase(src)
    cambios = []
    lote = (INEQUIVOCOS + AMBIGUOS) if solo_inequivocos else REGLAS
    for viejo, nuevo, porque in lote:
        # LOS TINTES CON ALFA TAMBIEN. `#1B3FCC10` es el mismo color con un
        # `10` de opacidad pegado detras, y la frontera `(?![0-9a-fA-F])` lo
        # dejaba fuera: en Churn sobrevivieron dos --el fondo y el borde de la
        # semana seleccionada-- y se veian en pantalla en el azul de antes.
        # Se captura el sufijo y se devuelve tal cual tras el color nuevo.
        pat_alfa = re.escape(viejo) + r'([0-9a-fA-F]{2})\b'
        n_alfa = len(re.findall(pat_alfa, sin_comentarios(src), re.I))
        if n_alfa:
            src = re.sub(pat_alfa, nuevo + r'\1', src, flags=re.I)
            cambios.append((viejo + 'XX', nuevo + 'XX', n_alfa,
                            porque + u' (tinte con alfa)'))
        pat = re.escape(viejo) + r'(?![0-9a-fA-F])'
        n = len(re.findall(pat, sin_comentarios(src), re.I))
        if not n:
            continue
        src = re.sub(pat, nuevo, src, flags=re.I)
        cambios.append((viejo, nuevo, n, porque))

    total = sum(c[2] for c in cambios)
    print(u'  %-20s clase: %-12s  %3d sustitucion(es)' % (mod, nota, total))
    for viejo, nuevo, n, porque in cambios:
        print(u'      %-9s -> %-9s x%-3d %s' % (viejo, nuevo, n, porque))

    # Lo que QUEDA, que es el veredicto: un hex viejo superviviente se dice.
    # En modo inequivocos lo normal es que queden los AMBIGUOS, y eso no es un
    # fallo: es la lista de lo que hay que resolver mirando el fondo real.
    restos = {}
    limpio = sin_comentarios(src)
    for viejo, _n, _p in lote:
        q = len(re.findall(re.escape(viejo) + r'(?![0-9a-fA-F])', limpio, re.I))
        if q:
            restos[viejo] = q
    if restos:
        print(u'      *** QUEDAN: %s' % restos)

    if simulacro or src == antes:
        return True
    io.open(ruta, 'w', encoding='utf-8', newline='').write(src)
    return True


def aplica_archivo(ruta, etiqueta, simulacro):
    u"""El mismo mapeo sobre un archivo suelto: un componente o el layout.

    Aqui NO se pone la capa: un componente no tiene contenedor raiz propio —
    hereda el del modulo que lo monta.
    """
    src = io.open(ruta, encoding='utf-8').read()
    antes, cambios = src, []
    for viejo, nuevo, _porque in (INEQUIVOCOS + AMBIGUOS):
        pat_alfa = re.escape(viejo) + r'([0-9a-fA-F]{2})\b'
        n_a = len(re.findall(pat_alfa, sin_comentarios(src), re.I))
        if n_a:
            src = re.sub(pat_alfa, nuevo + r'\1', src, flags=re.I)
            cambios.append(n_a)
        pat = re.escape(viejo) + r'(?![0-9a-fA-F])'
        n = len(re.findall(pat, sin_comentarios(src), re.I))
        if n:
            src = re.sub(pat, nuevo, src, flags=re.I)
            cambios.append(n)
    total = sum(cambios)
    if total:
        print(u'  %-38s %3d sustitucion(es)' % (etiqueta, total))
    if not simulacro and src != antes:
        io.open(ruta, 'w', encoding='utf-8', newline='').write(src)
    return total


def main():
    simulacro = '--simulacro' in sys.argv
    oscuros = '--oscuros' in sys.argv

    if '--componentes' in sys.argv:
        base = os.path.join(RAIZ, COMPONENTES)
        print(u'\n  PALETA DEL DOCUMENTO -> components/ y el layout')
        print(u'  ' + u'=' * 72)
        tot = n = 0
        for dirpath, _d, files in os.walk(base):
            for f in sorted(files):
                if f.endswith(('.tsx', '.ts')):
                    r = os.path.join(dirpath, f)
                    c = aplica_archivo(r, os.path.relpath(r, RAIZ), simulacro)
                    tot += c
                    n += 1 if c else 0
        lay = os.path.join(RAIZ, 'app', 'layout.tsx')
        tot += aplica_archivo(lay, 'app/layout.tsx', simulacro)
        print(u'  ' + u'-' * 72)
        print(u'  %d sustitucion(es) en %d archivo(s)%s\n'
              % (tot, n + 1, u' (simulacro)' if simulacro else u''))
        return

    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if oscuros:
        mods = OSCUROS
    else:
        mods = CLAROS if ('--todos' in sys.argv or not args) else args

    print(u'\n  PALETA DEL DOCUMENTO -> %d modulo(s) de isla %s'
          % (len(mods), u'OSCURA (solo los hex inequivocos)' if oscuros
             else u'clara'))
    print(u'  ' + u'=' * 72)
    if simulacro:
        print(u'  SIMULACRO: no se escribe nada\n')
    ok = sum(1 for m in mods if aplica(m, simulacro, solo_inequivocos=oscuros))
    print(u'  ' + u'-' * 72)
    print(u'  %d de %d modulo(s) tratados%s\n'
          % (ok, len(mods), u' (simulacro)' if simulacro else u''))


if __name__ == '__main__':
    main()
