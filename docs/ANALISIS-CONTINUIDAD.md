# Análisis de la política de continuidad — antes de implementar

**Fecha:** 1 Sep 2026 · **Arranque previsto:** 2 Sep 2026
**Documento normativo:** [`POLITICA-CONTINUIDAD-CARTERA.md`](./POLITICA-CONTINUIDAD-CARTERA.md)

Lectura de la especificación contra el sistema real. Cada punto está contrastado con datos
de hoy, no con supuestos.

---

## 1. Lo que ya existe y se puede reutilizar

| La política pide | Ya está construido |
|---|---|
| Prioridades P0/P1/P2 | `actividades.prioridad` existe. Hoy usa `media` (359) y `alta` (13) — hay que migrar la escala, no crear la columna |
| Expediente completo | `lib/data-gaps.ts` + la conciliación de ayer (`por_conseguir` / `por_confirmar`) |
| Adopción revisada | `adopcion_producto` con fecha; 172 de 197 cuentas activas ya evaluadas |
| Historial de churn | `AAA_GRC_2026` (736 movimientos ene–jul con `movimiento` y `clas`) y `CLIENTES_CANCELADOS` (105) |
| Auditoría de cambios | patrón ya usado en `enriquecimiento_auditoria` |
| MRR vivo | `lib/zoho-enrich.ts` (`mrr_limpio`, `ticket_limpio_promedio`) |
| Señales de consumo | cortes de facturación: % consumo, minutos, uso del panel |

---

## 2. Conflictos que hay que resolver antes de escribir código

### 2.1 El tope de 4 actividades por semana choca con las actividades automáticas

Es el conflicto más importante. La regla vigente —`LIMITE_SEMANAL = 4` en `lib/elegibilidad.ts`,
instrucción expresa de dirección— dice que cada asesor recibe **exactamente 4 actividades por
semana**. La política nueva genera, por un solo evento de cancelación, **6 actividades** (4 P1 +
2 P2). Dos cuentas en la misma semana ya triplican el tope.

**Propuesta:** separar dos naturalezas de actividad.

- **Actividades de cadencia** (las de hoy, tipo `validacion`): siguen topadas en 4 por asesor por
  semana, se liberan el lunes.
- **Actividades de evento** (las que crea un cambio de estatus): **exentas del tope**, porque son
  reactivas y una P0 no puede esperar al lunes. Se cuentan y se muestran aparte, para que el tope
  siga midiendo la carga proactiva y no se vuelva una ficción.

Sin esta separación, o el tope se rompe en silencio o los eventos no generan nada.

### 2.2 Las cuentas canceladas hoy están excluidas de SAC — la política exige lo contrario

`lib/elegibilidad.ts` bloquea, por instrucción previa, generar actividades a cuentas canceladas,
dormidas o con churn confirmado (códigos `churn_grc`, `cancelacion`, `dormida`). La política nueva
pide justo lo opuesto: al cancelar hay que crear análisis de churn, validación de preventivas y
plan de recuperación, y **no cerrar automáticamente las actividades de riesgo**.

**Propuesta:** el bloqueo deja de ser por cuenta y pasa a ser **por clase de actividad**.

- Prohibido en cuentas canceladas: `validacion`, prospección, upsell — no tiene sentido pedir datos
  de perfil a quien ya se fue.
- Obligatorio en cuentas canceladas: `analisis_perdida`, `plan_recuperacion`, `cierre_churn`.

Esto respeta el espíritu de la regla original (no molestar con captura a cuentas muertas) y cumple
la política nueva.

### 2.3 La clasificación AAA/TOP **no es un campo**: es el número consecutivo

`isTopAccount()` deriva TOP del rango del consecutivo: `F1–F46`, `D1–D38`, `C1–C43`. Hoy hay
**125 cuentas TOP** (Fátima 45, Claudia 43, Dan 37).

Eso significa que **reclasificar una cuenta exigiría cambiarle el consecutivo**, que es su
identificador visible en toda la plataforma. La política completa de reclasificación —valor
anterior/posterior, historial, aprobación— es **estructuralmente imposible** sobre este diseño.

