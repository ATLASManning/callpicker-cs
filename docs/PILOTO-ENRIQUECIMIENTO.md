# Reporte del piloto de enriquecimiento — 1 Sep 2026

**Alcance:** 6 cuentas (2 por KAM), motor desplegado en producción.
**Resultado:** 13 candidatos válidos, 0 errores, 16 s de ejecución.
**Estado:** migración corrida y candidatos **persistidos**; la bandeja de revisión ya tiene contenido real (ver §9).

---

## 1. Verificación del requisito no negociable

| Prueba | Resultado |
|---|---|
| Hash SHA-256 de las 218 filas de `cuentas` antes del piloto | `b7e9a453f943f906…` |
| Hash SHA-256 después del piloto | `b7e9a453f943f906…` — **idéntico** |
| Filas antes / después | 218 / 218 |
| Tablas de enriquecimiento tras el dry-run | No existen todavía (HTTP 404): el dry-run no necesitó escribir nada |

Ningún campo, nota, contacto ni relación de ninguna cuenta fue tocado.

---

## 2. Cuentas del piloto

| KAM | Cuenta | Factura | Huecos al iniciar |
|---|---|---|---|
| Fátima | F2 Global Digital | $34,430 | 8 de 10 |
| Fátima | F7 Probemedic Distribuciones | $15,696 | 3 de 10 |
| Dan | F55 Velfare | $14,764 | **10 de 10** |
| Dan | D18 GRUPO RIZO | $9,630 | 3 de 10 |
| Claudia | C21 CS7 (Chevrolet Aragón) | $13,791 | 3 de 10 |
| Claudia | C16 Travelling (Mundo Joven) | $12,823 | 3 de 10 |

---

## 3. Candidatos por KAM

### Fátima — 6 candidatos (todos en Probemedic F7)

| Campo | Registro del KAM | Hallazgo | Tipo | Conf. |
|---|---|---|---|---|
| Correo del contacto | vacío | `ecastillo@probemedic.mx` | nuevo | 84 |
| Correo corporativo | vacío | `informacion.farmacia@probemedic.mx` | nuevo | 88 |
| Correo corporativo | vacío | `transparencia@probemedic.mx` | nuevo | 88 |
| Teléfono corporativo | vacío | `+52 81 2474 0080` | nuevo | 88 |
| Teléfono corporativo | vacío | `+52 81 1763 9974` | nuevo | 88 |
| Sitio web | `http://www.probemedic.mx` | `https://probemedic.mx` | coincide | 88 |

El correo del contacto **ya estaba en la ficha**, pegado dentro del nombre (`"Enrique Castillo ecastillo@probemedic.mx"`). El proveedor interno lo rescató sin salir a internet: es el hallazgo más barato y más confiable de todo el piloto.

### Dan — 4 candidatos (todos en GRUPO RIZO D18)

| Campo | Registro del KAM | Hallazgo | Tipo | Conf. |
|---|---|---|---|---|
| Teléfono corporativo | vacío | `+52 311 213 1650` | nuevo | **92** |
| Teléfono corporativo | vacío | `+52 33 3218 1671` | nuevo | 88 |
| Correo corporativo | vacío | `contacto@gruporizo.com.mx` | nuevo | 88 |
| Sitio web | `https://www.gruporizo.com.mx/` | `https://gruporizo.com.mx` | coincide | 88 |

El teléfono de 92 puntos salió del propio campo `contacto_tel`, que contenía dos números (`3296883581 / 3112131650`) y por lo tanto ninguno era usable como dato estructurado.

### Claudia — 3 candidatos (todos en Travelling C16)

| Campo | Registro del KAM | Hallazgo | Tipo | Conf. |
|---|---|---|---|---|
| Correo corporativo | vacío | `contacto@mundojoven.com` | nuevo | 88 |
| **No. de sitios** | `Total: 43 oficinas, propias 22 y franquicias 21` | `Más de 50 oficinas` | **conflicto** | 88 |
| Sitio web | `https://mundojoven.com/` | `https://mundojoven.com` | coincide | 88 |

**El conflicto es el caso didáctico del piloto.** El sitio dice "más de 50 oficinas"; Claudia registró 43 con un desglose que la fuente pública no tiene (22 propias + 21 franquicias). El dato del KAM es probablemente el bueno, y por eso el sistema **no lo sustituye**: lo marca `review_required` y se lo muestra a ella para que decida.

---

## 4. Dos bugs que el piloto encontró (y ya están corregidos)

La primera corrida produjo 15 candidatos; dos eran basura que habría llegado al KAM:

