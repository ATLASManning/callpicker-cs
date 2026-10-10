# El motor de análisis de riesgo por cuenta

> Fase 0 del Prompt Master v2. Este documento describe **lo que el motor hace
> hoy**, no lo que debería hacer. Se escribió antes de tocar nada, que es el
> requisito de la fase, y es la referencia contra la que se juzga cualquier
> cambio posterior.
>
> **El Prompt Master lo declara intocable sin solicitud expresa de José Manuel
> Delgadillo.** Lo que sigue es, por tanto, el inventario de lo que está bajo
> ese candado.

Sello de la lectura: 9 oct 2026, commit `d213e1f`, 192 cuentas vivas.

---

## 0. Primero, el mapa de nombres

El Prompt Master nombra piezas que **no existen con ese nombre**, y eso importa
porque un plan escrito sobre nombres inventados produce un PR que no compila.

| El Prompt Master dice | En el código es | Existe |
|---|---|---|
| `assessAccount(accountId)` | `veredictoDe(e: EstadoCuenta)` en `lib/alertas-veredicto.ts:306` | con otro nombre |
| la tarjeta de juicio | `components/CuentaVeredicto.tsx` + `lib/alertas-guion.ts` | sí |
| `lib/diagnosis/templates/*.ts` | `lib/alertas-guion.ts` (`GUIONES`, 7 plantillas) | con otra ruta |
| `signal_config` | — | **no** |
| `scorecard_versions` | — | **no** |
| `diagnosis_templates` | — | **no** |
| `/admin/scorecard` | — | **no** |
| familia «La soltamos» | — | **no**. Hay siete situaciones, y no incluye ésa |
| `RISK_ENGINE_OWNER_EMAIL` | — | **no** |

Las siete situaciones reales, en el orden del catálogo (`SITUACION`,
`lib/alertas-veredicto.ts:548`):

`se_va` · `apagandose` · `no_la_vemos` · `sin_auditar` · `hay_que_mostrarle`
· `oportunidad` · `en_orden`

---

## 1. Dónde vive

| Archivo | Líneas | Qué hace |
|---|---|---|
| `lib/alertas.ts` | 644 | **El CATÁLOGO.** Los 18 tipos de alerta con su familia, severidad, dueño, título, acción y enlace. Más `resumir()`, `riesgoPorCuenta()` y `TIPOS_RIESGO`. |
| `lib/alertas-detectar.ts` | 493 | **El detector.** Lee las fuentes y emite las alertas del catálogo con su evidencia cuantificada. |
| `lib/alertas-estado.ts` | 354 | **El recolector.** Reúne las ocho fuentes por cuenta y arma el `EstadoCuenta`. Expone `veredictosDeCartera()`. |
| `lib/alertas-veredicto.ts` | 584 | **El juez.** `hallazgosDe()` y `veredictoDe()`. Aquí están las compuertas y los umbrales. |
| `lib/alertas-guion.ts` | 487 | **El guion de llamada.** Siete plantillas con marcas que se rellenan, y la regla de que una línea con marca sin dato se BORRA. |
| `lib/candidatos-cartera.ts` | 219 | **La candidatura.** A qué es candidata cada cuenta. |
| `components/CuentaVeredicto.tsx` | 248 | **La tarjeta** en la ficha de cuenta. |
| `lib/health-score.ts` | 145 | El Health Score, que es **otra cosa** y está subordinado — ver §7. |

---

## 2. El flujo, de la fuente al veredicto

```
veredictosDeCartera(filtro?)                      lib/alertas-estado.ts:140
  ├─ supabase.cuentas   (estado activo|en_riesgo)
  ├─ mapaFacturacion()        ─┐
  ├─ ultimoContactoEfectivo() │  en paralelo
  ├─ todosLosCortes()         │
  ├─ detectarAlertas()        │  ← emite las alertas del CATÁLOGO
  ├─ relacionamientoDeCuentas()┘
  ├─ topDeCartera()              ← las 25 de mayor MRR de la EMPRESA
  ├─ candidatosDeCartera()
  │
  └─ por cada cuenta:
       EstadoCuenta  ───►  veredictoDe(e)  ───►  Veredicto
                              └─ hallazgosDe(e)
```

