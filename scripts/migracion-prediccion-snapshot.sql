-- ============================================================================
-- migracion-prediccion-snapshot.sql
-- El snapshot semanal: lo unico del plan predictivo que NO se recupera despues.
--
-- Prompt Maestro PM-PRED-001 rev B · requisitos SEG-02, SEG-03, SEG-04, SEG-08
-- Autorizado por direccion el 7 de octubre de 2026.
--
-- ─── POR QUE ESTO ES URGENTE Y NADA MAS LO ES ──────────────────────────────
--
-- Medido en la Fase 1: hay 18 eventos de baja fechados y entrenables, contra los
-- 30 que exige el documento. La brecha se cierra ESPERANDO, no construyendo —
-- pero solo si alguien esta guardando. Hoy nadie guarda:
--
--   · `health_score_historial` existe y tiene OCHO filas, de ocho cuentas
--     distintas, en cuatro fechas sueltas. Se escribe solo cuando alguien edita
--     una cuenta a mano.
--   · `cuentas.health_score` es GENERATED ALWAYS sobre cuatro sub-scores que se
--     SOBREESCRIBEN. No hay forma de saber que valia el mes pasado.
--   · El tablero recalcula todo en cada peticion.
--
-- Cada semana sin snapshot es una semana que nunca se podra entrenar. No se
-- puede reconstruir hacia atras: el dato de origen ya se sobreescribio.
--
-- ─── NO INTRUSION ──────────────────────────────────────────────────────────
--
-- Todo vive en el esquema `prediccion`. Nada se crea en `public`, nada se
-- altera, nada se borra (SEG-02, SEG-03). Este archivo se entrega y lo ejecuta
-- una persona: el agente nunca lo corre contra produccion (SEG-08).
--
-- Para revertir por completo, al final del archivo hay un bloque comentado:
-- `DROP SCHEMA prediccion CASCADE` y el tablero queda exactamente como estaba.
-- ============================================================================

-- ============================================================================
-- ⚠ PASO MANUAL OBLIGATORIO, Y SIN EL NADA DE ESTO FUNCIONA
--
-- Supabase solo expone `public` y `graphql_public` a la API. Comprobado contra
-- esta base antes de entregar el archivo:
--
--   GET /rest/v1/snapshot_semanal  (Accept-Profile: prediccion)
--   -> HTTP 406 · {"code":"PGRST106",
--                  "hint":"Only the following schemas are exposed: public, graphql_public",
--                  "message":"Invalid schema: prediccion"}
--
-- O sea: se puede crear el esquema y las tablas, y el escritor seguira sin
-- poder tocarlas. Hay que exponerlo, y el camino fiable es el TABLERO:
--
--     Supabase → Project Settings → API → «Exposed schemas»
--     agregar:  prediccion        (dejar public y graphql_public)
--
-- Abajo va tambien el camino por SQL, que funciona en Postgres pero que el
-- panel de Supabase puede sobreescribir al guardar su propia configuracion. Se
-- deja por si se prefiere, no como sustituto del paso del tablero.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS prediccion;

COMMENT ON SCHEMA prediccion IS
  'Subsistema predictivo. Aditivo y aislado: nada de aqui es leido por el '
  'tablero existente. Se puede borrar con DROP SCHEMA ... CASCADE sin efecto '
  'sobre public.';

-- Los roles de PostgREST necesitan entrar al esquema. Sin esto, exponerlo no
-- alcanza: la peticion llega y se va con un permiso denegado.
GRANT USAGE ON SCHEMA prediccion TO anon, authenticated, service_role;

-- El servicio escribe; `authenticated` solo lee. `anon` no toca nada de aqui:
-- son datos internos de cartera y no hay una sola pantalla publica que los pida.
ALTER DEFAULT PRIVILEGES IN SCHEMA prediccion
  GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA prediccion
  GRANT ALL ON TABLES TO service_role;

-- Camino por SQL para exponer el esquema. Descomentar SOLO si no se hace por el
-- tablero, y sabiendo que el panel puede pisarlo.
--
--   ALTER ROLE authenticator
--     SET pgrst.db_schemas = 'public, graphql_public, prediccion';
--   NOTIFY pgrst, 'reload config';


