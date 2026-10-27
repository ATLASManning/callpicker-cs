# -*- coding: utf-8 -*-
u"""CONCILIA LA AUDITORIA DE TELEFONIA DE TECH PEOPLE (oct 2026).

   Direccion comparte DOS archivos: la presentacion (.pdf) y el anexo (.xlsx).
   El anexo ES EL DATO; el PDF afirma sobre el. Antes de publicar una sola
   cifra en el expediente hay que exigirle al PDF que cuadre con el anexo, y
   al anexo que cuadre consigo mismo.

   ── LA TRAMPA PRINCIPAL DE ESTE DOCUMENTO: SON DOS ALCANCES ───────────────
   Hay cifras de la CUENTA PRINCIPAL (2094) y cifras de LAS DOS CUENTAS
   (2094 + 32785 Soluciones), y el PDF alterna entre ambas sin repetir el
   alcance en cada lamina. Publicar una como la otra es el error mas facil de
   cometer aqui y el mas dificil de ver despues:

       sin conversacion · dos cuentas   150,594
       sin conversacion · principal     147,422

   Las dos son ciertas. Citar la primera diciendo «de la cuenta» es falso.
   [[feedback-auditorias-verificar]]

   Es de SOLO LECTURA.

   USO
       python scripts/concilia-auditoria-techpeople.py
"""
import io
import os
import sys

from openpyxl import load_workbook

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = r'D:\Archivos\Auditorias\Anexo_Auditoria_Telefonia_TechPeople_2026.xlsx'

fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'\n          ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


def n(x):
    return format(int(round(x)), ',d')


