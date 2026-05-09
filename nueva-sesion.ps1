# nueva-sesion.ps1
# Ejecutar al inicio de cada sesión de trabajo:
# .\nueva-sesion.ps1 -rama "feature/nombre"

param(
    [Parameter(Mandatory=$true)]
    [string]$rama
)

$dir = "D:\Projects\callpicker-cs"
Set-Location $dir

Write-Host "`n🔄 Actualizando main..." -ForegroundColor Cyan
git checkout main
git pull origin main

Write-Host "`n🌿 Creando rama: $rama" -ForegroundColor Green
git checkout -b $rama

Write-Host "`n✅ Listo. Trabajando en: $rama" -ForegroundColor Green
Write-Host "   Al terminar ejecuta: git push origin $rama" -ForegroundColor Yellow
Write-Host "   Luego abre el PR en: https://github.com/ATLASManning/callpicker-cs/compare/main...$rama`n" -ForegroundColor Yellow