-- ─── 1. EL SNAPSHOT SEMANAL ────────────────────────────────────────────────
--
-- Una fila por cuenta y por semana. La llave es (semana, cuenta_id): correr el
-- trabajo dos veces el mismo lunes no duplica, reescribe. Eso hace seguro
-- reintentar, que es la propiedad que mas se agradece en un trabajo programado.
--
-- POR QUE CADA CIFRA LLEVA SU `*_medible`, y no es burocracia:
-- un cero sin medicion no es un cero. Una cuenta con `consumo_pct = 0` porque no
-- consumio nada y otra con 0 porque no esta en el Informe de Cortes son dos
-- cosas opuestas, y promediarlas juntas corrompe cualquier feature. Son 46
-- cuentas y $772,557 las que estan en el segundo caso.
CREATE TABLE IF NOT EXISTS prediccion.snapshot_semanal (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- El lunes de la semana medida, en hora de Mexico. Ver lib/fecha-local.ts:
  -- Vercel corre en UTC y Mexico va seis horas atras, asi que la fecha se
  -- calcula en codigo y aqui solo se guarda.
  semana           date NOT NULL,
  tomado_en        timestamptz NOT NULL DEFAULT now(),

  cuenta_id        uuid NOT NULL,
  cid              text,
  empresa          text NOT NULL,
  asesor           text,
  estado           text NOT NULL,

  -- Poblacion primaria, fijada por direccion el 7 oct 2026: las 25 principales
  -- de CADA asesor. Se guarda la pertenencia de ESA semana, porque cambia con el
  -- MRR y un backtest que la recalcule con el censo de hoy mira al futuro.
  es_top_asesor    boolean NOT NULL DEFAULT false,

  -- ── MRR, de la fuente unica (GRC por CID) ──
  mrr              numeric,
  mrr_origen       text NOT NULL,          -- 'grc' | 'cuentas' | 'sin_dato'
  mrr_medible      boolean NOT NULL,

  -- ── CONSUMO, del Informe de Cortes ──
  consumo_pct      numeric,                -- recalculado, nunca el % del archivo
  minutos_incluidos integer,
  minutos_consumidos integer,
  consumo_base     text,                   -- 'extensiones' | 'bolsa' | 'sin_medicion'
  consumo_medible  boolean NOT NULL,
  -- De que mes es el corte que se leyo. Sin esto no se puede saber si el consumo
  -- de esta semana viene de un corte fresco o de uno de hace cuatro meses, que
  -- es la diferencia entre una tendencia y una foto vieja repetida.
  mes_del_corte    text,

  -- ── ADOPCION y PAGO, que ya venian en el corte y estaban sin usar ──
  -- Cubren dos de las seis dimensiones del §6.4 sin pedirle nada a nadie:
  -- `panel_visitas` es la suma de entradas a las secciones del administrador
  -- (Configuracion, Reportes, Call History, Inbound, Outbound, My extension),
  -- `panel_desarrolladores` es la senal de integracion por API, y `pago_exitoso`
  -- dice si el cobro automatico paso en el periodo.
  panel_visitas    integer,
  panel_desarrolladores integer,
  pago_exitoso     boolean,

  -- ── CONTACTO: solo canales reales ──
  -- NULL cuando nunca hubo contacto, jamas 0: un cero aqui significaria
  -- «hablamos hoy» y mandaria la cuenta al final de cualquier orden por urgencia.
  dias_sin_contacto integer,
  contacto_medible boolean NOT NULL,

  -- ── HEALTH SCORE, con su porcentaje de dato REAL ──
  -- Medido en la Fase 1: los cuatro sub-scores nacen en 50 y se quedan ahi si
  -- nadie los captura. En promedio solo el 58% del peso se apoya en dato real y
  -- ocho cuentas tienen un score 100% fabricado. Sin este porcentaje al lado, la
  -- feature miente con cara de precision.
  health_score     integer,
  hs_pct_real      numeric,

  -- ── ALERTAS abiertas esa semana ──
  alertas_abiertas integer NOT NULL DEFAULT 0,
  alertas_familias text[],
  condicion_mas_vieja_dias integer,

  -- ── HUECOS detectados, que son las tareas de la semana ──
  huecos           text[] NOT NULL DEFAULT '{}',

  CONSTRAINT snapshot_semana_cuenta UNIQUE (semana, cuenta_id),

  -- Un `*_medible` en true obliga a que la cifra exista. Al reves no: una cifra
  -- presente con medible=false es legitima (un valor heredado que no se confia).
  CONSTRAINT mrr_coherente CHECK (NOT mrr_medible OR mrr IS NOT NULL),
  CONSTRAINT consumo_coherente CHECK (NOT consumo_medible OR consumo_pct IS NOT NULL),
  CONSTRAINT mrr_origen_valido CHECK (mrr_origen IN ('grc', 'cuentas', 'sin_dato')),
  CONSTRAINT consumo_base_valida CHECK (
    consumo_base IS NULL OR consumo_base IN ('extensiones', 'bolsa', 'sin_medicion'))
);

