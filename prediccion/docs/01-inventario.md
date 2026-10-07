# Fase 1 · Inventario de reconocimiento

**PM-PRED-001 rev B · compuerta G1**
Levantado el 7 de octubre de 2026 · todo en solo lectura
Ningún archivo existente fue modificado. No se escribió código. No se ejecutó
`ALTER`, `UPDATE`, `DELETE` ni `INSERT` contra nada.

---

## 0. Lo que hay que decidir, en una página

El documento supone tres cosas que **no se sostienen**, y una cuarta que
**resultó mejor** de lo que decía. Las cuatro cambian el plan.

| El documento supone | Lo medido |
|---|---|
| «Churn: **verdad de terreno**, eventos de baja con fecha» (§4) | **Ninguna baja tiene fecha.** No existe esa columna entre las 53 de `cuentas`, ni tabla de bajas entre las 29 que expone PostgREST. Hay 30 cuentas no vivas: 21 hibernación y 9 cancelado |
| Que el label de churn del GRC sirve | De las 103 filas marcadas «Churn confirmado», sólo **7 son cotejables por CID y 5 de esas 7 no son bajas** — cuatro siguen en riesgo y una activa |
| «Población primaria: las cuentas TOP según la marca actual del dashboard» (§6.1) | **No hay marca TOP.** Las 192 vivas tienen consecutivo, así que «ficha Top Customer» no distingue a nadie. Dirección resolvió el 7 oct: **las 25 principales de cada asesor** → ver §1.1 |
| Que hace falta empezar a guardar historia desde cero | **La historia ya existe**, fuera de la base: `data/cortes-facturacion.xlsx` es un panel mensual real — 21,567 filas, 2,689 CIDs, **once meses** de 2025-12 a 2026-10, con plan, minutos incluidos y consumidos, monto, visitas al panel y pago exitoso, **por CID y por mes** |

### El hallazgo que desbloquea la misión

No hay columna de fecha de baja, pero **el panel de cortes la fecha solo**. Si
una cuenta deja de aparecer en el panel, ese mes es su baja. Medido contra el
último mes completo (2026-09, porque octubre viene parcial con 113 CIDs y
tomarlo como señal inventaría dos mil bajas):

| Grupo | Con filas en el panel | Siguen al corriente |
|---|---|---|
| Vivas (activo + en riesgo) | 146 | **141 — 97%** |
| Hibernación | 16 | **0 — 0%** |
| Cancelado | 7 | 1 — 14% |

97% contra 4%. El panel separa muertas de vivas limpiamente, así que **la
etiqueta existe y se puede fechar al mes**.

### El veredicto

**La Capa B no es entrenable hoy, y falta poco.** Fechando las 30 bajas por el
panel: 18 tienen tres meses o más de señal previa, 5 tienen menos de tres, y 7
no aparecen nunca en el panel y no se pueden fechar.

> **18 eventos entrenables. El documento (§6.4) pide 30. Faltan 12.**

Y la brecha **se cierra esperando**, no construyendo: el panel acumula un mes
cada mes y las bajas llegan a razón de unas 2.5 por mes. Al ritmo observado, el
umbral de 30 se alcanza alrededor de **marzo de 2027**. Mientras tanto queda
operativa la Capa A, que —y esto es lo importante— **ya está construida**.

---

## 1.1 La población, fijada por dirección el 7 de octubre

**Las 25 principales de cada asesor, por el importe oficial.** Son **75 cuentas
y $1,655,430 — el 74.6% de la cartera**, contra el 47.5% que daba la definición
global que yo había propuesto:

| Asesor | Cuentas | MRR total | Sus 25 | MRR de sus 25 | % de su cartera |
|---|---|---|---|---|---|
| Dan | 68 | $930,849 | 25 | $726,467 | 78% |
| Claudia | 61 | $658,001 | 25 | $482,539 | 73% |
| Fátima | 63 | $631,566 | 25 | $446,423 | 71% |
| **Población** | **192** | **$2,220,416** | **75** | **$1,655,430** | **74.6%** |

