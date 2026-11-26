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
-- LAS TRECE VALEN SIEMPRE, Y ESO SE CORRIGIÓ (26 nov 2026)
-- --------------------------------------------------------
-- Los renglones 4, 5 y 6 contaban filas y esperaban CERO, porque se escribieron
-- para correrse recién aplicada la migración y antes del primer cron. En cuanto
-- el cron abrió los 240 primeros compromisos, esos tres pasaron a decir
-- «*** NO ***» — o sea que el verificador se ponía ROJO justo cuando el sistema
-- empezaba a funcionar. Un comentario que avisa de eso no basta: lo que se lee
-- de un vistazo es la columna de veredictos, no el encabezado.
--
-- Ahora miden INVARIANTES, que son verdad el primer día y el día mil.
--
-- Y EL PRIMER INTENTO DE ESOS TRES TAMPOCO SERVÍA: preguntaba cosas que el
-- esquema ya hace imposibles, así que salían verdes sin probar nada. Están
-- reescritos sobre lo que NINGUNA restricción vigila — ver el comentario largo
-- junto al renglón 4. Un verde que no se puede perder no es un verde.
-- [[feedback-cero-sin-medicion]] [[feedback-probar-al-reves]]
-- ═══════════════════════════════════════════════════════════════════════════

WITH chk(n, comprobacion, obtenido, esperado) AS (
  VALUES
    (1, 'dias_inhabiles · festivos oficiales sembrados',
        (SELECT count(*) FROM public.dias_inhabiles), 21::bigint),

    (2, 'sla_config · condiciones con plazo configurado',
        (SELECT count(*) FROM public.sla_config), 7::bigint),

    (3, 'sla_parametros · parámetros que no son por condición',
        (SELECT count(*) FROM public.sla_parametros), 10::bigint),

    -- ── 4, 5 y 6: TRES QUE ESTUVIERON VERDES DE GRATIS (26 nov 2026) ────────
    -- La primera versión de estos tres preguntaba por `fecha_limite IS NULL`,
    -- por un `sla_id` huérfano y por un `diff` vacío. Los tres salieron en
    -- verde, y ninguno de los tres podía salir de otra manera: `fecha_limite`
    -- es `DATE NOT NULL`, el `sla_id` tiene FK con ON DELETE CASCADE y el
    -- `diff` lo cubre el CHECK `diff_no_vacio` —cuya existencia confirma el
    -- renglón 11—. O sea que eran imposibles de falsear: un «ok» que el
    -- esquema regala, no una medición. Es la misma trampa que el verificador
    -- que concluye éxito por defecto. [[feedback-verificar-antes-asegurar]]
    --
    -- Los tres de ahora NO los protege nada: `condicion` es TEXT suelto sin FK,
    -- y la coherencia entre la evidencia y la cuenta del compromiso no la
    -- vigila ninguna restricción. Pueden salir distintos de cero, que es el
    -- único requisito para que un verde signifique algo.

    -- EL HUECO QUE NO SE VE: una condición que alerta y no tiene plazo. Su
    -- compromiso nace sin reloj y el panel lo lee como atendido por omisión.
    -- Se arregla sembrando una fila en `sla_config`, no tocando código.
    (4, 'alertas_sla · compromisos abiertos cuya condición NO está en sla_config',
        (SELECT count(*) FROM public.alertas_sla s
          WHERE s.estado NOT IN ('cerrada','rechazada')
            AND NOT EXISTS (SELECT 1 FROM public.sla_config c
                             WHERE c.condicion = s.condicion)), 0::bigint),

    -- Un asiento firmado contra una cuenta distinta de la del compromiso. Es
    -- la bitácora de quién respondió por qué cuenta: si se cruzan, el registro
    -- acusa a la cuenta equivocada.
    (5, 'alertas_sla_bitacora · asientos cuya cuenta NO es la del compromiso',
        (SELECT count(*) FROM public.alertas_sla_bitacora b
           JOIN public.alertas_sla s ON s.id = b.sla_id
          WHERE b.cuenta_id IS NOT NULL
            AND b.cuenta_id <> s.cuenta_id), 0::bigint),

    -- LA REGLA CENTRAL DEL ENCARGO: la evidencia va «registrada en la misma
    -- cuenta». Una edición colgada de un compromiso de OTRA cuenta cerraría
    -- una alerta con trabajo hecho en otro cliente, y nada en el esquema lo
    -- impide: son dos FK independientes que nadie obliga a coincidir.
    (6, 'cuentas_ediciones · evidencia colgada de un compromiso de OTRA cuenta',
        (SELECT count(*) FROM public.cuentas_ediciones e
           JOIN public.alertas_sla s ON s.id = e.alerta_sla_id
          WHERE e.cuenta_id <> s.cuenta_id), 0::bigint),

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
