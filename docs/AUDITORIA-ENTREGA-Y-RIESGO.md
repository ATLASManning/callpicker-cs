# Auditoría del sistema real — Control de Entrega y Prevención de Pérdidas

> **Fase 1 del Prompt Maestro de Activaciones / SAC.** Describe lo que el
> sistema hace **hoy**, no lo que debería hacer. Se escribió antes de tocar
> nada, que es el requisito del §3 y del principio 1.
>
> El prompt pide explícitamente: *«Antes de modificar, presenta una síntesis de
> hallazgos y el plan»*. Este documento es esa síntesis, y se escribió **antes**
> de tocar nada.
>
> **Después** de presentarla, José Manuel aprobó los puntos 2 y 4 de las cinco
> decisiones del §6. Lo que se construyó por esa aprobación está en el **§9**, al
> final, separado del resto a propósito: la auditoría no se reescribe para que
> parezca que siempre dijo lo correcto. Los puntos 1, 3 y 5 siguen sin tocarse.

**Sello de la lectura:** 18 nov 2026 · rama `master`, commit `8289a4b` ·
224 cuentas · 43 expedientes de auditoría · 807 episodios de alerta
(659 abiertos) · 2,821 filas en la hoja de Activaciones.

---

## 0. El hallazgo que ordena todo lo demás

De los **659 episodios de alerta abiertos**, así se reparten por familia:

| Familia | Episodios | % |
|---|---:|---:|
| `ceguera` — no podemos ver la cuenta | **348** | **52.8%** |
| `riesgo` — señal real de la cuenta | 302 | 45.8% |
| `oportunidad` | 9 | 1.4% |
| **Total** | **659** | 100% |

Desglose de `ceguera`: `radar` 137 · `contactos` 86 · `medicion` 53 ·
`ficha` 52 · `importe` 20.

**Más de la mitad de lo que el tablero muestra como alerta no dice nada del
cliente: dice que no lo estamos midiendo.** Eso es exactamente lo que el
principio 6 del prompt prohíbe confundir, y la buena noticia es que este
sistema ya lo separa de origen — `familia: 'ceguera'` es un concepto de primera
clase en `lib/alertas.ts`, no un parche.

La consecuencia para el plan es directa: **el motor de riesgo que el §9 y §10
piden no se construye desde cero, se construye sobre uno que ya existe y que ya
acertó en la distinción más difícil.** Lo que falta no es detección. Es lo que
viene después de detectar: la acción con dueño y vencimiento.

---

## 1. Mapa de nombres — lo que el prompt nombra y aquí no existe

Un plan escrito sobre nombres inventados produce un PR que no compila.

| El prompt dice | En el código es | ¿Existe? |
|---|---|---|
| `account_id` | `cuentas.id` (UUID) + `cid` (texto, Zoho) | sí, dos claves |
| índices separados de cancelación / baja parcial / downgrade | un solo `familia` + `severidad` | **no** |
| `rule_id` / `rule_version` | `tipo` (sin versión) | a medias |
| `event_at` | — | **no** |
| `condition_met_at` | `alertas_episodios.condicion_desde` (**DATE**) | sí, con menos precisión |
| `detected_at` | `abierto_en` / `confirmada_el` (**DATE**) | sí, con menos precisión |
| `action_due_at`, `overdue_since` | — | **no** |
| `commercial_event_at` | — | **no** |
| tabla de acciones con SLA | `seguimientos` (9 columnas, **sin vencimiento**) | **no** |
| estado de entrega / clasificación operativa | — | **no** |
| aceptación de SAC | — | **no** |
| rol `activaciones`, rol `sac` | `lib/permisos.ts` → `ROLES` | **ya sí** (18 nov 2026, ver §9) |
| expediente de 20 apartados | — | **no** |
| `feature flags` | — | **no** |
| framework de pruebas | 261 guiones Python + 22 Node + 4 `ts-node` | con otra forma |

**Hay un precedente que no se puede ignorar:** `docs/MOTOR_RIESGO.md` es la
Fase 0 de un «Prompt Master v2» anterior (9 oct 2026) y declara el motor de
riesgo **intocable sin solicitud expresa**. Este prompt pide modificarlo. Es la
primera decisión que necesito de ti, y está en el §9 de abajo.

*(Ese documento, además, declara `lib/alertas.ts` con 644 líneas y hoy tiene
1,063: se quedó viejo sin avisar, que es el mismo vicio que acabamos de cerrar
en los snapshots de cartera.)*

---

## 2. Stack, infraestructura y sus límites verificables

| Pieza | Qué es | Límite medido |
|---|---|---|
| Framework | Next.js **14.2.3** (App Router), React 18.3.1, TypeScript 5 | versión con CVEs conocidos; actualizarla es pendiente aparte |
| Base | Supabase (PostgreSQL), `@supabase/supabase-js` 2.43 | RLS activo; ver `rls_supabase` |
| Despliegue | Vercel | — |
| Autenticación | propia, `jose` (JWT en cookie `cp_session`) + `lib/auth.ts` | tres puertas: lista blanca, `usuarios.activo`, `usuarios.asesor_nombre` |
| Autorización por cartera | `lib/dueno.ts` (fail-closed, compara normalizando) | compara dos columnas que nadie obliga a coincidir |
| Correo | `resend` 6.12, **conectado** en `api/aprobar`, `api/auth/request`, `api/solicitar` | el canal existe: el §16 no parte de cero |
| IA | `openai` 4.47 | — |
| PWA | `@ducanh2912/next-pwa` | el precache ya mordió documentos de cliente una vez |
| **Trabajo programado** | `vercel.json`: **un cron diario** `/api/cron/diario` a `0 12 * * *` (06:00 México) + uno mensual `/api/cron/refresh-tenure` | declara `maxDuration = 300`, **y la plataforma corta a los 60 s** — ver abajo |

