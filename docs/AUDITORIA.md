# Auditoría del Prompt Master v2, verificada

> Fase 0. Cada afirmación del Prompt Master, medida contra el código y contra
> los datos. **68 afirmaciones verificadas · 52 se sostienen · 1 se cayó · 14
> imprecisas, ya arregladas o no comprobables · 7 hallazgos que el prompt no
> vio.**

## Cómo se verificó

`python scripts/foto-auditoria.py` toma **una** foto de Supabase (222 filas de
`cuentas`), de `/api/alertas/veredictos` (192), de `/api/alertas`, de
`adopcion_producto` (560), `seguimientos` (448) y `reuniones` (89), de una
sola pasada y con su sello. Todo lo que se afirma aquí se midió contra esa
foto —sello `2026-10-09T18:20:57`, commit `d213e1f`— para que ninguna
diferencia sea del reloj.

Siete auditores con lentes ciegas entre sí. Cada veredicto fuerte pasó después
por un escéptico obligado a tumbarlo; uno cayó.

`actividades_sac` devuelve **404**: la tabla no existe. El generador se retiró
el 8 oct 2026 por instrucción de dirección.

---

## La causa raíz que explica la mitad del prompt

**El `health_score` no mide salud: mide captura.**

Correlación de `health_score` contra las señales del negocio, 192 cuentas
(Pearson / Spearman):

| contra | r | lo esperable |
|---|---|---|
| **`fuentes`** (cuántas de las 8 existen) | **+0.348** | ninguna |
| `perdidas` | +0.215 | negativa |
| `contactos` | +0.138 | positiva ✓ |
| **`fallas`** | **+0.121** | **negativa** |
| **`tickets`** | **+0.098** | **negativa** |
| `relacionPct` | +0.060 | positiva ✓ |
| `consumoPct` | +0.040 | positiva ✓ |

Su correlato más fuerte es **cuántos datos tenemos de la cuenta**, el triple
que cualquier señal operativa. Y los dos que deberían ser negativos —fallas y
tickets— son **positivos**: más incidencias, mejor score.

El motivo está en el esquema: los cuatro bloques nacen en **50 por `DEFAULT`**
(`schema.sql:33-36`) y nadie los baja. Medido: `score_pago` tiene 93 de 192 en
exactamente 50 y **nunca baja de 50** en ninguna cuenta; `score_actividad`
102 en 50; `score_adopcion` 75; `score_relacional` sólo 24 distintos. **67
cuentas (35%) tienen tres de los cuatro bloques en el valor por omisión.**

De ahí salen el rango 43–84, las cero cuentas bajo 40, INBROTEK como «la más
saludable» sin un solo dato de contacto y BATTERY MART con 46 tickets en 45.
**No es el motor de riesgo el que falla: es el score con el que el tablero lo
contradice.**

---

## 3.1 · Los cinco universos — CONFIRMADO

No son cinco interpretaciones. Son cinco consultas distintas en la misma
pantalla:

| Bloque | De dónde | n | Importe |
|---|---|---|---|
| «Cartera completa» | motor de veredictos, GRC por CID | 192 | **$2,220,416** |
| «Indicadores · Cartera total» | `getKPIs` | 192 | **$1,884,241** |
| «Semáforo por asesor» | `getSemaforoByAsesor`, Zoho por nombre | 192 | tercera cifra |
| «Salud promedio por asesor» | la tabla entera, sin filtrar estado | **222** | — |
| «Métricas · Resumen operativo» | sólo `estado = 'activo'` | **131** | — |

Reparto real de `cuentas`: activo 131 · en_riesgo 61 · hibernación 21 ·
cancelado 9 = **222**. Las «192 cuentas activas» que rotula el tablero son
131 activas + 61 en riesgo: **el rótulo también es falso.**

### La causa, y no es la que dice el prompt

El prompt atribuye los $336,175 a GRUPO TORRES CORZO. **Falso.** Son **155
cuentas** donde el GRC discrepa de la columna, encabezadas por IMPAS Municipio
Chihuahua ($65,640 contra **$0** en la columna), Tech People (+$27,314) y FCA
Stellantis (+$25,313). La suma de las 155 diferencias es $336,175 exacto.