Dos cosas a favor de este corte, medidas:

- **Las 25 de mayor MRR global quedan todas dentro** — cero se salen. Es un
  superconjunto estricto del corte que se usa hoy para la prioridad de las
  alertas, así que no contradice nada de lo que ya corre.
- **Cubre parejo a los tres asesores**: 71%, 73% y 78% de su propia cartera. Un
  corte global habría dejado a Fátima y a Claudia casi sin representación, y el
  modelo habría aprendido el sesgo de quién tiene las cuentas grandes.

El dato con el que llega esa población, y es donde aprieta: **83% tiene lectura
de llamadas, 63% tiene algún corte mensual y sólo 37% tiene diez meses o más de
panel.** La cobertura del panel dentro de la población es **peor** que en la
cartera entera (63% contra 76%), y el §5 explica por qué.

---

## 1. La Capa A ya existe: son las Alertas

El documento propone (§6.4) un score determinista de 0 a 100 con seis
dimensiones ponderadas. Casi todo eso está corriendo hoy en
`lib/alertas.ts` + `lib/alertas-detectar.ts`: **18 tipos de alerta en 4
familias**, con severidad, dueño, 11 umbrales explícitos y envejecimiento por
episodio.

| Dimensión que pide §6.4 | Peso | Qué la cubre hoy |
|---|---|---|
| Consumo (% de bolsa y tendencia) | 25% | `consumo_cero`, `sin_consumo_medible` · `lib/plan-minutos.ts` recalcula el % (el del archivo es basura: publica cosas como 3,417,300%) |
| Relación (contacto real, decisor) | 20% | `silencio_60`, `sin_interlocutor` · `lib/contacto-cuenta.ts` es la definición única de contacto |
| Soporte (SLA, fallas, reincidencia) | 20% | familia de soporte · **limitada: el export de Zoho sólo trae cerrados**, así que «abiertos» es no medible |
| Adopción (productos, panel) | 15% | `adopcion_producto` (164/192) + visitas al panel en el archivo de cortes |
| Pago y facturación | 10% | `Pago exitoso` del panel de cortes, mensual |
| Voz del cliente | 10% | `riesgo_escrito` y `baja_declarada` — la capa cualitativa que entró esta semana |

**Recomendación para G1: no construir la Capa A desde cero.** Derivarla del
catálogo que ya corre. Construir un segundo score sobre las mismas señales
produciría dos cifras de riesgo para la misma cuenta, que es exactamente lo que
dirección prohibió. El §SEG-05 ya lo permite: «si necesitas su resultado, lo
**lees**».

Lo que sí falta construir, y es donde está el valor: **el snapshot semanal
fechado** que hoy no existe en ninguna parte y sin el cual la Capa B nunca
llega. `alertas_episodios` ya tiene la forma correcta —613 filas, 186 cuentas,
con `abierto_en` y `condicion_desde`— pero **sólo dos días de vida** y cero
episodios cerrados: lo escribí el 6 de octubre. Es el candidato natural.

---

## 2. Dónde está la historia, fuente por fuente

| Fuente | Profundidad fechada | Cobertura de las 192 vivas |
|---|---|---|
| **`data/cortes-facturacion.xlsx`** | **11 meses por CID y mes** (2025-12 → 2026-10) | 146 (76%) · 90 con 10 meses |
| `seguimientos` | 6 meses (2026-05 → 10) | 136 (71%) |
| `actividades` | 5 meses (2026-06 → 10) | 150 (78%) |
| `adopcion_producto` | 5 meses | 164 (85%) |
| `reuniones` | 8 meses, el rango más largo de la base | 20 (10%) |
| `radar_respuestas` | 3 meses | 51 (27%) |
| `alertas_episodios` | **2 días** | 186 (97%) |
| `health_score_historial` | **8 filas, 8 cuentas, 4 fechas** | 8 (4%) |
| `grc-zoho.json` | 9 meses **sólo a nivel cartera**; por cuenta son agregados de vida, no serie | 174 (91%) |
| Llamadas | 9 meses, corte 14 sep, **cadencia semestral** | 147 (77%) |