### EL TECHO REAL SON 60 SEGUNDOS, NO 300 — Y ESTÁ MEDIDO

> **Corrección del 18 nov 2026.** La primera versión de esta tabla decía
> «`maxDuration = 300` (5 min)» como si fuera el límite efectivo. Es lo que el
> código **declara**; no es lo que la plataforma **concede**.

`docs/PILOTO-ENRIQUECIMIENTO.md` lo midió dos veces, en producción:

- línea 142: *«Lotes de 20 cuentas por corrida para no exceder el límite de 60 s de Vercel.»*
- línea 223: **tres lotes de 15 cuentas fallaron con HTTP 504** porque *«la función de Vercel corta a los 60 s»*.

Eso es evidencia de campo, no una lectura de la documentación. Y abre un riesgo
que nadie está vigilando: **`/api/cron/diario` declara 300 s y tiene 60.** Hoy
procesa 224 cuentas; el día que pase del minuto morirá a media corrida, y este
proyecto ya sabe cómo se siente eso — `/api/cron/refresh-tenure` estuvo
programado **meses sin correr nunca** porque el middleware le servía el login
con HTTP 200 y Vercel lo daba por exitoso.

**Y no se puede medir si está cerca del límite**, porque nada registra cuánto
tarda. Ver la corrección sobre `corridas` más abajo.

Tres señales independientes apuntan al mismo plan de Vercel: el techo de 60 s
medido, **exactamente dos** entradas de cron, y las dos de frecuencia diaria.
Lo confirma una sola mirada a la página de facturación de Vercel; esta
auditoría no lo afirma, lo acota.

### El límite que choca de frente con el §15

El §15 fija como objetivo *«procesar eventos disponibles en menos de 15
minutos»*. Hoy hay **una corrida al día**, declarada a hora fija, y dos
entradas de cron en total.

Dos cosas, por separado:

1. **La frecuencia es de plan, no de código.** Una cadencia sub-diaria exige un
   plan de Vercel que la permita. No puedo verificar el plan desde el
   repositorio — **lo necesito confirmado antes de prometer cualquier cadencia**.
2. **Aunque el plan lo permita, la fuente no lo soporta.** El GRC, las
   llamadas, el chat y los tickets entran por `.xlsx` **semanales**. El propio
   §15 lo dice: *«No prometer actualización de 15 minutos con fuente diaria»*.
   Con fuente semanal, 15 minutos es una cifra sin significado para esas
   señales.

Lo que sí tiene sentido inmediato: **los 15 minutos aplican a las señales que
nacen dentro del sistema** —una solicitud de cancelación capturada, un SLA que
vence, una acción que nadie atendió—, porque esas no esperan a ningún corte.
Propongo esa separación explícita y rotulada en pantalla, como pide el §15
(«Mostrar latencia real»).

---

## 3. Mapa de módulos reales

`Funcionalidad | ubicación | fuente | limitación verificable | cambio propuesto | dependencia`