def main():
    if not os.path.exists(XLSX):
        print(u'  *** no existe el anexo: %s' % XLSX)
        return 2
    wb = load_workbook(XLSX, data_only=True, read_only=True)

    # ── el resumen, como diccionario ──────────────────────────────────────
    R = {}
    for r in wb['1 Resumen'].iter_rows(values_only=True):
        if r and r[0] and r[1] is not None and isinstance(r[1], (int, float)):
            R[str(r[0]).strip()] = float(r[1])

    print(u'\n  AUDITORIA TECH PEOPLE — conciliacion PDF contra anexo')
    print(u'  ' + u'=' * 70)

    # ── 1 · EL UNIVERSO ───────────────────────────────────────────────────
    p = R['Interacciones · cuenta principal 2094']
    s = R['Interacciones · subcuenta Soluciones 32785']
    dup = R['Transferencias contadas dos veces']
    uni = R['Universo único consolidado']
    print(u'\n  (1) EL UNIVERSO')
    print(u'      principal %s + Soluciones %s = %s' % (n(p), n(s), n(p + s)))
    exige(abs((p + s) - 399585) < 1,
          u'principal + Soluciones son los 399,585 CDR del PDF',
          u'%s' % n(p + s))
    exige(abs((p + s - dup) - uni) < 1,
          u'el universo unico descuenta las transferencias',
          u'%s - %s = %s contra %s declarado' % (n(p + s), n(dup), n(p + s - dup), n(uni)))

    # ── 2 · LOS DOS LADOS DE LA CUENTA PRINCIPAL ──────────────────────────
    sal = R['Llamadas salientes']
    ent = R['Llamadas entrantes']
    print(u'\n  (2) CUENTA PRINCIPAL — los dos lados')
    exige(abs((sal + ent) - p) < 1,
          u'salientes + entrantes son las interacciones de la principal',
          u'%s + %s = %s contra %s' % (n(sal), n(ent), n(sal + ent), n(p)))

    con = R['Salientes que conectaron']
    nocon = R['Salientes que no conectaron']
    # NO CIERRA, Y SON CUATRO LLAMADAS. El anexo declara 223,024 salientes y
    # sus dos partes suman 223,020. La tabla del PDF (pagina 5) hace lo mismo:
    # 151,405 conectadas + 63,688 perdidas + 7,927 cortadas = 223,020.
    # Son el 0.0018% y no mueven ninguna conclusion, pero una tabla que no
    # cierra es una tabla que no cierra: se dice y se pregunta, no se redondea
    # ni se esconde. [[feedback-tablas-deben-cerrar]]
    hueco = sal - (con + nocon)
    exige(abs(hueco) < 1, u'el reparto de salientes CIERRA',
          u'%s + %s = %s contra %s declarado — FALTAN %s llamada(s) (%.4f%%). '
          u'La tabla de la pagina 5 del PDF tiene el mismo hueco. Preguntar a '
          u'quien construyo el anexo antes de publicar el desglose.'
          % (n(con), n(nocon), n(con + nocon), n(sal), n(hueco),
             100.0 * hueco / sal))

    age = R['Entrantes que llegaron a un agente']
    noage = R['Entrantes que NO llegaron a un agente']
    exige(abs((age + noage) - ent) < 1, u'el reparto de entrantes CIERRA',
          u'%s + %s = %s' % (n(age), n(noage), n(age + noage)))

    # ── 3 · LA CIFRA QUE SE PUEDE CITAR MAL ───────────────────────────────
    sinconv = R['Interacciones sin conversación']
    print(u'\n  (3) «SIN CONVERSACION» — LOS DOS ALCANCES')
    print(u'      anexo (cuenta principal) ....... %s' % n(sinconv))
    print(u'      PDF, portada (dos cuentas) ..... 150,594')
    exige(abs((nocon + noage) - sinconv) < 1,
          u'la cifra del anexo es salientes-no-conectaron + entrantes-sin-agente',
          u'%s + %s = %s' % (n(nocon), n(noage), n(nocon + noage)))
    print(u'      diferencia entre alcances ...... %s  (es Soluciones)'
          % n(150594 - sinconv))
    print(u'      -> AL CITAR, DECIR EL ALCANCE. No son dos versiones de una')
    print(u'         cifra: son dos cifras distintas, las dos ciertas.')

    # ── 4 · LOS PORCENTAJES, RECONSTRUIDOS ────────────────────────────────
    print(u'\n  (4) LOS PORCENTAJES SALEN DE DIVIDIR, no se copian')
    for etq, num, den, esperado in (
            (u'atencion entrante principal', age, ent, 0.457),
            (u'salientes que no conectan', nocon, sal, 0.321),
            (u'entrantes sin destino', R['Entrantes sin destino asignado'], ent, 0.373),
            (u'entrantes que mueren en menu', R['Entrantes que murieron en el menú'], ent, 0.472)):
        real = num / den
        exige(abs(real - esperado) < 0.0015, u'%s = %.1f%%' % (etq, esperado * 100),
              u'%s / %s = %.3f' % (n(num), n(den), real))

    # ── 5 · LO QUE NO CIERRA POR DISEÑO, Y HAY QUE DECIRLO ────────────────
    print(u'\n  (5) LO QUE NO SUMA, Y ESTA BIEN QUE NO SUME')
    menu = R['Entrantes que murieron en el menú']
    sindest = R['Entrantes sin destino asignado']
    print(u'      «sin destino» %s y «murio en menu» %s SE SOLAPAN:'
          % (n(sindest), n(menu)))
    print(u'      el PDF dice que 51,542 de las sin-destino son Self_service,')
    print(u'      o sea que casi todas las sin-destino estan DENTRO de las del')
    print(u'      menu. Sumarlas da %s sobre %s entrantes = %.0f%%, imposible.'
          % (n(sindest + menu), n(ent), 100.0 * (sindest + menu) / ent))

    # ── 6 · LA CONTRADICCION DE FECHA DEL PROPIO DOCUMENTO ────────────────
    print(u'\n  (6) CONTRADICCION INTERNA DEL DOCUMENTO')
    print(u'      portada del PDF .... «1 ene – 26 oct 2026»')
    print(u'      pie del PDF ........ «1 ene – 27 oct 2026»')
    print(u'      anexo .............. «1 ene – 27 oct 2026»')
    print(u'      El PDF se contradice consigo mismo en la primera pagina.')
    print(u'      Se publica el 27, que es lo que dicen DOS de las tres, y se')
    print(u'      anota. Ademas la pagina 4 aclara que octubre corta el dia 26')
    print(u'      en la principal y el 27 en la subcuenta: el periodo no es')
    print(u'      el mismo para las dos cuentas.')

    wb.close()
    print(u'\n  ' + u'=' * 70)
    if fallos:
        print(u'  *** %d COMPROBACION(ES) NO CIERRAN: %s'
              % (len(fallos), u' · '.join(fallos)))
        return 1
    print(u'  Todo lo que puede cerrarse, cierra. El anexo se sostiene y el')
    print(u'  PDF cuadra con el, con la salvedad de alcance del punto 3.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