**El fallo es silencioso y está localizado.** `getKPIs` sí llama a
`resolverImportes` ([lib/supabase.ts:300](lib/supabase.ts:300)) — pero su
`select` de la línea 287 **no pide `cid`**, y el GRC cruza por CID. Como `cid`
es opcional en el genérico de `resolverImportes`, compila; como la llamada va
en un `try/catch` mudo, un fallo tampoco avisaría. `importeDeCuenta` devuelve
`origen: 'cuentas'` para las 192 y no sustituye ninguna: **un no-op completo.**

El propio docstring de `lib/facturacion-cuenta.ts:168` dice «la cartera pasa
de $1,884,241 a $2,220,416». El KPI quedó congelado en el lado viejo de su
propio arreglo, **al centavo**.

`getSemaforoByAsesor` ni siquiera lo llama: usa `enrichCuentasWithZoho`, la
búsqueda difusa por nombre que la cabecera de `facturacion-cuenta.ts` declara
eliminada. **Las tres reglas de importe que ese archivo dice haber unificado
siguen vivas.**

---

## 3.2 · Las etiquetas no corresponden — CONFIRMADO, las cuatro

- **«Cuentas críticas · HS < 40: 29»** — ninguna de las 192 baja de 40. La
  tabla no lista `HS<40`: lista las marcadas por el motor de alertas, con HS
  de **43 a 72**. Nueve tienen HS ≥ 60, o sea que la misma página las pinta
  «Estable» y las mete bajo «Crítica». La peor fila del tablero es un HS 72
  rotulado riesgo alto. *Causa: el 6 oct se cambió la fuente del riesgo en
  `app/page.tsx:1030` y el título de `DashMetricasSection.tsx:186` se quedó
  con el criterio viejo.*
- **«En riesgo: 42 · $464,007» con la distribución en 0** — medido: 40 cuentas
  / $462,792. Son dos definiciones de «En Riesgo» en la misma pantalla, y la
  que ocupa más superficie —`getSemaforo(health_score)`— **tiene el tramo
  naranja/rojo inalcanzable** porque el mínimo de HS es 43.
- **«Oportunidades 157 de 192» con 0/0/1 por asesor** — las dos mitades
  ciertas. 157 tienen `candidaturasTotal > 0`, pero **71 de esas 157 (45%) no
  tienen ninguna candidatura de crecimiento**: su única candidatura es
  estabilizar o reactivar. Y el tacómetro muestra otra cosa: `upsellCount`
  sobre la columna de captura manual, que vale 1 · 0 · 0. *Existe
  `CRECIMIENTO` en `alertas-estado.ts:75` justo para esto y la portada no lo
  reutiliza.*
- **«Saludables 56 (29%)»** — el KPI suma `HS ≥ 60`, que son dos bandas
  (Saludable 1 + Estable 55) bajo el nombre de una.
- **Dos nomenclaturas de semáforo** — confirmado, y son **tres** juegos de
  cortes: `getSemaforo` en `lib/types.ts`, los de `getSemaforoByAsesor`
  (`≥80 / ≥60 / ≥40 / ≥20`) y `hsColor` en `DashMetricasSection.tsx` (`<30`,
  `<40`), que deja las 28 filas de su panel rojo todas en amarillo.

---

## 3.3 y 3.4 · El score y los rankings — CONFIRMADO

Rango 43–84, media 55.4, mediana 53. Bandas: amarillo 136 (70.8%) · azul 55
(28.6%) · verde 1 (0.5%) · naranja 0 · rojo 0. **Sólo 36 valores distintos en
192 cuentas.**

- **INBROTEK SERVICIOS**: HS 79, el más alto de Fátima, con
  `contacto_nombre`, `contacto_tel`, `contacto_email` y `giro` **los cuatro
  null**. Su 79 sale de `score_pago` en 100 y `score_relacional` en el 50 por
  omisión.
- **BATTERY MART**: 46 tickets, 3 fallas, HS 45 — y la causa es peor que la
  denuncia: act 50, adop 50, pago 50, **los tres en el valor por omisión**.
  **No existe ninguna ruta de código de tickets o fallas a `health_score`**:
  ni en el GENERATED de Postgres, ni en `lib/health-score.ts`, ni en ningún
  escritor de `score_actividad`.