`Veredicto` = `{ situacion, luz, accion, dueno, porque, hallazgos[], pedir }`.

Cuesta **1.6–2.7 s** para las 192. Lo que pesa son las lecturas globales de
facturación y cortes, no el número de cuentas: filtrar por asesor casi no lo
baja. Por eso la portada y `/asesores` lo envuelven en `<Suspense>`.

---

## 3. Las ocho fuentes

Son el eje de «con cuánta información se está opinando». Viven en `FUENTES`
(`lib/alertas-estado.ts:77`) con su etiqueta y **a quién se le pide lo que
falta** — eso último es lo que convierte el hueco en trabajo.

| # | Fuente | Se considera presente cuando | A quién se le pide |
|---|---|---|---|
| 1 | facturación | `mrr !== null` | viene de GRC; si falta, el CID no cruza |
| 2 | consumo | hay corte y no es `sin_medicion` | Ingeniería — incluir el CID en cortes |
| 3 | llamadas | hay lectura de llamadas del CID | el asesor — el Excel de entrantes y salientes |
| 4 | tickets | `tk.total > 0` | la mesa; o la cuenta no pasa por ella |
| 5 | reuniones | hay al menos una registrada | el asesor — registrarla cuando ocurre |
| 6 | contacto | hay un contacto por canal REAL | el asesor — llamada, correo, WhatsApp o reunión |
| 7 | auditoría | existe caso de auditoría por `consecutivo` | el asesor — escribir el análisis |
| 8 | ficha | `observaciones_kam` no vacío | el asesor — las observaciones del KAM |

`datos.fuentes` es el **conteo**, y se DERIVA de `datos.fuentesDetalle`: son el
mismo hecho y no pueden divergir.

**Reparto real hoy** (1/8 → 8/8): 3 · 5 · 12 · 63 · 51 · 41 · 11 · 6.
Mediana 5 de 8. Ninguna cuenta llega a 0/8.

---

## 4. `hallazgosDe()` — las tres clases de hallazgo

Dirección las nombró así: **riesgo** (el cliente se está yendo), **entrega**
(lo que se le puede mostrar) y **análisis** (lo que nos falta a nosotros).

Entran de dos sitios:

1. **Las alertas del catálogo**, cada una en su clase según su FAMILIA
   (`riesgo` → riesgo · `oportunidad` → entrega · `ceguera` → análisis).
   Antes entraban todas como riesgo y se veía: el guion de una cuenta citaba
   «Sin una sola respuesta de Radar» como su amenaza más grave cuando lo que
   la tenía a punto de irse era una frase escrita por su asesor.
2. **Comprobaciones propias del veredicto**: llamadas perdidas, consumo bajo o
   al límite, falta de lectura de llamadas, de consumo, de auditoría, de
   historial de conversaciones, de paso por la mesa, de reuniones; fallas
   registradas y relación sin construir.

### El mapa `GEMELA` — un hecho se dice una vez

Dos comprobaciones propias repetían con otras palabras algo que el catálogo ya
había dicho. Medido el 8 oct 2026: **142 fichas afirmando lo mismo dos veces**,
y dos barras gemelas en cualquier gráfica que agregue por hallazgo.

```
'No hay medición de consumo'       se calla si ya está 'No podemos ver su consumo'
'Sin historial de conversaciones'  se calla si ya está 'Nunca se le ha contactado'
```

**No se borra la comprobación, se calla cuando su gemela ya habló.** Las 8
cuentas que tienen el hueco de contacto sin que la alerta de riesgo haya
disparado lo siguen diciendo, porque ahí nadie más lo dice.
1,656 → 1,515 hallazgos; de 8.6 a 7.9 por cuenta.

**26 títulos distintos**, de plantilla fija (sólo dos llevan dígitos, y son
umbrales: «Más de 30 días sin contacto», «Más de 60 días»).

---

## 5. `veredictoDe()` — las ocho compuertas, en orden

**Gana la PRIMERA que aplica. No se suman puntos.** El orden es el de la
urgencia, para que el asesor lea de arriba abajo sin decidir él qué es peor.

