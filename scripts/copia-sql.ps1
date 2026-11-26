<#
.SYNOPSIS
  Deja en el portapapeles el SQL que hay que pegar en el editor de Supabase.

.DESCRIPTION
  Uso:
      .\scripts\copia-sql.ps1 1     # la migracion
      .\scripts\copia-sql.ps1 2     # la verificacion
      .\scripts\copia-sql.ps1 3     # las pruebas al reves
      .\scripts\copia-sql.ps1       # lista los tres y no copia nada

  POR QUE UN SCRIPT Y NO UN COMANDO SUELTO
  ----------------------------------------
  Porque el comando de una linea lleva parentesis y tuberia, y eso no se puede
  teclear a la terminal desde la conversacion. Y porque un comando de PowerShell
  pegado en el editor SQL da 'syntax error at or near "-"' - ya paso: el editor
  no distingue entre una linea de shell y SQL, y el error no dice que te
  equivocaste de ventana.

  TODO ESTE ARCHIVO VA EN ASCII PURO, A PROPOSITO
  -----------------------------------------------
  Windows PowerShell 5.1 lee un .ps1 sin BOM como ANSI, no como UTF-8. La
  primera version llevaba un guion largo y PowerShell lo leyo como tres
  caracteres, uno de ellos una comilla, que abrio una cadena que nunca cerro:
  tres errores de sintaxis seguidos que no mencionaban la codificacion por
  ningun lado. Ni acentos, ni comillas angulares, ni guiones largos aqui dentro.
  Ver [[feedback-verificar-antes-asegurar]].

  Imprime los CARACTERES copiados y la primera linea real del archivo, para que
  se vea de un golpe que copio algo y que copio lo que dice. Un 'listo' a secas
  se lee igual tanto si copio 39,678 caracteres como si copio una cadena vacia.
#>
param(
  [ValidateSet('1', '2', '3')]
  [string] $Paso
)

$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent $PSScriptRoot

$pasos = [ordered] @{
  '1' = @{
    archivo = 'migracion-alertas-sla.sql'
    que     = 'LA MIGRACION. Pegala entera y dale Run. Debe terminar sin error.'
  }
  '2' = @{
    archivo = 'migracion-alertas-sla-verifica.sql'
    que     = 'LA VERIFICACION. Pegala entera. Devuelve 13 renglones, los 13 en ok.'
  }
  '3' = @{
    archivo = 'migracion-alertas-sla-pruebas-al-reves.sql'
    que     = 'LAS PRUEBAS AL REVES. NO se pega entera: un bloque DO a la vez.'
  }
}

if (-not $Paso) {
  Write-Host ''
  Write-Host '  Que copiar, y en que orden:' -ForegroundColor Cyan
  Write-Host ''
  foreach ($k in $pasos.Keys) {
    Write-Host ("    .\scripts\copia-sql.ps1 {0}   {1}" -f $k, $pasos[$k].que)
  }
  Write-Host ''
  Write-Host '  No se copio nada: falta decir el paso.' -ForegroundColor Yellow
  Write-Host ''
  exit 2
}

$archivo = Join-Path $raiz "scripts\$($pasos[$Paso].archivo)"

if (-not (Test-Path -LiteralPath $archivo)) {
  Write-Host ''
  Write-Host "  NO EXISTE: $archivo" -ForegroundColor Red
  Write-Host '  No se copio nada.' -ForegroundColor Red
  Write-Host ''
  exit 1
}

$texto = Get-Content -LiteralPath $archivo -Raw -Encoding UTF8

# Un archivo vacio se copiaria sin quejarse y el editor diria 'success' sin
# haber hecho nada. Eso es peor que un error.
if ([string]::IsNullOrWhiteSpace($texto)) {
  Write-Host ''
  Write-Host "  EL ARCHIVO ESTA VACIO: $archivo" -ForegroundColor Red
  Write-Host '  No se copio nada.' -ForegroundColor Red
  Write-Host ''
  exit 1
}

Set-Clipboard -Value $texto

$primera = ($texto -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
$corte = [Math]::Min(60, $primera.Length)

Write-Host ''
Write-Host ("  PASO {0} - {1}" -f $Paso, $pasos[$Paso].archivo) -ForegroundColor Cyan
Write-Host ("  {0:N0} caracteres en el portapapeles." -f $texto.Length) -ForegroundColor Green
Write-Host ("  Empieza por: {0}" -f $primera.Substring(0, $corte))
Write-Host ''
Write-Host ("  {0}" -f $pasos[$Paso].que) -ForegroundColor Yellow
Write-Host '  Ahora: Ctrl+V en el editor SQL de Supabase.'
Write-Host ''