| Funcionalidad | Ubicación real | Fuente | Limitación verificable | Cambio propuesto | Dependencia |
|---|---|---|---|---|---|
| Activaciones 2.0 | `app/activaciones`, `api/activaciones-excel`, `api/activaciones/detalle` | `data/activaciones.xlsx` (2,821 filas × 34 col) | **El `.xlsx` ES el dato**: no hay tabla. Sin estado de entrega ni aceptación | tabla `entregas` + expediente; la hoja sigue siendo fuente de los campos que ya trae | ninguna |
| Alertas de Cliente | `lib/alertas*.ts` (5,259 líneas), `app/alertas`, `api/alertas` | `cuentas` + snapshots | ~25 tipos, 4 familias; **un solo eje de severidad**, sin acción con vencimiento | añadir tipo de riesgo (cancelación/parcial/downgrade) e índices separados | decisión sobre el candado del `MOTOR_RIESGO.md` |
| Episodios con memoria | `alertas_episodios` (40+ col), `lib/alertas-episodios.ts` | la propia tabla | fechas en **`DATE`**, no `TIMESTAMPTZ`; sin `event_at`, sin `rule_version`, sin supervisor | migración a `timestamptz` + columnas nuevas | aprobación de migración |
| Seguimiento | `seguimientos` (9 col), `app/seguimiento` | la tabla | **es una bitácora, no una tarea**: sin vencimiento, sin evidencia, sin estado | tabla `acciones` nueva; `seguimientos` queda como registro | aprobación de migración |
| Análisis de Llamadas | `app/analisis-llamadas`, `data/analisis-llamadas.json` | `.xlsx` semanal | corte al 12 oct 2026 en la lectura de hoy; **son DOS fuentes** | consumir el corte, no recalcular | carga semanal |
| Churn | `app/churn`, `data/grc-zoho.json` | GRC Zoho | el churn real es el del mes **vencido** | leer, no reescribir | — |
| Cuentas / Dormidas / Downgrade | `app/cuentas/*` | `cuentas` + GRC | `cuentas.estado` tiene **un solo eje**: activo 131, en_riesgo 58, hibernacion 26, cancelado 9 | **no sobrescribirlo**: dimensiones nuevas en columnas nuevas | aprobación de migración |
| Contratos | `app/cuentas/contratos`, `data/contratos.json` + `contratos-addenda.json` | generado + capa manual | `contratos.json` **se regenera**: editarlo a mano se pierde | el §10.9 (preaviso) lee de aquí | — |
| Facturación / Cortes | `app/facturacion`, `api/grc` | GRC | **`cuentas.facturacion` no sirve**: el MRR es el del GRC | el apartado 13 lee GRC `mrrFin` | — |
| Reuniones / Anexos | `reuniones`, `anexos`, `app/reuniones` | tablas | `anexos.cuenta_id` sin `NOT NULL` (pendiente) | evidencia del expediente puede colgar de `anexos` | migración pendiente previa |
| Tickets | `data/tickets`, `app/tickets` | Zoho Desk `.xlsx` | **sólo trae CERRADOS**: «tickets abiertos» es NO MEDIBLE | ver §5, apartado 18 | fuente nueva de Zoho Desk |
| Auditoría | `app/auditoria`, 43 `*-data.ts` | archivos del repo | expedientes narrativos, no estructurados | fuente de evidencia, no de estado | — |
| Roles y usuarios | `usuarios` (12 col), `lib/permisos.ts`, `lib/auth.ts`, `app/admin/usuarios` | la tabla | el tipo `Rol` trae **cuatro** (`perfilamiento` incluido); en uso hay **`admin` 2, `asesor` 3, `viewer` 3** y `perfilamiento` **0** | `activaciones` y `sac` añadidos el 18 nov 2026 | la migración del CHECK |
| Predicción | esquema `prediccion`, `lib/prediccion/*`, `tareas_hueco` | snapshot semanal | dos pasos manuales en Supabase | `tareas_hueco` es el precedente más cercano a «acción con dueño» | — |
| Registro de corridas | **`prediccion.corridas`**, no `public.corridas` | la tabla | **NO es un registro de ejecuciones del sistema**: es la bitácora del snapshot semanal de Predicción. Nada registra las corridas de `/api/cron/diario` | tabla nueva de ejecuciones | — |

---

## 4. Los 20 apartados contra fuentes reales

Esto es el corazón del §5. **Ningún apartado está hoy completo como expediente
validado**, porque no existe el concepto de expediente. La columna que importa
es la última.

| # | Apartado | Fuente real que ya existe | Veredicto |
|---:|---|---|---|
| 01 | Estatus `TICKET CERRADO — ENTREGA ACEPTADA` | `Estatus` + `Cierre Ticket` de la hoja | **la mitad no existe**: «entrega aceptada» no está en ningún sitio |
| 02 | ID de cuenta y ticket Zoho | `ID` + `Apertura Ticket` (hoja), `cuentas.cid` | existe, **con basura conocida**: hay IDs que no son números |
| 03 | Nombre comercial / razón social | `Cliente` (hoja), `cuentas.empresa` | existe |
| 04 | DID(s) y números portados | `Portabilidad` (sí/no) + `data/dids.json` | **parcial**: hay bandera, no lista de DIDs por cuenta en la hoja. El cruce por nombre mezcla cuentas |
| 05 | Responsable de cuenta 1 y cargo | `cuentas.contacto_nombre` / `contacto_cargo` / `contactos_json` | existe, **con calidad sucia** (hay nombres capturados en el campo de correo) |
| 06 | Responsable de cuenta 2 y cargo | `contactos_json` | **no garantizado**: la mayoría tiene uno. El prompt pide excepción, no invención |
| 07 | Teléfono 1 y 2 | `contacto_tel`, `contactos_json` | parcial |
| 08 | Correo 1 y 2 | `contacto_email`, `contactos_json` | parcial |
| 09 | Medio de contacto preferente | — | **NO EXISTE** |
| 10 | Comentarios / antecedentes | `cuentas.observaciones_kam`, `notas` | existe, texto libre |
| 11 | Servicio/plan, extensiones, funcionalidades | `servicios_json`, `adopcion_producto`, libro «Planes 2.0» | existe. **Lo que no existe es la comparación contratado vs entregado** |
| 12 | Link de audio de recepción conforme | — | **NO EXISTE**: ni campo, ni almacenamiento, ni control de acceso |
| 13 | Facturación mensual / MRR y moneda | **`data/grc-zoho.json` → `mrrFin`** | existe. **Y la trampa está viva**: la hoja trae `1er Pago`, que es justo lo que el §5 prohíbe usar como MRR |
| 14 | ¿Contrato?, plazo, inicio/fin | `data/contratos.json` + `contratos-addenda.json` | existe |
| 15 | Vendedor y ejecutivo de Activaciones | `Vendedor` + `Ejecutivo` (hoja) | existe |
| 16 | Fecha prevista y fecha real de entrega | `Arranque de Proceso`, `Dias activacion`, `Cierre Ticket` | **la prevista NO existe**: sólo hay días transcurridos, que es un resultado, no un compromiso |
| 17 | Pruebas E/S, capacitación y fecha | `Realizo/Recibio llamadas` (proxy de E/S) | **capacitación NO EXISTE** |
| 18 | Incidencias / tickets abiertos / compromisos | `data/tickets` | **NO MEDIBLE**: la fuente de Zoho Desk sólo trae tickets CERRADOS |
| 19 | Estado demo / conversión / AAA | `Clasificación` + `Tipo` (hoja); AAA del GRC | existe, en tres fuentes distintas que hay que separar |
| 20 | Aceptación de SAC, responsable y sello | — | **NO EXISTE** |

