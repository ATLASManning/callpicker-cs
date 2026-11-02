-- ═══════════════════════════════════════════════════════════════════════════
-- EL CHECK DE `seguimientos.tipo`, CON LA LISTA COMPLETA
--
-- Ejecutar en el SQL Editor de Supabase. Es IDEMPOTENTE.
--
-- ── POR QUÉ ─────────────────────────────────────────────────────────────────
-- El 2 nov 2026 dirección pidió que «Solicitud de cancelación» fuera una opción
-- del combo de Seguimiento KAM, con el formato oficial ligado a la cuenta y con
-- la acción que se hizo para evitar la baja o el downgrade.
--
-- La columna lleva CHECK y NO admite el valor nuevo. Comprobado contra la base
-- con `python scripts/revisa-check-tipo-seguimiento.py`:
--
--     solicitud_cancelacion    *** RECHAZADO
--     23514 · new row for relation "seguimientos" violates check constraint
--             "seguimientos_tipo_check"
--
-- Sin esto, el combo ofrece la opción, el asesor la elige, escribe la gestión
-- —y el guardado falla—. Es el mismo fallo que el CHECK de `alertas_episodios`
-- cobró TRES veces (`escrito`, `mesa`/`importe`, `atencion`): la pantalla
-- ofreciendo algo que la base rechaza.
--
-- `resultado` NO lleva CHECK: los cinco resultados nuevos de la solicitud
-- —`en_negociacion`, `retenida`, `downgrade_negociado`,
-- `cancelacion_confirmada`, `pendiente`— ya entran hoy. Probado uno por uno en
-- el mismo guion, y con control negativo: la columna `tipo` sí rechaza un valor
-- inventado, así que sus «ok» no son de una columna que acepta cualquier cosa.
--
-- ── POR QUÉ SE REESCRIBE LA LISTA ENTERA ────────────────────────────────────
-- Igual que en `migracion-condicion-atencion.sql`: con un parche por valor, el
-- estado de la base deja de poder leerse de ningún archivo. Esta sentencia deja
-- el CHECK con EXACTAMENTE los nueve tipos que declara `lib/types.ts` y ofrece
-- `lib/seguimiento-tipos.ts`, de modo que añadir el décimo sea copiar y pegar.
--
-- Las filas vivas caben: al 2 nov 2026 la tabla tiene 480 seguimientos con
-- siete tipos distintos —nota 204, llamada 90, whatsapp 62, email 48, ticket
-- 41, reunion 33, upsell 2— y los siete están en la lista. `demo` no tiene
-- ninguna todavía y se conserva porque el combo lo ofrece.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.seguimientos
  DROP CONSTRAINT IF EXISTS seguimientos_tipo_check;

ALTER TABLE public.seguimientos
  ADD CONSTRAINT seguimientos_tipo_check CHECK (tipo IN (
    'llamada',
    'whatsapp',
    'email',
    'reunion',
    'ticket',
    'nota',
    'demo',
    'upsell',
    'solicitud_cancelacion'   -- 2 nov 2026. No es un canal: es lo que pasó.
  ));

-- ── VERIFICACIÓN ────────────────────────────────────────────────────────────
--
-- `una_sola` es la que de verdad importa. El nombre de la restricción se
-- comprobó contra la base provocando el rechazo y leyendo el cuerpo del error,
-- porque PostgREST no expone `pg_constraint`. Si no coincidiera, el DROP no
-- borraría nada, el ADD crearía una SEGUNDA restricción y la vieja seguiría
-- rechazando el tipo nuevo: todo en verde y nada cambiado.
SELECT
  count(*) = 1                                                        AS una_sola,
  bool_and(pg_get_constraintdef(c.oid) LIKE '%solicitud_cancelacion%') AS admite_solicitud,
  bool_and(pg_get_constraintdef(c.oid) LIKE '%llamada%')              AS admite_llamada,
  bool_and(pg_get_constraintdef(c.oid) LIKE '%upsell%')               AS admite_upsell,
  bool_and(pg_get_constraintdef(c.oid) NOT LIKE '%inventado%')        AS rechaza_lo_demas,
  string_agg(c.conname, ', ')                                         AS nombre
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
WHERE c.conrelid = 'public.seguimientos'::regclass
  AND c.contype  = 'c'
  AND array_length(c.conkey, 1) = 1
  AND a.attname  = 'tipo';

-- Y lo que hay guardado, por tipo, para ver que no se quedó nada fuera (un
-- ADD CONSTRAINT valida las filas vivas: si un tipo de la base no estuviera en
-- la lista, la sentencia de arriba falla, que es lo correcto).
SELECT tipo, count(*) AS n
FROM public.seguimientos
GROUP BY tipo
ORDER BY n DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK — devuelve el CHECK a los ocho de antes del 2 nov 2026. Con
-- solicitudes ya registradas la sentencia FALLARÁ al validarlas, que es lo
-- correcto: primero hay que decidir qué pasa con esos renglones, porque cada
-- uno documenta una cuenta que pidió irse.
--
-- ALTER TABLE public.seguimientos
--   DROP CONSTRAINT IF EXISTS seguimientos_tipo_check;
-- ALTER TABLE public.seguimientos
--   ADD CONSTRAINT seguimientos_tipo_check CHECK (tipo IN (
--     'llamada','whatsapp','email','reunion','ticket','nota','demo','upsell'));
-- ═══════════════════════════════════════════════════════════════════════════
