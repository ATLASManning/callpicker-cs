-- ════════════════════════════════════════════════════════════════════════════
-- RLS DEL ESQUEMA `prediccion` — aviso de Supabase del 8 nov 2026
--
-- Advisors marcó CUATRO objetos:
--   · prediccion.corridas          rls_disabled_in_public
--   · prediccion.snapshot_semanal  rls_disabled_in_public
--   · prediccion.tareas_hueco      rls_disabled_in_public
--   · prediccion.v_cuentas_vivas   security_definer_view
--
-- POR QUE NO LO HABIAMOS VISTO EN LAS RONDAS DE OCTUBRE Y DEL 3 DE NOVIEMBRE
-- Las dos sondas pedían `/rest/v1/` sin cabecera de esquema —o sea el de por
-- defecto— y la consulta del catálogo filtraba `schemaname = 'public'`. Las dos
-- miraban el mismo sitio. `prediccion` se creó el 7 oct y se expuso a mano a la
-- API ese mismo día, así que nunca entró en el barrido: no es que lo dieran por
-- bueno, es que no existía para ellas. Ya está corregido en `revisa-rls.py`,
-- que ahora descubre los esquemas expuestos preguntándoselos a PostgREST.
--
-- ── LO QUE SE MIDIÓ DESDE FUERA (python -I scripts/revisa-rls.py) ───────────
--   · La llave PUBLICABLE (`anon`) NO lee ninguno de los cuatro: contesta
--     42501. El aviso de Supabase dice «cualquiera con la URL puede leer»; en
--     ESTE caso eso no es exacto, porque `anon` nunca recibió SELECT.
--   · Lo que sí recibió SELECT, en la propia migración del 7 oct (línea 327 de
--     scripts/migracion-prediccion-snapshot.sql), es el rol `authenticated`:
--         GRANT SELECT ON ALL TABLES IN SCHEMA prediccion TO authenticated;
--   · Y el alta de Supabase Auth está ABIERTA: /auth/v1/settings devuelve
--     `"disable_signup": false` con `"email": true`. O sea que cualquiera que
--     tenga la llave publicable —viaja en el bundle del navegador— se da de
--     alta con su correo y pasa a ser `authenticated`.
--
-- Juntando las dos: hoy la puerta la cierra el GRANT, no el RLS, y esa puerta
-- la abre un formulario de alta. Detrás están `v_cuentas_vivas` (nombre, correo,
-- teléfono y `observaciones_kam` de 189 cuentas vivas) y `snapshot_semanal`
-- (1,154 filas con MRR, consumo, health score y días sin contacto).
--
-- ── LO QUE ESTE ARCHIVO NO PUEDE AFIRMAR, Y POR ESO LO PREGUNTA PRIMERO ─────
-- Desde fuera no se ve el catálogo: la llave secreta sólo habla PostgREST. Que
-- el GRANT siga vigente y que no haya políticas sueltas sólo lo dice el
-- catálogo. Por eso el BLOQUE 1 se corre y se LEE antes de tocar nada.
-- ════════════════════════════════════════════════════════════════════════════


-- ─── BLOQUE 1 · DIAGNÓSTICO. Correr esto SOLO, y mirar las tres salidas. ────

-- 1.a · LA TRAMPA DE OCTUBRE, en su versión `prediccion`.
--
-- Una política existe aunque RLS esté APAGADO: ahí simplemente no se aplica. Al
-- encenderlo se ACTIVA. En octubre eso dejó `adopcion_producto` abierta de par
-- en par CON RLS puesto y con el aviso de Supabase callado, que es el peor de
-- los dos mundos porque además parece arreglado.
--
-- SI ESTA CONSULTA DEVUELVE UNA SOLA FILA, NO SE CORRE EL BLOQUE 2: primero se
-- mira qué concede esa política y se borra si abre de más.
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'prediccion'
 ORDER BY tablename, policyname;

-- 1.b · Quién tiene RLS hoy. Esperado ANTES del arreglo: las tres en `false`.
--       (Una vista no lleva RLS; `v_cuentas_vivas` no sale aquí a propósito.)
SELECT c.relname AS objeto,
       c.relkind AS tipo,          -- r = tabla, v = vista
       c.relrowsecurity  AS rls_encendido,
       c.relforcerowsecurity AS rls_forzado
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'prediccion'
   AND c.relkind IN ('r', 'v', 'm', 'p')
 ORDER BY c.relkind, c.relname;

-- 1.c · Quién puede LEER cada objeto, de verdad y no según el archivo que lo
--       creó. Es lo que decide si el REVOKE del bloque 2 cambia algo.
SELECT c.relname AS objeto,
       r.rolname AS rol,
       has_table_privilege(r.rolname, c.oid, 'SELECT') AS puede_leer,
       has_table_privilege(r.rolname, c.oid, 'INSERT') AS puede_insertar,
       has_table_privilege(r.rolname, c.oid, 'DELETE') AS puede_borrar
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 CROSS JOIN (SELECT unnest(ARRAY['anon', 'authenticated', 'service_role']) AS rolname) r
 WHERE n.nspname = 'prediccion'
   AND c.relkind IN ('r', 'v', 'm', 'p')
 ORDER BY c.relname, r.rolname;


