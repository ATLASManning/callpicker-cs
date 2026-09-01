# Enriquecimiento de cuentas — arquitectura y plan

**Estado:** implementado en modo dry-run · piloto ejecutado 1 Sep 2026 sobre 6 cuentas
**Principio rector:** el proceso **jamás** escribe en la tabla `cuentas`. Todo hallazgo vive en tablas nuevas, separado del dato capturado por el KAM.

---

## 1. Diagnóstico del esquema actual

La verdad operativa vive en Supabase, tabla **`cuentas`** (218 filas al 1 Sep 2026). No existe tabla de contactos: el mapa de decisores está embebido como JSON.

| Concepto | Dónde vive hoy | Notas |
|---|---|---|
| Cuenta | `cuentas` | PK `id` (uuid), `consecutivo` (F26, C1…), `cid` (contrato Zoho) |
| KAM propietario | `cuentas.asesor` | texto: `Fátima` · `Dan` · `Claudia` |
| Contacto principal | `cuentas.contacto_nombre/_cargo/_tel/_email` | 4 columnas planas |
| Mapa de decisores | `cuentas.contactos_json` | `[{nombre, cargo, email, tel}]` |
| Perfil | `giro`, `tamano_empresa`, `total_empleados`, `num_oficinas`, `pagina_web` | texto libre |
| Satisfacción | `cuentas.nps_score` | **0 de 218 capturados** |
| Conocimiento del KAM | `cuentas.observaciones_kam`, `notas` | texto libre, propiedad operativa |
| Historial | `actividades`, `seguimientos`, `radar_respuestas` | FK `cuenta_id` |
| Huecos de perfil | `lib/data-gaps.ts` | catálogo único ya existente — se reutiliza |
| Valor "vacío" | `null`, `''` y **el literal `"0"`** | `esValorReal()` de `lib/elegibilidad.ts` ya lo resuelve — se reutiliza |

### Completitud al inicio (1 Sep 2026)

| Campo | Global | Fátima (78) | Dan (70) | Claudia (70) |
|---|---|---|---|---|
| Contacto principal | 83.5 % | 61 | 60 | 61 |
| Cargo del contacto | 63.3 % | 48 | 54 | 36 |
| Teléfono directo | 82.1 % | 60 | 59 | 60 |
| **Correo del contacto** | **32.1 %** | 23 | 25 | 22 |
| **Mapa de decisores** | **27.5 %** | 24 | 19 | 17 |
| Giro | 82.1 % | 58 | 60 | 61 |
| Tamaño | 77.1 % | 56 | 52 | 60 |
| **NPS** | **0 %** | 0 | 0 | 0 |
| Observaciones KAM | 45.9 % | 31 | 23 | 46 |
| Empleados | 73.4 % | 56 | 47 | 57 |
| Sitios | 68.8 % | 54 | 42 | 54 |
| Sitio web | 81.7 % | 58 | 60 | 60 |

Los dos huecos grandes y accionables son **correo del contacto (68 % vacío)** y **mapa de decisores (72 % con menos de 2 personas)**. NPS y Observaciones KAM quedan fuera del alcance de escritura por diseño (§4).

---

## 2. Modelo de datos aditivo

Cuatro tablas nuevas, en español para respetar la convención del proyecto. Ninguna toca `cuentas`; la relación es `cuenta_id → cuentas.id` con `ON DELETE CASCADE`.

- **`enriquecimiento_runs`** — una fila por ejecución (dry-run o real). Trazabilidad: quién, qué alcance, versiones de proveedores, resumen JSON.
- **`enriquecimiento_candidatos`** — un hallazgo por campo. Guarda el valor original *fotografiado al momento de la consulta* (`valor_original_snapshot`) junto al candidato, la evidencia, la fuente y el veredicto de comparación.
- **`enriquecimiento_decisores`** — mapa de stakeholders candidato, separado del `contactos_json` vivo.
- **`enriquecimiento_auditoria`** — bitácora inmutable de toda acción de revisión.