**Propuesta:** crear un campo real `segmento` con su historial (`segmento_eventos`), sembrarlo con
el TOP actual derivado del consecutivo, y que `isTopAccount()` pase a leer el campo. El consecutivo
queda como lo que es: un identificador, no una clasificación.

### 2.4 "De AAA a Enterprise/Mid-market/SMB" mezcla dos escalas distintas

Hoy conviven tres nociones de segmento que **no son la misma escala**:

| Escala | Dónde vive | Valores |
|---|---|---|
| TOP / no TOP | derivada del consecutivo | binaria |
| AAA · AA · A · B · C | `AAA_GRC_2026.clas` (Zoho Analytics) | nivel de valor |
| Enterprise · Large · Mid-Market · SMB · Micro | `segmento_factura` de Zoho | tamaño de facturación |

Pasar "de AAA a Enterprise" no es un descenso dentro de una escala: son dos ejes diferentes. Una
cuenta puede ser AAA y Mid-Market a la vez.

**Necesito una decisión tuya:** cuál de las tres es la escala oficial para esta política. Mi
recomendación es **AAA/AA/A/B/C**, porque es la que ya usa el análisis de churn y la que da sentido
a "pérdida de categoría"; Enterprise/SMB se conserva como atributo informativo de tamaño.

### 2.5 Los KAM no pueden entrar al Dashboard

Desde la restricción de accesos del 1 Sep, solo entran tres correos. Fátima, Dan y Claudia
**están bloqueados**. Toda esta política está diseñada para que el KAM solicite, documente y
ejecute; sin acceso, el botón de cambio de estatus y el formulario no tienen usuario.

Hay que reactivarlos antes del arranque, o la política opera solo a nivel de dirección.

---

## 3. Datos que la política necesita y hoy no existen

| Dato | Situación | Propuesta |
|---|---|---|
| Estado de continuidad (12 valores) | `cuentas.estado` solo tiene 4 (`activo`, `en_riesgo`, `hibernacion`, `cancelado`) y lo consume medio sistema | Campo nuevo e independiente, derivado del último evento. No tocar `cuentas.estado` |
| MRR anterior / posterior | El MRR vive en Zoho en vivo; no hay historial | Fotografiar el MRR en el evento. Si Zoho no responde, guardar `sin dato` — nunca 0 |
| ARR | No se calcula en ninguna parte | Derivar como MRR × 12 y decirlo explícitamente, o quitarlo del formulario |
| Fecha de primera señal de riesgo | No existe | **Detectarla automáticamente** (ver §5) en vez de pedirla de memoria |
| Evidencia adjunta | No hay almacenamiento de archivos configurado | Empezar con referencia (URL, folio de ticket, id de correo). El archivo requiere habilitar Storage — **¿lo autorizas?** |
| Umbral para aprobación de Dirección | La política dice "según umbral definido" y no lo define | Ver §4 |

---

## 4. Propuesta de umbral, con los números de la cartera

Facturación activa: **$1,895,960/mes en 197 cuentas**.

| Umbral | Cuentas | Facturación cubierta |
|---|---|---|
| ≥ $5,000/mes | 123 | 97 % |
| **≥ $10,000/mes** | **60** | **74 %** |
| ≥ $20,000/mes | 12 | 40 % |
| ≥ $50,000/mes | 4 | 27 % |

**Recomendación:** Dirección aprueba cuando el MRR afectado sea **≥ $10,000/mes o la cuenta sea
AAA/TOP**. Cubre tres cuartas partes del dinero con 60 cuentas — exigente sin volverse un cuello de
botella. Con $5,000 aprobarían casi todo y el control pierde sentido.

---

## 5. Mejoras que propongo sobre la política

### 5.1 Detectar la primera señal de riesgo automáticamente

La política mide "tiempo entre primera señal y primera acción". Si la fecha la teclea el asesor,
el indicador mide su memoria, no su gestión — y nadie va a registrar una señal que lo deja mal.

El sistema ya puede detectarla sola, con fecha objetiva: caída del health score, consumo por debajo
de su media histórica, pico de tickets, ausencia de contacto más allá de la cadencia, incidencia de
pago. **Propongo un detector que escriba `senal_riesgo` con su evidencia**, y que el formulario la
muestre ya llena para que el KAM la confirme o corrija.