- **GRUPO TORRES CORZO**: $316,541 = **14.26%** de la cartera viva (el 14.3%
  del prompt es correcto). 16 fallas sobre 193 tickets. **Rank 20 de 192** por
  HS ascendente, fuera del top 10. Los 155 días de SLA no se pudieron
  verificar: vienen del corte de la mesa de ayuda, que no está en la foto.
- **Tech People**: $86,737, 7 fallas sobre 31 tickets, consumo `null`,
  `diasSinContacto` `null`. Su HS 51 sale otra vez de tres bloques por omisión
  más **un relacional de 57, por encima de la media, en una cuenta con cero
  contactos y cero reuniones**.
- **El top 10 en riesgo** ordena sólo por HS ascendente, sin desempate. El piso
  real es **$99** (Gigacable), más bajo que los $2K denunciados. Con 36
  valores distintos en 192 cuentas, **seis de las diez plazas se deciden con
  el mismo 44** y el corte lo resuelve el orden de llegada del arreglo.

---

## 3.5 y 3.6 · Doble conteo y las dos definiciones de contacto — CONFIRMADO

**Candidaturas:** 264 emitidas sobre 192 cuentas (0→35, 1→88, 2→43, 3→16,
4→8, 5→2). Sumando el MRR una vez por candidatura: **$3,454,125, el 1.56× de
la cartera**. Contado una vez por cuenta: 157 cuentas, $1,815,784. El prompt
decía 238/$2,856,898 — **la violación es mayor de lo que creía**. No hay orden
de precedencia hoy.

**Contacto:** los tres ejemplos del prompt coinciden **al día** — S&G
LOCALIZACION 50 vs 67, EBAC Educación 37 vs 87, CH Desarrollos 62 vs 64. Y hay
más: **50 cuentas tienen fecha en `ultimo_contacto` y el veredicto dice «nunca
contactada»**. 33 difieren en más de dos días. Las pantallas que leen la
columna afirman que se habló con 50 clientes con los que nadie ha hablado.

---

## 3.7 y 3.8 · Los huecos — CONFIRMADO, con matices que importan

- **«148 cuentas con más de 30 días sin contacto»** — 148 exacto, pero **101
  de esas 148 (68%) tienen `diasSinContacto === null`**: no es «más de 30
  días», es **no medido**. Las que de verdad miden más de 30 son **47**. El
  filtro suma el hueco al mismo cubo que el plazo vencido.
- **«101 nunca contactadas»** — exacto, y publicado **dos veces en la misma
  página** con dos etiquetas distintas. Al menos 3 son falsas: CASA Galván,
  MILENIUM CONSTRUCASA y RANCH MART salen como «nunca» mientras su propia
  tarjeta imprime fecha y días.
- **«Sin contacto» significa TRES cosas** en la misma pantalla: las 7 sin
  `contacto_nombre` (captura), las 101 sin evento real (relación) y la columna
  de la tabla de alertas.
- **Completitud 93% contra 83% en alerta** — confirmado, y son **tres
  catálogos de «campo obligatorio» coexistiendo**: `profilePct` (5 campos,
  escrito en línea), `CRITICAL_FIELDS` (3) y `faltantesDeFicha` (8).
  `lib/data-gaps.ts` dice que se unificaron dos definiciones en ago 2026;
  estas tres quedaron fuera.
- **El 83% lo produce sobre todo UN campo**: «Mapa de decisores» marca 122 de
  192 porque exige ≥2 contactos y nadie los ha capturado.
- **NPS**: falta en las **222**, no en las 192.
- **Las cinco fuentes con hueco**: las cinco cifras exactas (Auditoría
  162/$1,776,883 · Reuniones 173/$1,664,127 · Consumo 49/$824,698 · Contacto
  101/$798,883 · Llamadas 49/$702,198). El prompt cita cinco de **ocho** filas
  y transcribe «$1.78M» donde la pantalla dice «**≥** $1.78M».
- **IA Chat 0%** — el 0% está en pantalla y **no significa cero adopción**:
  `ADOPT_FEATURES` busca el producto `'IA de Chat'` y en las 560 filas de
  `adopcion_producto` ese nombre **no existe**. Es un cero sin medición sobre
  un nombre que no casa con el catálogo.