**Resumen:** 4 apartados sin ninguna fuente (09, 12, 17-capacitación, 20),
1 no medible con la fuente actual (18), 1 con una trampa activa (13),
2 con la mitad que importa ausente (01, 16).

---

## 5. Huecos por sección del prompt

| § | Qué pide | Qué hay | Hueco |
|---|---|---|---|
| 4 | Siete dimensiones de estado separadas | **una** columna `estado` con 4 valores | 6 dimensiones nuevas, sin tocar la existente |
| 5–6 | Expediente de 20 apartados + aceptación de SAC | nada | tabla `entregas` + `entrega_apartados` + `entrega_aceptaciones` |
| 6 | Segregación de funciones Activaciones/SAC | **resuelto el 18 nov 2026**: los dos roles existen y la prueba al revés demuestra que `activaciones` no puede aceptar | falta la migración del CHECK en Supabase y decidir quién es quién |
| 7 | Relojes separados por etapa | `actividades` tiene `iniciada_en` + `tiempo_medido_min` | el patrón existe; falta aplicarlo a entrega |
| 9 | Señal / episodio / acción / notificación / resultado | señal y episodio sí; **acción y notificación no** | tabla `acciones` y tabla de notificaciones |
| 10 | 12 reglas de riesgo | **10.1, 10.2, 10.3, 10.5, 10.6, 10.7, 10.8 ya existen** con otro nombre | faltan 10.4 (inactividad con patrón), 10.9 (preaviso), 10.10 (valor inicial), 10.11 (encuestas), 10.12 (patrocinador) |
| 11 | Fechas con precisión de hora | episodios en **`DATE`** | el ejemplo de «26 horas de atraso» **no se puede representar hoy** |
| 12 | Índices 0–100 por tipo de riesgo | un `health_score` y cuatro `score_*` | tres índices nuevos; «no evaluable» ya existe como `ceguera` |
| 13 | Acciones con SLA y escalamiento | `seguimientos` sin vencimiento | lo más grande que falta |
| 14 | Cuatro semáforos que no se mezclan | uno de salud | **leer `atlas_dashboard_contrast_architecture` antes de tocar un color** |
| 15 | <15 min, idempotencia, reintentos | 1 cron diario, techo real de **60 s**, y **ningún registro de ejecuciones** | ver §2. Lo primero no es la cadencia: es poder medir cuánto tarda |
| 16 | Notificaciones internas deduplicadas | `resend` conectado para accesos | reutilizable; falta la deduplicación por evento |
| 17 | 8 resultados de episodio | `cierre_motivo` con **4** | ampliar el CHECK |
| 19 | Auditoría protegida, acceso a audios | RLS activo, sin almacenamiento de audio | el apartado 12 necesita almacenamiento con control de acceso |
| 20 | 42 pruebas | **0 frameworks**; 261 guiones Python que sí son el sustrato real | las 42 se escriben como guiones verificadores, al estilo de la casa |

---

## 6. Las cinco decisiones que necesito antes de escribir código

Ninguna la puedo tomar yo. Las cuatro primeras bloquean; la quinta no.

1. **El candado del `MOTOR_RIESGO.md`.** Declara el motor de riesgo intocable
   sin tu solicitud expresa. Este prompt pide modificarlo. ¿Lo levanto para
   este trabajo, y queda anotado en ese documento?
   **El 18 nov 2026 se hizo lo que NO depende de tu respuesta** — ver §12: el
   sello de los textos (`npm run test:veredicto`), que es el candado que el
   propio documento llama «el único que protege de verdad lo que declara
   intocable», y que no modifica el motor. La decisión sigue siendo tuya.

2. ~~**Los roles `activaciones` y `sac`.**~~ **APROBADO Y HECHO el 18 nov 2026**
   — ver §9. *(Esta decisión decía «hoy sólo hay `admin`, `asesor` y `viewer`».
   Era falso: `perfilamiento` existe desde el 3 sep 2026, con cero personas
   asignadas. Lo medí en la tabla —donde no hay ninguno— y no en el tipo, que es
   donde se declara.)* Queda pendiente **de ti**: correr la migración y decidir
   quién es quién.

