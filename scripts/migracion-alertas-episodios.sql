-- ═══════════════════════════════════════════════════════════════════════════
-- EPISODIOS DE ALERTA · el ciclo de vida de cada condición de riesgo
--
-- Ejecutar en el SQL Editor de Supabase. Es IDEMPOTENTE: correrlo dos veces no
-- rompe nada. El rollback va comentado al final.
--
-- ── PARA QUÉ ────────────────────────────────────────────────────────────────
-- Hoy las alertas se calculan en vivo en cada petición y no se guardan. Por eso
-- el tablero no puede decir «esta cuenta lleva 47 días en riesgo», no distingue
-- una alerta nueva de una que lleva dos meses, y no sabe si alguien la miró.
-- Es la diferencia entre CONTAR el riesgo y ANTICIPARLO, que es lo primero que
-- pidieron los fundadores.
--
-- ── QUÉ ES UN RENGLÓN ───────────────────────────────────────────────────────
-- NO es una alerta detectada, ni una fila por día. Es un EPISODIO: el tramo
-- continuo durante el cual una condición estuvo encendida en una cuenta. La
-- misma cuenta puede tener tres episodios de silencio en el año; son tres
-- renglones, y el tercero sabe que es el tercero.
--
-- ── POR QUÉ LA LLAVE NO ES EL TIPO DE ALERTA ────────────────────────────────
-- `lib/alertas.ts` construye un id estable `tipo:cuentaId`, y para empatar un
-- cálculo con el siguiente está bien. Para un episodio NO alcanza, y es la
-- trampa que más caro habría costado:
--
--   `lib/alertas-detectar.ts` levanta los tipos de contacto en un ÚNICO
--   if/else, o sea que son mutuamente excluyentes. Cuando una cuenta pasa de
--   `silencio_30` a `silencio_60`, el tipo CAMBIA — y si el tipo fuera la
--   llave, el episodio se daría por cerrado el día que EMPEORÓ y el contador de
--   días volvería a cero justo en el momento más grave. Lo mismo con
--   `uso_bajo → consumo_cero` y `caida_consumo → desplome_consumo`.
--
-- Por eso la llave es (cuenta_id, condicion), donde `condicion` es el GRUPO DE
-- ESCALAMIENTO, y el `tipo` es un atributo que cambia DENTRO del episodio
-- dejando rastro en `tipo_apertura` y `escalo_en`.
--
-- ── LO QUE ESTA TABLA NO DECIDE ─────────────────────────────────────────────
-- No decide si hay riesgo. Eso lo sigue decidiendo `detectarAlertas()` con sus
-- reglas deterministas y legibles. Esta tabla sólo recuerda DESDE CUÁNDO. Por
-- eso la aplicación tiene que funcionar sin ella: mientras no exista, las
-- alertas se ven igual que hoy y la pantalla DICE que la antigüedad no se está
-- midiendo. Un «0 días» en su lugar sería un cero sin medición.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.alertas_episodios (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Identidad ────────────────────────────────────────────────────────────
  -- El grupo de escalamiento. ES LA LLAVE junto con cuenta_id. Los siete salen
  -- de la estructura if/else del detector: dentro de cada grupo los tipos son
  -- mutuamente excluyentes, así que pasar de uno a otro es la misma historia
  -- empeorando, no una alerta nueva.
  -- OJO: ESTE ARCHIVO ES LA MIGRACIÓN ORIGINAL, NO EL ESTADO DE LA BASE.
  -- La tabla se alteró después, el 7 oct 2026, para admitir una OCTAVA
  -- condición, `escrito`, que es la de la capa cualitativa. Leer sólo esta
  -- lista lleva a concluir que los tres tipos escritos no pueden abrir
  -- episodio, y es falso: comprobado contra la base con
  -- `python scripts/verifica-check-condicion.py`, que intenta la escritura y
  -- mira el código de error —23514 es el CHECK; cualquier otro dice que la
  -- fila de prueba está mal armada, no que la base rechace el valor.
  condicion          TEXT NOT NULL CHECK (condicion IN (
                       'medicion',   -- sin_consumo_medible
                       'consumo',    -- caida / desplome / consumo_cero / uso_bajo / rebasa_bolsa
                       'contacto',   -- nunca_contactada / sin_interlocutor / silencio_60 / silencio_30
                       'radar',      -- sin_radar
                       'contactos',  -- sin_contactos
                       'ficha',      -- sin_ficha
                       'trabajo'     -- RETIRADA el 8 oct 2026 con el generador SAC.
                                     -- El valor SE QUEDA en el CHECK: hay 69
                                     -- episodios abiertos con él y hay que
                                     -- poder leerlos para cerrarlos.
                                     -- (y 'escrito', añadida en la base el 7 oct)
                     )),

  -- El tipo VIGENTE del catálogo. Cambia si el episodio escala.
  tipo               TEXT NOT NULL,
  -- El tipo con el que nació. No se toca nunca: es la mitad de la historia.
  tipo_apertura      TEXT NOT NULL,

  familia            TEXT NOT NULL
                     CHECK (familia IN ('ceguera','riesgo','abandono','oportunidad')),

  -- Quién puede cerrarla. Se deriva del catálogo, no se captura. Existe para
  -- que ningún corte por ejecutivo le cobre a nadie el tiempo de lo que no
  -- puede resolver: hoy `sin_consumo_medible` depende de Ingeniería y son las
  -- alertas de mayor prioridad del tablero.
  dueno              TEXT NOT NULL CHECK (dueno IN ('asesor','ingenieria','direccion')),

  -- El vínculo autoritativo. CASCADE y no RESTRICT: un episodio es un registro
  -- DERIVADO, no un documento de cliente. (Una baja no borra la cuenta: la pasa
  -- a Dormida, y entonces sus episodios se cierran como `suspendida`.)
  cuenta_id          UUID NOT NULL REFERENCES public.cuentas(id) ON DELETE CASCADE,

  -- Copias legibles para reportes. NO son llaves. `asesor_apertura` se llama
  -- así a propósito: es HISTORIA —«lo abrió la cartera de Dan»—. Todo corte por
  -- ejecutivo se cruza con `cuentas.asesor` AL LEER, porque la cartera se
  -- rebalancea y el episodio no se reasigna a mano.
  consecutivo        TEXT,
  empresa            TEXT,
  asesor_apertura    TEXT,

  -- ── El ciclo de vida ─────────────────────────────────────────────────────
  estado             TEXT NOT NULL DEFAULT 'abierta'
                     CHECK (estado IN ('abierta','cerrada')),

  -- Primer día en que el detector VIO la condición. Fecha de negocio en hora de
  -- México (lib/fecha-local.ts), nunca toISOString().
  abierto_en         DATE NOT NULL,

  -- Primer día en que la condición ES verdad, cuando se puede deducir. Para
  -- `silencio_60` el detector ya sabe que hace 74 días, así que el episodio
  -- nace diciendo 74 y no 0. Sin esto, el día que se cree la tabla TODO
  -- empezaría en cero y el tablero acusaría a tres personas de no haber hecho
  -- nada. NULL cuando no es deducible: `sin_radar` no tiene fecha de inicio.
  condicion_desde    DATE,

  -- Última corrida que volvió a ver la condición. Es también el sello de
  -- «cuándo se midió esto».
  confirmada_el      DATE NOT NULL,

  -- Primera corrida que ya NO la vio. Abre la ventana de gracia; no es el
  -- cierre. Hace falta porque la condición de consumo PARPADEA: se recalcula
  -- sobre una ventana deslizante de cinco meses y, medido entre los dos
  -- archivos de cortes reales, 22 de 192 cuentas cambian de rama al actualizar.
  -- Cerrar al primer día que no se ve daría por «remitidas» cuentas que nadie
  -- tocó.
  ausente_desde      DATE,

  -- El día en que la condición dejó de verse, NO el día en que la cerramos. La
  -- gracia y los huecos del cron son nuestros, no del cliente: meterlos en la
  -- duración inflaría cada episodio del año.
  cerrado_en         DATE,

  -- Los cuatro finales posibles, y NO significan lo mismo:
  --   resuelta        alguien la atendió y por eso se apagó
  --   remitio         se apagó sola (el cliente volvió a consumir, Ingeniería
  --                   metió el CID). Contarla como éxito del ejecutivo sería
  --                   mentir sobre el trabajo del equipo.
  --   baja_autorizada la cuenta se fue, con autorización de baja
  --   suspendida      salió de la cartera viva SIN baja autorizada —Dormida por
  --                   retraso de cobranza—, que es reversible y no es fracaso
  --                   de nadie. Separarla de `baja_autorizada` importa: por la
  --                   regla de la casa, el churn del mes vivo es cartera por
  --                   cobrar y se recupera con el pago.
  cierre_motivo      TEXT CHECK (cierre_motivo IN
                       ('resuelta','remitio','baja_autorizada','suspendida')),

  -- ── Escalamiento dentro del episodio ─────────────────────────────────────
  severidad_apertura TEXT NOT NULL,
  severidad_actual   TEXT NOT NULL,
  -- Lo PEOR que llegó a estar. Un episodio que escaló a crítica y bajó a media
  -- no es un episodio medio: es uno que estuvo en crítica.
  severidad_peor     TEXT NOT NULL,
  escalo_en          DATE,
  desescalo_en       DATE,

  -- ── El dinero, fotografiado ──────────────────────────────────────────────
  -- Para poder contestar «¿atenderla sirvió de algo?» sin pedirle a nadie que
  -- lo escriba. NUMERIC y no FLOAT: es facturación.
  mrr_apertura       NUMERIC(12,2),
  mrr_actual         NUMERIC(12,2),
  mrr_cierre         NUMERIC(12,2),
  es_top_apertura    BOOLEAN NOT NULL DEFAULT false,
  es_top_actual      BOOLEAN NOT NULL DEFAULT false,

  -- ── La evidencia, con sus números ────────────────────────────────────────
  -- Las dos: con qué números nació y con cuáles va hoy. Sin el número la
  -- alerta no se puede defender, y es lo que convirtió las 383 acciones de
  -- auditoría en texto que nadie siguió.
  evidencia_apertura TEXT,
  evidencia_actual   TEXT,

  -- Cuántas veces ha vuelto esta condición en esta cuenta. NO se publica en
  -- ningún corte por ejecutivo: quien llama cada 35 días acumula recurrencia y
  -- quien abandona la cuenta tiene un solo episodio eterno. Sólo se lee dentro
  -- de la ficha, junto a la cadencia que lo explica.
  recurrencia        INTEGER NOT NULL DEFAULT 0,

  -- ── Silenciar, que es la escotilla ───────────────────────────────────────
  -- Toda regla dura necesita una válvula, o se evade por fuera. El motivo es
  -- estructurado —a quién se espera y hasta cuándo— y el autor queda escrito:
  -- en los cortes por ejecutivo los silencios se muestran SIEMPRE junto al
  -- número y con su autor.
  silenciada_hasta   DATE,
  silenciada_motivo  TEXT,
  silenciada_por     TEXT,

  creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un episodio cerrado tiene que decir CUÁNDO y POR QUÉ. Las dos cosas o
  -- ninguna: media verdad aquí es un episodio que no se puede contar.
  CONSTRAINT cierre_completo CHECK (
    (estado = 'abierta' AND cerrado_en IS NULL AND cierre_motivo IS NULL)
    OR
    (estado = 'cerrada' AND cerrado_en IS NOT NULL AND cierre_motivo IS NOT NULL)
  ),

  -- El reloj no puede correr hacia atrás.
  CONSTRAINT fechas_coherentes CHECK (
    (condicion_desde IS NULL OR condicion_desde <= abierto_en)
    AND confirmada_el >= abierto_en
    AND (cerrado_en IS NULL OR cerrado_en >= abierto_en)
  )
);

