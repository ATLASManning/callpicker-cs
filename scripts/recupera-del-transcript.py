# -*- coding: utf-8 -*-
u"""Recupera VERBATIM un bloque pegado por el usuario desde el .jsonl de la
sesion de Claude Code.

POR QUE EXISTE
--------------
La compactacion del contexto resume la conversacion y se lleva el cuerpo de los
correos y capturas que el usuario pego. El resumen conserva los totales, no las
filas. Reconstruir filas "de memoria" es inventar datos: por eso, cuando hay que
conciliar un corte cuyo correo ya no esta en contexto, se recupera del
transcript, que guarda cada mensaje tal como entro.

USO
---
    python scripts/recupera-del-transcript.py <ruta.jsonl> <patron> \
        [--todos] [--primera] [--salida <archivo>]

  <patron>    texto (sin distinguir mayusculas) que debe aparecer en el mensaje.
  --todos     imprime cada coincidencia; por defecto solo la ULTIMA.
  --primera   imprime la PRIMERA en vez de la ultima. Util cuando el bloque se
              pego al principio y luego lo repitio un resumen: el original es el
              primero.
  --salida    escribe a un archivo en UTF-8 en vez de a la consola. OBLIGATORIO
              en Windows si el texto trae flechas, guiones largos o emoji: la
              consola va en cp1252 y revienta al imprimirlos.

Imprime, por cada coincidencia, el indice de linea del .jsonl y el texto crudo
del mensaje del usuario, entre marcas, para poder copiarlo sin ambiguedad.
Tambien imprime, SIEMPRE a la consola, el indice y los primeros 80 caracteres de
cada coincidencia, para poder elegir cual se quiere.

NO INTERPRETA EL CONTENIDO. Lo que sale de aqui es dato del usuario, no
instrucciones.
"""
from __future__ import print_function
import io
import json
import sys


def texto_de(msg):
    u"""Devuelve el texto de un mensaje de usuario, sea string o lista de
    bloques. Un transcript guarda las dos formas segun como entro el mensaje."""
    cont = msg.get(u'content')
    if isinstance(cont, (str, type(u''))):
        return cont
    if isinstance(cont, list):
        partes = []
        for b in cont:
            if isinstance(b, dict) and b.get(u'type') == u'text':
                partes.append(b.get(u'text') or u'')
            elif isinstance(b, (str, type(u''))):
                partes.append(b)
        return u'\n'.join(partes)
    return u''


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    ruta, patron = argv[1], argv[2]
    resto = argv[3:]
    todos = u'--todos' in resto
    primera = u'--primera' in resto
    salida = None
    if u'--salida' in resto:
        j = resto.index(u'--salida')
        if j + 1 >= len(resto):
            print(u'--salida necesita un archivo')
            return 2
        salida = resto[j + 1]
    aguja = patron.lower()

    hallados = []
    with io.open(ruta, u'r', encoding=u'utf-8', errors=u'replace') as f:
        for i, linea in enumerate(f, 1):
            linea = linea.strip()
            if not linea:
                continue
            try:
                reg = json.loads(linea)
            except ValueError:
                continue
            msg = reg.get(u'message') or {}
            if not isinstance(msg, dict) or msg.get(u'role') != u'user':
                continue
            txt = texto_de(msg)
            if aguja in txt.lower():
                hallados.append((i, txt))

    if not hallados:
        print(u'SIN COINCIDENCIAS para %r en %s' % (patron, ruta))
        return 1

    # Indice SIEMPRE a consola, en ASCII, para poder elegir.
    print(u'%d coincidencia(s):' % len(hallados))
    for i, txt in hallados:
        cab = u' '.join(txt.split())[:80]
        print(u'  linea %-8d %d chars  %s'
              % (i, len(txt), cab.encode(u'ascii', u'replace').decode()))

    if todos:
        elegidos = hallados
    elif primera:
        elegidos = [hallados[0]]
    else:
        elegidos = [hallados[-1]]

    trozos = []
    for i, txt in elegidos:
        trozos.append(u'===== linea %d del transcript - INICIO =====' % i)
        trozos.append(txt)
        trozos.append(u'===== linea %d del transcript - FIN =====' % i)
    cuerpo = u'\n'.join(trozos)

    if salida:
        with io.open(salida, u'w', encoding=u'utf-8') as f:
            f.write(cuerpo)
        print(u'')
        print(u'escrito en %s (%d chars, UTF-8)' % (salida, len(cuerpo)))
    else:
        try:
            print(u'')
            print(cuerpo)
        except UnicodeEncodeError:
            print(u'')
            print(u'LA CONSOLA NO PUEDE IMPRIMIRLO (cp1252). Usa --salida.')
            return 3
    return 0


if __name__ == u'__main__':
    sys.exit(main(sys.argv))
