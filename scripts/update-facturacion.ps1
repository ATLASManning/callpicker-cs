# ============================================================
#  update-facturacion.ps1
#  Ejecutado automáticamente los días 15 y 30 de cada mes.
#  1. Convierte el Excel de OneDrive → JSON con Python
#  2. Hace git commit + push → Vercel redeploya automáticamente
# ============================================================

$PYTHON  = "C:\Users\manni\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$SCRIPT  = "D:\Projects\callpicker-cs\scripts\update-facturacion.py"
$REPO    = "D:\Projects\callpicker-cs"
$LOG     = "D:\Projects\callpicker-cs\scripts\update-facturacion.log"

function Write-Log {
    param([string]$Msg)
    $ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Msg"
    Write-Output $line
    Add-Content -Path $LOG -Value $line -Encoding UTF8
}

Write-Log "=============================="
Write-Log "PS Wrapper: inicio"

# ── 1. Ejecutar script Python ──────────────────────────────────────────────
Write-Log "Ejecutando script Python…"
$result = & $PYTHON $SCRIPT 2>&1
$exitCode = $LASTEXITCODE

foreach ($line in $result) { Write-Log "  PY: $line" }

if ($exitCode -ne 0) {
    Write-Log "ERROR: El script Python terminó con código $exitCode. Abortando."
    exit 1
}

Write-Log "Python OK — JSON actualizado"

# ── 2. Git: verificar si hay cambios ──────────────────────────────────────
Set-Location $REPO
$changed = git status --porcelain lib/facturacion-data.json

if (-not $changed) {
    Write-Log "Sin cambios en facturacion-data.json — nada que commitear."
    Write-Log "=============================="
    exit 0
}

# ── 3. Git commit + push ───────────────────────────────────────────────────
$fecha = Get-Date -Format "yyyy-MM-dd"

git add lib/facturacion-data.json
if ($LASTEXITCODE -ne 0) { Write-Log "ERROR git add"; exit 1 }

git commit -m "chore: auto-update facturacion-data.json ($fecha)"
if ($LASTEXITCODE -ne 0) { Write-Log "ERROR git commit"; exit 1 }

git push origin master:main
git push origin master
if ($LASTEXITCODE -ne 0) { Write-Log "ERROR git push"; exit 1 }

Write-Log "Git push OK → Vercel redesplegará automáticamente"
Write-Log "Proceso completado exitosamente ✓"
Write-Log "=============================="
