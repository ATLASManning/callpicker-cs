-- ═══════════════════════════════════════════════════════════════════════════
-- EL CHECK DE `alertas_episodios.condicion`, CON LA LISTA COMPLETA
--
-- Ejecutar en el SQL Editor de Supabase. Es IDEMPOTENTE.
--
-- ── POR QUÉ ─────────────────────────────────────────────────────────────────
-- La atención telefónica entra al motor de alertas el 14 oct 2026 con dos
-- tipos nuevos —`llamadas_sin_contestar` y `llamadas_perdidas_masivas`— que
-- comparten la condición `atencion`. El CHECK de la tabla no la admite, y
-- comprobado contra la base con `python scripts/revisa-check-condicion-vivo.py`:
--
--     atencion       *** EL CHECK LA RECHAZA
--
-- Sin esto, esas alertas se ven en pantalla, se ordenan por prioridad y NO
-- ABREN EPISODIO: la escritura se rechaza en silencio, así que no envejecen, no
-- acumulan recurrencia y el bloque de «qué cambió» no las puede contar. Ya
-- pasó dos veces —con `escrito` el 7 oct y con `mesa` e `importe` el 12— y las
-- dos veces el síntoma fue el mismo: alertas que llevaban semanas y el
-- diagnóstico publicando «nuevos: N» en cada corrida.
--
-- ── POR QUÉ SE REESCRIBE LA LISTA ENTERA Y NO SE AÑADE UNA ──────────────────
-- Porque el estado de la base ya no se puede leer de ningún archivo: la
-- migración original declara siete valores, `escrito` se añadió el 7 oct y
-- `mesa`/`importe` después, cada una con su propio parche. Tres fuentes para
-- una sola lista es cómo se llega aquí por cuarta vez. Esta sentencia deja el
-- CHECK con EXACTAMENTE las condiciones que declara `lib/alertas.ts`, de modo
-- que correrla de nuevo tras añadir la doceava es un copiar y pegar, no una
-- arqueología.
--
-- `trabajo` SE QUEDA aunque ya no lo emita ningún tipo: hay 69 episodios
-- abiertos con ese valor y hay que poder leerlos para cerrarlos. Quitarlo
-- declararía imposible algo que está en la base.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.alertas_episodios
  DROP CONSTRAINT IF EXISTS alertas_episodios_condicion_check;

ALTER TABLE public.alertas_episodios
  ADD CONSTRAINT alertas_episodios_condicion_check CHECK (condicion IN (
    'medicion',   -- sin_consumo_medible
    'consumo',    -- caida / desplome / consumo_cero / uso_bajo / rebasa_bolsa
    'contacto',   -- nunca_contactada / sin_interlocutor / silencio_60 / silencio_30
    'radar',      -- sin_radar
    'contactos',  -- sin_contactos
    'ficha',      -- sin_ficha / sin_datos_auditables
    'escrito',    -- baja_declarada / riesgo_escrito / reduccion_declarada
    'mesa',       -- sac_atraso_cronico / sac_fuera_sla / sac_fallas_recurrentes
    'importe',    -- sin_importe
    'atencion',   -- llamadas_sin_contestar / llamadas_perdidas_masivas
    'trabajo'     -- RETIRADA el 8 oct 2026. El valor se queda: 69 episodios
                  -- abiertos con él, y hay que poder cerrarlos.
  ));

-- ── VERIFICACIÓN ────────────────────────────────────────────────────────────
-- Las once tienen que estar. Si alguna falta, el ADD de arriba no corrió.
SELECT
  pg_get_constraintdef(oid) LIKE '%atencion%'  AS admite_atencion,
  pg_get_constraintdef(oid) LIKE '%mesa%'      AS admite_mesa,
  pg_get_constraintdef(oid) LIKE '%importe%'   AS admite_importe,
  pg_get_constraintdef(oid) LIKE '%escrito%'   AS admite_escrito,
  pg_get_constraintdef(oid) LIKE '%trabajo%'   AS admite_trabajo
FROM pg_constraint
WHERE conname = 'alertas_episodios_condicion_check';

-- Y los episodios que ya existen, por condición, para ver que no se rompió
-- ninguno al reconstruir el CHECK (un ADD CONSTRAINT valida las filas vivas:
-- si una condición de la base quedara fuera de la lista, la sentencia falla).
SELECT condicion, estado, count(*) AS n
FROM public.alertas_episodios
GROUP BY condicion, estado
ORDER BY condicion, estado;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK — devuelve el CHECK a las diez de antes del 14 oct 2026. Sólo hace
-- falta si se revierte el detector de atención telefónica; con episodios de
-- `atencion` ya escritos, la sentencia fallará al validarlos, que es lo
-- correcto: primero hay que decidir qué pasa con esos renglones.
--
-- ALTER TABLE public.alertas_episodios
--   DROP CONSTRAINT IF EXISTS alertas_episodios_condicion_check;
-- ALTER TABLE public.alertas_episodios
--   ADD CONSTRAINT alertas_episodios_condicion_check CHECK (condicion IN (
--     'medicion','consumo','contacto','radar','contactos','ficha',
--     'escrito','mesa','importe','trabajo'));
-- ═══════════════════════════════════════════════════════════════════════════