1. **`10 personas` como número de empleados**, extraído de *"¿Viajas más de 10 personas?"* — el tamaño de un grupo de viaje, no la plantilla de Mundo Joven.
   *Corrección:* "personas" solo cuenta si la frase la ancla a la plantilla (`somos`, `plantilla de`, `equipo de`); las preguntas de marketing se descartan; se amplió la lista de contexto ajeno.

2. **`82 sucursales`**, extraído del teléfono `(55) 54 82 82 82` que aparecía pegado a la palabra "Sucursales".
   *Corrección:* `sinTelefonos()` limpia los patrones telefónicos antes de buscar cifras.

Tras la corrección: 13 candidatos, ninguno de los dos reaparece, y el conflicto legítimo de 50 vs 43 oficinas se conserva. Ambos casos quedaron como pruebas automatizadas.

---

## 5. Lo que el motor NO pudo hacer (y por qué)

Tres de las seis cuentas no produjeron ni un candidato automático:

| Cuenta | Motivo | ¿Se puede resolver? |
|---|---|---|
| F55 Velfare | Sin sitio web registrado — el motor no tiene de dónde partir | Sí, con proveedor de búsqueda |
| F2 Global Digital | Sin sitio web registrado | No con el nombre actual (ver §7) |
| C21 CS7 | `chevroletaragon.com.mx` responde **403** al acceso automatizado | Solo por fuentes de terceros |

El acceso bloqueado **no se eludió**: el motor se detiene y lo reporta como campo no verificable, tal como exige el alcance.

### Investigación manual complementaria

Consultando fuentes públicas a mano — lo que el motor haría solo si se configura `SEARCH_API_KEY` — sí hay material valioso:

**Velfare (Dan, $14,764/mes, ficha completamente vacía)** — el hallazgo de mayor valor del piloto:
- Giro real: **bienestar corporativo / wellness empresarial**, no telecomunicaciones.
- Servicios publicados: asesoría nutricional y emocional, educación financiera, activación física, cumplimiento de NOM-035, ferias de salud, snacks saludables.
- Sitio candidato: `velfaremexico.com` · LinkedIn: `mx.linkedin.com/company/velfare` · app propia en Google Play.
- **Dato deliberadamente rechazado:** el sitio dice "más de 5000 colaboradores"; son empleados **de sus clientes**, no plantilla propia. No se propone como número de empleados.

**CS7 / Chevrolet Aragón (Claudia)** — vía resultados públicos, marcado como fuente de terceros:
- Domicilio: Av. Central Mz 1 L 6, Col. Rinconada de Aragón, Ecatepec, Edo. de México.
- Teléfonos: ventas 55-5779-9040 · servicio 55-1323-6602 · WhatsApp ventas 55-6235-2222.

**GRUPO RIZO (Dan)** — el sitio declara **3 ubicaciones propias**: Guadalajara, Puerto Vallarta y Nayarit; el campo "No. de sitios" está vacío. Un directorio de terceros muestra además la razón social `RIZO PAPELERA S.A. DE C.V.` y el dominio alterno `gruporizo.net` con correos `@gruporizo.com`: conflicto de dominio que amerita revisión.

**Probemedic (Fátima)** — presencia confirmada en Monterrey (matriz, lada 81), CDMX, Guadalajara, San Andrés Cholula, Tijuana y León: consistente con los 10 sitios que ya registró Fátima. Giro afinable de "Farmacéutica" a "Farmacias especializadas: medicamentos de patente, equipo e insumos médicos".

---

## 6. Cobertura y qué falta configurar

El motor depende hoy de que la cuenta tenga sitio web: **40 de 218 cuentas (18 %) no lo tienen** y quedarían fuera.

| Necesidad | Qué desbloquea | Estado |
|---|---|---|
| `APIFY_API_KEY` en Vercel | No. de sitios y teléfonos vía Google Maps; funciona sin sitio web | Código listo, sin credencial |
| `SEARCH_API_KEY` + `SEARCH_API_URL` | Encontrar el dominio de las 40 cuentas sin sitio; directorios; perfiles públicos | Proveedor por implementar |
| Correr `scripts/migracion-enriquecimiento.sql` | Persistir candidatos y habilitar la bandeja de revisión | Pendiente |
| Reactivar el acceso de los 3 KAM | Que Fátima, Dan y Claudia puedan revisar su propia cola | Bloqueado por la restricción de acceso del 1 Sep |

---

## 7. Conflictos y decisiones que requieren a un humano

