# Plan — qué se construye, en qué orden y qué no

> Fase 0. Este plan **difiere** del que propone el Prompt Master en la
> sección 16, y dice dónde y por qué. Leer antes
> [MOTOR_RIESGO.md](MOTOR_RIESGO.md) y [AUDITORIA.md](AUDITORIA.md).
>
> **Nada de esto se empieza sin tu aprobación**, que es lo que el propio
> prompt pide al cerrar la Fase 0.

---

## La idea que reordena todo el plan

El Prompt Master trata el motor de riesgo como el activo a proteger y el
Health Score como algo a mejorar. **La auditoría dice que están al revés de
como se presentan en pantalla**: el motor de riesgo acierta y el Health Score
lo contradice encima, al lado y con más superficie.

Medido: el correlato más fuerte del `health_score` es **cuántos datos tenemos
de la cuenta** (+0.348), el triple que cualquier señal del negocio — y
`fallas` y `tickets` correlacionan **en positivo**. Los cuatro bloques nacen
en 50 por `DEFAULT` y `score_pago` nunca baja de ahí.

Por eso el orden cambia: **primero se calla lo que miente, después se mide
mejor.** Añadirle dimensiones nuevas a un score cuyos insumos no existen —que
es lo que pide la sección 5 del prompt— lo haría más inventado, no menos.

---

## Fase 1 · Una sola cifra de dinero y una sola de cartera

**Por qué primero:** mientras cinco bloques digan cinco números, cualquier
cosa que construyamos encima hereda la desconfianza. Y el arreglo es pequeño.

1. `getKPIs` y `getSemaforoByAsesor` piden **`cid`** en su `select` y pasan por
   `resolverImportes`. Fuera `enrichCuentasWithZoho` como fuente de importe.
   *(`lib/supabase.ts:287` y `:319`)*
2. **Cerrar la clase, no el caso**: `resolverImportes` deja de aceptar filas
   sin `cid` en silencio. O exige la columna en el tipo, o avisa cuando
   recibe un lote donde el 100% cae a `origen:'cuentas'` — que es la firma del
   no-op. Es el mismo bug que `lib/prediccion/snapshot.ts:168` documenta desde
   el otro lado.
3. Cada bloque rotula **su universo**: «192 vivas» no es «192 activas» (son
   131 activas + 61 en riesgo), y el bloque de 222 dice que incluye dormidas.
4. Un detector `scripts/revisa-universos.py` que falle si dos bloques de la
   misma pantalla publican totales distintos.

**Criterio de cierre:** las cinco cifras de §3.1 pasan a ser una, o cada una
dice en pantalla de qué universo habla.

---

## Fase 2 · Que ninguna etiqueta mienta

Nada nuevo; sólo que lo que está escrito corresponda a lo que se cuenta.

- «Cuentas críticas · HS < 40» → el título dice el criterio real (el motor),
  no el umbral muerto. *(`DashMetricasSection.tsx:186`)*
- «En riesgo» pasa a tener **una** definición. Hoy el panel de distribución y
  la tarjeta KPI usan dos, y están a cuatro líneas una de otra.
- «Oportunidades» cuenta sólo crecimiento, reutilizando el `CRECIMIENTO` que
  ya existe en `alertas-estado.ts:75`. El tacómetro deja de contar la columna
  de captura manual que el propio comentario declara muerta.
- «Saludables» deja de sumar dos bandas bajo el nombre de una.
- **Un solo juego de cortes de semáforo.** Hoy hay tres.
- «Sin contacto» deja de significar tres cosas: **«Sin persona de contacto»**
  (captura) y **«Nunca contactada»** (relación).
- El KPI de «más de 30 días sin contacto» separa el plazo del hueco: **47
  vencidas y 101 no medidas**, no 148 en un cubo.

**Criterio de cierre:** ninguna etiqueta de la portada se puede desmentir
midiendo su propio dato.

---

## Fase 3 · El dinero se cuenta una vez, y el contacto tiene un reloj

