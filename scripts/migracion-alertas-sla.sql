-- ═══════════════════════════════════════════════════════════════════════════
-- SLA DE ALERTAS · fecha compromiso, semáforo de vencimiento y cierre con
-- evidencia registrada en la cuenta.
--
-- Ejecutar en el SQL Editor de Supabase. Es IDEMPOTENTE: correrlo dos veces no
-- rompe nada. El rollback va comentado al final.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LO QUE ESTA MIGRACIÓN **NO** HACE, Y ES LO PRIMERO QUE HAY QUE SABER
-- ═══════════════════════════════════════════════════════════════════════════
--
-- NO crea un registro paralelo de alertas. Ya existe: `alertas_episodios`, con
-- su llave `(cuenta_id, condicion)` forzada por índice único parcial sobre los
-- abiertos. ESA llave es la «huella» que impide duplicar una alerta mientras
-- siga abierta, y está en la base, no en TypeScript.
--
-- Una tabla nueva con su propio hash de (cuenta + situación) sería una SEGUNDA
-- copia del mismo hecho. Este repositorio ya pagó ese defecto varias veces
-- —las «paletas gemelas»—: dos registros del mismo hecho se desalinean y nada
-- falla mientras se desalinean. Así que el SLA **cuelga del episodio**:
--
--   alertas_episodios   ya sabe   DESDE CUÁNDO, qué severidad, cuánto dinero,
--                                 con qué evidencia saltó, y cuándo se apagó.
--   alertas_sla         añade     PARA CUÁNDO hay que atenderla, si se atendió,
--                                 con qué evidencia, y a quién se escaló.
--
-- `episodio_id` es UNIQUE: un episodio tiene a lo más un compromiso. Cuando la
-- condición vuelve meses después, el detector abre un episodio NUEVO —con su
-- `recurrencia`— y ése trae su propio compromiso. El reloj no se recicla.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DOS CIERRES QUE NO SIGNIFICAN LO MISMO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- `lib/alertas-movimiento.ts` ya tiene medido y escrito qué apaga cada
-- condición, y la respuesta incómoda es que a la mayoría NO la apaga nada que
-- nosotros capturemos: el consumo lo mueve el cliente usando el servicio, la
-- medición la mueve Ingeniería, la facturación la mueve el corte del GRC, y la
-- atención telefónica la mueve el enrutamiento del propio cliente.
--
-- Si el SLA se cerrara «cuando la alerta se apaga», sobre esas condiciones
-- sería un reloj que nadie puede parar — y este proyecto ya sabe cómo acaba
-- eso: el Radar lleva 0 de 192 completo porque lo que se percibe como
-- imposible se abandona, y se lleva por delante la credibilidad de lo que sí
-- era accionable.
--
-- Y si se cerrara con cualquier captura, reconstruiríamos lo que dirección
-- retiró el 8 oct 2026 con el generador SAC: un sistema donde registrar
-- trabajo apaga avisos sin que la situación del cliente haya cambiado.
--
-- Por eso son DOS cierres, en dos tablas, y ninguno implica al otro:
--
--   alertas_sla.estado = 'cerrada'   → LA ATENCIÓN está cerrada. Habla de
--                                      NOSOTROS: se llamó, se documentó, se
--                                      dejó próximo paso. Exige evidencia.
--   alertas_episodios.estado='cerrada' → LA CONDICIÓN se apagó. Habla del
--                                      CLIENTE. La cierra el detector, nunca
--                                      un formulario.
--
-- Una alerta atendida cuya condición sigue encendida se queda EN PANTALLA, con
-- las dos frases dichas: «atendida el 25 nov; la condición sigue abierta, y la
-- apaga <lo que la apaga>». Es la única versión honesta.
--
-- Cuando el episodio cierra sin que nadie lo atendiera, su SLA cierra con
-- motivo `resuelta_sin_intervencion` — que es el `remitio` del episodio dicho
-- en el vocabulario del compromiso. NO cuenta como atendida en ninguna
-- métrica: contarla sería atribuirle al equipo un mérito que no tuvo.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- POR QUÉ `vencida` NO ES UN ESTADO GUARDADO
-- ═══════════════════════════════════════════════════════════════════════════
--
-- El semáforo se CALCULA al leer, comparando `fecha_limite` con hoy en hora de
-- México. Guardarlo exigiría que algo lo refrescara cada día, y el día que el
-- cron se salte una corrida —ya pasó— el tablero publicaría «en tiempo» sobre
-- una alerta vencida sin que nada fallara. Es la misma regla que la antigüedad
-- de `alertas_episodios`: lo que se deriva de una fecha se deriva al leer.
--
-- `escalada` SÍ es estado guardado, porque es un HECHO —se notificó a alguien—
-- y no una resta de fechas.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS: ENCENDIDO Y SIN POLÍTICAS, IGUAL QUE LAS 25 DE `public`
-- ═══════════════════════════════════════════════════════════════════════════
--
-- El encargo pide «el asesor sólo ve y modifica alertas de su cartera», y eso
-- NO se puede escribir como política de RLS en esta aplicación: no hay sesión
-- de Postgres por usuario. La sesión es propia (`lib/auth.ts` + cabeceras
-- `x-user-rol` / `x-user-asesor`), el navegador nunca habla con Supabase
-- —`lib/supabase.ts` exporta un cliente anónimo que **no importa nadie**— y
-- todo consulta con `supabaseAdmin`, que usa la llave de servicio. Una
-- política contra `auth.uid()` no casaría nunca con nada: sería decoración.
--
-- Peor que decoración: el 21 oct 2026 este proyecto tuvo una fuga porque una
-- política vieja al rol `public` se ACTIVÓ al encender RLS. Una política de más
-- es exactamente como empezó aquello.
--
-- Así que aquí RLS va encendido y sin políticas —o sea, negar todo salvo la
-- llave de servicio— y el candado por cartera vive donde ya vive y está
-- medido: `lib/dueno.ts`, con `scripts/mide-dueno-cartera.py` y
-- `scripts/revisa-rls.py` como comprobantes. La llave de servicio no sale del
-- servidor.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- 1 · DÍAS INHÁBILES
--
-- Los plazos se cuentan en días hábiles, y «hábil» no es «no es fin de
-- semana»: el 16 de noviembre de 2026 fue lunes y fue festivo. Sin esta tabla
-- una alerta crítica abierta el viernes 13 habría vencido el lunes 16, que
-- nadie trabajó.
--
-- Se siembran los festivos del art. 74 de la Ley Federal del Trabajo para
-- 2026-2028, con sus fechas CALCULADAS (primer lunes de febrero, tercer lunes
-- de marzo, tercer lunes de noviembre) y no tecleadas de memoria. El 1 de
-- diciembre NO va: la transmisión del Poder Ejecutivo cae cada seis años y la
-- última fue 2024, así que la siguiente es 2030.
--
-- Los puentes propios de la empresa —el 24 y el 31 de diciembre, por ejemplo—
-- NO se siembran aquí: no son festivos de ley y quien los decide es dirección.
-- Se agregan con un INSERT cuando se decidan, que es justo para lo que esta
-- tabla es configurable.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.dias_inhabiles (
  fecha      DATE PRIMARY KEY,
  motivo     TEXT NOT NULL,
  -- 'ley' = art. 74 LFT · 'empresa' = puente o cierre decidido por dirección
  origen     TEXT NOT NULL DEFAULT 'ley' CHECK (origen IN ('ley', 'empresa')),
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.dias_inhabiles IS
  'Dias que NO cuentan para un plazo. Sabados y domingos no van aqui: los decide el calendario, no una fila. Aqui van festivos de ley y puentes de empresa.';

INSERT INTO public.dias_inhabiles (fecha, motivo, origen) VALUES
  ('2026-01-01', 'Ano Nuevo',                     'ley'),
  ('2026-02-02', 'Dia de la Constitucion',        'ley'),
  ('2026-03-16', 'Natalicio de Benito Juarez',    'ley'),
  ('2026-05-01', 'Dia del Trabajo',               'ley'),
  ('2026-09-16', 'Independencia',                 'ley'),
  ('2026-11-16', 'Revolucion Mexicana',           'ley'),
  ('2026-12-25', 'Navidad',                       'ley'),
  ('2027-01-01', 'Ano Nuevo',                     'ley'),
  ('2027-02-01', 'Dia de la Constitucion',        'ley'),
  ('2027-03-15', 'Natalicio de Benito Juarez',    'ley'),
  ('2027-05-01', 'Dia del Trabajo',               'ley'),
  ('2027-09-16', 'Independencia',                 'ley'),
  ('2027-11-15', 'Revolucion Mexicana',           'ley'),
  ('2027-12-25', 'Navidad',                       'ley'),
  ('2028-01-01', 'Ano Nuevo',                     'ley'),
  ('2028-02-07', 'Dia de la Constitucion',        'ley'),
  ('2028-03-20', 'Natalicio de Benito Juarez',    'ley'),
  ('2028-05-01', 'Dia del Trabajo',               'ley'),
  ('2028-09-16', 'Independencia',                 'ley'),
  ('2028-11-20', 'Revolucion Mexicana',           'ley'),
  ('2028-12-25', 'Navidad',                       'ley')
ON CONFLICT (fecha) DO NOTHING;

ALTER TABLE public.dias_inhabiles ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2 · LOS PLAZOS, CONFIGURABLES
--
-- La llave es la CONDICIÓN del episodio —el grupo de escalamiento de
-- `lib/alertas.ts`— y no la «situación» de la cuenta. Las dos razones:
--
--   1. La situación es UNA por cuenta (`veredictoDe` devuelve la primera que
--      aplica) y las alertas son VARIAS por cuenta. Un plazo por situación
--      dejaría sin fecha a todas las alertas menos a la que ganó el veredicto.
--   2. La llave del episodio ya es la condición, y el compromiso cuelga del
--      episodio. Introducir aquí una segunda llave obligaría a traducir entre
--      las dos en cada lectura, y esa traducción es donde se cuelan las
--      derivas.
--
-- La correspondencia con la tabla del encargo, dicha para poder discutirla:
--
--   «Se está yendo»            Crítica  1 día  → condicion `escrito`
--                                               (baja_declarada,
--                                                riesgo_escrito,
--                                                reduccion_declarada)
--   «Se está apagando»         Alta     2 días → `consumo`
--   «No la vemos (sin contacto
--     > 90 días)»              Alta     3 días → `contacto`
--   «Hay que mostrarle»        Media    5 días → (ver nota 1)
--   «Falta su auditoría»       Media    5 días → (ver nota 2)
--
-- NOTA 1 — «hay que mostrarle» NO TIENE ALERTA HOY. Es una situación del
-- veredicto que se enciende con hallazgos de clase `entrega`, y desde el 16
-- nov 2026 las alertas son «exclusivamente sobre indicios que puedan favorecer
-- una solicitud de baja o downgrade» (instrucción de dirección). La única
-- alerta de familia `oportunidad` —`rebasa_bolsa`— quedó fuera de ese
-- conjunto. Darle plazo aquí sería crear un compromiso sobre algo que ninguna
-- pantalla de alertas lista: queda SIN FILA, dicho, en vez de inventado.
--
-- NOTA 2 — «falta su auditoría» TAMPOCO. Las auditorías no son una tabla de
-- Supabase: son 46 expedientes en `app/auditoria/registry.ts`, o sea código.
-- No hay fila que consultar para saber si una auditoría está «cerrada», así
-- que no se puede ni poner el plazo ni validar la evidencia. Queda sin fila y
-- se reporta como no cumplido.
--
-- LAS CONDICIONES QUE SÍ ALERTAN Y QUE EL ENCARGO NO NOMBRA sí llevan plazo,
-- porque están en el panel y alguien tiene que atenderlas: `facturacion` (el
-- GRC ya registró la reducción o el churn), `mesa` (ticket fuera de SLA) y
-- `atencion` (sus llamadas entrantes no se contestan). Se les da el plazo de
-- su severidad en el catálogo, que es la regla que el encargo aplica a las
-- demás.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sla_config (
  condicion          TEXT PRIMARY KEY,
  severidad_base     TEXT NOT NULL CHECK (severidad_base IN ('critica','alta','media','baja')),
  plazo_dias         INTEGER NOT NULL CHECK (plazo_dias BETWEEN 1 AND 60),
  -- Qué evidencia cierra la ATENCIÓN de esta condición. No es lo que apaga la
  -- alerta: eso lo dice `LO_QUE_LA_APAGA` en lib/alertas-movimiento.ts y para
  -- casi todas no es nada que capturemos nosotros.
  evidencia          TEXT[] NOT NULL DEFAULT ARRAY['seguimiento','reunion']::TEXT[],
  -- Por qué este plazo. Se MUESTRA junto al número en la pantalla de
  -- configuración: un umbral sin su razón se cambia por gusto.
  porque             TEXT NOT NULL,
  actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_por    TEXT,
  CONSTRAINT evidencia_valida CHECK (
    evidencia <@ ARRAY['seguimiento','reunion','edicion','auditoria']::TEXT[]
    AND array_length(evidencia, 1) >= 1)
);

INSERT INTO public.sla_config (condicion, severidad_base, plazo_dias, evidencia, porque) VALUES
  ('escrito',     'critica', 1, ARRAY['seguimiento','reunion']::TEXT[],
   'Alguien del equipo escribio que el cliente pide la baja, con su fecha. Es la evidencia mas fuerte que existe y no hay umbral que discutir: el caso Biolaboratorio Sadat paso 73 dias escrito en la ficha antes de que el cliente llamara a cancelar.'),
  ('facturacion', 'critica', 1, ARRAY['seguimiento','reunion']::TEXT[],
   'No es un pronostico: el GRC ya registro la reduccion o el churn en un mes cerrado. La factura ya bajo, asi que el plazo es el de la prueba, no el del indicio.'),
  ('consumo',     'alta',    2, ARRAY['seguimiento','reunion']::TEXT[],
   'La caida de consumo precede a la reduccion de plan. Dos dias habiles es lo que pidio el encargo para «se esta apagando».'),
  ('contacto',    'alta',    3, ARRAY['seguimiento','reunion']::TEXT[],
   'Silencio o falta de interlocutor. Tres dias habiles, segun el encargo. Un primer contacto se agenda, no se improvisa.'),
  ('mesa',        'critica', 1, ARRAY['seguimiento','reunion']::TEXT[],
   'Un ticket fuera de SLA es que HOY le estamos fallando. El motivo de baja mejor documentado de esta cartera tiene causa raiz interna; el folio de GTC lleva 155 dias sin que nadie lo mueva.'),
  ('atencion',    'alta',    3, ARRAY['seguimiento','reunion']::TEXT[],
   'Sus llamadas entrantes no las contesta nadie. Quien pierde la llamada es el cliente de nuestro cliente, y por eso no se queja: no lo sabe.'),
  ('ficha',       'media',   5, ARRAY['edicion']::TEXT[],
   'Faltan datos para poder auditarla. La evidencia es la EDICION de la ficha, y tiene que cambiar algo: editar sin cambiar nada no cuenta.')
ON CONFLICT (condicion) DO NOTHING;

COMMENT ON TABLE public.sla_config IS
  'Plazo en dias habiles por CONDICION de alerta. Configurable por Admin. `evidencia` es lo que cierra la ATENCION, no lo que apaga la alerta.';

ALTER TABLE public.sla_config ENABLE ROW LEVEL SECURITY;


-- ── Los parámetros que no son por condición ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sla_parametros (
  clave            TEXT PRIMARY KEY,
  valor            NUMERIC NOT NULL,
  unidad           TEXT NOT NULL,
  porque           TEXT NOT NULL,
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_por  TEXT
);

INSERT INTO public.sla_parametros (clave, valor, unidad, porque) VALUES
  ('top_pct_cartera', 20, 'porcentaje',
   'El top de facturacion de la cartera DEL ASESOR que sube un nivel de severidad. Es por cartera y no global: si fuera global, el asesor con las cuentas chicas no tendria ninguna cuenta prioritaria.'),
  ('reprogramaciones_asesor', 1, 'veces',
   'Una sola vez puede mover la fecha el asesor. La segunda la autoriza Admin.'),
  ('reprogramacion_dias', 2, 'dias habiles',
   'Cuanto puede moverse la fecha en una reprogramacion.'),
  ('reprogramacion_motivo_min', 20, 'caracteres',
   'Un motivo de tres letras no es un motivo. Se valida en el servidor.'),
  ('intentos_sin_respuesta_escala', 3, 'intentos',
   'Al tercer intento sin que nadie conteste, escala. No es falta de seguimiento: es que ya no hay interlocutor, y eso se resuelve buscando a otra persona.'),
  ('rojo_intenso_dias', 3, 'dias habiles',
   'Vencida tres dias habiles o mas se pinta rojo intenso y se fija arriba. Toda critica vencida tambien, sin importar los dias.'),
  ('resumen_min', 80, 'caracteres',
   'Minimo del resumen de un seguimiento que cierra una alerta. Un «ok» no documenta una gestion.'),
  ('minuta_min', 120, 'caracteres',
   'Minimo de la minuta de una reunion que cierra una alerta.'),
  ('meta_en_tiempo', 90, 'porcentaje',
   'Meta de cumplimiento en tiempo. Configurable.'),
  ('meta_criticas_vencidas', 0, 'alertas',
   'Meta de alertas criticas vencidas.')
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE public.sla_parametros ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3 · EL COMPROMISO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.alertas_sla (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── La identidad: el episodio, y nada más ────────────────────────────────
  -- UNIQUE: un episodio, un compromiso. La «huella» que impide duplicar ya la
  -- pone `idx_episodios_abierto_unico` sobre (cuenta_id, condicion), asi que
  -- aqui no hace falta ningun hash: se hereda de la llave de la otra tabla.
  -- CASCADE porque el compromiso es un registro DERIVADO del episodio.
  episodio_id       UUID NOT NULL UNIQUE
                    REFERENCES public.alertas_episodios(id) ON DELETE CASCADE,
  cuenta_id         UUID NOT NULL REFERENCES public.cuentas(id) ON DELETE CASCADE,

  -- Copias legibles del momento en que nació el compromiso. NO son llaves, y
  -- `asesor_apertura` es HISTORIA: todo corte por ejecutivo se cruza con
  -- `cuentas.asesor` AL LEER, porque la cartera se rebalancea y el compromiso
  -- no se reasigna a mano. Es la misma regla que en `alertas_episodios`.
  condicion         TEXT NOT NULL,
  tipo              TEXT NOT NULL,
  consecutivo       TEXT,
  empresa           TEXT,
  asesor_apertura   TEXT,
  dueno             TEXT NOT NULL CHECK (dueno IN ('asesor','ingenieria','direccion')),

  -- ── Severidad del COMPROMISO, que puede no ser la del catálogo ───────────
  -- `severidad_base` es la de `sla_config`; `severidad` es la de después de los
  -- ajustes, y `ajustes` dice CUÁLES se aplicaron. Sin esa lista, una alerta
  -- con plazo de un día no se puede explicar.
  severidad_base    TEXT NOT NULL,
  severidad         TEXT NOT NULL CHECK (severidad IN ('critica','alta','media','baja')),
  ajustes           TEXT[] NOT NULL DEFAULT '{}',

  mrr_en_riesgo     NUMERIC(12,2),

  -- Qué hacer, en imperativo, con objetivo y resultado esperado. La compone
  -- `lib/alertas-sla.ts` a partir del guion del catálogo MÁS los números de la
  -- evidencia del episodio: «dar seguimiento» no es una acción.
  accion_sugerida   TEXT NOT NULL,
  -- Qué evidencia cierra la atención. Copia de `sla_config` al nacer, para que
  -- cambiar la configuración no reescriba el compromiso de nadie.
  evidencia_requerida TEXT[] NOT NULL,

  -- ── El reloj ─────────────────────────────────────────────────────────────
  -- Fechas de negocio en hora de México (lib/fecha-local.ts), nunca
  -- toISOString().
  generada_en       DATE NOT NULL,
  fecha_limite      DATE NOT NULL,
  -- La original, cuando hubo reprogramación. Sin ella, reprogramar borraría la
  -- prueba de que se reprogramó.
  limite_original   DATE,
  fecha_atendida    DATE,
  fecha_cerrada     DATE,

  -- `vencida` NO está aquí: se calcula al leer. Ver la cabecera.
  estado            TEXT NOT NULL DEFAULT 'nueva' CHECK (estado IN (
                      'nueva',
                      'en_proceso',
                      'atendida_pendiente_validacion',
                      'cerrada',
                      'escalada',
                      'reabierta',
                      -- No la puede cerrar el asesor: hace falta Ingeniería o
                      -- una decisión de dirección. No corre contra él.
                      'bloqueada'
                    )),

  cierre_motivo     TEXT CHECK (cierre_motivo IN (
                      -- Se atendió y la evidencia pasó la validación.
                      'atendida',
                      -- La condición se apagó sola. NO es mérito del equipo:
                      -- es el `remitio` del episodio. No cuenta en el % en
                      -- tiempo, y se publica aparte porque es la señal de que
                      -- el motor o el asesor no están aportando.
                      'resuelta_sin_intervencion',
                      -- La cuenta se fue, con autorización de baja.
                      'baja_autorizada',
                      -- Salió de la cartera viva sin baja autorizada (Dormida
                      -- por cobranza), que es reversible.
                      'suspendida'
                    )),

  -- ── La evidencia ─────────────────────────────────────────────────────────
  -- Polimórfica a propósito, y SIN llave foránea: apunta a `seguimientos`,
  -- `reuniones` o `cuentas` según el tipo, y Postgres no tiene FK a varias
  -- tablas. La integridad la comprueba el servidor al vincular, que es el
  -- único sitio que sabe en cuál mirar.
  evidencia_tipo    TEXT CHECK (evidencia_tipo IN ('seguimiento','reunion','edicion','auditoria')),
  evidencia_id      UUID,
  -- Qué decía la evidencia, en una línea, para no tener que ir a buscarla.
  evidencia_resumen TEXT,

  -- ── Reprogramar ──────────────────────────────────────────────────────────
  reprogramaciones  INTEGER NOT NULL DEFAULT 0 CHECK (reprogramaciones BETWEEN 0 AND 2),
  motivo_reprogramacion TEXT,

  -- ── Sin respuesta ────────────────────────────────────────────────────────
  -- El reintento NO mueve `fecha_limite`: el reloj original sigue corriendo.
  -- Mover la fecha porque el cliente no contestó convertiría cada «sin
  -- respuesta» en una prórroga, y tres de ellas en una alerta eterna en verde.
  intentos_sin_respuesta INTEGER NOT NULL DEFAULT 0,
  reintento_limite  DATE,

  -- ── Escalamiento ─────────────────────────────────────────────────────────
  nivel_escalamiento INTEGER NOT NULL DEFAULT 0 CHECK (nivel_escalamiento BETWEEN 0 AND 3),
  escalada_a        TEXT,
  escalada_en       DATE,
  -- Para que una notificación no se repita más de una vez al día por alerta.
  notificada_el     DATE,

  -- ── Validación del líder ─────────────────────────────────────────────────
  validada_por      TEXT,
  validada_en       DATE,
  rechazo_motivo    TEXT,

  creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ── Las invariantes, en la base y no en el código ────────────────────────

  -- Un compromiso cerrado dice CUÁNDO y POR QUÉ. Las dos cosas o ninguna.
  CONSTRAINT sla_cierre_completo CHECK (
    (estado = 'cerrada' AND fecha_cerrada IS NOT NULL AND cierre_motivo IS NOT NULL)
    OR
    (estado <> 'cerrada' AND fecha_cerrada IS NULL AND cierre_motivo IS NULL)
  ),

  -- NO SE CIERRA POR ATENCIÓN SIN EVIDENCIA. Es la regla central del encargo y
  -- va aquí, no sólo en la API: un cierre a mano por SQL también tiene que
  -- chocar. `resuelta_sin_intervencion` y las dos de baja no piden evidencia
  -- —nadie atendió nada— y por eso la condición mira el motivo.
  CONSTRAINT sla_atendida_con_evidencia CHECK (
    (estado = 'atendida_pendiente_validacion' OR cierre_motivo = 'atendida')
    IS NOT TRUE
    OR (evidencia_tipo IS NOT NULL AND evidencia_id IS NOT NULL
        AND fecha_atendida IS NOT NULL)
  ),

  -- Reprogramar deja rastro: la fecha original y el motivo.
  CONSTRAINT sla_reprogramacion_completa CHECK (
    reprogramaciones = 0
    OR (limite_original IS NOT NULL
        AND motivo_reprogramacion IS NOT NULL
        AND length(btrim(motivo_reprogramacion)) >= 20)
  ),

  -- Escalar deja rastro: a quién y cuándo.
  CONSTRAINT sla_escalamiento_completo CHECK (
    nivel_escalamiento = 0
    OR (escalada_a IS NOT NULL AND escalada_en IS NOT NULL)
  ),

  -- Un rechazo del líder dice por qué, o no es un rechazo: es un borrado.
  CONSTRAINT sla_rechazo_con_motivo CHECK (
    estado <> 'reabierta' OR rechazo_motivo IS NOT NULL
  ),

  -- El reloj no corre hacia atrás.
  CONSTRAINT sla_fechas_coherentes CHECK (
    fecha_limite >= generada_en
    AND (limite_original IS NULL OR limite_original >= generada_en)
    AND (fecha_atendida IS NULL OR fecha_atendida >= generada_en)
    AND (fecha_cerrada IS NULL OR fecha_cerrada >= generada_en)
    AND (reintento_limite IS NULL OR reintento_limite >= generada_en)
  )
);

CREATE INDEX IF NOT EXISTS idx_sla_cuenta    ON public.alertas_sla (cuenta_id);
CREATE INDEX IF NOT EXISTS idx_sla_abiertas  ON public.alertas_sla (fecha_limite)
  WHERE estado <> 'cerrada';
CREATE INDEX IF NOT EXISTS idx_sla_asesor    ON public.alertas_sla (asesor_apertura)
  WHERE estado <> 'cerrada';
CREATE INDEX IF NOT EXISTS idx_sla_estado    ON public.alertas_sla (estado);
CREATE INDEX IF NOT EXISTS idx_sla_episodio  ON public.alertas_sla (episodio_id);

COMMENT ON TABLE public.alertas_sla IS
  'El COMPROMISO de atencion de un episodio de alerta: para cuando, con que evidencia, a quien se escalo. Cuelga de alertas_episodios y no lo duplica. `vencida` no es un estado: se calcula al leer.';
COMMENT ON COLUMN public.alertas_sla.episodio_id IS
  'UNIQUE: un episodio, un compromiso. La huella anti-duplicado la pone el indice unico de alertas_episodios sobre (cuenta_id, condicion).';
COMMENT ON COLUMN public.alertas_sla.cierre_motivo IS
  'atendida / resuelta_sin_intervencion / baja_autorizada / suspendida. `resuelta_sin_intervencion` NO cuenta como atendida en ninguna metrica: la condicion se apago sola.';
COMMENT ON COLUMN public.alertas_sla.evidencia_requerida IS
  'Que cierra la ATENCION. NO es lo que apaga la alerta: eso lo dice LO_QUE_LA_APAGA en lib/alertas-movimiento.ts, y para casi todas las condiciones no es nada que capturemos nosotros.';
COMMENT ON COLUMN public.alertas_sla.intentos_sin_respuesta IS
  'El reintento NO mueve fecha_limite. Mover la fecha porque el cliente no contesto volveria cada «sin respuesta» en una prorroga.';
COMMENT ON COLUMN public.alertas_sla.asesor_apertura IS
  'HISTORIA: la cartera que lo abrio. Todo corte por ejecutivo se cruza con cuentas.asesor AL LEER.';

ALTER TABLE public.alertas_sla ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4 · LA BITÁCORA, INMUTABLE DE VERDAD
--
-- «Sólo insert» no se consigue con REVOKE: todo en esta aplicación entra con
-- la llave de servicio, que tiene GRANT sobre todo. Se consigue con un trigger
-- que ABORTA el UPDATE y el DELETE — y ése muerde a cualquier rol, incluida la
-- llave de servicio y una corrección hecha a mano en el editor de Supabase.
--
-- La escotilla para administración no es poder editar la bitácora: es poder
-- QUITAR EL TRIGGER a propósito, con una línea que queda en el historial de
-- Supabase. Un candado que se abre sin dejar rastro no es un candado.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.alertas_sla_bitacora (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULLABLE, y el CHECK de abajo dice cuándo. Casi todo asiento es de UN
  -- compromiso; la excepción es el aviso diario por correo, que es un hecho del
  -- DÍA y no de una alerta: se manda un resumen por persona, no uno por alerta.
  -- Colgarlo de un compromiso cualquiera mentiría sobre a qué se refiere.
  sla_id      UUID REFERENCES public.alertas_sla(id) ON DELETE CASCADE,
  cuenta_id   UUID,
  -- Quién y con qué rol. Sale de la SESIÓN, nunca del cuerpo de la petición:
  -- un rastro falso en la bitácora de una cuenta hace responder al asesor
  -- suplantado por una gestión que no hizo.
  usuario     TEXT NOT NULL,
  rol         TEXT,
  evento      TEXT NOT NULL CHECK (evento IN (
                'generada', 'en_proceso', 'reprogramada', 'atendida',
                'evidencia_rechazada', 'cerrada', 'escalada', 'reabierta',
                'sin_respuesta', 'severidad_cambiada', 'limite_recalculado',
                'bloqueada', 'notificada'
              )),
  -- El antes y el después, para poder reconstruir. JSONB y no texto: lo lee el
  -- tablero de cumplimiento, no sólo una persona.
  detalle     JSONB NOT NULL DEFAULT '{}'::jsonb,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- UN ASIENTO HUÉRFANO SÓLO PUEDE SER EL AVISO DEL DÍA. Sin esto, `sla_id`
  -- nullable dejaría entrar cualquier evento sin compromiso y la bitácora
  -- dejaria de poder reconstruir la vida de una alerta: habria asientos que no
  -- son de nadie. El aviso ademas tiene que declarar su canal.
  CONSTRAINT bitacora_sin_sla_solo_aviso CHECK (
    sla_id IS NOT NULL
    OR (evento = 'notificada' AND detalle ? 'canal')
  )
);

CREATE INDEX IF NOT EXISTS idx_sla_bitacora_sla   ON public.alertas_sla_bitacora (sla_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_sla_bitacora_fecha ON public.alertas_sla_bitacora (creado_en DESC);

CREATE OR REPLACE FUNCTION public.sla_bitacora_inmutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'alertas_sla_bitacora es solo de insercion: % rechazado. Para corregir un asiento se inserta otro que lo explique.',
    TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sla_bitacora_inmutable ON public.alertas_sla_bitacora;
CREATE TRIGGER trg_sla_bitacora_inmutable
  BEFORE UPDATE OR DELETE ON public.alertas_sla_bitacora
  FOR EACH ROW EXECUTE FUNCTION public.sla_bitacora_inmutable();

COMMENT ON TABLE public.alertas_sla_bitacora IS
  'Solo INSERT: un trigger aborta UPDATE y DELETE, y muerde tambien a la llave de servicio. Para corregir un asiento se inserta otro.';

ALTER TABLE public.alertas_sla_bitacora ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5 · LO QUE NO SE PUEDE TOCAR DE UN COMPROMISO
--
-- `generada_en` es el origen del reloj: moverla cambia si una alerta venció.
-- `episodio_id` es su identidad. Las dos se protegen en un trigger y no en la
-- API, porque la API no es el único camino a la tabla.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sla_reloj_intacto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.generada_en <> OLD.generada_en THEN
    -- El placeholder de RAISE en plpgsql es `%`, no `%s`: con `%s` se imprime
    -- la fecha seguida de una «s» suelta.
    RAISE EXCEPTION 'alertas_sla.generada_en no se edita: es el origen del reloj (% -> %)',
      OLD.generada_en, NEW.generada_en;
  END IF;
  IF NEW.episodio_id <> OLD.episodio_id THEN
    RAISE EXCEPTION 'alertas_sla.episodio_id no se edita: es la identidad del compromiso';
  END IF;
  -- Una reprogramación sólo puede ir hacia ADELANTE, y guarda la original la
  -- primera vez. Si no, «reprogramar» serviría para adelantar la fecha y
  -- fabricar un cumplimiento.
  IF NEW.fecha_limite <> OLD.fecha_limite THEN
    IF NEW.fecha_limite < OLD.fecha_limite THEN
      RAISE EXCEPTION 'la fecha limite no se adelanta: % -> %',
        OLD.fecha_limite, NEW.fecha_limite;
    END IF;
    IF NEW.limite_original IS NULL THEN
      NEW.limite_original := OLD.fecha_limite;
    END IF;
  END IF;
  NEW.actualizado_en := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sla_reloj ON public.alertas_sla;
CREATE TRIGGER trg_sla_reloj
  BEFORE UPDATE ON public.alertas_sla
  FOR EACH ROW EXECUTE FUNCTION public.sla_reloj_intacto();


-- ═══════════════════════════════════════════════════════════════════════════
-- 6 · LA EVIDENCIA, EN LAS TABLAS QUE YA EXISTEN
--
-- Todo ADITIVO y NULLABLE: cada fila que ya está y cada formulario que ya
-- escribe siguen funcionando igual. Las columnas nuevas sólo las exige el
-- camino de evidencia, y la exigencia la aplica el servidor, no un NOT NULL
-- —un NOT NULL aquí rompería los nueve tipos de seguimiento que no cierran
-- ninguna alerta.
--
-- POR QUÉ COLUMNAS Y NO TEXTO DENTRO DE `descripcion`. Es el patrón que ya usa
-- `componerSolicitud` para la solicitud de cancelación, y funciona para leer
-- una ficha. Para las métricas de cumplimiento no: «¿cuántas gestiones
-- quedaron sin próximo paso?» sobre prosa con etiquetas es un LIKE sobre
-- cientos de filas, y este repositorio ya midió tres sitios distintos donde un
-- `slice` sobre esa prosa publicaba fontanería en vez de contenido.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.seguimientos
  ADD COLUMN IF NOT EXISTS alerta_sla_id       UUID REFERENCES public.alertas_sla(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contacto_nombre     TEXT,
  ADD COLUMN IF NOT EXISTS contacto_puesto     TEXT,
  ADD COLUMN IF NOT EXISTS proximo_paso        TEXT,
  ADD COLUMN IF NOT EXISTS proximo_paso_fecha  DATE;

CREATE INDEX IF NOT EXISTS idx_seguimientos_sla ON public.seguimientos (alerta_sla_id)
  WHERE alerta_sla_id IS NOT NULL;

COMMENT ON COLUMN public.seguimientos.alerta_sla_id IS
  'El compromiso que este seguimiento atiende, si atiende alguno. NULL en los nueve tipos que no cierran ninguna alerta.';
COMMENT ON COLUMN public.seguimientos.contacto_nombre IS
  'Con quien se hablo. Obligatorio SOLO cuando el seguimiento cierra una alerta, y lo exige el servidor: un NOT NULL aqui rompe los seguimientos ordinarios.';

ALTER TABLE public.reuniones
  ADD COLUMN IF NOT EXISTS alerta_sla_id UUID REFERENCES public.alertas_sla(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reuniones_sla ON public.reuniones (alerta_sla_id)
  WHERE alerta_sla_id IS NOT NULL;

-- El diff de una edición de ficha que sirve como evidencia. Sin el diff,
-- «editar sin cambiar nada» cuenta — y el encargo pide expresamente que no.
CREATE TABLE IF NOT EXISTS public.cuentas_ediciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id   UUID NOT NULL REFERENCES public.cuentas(id) ON DELETE CASCADE,
  alerta_sla_id UUID REFERENCES public.alertas_sla(id) ON DELETE SET NULL,
  usuario     TEXT NOT NULL,
  -- Con qué rol se guardó. Dos filas con el mismo `usuario` y rol distinto son
  -- dos cosas distintas: administración corrigiendo cartera ajena no es el
  -- asesor corrigiendo la suya.
  rol         TEXT,
  -- {campo: {antes, despues}}. Si viene vacío, no hubo cambio y no es
  -- evidencia: lo comprueba el CHECK de abajo.
  diff        JSONB NOT NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT diff_no_vacio CHECK (diff <> '{}'::jsonb AND jsonb_typeof(diff) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_ediciones_cuenta ON public.cuentas_ediciones (cuenta_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_ediciones_sla    ON public.cuentas_ediciones (alerta_sla_id)
  WHERE alerta_sla_id IS NOT NULL;

COMMENT ON TABLE public.cuentas_ediciones IS
  'El diff de una edicion de ficha. Existe para que «editar sin cambiar nada» no pueda cerrar una alerta: el CHECK rechaza un diff vacio.';

ALTER TABLE public.cuentas_ediciones ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — recién corrida debe dar los compromisos en cero, los festivos
-- sembrados y las siete condiciones con plazo.
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'dias_inhabiles'  AS tabla, count(*) AS filas FROM public.dias_inhabiles
UNION ALL SELECT 'sla_config',      count(*) FROM public.sla_config
UNION ALL SELECT 'sla_parametros',  count(*) FROM public.sla_parametros
UNION ALL SELECT 'alertas_sla',     count(*) FROM public.alertas_sla
UNION ALL SELECT 'alertas_sla_bitacora', count(*) FROM public.alertas_sla_bitacora
UNION ALL SELECT 'cuentas_ediciones',    count(*) FROM public.cuentas_ediciones;

-- Las SEIS tablas nuevas con RLS puesto. Cualquier `false` aquí es una fuga.
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename IN ('dias_inhabiles','sla_config','sla_parametros',
                     'alertas_sla','alertas_sla_bitacora','cuentas_ediciones')
 ORDER BY tablename;

-- Y SIN políticas. Una política de más es como empezó la fuga del 21 oct 2026.
SELECT tablename, policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN ('dias_inhabiles','sla_config','sla_parametros',
                     'alertas_sla','alertas_sla_bitacora','cuentas_ediciones');

-- Las columnas nuevas de evidencia, que son las que un `ADD COLUMN IF NOT
-- EXISTS` puede haberse saltado en silencio si ya existía otra con ese nombre.
SELECT table_name, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND (table_name, column_name) IN (
     ('seguimientos','alerta_sla_id'), ('seguimientos','contacto_nombre'),
     ('seguimientos','contacto_puesto'), ('seguimientos','proximo_paso'),
     ('seguimientos','proximo_paso_fecha'), ('reuniones','alerta_sla_id'))
 ORDER BY table_name, column_name;


-- ═══════════════════════════════════════════════════════════════════════════
-- PRUEBAS AL REVÉS — una regla sólo se prueba con lo que NO debe entrar.
-- Correrlas DESPUÉS de la migración, en una transacción que se deshace. Las
-- cuatro deben FALLAR; si alguna pasa, el candado no existe.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- BEGIN;
--   -- 1 · cerrar por atención sin evidencia  → debe violar sla_atendida_con_evidencia
--   INSERT INTO public.alertas_sla
--     (episodio_id, cuenta_id, condicion, tipo, dueno, severidad_base, severidad,
--      accion_sugerida, evidencia_requerida, generada_en, fecha_limite,
--      estado, fecha_cerrada, cierre_motivo)
--   SELECT id, cuenta_id, condicion, tipo, dueno, 'critica', 'critica',
--          'prueba', ARRAY['seguimiento']::TEXT[], abierto_en, abierto_en,
--          'cerrada', abierto_en, 'atendida'
--     FROM public.alertas_episodios WHERE estado='abierta' LIMIT 1;
--
--   -- 2 · reprogramar sin motivo            → debe violar sla_reprogramacion_completa
--   -- 3 · UPDATE sobre la bitácora          → debe abortar en el trigger
--   UPDATE public.alertas_sla_bitacora SET evento='cerrada' WHERE true;
--   -- 4 · DELETE sobre la bitácora          → debe abortar en el trigger
--   DELETE FROM public.alertas_sla_bitacora WHERE true;
-- ROLLBACK;


-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK — descomentar y correr SOLO si hay que deshacer.
--
-- Borra los compromisos y su bitácora; los EPISODIOS no se tocan, así que la
-- antigüedad de las alertas sobrevive. Las columnas de `seguimientos` y
-- `reuniones` se quitan al final a propósito: mientras existan, los
-- seguimientos que ya cerraron una alerta conservan con qué se cerró.
--
-- DROP TRIGGER  IF EXISTS trg_sla_bitacora_inmutable ON public.alertas_sla_bitacora;
-- DROP FUNCTION IF EXISTS public.sla_bitacora_inmutable();
-- DROP TRIGGER  IF EXISTS trg_sla_reloj ON public.alertas_sla;
-- DROP FUNCTION IF EXISTS public.sla_reloj_intacto();
-- DROP TABLE    IF EXISTS public.alertas_sla_bitacora;
-- DROP TABLE    IF EXISTS public.cuentas_ediciones;
-- ALTER TABLE   public.seguimientos
--   DROP COLUMN IF EXISTS alerta_sla_id, DROP COLUMN IF EXISTS contacto_nombre,
--   DROP COLUMN IF EXISTS contacto_puesto, DROP COLUMN IF EXISTS proximo_paso,
--   DROP COLUMN IF EXISTS proximo_paso_fecha;
-- ALTER TABLE   public.reuniones DROP COLUMN IF EXISTS alerta_sla_id;
-- DROP TABLE    IF EXISTS public.alertas_sla;
-- DROP TABLE    IF EXISTS public.sla_parametros;
-- DROP TABLE    IF EXISTS public.sla_config;
-- DROP TABLE    IF EXISTS public.dias_inhabiles;
-- ═══════════════════════════════════════════════════════════════════════════