1. **Mundo Joven: 43 vs "más de 50" oficinas** → decide Claudia. Probablemente el sitio suma puntos de venta que ella no cuenta como oficinas.
2. **Grupo Rizo: `gruporizo.com.mx` vs `gruporizo.net` y correos `@gruporizo.com`** → decide Dan cuál es el dominio operativo del contrato.
3. **Global Digital (F2, $34,430/mes)** → no es investigable: el nombre es genérico y no hay dominio, RFC ni razón social que sirva de ancla. **Es una pregunta para Fátima**, no un problema técnico: basta que capture el sitio web o la razón social para que la cuenta entre al flujo automático.

---

## 8. Propuesta de escalamiento

**Etapa 1 — inmediata, sin credenciales nuevas.** Correr la migración y procesar las **178 cuentas con sitio web** en modo real. Con la tasa del piloto (≈4 candidatos útiles por cuenta con sitio) se esperan del orden de 300–400 candidatos, la mayoría correos y teléfonos corporativos que hoy están vacíos. Lotes de 20 cuentas por corrida para no exceder el límite de 60 s de Vercel.

**Etapa 2 — con `APIFY_API_KEY`.** Añade número de sitios y teléfonos verificados, y alcanza cuentas sin página web. Costo controlado: el actor de Maps cabe en el plan gratuito.

**Etapa 3 — con proveedor de búsqueda.** Cubre las 40 cuentas sin dominio y habilita el mapa de decisores, que hoy es el hueco más grande de la cartera (72 % de las cuentas tienen menos de 2 personas registradas).

**Antes de la Etapa 1** conviene que un KAM revise a mano los ~40 candidatos de sus primeras 10 cuentas: si la precisión se sostiene como en el piloto (13 de 13 válidos tras la corrección), se escala al resto con confianza.

---

## 9. Verificación post-migración (1 Sep 2026, tras correr el SQL)

La migración se ejecutó y el piloto se repitió **en modo real** para dejar la bandeja con contenido.

| Prueba | Resultado |
|---|---|
| Las 4 tablas existen y aceptan escritura | ✅ (insert de prueba creado y eliminado) |
| Candidatos persistidos | 13, todos en estado `pendiente` |
| **Idempotencia**: la corrida se repitió una segunda vez | ✅ siguen siendo **13**, no 26; **cero** claves de deduplicación repetidas |
| Corridas registradas en `enriquecimiento_runs` | 2, ambas auditadas con su alcance y resumen |
| **Integridad de `cuentas` tras dos escrituras reales** | Hash `b7e9a453f943f906…` — **idéntico al sellado antes del piloto** |

### Aislamiento por KAM verificado en producción

| Sesión | Ve | Carteras visibles |
|---|---|---|
| Administrador | 13 candidatos | Fátima, Dan, Claudia |
| Asesor · cartera Claudia | 3 | solo Claudia |
| Asesor · cartera Claudia forzando `?asesor=Dan` | 3 | **solo Claudia** — el filtro no permite salirse |
| Asesor · cartera Dan | 4 | solo Dan |
| Asesor · cartera Fátima | 6 | solo Fátima |

Un correo fuera de la lista blanca de acceso recibe 307 antes siquiera de llegar a la API, por la restricción del 1 Sep.

### Cola inicial de revisión

| KAM | Pendientes | Conflictos |
|---|---|---|
| Fátima | 6 | 0 |
| Dan | 4 | 0 |
| Claudia | 3 | 1 (oficinas de Mundo Joven) |

---

## 10. Etapa 1 ejecutada — 173 cuentas (1 Sep 2026)

Autorizada por dirección tras el piloto. Se procesaron las cuentas **activas o en riesgo con sitio web**: 173 de las 178 con dominio (se excluyeron 4 en hibernación y 1 cancelada).

| Métrica | Resultado |
|---|---|
| Candidatos en cola de revisión | **521** |
| Cuentas con al menos un hallazgo | 164 de 173 |
| Llenan un campo hoy vacío | 359 |
| Validan un dato existente | 160 |
| Conflictos que requieren decisión | 2 |
| Claves de deduplicación repetidas | 0 |
| **Hash SHA-256 de `cuentas`** | **idéntico al inicial** |

### Reparto por KAM

| KAM | Candidatos | Cuentas | Llenan huecos | Conflictos |
|---|---|---|---|---|
| Fátima | 200 | 56 | 146 | 0 |
| Dan | 165 | 54 | 110 | 0 |
| Claudia | 156 | 54 | 103 | 2 |

### Qué se ganó, por campo

