-- ═══════════════════════════════════════════════════════════════════════════
-- PRUEBAS AL REVÉS DE `migracion-alertas-sla.sql`
--
-- Una regla sólo se prueba con lo que NO debe entrar. Esto intenta hacer, por
-- SQL directo, las cuatro cosas que el encargo prohíbe. Las cuatro tienen que
-- REBOTAR. Si alguna entra, el candado no existe y la API es lo único que lo
-- sostiene — o sea, nada, porque cualquiera con la llave de servicio la rodea.
--
-- ── POR QUÉ ESTE ARCHIVO EXISTE APARTE ────────────────────────────────────
--
-- La migración traía estas pruebas comentadas al final, y la número 2 era un
-- comentario SIN SQL: decía «reprogramar sin motivo → debe violar
-- sla_reprogramacion_completa» y no había nada que correr. Cuatro pruebas
-- anunciadas, tres existentes.
--
-- Y las de la bitácora (3 y 4) tenían un fallo peor: `UPDATE ... WHERE true`
-- sobre una tabla VACÍA toca cero filas, el disparador no llega a dispararse y
-- NO DA ERROR. Recién corrida la migración, la bitácora está vacía — así que
-- las dos habrían salido «sin error» y eso se lee igual que «el candado no
-- existe», cuando en realidad no se probó nada. Aquí cada prueba SIEMBRA antes
-- lo que va a intentar romper.
--
-- ── CÓMO SE CORREN ────────────────────────────────────────────────────────
--
-- **UN BLOQUE A LA VEZ.** Cada uno termina en error A PROPÓSITO, y el editor
-- de Supabase para el lote en el primer error: pegados todos juntos, sólo
-- correría el primero.
--
-- Nada queda escrito: cada bloque es una sola sentencia `DO`, así que lo que
-- haya insertado se deshace cuando revienta.
--
-- ── CÓMO SE LEE EL RESULTADO ──────────────────────────────────────────────
--
--   · Error que dice **`violates check constraint "<nombre>"`** → el candado
--     funciona. Es el resultado BUENO.
--   · Error que empieza por **`LA PRUEBA FALLO`** → la operación prohibida
--     ENTRÓ. El candado no está.
--   · Error que empieza por **`NO SE PUDO PROBAR`** → faltan datos para montar
--     la prueba. No es un aprobado: es que no se midió. Correr el cron diario
--     primero y repetir.
--
-- El bloque 5 es el CONTROL POSITIVO y va al final: si los cuatro primeros
-- rebotan porque la tabla es inservible —y no porque los candados funcionen—,
-- éste también rebotaría. Tiene que decir `CONTROL POSITIVO OK`.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- 1 · CERRAR POR ATENCIÓN SIN EVIDENCIA
--     Esperado: violates check constraint "sla_atendida_con_evidencia"
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE ep RECORD;
BEGIN
  /* Un episodio abierto que todavía NO tenga compromiso. Si se tomara uno que
     ya lo tiene, el INSERT chocaría contra el UNIQUE de `episodio_id` y el
     error diría otra cosa: parecería una prueba pasada y sería un accidente. */
  SELECT e.* INTO ep
    FROM public.alertas_episodios e
    LEFT JOIN public.alertas_sla s ON s.episodio_id = e.id
   WHERE e.estado = 'abierta' AND s.id IS NULL
   LIMIT 1;

  /* `NOT FOUND` y no `ep IS NULL`: un RECORD de PL/pgSQL al que no se le
     asigno nada revienta con «record "ep" is not assigned yet» al leerlo, y ese
     error se confundiria con un fallo de la prueba. */
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO SE PUDO PROBAR: no hay ningun episodio abierto sin compromiso. Corre el cron diario y repite.';
  END IF;

  INSERT INTO public.alertas_sla
    (episodio_id, cuenta_id, condicion, tipo, dueno,
     severidad_base, severidad, accion_sugerida, evidencia_requerida,
     generada_en, fecha_limite,
     estado, fecha_cerrada, cierre_motivo)
  VALUES
    (ep.id, ep.cuenta_id, ep.condicion, ep.tipo, ep.dueno,
     'alta', 'alta', 'prueba al reves', ARRAY['seguimiento']::TEXT[],
     CURRENT_DATE, CURRENT_DATE,
     'cerrada', CURRENT_DATE, 'atendida');

  RAISE EXCEPTION 'LA PRUEBA FALLO: se cerro por atencion SIN evidencia. El candado sla_atendida_con_evidencia no existe.';
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 2 · REPROGRAMAR SIN MOTIVO
--     Esperado: violates check constraint "sla_reprogramacion_completa"
--     (Ésta es la que la migración anunciaba y no traía.)
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE ep RECORD;
BEGIN
  SELECT e.* INTO ep
    FROM public.alertas_episodios e
    LEFT JOIN public.alertas_sla s ON s.episodio_id = e.id
   WHERE e.estado = 'abierta' AND s.id IS NULL
   LIMIT 1;

  /* `NOT FOUND` y no `ep IS NULL`: un RECORD de PL/pgSQL al que no se le
     asigno nada revienta con «record "ep" is not assigned yet» al leerlo, y ese
     error se confundiria con un fallo de la prueba. */
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO SE PUDO PROBAR: no hay ningun episodio abierto sin compromiso. Corre el cron diario y repite.';
  END IF;

  /* `reprogramaciones = 1` sin `limite_original` ni `motivo_reprogramacion`.
     Reprogramar borrando la prueba de que se reprogramo es lo que el encargo
     prohibe: la fecha original y el motivo de 20 caracteres van juntos. */
  INSERT INTO public.alertas_sla
    (episodio_id, cuenta_id, condicion, tipo, dueno,
     severidad_base, severidad, accion_sugerida, evidencia_requerida,
     generada_en, fecha_limite, reprogramaciones)
  VALUES
    (ep.id, ep.cuenta_id, ep.condicion, ep.tipo, ep.dueno,
     'alta', 'alta', 'prueba al reves', ARRAY['seguimiento']::TEXT[],
     CURRENT_DATE, CURRENT_DATE, 1);

  RAISE EXCEPTION 'LA PRUEBA FALLO: se reprogramo sin fecha original ni motivo. El candado sla_reprogramacion_completa no existe.';
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 2bis · REPROGRAMAR CON UN MOTIVO DE ADORNO
--     El encargo pide motivo de 20 caracteres o mas. «ok» no es un motivo.
--     Esperado: violates check constraint "sla_reprogramacion_completa"
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE ep RECORD;
BEGIN
  SELECT e.* INTO ep
    FROM public.alertas_episodios e
    LEFT JOIN public.alertas_sla s ON s.episodio_id = e.id
   WHERE e.estado = 'abierta' AND s.id IS NULL
   LIMIT 1;

  /* `NOT FOUND` y no `ep IS NULL`: un RECORD de PL/pgSQL al que no se le
     asigno nada revienta con «record "ep" is not assigned yet» al leerlo, y ese
     error se confundiria con un fallo de la prueba. */
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO SE PUDO PROBAR: no hay ningun episodio abierto sin compromiso. Corre el cron diario y repite.';
  END IF;

  INSERT INTO public.alertas_sla
    (episodio_id, cuenta_id, condicion, tipo, dueno,
     severidad_base, severidad, accion_sugerida, evidencia_requerida,
     generada_en, fecha_limite,
     reprogramaciones, limite_original, motivo_reprogramacion)
  VALUES
    (ep.id, ep.cuenta_id, ep.condicion, ep.tipo, ep.dueno,
     'alta', 'alta', 'prueba al reves', ARRAY['seguimiento']::TEXT[],
     CURRENT_DATE, CURRENT_DATE,
     1, CURRENT_DATE, '   ok   ');

  RAISE EXCEPTION 'LA PRUEBA FALLO: entro una reprogramacion con motivo de dos letras. El minimo de 20 caracteres no se esta aplicando.';
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 3 · EDITAR LA BITÁCORA
--     Esperado: el disparador aborta (mensaje de `sla_bitacora_inmutable`)
-- ───────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  /* SE SIEMBRA PRIMERO. Sobre una tabla vacia el UPDATE toca cero filas, el
     disparador no se dispara y no hay error — que se lee igual que «no hay
     candado». El asiento del aviso diario es el unico que puede existir sin
     `sla_id`, asi que sirve para sembrar sin inventar un compromiso. */
  INSERT INTO public.alertas_sla_bitacora (usuario, rol, evento, detalle)
  VALUES ('prueba-al-reves', 'admin', 'notificada',
          '{"canal":"prueba","porque":"sembrado para la prueba al reves"}'::jsonb);

  UPDATE public.alertas_sla_bitacora
     SET evento = 'cerrada'
   WHERE usuario = 'prueba-al-reves';

  RAISE EXCEPTION 'LA PRUEBA FALLO: la bitacora SE DEJO EDITAR. El disparador trg_sla_bitacora_inmutable no esta.';
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 4 · BORRAR DE LA BITÁCORA
--     Esperado: el disparador aborta (mensaje de `sla_bitacora_inmutable`)
-- ───────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  INSERT INTO public.alertas_sla_bitacora (usuario, rol, evento, detalle)
  VALUES ('prueba-al-reves', 'admin', 'notificada',
          '{"canal":"prueba","porque":"sembrado para la prueba al reves"}'::jsonb);

  DELETE FROM public.alertas_sla_bitacora WHERE usuario = 'prueba-al-reves';

  RAISE EXCEPTION 'LA PRUEBA FALLO: la bitacora SE DEJO BORRAR. El disparador trg_sla_bitacora_inmutable no esta.';
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 5 · CONTROL POSITIVO — lo LEGÍTIMO tiene que entrar
--     Esperado: error que dice «CONTROL POSITIVO OK»
--
--     Sin esto, los cuatro de arriba pasarian igual si la tabla fuera
--     inservible por cualquier otra razon, y la conclusion «todos los candados
--     funcionan» seria falsa por el motivo contrario. Un detector que sólo
--     puede devolver una respuesta no mide nada.
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE ep RECORD;
BEGIN
  SELECT e.* INTO ep
    FROM public.alertas_episodios e
    LEFT JOIN public.alertas_sla s ON s.episodio_id = e.id
   WHERE e.estado = 'abierta' AND s.id IS NULL
   LIMIT 1;

  /* `NOT FOUND` y no `ep IS NULL`: un RECORD de PL/pgSQL al que no se le
     asigno nada revienta con «record "ep" is not assigned yet» al leerlo, y ese
     error se confundiria con un fallo de la prueba. */
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO SE PUDO PROBAR: no hay ningun episodio abierto sin compromiso. Corre el cron diario y repite.';
  END IF;

  INSERT INTO public.alertas_sla
    (episodio_id, cuenta_id, condicion, tipo, dueno,
     severidad_base, severidad, accion_sugerida, evidencia_requerida,
     generada_en, fecha_limite)
  VALUES
    (ep.id, ep.cuenta_id, ep.condicion, ep.tipo, ep.dueno,
     'alta', 'alta',
     'Llamar al contacto y confirmar el plan vigente antes del cierre de mes.',
     ARRAY['seguimiento']::TEXT[],
     CURRENT_DATE, CURRENT_DATE);

  RAISE EXCEPTION 'CONTROL POSITIVO OK: la fila legitima ENTRO, y este error la deshace. Los cuatro rebotes de arriba son de los candados, no de una tabla rota.';
END $$;