**Idempotencia:** índice único sobre `dedupe_key = sha1(cuenta_id | campo | valor_normalizado | fuente_host)`. Reejecutar el proceso hace `ON CONFLICT DO NOTHING` — no duplica ni pisa el estado de revisión ya dado por el KAM.

Migración: [`scripts/migracion-enriquecimiento.sql`](../scripts/migracion-enriquecimiento.sql) — aditiva, idempotente y con bloque de reversa comentado al final.

---

## 3. Flujo

```
cuentas (solo LECTURA)
   │
   ├─► proveedor: interno      (datos ya presentes mal ubicados en la propia ficha)
   ├─► proveedor: sitio_web    (fetch del dominio oficial + /contacto /nosotros /sucursales)
   ├─► proveedor: apify        (Google Maps: sucursales, teléfonos, horarios)  [requiere APIFY_API_KEY]
   └─► proveedor: busqueda_web (directorios y fuentes públicas)                [requiere SEARCH_API_KEY]
                    │
                    ▼
            normalizar()  ── compara sin alterar el original
                    ▼
            comparar()    ── coincide | complementa | conflicto | nuevo | sin_evidencia
                    ▼
            puntuar()     ── 0-100 + nivel de confianza
                    ▼
        dryRun ? reporte : INSERT en tablas de enriquecimiento
                    ▼
        Revisión humana en /enriquecimiento (RBAC por KAM)
```

**El motor nunca promueve un candidato al campo operativo.** Ni con confianza 100. La única vía de sustitución es manual, de un administrador, con confirmación explícita, y está **apagada por defecto** (env `ENRIQUECIMIENTO_PERMITIR_APLICAR`).

---

## 4. Reglas por campo

| Campo | Regla aplicada |
|---|---|
| Contacto / cargo / teléfono / correo | Solo información de negocio publicada legítimamente. Si ya hay contacto, el hallazgo entra como **candidato adicional**, nunca sustituye. |
| Correos | Prohibido construir correos por patrón. Un patrón inferido se guarda como campo `email_pattern_inferred` con estado `no_verificado` y **jamás** como `contacto_email`. |
| Mapa de decisores | Solo personas con nombre confirmado públicamente. Sin nombre → no se inventa un contacto; se deja el rol vacío y se genera pregunta para el KAM. |
| Giro | Taxonomía normalizada en `taxonomia_giro`, conservando la denominación original del KAM en el mismo registro. |
| Tamaño | Rangos comparables (micro/pequeña/mediana/grande/enterprise) respetando la taxonomía ya usada en el dashboard. |
| Empleados | Estimación o rango, con origen explícito. **Nunca** se toma el headcount de clientes o usuarios como plantilla propia. |
| Sitios | Solo ubicaciones operativas propias. Cobertura nacional, distribuidores y franquicias se registran aparte y no se suman como sitios propios. |
| Sitio web | Se valida dominio oficial; si ya existe valor, el hallazgo se registra señalando si coincide o difiere. Directorios y redes sociales solo si no hay sitio corporativo, marcados como tales. |
| **NPS** | **Fuera del alcance de escritura.** No se calcula ni se infiere desde fuentes públicas. Solo puede venir de datos internos autorizados. |
| **Observaciones KAM** | **Nunca se modifican.** Un hallazgo relevante para salud de cuenta se guarda como `insight_sugerido` en su propio registro, con evidencia y fecha. |

---

## 5. Sistema de confianza

| Puntaje | Nivel | Criterio |
|---|---|---|
| 90–100 | `confirmado` | Fuente oficial de la empresa, o ≥2 fuentes confiables coincidentes |
| 70–89 | `alta` | Fuente corporativa o directorio B2B confiable, una sola fuente |
| 40–69 | `probable` | Requiere revisión humana |
| 0–39 | `debil` | Señal de investigación; se conserva como `por_validar` |

Ningún puntaje habilita promoción automática. El umbral solo ordena la cola de revisión.

