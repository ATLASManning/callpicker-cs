-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN DE `migracion-alertas-sla.sql` — UNA SOLA CONSULTA
--
-- POR QUÉ EXISTE, SI LA MIGRACIÓN YA TRAE SUS SELECT AL FINAL
-- -----------------------------------------------------------
-- Porque el editor SQL de Supabase **sólo enseña el resultado de la ÚLTIMA
-- sentencia del lote**. Los cuatro SELECT de verificación que la migración trae
-- al final SÍ se ejecutan, pero tres de los cuatro resultados no se ven: el
-- editor los descarta en silencio. Leer el único que sale y darlo por «todo
-- bien» es exactamente la forma de error que este proyecto ya pagó — un
-- verificador que concluye éxito por defecto es peor que no tenerlo.
--
-- Esto devuelve UNA tabla con las trece comprobaciones y su veredicto al lado,
-- así que lo que falla se lee de un vistazo y lo que no se pudo medir también.
--
-- CÓMO SE LEE
-- -----------
--   · `veredicto = ok`        → esa comprobación pasó.
--   · `veredicto = *** NO ***`→ esa NO pasó. El `obtenido` dice qué salió.
--
-- Los renglones 4, 5 y 6 esperan CERO porque se corren recién aplicada la
-- migración, antes de la primera corrida del cron. Después de que el cron abra
-- compromisos dejarán de ser cero, y eso NO es una falla: es que el sistema ya
-- está trabajando. Son los únicos tres con esa lectura; los otros diez valen
-- siempre.
-- ═══════════════════════════════════════════════════════════════════════════

WITH chk(n, comprobacion, obtenido, esperado) AS (
  VALUES
    (1, 'dias_inhabiles · festivos oficiales sembrados',
        (SELECT count(*) FROM public.dias_inhabiles), 21::bigint),

    (2, 'sla_config · condiciones con plazo configurado',
        (SELECT count(*) FROM public.sla_config), 7::bigint),

    (3, 'sla_parametros · parámetros que no son por condición',
        (SELECT count(*) FROM public.sla_parametros), 10::bigint),

    (4, 'alertas_sla · compromisos (0 ANTES del primer cron)',
        (SELECT count(*) FROM public.alertas_sla), 0::bigint),

    (5, 'alertas_sla_bitacora · asientos (0 ANTES del primer cron)',
        (SELECT count(*) FROM public.alertas_sla_bitacora), 0::bigint),

    (6, 'cuentas_ediciones · diffs de ficha (0 ANTES del primer cron)',
        (SELECT count(*) FROM public.cuentas_ediciones), 0::bigint),

    -- RLS activado en las SEIS. Un `false` aquí es una fuga abierta.
    (7, 'RLS ACTIVADO en las seis tablas nuevas',
        (SELECT count(*) FROM pg_tables
          WHERE schemaname = 'public' AND rowsecurity
            AND tablename IN ('dias_inhabiles','sla_config','sla_parametros',
                              'alertas_sla','alertas_sla_bitacora',
                              'cuentas_ediciones')), 6::bigint),

    -- Y SIN POLÍTICAS, que es como se cierra en este proyecto: el navegador
    -- nunca habla con Supabase, todo pasa por `supabaseAdmin`, y el candado de
    -- cartera vive en `lib/dueno.ts`. Una política vieja al rol `public` se
    -- ACTIVA al encender RLS — así empezó la fuga del 21 oct 2026.
    (8, 'políticas RLS sobre esas seis tablas (tiene que haber CERO)',
        (SELECT count(*) FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename IN ('dias_inhabiles','sla_config','sla_parametros',
                              'alertas_sla','alertas_sla_bitacora',
                              'cuentas_ediciones')), 0::bigint),

    -- Las seis columnas aditivas. Un `ADD COLUMN IF NOT EXISTS` se salta en
    -- silencio la que ya existía con ese nombre, así que se cuentan.
    (9, 'columnas nuevas en seguimientos y reuniones',
        (SELECT count(*) FROM information_schema.columns
          WHERE table_schema = 'public'
            AND (table_name, column_name) IN (
              ('seguimientos','alerta_sla_id'), ('seguimientos','contacto_nombre'),
              ('seguimientos','contacto_puesto'), ('seguimientos','proximo_paso'),
              ('seguimientos','proximo_paso_fecha'), ('reuniones','alerta_sla_id'))),
        6::bigint),

    -- Los dos disparadores: el que hace la bitácora inmutable y el que impide
    -- tocar la fecha de generación. Sin ellos la migración «entró» y los
    -- candados que el encargo prohíbe abrir NO existen.
    (10, 'disparadores de inmutabilidad instalados',
        (SELECT count(*) FROM pg_trigger t
           JOIN pg_class c ON c.oid = t.tgrelid
           JOIN pg_namespace ns ON ns.oid = c.relnamespace
          WHERE ns.nspname = 'public' AND NOT t.tgisinternal
            AND t.tgname IN ('trg_sla_bitacora_inmutable','trg_sla_reloj')),
         2::bigint),

    -- Las nueve reglas con nombre. Son las que hacen imposible por BASE DE
    -- DATOS lo que el encargo prohíbe: cerrar sin evidencia, reprogramar sin
    -- motivo, rechazar sin decir por qué, un diff vacío.
    (11, 'reglas CHECK con nombre (las nueve del encargo)',
        (SELECT count(*) FROM pg_constraint
          WHERE conname IN ('evidencia_valida','sla_cierre_completo',
                            'sla_atendida_con_evidencia','sla_reprogramacion_completa',
                            'sla_escalamiento_completo','sla_rechazo_con_motivo',
                            'sla_fechas_coherentes','bitacora_sin_sla_solo_aviso',
                            'diff_no_vacio')), 9::bigint),

    -- EL CANDADO DEL NO DUPLICADO. Un compromiso cuelga de UN episodio y de uno
    -- solo; si este índice no está, dos corridas del cron abren dos relojes
    -- sobre la misma alerta y nada falla al escribirlos.
    (12, 'UNIQUE sobre alertas_sla.episodio_id (el no duplicado)',
        (SELECT count(*) FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = 'alertas_sla'
            AND indexdef ILIKE '%UNIQUE%(episodio_id)%'), 1::bigint),

    -- Y que los episodios sigan ahí: los compromiso cuelgan de ellos, así que
    -- si esta tabla no existe la migración no tenía de dónde agarrarse.
    (13, 'alertas_episodios existe (es de donde cuelga todo)',
        (SELECT count(*) FROM pg_tables
          WHERE schemaname = 'public' AND tablename = 'alertas_episodios'),
         1::bigint)
)
SELECT n,
       comprobacion,
       obtenido,
       esperado,
       CASE WHEN obtenido = esperado THEN 'ok' ELSE '*** NO ***' END AS veredicto
  FROM chk
 ORDER BY n;
