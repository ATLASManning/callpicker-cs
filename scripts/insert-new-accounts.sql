-- Insertar nuevas cuentas: LINEACEL y Ancona Autopartes
-- Ejecutar en Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. LINEACEL - Distribuidor BAIT
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO cuentas (
  consecutivo, cid, empresa, asesor, facturacion, activo_desde,
  servicio, estado, pagos_al_corriente,
  health_score, score_actividad, score_adopcion, score_pago, score_relacional,
  contacto_nombre, contacto_email, contacto_tel, contacto_cargo,
  giro, tamano_empresa, direccion_fiscal, pagina_web,
  tiene_chat_activo, tiene_integracion_api, tiene_pago_automatico,
  tiene_ia_voz, tiene_ia_chat, dashboard_revisado,
  dias_sin_actividad, llamadas_cambio_pct, llamadas_atendidas_pct,
  notas, observaciones_kam, ultimo_contacto
) VALUES (
  'C52',                           -- consecutivo
  '180969',                        -- cid
  'LINEACEL',                      -- empresa
  'Claudia',                       -- asesor
  500,                             -- facturacion (MRR base)
  '2026-05-07',                    -- activo_desde
  'Callpicker Base + Softphone',   -- servicio
  'activo',                        -- estado
  true,                            -- pagos_al_corriente
  75,                              -- health_score (implementación ✓, adopción ✓, pagos ✓)
  85, 90, 100, 80,                 -- scores
  'Contacto',                      -- contacto_nombre
  'lineacel.tecnologia@gmail.com', -- contacto_email
  '',                              -- contacto_tel
  'Administrador',                 -- contacto_cargo
  'Telecomunicaciones / Distribuidor BAIT',  -- giro
  'Pequeña',                       -- tamano_empresa
  'Toluca, Estado de México',      -- direccion_fiscal
  'lineacel.com',                  -- pagina_web
  false,                           -- tiene_chat_activo
  false,                           -- tiene_integracion_api
  false,                           -- tiene_pago_automatico
  false,                           -- tiene_ia_voz
  false,                           -- tiene_ia_chat
  true,                            -- dashboard_revisado
  0,                               -- dias_sin_actividad
  0,                               -- llamadas_cambio_pct
  95,                              -- llamadas_atendidas_pct
  '[PROPUESTA_CHAT_API] $32,572 USD (Chat API + mensajes). Canalizado a Perfilamiento 14-ago-2026. Ciclo corto: Registro Nacional de Números puede afectar base de contactos.',
  'Cliente muy activo con plataforma. Usa intensivamente para campañas salientes (950 llamadas out vs 20 in en 3.3 meses). Señales de expansión: vacancias POS. Monitoreo recomendado.',
  '2026-08-14'
) ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. ANCONA AUTOPARTES - Refaccionaria multisucursal
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO cuentas (
  consecutivo, cid, empresa, asesor, facturacion, activo_desde,
  servicio, estado, pagos_al_corriente,
  health_score, score_actividad, score_adopcion, score_pago, score_relacional,
  contacto_nombre, contacto_email, contacto_tel, contacto_cargo,
  giro, tamano_empresa, num_oficinas, direccion_fiscal, pagina_web,
  tiene_chat_activo, tiene_integracion_api, tiene_pago_automatico,
  tiene_ia_voz, tiene_ia_chat, dashboard_revisado,
  dias_sin_actividad, llamadas_cambio_pct, llamadas_atendidas_pct,
  notas, observaciones_kam, ultimo_contacto
) VALUES (
  'F24',                           -- consecutivo
  '24924',                         -- cid
  'Ancona Autopartes',             -- empresa
  'Fátima',                        -- asesor
  15543,                           -- facturacion (MRR actual)
  '2019-09-01',                    -- activo_desde
  'Callpicker Base · 14 Extensiones',  -- servicio
  'en_riesgo',                     -- estado (Health Score 65/100)
  true,                            -- pagos_al_corriente
  65,                              -- health_score (6 años sin adopción)
  70, 0, 95, 50,                   -- scores (adopción 0/6 módulos)
  'Fátima',                        -- contacto_nombre
  '',                              -- contacto_email
  '',                              -- contacto_tel
  'SAC',                           -- contacto_cargo
  'Autopartes / Refaccionaria',    -- giro
  'Grande',                        -- tamano_empresa
  14,                              -- num_oficinas
  'Toluca / Península Yucatán',    -- direccion_fiscal
  'ancona.mx',                     -- pagina_web
  false,                           -- tiene_chat_activo
  false,                           -- tiene_integracion_api
  false,                           -- tiene_pago_automatico
  false,                           -- tiene_ia_voz
  false,                           -- tiene_ia_chat
  false,                           -- dashboard_revisado
  0,                               -- dias_sin_actividad
  0,                               -- llamadas_cambio_pct
  96.1,                            -- llamadas_atendidas_pct (post-corrección)
  '[INCIDENTE_JULIO] 15 días, ~4,028 llamadas perdidas (5–19 jul 2026). Causa: falta de destino en CAM Talleres (3,522 sin routing). Corrección 20-jul exitosa (62.8%→3.9%). PERO: 5 sucursales pequeñas sin mejora (20%–41% pérdida residual). PUNTO ÚNICO DE FALLA: 98% tráfico CAM Talleres depende de "Jorge QROO". [FALTA_HS]',
  'Reporte forense: incidente no fue detectado por Callpicker ni cliente en 15 días. Cero módulos adoptados en 6 años. Propuesta IA de Voz como red de contención en sucursales pequeñas. Oportunidad de expansión clara.',
  '2026-08-14'
) ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Verificar inserciones
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT consecutivo, empresa, asesor, facturacion, health_score, estado
FROM cuentas
WHERE consecutivo IN ('C52', 'F24')
ORDER BY consecutivo;