---

## 6. Fuentes, permisos y lo que falta configurar

| Proveedor | Estado | Requiere |
|---|---|---|
| `interno` | ✅ operativo | nada — lee la propia ficha |
| `sitio_web` | ✅ operativo | nada — `fetch` nativo, respeta 403/robots y no reintenta sobre bloqueo |
| `apify` | ⚠️ **código listo, sin credencial** | `APIFY_API_KEY` en Vercel. Actor sugerido `compass/crawler-google-places` (4 GB, viable en plan FREE) |
| `busqueda_web` | ⚠️ **código listo, sin credencial** | `SEARCH_API_KEY` + `SEARCH_API_URL` de un proveedor de búsqueda con términos de uso B2B |
| LinkedIn | ❌ no implementado | Solo lectura de resultados públicos vía buscador. **No** se scrapea el sitio ni se elude su autenticación |

Límites respetados: 1 request/segundo por host, máximo 4 páginas por dominio, timeout 12 s, sin reintentos ante 401/403/429, y `User-Agent` identificable.

---

## 7. Riesgos y supuestos

1. **Homonimia de marca.** Nombres genéricos ("Global Digital") no son investigables sin un ancla (dominio o RFC). El piloto lo confirmó: se devuelve `sin_evidencia` en lugar de adivinar.
2. **Confundir métrica de cliente con métrica propia.** Caso real del piloto: Velfare publica "más de 5000 colaboradores" refiriéndose a empleados de sus clientes. Regla explícita en el extractor y caso de prueba dedicado.
3. **Franquicias vs sitios propios.** Mundo Joven: el KAM registró 22 propias + 21 franquicias; el sitio dice "más de 50 oficinas". Se marca `conflicto`, nunca se sustituye.
4. **Dominios paralelos.** Grupo Rizo aparece con `.com.mx` (dashboard), `.net` y correos `@gruporizo.com` en directorios. Conflicto para revisión humana.
5. **Sitios que bloquean.** Chevrolet Aragón responde 403; no se elude. Se degrada a fuentes públicas de terceros, marcadas como tales.
6. **Acceso de los KAM.** El 1 Sep 2026 el acceso al dashboard quedó restringido a 3 correos; Fátima, Dan y Claudia **no pueden entrar hoy**. El RBAC de esta interfaz está implementado y probado, pero la revisión por KAM solo será usable cuando se reactiven sus cuentas (o la revisan los administradores).
7. **Sin Node en el entorno de desarrollo local**, las pruebas se corren en el equipo del usuario o CI con `npx ts-node`.

---

## 8. Criterios de aceptación — cómo se demuestran

| # | Criterio | Evidencia |
|---|---|---|
| 1 | Ningún campo original alterado | Hash SHA-256 de `cuentas` antes y después del piloto (idéntico) |
| 2 | Todo hallazgo con fuente, URL, fecha, proveedor, evidencia y confianza | Columnas obligatorias `NOT NULL` en `enriquecimiento_candidatos` |
| 3 | Nada se sustituye automáticamente | El servicio no importa cliente de escritura sobre `cuentas`; prueba dedicada |
| 4 | Conflictos visibles y con revisión | `matching_status='conflicto' → proposed_action='review_required'` |
| 5 | Original vs enriquecido distinguibles | Columnas separadas en UI y `valor_original_snapshot` en BD |
| 6 | Aislamiento por KAM | RBAC en `/api/enriquecimiento/candidatos` filtrando por `asesor` |
| 7 | Auditable, reanudable, idempotente | `enriquecimiento_runs` + `dedupe_key` único + `ON CONFLICT DO NOTHING` |
| 8 | Dry-run previo | `dryRun: true` por defecto; escritura requiere pedirlo explícitamente |
| 9 | Reportes por KAM | `scripts/reporte-piloto-enriquecimiento.md` |
| 10 | Pruebas de no sobrescritura | `scripts/test-enriquecimiento.ts` |
