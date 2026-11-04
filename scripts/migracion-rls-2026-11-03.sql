-- ════════════════════════════════════════════════════════════════════════
-- RLS · SEGUNDA RONDA (3 nov 2026) — CERRADA SIN TOCAR NADA
--
-- Supabase aviso «Table publicly accessible — Row-Level Security is not
-- enabled», con fecha 31 oct 2026, DESPUES de la ronda del 21 oct. Este
-- archivo nacio proponiendo cuatro `ALTER TABLE`. **El catalogo los
-- desmintio**: no hacia falta ninguno. Se conserva el diagnostico, que es
-- lo reutilizable, y se deja escrito el resultado para que la proxima vez
-- se empiece por aqui y no por la hipotesis.
--
-- LO QUE DEVOLVIO EL CATALOGO (3 nov 2026, SQL Editor del proyecto):
--
--   · pg_tables con rowsecurity IS FALSE ......... CERO filas.
--     Las 25 tablas de `public` tienen RLS puesto, `uso_dashboard` y las
--     tres `wa_*` incluidas. Mi hipotesis era que esas cuatro lo tenian
--     apagado: era FALSA.
--   · pg_policies hacia `public` / `anon` ........ CERO filas.
--     La trampa de octubre (`service_role_all` al rol `public`) no se ha
--     repetido. Ningun DROP POLICY que hacer.
--
-- POR QUE LA SONDA NO PODIA SABERLO, que sigue siendo la leccion:
-- `uso_dashboard` y las `wa_*` contestan 401/42501 porque `anon` no tiene
-- GRANT sobre ellas. Ese error sale IGUAL con RLS puesto y sin el, y el
-- INSERT tampoco desempata. Desde fuera ese caso es indecidible — por eso
-- las sondas ahora dicen «RLS NO COMPROBABLE — la cierra el GRANT» y «NO
-- CONCLUYE» en vez de «protegida». Decian que si y no lo habian medido.
--
-- Y OJO CON EL AVISO: el correo es un DIGESTO SEMANAL y trae fecha de
-- corte («Issues as of 31 Oct»). No es el estado de hoy. Lo que decide es
-- Advisors en el panel, o estas dos consultas.
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · QUIEN TIENE RLS APAGADO ─────────────────────────────────────────
-- La unica fuente que lo dice. Correr SIEMPRE esto primero: es lo que
-- marca el aviso, y desde fuera no se puede averiguar.
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND rowsecurity IS FALSE
 ORDER BY tablename;


-- ── 2 · LA TRAMPA DEL 21 DE OCTUBRE ─────────────────────────────────────
-- Una politica EXISTE aunque RLS este apagado; ahi no se aplica. Al
-- encender RLS se ACTIVA: el aviso se calla y la puerta sigue abierta — el
-- peor de los dos mundos, porque ahora ademas parece arreglado.
-- CUALQUIER fila que salga aqui es una politica abierta a todo el mundo,
-- tenga el nombre que tenga. Mirarla ANTES de activar nada.
SELECT tablename, policyname, cmd, roles, qual
  FROM pg_policies
 WHERE schemaname = 'public'
   AND ('public' = ANY(roles) OR 'anon' = ANY(roles))
 ORDER BY tablename, policyname;


-- ── 3 · CERRAR — NO HIZO FALTA EN ESTA RONDA ────────────────────────────
-- Quedan comentados a proposito. Si el paso 1 vuelve a sacar filas, la
-- lista la manda ESE resultado, no esta copia; y si el paso 2 saca alguna,
-- se resuelve con DROP POLICY primero o activar RLS no cerrara nada.
--
-- ALTER TABLE public."uso_dashboard"     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public."wa_conversaciones" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public."wa_mensajes"       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public."wa_senales"        ENABLE ROW LEVEL SECURITY;


-- ── 4 · «RLS PUESTO Y CERO POLITICAS» NO ES UN FALLO AQUI ───────────────
-- El catalogo muestra 8 tablas con RLS y ninguna politica, o sea negar
-- todo. Eso es lo que se quiere, y esta comprobado en el repo, no supuesto:
--
--   · `lib/supabase.ts` exporta un cliente anonimo (`supabase`) que **no
--     importa NADIE**: cero coincidencias de `import { supabase }`.
--   · Todo consulta con `supabaseAdmin`, que usa la llave secreta e ignora
--     RLS por diseno.
--   · Empirico: `uso_dashboard` lleva 4,551 filas y las dos rutas de
--     analitica siguen escribiendo.
--
-- O sea: NO hay que crear politicas `authenticated` «por si acaso». Una
-- politica de mas es exactamente como empezo la fuga de octubre. El dia
-- que una pantalla lea desde el navegador, se le escribe la suya entonces.


-- ── 5 · COMPROBAR DESDE FUERA ───────────────────────────────────────────
--   python scripts/revisa-rls.py
--   python scripts/revisa-rls-escritura.py
-- Las cuatro sin GRANT seguiran diciendo «no concluye», y eso es correcto:
-- quien las zanja es el paso 1.