| Campo | Candidatos | Origen |
|---|---|---|
| Teléfono corporativo | 205 | sitio oficial |
| Sitio web (validación) | 157 | sitio oficial |
| Correo corporativo | 87 | sitio oficial |
| **Correo del contacto** | **67** | **interno — ya estaba en la ficha, mal ubicado** |
| No. de sitios | 4 | sitio oficial |
| No. de empleados | 1 | sitio oficial |

El dato de más valor no vino de internet: **67 correos de contacto estaban capturados dentro de otros campos** (pegados al nombre, sobre todo). Si el KAM los aprueba, la cobertura de "Correo del contacto" pasa de **70/218 (32 %) a 128/218 (59 %)** sin una sola llamada al cliente.

### Incidencias

- **3 lotes de 15 cuentas fallaron con 504**: algunos sitios corporativos responden lento y la función de Vercel corta a los 60 s. Se reprocesaron en lotes de 5 y entraron los 10 sin fallo. Las 10 corridas abortadas quedaron marcadas como `error` con su motivo, no como `en_curso`.
- **Tercer bug de precisión**, detectado por el volumen: 3 candidatos de 525 eran basura (`", tiendas"`, `", plantas"`, `"000 trabajadores"`). Causa: la captura aceptaba texto sin dígitos reales. Corregido, con pruebas, y los 4 registros afectados eliminados dejando rastro en la auditoría.
- **9 cuentas sin ningún hallazgo**: CS7 (bloquea con 403), LINEACEL (su "sitio web" es el texto *"No identificado"*), y 7 sitios que no respondieron o no publican datos extraíbles (RANCH MART, Linden, IMPAS Chihuahua, TRANSPORTES FEMA, Notaría 18, Lean Tools, Sellomatic).

### Los 2 conflictos vivos, ambos de Claudia

1. **Travelling / Mundo Joven** — el KAM registró 43 oficinas (22 propias + 21 franquicias); el sitio dice "más de 50".
2. **Agua Inmaculada** — el KAM registró "más de 1,800 sucursales/franquicias"; el sitio menciona "8 centros de distribución". Son dos cosas distintas: franquicias vs. centros propios.

---

## 11. Cobertura total y panorama comercial (1 Sep 2026)

Se completó el barrido: **las 218 cuentas** pasaron por el motor (las 45 restantes incluían 40 sin sitio web, donde solo corre el proveedor interno). Total: **536 hallazgos en 172 cuentas**.

Los datos dejaron de vivir solo en la cola de revisión: ahora aparecen en cada ficha como **"Datos generales enriquecidos"**, con fuente y fecha, junto al registro del KAM y sin sustituirlo. Atlas IA también los recibe en su dossier.

### Señales derivadas sobre la cartera

| Señal | Cuentas | Facturación implicada |
|---|---|---|
| **Ganan una vía de contacto** que no tenían | 85 | $1,138,378/mes |
| **Cross-sell**: red multi-sitio con 3+ módulos sin activar | 69 | $974,936/mes |
| **Red multi-sitio propia** (3 o más sedes) | 67 | $951,645/mes |
| **Riesgo: sin contacto localizable** | 36 | $132,215/mes |
| **Opera con franquicias o distribuidores** | 2 | $23,291/mes |

### Lectura

**Multi-sitio es la palanca de upsell más grande de la cartera.** 67 cuentas operan 3 o más sedes y suman casi $1M mensual; 69 de ellas además no tienen activados tres o más módulos. El argumento no es genérico: Grupo Torres Corzo opera ~32 sedes, Tech People ~100, ECODELI ~33, Alianza Multimarca ~38. Cada sede es un número rastreable y un grupo de extensiones que hoy no está contratado.

**Las franquicias son un modelo distinto, no una cuenta más grande.** Travelling (~50 puntos, 22 propias + 21 franquicias) y Agua Inmaculada (~1,800 franquicias) no se venden como una cuenta central: cada franquiciatario decide y paga por separado. La ficha lo marca como señal propia para que el KAM no confunda cobertura con sedes propias.

**36 cuentas no tienen forma de ser contactadas** — ni en la ficha ni en fuentes públicas. Son $132,215/mes que, si entran en proceso de baja, nadie se enteraría a tiempo. Varias ya están en riesgo o canceladas (Velfare, GVA México, Global Trust). Esta es la lista de prevención de bajas más accionable que salió del ejercicio.

### Qué ve el KAM en la ficha

Un bloque con la lectura comercial arriba (oportunidad / riesgo / dato, cada una con su siguiente paso) y los hallazgos por campo abajo, cada uno con su puntaje de confianza y enlace a la fuente. Lo que contradice al dato del KAM se muestra en rojo con la leyenda *"validar con el cliente"* — nunca corregido en automático.
