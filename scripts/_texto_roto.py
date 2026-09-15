"""Repara los nombres que llegan con la codificacion rota desde el archivo.

   Que paso: el export de origen escribio UTF-8 y en algun punto del camino
   alguien lo leyo como Mac Roman. Por eso «Bitacora» llega como «Bit√°cora» y
   «GARDUÑO» como «GARDU√ëO»: la «a» es C3 A1 en UTF-8, y en Mac Roman esos dos
   bytes son «√» y «°».

   El viaje de vuelta es exacto y sin perdida: volver a codificar en mac_roman
   devuelve los bytes UTF-8 originales, y decodificarlos da el nombre real.

   CUANDO SI Y CUANDO NO. Solo se repara si el viaje de vuelta funciona Y el
   resultado trae un caracter propio del espanol. Si no cumple las dos cosas,
   el nombre se deja intacto. La asimetria es a proposito: la regla de la casa
   es publicar el nombre tal como lo configuro el cliente, asi que dejar un
   nombre feo es un error mas barato que romper uno legitimo que de verdad
   llevaba un «√» o un «°».

   POR QUE VIVE APARTE. Lo usan los DOS generadores de llamadas —el del panel
   «Analisis de Llamadas» y el de la ficha de cuenta—. Si cada uno reparara por
   su cuenta acabarian diciendo cosas distintas del mismo destino, y dos
   paneles que se contradicen son peores que un acento roto.
"""

ACENTOS = set('áéíóúñÁÉÍÓÚÑüÜ¡¿')

# Los nombres se repiten millones de veces; el viaje de vuelta se hace una sola
# vez por nombre distinto (son ~1,600 destinos en 4.2 millones de filas).
_memo = {}


def arregla(s):
    """El nombre real si se puede reconstruir con certeza; si no, el original."""
    if not s:
        return s
    if s in _memo:
        return _memo[s]
    r = s
    try:
        cand = s.encode('mac_roman').decode('utf-8')
        if cand != s and (set(cand) & ACENTOS):
            r = cand
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass          # no era mojibake: se queda como vino
    _memo[s] = r
    return r


def reparados():
    """{roto: arreglado} de todo lo que se toco, para poder auditarlo."""
    return {k: v for k, v in _memo.items() if k != v}


def reporte(titulo='nombres reparados'):
    """Imprime que se reparo. Que el cambio sea visible es parte del arreglo."""
    r = reparados()
    print()
    print('%s: %d' % (titulo, len(r)))
    for roto, bueno in sorted(r.items(), key=lambda x: x[1])[:15]:
        print('  %-38s -> %s' % (roto[:38], bueno[:38]))
    if len(r) > 15:
        print('  ... y %d mas' % (len(r) - 15))
