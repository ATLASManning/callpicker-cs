# Recalcula el libro con el motor real de Excel y audita cada formula.
#
# recalc.py del skill usa sockets Unix y no corre en Windows. Excel COM si, y
# es mejor prueba: evalua con el mismo motor que usara quien abra el archivo.
#
# ASCII puro a proposito: Windows PowerShell 5.1 lee los .ps1 como ANSI y un
# guion largo o un acento rompen el parser.

$ruta = "D:\Proyectos\CP\Reporte_Clientes_AAA_AA_A_Crecimiento_2026-09-17_V4.xlsx"
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false
$errores = 0

try {
    $wb = $xl.Workbooks.Open($ruta)
    $xl.CalculateFullRebuild()

    Write-Output "=== FORMULAS EN ERROR ==="
    foreach ($ws in $wb.Worksheets) {
        $rango = $null
        try { $rango = $ws.UsedRange.SpecialCells(-4123) } catch { }
        if ($null -eq $rango) { continue }
        $malas = 0
        foreach ($c in $rango) {
            $v = $c.Text
            if ($v -match '^#(REF|NAME|VALUE|DIV/0|N/A|NUM|NULL)') {
                if ($malas -lt 5) { Write-Output ("  {0}!{1}  {2}  <- {3}" -f $ws.Name, $c.Address(0,0), $v, $c.Formula) }
                $malas++
            }
        }
        Write-Output ("  {0,-22} {1,5} formulas . {2} en error" -f $ws.Name, $rango.Count, $malas)
        $errores += $malas
    }

    Write-Output ""
    Write-Output "=== LECTURA EJECUTIVA (los indicadores que antes daban 0) ==="
    $le = $wb.Worksheets.Item("Lectura ejecutiva")
    foreach ($r in 6..19) {
        $et = $le.Cells.Item($r, 2).Text
        $vl = $le.Cells.Item($r, 3).Text
        if ($et) { Write-Output ("  {0,-46} {1}" -f $et, $vl) }
    }

    Write-Output ""
    Write-Output "=== DASHBOARD con el filtro en Todos ==="
    $d = $wb.Worksheets.Item("Dashboard")
    foreach ($r in 11..15) {
        Write-Output ("  {0,-30} {1}" -f $d.Cells.Item($r,2).Text, $d.Cells.Item($r,3).Text)
    }
    Write-Output "  --- primeras filas de la tabla ---"
    foreach ($r in 21..25) {
        Write-Output ("   {0,-30} {1,-32} {2,-9} {3,10} {4,8} {5,5}" -f `
            $d.Cells.Item($r,2).Text, $d.Cells.Item($r,3).Text, $d.Cells.Item($r,5).Text, `
            $d.Cells.Item($r,6).Text, $d.Cells.Item($r,7).Text, $d.Cells.Item($r,9).Text)
    }

    Write-Output ""
    Write-Output "=== PRUEBA DEL FILTRO ==="
    foreach ($opcion in @("SI", "NO")) {
        $d.Cells.Item(5,3).Value2 = $opcion
        $xl.CalculateFullRebuild()
        Write-Output ("  Candidato = {0,-6} cuentas {1,5}   facturacion {2,12}   primera: {3}" -f `
            $opcion, $d.Cells.Item(11,3).Text, $d.Cells.Item(12,3).Text, $d.Cells.Item(21,2).Text)
    }
    $d.Cells.Item(5,3).Value2 = "Todos"
    $xl.CalculateFullRebuild()

    $wb.Save()
    $wb.Close($true)
    Write-Output ""
    if ($errores -eq 0) {
        Write-Output "RESULTADO: 0 formulas en error. Libro guardado con sus valores calculados."
    } else {
        Write-Output ("RESULTADO: {0} formulas en error. REVISAR antes de entregar." -f $errores)
    }
}
finally {
    $xl.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl)
    [GC]::Collect()
}
