# -*- coding: utf-8 -*-
"""Gemelo en Python de `lib/observaciones-kam.ts`, solo para escribir.

   Los scripts que tocan `cuentas.observaciones_kam` desde fuera de la
   aplicacion tienen que dejar la nota con el MISMO encabezado que espera el
   parser de la ficha; si no, la entrada aparece pegada a la de arriba y sale
   firmada con la fecha y el autor de otro.

   Solo se replica la escritura. La lectura vive en el TypeScript y ahi se
   queda: dos parsers de la misma cosa se desincronizan.
"""
import datetime
import re

MARCA = '━━'
RX_ENCABEZADO = re.compile(
    r'^[ \t]*━+[ \t]*(\d{4})-(\d{2})-(\d{2})[ \t]*'
    r'(?:·[ \t]*Semana[ \t]*(\d+))?[ \t]*(?:·[ \t]*([^━\n]*?))?[ \t]*━*[ \t]*$')
RX_SIN_FECHA = re.compile(
    r'^[ \t]*━+[ \t]*sin fecha(?:[ \t]*·[^━\n]*)?[ \t]*━*[ \t]*$', re.I)
CAB_SIN_FECHA = '%s sin fecha · anterior a la bitácora %s' % (MARCA, MARCA)


def hoy_mx(d=None):
    """Fecha de hoy en Ciudad de Mexico, YYYY-MM-DD."""
    # Los scripts corren en la maquina de Jose Manuel, ya en hora local de
    # Mexico. No se fuerza zona para no desplazar la fecha al reves.
    return (d or datetime.date.today()).isoformat()


def semana_iso(fecha_iso):
    a, m, d = [int(x) for x in fecha_iso.split('-')]
    return datetime.date(a, m, d).isocalendar()[1]


def encabezado(fecha_iso, autor=None):
    partes = [fecha_iso, 'Semana %d' % semana_iso(fecha_iso)]
    quien = (autor or '').strip()
    if quien:
        partes.append(quien)
    return '%s %s %s' % (MARCA, ' · '.join(partes), MARCA)


def anteponer_entrada(previo, cuerpo, autor=None, fecha_iso=None):
    """Antepone una entrada fechada. Mismo comportamiento que el TS."""
    limpio = (cuerpo or '').strip()
    if not limpio:
        return previo or ''
    fecha_iso = fecha_iso or hoy_mx()
    anterior = (previo or '').strip()
    bloque = '%s\n%s' % (encabezado(fecha_iso, autor), limpio)
    # El «0» es el marcador de vacio que usan data-gaps y el radar.
    if not anterior or anterior == '0':
        return bloque
    # Si lo anterior no abre con encabezado se le pone el suyo: sin eso queda
    # pegado debajo y se lee como parte de la entrada nueva.
    primera = anterior.split('\n')[0]
    ya = bool(RX_SIN_FECHA.match(primera)) or bool(RX_ENCABEZADO.match(primera))
    cola = anterior if ya else '%s\n%s' % (CAB_SIN_FECHA, anterior)
    return '%s\n\n%s' % (bloque, cola)