**`health_score_historial` es una tabla que alguien creó y nunca se llenó.** Se
escribe sólo cuando alguien edita una cuenta a mano. El Health Score que ve el
tablero es una columna `GENERATED ALWAYS` sobre cuatro sub-scores que se
sobreescriben: no hay forma de saber qué valía el mes pasado.

**Ninguna fuente cubre la cartera completa.** Sólo **12 de 192 cuentas (6.3%)**
tienen las siete fuentes; la mediana es cinco y once cuentas tienen una o dos.
La más atrasada es Callpicker Chat: archivo del 11 de septiembre con dato
cortado al 9 de agosto, contra una cadencia declarada **semanal** — unas ocho
semanas de atraso.

---

## 3. La verdad de terreno, cuenta por cuenta

Las 30 no vivas, fechadas por su último mes en el panel de cortes:

| | Cuentas |
|---|---|
| Fechadas con **≥3 meses** de señal previa → **entrenables** | **18** |
| Fechadas con <3 meses | 5 (Trustworthy, MB Signature, Campus Residencias, Grupo Garmo, Servidiesel) |
| Sin una sola fila en el panel → **no se pueden fechar** | 7 (ZD-Campus Residencias, Zebra Digital, GRUPO HOLTON, GDA-Polab, GVA-República Dominicana, GDA-Genética, TATSA) |

### Sobre los «221 eventos entrenables» del GRC

Una de las vías de reconocimiento encontró que, cruzando los 432 eventos
«Churn confirmado» del GRC contra el panel de cortes, **221 tienen ≥3 meses de
consumo previo** — siete veces el umbral. **No lo recomiendo, y conviene
entender por qué antes de descartarlo.**

1. **El label es mayoritariamente falso.** Medido hoy: de 103 filas marcadas
   «Churn confirmado», 7 son cotejables y 5 no son bajas. El propio generador
   lo documenta sobre un corte anterior con 1,086 filas: 61 de 64 verificables
   seguían activas, el 95%. Zoho marca «Churn confirmado» a **todo contrato que
   todavía no se factura** en el mes en curso, lo que incluye a quien paga tarde.
2. **Es otra población.** De los 428 clientes de esos eventos, apenas ~64 están
   en nuestra cartera. Entrenar ahí modela el churn del libro completo de
   Callpicker, no de las 192 cuentas que gestionamos.
3. **El cruce es por nombre.** 382 de 428 nombres empatan con el archivo de
   cortes, y la tasa de falso empate no se midió. Cruzar por nombre ya mezcló
   cuentas antes, con los DIDs.

Un modelo entrenado sobre un label falso al 70% aprende a predecir el artefacto
de corte de facturación de Zoho, no la salida de un cliente — y lo entrega con
una probabilidad que nadie en la mesa puede refutar.

---

## 4. Cobertura por campo, sobre las 192 vivas

| Campo | Cobertura | Nota |
|---|---|---|
| `cid`, `asesor`, `health_score` | 100% | |
| `activo_desde` | 99.0% | |
| `contacto_nombre` | 96.4% | |
| `contacto_tel` | 94.8% | |
| `giro` | 94.8% | **texto libre: 176 valores distintos** |
| `pagina_web` | 94.3% | |
| `tamano_empresa` | 87.5% | |
| `total_empleados` | 84.9% | |
| `notas` | 84.9% | |
| `num_oficinas` | 79.7% | |
| `facturacion` | 75.0% | la columna vieja; el importe oficial sale del GRC |
| `observaciones_kam` | 69.8% | lo lee la capa cualitativa |
| **`contacto_email`** | **58.3%** | **el canal que necesita la encuesta NPS** |
| `contactos_json` | 52.6% | **90 de 192 no tienen ni un contacto extra** |
| **`nps_score`** | **0%** | las 192 en nulo |

