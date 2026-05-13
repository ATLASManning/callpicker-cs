"""
update-facturacion.py
=====================
Lee el Excel de Corte de Facturación desde OneDrive, normaliza los datos
y sobreescribe lib/facturacion-data.json en el repositorio.

Ejecutado automáticamente por update-facturacion.ps1 los días 15 y 30.

CÓMO FUNCIONA LA BÚSQUEDA DEL ARCHIVO:
  1. Ruta exacta configurada en EXCEL_PATHS
  2. Búsqueda por patrón "Corte*factur*.xlsx" en los directorios de búsqueda
  3. Si no se encuentra → el script falla con un mensaje claro en el log
"""

import pandas as pd
import json
import math
import os
import shutil
import sys
import glob
from datetime import datetime

# ── Rutas de búsqueda del Excel (en orden de preferencia) ─────────────────
EXCEL_EXACT_PATHS = [
    r"C:\Users\manni\OneDrive\Escritorio\Corte de facturación.xlsx",
    r"C:\Users\manni\OneDrive\Escritorio\Corte de facturacion.xlsx",
    r"C:\Users\manni\Desktop\Corte de facturación.xlsx",
    r"C:\Users\manni\Desktop\Corte de facturacion.xlsx",
]

# Directorios donde buscar por patrón si la ruta exacta no existe
SEARCH_DIRS = [
    r"C:\Users\manni\OneDrive\Escritorio",
    r"C:\Users\manni\Desktop",
    r"C:\Users\manni\OneDrive",
    r"D:\Projects\callpicker-cs",
]
SEARCH_PATTERN = "*orte*actur*.xlsx"

# ── Rutas de salida ────────────────────────────────────────────────────────
EXCEL_TMP  = r"D:\Projects\callpicker-cs\Corte_tmp_auto.xlsx"
JSON_OUT   = r"D:\Projects\callpicker-cs\lib\facturacion-data.json"
LOG_FILE   = r"D:\Projects\callpicker-cs\scripts\update-facturacion.log"

# ── Columnas numéricas ─────────────────────────────────────────────────────
NUM_COLS = [
    "Minutos Incluidos", "Minutos Consumidos", "Monto del plan",
    "% Consumo", "Toggle Status", "Menú Configuracion", "Reportes",
    "Call History", "Visit Inbound", "Visit Outbound", "My extension",
    "Total de interacciones", "% Llamadas entrantes", "% Llamadas salientes",
]

# ── Logger ─────────────────────────────────────────────────────────────────
def log(msg: str):
    ts   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

# ── Buscar el Excel ────────────────────────────────────────────────────────
def find_excel() -> str:
    # 1. Rutas exactas
    for path in EXCEL_EXACT_PATHS:
        if os.path.exists(path):
            log(f"  Archivo encontrado (ruta exacta): {path}")
            return path

    # 2. Búsqueda por patrón en directorios configurados
    log("  No encontrado en rutas exactas. Buscando por patrón…")
    matches = []
    for d in SEARCH_DIRS:
        if os.path.isdir(d):
            found = glob.glob(os.path.join(d, SEARCH_PATTERN), recursive=False)
            found += glob.glob(os.path.join(d, "**", SEARCH_PATTERN), recursive=True)
            matches.extend(found)

    if matches:
        # Tomar el más reciente
        matches.sort(key=lambda p: os.path.getmtime(p), reverse=True)
        log(f"  Archivo encontrado por patrón (más reciente): {matches[0]}")
        if len(matches) > 1:
            log(f"  Otros candidatos encontrados: {matches[1:]}")
        return matches[0]

    return ""

# ── Limpieza de valor individual ───────────────────────────────────────────
def clean(val):
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    if hasattr(val, "isoformat"):
        return str(val)[:10]    # YYYY-MM-DD
    if isinstance(val, float):
        return round(val, 2)
    try:
        import numpy as np
        if isinstance(val, np.integer):
            return int(val)
        if isinstance(val, np.floating):
            return None if math.isnan(float(val)) else round(float(val), 2)
    except ImportError:
        pass
    return val

# ── Main ───────────────────────────────────────────────────────────────────
def main():
    log("=" * 60)
    log("Inicio de actualización automática facturacion-data.json")

    # 1. Localizar el Excel
    log("Buscando archivo Excel…")
    excel_src = find_excel()

    if not excel_src:
        log("ERROR: No se encontró ningún archivo Excel de Corte de Facturación.")
        log("  Asegúrate de que el archivo esté en OneDrive\\Escritorio antes del día 15/30.")
        log("  Patrones buscados: " + SEARCH_PATTERN)
        log("  Directorios buscados: " + str(SEARCH_DIRS))
        sys.exit(1)

    # 2. Copiar a ruta temporal (evita bloqueo OneDrive y caracteres especiales)
    log(f"Copiando a temporal: {EXCEL_TMP}")
    shutil.copy2(excel_src, EXCEL_TMP)

    try:
        # 3. Leer Excel
        log("Leyendo Excel con pandas…")
        df = pd.read_excel(EXCEL_TMP, engine="openpyxl")
        log(f"  Filas leídas : {len(df)}")
        log(f"  Columnas     : {list(df.columns)}")

        # 4. Normalizar columnas numéricas
        for col in NUM_COLS:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # 5. Normalizar fecha de corte → YYYY-MM-DD string
        DATE_COL = "Fecha de corte"
        if DATE_COL in df.columns:
            df[DATE_COL] = (
                pd.to_datetime(df[DATE_COL], errors="coerce")
                  .dt.strftime("%Y-%m-%d")
            )

        # 6. Eliminar columnas derivadas si existen
        for drop_col in ["CID/Fecha Corte"]:
            if drop_col in df.columns:
                df.drop(columns=[drop_col], inplace=True)

        # 7. Convertir a lista de dicts limpia
        records = []
        for _, row in df.iterrows():
            records.append({col: clean(row[col]) for col in df.columns})

        log(f"  Registros a exportar: {len(records)}")

        # 8. Escribir JSON
        with open(JSON_OUT, "w", encoding="utf-8") as fh:
            json.dump(records, fh, ensure_ascii=False)

        size_mb = os.path.getsize(JSON_OUT) / 1024 / 1024
        log(f"  JSON escrito: {JSON_OUT} ({size_mb:.2f} MB)")
        log("Actualización completada exitosamente ✓")

    finally:
        if os.path.exists(EXCEL_TMP):
            os.remove(EXCEL_TMP)
            log("Archivo temporal eliminado")

if __name__ == "__main__":
    main()
