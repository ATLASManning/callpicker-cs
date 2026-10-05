# -*- coding: utf-8 -*-
"""Comprueba que el bucket `anexos` NO es publico, y lo prueba al reves.

   POR QUE EXISTE
   --------------
   Ahi viven documentos de cliente: contratos, analisis de fallas, propuestas.
   Un bucket publico en Supabase sirve CUALQUIER objeto a cualquiera que sepa
   la URL, sin sesion y sin dejar rastro — el mismo agujero que el 18 sep 2026
   obligo a borrar tres exports de `public/` (activaciones, cortes y tickets,
   con nombres de cliente y montos).

   No basta con leer el flag `public`: se sube un archivo de prueba y se intenta
   bajarlo SIN credenciales. Una regla solo se prueba metiendole lo que no debe
   entrar. Al terminar se borra el archivo de prueba.

   USO
   ---
       python scripts/verifica-bucket-anexos.py
"""
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUCKET = 'anexos'
PRUEBA = '__prueba-acceso-publico__.pdf'
# Los seis que el modulo acepta: PDF, Word (.doc/.docx) y Excel (.xls/.xlsx/.xlsm).
MIME_ESPERADOS = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    # HTML desde el 5 oct 2026. Es el unico que ejecuta codigo: la descarga
    # va como adjunto y con CSP sandbox. Ver app/api/anexos/[id]/descargar.
    'text/html',
}

fallas = []


def env(clave):
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8-sig') as f:
        for linea in f:
            if linea.strip().startswith(clave + '='):
                return linea.split('=', 1)[1].strip().strip('"')
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY')


def prueba(etq, cond, det=''):
    if not cond:
        fallas.append(etq)
    print('  %-52s %s  %s' % (etq, 'OK      ' if cond else '** FALLA', det))


def pide(metodo, ruta, cuerpo=None, ctype='application/json', con_llave=True):
    r = urllib.request.Request(f'{URL}{ruta}', method=metodo)
    if con_llave:
        r.add_header('apikey', KEY)
        r.add_header('Authorization', f'Bearer {KEY}')
    if cuerpo is not None:
        r.add_header('Content-Type', ctype)
        r.data = cuerpo if isinstance(cuerpo, bytes) else json.dumps(cuerpo).encode()
    try:
        with urllib.request.urlopen(r, timeout=45) as x:
            return x.status, x.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def main():
    st, cuerpo = pide('GET', f'/storage/v1/bucket/{BUCKET}')
    if st != 200:
        print(f'  el bucket `{BUCKET}` no existe ({st}). Crearlo privado antes de usar el modulo.')
        return 1
    b = json.loads(cuerpo.decode())

    prueba('el bucket NO es publico', b.get('public') is False,
           f"public={b.get('public')}")
    prueba('tiene limite de tamano', bool(b.get('file_size_limit')),
           f"{(b.get('file_size_limit') or 0) // (1024 * 1024)} MB")
    mimes = set(b.get('allowed_mime_types') or [])
    prueba('solo acepta PDF, Word, Excel y HTML', mimes == MIME_ESPERADOS,
           f'{len(mimes)} tipos' + ('' if mimes == MIME_ESPERADOS
                                    else f' · sobra/falta: {mimes ^ MIME_ESPERADOS}'))

    # ── La prueba al reves: subir y tratar de bajarlo SIN credenciales ──────
    contenido = b'%PDF-1.4 prueba de acceso publico\n'
    st, _ = pide('POST', f'/storage/v1/object/{BUCKET}/{PRUEBA}',
                 contenido, 'application/pdf')
    if st not in (200, 201):
        print(f'  no se pudo subir el archivo de prueba ({st}); no se puede probar el acceso')
        return 1
    try:
        stPub, _ = pide('GET', f'/storage/v1/object/public/{BUCKET}/{PRUEBA}', con_llave=False)
        prueba('bajarlo SIN sesion por la ruta publica se rechaza',
               stPub in (400, 401, 403, 404), f'HTTP {stPub}')
        stSin, _ = pide('GET', f'/storage/v1/object/{BUCKET}/{PRUEBA}', con_llave=False)
        prueba('bajarlo SIN llave por la ruta autenticada se rechaza',
               stSin in (400, 401, 403, 404), f'HTTP {stSin}')
        stCon, dato = pide('GET', f'/storage/v1/object/{BUCKET}/{PRUEBA}')
        prueba('CON la llave de servicio si se puede leer',
               stCon == 200 and dato == contenido, f'HTTP {stCon}')
    finally:
        stDel, _ = pide('DELETE', f'/storage/v1/object/{BUCKET}/{PRUEBA}')
        print(f'\n  archivo de prueba borrado (HTTP {stDel})')

    print()
    if fallas:
        print(f'  {len(fallas)} FALLAS: ' + ' | '.join(fallas))
        return 1
    print('  el bucket esta cerrado correctamente')
    return 0


if __name__ == '__main__':
    sys.exit(main())
