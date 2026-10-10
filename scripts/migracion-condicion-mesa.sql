-- ════════════════════════════════════════════════════════════════════════
-- Dos valores nuevos en el CHECK de `alertas_episodios.condicion`
-- 9 oct 2026 · correr en el editor SQL de Supabase
-- ════════════════════════════════════════════════════════════════════════
--
-- POR QUE
-- Entran cuatro alarmas que no existían (ver `lib/alertas.ts`):
--   sac_fuera_sla · sac_atraso_cronico · sac_fallas_recurrentes  -> 'mesa'
--   sin_importe                                                  -> 'importe'
--
-- QUE PASA SI NO SE CORRE
-- Nada se rompe, y eso es a propósito. Las alarmas se detectan, salen en el
-- tablero, en la ficha y en el veredicto, y bloquean la luz verde igual. Lo
-- único que no ocurre es que se abra su EPISODIO —la memoria de «desde cuándo
-- lleva así»—, porque la base rechaza el valor con el código 23514.
--
-- Y NO FALLA EN SILENCIO: `lib/alertas-episodios.ts:229` recoge el error, lo
-- publica en `falla` y pone `nuevos` en 0 en vez de reportar el intento. Esa
-- guarda se escribió justo el día que un rechazo de la base pasó inadvertido
-- durante una jornada entera.
--
-- Así que el orden correcto es: desplegar, ver las alarmas, y correr esto
-- cuando convenga. No al revés.

ALTER TABLE alertas_episodios DROP CONSTRAINT IF EXISTS alertas_episodios_condicion_check;

ALTER TABLE alertas_episodios ADD CONSTRAINT alertas_episodios_condicion_check
  CHECK (condicion IN (
    'medicion',   -- sin_consumo_medible
    'consumo',    -- caida / desplome / consumo_cero / uso_bajo / rebasa_bolsa
    'contacto',   -- nunca_contactada / sin_interlocutor / silencio_60 / silencio_30
    'radar',      -- sin_radar
    'contactos',  -- sin_contactos
    'ficha',      -- sin_ficha
    'escrito',    -- baja_declarada / riesgo_escrito / reduccion_declarada
    'trabajo',    -- RETIRADA el 8 oct 2026 con el generador SAC. El valor SE
                  -- QUEDA: hay 69 episodios abiertos con él y hay que poder
                  -- leerlos para cerrarlos.
    'mesa',       -- NUEVO 9 oct 2026. sac_atraso_cronico / sac_fuera_sla /
                  -- sac_fallas_recurrentes. Excluyentes en el detector y en
                  -- ese orden: son la misma historia empeorando.
    'importe'     -- NUEVO 9 oct 2026. sin_importe.
  ));

-- ── COMPROBARLO AL REVÉS ────────────────────────────────────────────────
-- Una regla sólo se prueba metiéndole lo que NO debe entrar. Esto tiene que
-- FALLAR con 23514 después de correr lo de arriba; si pasa, el CHECK no está
-- puesto y la migración no sirvió de nada.
--
--   INSERT INTO alertas_episodios (cuenta_id, condicion, tipo, estado, abierto_en)
--   VALUES ('00000000-0000-0000-0000-000000000000', 'inventada', 'sin_ficha',
--           'abierta', CURRENT_DATE);
--
-- Y estas dos tienen que PASAR (bórralas después):
--
--   INSERT INTO alertas_episodios (cuenta_id, condicion, tipo, estado, abierto_en)
--   VALUES ('00000000-0000-0000-0000-000000000000', 'mesa', 'sac_fuera_sla',
--           'abierta', CURRENT_DATE);
--   DELETE FROM alertas_episodios
--    WHERE cuenta_id = '00000000-0000-0000-0000-000000000000';
--
-- `python scripts/verifica-check-condicion.py` hace justo eso desde fuera y
-- distingue el 23514 del CHECK de un 23502 de columna obligatoria, que diría
-- que la fila de prueba está mal armada y no que la base rechace el valor.