3. ~~**La migración de `alertas_episodios` de `DATE` a `TIMESTAMPTZ`.**~~
   **MEDIDA el 18 nov 2026 y es PREMATURA** — ver §12. Afecta 807 filas, sí,
   pero `condicion_desde` —la columna contra la que correría el SLA— **está
   vacía en 683 de las 807 (84.6%)**, y ninguno de los 659 episodios abiertos
   vive menos de un día. Migrar el tipo daría precisión de horas a un reloj que
   en cinco de cada seis filas no tiene desde cuándo contar. *(Esta decisión
   decía que era «la única forma» de representar los SLA del §7. Lo es, y aun
   así no es el primer problema: el primero es que nadie escribe
   `condicion_desde`.)*

4. ~~**La cadencia real.**~~ **CONTESTADA el 18 nov 2026 con evidencia de
   campo, sin que nadie inicie sesión.** El techo real es de **60 segundos**,
   medido con tres HTTP 504 en producción; el `maxDuration = 300` del código no
   se concede. Con dos crons diarios y ese techo, los «15 minutos» del §15 **no
   son alcanzables hoy**, y el primer problema no es la frecuencia: es que
   **nada registra cuánto tarda la corrida diaria**, así que no sabemos a qué
   distancia está de morir. Lo único que falta de ti es confirmar el plan en la
   página de facturación de Vercel, para saber si subirlo es una opción.

5. **Tickets abiertos** (no bloquea, y el apartado 18 **ya no queda cojo**:
   el expediente lo declara `no_medible` con palabras — ver §12. Lo que falta
   es la credencial `CONECTOR_COMUNICACIONES_TOKEN`, y es tuya). Hoy la
   fuente sólo trae cerrados. O conseguimos esa vista de Zoho Desk, o el
   apartado 18 se declara «no medible» con palabras, que es lo que el
   principio 18 manda hacer.

---

## 7. El plan, en el orden del §21

Marcado con lo que puedo hacer en local y reversible, y lo que no.

| Paso | Qué | Necesita |
|---:|---|---|
| 1 | **Auditoría e inventario** | **hecho: este documento** |
| 2 | Mapeo de datos de los 20 apartados a su fuente, como código verificable | nada — local |
| 3 | Modelo y migraciones (`entregas`, `entrega_apartados`, `acciones`, dimensiones de estado) | **decisiones 2 y 3** |
| 4 | Validación de entrega en servidor (los 20 apartados, rechazo de vacíos y relleno) | paso 3 |
| 5 | Flujo de aceptación de SAC + reporte versionado e inmutable | ~~decisión 2~~ **desbloqueado** (§9); necesita el paso 3 |
| 6 | Motor de riesgo en **modo sombra**: tres índices nuevos sin tocar el actual | **decisión 1** |
| 7 | Acciones, SLA y temporizadores | **decisión 3** |
| 8 | Interfaz integrada, cuatro semáforos | leer la arquitectura de contraste |
| 9 | Notificaciones **internas** de prueba, sin envíos reales | — |
| 10–12 | Muestra, piloto, ajuste de falsos positivos | tu autorización |
| 13 | Feature flags (entrega, riesgo, tareas, escalamiento, notificaciones) | — |
| 14 | Monitoreo y reversión | — |

**Lo que puedo empezar ya, sin esperar nada y sin tocar producción:** el paso 2
—el mapeo de los 20 apartados escrito como un guion que mide, cuenta por
cuenta, qué apartados tienen fuente, cuáles están vacíos y cuáles están sucios,
sobre las 2,821 filas reales—. Eso convierte la tabla del §4 de arriba, que es
una lectura mía, en una cifra por cuenta que se puede discutir. Y no escribe
nada.

---

## 8. Honestidad sobre esta lectura

Lo que **medí** contra el sistema real: el stack y sus versiones, las rutas y
API, el `vercel.json`, el esquema de `alertas_episodios`, las columnas de
`cuentas`, `usuarios` y `seguimientos`, el dominio de `cuentas.estado`, el
reparto de los 659 episodios abiertos, las 34 columnas y 2,821 filas de la hoja
de Activaciones, los roles reales, el cableado de `resend` y el catálogo de
tipos de alerta.

Lo que **no** abrí a fondo: las 817 líneas de `lib/alertas-detectar.ts` regla
por regla, los 43 expedientes de auditoría, y la mayoría de los 261 guiones.
Para el paso 2 hace falta leer el detector completo; para este documento no, y
no voy a declarar entendido lo que no leí.

Lo que esta lectura **afirmó mal**, corregido arriba y anotado donde estaba el
error: los roles (dije tres, son cuatro — medí la tabla en vez del tipo), la
tabla `corridas` (dije que servía de registro de ejecuciones; vive en el esquema
`prediccion` y es la bitácora del snapshot, no un registro del sistema — el
mismo vicio de las sondas de RLS que sólo miraban `public`), y el techo de
`maxDuration` (dije 300 s; la plataforma concede 60, y estaba medido en un
documento del propio repo).

---

## 9. Lo que se construyó — puntos 2 y 4 aprobados, 18 nov 2026

### Punto 4 · la cadencia: contestada, no construida

No hacía falta código. La respuesta estaba medida en `PILOTO-ENRIQUECIMIENTO.md`
y se resume en el §2: **techo real de 60 s**, dos crons diarios, y **ningún
registro de duración**. `scripts/mide-cadencia-cron.py` queda como la medición
permanente: lee `vercel.json`, busca el registro de corridas, y **cuando no
puede concluir lo dice con palabras** en vez de dar por buena la cadencia.
Hoy sale en rojo, y tiene razón.

