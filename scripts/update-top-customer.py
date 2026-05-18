"""
update-top-customer.py
======================
Lee el Concentrado del Excel Top Customer y actualiza los registros en Supabase:
  - Enriquece campos de perfil (contacto, giro, servicio, dirección, etc.)
  - Asigna el consecutivo Top Customer (F1, F2... D1, D2... C1, C2...)
  - Remueve el tag [FALTA_TC] de notas cuando el perfil queda completo

Uso:
  python scripts/update-top-customer.py "E:/Archivos/Escritorio/Top Customer.xlsx"

Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
"""

import pandas as pd
import requests
import json
import math
import os
import sys
import re
from datetime import datetime

# ── Config ───────────────────────────────────────────────────────────────────
EXCEL_PATH = sys.argv[1] if len(sys.argv) > 1 else r"E:\Archivos\Escritorio\Top Customer.xlsx"
ENV_PATH   = os.path.join(os.path.dirname(__file__), '..', '.env.local')

# ── Leer .env.local ──────────────────────────────────────────────────────────
def load_env(path):
    env = {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    except FileNotFoundError:
        print(f"ERROR: No se encontró {path}")
        sys.exit(1)
    return env

env = load_env(ENV_PATH)
SUPABASE_URL     = env.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_SERVICE = env.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL or not SUPABASE_SERVICE:
    print("ERROR: Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
    sys.exit(1)

HEADERS = {
    'apikey': SUPABASE_SERVICE,
    'Authorization': f'Bearer {SUPABASE_SERVICE}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}

# ── Helpers ──────────────────────────────────────────────────────────────────
def clean(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    s = str(val).strip()
    return s if s and s != '0' and s.lower() != 'nan' else None

def clean_date(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    try:
        if isinstance(val, pd.Timestamp):
            return val.strftime('%Y-%m-%d')
        return str(val)[:10]
    except Exception:
        return None

def supabase_get_by_cid(cid_str):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/cuentas",
        headers={**HEADERS, 'Prefer': 'return=representation'},
        params={'cid': f'eq.{cid_str}', 'select': 'id,cid,empresa,consecutivo,notas,observaciones_kam'}
    )
    if r.status_code == 200:
        data = r.json()
        return data[0] if data else None
    return None

def supabase_update(id_val, payload):
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/cuentas",
        headers=HEADERS,
        params={'id': f'eq.{id_val}'},
        data=json.dumps(payload)
    )
    return r.status_code in (200, 204)

# ── Leer Excel ───────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"Top Customer Migration — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Excel: {EXCEL_PATH}")
print('='*60)

try:
    conc = pd.read_excel(EXCEL_PATH, sheet_name='Concentrado')
    print(f"Concentrado: {len(conc)} filas cargadas")
except Exception as e:
    print(f"ERROR leyendo Excel: {e}")
    sys.exit(1)

# ── Procesar cada fila ────────────────────────────────────────────────────────
ok = 0
skip_no_cid = 0
skip_no_match = 0
errors = []

for idx, row in conc.iterrows():
    cid_raw = row.get('CID')
    ficha   = clean(row.get('FICHA UX'))

    # Saltar filas sin CID válido
    if cid_raw is None or (isinstance(cid_raw, float) and math.isnan(cid_raw)):
        skip_no_cid += 1
        continue
    cid_val = str(int(cid_raw)) if isinstance(cid_raw, float) else str(cid_raw).strip()
    if cid_val in ('', '0'):
        skip_no_cid += 1
        continue

    # Buscar en Supabase
    cuenta = supabase_get_by_cid(cid_val)
    if not cuenta:
        skip_no_match += 1
        print(f"  [NO MATCH] CID {cid_val} — {clean(row.get('NOMBRE CLIENTE'))}")
        continue

    cuenta_id   = cuenta['id']
    notas_actual = cuenta.get('notas') or ''

    # Remover [FALTA_TC] si existe
    notas_nueva = notas_actual.replace('[FALTA_TC]', '').strip()
    notas_nueva = re.sub(r'\s+', ' ', notas_nueva).strip()

    # Construir payload con los campos disponibles
    payload = {}

    if ficha:
        payload['consecutivo'] = ficha

    tel_oficina = clean(row.get('TELEFONO OFICINA'))
    tel_celular = clean(row.get('TELEFONO CELULAR'))
    tel_final   = tel_oficina or tel_celular

    campos = {
        'contacto_nombre':  clean(row.get('NOMBRE DEL CONTACTO')),
        'contacto_cargo':   clean(row.get('CARGO')),
        'contacto_tel':     tel_final,
        'giro':             clean(row.get('ACTIVIDAD O GIRO')),
        'tamano_empresa':   clean(row.get('TAMAÑO EMPRESA')),
        'total_empleados':  clean(row.get('TOTAL DE EMPLEADOS')),
        'num_oficinas':     clean(row.get('CUANTAS OFICINAS TIENE')),
        'direccion_fiscal': clean(row.get('DIRECCIÓN FISCAL')),
        'pagina_web':       clean(row.get('PAGINA WEB')),
        'zoho_link':        clean(row.get('LINK ZOHO')),
        'grupo_empresarial':clean(row.get('NOMBRE DEL GRUPO')),
        'servicio':         clean(row.get('NOMBRE DE SERVICIO')),
        'activo_desde':     clean_date(row.get('CUENTA ACTIVA DESDE')),
        'observaciones_kam':clean(row.get('OBSERVACIONES')),
    }
    for k, v in campos.items():
        if v is not None:
            payload[k] = v

    payload['notas'] = notas_nueva
    payload['updated_at'] = datetime.utcnow().isoformat()

    empresa = clean(row.get('NOMBRE CLIENTE')) or cuenta.get('empresa', '')
    if supabase_update(cuenta_id, payload):
        tag_removed = '[FALTA_TC]' in notas_actual
        print(f"  [OK] CID {cid_val} | {ficha or '?':4s} | {empresa[:35]:<35} {'✓ FALTA_TC removido' if tag_removed else ''}")
        ok += 1
    else:
        msg = f"  [ERROR] CID {cid_val} — {empresa}"
        print(msg)
        errors.append(msg)

# ── Resumen ───────────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"RESUMEN:")
print(f"  Actualizados:     {ok}")
print(f"  Sin CID válido:   {skip_no_cid}")
print(f"  Sin match en DB:  {skip_no_match}")
print(f"  Errores:          {len(errors)}")
print('='*60)
if errors:
    print("Errores detalle:")
    for e in errors:
        print(f"  {e}")