- **«Dan 40% contra Fátima 100%» en Chat** — exacto al dígito y **sin
  denominador**: son 5 cuentas de 68 contra 5 de 63. Es la diferencia entre
  2 de 5 y 0 de 5, presentada como tasa de cartera.
- **10 cuentas sin importe** — exactas, y las 10 caen en `no_la_vemos` pero
  **no por el importe**: por la rama de llamadas. De las ocho fuentes,
  facturación es la única que se mide, se publica y **no dispara nada**.

---

## 2-BIS.2 · Polak Grupo — el prompt tiene la polaridad invertida

Seis de las nueve contradicciones se confirman. Dos correcciones de fondo:

**«CUENTA PERDIDA» no es el error de esa ficha: es lo único cierto que hay en
ella.** El expediente `app/auditoria/polak-grupo-data.ts` (v2.1, 10-sep-2026)
dice **BAJA CONFIRMADA**, contrato ya firmado con Zoom Phone, migración en 1–2
meses, ventana de retención cero, y causa raíz **interna de Callpicker**
(descontinuación de Legacy, ~4 meses de llamadas caídas). Treinta días
después, `cuentas.estado` sigue en `'activo'`, el tablero la cuenta como
cartera viva, la pinta amarilla y le dice al asesor «pedir el Excel de
llamadas». **El motor no lee ni el `estado` ni una palabra del expediente**:
lo único que toma es el booleano `tieneAuditoria`.

**«MRR $1,345,140» es lo más grave de las nueve, y ya tiene origen.** Es el
**importe acumulado recurrente de la vida del contrato** (56 meses), rotulado
«MRR». Está exacto en la fila del GRC. La etiqueta se heredó del nombre de la
columna del reporte, no del concepto.

**El 73% «Sólido» reproducido al decimal**: 21.37 seguimientos + 25.00
actividades + 12 reuniones + **0 contactos** + 10 auditoría + 5 ficha = 73.37.
Pasa el umbral de «Sólido» por 3.37 puntos, y **47 de esos 73 puntos se pueden
llenar sin hablar con nadie del cliente**. El índice suma seis bloques y
declara «Sólido» sin exigir mínimo en ninguno.

---

## Lo que el prompt no vio

1. **El bug de la columna que falta es una CLASE, no un caso.**
   `importeDeCuenta` necesita `cid` **y** `facturacion`; si falta cualquiera,
   no lanza: devuelve `origen: 'cuentas'` y no sustituye nada.
   `lib/prediccion/snapshot.ts:168` documenta **el mismo bug desde el otro
   lado** —«`facturacion` NO estaba en este select y costaba caro… el respaldo
   no disparaba nunca y DIECIOCHO cuentas…»—. Se arregló el caso, no la clase.

2. **«Distribución General» se contradice dentro de su propia tarjeta.**
   Arriba imprime «En Riesgo 0 (0%)»; abajo, en el mismo recuadro, «Claudia ·
   61 cuentas · **$204,982 en riesgo**». Dos definiciones a cuatro líneas de
   distancia.

3. **El umbral muerto `health_score < 40` sigue vivo en `/seguimiento`.** El
   Dashboard lo arregló el 6 oct; `app/seguimiento/page.tsx:627` no. La
   pastilla «$X en riesgo» no se renderiza nunca para ninguna de las tres.

4. **Un `??` pinta 13 fichas en rojo contra su propio dato.**
   `lib/estado-cuenta.ts:152` usa un *fallback* donde hacía falta un *máximo*:
   si la cuenta tiene un seguimiento, descarta la columna entera aunque traiga
   fecha más nueva. En 22 de 192 la columna es más nueva (brecha mediana 16
   días, máxima **79**), y en 13 de ésas el banner pasa el límite de 60 y
   marca grave.

5. **El centinela `'0'` de Zoho: el mismo campo contado como presente Y
   ausente en la misma página.** `alertas-estado.ts:285` acepta la cadena
   `'0'` como ficha documentada (es truthy); `candidatos-cartera.ts:89` la
   rechaza. 19 cuentas y $152,614 en medio.