### Punto 2 · los dos roles de la entrega

| Archivo | Qué hace |
|---|---|
| `lib/permisos.ts` | `activaciones` y `sac` en el tipo `Rol` y en `ROLES`, **acotados** (`paginas` y `apis` enumeradas, nunca `null`). Campo `descripcion` nuevo y obligatorio |
| `scripts/migracion-roles-entrega.sql` | amplía el CHECK de `usuarios.rol`. Idempotente. **No da de alta a nadie**: no hay nombres, e inventarlos sería inventar un dato |
| `scripts/test-roles-entrega.ts` | 70 comprobaciones, **la mayoría al revés**. `npm run test:roles` |
| `app/admin/usuarios/page.tsx` | las dos listas de roles **se derivan de `ROLES`**; ya no se teclean |

**La segregación, que es el punto:** `activaciones` lleva `/api/entregas` en
`apisLectura` —puede consultar el expediente, nunca escribirlo— y `sac` lo lleva
en `apis`. El endpoint **todavía no existe**, y el candado ya está puesto: al
revés es como se llega a producción con una aceptación firmada por quien
entregó.

**Lo que encontré al hacerlo, y es un hallazgo de seguridad:**
`lib/dueno.ts` → `esRolAcotado()` sólo muerde al rol `asesor`. Para cualquier
otro rol, `firmaDeSesion` devuelve **la firma que venga en el CUERPO de la
petición**. Un rol nuevo con escritura sobre `/api/seguimientos` podría dejar un
seguimiento firmado con el nombre de otra persona — lo que el propio `dueno.ts`
describe como lo peor que puede pasar. Por eso **los dos roles arrancan sin
escribir nada de lo que ya existe**, y la prueba lo exige explícitamente.
Tocar `esRolAcotado` para incluirlos no es la solución barata que parece:
dejaría a un `sac` sin `asesor_nombre` con 403 en sus propias escrituras,
porque ese candado falla cerrado.

**El otro hallazgo, del mismo tipo que el de los sellos `generado`:**
`app/admin/usuarios/page.tsx` llevaba las listas de roles tecleadas dentro de
dos `options={[...]}`. Son literales: **no fallan al compilar**. Los dos roles
nuevos habrían existido en el tipo, en el CHECK y en el middleware, y aun así no
habrían aparecido en la única pantalla que sirve para asignarlos — sin un error
en ninguna parte. Ahora se derivan de `ROLES`.

### Cómo se verificó

- `npx tsc --noEmit` → **0 errores**.
- `npm run build` → **exit 0**, con `/admin/usuarios` en el manifiesto.
- `npm run test:roles` → **70 ok, 0 fallas**.
- **La prueba se rompió a propósito**: añadir `/api/entregas` a los `apis` de
  `activaciones` la pone en **exit 1 con las cuatro comprobaciones de la
  segregación en rojo**. Una prueba que nunca se ha visto fallar no prueba nada.
- `scripts/revisa-contraste-cpcard.py` → **162**, la línea base exacta. Los dos
  colores nuevos de la pantalla de usuarios no añadieron ni un hallazgo.

### Lo que NO se hizo, y por qué

- **La migración no se ha corrido.** Es DDL sobre `usuarios`, la tabla de los
  accesos. Se corre en el SQL Editor de Supabase, y es tu decisión.
- **Nadie tiene los roles nuevos.** Hasta que digas quién.
- **`/api/grc` queda fuera de `activaciones`**, aunque el apartado 13 del
  expediente pida el MRR: ese endpoint devuelve la facturación de la empresa
  entera, no la de una cuenta. El dato tendrá que llegar ya resuelto del lado
  del servidor. Es una decisión, no un olvido.
- **Nada de riesgo, nada de episodios, nada de `cuentas`.** Los puntos 1, 3 y 5
  siguen esperando.

---

## 10. El expediente de entrega, dentro de Activaciones 2.0 (18 nov 2026)

**La hoja sigue siendo la fuente y no se toca.** Activaciones trabaja el
`.xlsx` igual que siempre; esto se construye ENCIMA: lee lo que la hoja ya trae
y lo cruza con `cuentas`, el GRC, los contratos y los DIDs para contestar, por
activación, los 20 apartados que hay que entregar al cerrarla.

- `lib/entrega-apartados.ts` — el catálogo, **fuente única**. Lo leen la API, la
  pantalla y el guion de medición. No se copia a Python: un espejo tecleado a
  mano deja de ser espejo a la primera modificación.
- `app/api/entregas/expediente/route.ts` — el cruce.
- `components/ExpedienteEntrega.tsx` — la sección, al final de Activaciones 2.0.
- `scripts/mide-apartados-entrega.ts` — mide la hoja entera.
- `scripts/prueba-expediente-entrega.py` — prueba la respuesta contra el
  servidor: 20 apartados, estados declarados, resumen cuadrado.

### Lo que la medición dijo, y que cambió el diseño

Sobre **2,820 activaciones y 34 columnas**: la hoja **cierra 3 de los 20
apartados** (el 02, el 10 y el 15). Otros 13 los cierra otra fuente del
sistema, 3 no existen en ninguna parte y 1 no es medible. Sólo **354 de 2,820
(12.6%)** tienen esos tres completos.