-- ─── BLOQUE 2 · EL ARREGLO. Correr sólo si 1.a salió VACÍA. ─────────────────

-- 2.a · RLS en las tres tablas.
--
-- POR QUE ESTO NO ROMPE NADA: todo el subsistema escribe y lee con
-- `supabaseAdmin.schema('prediccion')` —comprobado en lib/prediccion/snapshot.ts,
-- ocho llamadas, todas con la llave secreta— y el `service_role` IGNORA RLS por
-- diseño. La app NO usa Supabase Auth en ninguna parte (cero `signInWithPassword`,
-- cero `auth.getSession` en todo el repo): el acceso al tablero lo gobierna
-- `lib/auth.ts` contra la tabla `usuarios`. Nadie legítimo es `authenticated`.
--
-- Y NO SE CREA NINGUNA POLÍTICA. Negar todo es exactamente lo que se quiere.
-- Una política de más es como empezó la fuga de octubre.
ALTER TABLE prediccion.corridas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediccion.snapshot_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediccion.tareas_hueco     ENABLE ROW LEVEL SECURITY;

-- 2.b · La vista deja de correr con los permisos de su dueño.
--
-- `v_cuentas_vivas` lee `public.cuentas`. Creada sin `security_invoker`, se
-- ejecuta como su DUEÑO: el RLS que `public.cuentas` sí tiene puesto NO se le
-- aplica a quien la consulta. O sea que la vista es un túnel por debajo del
-- candado de la tabla. Con `security_invoker` pasa a ejecutarse como quien
-- pregunta, y entonces el RLS de `cuentas` vale también aquí.
--
-- No rompe el subsistema: quien la consulta es el `service_role`, que ignora
-- RLS igual. Y hoy no la consulta ni la app —sólo aparece en su propia
-- migración—, así que el cambio es gratis.
--
-- Requiere PostgreSQL 15 o superior. Si el proyecto fuera anterior, el
-- equivalente es recrear la vista con `WITH (security_invoker = true)`.
ALTER VIEW prediccion.v_cuentas_vivas SET (security_invoker = on);

-- 2.c · Quitarle la lectura a `authenticated`, que es la puerta que hoy está
--       abierta de verdad.
--
-- El GRANT de la línea 327 de la migración del 7 oct se puso «por si el archivo
-- se corre por partes». Nunca hizo falta: PostgREST llega aquí como
-- `service_role`. Mientras el alta de Supabase Auth siga abierta, ese GRANT es
-- la diferencia entre un desconocido con un correo y la cartera completa.
--
-- LA ESCOTILLA: `service_role` conserva ALL, y el `GRANT USAGE` del esquema se
-- deja como está. Para devolverle la lectura a una pantalla que algún día lea
-- desde el navegador, se le escribe su política y su GRANT entonces — con
-- nombre y alcance, no «todas las tablas».
REVOKE SELECT ON ALL TABLES IN SCHEMA prediccion FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA prediccion
  REVOKE SELECT ON TABLES FROM authenticated;

-- `anon` nunca tuvo SELECT aquí — se comprobó desde fuera, contesta 42501 — y
-- esto no cambia nada hoy. Va de todos modos: lo que no está concedido no se
-- puede conceder por accidente al correr un archivo viejo.
REVOKE SELECT ON ALL TABLES IN SCHEMA prediccion FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA prediccion
  REVOKE SELECT ON TABLES FROM anon;


-- ─── BLOQUE 3 · COMPROBAR, en el mismo editor ──────────────────────────────

-- 3.a · Las tres tablas en `true`, y la vista con `security_invoker`.
SELECT c.relname AS objeto, c.relkind AS tipo, c.relrowsecurity AS rls_encendido,
       c.reloptions AS opciones
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'prediccion'
   AND c.relkind IN ('r', 'v', 'm', 'p')
 ORDER BY c.relkind, c.relname;

-- 3.b · Y que siga sin haber políticas. Cero filas es lo correcto.
SELECT * FROM pg_policies WHERE schemaname = 'prediccion';


-- ════════════════════════════════════════════════════════════════════════════
-- LO QUE FALTA Y NO ES SQL
--
-- 1 · CERRAR EL ALTA DE SUPABASE AUTH.
--     Authentication → Sign In / Providers → Email → «Allow new users to sign
--     up» apagado. Medido hoy: `disable_signup: false`, `email: true`.
--     La app NO usa Supabase Auth para nada, así que el alta no le sirve a
--     nadie y es superficie de ataque regalada. Esto es lo que de verdad cierra
--     la puerta; el REVOKE de 2.c es el candado de abajo.
--
-- 2 · DESPUÉS DE TODO, DESDE FUERA, que es lo que cierra el asunto:
--         python -I scripts/revisa-rls.py
--     Esperado: los cuatro de `prediccion` siguen en «RLS NO COMPROBABLE — la
--     cierra el GRANT». OJO: eso se verá IGUAL que antes, porque desde fuera
--     `anon` ya contestaba 42501. El cambio sólo lo enseña el catálogo, 3.a.
--     No tomar «igual que antes» por «no se aplicó».
-- ════════════════════════════════════════════════════════════════════════════