-- ── LA INVARIANTE, EN LA BASE Y NO EN EL CÓDIGO ────────────────────────────
-- Una cuenta no puede tener DOS episodios abiertos de la misma condición. Con
-- esto, que la condición vuelva meses después es forzosamente un renglón NUEVO
-- —con su `recurrencia`— y no un parche sobre el viejo. Es un índice parcial
-- porque los cerrados sí se repiten: ahí está la historia.
CREATE UNIQUE INDEX IF NOT EXISTS idx_episodios_abierto_unico
  ON public.alertas_episodios (cuenta_id, condicion)
  WHERE estado = 'abierta';

CREATE INDEX IF NOT EXISTS idx_episodios_cuenta     ON public.alertas_episodios (cuenta_id);
CREATE INDEX IF NOT EXISTS idx_episodios_abiertas   ON public.alertas_episodios (estado, condicion)
  WHERE estado = 'abierta';
CREATE INDEX IF NOT EXISTS idx_episodios_dueno      ON public.alertas_episodios (dueno)
  WHERE estado = 'abierta';
CREATE INDEX IF NOT EXISTS idx_episodios_antiguedad ON public.alertas_episodios (condicion_desde)
  WHERE estado = 'abierta';
CREATE INDEX IF NOT EXISTS idx_episodios_confirmada ON public.alertas_episodios (confirmada_el DESC);