- **Candidatura primaria** con precedencia —Estabilizar → Blindaje →
  Reactivación → Ampliación → Escalón → Cross-sell—, como propone §3.5 del
  prompt. Las demás se muestran, no suman. *(hoy: 264 candidaturas sobre 192
  cuentas, $3,454,125 = 1.56× la cartera)*
- **`ultima_actividad` separada de `ultimo_contacto_real`**, las dos con su
  etiqueta, y la columna `ultimo_contacto` deja de leerse cruda en las
  pantallas. *(hoy: 50 cuentas con fecha en la columna que el motor declara
  «nunca contactada»)*
- Arreglar el `??` de `lib/estado-cuenta.ts:152`: es un *fallback* donde hacía
  falta un *máximo*. 13 fichas se pintan en rojo contra su propio dato.
- El centinela `'0'` de Zoho en `observaciones_kam` se normaliza **en un solo
  sitio**. Hoy un lado lo acepta y otro lo rechaza: 19 cuentas, $152,614.

---

## Fase 4 · Blindar el motor antes de tocarlo (§2-BIS del prompt)

Esto es lo que el prompt pide y **comparto entero**, con los nombres reales:

- **Test de snapshot de los siete guiones** de `lib/alertas-guion.ts` y de los
  textos de `veredictoDe`. Es el candado más barato y el único que protege de
  verdad lo que el prompt declara intocable. Hoy nada impide que un cambio
  reescriba el `porque` de una situación sin que salte ninguna prueba.
- **`VERSION` del motor** en la respuesta de la API, como ya la tiene
  `/api/alertas/veredictos`.
- Resolver el **desfase de `MIN_FUENTES`**: el prompt dice «3 de 8 o menos»,
  el código hace `< 3`. Hoy caen 8 cuentas; con la regla del prompt, 20.
  **Decisión tuya.**
- La tarjeta de juicio ya se renderiza primero en la ficha y ya hay **una sola
  función** que la alimenta. Eso del prompt ya se cumple.

**Lo que NO hago sin que lo pidas:** tocar umbrales, pesos, textos o el orden
de las compuertas. Cada uno de esos números costó una medición que está
escrita en el código.

---

## Fase 5 · Que el estado de la cuenta mande sobre el número

Aquí está el hallazgo más grave de la auditoría y merece fase propia.

**Polak Grupo es una baja confirmada desde el 10-sep-2026** —contrato firmado
con Zoom Phone, causa raíz interna de Callpicker— y treinta días después el
tablero la cuenta como cartera viva, la pinta amarilla y le dice al asesor
«pedir el Excel de llamadas». El motor **no lee el `estado` del expediente de
auditoría ni una palabra de su texto**: sólo el booleano `tieneAuditoria`.

- El `estado` del expediente entra al motor. Una cuenta con baja confirmada no
  puede salir amarilla ni pedir levantamiento de datos.
- La nota del KAM deja de sumar puntos de relación **por existir**.
  `lib/relacionamiento.ts:193` nunca lee el contenido, y el de Polak dice *«No
  me atiende llamada, correo ni whatsapp desde junio 2026»*: la prueba del
  abandono entra como evidencia de relación.
- «Sólido» exige mínimos por bloque, no sólo un umbral global. Hoy 47 de los
  73 puntos de Polak se llenan sin hablar con nadie del cliente.
- El rótulo **«MRR $1,345,140»** se corrige: es el acumulado de 56 meses, no
  el MRR.

---

## Fase 6 · El Health Score, por fin

**Después** de las anteriores, y en este orden:

1. **Primero los insumos.** Mientras `score_pago` nunca baje de 50 y 67
   cuentas tengan tres bloques en el valor por omisión, cualquier
   reponderación mueve ruido. Hay que decidir, bloque por bloque, de dónde
   sale el dato o si se declara no medido.
2. **Un score medido por debajo del 60% no muestra número** — lo pide el
   prompt y es exactamente la regla de [[feedback-cero-sin-medicion]] que este
   proyecto ya aplica en otros sitios. Esto se puede hacer **ya**, antes que
   nada de lo demás de esta fase, y es lo que más mejora la pantalla por línea
   cambiada.