6. **La nota del KAM que avisa del abandono SUBE el puntaje de relación.**
   `lib/relacionamiento.ts:193` suma +3 por «ficha documentada» comprobando
   sólo que `observaciones_kam` no esté vacío — nunca lee el contenido. El de
   Polak Grupo dice literalmente *«No me atiende llamada, correo ni whatsapp
   desde junio 2026»*. **La prueba de que el cliente dejó de contestar entra
   al cálculo como evidencia de relación.**

7. **Los 12 importes del prompt coinciden todos con el MRR del motor**, lo que
   confirma que miró la pantalla correcta — y hace más grave que 155 de 192
   filas muestren otro número en los demás bloques.

---

## §15 · Los doce casos semilla, uno por uno

Los doce existen y **los doce MRR coinciden** con el motor — el prompt miró la
pantalla correcta. Pero cuatro traen evidencia equivocada, y usarlos de
fixture sin corregirlos haría nacer las pruebas contra datos falsos.

| Caso | Evidencia | Estado hoy vs. esperado |
|---|---|---|
| **F3 Sección Amarilla** | todo exacto al dígito | `no_la_vemos` ✓ coincide |
| **F12 Justo** | 0.0% es un cero **medido** (2 de 5 meses) ✓ | `apagandose` ✓ coincide |
| **Z25 99 minutos** | sin importe ✓, 1 de 8 fuentes | `no_la_vemos` ✓ coincide |
| **D1 TORRES CORZO** | exacta: folio 106428, 155 d de SLA, 156 sin mover, 16 fallas, 0 contactos | ✗ **rank 16 de 142** |
| **C66 INBROTEK** | exacta: los nueve campos de ficha en null, HS 79 | ✗ sigue siendo la más saludable |
| **F5 Polak Grupo** | exacta en los seis puntos | ✗ ver abajo |
| **C2 ECODELI** | 84 d ✓, HS 47 ✓ | el rojo **no se puede afirmar**: `consumoPct` null |
| **C1 Tech People** | evidencia ✓, el HS que cita está mal | — |
| **C35 Blueservices** | 88 d ✓; el consumo es **0.5%**, no 1.1% | el «−57% contra su media» es aritmética sobre ruido: nunca pasó del 2% |
| **D7 Jason de México** | HS 44 ✓; consumo **0.904%**, no 0.6% | ya es `se_va`/ROJO, pero por **baja declarada por escrito**, no por downgrade |
| **F40 BATTERY MART** | 46 tickets ✓, 3 fallas ✓ | «Incidencia abierta» no es afirmable sin el export de la mesa |
| **C3 Gas Económico** | **«0.0% de la bolsa» es FALSO** | `consumoPct` = `null`, 0 de 5 meses |

**El caso de Gas Económico merece subrayarse**: el prompt escribe «0.0% de la
bolsa» donde el dato es **no medible**. Es exactamente el error que este
proyecto tiene prohibido —un cero sin medición— cometido dentro de la
auditoría que viene a corregirlo. La cuenta no consume cero: no se sabe lo que
consume.

**Y la prueba obligatoria «TORRES CORZO está en el top 3» falla hoy**: va en
el lugar **16 de 142** cuentas con alerta. El top 3 actual es Tech People,
Sección Amarilla e IMPAS Municipio Chihuahua. La cuenta de $316,541 —el 14.26%
de la cartera, con un ticket escalado 155 días— no entra.

## Lo que ya estaba arreglado

- El cero sin medición de la tabla de fuentes: la fila de Facturación decía
  «10 sin dato · $0» y hoy dice «sin medir» (`7fa1bfa`).
- El corte de candidatura del módulo de gráficas ya declara que no es una
  partición y cierra con su cubo «otros» (`2efced3`).
- «MRR y número de cuentas idénticos en todos los bloques» del §15 es la
  prueba que el propio arreglo del 6 oct documenta; sigue sin cumplirse fuera
  del motor.

## Lo que no se pudo verificar

Los **155 días de SLA** de Torres Corzo y las cifras de la mesa de ayuda: el
corte de tickets no está entre las fuentes de la foto. Hace falta el export de
la mesa para cerrarlo.