-- ── EL RELOJ NO SE PUEDE ADELANTAR ─────────────────────────────────────────
-- `condicion_desde` sólo puede ir hacia ATRÁS: si una corrida deduce un inicio
-- más antiguo —porque llegó un dato que faltaba—, se corrige; si deduce uno más
-- nuevo, se ignora. Va en un trigger y no en TypeScript porque es la clase de
-- regla que una sincronización mal escrita rompe sin que nadie lo note, y
-- porque desde aquí la protege también cualquier corrección hecha a mano.
CREATE OR REPLACE FUNCTION public.episodios_reloj_atras()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.condicion_desde IS NULL THEN
    NEW.condicion_desde := OLD.condicion_desde;
  ELSIF OLD.condicion_desde IS NOT NULL THEN
    NEW.condicion_desde := LEAST(OLD.condicion_desde, NEW.condicion_desde);
  END IF;
  NEW.abierto_en     := LEAST(OLD.abierto_en, NEW.abierto_en);
  NEW.severidad_peor := CASE
    WHEN OLD.severidad_peor = 'critica' OR NEW.severidad_actual = 'critica' THEN 'critica'
    WHEN OLD.severidad_peor = 'alta'    OR NEW.severidad_actual = 'alta'    THEN 'alta'
    WHEN OLD.severidad_peor = 'media'   OR NEW.severidad_actual = 'media'   THEN 'media'
    ELSE OLD.severidad_peor
  END;
  NEW.actualizado_en := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_episodios_reloj ON public.alertas_episodios;