Esto convierte un indicador declarativo en uno medible, y de paso alimenta el "% de riesgos
detectados antes de la solicitud de baja".

### 5.2 Formulario progresivo, no 40 campos siempre

El formulario completo tiene ~40 campos. Exigirlos todos para pasar una cuenta a "riesgo de
downgrade" garantiza que se llene con basura o no se use.

**Propongo campos obligatorios por estado:**

| Estado | Mínimo obligatorio |
|---|---|
| Riesgo (cancelación o downgrade) | motivo, fuente, certeza, fecha de detección — 4 campos |
| En proceso | + monto afectado, servicios, fecha estimada, preventivas ejecutadas |
| Confirmado / Cancelada / Cerrada | **formulario completo** + causa raíz + plan de recuperación + aprobación |

La política ya apunta a esto ("nadie cambia a Cancelada sin la información obligatoria"); solo hace
falta escribir el mínimo de cada nivel.

### 5.3 Sembrar los tableros con el histórico que ya existe

Los cuatro tableros nacerían vacíos. Pero ya tenemos **736 movimientos de churn/downgrade
(ene–jul 2026)** y **105 cancelaciones** con nombre y monto.

**Propongo mapear ese histórico al catálogo de 16 causas** e insertarlo como eventos de continuidad
con estado "histórico, sin gestión documentada". Los tableros arrancan con contexto real y la
dirección ve la tendencia desde el día uno, en vez de esperar tres meses a que se llenen.

### 5.4 Un estado más y un campo que falta

- **"Migrada o consolidada"** necesita apuntar a la cuenta destino. El formulario no lo pide y sin
  eso no se puede seguir el dinero que se movió. Agregar `cuenta_destino`.
- **"Reactivada"** debería exigir evidencia objetiva: un corte nuevo con consumo > 0. Es
  verificable y evita reactivaciones optimistas.

### 5.5 Cuidado con reconstruir lo que se eliminó

El tablero "Cancelaciones y downgrades en proceso" se parece al módulo **"Alertas · Cancelación"
que me pediste eliminar** hace unos días, con el argumento de que esa información ya vive en los
módulos de Churn. La diferencia real es que el nuevo es **event-driven y auditable**, no una lista
derivada.

Mi recomendación es construirlo **dentro del módulo Churn existente**, como una pestaña de
"Eventos de continuidad", en lugar de un módulo nuevo — así no reaparece el problema que motivó
aquella eliminación.

### 5.6 "Sin causa" ya está resuelto en la política, y está bien

La regla de que una causa desconocida topa el estatus en "en proceso" y no permite cancelación
definitiva es, en mi lectura, el mejor candado de todo el documento: impide cerrar casos por
cansancio. Sugiero replicar la misma idea en el plan de recuperación — sin plan, la cancelación
queda "operativamente abierta", tal como ya dice el punto E.6.

---

## 6. Riesgos de la implementación

1. **Volumen de actividades.** Si en una semana entran cinco eventos, se generan ~30 actividades.
   Sin la separación de §2.1, el tablero semanal deja de ser legible.
2. **Doble captura.** Varios campos del formulario (segmento, MRR, servicios) ya existen en la
   ficha. Deben venir precargados y en modo lectura, no pedirse otra vez.
3. **El formulario como trámite.** El riesgo real no es técnico: es que se convierta en papeleo y
   se llene al cierre del mes en bloque. Sugiero medir *tiempo entre el evento y su registro* como
   indicador de la propia política.
4. **Sin acceso de los KAM, la política no arranca** (§2.5).

---

## 7. Lo que necesito de ti antes de arrancar

1. **Escala oficial de segmento** (§2.4): ¿AAA/AA/A/B/C, o Enterprise/Mid-Market/SMB?
2. **Umbral de aprobación de Dirección** (§4): ¿confirmas $10,000/mes o AAA/TOP?
3. **Actividades de evento exentas del tope de 4** (§2.1): ¿de acuerdo?
4. **Evidencia**: ¿basta con referencia (folio, URL, correo) o hace falta subir archivos?
5. **Acceso de los tres KAM** (§2.5): ¿se reactiva para el arranque?
6. **Vigencia de "adopción revisada"**: ¿90 días?

Con esas seis respuestas, el arranque de mañana no se detiene a medio camino.