**El Health Score, que el documento quiere usar como feature, está en parte
fabricado.** Los cuatro sub-scores nacen en 50 y se mantienen ahí si nadie los
captura: en promedio sólo el **58% del peso** del score se apoya en dato real, y
**8 cuentas tienen un Health Score 100% fabricado**. El §ANO-05 acierta al
tratarlo como una feature más y no como la etiqueta; conviene añadir que debe
entrar **con su porcentaje de dato real** al lado.

---

## 5. Estado de las ocho anomalías

Cuatro siguen vivas, dos cerradas, dos parciales. Y aparecieron dos nuevas.

| ID | Estado | Evidencia medida |
|---|---|---|
| ANO-01 | **PARCIAL** | La compuerta única existe y **cierra exacto**: cartera viva $2,220,416 por GRC/CID, suma por asesor $2,220,416, y los 186 episodios de alerta coinciden en los 186 importes con 0 discrepancias. Pero conviven dos lecturas: `facturacion` ($1,884,241 en total, 155 cuentas cambian de importe) y `factura_mensual_zoho`, que es un campo **derivado en tiempo de ejecución** desde la vista viva de Zoho por emparejado difuso de nombre (`lib/zoho-enrich.ts:147`), no una columna rival |
| ANO-02 | **CERRADA** | El MRR en riesgo ya no excede la cartera |
| ANO-03 | **PARCIAL** | La vía por CID no se mueve entre recálculos. La que sí puede moverse es la derivada de Zoho por nombre. No se midió cuántas cuentas repiten el patrón de CH Desarrollos |
| ANO-04 | **VIVA — y es la más grave** | Sección Amarilla da **97 días** por el reloj de contacto de `lib/contacto-cuenta.ts` y **36 días** por una tercera definición en `app/page.tsx:107`, que se pinta bajo la etiqueta «Sin contacto». Son los dos mismos números del 6 de octubre |
| ANO-05 | **CERRADA** | El riesgo tiene número propio; ya no son 0 cuentas |
| ANO-06 | **VIVA, y mucho más grande de lo que dice el documento** | Ver abajo |
| ANO-07 | **PARCIAL** | La tabla `oportunidades` está **vacía**, lo que explica el indicador en 0. Las candidaturas se calculan en vivo |
| ANO-08 | **VIVA** | NPS en **0 de 192**. Auditoría en **30 de 192 (15.6%)**. Las dos cifras del documento, intactas |

### ANO-06 corregida · No son 7 cuentas, son 46 — y el hueco está en las grandes

El documento dice «7 cuentas TOP sin consumo medible». Lo medido:

| | Cuentas | MRR mediano | MRR total |
|---|---|---|---|
| **Con** corte de facturación | 146 | $6,554 | $1,447,859 |
| **Sin** corte | **46** | **$11,450** | **$772,557** |

**$772,557 — el 34.8% de la cartera — no tiene ninguna medición de consumo.** Y
el hueco **no es aleatorio: está sesgado hacia las cuentas grandes.** La mediana
de las que faltan es casi el doble de las que están.

Las diez mayores sin corte:

| Cuenta | Asesor | MRR |
|---|---|---|
| Tech People | Claudia | $86,737 |
| Sección Amarilla | Fátima | $84,254 |
| IMPAS Municipio Chihuahua | Dan | $65,640 |
| University 4 People | Dan | $54,060 |
| Finsus Growth | Fátima | $38,215 |
| ECODELI | Claudia | $32,740 |
| Polak Grupo | Fátima | $26,980 |
| FCA Stellantis México | Claudia | $25,313 |
| ODONTOPREV | Claudia | $23,523 |
| Renault Concordia Agencia del Sol | Claudia | $19,420 |

Por qué importa más que ninguna otra anomalía: el consumo pesa **25%** en la
Capa A, es la familia de features con más historia (once meses) y es la única
vía que fecha las bajas. Que falte sobre un tercio del dinero, concentrado en
las cuentas que más importan, degrada las tres cosas a la vez. **Y esto es
exactamente donde el Excel por cuenta que piden los asesores (§7) paga más: son
46 peticiones y tapan $772,557 de ceguera.**