CREATE INDEX IF NOT EXISTS snapshot_semanal_semana
  ON prediccion.snapshot_semanal (semana DESC);
CREATE INDEX IF NOT EXISTS snapshot_semanal_cuenta
  ON prediccion.snapshot_semanal (cuenta_id, semana DESC);
CREATE INDEX IF NOT EXISTS snapshot_semanal_asesor
  ON prediccion.snapshot_semanal (asesor, semana DESC);

COMMENT ON TABLE prediccion.snapshot_semanal IS
  'Una fila por cuenta y semana. Es la memoria que el tablero no tiene: todo lo '
  'demas se recalcula y se sobreescribe. Sin esto no hay serie temporal y sin '
  'serie no hay modelo.';
COMMENT ON COLUMN prediccion.snapshot_semanal.es_top_asesor IS
  'Pertenencia a las 25 principales de su asesor EN ESA SEMANA. Guardarla evita '
  'que un backtest futuro use el censo de hoy, que seria mirar al futuro.';
COMMENT ON COLUMN prediccion.snapshot_semanal.hs_pct_real IS
  'Que porcentaje del Health Score se apoya en dato capturado y no en el 50 por '
  'omision. Promedio medido: 58%.';


-- ─── 2. LAS TAREAS QUE NACEN DE UN HUECO ───────────────────────────────────
--
-- Instruccion de direccion, 7 oct 2026, textual: «SI NO HAY INFORMACION ES
-- TAREA O ACTIVIDAD O PARA EL ASESOR O PARA DANIEL MARTINEZ».
--
-- Antes un hueco se pintaba «no medible» y ahi acababa: nadie quedaba a cargo,
-- asi que el hueco sobrevivia al informe que lo denuncio. El catalogo y la regla
-- de ruteo viven en lib/prediccion/huecos.ts, no aqui: una regla de negocio en
-- dos sitios se desincroniza.
--
-- El `alcance` es lo que evita 192 tareas identicas. El tiempo de timbrado no
-- existe para ninguna cuenta; abrir 192 peticiones para pedir una vez lo mismo
-- no es rigor, es ruido — y el ruido se ignora.
CREATE TABLE IF NOT EXISTS prediccion.tareas_hueco (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana        date NOT NULL,
  creada_en     timestamptz NOT NULL DEFAULT now(),

  clave         text NOT NULL,
  dueno         text NOT NULL,            -- 'asesor' | 'direccion'
  alcance       text NOT NULL,            -- 'cuenta' | 'cartera'

  -- NULL en las de cartera.
  cuenta_id     uuid,
  empresa       text,
  asesor        text,

  -- El MRR que queda a ciegas. NULL = no se sabe, que NO es cero.
  mrr_ciego     numeric,

  pedir         text NOT NULL,
  porque        text NOT NULL,
  donde         text NOT NULL,
  bloquea       text NOT NULL,

  -- ── Ciclo de vida ──
  estado        text NOT NULL DEFAULT 'abierta',  -- 'abierta' | 'resuelta' | 'descartada'
  cerrada_en    timestamptz,
  cerrada_por   text,
  cierre_nota   text,

  -- Una tarea abierta por clave y cuenta, no una por semana: si el asesor no la
  -- hizo el lunes pasado, no hacen falta cuatro copias en un mes. El indice
  -- parcial de abajo lo garantiza y deja libre el historico de cerradas.
  CONSTRAINT dueno_valido CHECK (dueno IN ('asesor', 'direccion')),
  CONSTRAINT alcance_valido CHECK (alcance IN ('cuenta', 'cartera')),
  CONSTRAINT estado_valido CHECK (estado IN ('abierta', 'resuelta', 'descartada')),

  -- Cerrar exige decir quien y cuando. Una tarea «resuelta» sin firma no se
  -- puede auditar, y la conciliacion de bajas ya enseno lo que cuesta eso.
  CONSTRAINT cierre_completo CHECK (
    estado = 'abierta'
    OR (cerrada_en IS NOT NULL AND cerrada_por IS NOT NULL)),

  -- Una de cuenta necesita cuenta; una de cartera no debe traerla.
  CONSTRAINT alcance_coherente CHECK (
    (alcance = 'cuenta'  AND cuenta_id IS NOT NULL)
    OR (alcance = 'cartera' AND cuenta_id IS NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS tareas_hueco_abierta_cuenta
  ON prediccion.tareas_hueco (clave, cuenta_id)
  WHERE estado = 'abierta' AND cuenta_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tareas_hueco_abierta_cartera
  ON prediccion.tareas_hueco (clave)
  WHERE estado = 'abierta' AND cuenta_id IS NULL;

CREATE INDEX IF NOT EXISTS tareas_hueco_dueno
  ON prediccion.tareas_hueco (dueno, estado, mrr_ciego DESC NULLS LAST);

COMMENT ON TABLE prediccion.tareas_hueco IS
  'Un hueco de datos con dueno. Instruccion de direccion del 7 oct 2026: si no '
  'hay informacion, es tarea para el asesor o para Daniel Martinez. El catalogo '
  'y la regla de ruteo estan en lib/prediccion/huecos.ts.';


-- ─── 3. LA BITACORA DE CORRIDAS ────────────────────────────────────────────
--
-- Para poder contestar «¿corrio el lunes?» sin deducirlo de que las cifras se
-- vean raras. Una corrida que fallo a medias tiene que decirlo: este proyecto ya
-- publico durante un dia entero `nuevos: 4, falla: null` mientras los mismos
-- cuatro episodios fallaban en silencio, porque supabase-js no lanza, DEVUELVE
-- el error.
CREATE TABLE IF NOT EXISTS prediccion.corridas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana        date NOT NULL,
  arrancada_en  timestamptz NOT NULL DEFAULT now(),
  terminada_en  timestamptz,
  disparo       text NOT NULL,            -- 'cron' | 'manual'

  cuentas_vistas    integer,
  filas_escritas    integer,
  tareas_abiertas   integer,
  tareas_cerradas   integer,

  -- NULL = termino bien. Con texto = termino, y hay que leerlo.
  falla         text,

  CONSTRAINT disparo_valido CHECK (disparo IN ('cron', 'manual'))
);

CREATE INDEX IF NOT EXISTS corridas_semana ON prediccion.corridas (semana DESC);


-- ─── 4. LECTURA, Y NADA MAS QUE LECTURA, DE LO EXISTENTE (SEG-04) ─────────
--
-- El subsistema NUNCA escribe en `public`. Estas vistas existen para que quede
-- en el esquema, por escrito, cual es la unica forma en que toca los datos del
-- tablero: leyendolos.
--
-- No reproducen ninguna regla de negocio. El MRR oficial se arma en
-- lib/facturacion-cuenta.ts sumando las filas del GRC por CID, y el contacto en
-- lib/contacto-cuenta.ts contando solo canales reales. Reproducir esas reglas en
-- SQL crearia una segunda cifra de la misma cosa, que es exactamente lo que
-- direccion prohibio.
CREATE OR REPLACE VIEW prediccion.v_cuentas_vivas AS
  SELECT id, cid, empresa, asesor, estado, consecutivo, giro,
         contacto_nombre, contacto_email, contacto_tel, contactos_json,
         nps_score, observaciones_kam, activo_desde,
         health_score, score_actividad, score_adopcion, score_pago, score_relacional
    FROM public.cuentas
   WHERE estado IN ('activo', 'en_riesgo');

COMMENT ON VIEW prediccion.v_cuentas_vivas IS
  'Solo lectura de public.cuentas. No reproduce ninguna regla de negocio: el MRR '
  'y el contacto se resuelven en sus librerias para que exista UNA cifra de cada '
  'cosa.';


-- ─── 5. PERMISOS EXPLICITOS ────────────────────────────────────────────────
--
-- `ALTER DEFAULT PRIVILEGES` de arriba cubre lo que se cree DESPUES de esa
-- linea, y las tablas de este archivo lo son. Esto se repite explicito por si el
-- archivo se corre por partes o alguien ya habia creado el esquema: un permiso
-- que falta se manifiesta como un error de PostgREST que parece otra cosa.
GRANT SELECT ON ALL TABLES IN SCHEMA prediccion TO authenticated;
GRANT ALL    ON ALL TABLES IN SCHEMA prediccion TO service_role;


-- ============================================================================
-- COMPROBACION DE QUE QUEDO BIEN
-- Correr esto despues, y despues de exponer el esquema en el tablero. Las tres
-- filas tienen que salir.
--
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'prediccion' ORDER BY table_name;
--   -- esperado: corridas, snapshot_semanal, tareas_hueco, v_cuentas_vivas
--
-- Y desde fuera, que la API ya la alcance:
--   GET <url>/rest/v1/snapshot_semanal   con cabecera  Accept-Profile: prediccion
--   -- esperado: [] (vacio), NO un 406 PGRST106
-- ============================================================================


-- ============================================================================
-- REVERSION COMPLETA
-- Descomentar y ejecutar. El tablero queda exactamente como estaba: nada de lo
-- de arriba es leido por ninguna pantalla existente.
--
--   DROP SCHEMA prediccion CASCADE;
--
-- ============================================================================
