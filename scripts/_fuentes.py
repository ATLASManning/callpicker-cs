"""Dónde está cada archivo fuente, y qué hacer cuando no está.

POR QUÉ EXISTE. Los `.xlsx` de llamadas estaban sueltos en `D:\\Archivos` y
alguien los agrupó en una subcarpeta. Los dos generadores siguieron apuntando a
la carpeta vieja, así que dejaron de encontrarlos — y ninguno falló:

    gen-analisis-llamadas.py:   if not os.path.exists(ruta): print('!! FALTA'); continue
    gen-llamadas-data.py:       idem

Un aviso impreso más un `continue` es la peor combinación que hay. El generador
recorre sus seis fuentes, no encuentra ninguna, y emite una salida COMPLETA
—con su `meta`, su fecha de corte y su estructura— construida con cero filas. El
tablero la lee sin protestar y publica cero llamadas en toda la cartera, que es
indistinguible de un hallazgo. Nadie se enteraría hasta que un asesor preguntara
por qué su cuenta no tiene tráfico.

Así que aquí una fuente que falta ABORTA, y dice cuál y dónde se buscó. Y la
ruta no se clava: se prueban las ubicaciones conocidas, porque la carpeta ya se
movió una vez y volverá a moverse.
"""
import os

#: Dónde viven los archivos que entrega dirección.
ARCHIVOS = r'D:\Archivos'

#: Subcarpetas donde buscar, en orden. La cadena vacía es `ARCHIVOS` mismo.
#: Añadir aquí cuando dirección reorganice, en vez de editar los generadores.
SUBCARPETAS = ['', 'Análisis de Llamadas Dashboard', 'GRC', 'Callpicker']


def ruta(nombre, base=ARCHIVOS, subcarpetas=None):
    """La ruta del archivo, o se muere diciendo dónde buscó.

    No devuelve `None` ni una ruta inexistente a propósito: quien llame a esto
    está a punto de leer el archivo, y un `None` que se cuela produce justo la
    salida vacía y completa que esta función existe para evitar.
    """
    subs = SUBCARPETAS if subcarpetas is None else subcarpetas
    intentos = [os.path.join(base, sub, nombre) for sub in subs]
    for p in intentos:
        if os.path.exists(p):
            return p
    raise SystemExit(
        'NO ENCONTRE "%s".\n  Busque en:\n    %s\n'
        '  Si direccion movio la carpeta, agregala a SUBCARPETAS en '
        'scripts/_fuentes.py.' % (nombre, '\n    '.join(intentos)))


def existe(nombre, base=ARCHIVOS, subcarpetas=None):
    """Como `ruta()` pero devuelve `None` en vez de morir.

    Sólo para una fuente de verdad OPCIONAL. Si el archivo hace falta para que
    la salida sea correcta, se usa `ruta()`.
    """
    subs = SUBCARPETAS if subcarpetas is None else subcarpetas
    for sub in subs:
        p = os.path.join(base, sub, nombre)
        if os.path.exists(p):
            return p
    return None