### ANO-09 (nueva) · El respaldo de Facturación está muerto y lo dice en silencio

`app/api/facturacion/route.ts:119` pide a Supabase la columna
`factura_mensual_zoho`, **que no existe**. Comprobado:

```
HTTP 400 · {"code":"42703","message":"column cuentas.factura_mensual_zoho does not exist"}
```

Esa consulta vive en `getSupabaseData()`, el respaldo para cuando Zoho no
responde. Falla, entra en `if (error || !cuentas) return []` y **devuelve lista
vacía**. Cuando Zoho se caiga, el módulo no dirá «el respaldo está roto»: dirá
que no hay datos. Y si la columna existiera, la línea siguiente
—`c.factura_mensual_zoho ?? c.facturacion`— preferiría el emparejado difuso
sobre la fuente única.

### ANO-10 (nueva) · Cinco cuentas vivas desaparecieron del panel de facturación

| Cuenta | Último corte | MRR |
|---|---|---|
| **Justo** | **2026-01** | **$13,947** |
| INBROTEK SERVICIOS | 2026-08 | $5,511 |
| Caprioli Contadores | 2026-03 | sin dato |
| Centinela Property | 2026-03 | sin dato |
| Padecu SA de CV | 2026-05 | sin dato |

Una cuenta activa de $13,947 al mes que no aparece en el panel desde enero es
un hueco del archivo o facturación que nadie está viendo. En los dos casos hay
que preguntarlo, no deducirlo.

### Dos avisos de alcance que el documento no contempla

- **`vista_riesgo` excluye a las 61 cuentas en riesgo.** Su `WHERE` es
  `estado = 'activo'`, así que la vista que se llama «riesgo» no contiene a las
  cuentas en riesgo. Quien la use como población se deja fuera a un tercio de la
  cartera.
- **Seis tablas están vacías**: `tickets` (los reales viven en
  `lib/tickets-data.json`, 3.69 MB), `oportunidades`, `chat_mensajes`,
  `solicitudes_acceso`, `enriquecimiento_decisores` y `wa_senales`.
  `buzon_cliente` —la «voz del cliente» del §4— tiene **1 fila**.

---

## 6. NPS e Informe de Valor

### El NPS arranca de cero, y dos piezas no existen como dato

- `nps_score`: **0 de 192**. No hay ninguna tabla de encuesta.
- **El rol Decisor/Operativo no existe poblado.** `contactos_json` sólo trae
  nombre, cargo, email, tel y nota. La tabla `enriquecimiento_decisores` **ya
  tiene las columnas `rol_decision` y `tipo_contacto`** — y **0 filas**. O sea:
  el esquema está, el dato no.
- Sin rol no se puede calcular la **brecha Decisor–Operativo** (§7.3). Y aunque
  se infiriera del texto de `cargo`, son 191 valores distintos sobre 254
  personas, 90 no clasificables, y **sólo 26 de 192 cuentas tendrían ambos
  lados**.
- Sólo **70 de 192 (36.5%)** tienen dos o más contactos.
- El canal: **58.3% tiene correo**. La encuesta por correo alcanza, como
  máximo, a 112 de 192 cuentas.

### El Informe de Valor: seis de nueve bloques se pueden armar ya

