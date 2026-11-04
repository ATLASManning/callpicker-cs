-- ════════════════════════════════════════════════════════════════════════
-- RLS · SEGUNDA RONDA (3 nov 2026)
--
-- Supabase volvio a avisar «Table publicly accessible — Row-Level Security
-- is not enabled», con fecha 31 oct 2026, DESPUES de la ronda del 21 oct.
-- El aviso sigue sin decir que tabla.
--
-- POR QUE LAS SONDAS NO LA ENCONTRARON, que es la leccion de esta ronda:
-- `revisa-rls.py` y `revisa-rls-escritura.py` dieron las dos verde. Miden
-- desde fuera con la llave publica, y desde fuera hay un caso que NO se
-- puede distinguir:
--
--     · tabla con RLS puesto           -> 200 con lista vacia
--     · tabla SIN GRANT para `anon`    -> 401 / 42501
--
-- En el segundo caso la puerta la cierra el PERMISO, no el RLS, y el RLS
-- puede estar apagado. El INSERT tampoco desempata: contesta 42501 en los
-- dos casos. La sonda llamaba «protegidas» a esas tablas — una afirmacion
-- que nunca se habia medido. Ya no: ahora las separa y dice
-- «RLS NO COMPROBABLE — la cierra el GRANT».
--
-- Medido el 3 nov 2026, son SEIS objetos, y dos son vistas (las vistas no
-- llevan RLS, asi que quedan fuera):
--
--     uso_dashboard          4,551 filas   <- la grande
--     wa_conversaciones          1 fila
--     wa_mensajes                1 fila
--     wa_senales                 0 filas
--     vista_riesgo                          (vista — no aplica)
--     vista_semaforo_asesor                 (vista — no aplica)
--
-- POR QUE ESTO NO ROMPE EL TABLERO: `uso_dashboard` la tocan SOLO rutas de
-- servidor con `supabaseAdmin` (llave secreta, que ignora RLS) —
-- app/api/analytics/uso/route.ts y app/api/analytics/pageview/route.ts — y
-- las tres `wa_*` no aparecen en una sola linea del repo: las escribe un
-- proceso externo, tambien con la llave secreta.
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · EL DIAGNOSTICO QUE DESDE FUERA NO SE PUEDE HACER ────────────────
-- Correr ESTO PRIMERO y leerlo. Es la unica fuente que dice de verdad
-- quien tiene RLS apagado. Lo que salga aqui es lo que marca el aviso.
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND rowsecurity IS FALSE
 ORDER BY tablename;


-- ── 2 · LA TRAMPA DEL 21 DE OCTUBRE, QUE HAY QUE VOLVER A MIRAR ─────────
-- Una politica EXISTE aunque RLS este apagado; ahi simplemente no se
-- aplica. Al encender RLS se ACTIVA: el aviso de Supabase se calla y la
-- puerta sigue abierta — el peor de los dos mundos, porque ahora ademas
-- parece arreglado. En octubre era `service_role_all` concedida al rol
-- `public`, con cmd = ALL y qual = true.
--
-- CUALQUIER fila que salga aqui es una politica abierta a todo el mundo,
-- tenga el nombre que tenga. Mirarla ANTES de activar nada.
SELECT tablename, policyname, cmd, roles, qual
  FROM pg_policies
 WHERE schemaname = 'public'
   AND ('public' = ANY(roles) OR 'anon' = ANY(roles))
 ORDER BY tablename, policyname;


-- ── 3 · CERRAR ──────────────────────────────────────────────────────────
-- Si el paso 1 saca mas tablas que estas cuatro, anadirlas aqui: la lista
-- la manda el catalogo, no esta copia. Y si el paso 2 saco alguna fila,
-- resolverla primero con DROP POLICY, o activar RLS no cerrara nada.
ALTER TABLE public."uso_dashboard"     ENABLE ROW LEVEL SECURITY;  -- 4,551 filas
ALTER TABLE public."wa_conversaciones" ENABLE ROW LEVEL SECURITY;  -- 1 fila
ALTER TABLE public."wa_mensajes"       ENABLE ROW LEVEL SECURITY;  -- 1 fila
ALTER TABLE public."wa_senales"        ENABLE ROW LEVEL SECURITY;  -- vacia


-- ── 4 · COMPROBAR, EN ESTE ORDEN ────────────────────────────────────────
-- a) Aqui mismo: el paso 1 tiene que salir VACIO.
-- b) Y desde fuera, que es lo que de verdad cierra el asunto:
--      python scripts/revisa-rls.py
--      python scripts/revisa-rls-escritura.py
--    Las cuatro tienen que pasar de «RLS NO COMPROBABLE» a «protegida».
-- c) Que el tablero sigue vivo: abrir /dashboard y el modulo de uso.