**Dos «completo» falsos, cazados midiendo.** El apartado 04 (DIDs) salía
completo en 2,603 filas porque la columna `Portabilidad` dice SÍ/NO, y el 11
(plan) en las 2,820 porque `Tipo` trae texto. Ninguno de los dos es el dato que
el apartado pide. Por eso `cierraConLaHoja` se **declara apartado por apartado**
y no se deduce de «hay una columna parecida al lado»: un «falta» falso hace
trabajar de más; un «completo» falso da por ENTREGADO lo que no está, y eso es
lo que cierra un ticket.

**El contador no dice «x/20».** Tres apartados no tienen fuente y uno no es
medible: un «6/20» leería como 30% de cumplimiento y castigaría a quien entrega
por cuatro cosas que el sistema no le puede dar. Se cuenta sobre los que se
pueden contestar y los otros cuatro se dicen aparte, con palabras —y cada uno
con el texto de su ausencia, porque el mismo «—» para «no está capturado», «no
existe fuente» y «la fuente no lo mide» los vuelve indistinguibles.

### Cómo se verificó

- `npx tsc --noEmit` → **0 errores**; `npm run build` → **exit 0** con
  `/api/entregas/expediente` en el manifiesto.
- `scripts/prueba-expediente-entrega.py 162474` → **cierra**. Medexp, CID
  162474, MRR **$8,067** (la cifra que corrigió la auditoría), 6 contestados de
  16, 3 sin fuente, 1 no medible.
- **Se vio pintando en el navegador**, los 20 apartados con su pastilla de
  estado. «Lo desplegué» no es «lo están viendo».
- `scripts/revisa-contraste-cpcard.py` → **162**, la línea base exacta.

### Lo que falta, dicho por su nombre

Esto **LEE**. No escribe: ni captura los apartados que no tienen fuente (09, 12,
20), ni registra la aceptación de SAC, ni cierra nada. El candado que impide que
`activaciones` firme su propia entrega ya está puesto en `lib/permisos.ts`,
aunque el endpoint de escritura todavía no exista.

---

## 11. Cuentas que activan ≠ clientes que activan (18 nov 2026)

El encabezado del módulo cuenta activaciones y se lee como si contara clientes.
No son lo mismo, y la diferencia tiene consecuencias: **un cliente con cuatro
cuentas entró como cuatro altas y sale de la cartera como una baja.**

### Las tres cifras, y lo que vale cada una

| cifra | valor | qué es |
|---|---|---|
| cuentas activadas | **2,820** | IDs únicos. **Exacta.** |
| clientes distintos | **2,750** | agrupando por el nombre tecleado. **Estimación.** |
| clientes con más de una cuenta | **56** | 118 cuentas, el 4.2% |

**La cifra de clientes es un techo, no un censo.** La hoja no trae
identificador de cliente: sólo el nombre escrito a mano. Se agrupa ignorando
mayúsculas, acentos, puntuación y el sufijo de razón social, lo que cose
«ACACIA CAFÉ» con «Acacia Café» —23 clientes estaban escritos de más de una
forma— pero **no puede coser «Medexp» con «Medicall Expert»**, que no se
parecen como texto. El número real de clientes es **ése o menos, nunca más**, y
el método se publica pegado a la cifra para que nadie la cite después como si
fuera un censo.

Aparte quedan **8 cuentas cuyo nombre de cliente es el propio número de
activación** (`cpNNNNNN`): no son clientes distintos, son nombres sin capturar.
Contarlos habría inflado la cifra con un cliente ficticio por fila.

### La diferencia con dientes: activar no es entrar a la cartera

De las **204 cuentas de cartera** que el GRC identifica por CID, sólo **81**
aparecen en esta hoja; las otras **123 no están**. Las dos listas apenas se
tocan y **ninguna se deriva de la otra**: la hoja de Activaciones no es el
censo de clientes.

**El límite de ese cruce, dicho antes de que alguien lo cite mal:** en el GRC
sólo traen CID las filas de cartera —222 de 3,670 filas, que son 204 cuentas—,
así que esto mide **pertenencia a la cartera, no supervivencia**. Una
activación fuera de esa lista puede estar facturando igual. Leer «2,739 no son
de cartera» como «2,739 se fueron» sería una cifra falsa y alarmante.

### Dónde quedó construido

- `lib/clientes-activacion.ts` — la agrupación, **fuente única**: la comparten
  la pantalla y el guion de medición.
- `components/CuentasVsClientes.tsx` — la sección, antes del expediente.
- `scripts/mide-cliente-vs-cuenta.ts` (`npm run mide:clientes`) — la medición,
  con cierre comprobado en cada reparto.
- **En el expediente**: al abrir una cuenta de un cliente con varias, avisa
  *«esta cuenta es una de 4»* y ofrece las otras. Ahí la diferencia deja de ser
  una estadística: el expediente se entrega **por cuenta** —cada una tiene su
  ticket, sus DIDs y su aceptación— y quien lo lee tiene que saber que está
  viendo una parte del cliente.

**Un descuadre propio, corregido:** el guion imprimía 222 (filas con CID) y
repartía sobre 204 (CIDs distintos), así que 81 + 123 no cerraba contra el total
impreso. Ahora imprime las dos cifras y comprueba el cierre.

