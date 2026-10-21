-- RLS para las tablas que hoy lee la llave publica.
-- Generado por scripts/revisa-rls.py contra el proyecto real.
--
-- POR QUE ESTO NO ROMPE EL TABLERO: la app consulta SIEMPRE con
-- `supabaseAdmin`, o sea la llave secreta, y esa IGNORA RLS por
-- diseno. Comprobado en el codigo: NADIE importa el cliente anonimo
-- para consultar — cero usos de `supabase.from(` en todo el repo.
--
-- Al activar RLS SIN politicas, la llave publica deja de leer. Es lo
-- que se quiere: hoy no la usa nadie. Si manana una pantalla tuviera
-- que leer desde el navegador, se le escribe su politica entonces.

-- 1 · LAS COMPROBADAS: la llave publica lee hoy las mismas filas
--     que la secreta. Medido, no supuesto.
ALTER TABLE public."adopcion_producto" ENABLE ROW LEVEL SECURITY;  -- 568 filas
ALTER TABLE public."radar_respuestas" ENABLE ROW LEVEL SECURITY;  -- 70 filas

-- 2 · LAS QUE NO SE PUEDEN COMPROBAR DESDE FUERA: estan VACIAS, y una
--     tabla sin filas contesta igual con RLS y sin el. No se sabe si
--     estan abiertas; se cierran ANTES de que tengan dato, que es
--     cuando sale gratis. Si ya lo tenian, esto no cambia nada.
ALTER TABLE public."chat_mensajes" ENABLE ROW LEVEL SECURITY;  -- vacia
ALTER TABLE public."enriquecimiento_decisores" ENABLE ROW LEVEL SECURITY;  -- vacia
ALTER TABLE public."oportunidades" ENABLE ROW LEVEL SECURITY;  -- vacia
ALTER TABLE public."solicitudes_acceso" ENABLE ROW LEVEL SECURITY;  -- vacia
ALTER TABLE public."tickets" ENABLE ROW LEVEL SECURITY;  -- vacia

-- COMPROBAR DESPUES, en el mismo editor:
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
 ORDER BY rowsecurity, tablename;

-- Y DESDE FUERA, que es lo que de verdad cierra el asunto:
--   python scripts/revisa-rls.py