| Bloque (§7.9) | Cuentas | Veredicto |
|---|---|---|
| 1. Llamadas perdidas y abandonadas, con día y hora | 147 (77%) | **Se puede ya** |
| 2a. Horas pico | 147 (77%) | **Se puede ya** |
| 2b. **Tiempos de espera / timbrado** | 0 | **No existe el dato** en ninguna capa. El export de entrantes trae siete columnas y la única de tiempo es `total_minutes`, que es conversación. `start_time`/`end_time` sólo vienen en las de salientes |
| 3. Minutos consumidos vs bolsa | 147 (77%) | Se puede ya, vía `plan-minutos.ts` |
| 4. Productos contratados sin uso | 164 (85%) | Se puede ya |
| 5. **Comparativo con su giro** | 0 | **Imposible hoy, y no por falta del campo**: `giro` está al 94.8% pero es texto libre con **176 valores distintos entre 192 cuentas**, así que **ningún giro llega a 5 comparables**. «Inmobiliaria» e «Inmobiliario» cuentan como dos. Se arregla normalizando a ~15 categorías |
| 6. Tickets y tiempos de resolución | 165 (86%) | Se puede ya, **sólo cerrados** (6,326 de 6,328 filas traen cierre) |
| 7. NPS por rol | 0 | No hay NPS ni rol |
| 8. Tres recomendaciones | 147 (77%) | Derivadas de 1–6 |

Sólo **96 de 192 (50%)** tienen a la vez llamadas, minutos, productos y tickets
—los cuatro bloques que sostienen un informe completo.

Un apunte de honestidad para el bloque 1: la fuente **no distingue
«abandonada»** como categoría propia. Los cuatro desenlaces de entrada son
`Redirected`, `Lost`, `Self_service` y `Voicemail`. Lo que el documento llama
abandonada cae dentro de `Lost`, y el informe no debe inventar la distinción.

---

## 7. La vía que abren los asesores: el Excel por cuenta

Son **dos entradas para dos huecos distintos**, y conviene no mezclarlas.

### El Excel de entrantes y salientes — llena el hueco cuantitativo

Es la mejor noticia del inventario: **esa forma de archivo ya se digiere**. Los
dos generadores resuelven las columnas por nombre, así que un export de una
cuenta y tres meses entra por la misma puerta que los seis archivos de cartera,
con la semántica ya verificada.

Las columnas que necesita, con el nombre exacto:

| Para qué sirve | Columna |
|---|---|
| El desenlace de la llamada | `destination_type` |
| La fecha | `date` |
| El identificador del cliente | `customer_id` |
| El nombre de la empresa | `empresa` (o `Nombre Empresa`) |
| **A dónde entró: extensión o cola** | **`destination_data_1`** |
| El número que llamó | `caller_id` |
| Minutos de conversación | `total_minutes` |

**Hay que pedir `destination_data_1` expresamente.** De los seis archivos que
tenemos, uno llegó sin ella: son 799,999 llamadas, el **31.3% de todas las
entrantes**, de las que no se sabe a dónde entraron. Y es la columna que
sostiene el bloque más fuerte del informe — «a dónde se fueron las no
contestadas». Sin ella el archivo sirve para contar, no para señalar.

**Lo que esto desbloquea:** las **45 cuentas sin ninguna lectura de llamadas,
$641,479 de MRR a ciegas**, dejan de estarlo en cuanto su asesor pida el export.
Y la cadencia deja de ser semestral: pasa a ser por cuenta y a demanda.

Sobre el periodo: tres meses alcanzan para nivel y comportamiento. El único
matiz factual es que el bloque 1 del informe pide «tendencia contra el trimestre
anterior», y eso necesita también el trimestre previo. Como es el mismo export
con otro rango, seis meses cuesta lo mismo que tres y da las dos lecturas.

### El informe del otro sistema — llena el hueco cualitativo

El sistema que analiza llamadas y devuelve un informe cubre el punto ciego que
medí como el más grande de todos: **lo que el cliente dice**, ausente para el
100% de la cartera. Hoy el sustituto es la prosa del asesor, que la capa
cualitativa ya lee y que encuentra señal escrita en **6 de 192 cuentas — el
3%**. No porque las otras estén bien, sino porque nadie lo escribió.

Ese informe es **un documento, no datos crudos**, así que su ingesta debe
parecerse a lo que el proyecto ya hace con las auditorías: `app/auditoria/`
tiene **34 casos tipados**, cada uno declarando su documento fuente, su periodo,
sus etiquetas `[VERIFICADO]` / `[HIPÓTESIS]` / `[VACÍO]` y —lo que más importa—
**sus limitaciones de fuente**. Uno de ellos advierte literalmente que los
mensajes conservan hora del día pero no fecha, y que **no se deben inventar
fechas para esos eventos**. Esa disciplina es la que hay que heredar, junto con
su detector (`scripts/revisa-casos-auditoria.py`, 34 casos, todos completos).