---

## 12. Los tres puntos que quedaban, clasificados y trabajados (18 nov 2026)

La pregunta era cuántos de los tres restantes se parecen a los dos que ya se
cerraron. Lo que hizo trabajables al **2** y al **4** fue esto: no necesitaban
una credencial nueva, no ejecutaban nada irreversible, y se podían **verificar**
— el 4 se contestó midiendo (tres HTTP 504) y el 2 se entregó como artefacto
con comprobaciones previas para que lo corriera él.

Con ese criterio: **dos de los tres se parecen, y los dos quedaron trabajados.
El tercero no se parece, y se dice por qué.**

### Punto 1 — el candado del `MOTOR_RIESGO.md`: **HECHO lo que no dependía de la respuesta**

La decisión sigue siendo tuya. Pero el trabajo que esconde **no necesita que se
levante el candado**, y lo dice el propio documento (§ «Lo que falta»):

> «No hay test de snapshot de los textos. Hoy nada impide que un cambio
> reescriba el `porque` de una situación sin que salte ninguna prueba. Es el
> candado más barato de los que pide el prompt y **el único que protege de
> verdad lo que declara intocable**.»

Ese candado ya existe: `scripts/test-sello-veredicto.ts` (`npm run
test:veredicto`). Sella la salida de `veredictoDe` para las **siete
situaciones** —situación, luz, dueño, acción y el `porque` **carácter a
carácter**— y **no toca `lib/alertas-veredicto.ts`**: añadir una prueba no
modifica el motor.

**Los literales no se teclearon.** Se generan con `--sella` desde el motor real.
Escribir a mano lo que el texto «debería» decir habría convertido el sello en
una segunda opinión mía sobre el texto, que es justo lo que un sello no es.

**Dos de mis siete entradas estaban mal, y el propio invariante las cazó:**

- La de `apagandose` ponía consumo 0 **y** 74 días de silencio, y el motor
  contestó `se_va`: las dos cosas juntas son su firma de baja no dicha. El caso
  sólo aísla «apagándose» con el contacto reciente.
- La cuenta «base sana» salía como `hay_que_mostrarle`: con 3 llamadas perdidas
  y 4 tickets resueltos el motor siempre encuentra algo que enseñar. Para
  aislar `en_orden` hay que quitarle también el material de valor.

Sellarlas con la etiqueta equivocada habría dejado **dos situaciones sin
proteger y la prueba en verde**.

**Se rompió a propósito:** subir el MRR de la cuenta base de 10,000 a 11,000
pone la prueba en **exit 1 con tres textos en rojo** y el diff exacto de cada
uno. Revertido.

### Punto 3 — `DATE` → `TIMESTAMPTZ`: **MEDIDO, y es prematuro**

Se parece al 2 en la forma (yo preparo, tú corres), así que antes de entregar
DDL sobre una tabla viva se midió qué cuesta hoy el `DATE`
(`scripts/mide-costo-fecha-episodios.py`, **sólo lee**):

| medición | resultado |
|---|---|
| tipo real de las cuatro columnas | `DATE` en las cuatro, **comprobado por el formato que devuelve la API**, no leído del archivo de migración |
| episodios | 807 · **659 abiertos** |
| cerrados el mismo día que abrieron | **2 de 148** (1.4%) |
| abiertos con menos de 1 día de vida | **0 de 659** |
| **`condicion_desde` con dato** | **124 de 807 — el 15.4%** |

**El hallazgo que cambia la decisión: la columna contra la que correría el SLA
está vacía en el 84.6% de las filas.** Migrar el tipo da precisión de horas a un
reloj que, en cinco de cada seis episodios, **no tiene desde cuándo contar**. Y
en la población de hoy nada vive menos de un día.

Es el mismo patrón del punto 4: el primer problema no es el que la decisión
nombra. Allí no era la frecuencia sino que nada registraba la duración; aquí no
es el tipo de la columna sino que **`condicion_desde` no se está escribiendo**.

*(Dato al margen, medido al comprobar la antigüedad: **497 de los 659 abiertos
se abrieron el 6 oct 2026**, el día que arrancó el motor de episodios. La
«mediana de 43 días» es la edad del sistema, no la de las alertas. Citarla como
antigüedad de las alertas sería falso.)*

**Lo que propongo, y no ejecuto:** antes de la migración, arreglar quién escribe
`condicion_desde`. Si después de eso el SLA en horas sigue haciendo falta, la
migración se prepara como la de roles —atómica, con comprobación previa y con
una lectura que verifique el resultado— y la corres tú.

### Punto 5 — tickets abiertos: **NO se parece, y ya está resuelto como debe**

No se parece porque **depende de una credencial que no puedo conseguir**:
`CONECTOR_COMUNICACIONES_TOKEN` no está declarado en `.env.local` (comprobado:
20 claves, ninguna es ésa). El conector de n8n sí trae los tickets abiertos.

Pero el apartado 18 **no quedó cojo**: el expediente lo declara `no_medible`
con palabras —«el corte de Zoho Desk sólo trae tickets CERRADOS, así que
"tickets abiertos" no se puede contestar ni con cero»—, que es exactamente lo
que manda el principio 18 del prompt. Lo que falta es la credencial, y es tuya.