CREATE TRIGGER trg_episodios_reloj
  BEFORE UPDATE ON public.alertas_episodios
  FOR EACH ROW EXECUTE FUNCTION public.episodios_reloj_atras();

COMMENT ON TABLE public.alertas_episodios IS
  'Un renglon por EPISODIO: el tramo continuo en que una condicion estuvo encendida en una cuenta. No decide si hay riesgo —eso lo hace detectarAlertas()—; recuerda desde cuando.';
COMMENT ON COLUMN public.alertas_episodios.condicion IS
  'Grupo de escalamiento. Es la llave junto con cuenta_id. silencio_30 y silencio_60 son la MISMA condicion empeorando, no dos alertas.';
COMMENT ON COLUMN public.alertas_episodios.condicion_desde IS
  'Primer dia en que la condicion es verdad, no el dia en que se creo la tabla. Por eso un episodio puede nacer diciendo 74 dias.';
COMMENT ON COLUMN public.alertas_episodios.cerrado_en IS
  'El dia en que la condicion dejo de VERSE, no el dia en que se cerro el renglon. La ventana de gracia es nuestra, no del cliente.';
COMMENT ON COLUMN public.alertas_episodios.cierre_motivo IS
  'resuelta / remitio / baja_autorizada / suspendida. `remitio` NO es exito del ejecutivo: se apago sola.';
COMMENT ON COLUMN public.alertas_episodios.asesor_apertura IS
  'HISTORIA: la cartera que lo abrio. Todo corte por ejecutivo se cruza con cuentas.asesor AL LEER, porque la cartera se rebalancea.';
COMMENT ON COLUMN public.alertas_episodios.recurrencia IS
  'Cuantas veces volvio esta condicion. NO se publica por ejecutivo: quien llama seguido acumula recurrencia y quien abandona tiene un episodio eterno.';

-- RLS encendido y SIN politicas: solo la llave de servicio entra. El navegador
-- nunca habla con esta tabla; pasa por /api/alertas, que exige sesion.
ALTER TABLE public.alertas_episodios ENABLE ROW LEVEL SECURITY;

-- ── VERIFICACIÓN ───────────────────────────────────────────────────────────
-- Recién creada debe dar todo en cero y `invariante_ok` en true.
SELECT
  count(*)                                                   AS episodios,
  count(*) FILTER (WHERE estado = 'abierta')                 AS abiertos,
  count(*) FILTER (WHERE estado = 'cerrada')                 AS cerrados,
  count(DISTINCT cuenta_id)                                  AS cuentas,
  -- Cierra: abiertos + cerrados = total
  (count(*) FILTER (WHERE estado = 'abierta')
   + count(*) FILTER (WHERE estado = 'cerrada')) = count(*)  AS particion_cierra,
  -- Ningun par (cuenta, condicion) repetido entre los abiertos
  count(*) FILTER (WHERE estado = 'abierta')
    = (SELECT count(DISTINCT (cuenta_id, condicion))
         FROM public.alertas_episodios WHERE estado = 'abierta') AS invariante_ok
FROM public.alertas_episodios;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK — descomentar y correr SOLO si hay que deshacer. Borra la historia
-- de antiguedad de todas las alertas; no se puede reconstruir hacia atras.
--
-- DROP TRIGGER  IF EXISTS trg_episodios_reloj ON public.alertas_episodios;
-- DROP FUNCTION IF EXISTS public.episodios_reloj_atras();
-- DROP TABLE    IF EXISTS public.alertas_episodios;
-- ═══════════════════════════════════════════════════════════════════════════