### Una idea mía que descarté midiendo

Pensé proponer que el tablero eligiera **cuáles** llamadas revisar, apuntando a
la celda día×hora donde se concentran las perdidas. Lo medí sobre 130 cuentas
con 100 o más perdidas: las 10 peores celdas de 168 concentran, en mediana,
**sólo el 26%**. Es 4× sobre lo uniforme, no el 10× que suponía, así que el eje
día×hora no sirve para dirigir una muestra. El candidato con mejor pinta es el
**destino** —hay una cuenta donde uno solo concentra el 99.7% de lo no
contestado— pero **eso no lo he medido** y no lo propongo hasta hacerlo.

---

## 8. Lo que NO se inventarió

Queda dicho para que la compuerta se cruce sabiendo qué falta:

- **Si las vistas de Zoho Analytics responden hoy** y con qué vigencia:
  `/api/customer-tenure`, `/api/facturacion` y las demás que apuntan a un
  `VIEW_ID`. No se consultaron.
- **La fecha real de baja de cada una de las 30 cuentas muertas.** Lo que hay es
  el mes derivado del panel; la fecha de la decisión de dirección no está en
  ninguna parte.
- **Si alguna cuenta fue borrada en vez de pasada a Dormida.** No hay bitácora
  de altas y bajas de `cuentas`.
- **La tasa de falso empate** del cruce por nombre que sostiene la cohorte de
  221 eventos del GRC.
- **El contenido de `data/activaciones.xlsx`** columna por columna, y la
  cobertura de los 20 cortes de `data/mesa-ayuda/`.
- **Los días sin contacto reales** de las 112 cuentas vivas sin ningún contacto
  efectivo registrado: lo medido es la ausencia de registro, que no es lo mismo
  que la ausencia de contacto.
- **La prueba de no regresión** que exige el §1. No se ejecutó porque no se tocó
  nada; hay que levantar la línea base antes del primer cambio de la Fase 3.

---

## 9. La decisión que necesito para cruzar G1

Cuatro puntos. Los dos primeros cambian el documento; los dos últimos son
trabajo que se puede empezar ya.

1. **La Capa B queda declarada no entrenable y con fecha.** 18 eventos contra
   los 30 que pide el §6.4. No se entrena con el label del GRC por las tres
   razones del §3. La Capa A queda primaria y la interfaz lo dice, como manda el
   propio documento.

2. ~~La población primaria~~ — **RESUELTO el 7 oct 2026**: las 25 principales
   de cada asesor. 75 cuentas, $1,655,430, el 74.6% de la cartera. El censo y
   su cobertura están en el §1.1.

3. **Empezar el snapshot semanal esta semana.** Es lo único que no se puede
   recuperar después: cada semana sin guardar es una semana que nunca se podrá
   entrenar. `alertas_episodios` ya tiene la forma; falta el trabajo programado
   y las cuatro cifras por cuenta y por semana (MRR oficial, % de consumo, días
   sin contacto efectivo, estado). Es aditivo y cabe en el esquema `prediccion`.

4. **Tres arreglos que no son del módulo predictivo pero bloquean su calidad**, y
   que hay que decidir si entran o se quedan fuera por el §SEG-01:
   ANO-09 (el respaldo muerto de Facturación), ANO-04 (la tercera definición de
   días sin contacto en `app/page.tsx:107`) y la normalización de `giro`, sin la
   cual el bloque 5 del Informe de Valor no existe.

---

*Levantado con seis vías de reconocimiento en paralelo, solo lectura, según el
§2.3. Cada cifra de este documento está medida; donde no se pudo medir, lo dice
el §8. Las contradicciones entre vías se resolvieron midiendo de nuevo, no
promediando.*