| # | Situación | Condición exacta | Luz |
|---|---|---|---|
| 1 | `se_va` | hay alerta de `SALIDA` (`baja_declarada`, `riesgo_escrito`, `reduccion_declarada`) | rojo |
| 1b | `se_va` | `consumoCero` **y** `diasSinContacto >= 60` | rojo |
| 2 | `apagandose` | `consumoCero` **o** (`consumoPct < 10` **y** `diasSinContacto >= 60`) | naranja |
| 2b | `apagandose` | `diasSinContacto >= 90` | naranja |
| 3 | `no_la_vemos` | `fuentes < 3` | amarillo |
| 3b | `no_la_vemos` | `!tieneLlamadas` **o** `consumoPct === null` | amarillo |
| 4 | `sin_auditar` | `!tieneAuditoria` | amarillo |
| 5 | `oportunidad` | hay `candidatura` **y** no hay alerta de familia `riesgo` viva | verde |
| 6 | `hay_que_mostrarle` | hay 2 o más hallazgos de clase `entrega` | azul |
| 7 | `apagandose` | queda alguna alerta de riesgo viva y nada que enseñar | naranja |
| 8 | `en_orden` | nada de lo anterior | verde |

**Umbrales** (`lib/alertas-veredicto.ts:132`): `UMBRAL_SILENCIO = 60` ·
`UMBRAL_SILENCIO_GRAVE = 90` · `UMBRAL_CONSUMO_BAJO = 10` ·
`MIN_FUENTES = 3`.

> **Desfase con el Prompt Master.** El prompt dice «con 3 de 8 o menos no se
> emite juicio». El código hace `fuentes < 3`, o sea **con 2 o menos**. Son
> cosas distintas: hoy 8 cuentas caen por la compuerta 3, y con el umbral del
> prompt serían 20. Hay que decidir cuál es la regla; no es un detalle de
> redacción.

### Tres decisiones de orden que costaron medición, y no se tocan sin saberlo

- **El riesgo lo decide el CATÁLOGO, no un umbral escrito aparte.** Las
  compuertas tuvieron una vez sus propios números y se separaron de los que de
  verdad emiten las alertas: el detector dispara `silencio_60` a los 60 días y
  la compuerta pedía 90, así que el tramo 61–89 se colaba entero. Resultado
  medido: VAEO salía en VERDE diciendo «sin señal de riesgo» con dos alertas
  críticas listadas en rojo en su misma tarjeta. Lo arregla `riesgoVivo`, que
  pregunta `a.familia === 'riesgo'`.
- **`oportunidad` va ANTES que `hay_que_mostrarle`.** Estaba detrás y era
  inalcanzable: el reparto se agotaba en las cinco primeras compuertas
  (6+22+71+81+12 = 192) y `oportunidad` salía CERO, no por falta de datos —86
  cuentas traen candidatura— sino porque «hay dos cosas que mostrarle» lo
  cumple casi cualquier cuenta sana.
- **`sin_auditar` va DESPUÉS de los entregables en la redacción, no antes.**
  De las 88 cuentas sin auditoría, 69 (78%, $518,372) ya tenían dos o más
  hallazgos entregables: a ésas no se les manda «escribe un documento», se les
  manda escribirlo CON eso y llevárselo.

### La trampa que hay que conocer antes de leer cualquier gráfica

**«No la vemos» es el cubo peor medido POR DEFINICIÓN.** Las compuertas 3 y 3b
meten una cuenta ahí justamente cuando le faltan fuentes, las llamadas o el
consumo. Que su mediana de fuentes sea la más baja no es un hallazgo: es la
definición. Lo que **sí** es un hecho, y la definición no dice nada de ello:
ahí vive el **55.7% de la facturación medida** ($1,235,870 de $2,220,416).

---

## 6. El guion de llamada (`lib/alertas-guion.ts`)

Siete plantillas, una por situación, con la anatomía que el Prompt Master
describe en 2-BIS.1 y que se conserva:

`titulo` · `objetivo` · `antes[]` (antes de marcar) · `preguntas[]` (qué
preguntar, literales, en voz del asesor) · `registrar[]` (qué dejar
registrado) · `cuidado` (el error a evitar).

Marcas que se rellenan: `{empresa} {mrr} {diasSinContacto} {consumoPct}
{perdidas} {pctPerdidas} {tickets} {fallas} {reuniones} {candidatura}
{fuentes} {tituloRiesgo} {evidenciaRiesgo}`.