3. **Tickets y fallas tienen que poder bajar el score.** Hoy no existe
   ninguna ruta de código de ahí al número, y correlacionan en positivo.
4. **Un solo score por cuenta.** Hoy conviven el de `lib/health-score.ts`
   (Actividad 35 · Adopción 30 · Pago 20 · Relacional 15) y el de
   `HealthScoreDiagnostico.tsx` (Antigüedad 5 · Información 10 · Pagos 20…).
   Son dos modelos, y son los dos números que la ficha de Polak muestra a la
   vez.

Las siete dimensiones nuevas de la §5 del prompt entran **cuando sus insumos
existan**, no antes.

---

## Lo que dejo fuera, y por qué

| Del prompt | Qué hago |
|---|---|
| `assessAccount`, `signal_config`, `scorecard_versions`, `diagnosis_templates`, `/admin/scorecard`, «La soltamos» | **No existen.** Adopto la intención con los nombres reales. Inventar un vocabulario paralelo al del código es cómo se acaba con dos de todo. |
| Módulo SAC completo (§9) | **Reconciliar primero.** `actividades_sac` devuelve 404: el generador se retiró el 8 oct por instrucción tuya, y la §9 lo reconstruye. Dime si se revive o si el SAC se arma sólo sobre Zoho Desk. |
| Health Score v2 de 7 dimensiones (§5) | **Después de los insumos.** Ver Fase 6. |
| Las ~15 tablas nuevas (§13) | **Cuando una pantalla las necesite.** Crear quince tablas por adelantado es quince formas de desincronizarse antes de que nadie las lea. |
| `npm run build`, lint, Lighthouse ≥ 90 (§16.10) | **No se pueden correr aquí**: no hay Node en esta máquina. La puerta de calidad son los doce detectores de `scripts/`, la medición en Python y la sonda a producción. |
| CTAs, Playbooks, Mi día, Success Plans, RLS por rol (§10, §12) | **Son el producto, no el arreglo.** Van después de que el tablero diga una sola verdad. |

---

## Las pruebas de aceptación (§15 del prompt, adoptadas)

Convertir la auditoría en pruebas es la mejor idea del prompt. Las cinco que
pide, más las que salieron de medir:

- [ ] MRR y número de cuentas idénticos en todos los bloques.
- [ ] Ninguna etiqueta «HS < 40» con valores ≥ 40.
- [ ] Las candidaturas primarias no suman más que la cartera.
- [ ] INBROTEK no aparece como la más saludable.
- [ ] TORRES CORZO está en el top 3 de prioridad.
- [ ] Ninguna cuenta con baja confirmada en el expediente sale como cartera viva.
- [ ] Ninguna cuenta con fecha de contacto real sale como «nunca contactada».
- [ ] Ningún score con cobertura < 60% muestra número.

Los doce casos semilla quedan verificados en [AUDITORIA.md](AUDITORIA.md): los
doce existen, sus MRR coinciden con el motor, y cuatro tienen el asesor o la
evidencia distintos de lo que afirma el prompt — hay que corregir la tabla del
§15 antes de usarla como fixture, o las pruebas nacerían contra datos falsos.

---

## Lo que necesito de ti para arrancar

1. **`MIN_FUENTES`**: ¿2 o menos (el código) o 3 o menos (el prompt)?
2. **El SAC**: ¿se revive `actividades_sac` o se arma sólo sobre Zoho Desk?
3. **Polak Grupo y las bajas confirmadas**: ¿el `estado` del expediente de
   auditoría manda sobre `cuentas.estado`? Hay una baja firmada hace un mes
   contada como cartera viva, y no la toco sin que lo digas —
   [[feedback-conciliacion-churn]]: ninguna baja sin autorización.
4. **El orden**: propongo Fases 1→3 antes que nada del producto nuevo. Si
   prefieres ver antes la Account 360 o el SAC, se cambia — pero entonces se
   construye sobre cifras que hoy se contradicen.
