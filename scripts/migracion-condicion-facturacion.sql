-- ════════════════════════════════════════════════════════════════════════
-- Un valor nuevo en el CHECK de `alertas_episodios.condicion`
-- 16 nov 2026 · correr en el editor SQL de Supabase
-- ════════════════════════════════════════════════════════════════════════
--
-- POR QUE
-- Entran dos alarmas que no existían (ver `lib/alertas.ts`):
--   downgrade_repetido · churn_facturado   ->  'facturacion'
--
-- Salen de `lib/grc-senal-cuenta.ts`, que deriva del GRC —mes a mes, cuenta
-- por cuenta— quién bajó su MRR y quién entró en churn. Ese dato llevaba meses
-- medido y no llegaba al motor de alertas: `NOMBRES_CHURN_GRC` sólo servía
-- para BLOQUEAR actividades, así que la cuenta no avisaba, simplemente dejaba
-- de poder trabajarse.
--
-- ESTE ARCHIVO INCLUYE TAMBIEN 'atencion', QUE SIGUE PENDIENTE desde el 14 oct
-- 2026. No es un descuido arrastrado: el CHECK se reemplaza entero, así que
-- omitirlo aquí lo BORRARÍA de la lista permitida y rompería lo que hoy sí
-- funciona. Al correr esto quedan al día las dos.
--
-- QUE PASA SI NO SE CORRE
-- Nada se rompe, y eso es a propósito. Las alarmas se detectan, salen en el
-- tablero, en la ficha y en el veredicto, y `churn_facturado` cuenta en el KPI
-- «En Riesgo» igual. Lo único que no ocurre es que se abra su EPISODIO —la
-- memoria de «desde cuándo lleva así»—, porque la base rechaza el valor con el
-- código 23514.
--
-- Y NO FALLA EN SILENCIO: `lib/alertas-episodios.ts` recoge el error, lo
-- publica en `falla` y pone `nuevos` en 0 en vez de reportar el intento.
--
-- COMPROBAR DESPUES con `python scripts/verifica-check-condicion.py`, que
-- exige el código 23514 y con cualquier otro dice «no concluyente» en vez de
-- acusar.

ALTER TABLE alertas_episodios DROP CONSTRAINT IF EXISTS alertas_episodios_condicion_check;

ALTER TABLE alertas_episodios ADD CONSTRAINT alertas_episodios_condicion_check
  CHECK (condicion IN (
    'medicion',    -- sin_consumo_medible
    'consumo',     -- caida / desplome / consumo_cero / uso_bajo / rebasa_bolsa
    'contacto',    -- nunca_contactada / sin_interlocutor / silencio_60 / silencio_30
    'radar',       -- sin_radar
    'contactos',   -- sin_contactos
    'ficha',       -- sin_ficha / sin_datos_auditables
    'escrito',     -- baja_declarada / riesgo_escrito / reduccion_declarada
    'trabajo',     -- RETIRADA el 8 oct 2026 con el generador SAC. El valor SE
                   -- QUEDA: hay episodios abiertos con él y hay que poder
                   -- leerlos para cerrarlos.
    'mesa',        -- sac_atraso_cronico / sac_fuera_sla / sac_fallas_recurrentes
    'importe',     -- sin_importe
    'atencion',    -- llamadas_sin_contestar / llamadas_perdidas_masivas.
                   -- PENDIENTE desde el 14 oct 2026; va aquí porque el CHECK
                   -- se reemplaza entero y omitirlo lo quitaría.
    'facturacion'  -- NUEVO 16 nov 2026. downgrade_repetido / churn_facturado.
                   -- Excluyentes en el detector —el churn gana al downgrade—
                   -- porque son la misma historia: la factura ya se movió.
  ));