**Regla dura: una línea cuya marca resuelve a `null` se BORRA, nunca se
rellena.** Un hueco en el guion se convierte en invención en cuanto alguien lo
lee en voz alta frente al cliente.

---

## 7. El Health Score es OTRA COSA, y está medido al 15%

`lib/health-score.ts` promedia cuatro bloques de la tabla `cuentas`:
**Actividad 35% · Adopción 30% · Pago 20% · Relacional 15%**.

> Esto **no** coincide con lo que el Prompt Master cita de la ficha
> («Antigüedad 5%, Información 10%, Pagos 20%…»). Esa otra desagregación sale
> de `components/HealthScoreDiagnostico.tsx`, que es un segundo cálculo. **Son
> dos modelos de Health Score conviviendo**, y es la causa más probable de los
> dos números que el prompt denuncia en 2-BIS.2.

El propio archivo ya documenta el defecto central: **80 de las 192 cuentas
tienen sólo el 15% del peso con dato**, y aun así se publica un número. El
promedio de peso medido está muy por debajo de 1.

**El veredicto NO cuelga del Health Score.** Es deliberado y está escrito en
`app/alertas/page.tsx`: ese número se apoya en dato real un 58% en promedio y
ocho cuentas lo tienen 100% fabricado. Sigue siendo una señal; dejó de ser la
etiqueta.

---

## 8. Quién consume el motor

| Consumidor | Qué usa |
|---|---|
| `/alertas` | `veredictosDeCartera()` — la cola de trabajo de SAC |
| `/` (Dashboard) | `veredictosDeCartera()` → `proyectaTablero()` → las tres gráficas |
| `/asesores` | `veredictosDeCartera()` por asesor, en `ColaDeTrabajoAsesor` |
| `/cuentas/[id]` | `veredictosDeCartera({cuentaId})` → `CuentaVeredicto` + `guionDe()` |
| `/api/alertas/veredictos` | la cartera completa en JSON, con `VERSION` |
| `/api/alertas` | las alertas crudas del catálogo + `resumir()` |

**Hay una sola función y todos la llaman.** Es lo que el Prompt Master pide en
2-BIS.1 y ya se cumple — con el nombre `veredictosDeCartera`, no
`assessAccount`.

---

## 9. Lo que NO tiene, y el prompt da por hecho

- **No hay versionado ni auditoría de cambios del motor.** Los umbrales son
  constantes en el archivo; cambiarlos es un commit. No hay `signal_config`,
  ni RLS que lo proteja, ni registro de quién pidió qué.
- **No hay `/admin/scorecard`** ni pantalla de solo lectura del motor.
- **No hay test de snapshot de los textos.** Hoy nada impide que un cambio
  reescriba el `porque` de una situación sin que salte ninguna prueba. Es el
  candado más barato de los que pide el prompt y el único que protege de
  verdad lo que declara intocable.
- **No hay backtesting** contra churns reales.
- **`esTop` se arregló hoy** (`a71711a`): estaba escrito a mano como `false` en
  las 192, así que nada aguas abajo podía distinguir una cuenta grande. Ahora
  sale de `topDeCartera()`, que además da UNA definición: las 25 de mayor MRR
  de la EMPRESA, no del filtro.
- **`dueno` vale `'asesor'` en las 192.** El tipo admite `'direccion'` y
  ninguna ruta de `veredictoDe` lo produce. La «mesa de dirección» que el
  prompt describe no existe en el veredicto; sí en el catálogo de alertas,
  donde `sin_consumo_medible` tiene `dueno: 'ingenieria'`.

---

## 10. Cómo se verifica que sigue sano

```bash
python scripts/verifica-graficas-dashboard.py     # 21 invariantes de agregación
python scripts/mide-dimensiones-dashboard.py      # dispersión + «un hecho una vez»
python scripts/verifica-despliegue-vivo.py        # qué commit está sirviendo
```

El segundo trae el invariante que impide que vuelvan las gemelas: busca
títulos cuyo conjunto de cuentas esté **contenido** en el de otro, que es la
firma de una medida contada por dos caminos.

No hay Node en la máquina de trabajo: no hay `tsc` ni `next build` locales.
La verificación es por medición en Python y sonda a producción.
