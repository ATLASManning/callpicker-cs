import type { AuditoriaCase } from './types'

/**
 * TECH PEOPLE (C1 · CID 2094) — 9.6 años de cliente, y nadie ha hablado con él.
 *
 * Auditoría del 12 oct 2026. Es el contrario exacto de Torres Corzo: aquí la
 * atención telefónica es excelente en el agregado —6.21% sin contestar— y lo
 * que falla está debajo del promedio, tienda por tienda.
 *
 * Cifras verificadas una por una contra fuente:
 *   · llamadas → app/cuentas/llamadas-data.ts, CID 2094 (entrega «40+», corte
 *     14 sep 2026 · su mes cerrado es AGOSTO, no septiembre)
 *   · tickets  → lib/tickets-data.json, 31 filas de «Tech People»
 *   · dinero   → data/grc-zoho.json, DOS líneas con consecutivo C1
 *   · alertas  → alertas_episodios, 4 abiertos
 *   · ficha    → tabla `cuentas`, registro completo
 */
export const TECH_PEOPLE: AuditoriaCase = {
  id: 'tech-people',
  asesor: 'Claudia',
  nombre: 'Tech People — Servicios y Reparaciones TP, S.A. de C.V.',
  sector: 'Reparación de dispositivos Apple — centros de servicio en tiendas iShop Mixup',
  fecha_periodo: 'Marzo 2017 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA — 115 meses facturados, la #2 de la cartera por MRR real',
  descripcion_contexto: '9.6 años de cliente · $88,783 al mes en el GRC (la ficha dice $59,423) · 116,054 entrantes y 121,485 salientes medidas · 6.21% sin contestar · 31 tickets · CERO contactos por canal real en todo el historial',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Atención general',          value: '6.21% sin contestar',      color: '#22c55e' },
    { label: 'Pero cinco tiendas pierden', value: 'entre 38.7% y 64.2%',     color: '#ef4444' },
    { label: 'Contacto real en 9.6 años',  value: 'CERO · 0 reuniones',      color: '#ef4444' },
    { label: 'MRR real vs. el de la ficha', value: '$88,783 vs $59,423',     color: '#f97316' },
    { label: 'Fallas del servicio',        value: '7 de 31 tickets · 22.6%', color: '#f59e0b' },
  ],

  resumen_ejecutivo: 'Tech People lleva 115 meses facturados —desde marzo de 2017— y es, con su MRR real, la segunda cuenta más grande de la cartera. Repara dispositivos Apple en más de cien centros de servicio dentro de tiendas iShop Mixup, y su conmutador es exactamente eso: el teléfono por el que un cliente pregunta si ya está su equipo.\n\nSu atención telefónica es buena y hay que decirlo primero: 7,212 llamadas sin contestar de 116,054, un 6.21%. El mes cerrado (agosto) está en 6.10% contra una base propia de 6.24% — es decir, MEJOR que su propio promedio. No hay deterioro. Esta cuenta no tiene un problema de servicio telefónico.\n\nLo que tiene es un promedio que esconde. Al abrir por destino, cinco tiendas pierden entre el 38.7% y el 64.2% de lo que les entra: iShop Oceania pierde el 48.5%, Tulum Hunab el 64.2%, iShop San Nicolás el 38.7%, Monterrey Esfera el 46.1% y Santa Anita el 43.3%. En una red de más de cien sucursales, un 6% general puede convivir con un puñado de tiendas donde la mitad de los clientes no encuentra a nadie. Y el cliente no lo ve, porque nadie se lo ha enseñado nunca.\n\nY ahí está el verdadero hallazgo de esta auditoría. En nueve años y medio NO HAY UN SOLO CONTACTO REGISTRADO POR UN CANAL REAL: ni una llamada, ni un correo, ni un WhatsApp, ni una reunión. Lo que hay son cinco notas internas —análisis, resúmenes para el área técnica, recordatorios de completar el perfil— que documentan la cuenta pero no son haber hablado con ella. El motor de alertas lo marca como CRÍTICO y tiene razón: es una cuenta de $88,783 al mes que paga puntualmente desde 2017 y con la que Callpicker nunca se ha sentado.\n\nY una tercera cosa, que es de casa: la ficha dice que factura $59,423 y el GRC dice $88,783. La diferencia son $29,360 al mes, el 33%, y viene de que la subcuenta «Tech People Soluciones» ($6,422.90) y el alza de la línea principal nunca se reflejaron en la columna. Con la cifra correcta, esta cuenta sube del tercer al segundo lugar de la cartera.',

  resultado_positivo: 'Es la relación más larga de la cartera entre las cuentas grandes: 115 meses facturados, $6,919,304 acumulados en la línea principal y $915,880 más en la subcuenta. Cero incidencias de pago en todo ese tiempo.\n\nLa operación funciona. El 6.21% general es excelente para una red de más de cien puntos de servicio, y los fines de semana —cuando las tiendas de centro comercial trabajan— atiende MEJOR que entre semana: 5.0% el sábado y 4.3% el domingo contra 6.3%–6.9% de lunes a viernes. Eso es una operación que sabe dónde está su demanda.\n\nLa adopción está medida y es alta: Voz VyC en nivel ALTO y uso del panel administrador entre medio y alto. Tiene Callpicker Chat activo. Y hay un interlocutor identificado con nombre, cargo, correo y teléfono: Camilo Eckardt, Director General — el único contacto bien capturado de las cuentas auditadas hasta ahora.\n\nEl 8 de octubre se facturó un upsell de $2,046 —3 usuarios, 3 números y un administrador adicional— que el GRC ya registra. La cuenta crece sola.',

  hallazgos: [
    'DINERO — La ficha dice $59,423 y el GRC vigente dice $88,783.20, repartidos en DOS líneas con el mismo consecutivo C1: «Tech People» ($82,360.30) y «Tech People Soluciones» ($6,422.90). La diferencia es de $29,360 al mes, el 33%. Las alertas usan la cifra correcta; la ficha y el ranking de cartera, la vieja.',
    'DINERO — Con $88,783 esta cuenta NO es la tercera de la cartera, es la SEGUNDA, por encima de Sección Amarilla. Todo lo que se ordene por el importe de la ficha la está colocando mal.',
    'RELACIÓN — CERO contactos por un canal real en 9.6 años. Ni una llamada, ni un correo, ni un WhatsApp, ni una reunión registrada. El motor lo marca `nunca_contactada` en severidad CRÍTICA. Los 5 seguimientos que existen son todos de tipo `nota`: documentan la cuenta, no son haber hablado con ella.',
    'RELACIÓN — CERO reuniones en todo el historial. La nota del 22 de agosto dice que «una vez confirmado por el cliente el horario y la fecha disponibles, se realizará el contacto»: la llamada se preparó y no consta que ocurriera. La actividad de llamada del 20 de agosto quedó SIN completar.',
    'ATENCIÓN — El promedio esconde. 6.21% general, pero cinco tiendas pierden entre el 38.7% y el 64.2%: Tulum Hunab 64.2% (97 de 151), iShop Oceania 48.5% (176 de 363), iShop Monterrey Esfera 46.1% (135 de 293), iShop Santa Anita 43.3% (103 de 238) e iShop San Nicolás de los Garza 38.7% (233 de 602).',
    'ATENCIÓN — El destino «Fin de llamada» registra 174 perdidas y 116 contestadas con CERO minutos en ambos casos. Un destino que no sostiene conversación. El archivo no dice qué es; hay que preguntarlo antes de interpretarlo.',
    'MEDICIÓN — 3,125 de las 7,212 perdidas (el 43.3%) caen en «(destino no venía en el archivo)»: esas filas se exportaron SIN la columna de destino. No es que la llamada no llegara a ningún lado — es que no se puede saber a dónde fue. El análisis por tienda cubre, como mucho, el 57% de lo perdido.',
    'ATENCIÓN — Atiende MEJOR el fin de semana: sábado 5.0% y domingo 4.3% contra 6.3%–6.9% de lunes a viernes. Coherente con centros de servicio dentro de tiendas de centro comercial. No hay un día malo que explique nada: el problema es de tienda, no de día.',
    'SERVICIO — 7 de 31 tickets (22.6%) son FALLAS del servicio, casi tres veces la proporción de Torres Corzo (8.4%). La alerta `sac_fallas_recurrentes` se abrió el 12 de octubre. La última falla es del 29 de septiembre.',
    'SERVICIO — «Venta Equipo (voz)» es la subcategoría más frecuente: 9 de 31 tickets, el 29%. Una mesa de ayuda que atiende ventas de equipo es un canal comercial sin dueño comercial.',
    'SERVICIO — Agosto concentró 8 tickets con 3 fallas, y septiembre 4 con 2. La proporción de fallas sube en los dos últimos meses medidos: de 0 fallas en feb–abr a 5 fallas en ago–sep.',
    'MEDICIÓN — El CID 2094 tiene 0 de 5 meses con dato de consumo. La alerta `sin_consumo_medible` está en severidad CRÍTICA desde el 6 de octubre: de una cuenta de $88,783 al mes no se puede decir cuánto de su plan usa.',
    'RELACIÓN — 0 de 12 preguntas del Radar respondidas, en 9.6 años de relación.',
    'DATOS — El Health Score 51 está medido al 15%: actividad, adopción y pago traen 50, que es el marcador por omisión. Sólo el relacional (57) está calculado.',
    'COMERCIAL — El 8 de octubre se solicitó cobrar $2,046 + IVA por 3 usuarios, 3 números y un administrador adicional. El GRC lo registra como «Upsell temporal». Si esos usuarios son permanentes, el MRR debería subir de forma permanente y no clasificarse como temporal.',
    'ESTRUCTURA — La fusión del 31 de agosto integró la subcuenta «Tech People - Soluciones» (Z33, CID 32785) y eliminó el duplicado en `cuentas`. Pero el GRC sigue facturando las dos líneas por separado, y la columna `facturacion` sólo recogió una. La fusión se hizo en la ficha y no en el dinero.',
  ],

  cronologia: [
    { fecha: '01 Mar 2017', responsable: 'Callpicker',       evento: 'Alta de la cuenta. 115 meses facturados hasta hoy, $6,919,304 acumulados en la línea principal.', tipo: 'ok' },
    { fecha: 'Ene–Ago 2026', responsable: 'Operación TP',    evento: 'Atención estable y buena: entre 5.9% y 6.6% sin contestar cada mes, sobre 11,904–19,914 entrantes.', tipo: 'ok' },
    { fecha: '17 Jul 2026', responsable: 'Claudia',          evento: 'Resumen para el área técnica: «la operación del cliente se mantuvo estable; los tickets se distribuyen de forma equilibrada».', tipo: 'neutral' },
    { fecha: '23 Jul 2026', responsable: 'Claudia',          evento: 'Actividad de análisis programada. NO se completó.', tipo: 'problema' },
    { fecha: '04 Ago 2026', responsable: 'Claudia',          evento: 'Se completa el perfil de cliente. Es trabajo de ficha, no contacto con el cliente.', tipo: 'neutral' },
    { fecha: '05 Ago 2026', responsable: 'Claudia',          evento: 'Análisis cerrado: «no se identificaron incumplimientos recurrentes de los SLA».', tipo: 'neutral' },
    { fecha: '06 Ago 2026', responsable: 'Sistema',          evento: 'Aviso automático: el perfil de Tech People Soluciones tiene 10 campos incompletos, 4 de ellos CRÍTICOS para análisis de riesgo.', tipo: 'problema' },
    { fecha: '08 Ago 2026', responsable: '—',                evento: 'Último contacto que registra la ficha. Pero el motor no reconoce ninguno por canal real: la fecha viene de cerrar una actividad, no de hablar con nadie.', tipo: 'problema' },
    { fecha: '20 Ago 2026', responsable: 'Claudia',          evento: 'Actividad de LLAMADA programada. NO se completó.', tipo: 'problema' },
    { fecha: '22 Ago 2026', responsable: 'Claudia',          evento: 'Se prepara el análisis de uso «como preparación previa a la llamada con el cliente». La llamada no consta.', tipo: 'problema' },
    { fecha: '31 Ago 2026', responsable: 'Dirección',        evento: 'FUSIÓN: la subcuenta «Tech People - Soluciones» (Z33, CID 32785) se integra a C1 y se elimina el duplicado. La columna de facturación no se actualizó.', tipo: 'pivote' },
    { fecha: '14 Sep 2026', responsable: 'Callpicker',       evento: 'Corte del archivo de llamadas de esta cuenta. Su lectura llega hasta aquí; su mes cerrado es AGOSTO.', tipo: 'neutral' },
    { fecha: '29 Sep 2026', responsable: 'Mesa de ayuda',    evento: 'Última falla del servicio registrada. Son 5 fallas en agosto y septiembre, contra 0 entre febrero y abril.', tipo: 'problema' },
    { fecha: '06 Oct 2026', responsable: 'Motor de alertas', evento: 'Se abren dos alertas CRÍTICAS: nunca contactada y sin consumo medible. Más `sin_radar` en alta.', tipo: 'problema' },
    { fecha: '08 Oct 2026', responsable: 'Toño del Río',     evento: 'Se solicita cobrar $2,046 + IVA: 3 usuarios, 3 números y 1 administrador adicional. El GRC lo registra como «Upsell temporal».', tipo: 'ok' },
    { fecha: '12 Oct 2026', responsable: 'Motor de alertas', evento: 'Se abre `sac_fallas_recurrentes` en alta: 7 fallas sobre 31 tickets.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Servicios y Reparaciones TP, S.A. de C.V.' },
    { label: 'Giro',                value: 'Reparación de dispositivos Apple' },
    { label: 'Red',                 value: 'Más de 100 centros de servicio dentro de tiendas iShop Mixup, en todo México' },
    { label: 'Sede',                value: 'Lago Zúrich, Ciudad de México, C.P. 11529' },
    { label: 'Tamaño',              value: 'Mediana — 201 a 500 empleados' },
    { label: 'Sitio',               value: 'techpeople.mx' },
    { label: 'Contacto principal',  value: 'Camilo Eckardt — Director General · camilo@techpeople.mx · 55 3145 4893' },
    { label: 'Cliente desde',       value: '1 de marzo de 2017 — 115 meses facturados' },
    { label: 'Servicio contratado', value: 'Visibilidad y Control — usuario ilimitado SIP + extensión VyC con SIM' },
    { label: 'Subcuenta',           value: '«Tech People - Soluciones» (ex Z33, CID 32785), fusionada el 31 ago 2026 · sigue facturando aparte en el GRC' },
    { label: 'MRR real (GRC)',      value: '$88,783.20 — $82,360.30 + $6,422.90' },
    { label: 'MRR en la ficha',     value: '$59,423 — DESACTUALIZADO en $29,360' },
    { label: 'Acumulado histórico', value: '$6,919,304.35 la línea principal · $915,880.70 la subcuenta' },
    { label: 'Salud de pago',       value: 'Al corriente · 0 incidencias en 115 meses' },
    { label: 'Health Score',        value: '51 · relacional 57 · los otros tres bloques sin medir (50 por omisión)' },
  ],

  necesidad_negocio: 'Tech People repara equipos Apple en más de cien mostradores dentro de tiendas iShop Mixup. Su teléfono sirve para una sola cosa: que un cliente pregunte si ya está listo su equipo, cuánto cuesta una reparación o si la tienda tiene la pieza. Es una operación de alto volumen y baja complejidad por llamada — 116,054 entrantes en ocho meses y medio, repartidas entre cien puntos.\n\nSu contrato es de Visibilidad y Control con SIM: cada mostrador es una extensión. Eso significa que lo que le importa no es el agregado nacional, que ya está bien, sino poder ver QUÉ TIENDA no contesta. Hoy no tiene esa vista, y Callpicker tampoco se la ha dado.\n\nLa necesidad real, entonces, es de visibilidad por sucursal — exactamente el producto que compró, aplicado a su propia operación. Y en segundo lugar, de una relación: una cuenta de 9.6 años que nunca ha tenido una reunión no tiene a nadie que la defienda el día que alguien compare precios.',

  potencial_corto: [
    'Enseñarle el desglose por tienda. Cinco sucursales pierden entre el 38.7% y el 64.2%: es su propio dato y no lo ha visto nunca.',
    'Averiguar qué es el destino «Fin de llamada»: 290 llamadas con cero minutos en ambos lados.',
    'Pedir el export de llamadas CON la columna de destino: hoy el 43.3% de lo perdido no se puede atribuir a ninguna tienda.',
    'Cerrar la clasificación del upsell de $2,046: si los 3 usuarios son permanentes, no es «temporal».',
  ],

  potencial_largo: [
    'IA de Voz: no la tiene contratada y su patrón —alto volumen, preguntas repetitivas sobre el estado de una reparación— es el caso de uso directo.',
    'Integración API con su sistema de órdenes de servicio: que la llamada sepa en qué va el equipo sin que nadie lo busque.',
    'Panel por sucursal como producto: tiene +100 puntos y compró Visibilidad y Control. Es el cliente natural de esa vista.',
    'Pago automático: 115 meses sin una sola incidencia y sin domiciliación.',
  ],

  tacticas: [
    { nombre: 'Abrir con lo bueno, y es cierto', descripcion: 'Su 6.21% general es excelente para una red de cien puntos, y el fin de semana atiende mejor que entre semana. Empezar por ahí no es cortesía: es el dato.', impacto: 'Gana el derecho a enseñar las cinco tiendas que fallan sin que suene a reclamo.' },
    { nombre: 'Bajar del promedio a la tienda', descripcion: 'Pasar del 6.21% nacional a «Tulum Hunab pierde el 64.2% de lo que le entra». El promedio es de Callpicker; la tienda es del cliente.', impacto: 'Convierte un reporte en una lista de acciones con nombre y dirección.' },
    { nombre: 'Nombrar los nueve años sin reunión', descripcion: 'Decirlo de frente: llevamos 115 meses facturando y nunca nos hemos sentado. Proponer la primera.', impacto: 'Es la única forma de abrir la relación sin inventar un pretexto comercial.' },
    { nombre: 'Llevar corregido el importe', descripcion: 'Antes de la llamada, cuadrar los $88,783 del GRC con la ficha. Hablar de una cuenta de $59,423 con quien paga $88,783 descalifica todo lo demás.', impacto: 'Evita el único error que el cliente detecta en el primer minuto.' },
  ],

  senal_alarma: 'Nueve años y medio, $88,783 al mes, cero reuniones, cero contactos por canal real y cero de doce del Radar. No hay una sola persona en Callpicker que pueda decir qué piensa este cliente de nosotros. Si aparece un competidor con una propuesta por escrito, nadie se entera hasta que llegue la baja.',

  problema_raiz: 'La cuenta nunca dio problemas, y por eso nunca se le habló. Nueve años de silencio cómodo.',

  problema_raiz_detalle: 'Tech People paga puntualmente desde 2017, no escala conflictos y su operación telefónica funciona. Ese perfil produce exactamente el resultado que tiene: una cuenta que nunca llega a la cola de trabajo porque nunca enciende una alarma de las clásicas.\n\nLo que sí se hizo fue trabajo de escritorio. Los cinco seguimientos registrados son notas: un resumen para el área técnica, dos análisis, un aviso automático de perfil incompleto y una preparación de llamada. El 22 de agosto se escribió que «una vez confirmado por el cliente el horario y la fecha disponibles, se realizará el contacto» — y la actividad de llamada del 20 de agosto figura sin completar. Se preparó la conversación y no se tuvo.\n\nEl segundo nivel es que lo que el cliente compró —Visibilidad y Control— es justo lo que Callpicker no le está dando sobre sí mismo. Tiene más de cien mostradores y el único número que existe es el nacional. Las cinco tiendas que pierden la mitad de sus llamadas llevan ahí todo el periodo medido y nadie, de ninguno de los dos lados, las ha mirado por separado.\n\nEl tercero es de datos propios. La fusión del 31 de agosto integró la subcuenta en la ficha pero no en el importe, así que la cuenta figura un 33% más pequeña de lo que es y se ordena mal en cualquier lista por facturación. Y su consumo no es medible: cero de cinco meses con dato. De la segunda cuenta más grande de la cartera no se puede decir cuánto de su plan usa.',

  flujo_real: [
    { fase: 'Entra la llamada',      area: 'Cliente final',        accion: 'Pregunta por su equipo, un precio o una pieza', resultado: '116,054 entrantes de ene a 14 sep 2026' },
    { fase: 'Enrutamiento',          area: 'Plataforma Callpicker', accion: 'Se dirige a la extensión del mostrador', resultado: '3,125 perdidas (43.3%) sin columna de destino: no se sabe a qué tienda iban' },
    { fase: 'Atiende la tienda',     area: 'Mostrador iShop',      accion: 'Un técnico toma la llamada', resultado: 'Nacional 93.8% atendido — pero Tulum Hunab 35.8% y Oceania 51.5%' },
    { fase: 'No contesta',           area: '—',                    accion: 'El cliente cuelga', resultado: 'Sin integración con su sistema de órdenes: no queda rastro de quién llamó' },
    { fase: 'TP pide algo',          area: 'Mesa de ayuda',        accion: 'Abre ticket', resultado: '31 tickets · 9 de ellos (29%) de «Venta Equipo (voz)»' },
    { fase: 'Callpicker revisa',     area: 'SAC',                  accion: 'Escribe un análisis o un resumen técnico', resultado: '5 notas internas · 0 llamadas · 0 reuniones en 9.6 años' },
  ],

  comparativo: [
    { metrica: 'Sin contestar · nacional',          real: '6.21% (7,212 de 116,054)', ideal: 'Está BIEN — su base propia es 6.24%' },
    { metrica: 'Sin contestar · Tulum Hunab',       real: '64.2% (97 de 151)',        ideal: 'Al nivel de su propia red: 6.2%' },
    { metrica: 'Sin contestar · iShop Oceania',     real: '48.5% (176 de 363)',       ideal: '6.2%' },
    { metrica: 'Contactos por canal real en 9.6 años', real: '0',                     ideal: 'Mínimo trimestral: 38' },
    { metrica: 'Reuniones en 9.6 años',             real: '0',                        ideal: 'Mínimo anual: 9' },
    { metrica: 'Radar de 12 preguntas',             real: '0 respondidas',            ideal: '12 de 12' },
    { metrica: 'MRR en la ficha vs. el real',       real: '$59,423 contra $88,783',   ideal: 'La misma cifra en los dos sitios' },
    { metrica: 'Meses con dato de consumo',         real: '0 de 5',                   ideal: '5 de 5' },
    { metrica: 'Fallas sobre tickets',              real: '22.6% (7 de 31)',          ideal: '<10% — Torres Corzo está en 8.4%' },
    { metrica: 'Perdidas atribuibles a una tienda', real: '56.7% (4,087 de 7,212)',   ideal: '100% — pedir el export con destino' },
  ],

  plan_inmediato: [
    { accion: 'Corregir el importe de la cuenta: la ficha dice $59,423 y el GRC $88,783.20 en dos líneas con consecutivo C1', responsable: 'Dirección / Facturación', criterio: 'La columna `facturacion` cuadra con el GRC, y el ranking de cartera la coloca como #2' },
    { accion: 'Llamar a Camilo Eckardt. Es la PRIMERA llamada en 9.6 años y así se plantea', responsable: 'Claudia', criterio: 'Contacto registrado por canal real; la alerta `nunca_contactada` se apaga' },
    { accion: 'Llevar a esa llamada el desglose por tienda, con las cinco que pierden más del 38%', responsable: 'Claudia', criterio: 'El cliente recibe la lista con nombre de sucursal y porcentaje' },
    { accion: 'Preguntar qué es el destino «Fin de llamada»: 290 llamadas, cero minutos en ambos lados', responsable: 'Claudia', criterio: 'Respuesta del cliente registrada; se descarta o se confirma que sea un problema de configuración' },
    { accion: 'Pedir el export de llamadas CON la columna `destination_data_1`: hoy el 43.3% de lo perdido no se puede atribuir', responsable: 'Claudia', criterio: 'Siguiente entrega con destino en todas las filas' },
  ],

  plan_mediano: [
    { accion: 'Contestar las 12 preguntas del Radar en la misma visita', responsable: 'Claudia', criterio: '12 de 12 en la ficha' },
    { accion: 'Resolver por qué el CID 2094 no tiene dato de consumo en ninguno de los últimos 5 cortes', responsable: 'Facturación', criterio: 'La cuenta aparece con su % de plan en el siguiente Informe de Cortes' },
    { accion: 'Clasificar correctamente el upsell de $2,046: si los 3 usuarios son permanentes no es «temporal»', responsable: 'Facturación', criterio: 'El GRC refleja el movimiento con su naturaleza real' },
    { accion: 'Revisar las 7 fallas de servicio: 5 de ellas son de agosto y septiembre, contra 0 entre febrero y abril', responsable: 'Mesa de ayuda', criterio: 'Se identifica si hay una causa común o son independientes' },
  ],

  plan_estrategico: [
    { accion: 'Panel de desempeño por sucursal — es el producto que ya compró, aplicado a sus +100 puntos', responsable: 'Producto / Claudia', criterio: 'El cliente recibe un reporte mensual por tienda' },
    { accion: 'Proponer IA de Voz para el alto volumen de consultas repetitivas de estado de reparación', responsable: 'Claudia', criterio: 'Propuesta presentada con el cálculo sobre sus 116,054 entrantes' },
    { accion: 'Integración con su sistema de órdenes de servicio', responsable: 'Ingeniería / Claudia', criterio: 'Propuesta técnica y costo entregados' },
    { accion: 'Gobernanza: reunión semestral fija. Nunca ha habido una', responsable: 'Claudia / Dirección', criterio: 'Primera reunión agendada con fecha y asistentes' },
  ],

  areas_oportunidad: [
    { area: 'Las cinco tiendas que pierden más del 38%', impacto: '744 llamadas perdidas en cinco sucursales de más de cien', responsable: 'Claudia + TP' },
    { area: 'Visibilidad por sucursal',                  impacto: 'Es el producto contratado, sin aplicar a su propia red', responsable: 'Producto' },
    { area: 'IA de Voz',                                 impacto: '116,054 entrantes de consulta repetitiva, sin automatizar', responsable: 'Claudia' },
    { area: 'El 43.3% de perdidas sin destino',          impacto: '3,125 llamadas que no se pueden atribuir a ninguna tienda', responsable: 'Claudia' },
    { area: 'Corrección del MRR',                        impacto: '$29,360 al mes mal reflejados en la ficha y en el ranking', responsable: 'Facturación' },
    { area: 'Pago automático',                           impacto: '115 meses sin incidencias y sin domiciliación', responsable: 'Administración' },
  ],

  perfiles: [
    {
      nombre: 'Camilo Eckardt', rol: 'Director General — Tech People', color: '#22c55e',
      campos: [
        { label: 'Correo',   value: 'camilo@techpeople.mx' },
        { label: 'Teléfono', value: '55 3145 4893' },
        { label: 'Estado',   value: 'ÚNICO contacto capturado, y está completo — nombre, cargo, correo y teléfono' },
        { label: 'Riesgo',   value: 'Es el Director General: el interlocutor correcto para abrir, pero no para resolver una tienda concreta. Falta el responsable de operación de la red.' },
      ],
    },
    {
      nombre: 'Claudia', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#6366f1',
      campos: [
        { label: 'Actividades',    value: '5 registradas · 3 completadas · la de LLAMADA del 20 ago quedó sin completar' },
        { label: 'Seguimientos',   value: '5, todos de tipo `nota`: ninguno es un contacto con el cliente' },
        { label: 'Último análisis', value: '5 ago 2026 — «no se identificaron incumplimientos recurrentes de los SLA»' },
      ],
    },
    {
      nombre: 'Toño del Río', rol: 'Comercial — Callpicker', color: '#f59e0b',
      campos: [
        { label: 'Intervención', value: '8 oct 2026 — solicita cobrar $2,046 + IVA por 3 usuarios, 3 números y 1 admin adicional' },
        { label: 'Resultado',    value: 'El GRC lo registra como «Upsell temporal»: $80,314.30 → $82,360.30' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '115 meses facturados desde marzo de 2017 — la relación más larga entre las cuentas grandes',
      'Cero incidencias de pago en 9.6 años · $7.8M acumulados entre las dos líneas',
      'Atención telefónica buena y estable: 6.21%, y el mes cerrado MEJOR que su propia base',
      'Atiende mejor el fin de semana que entre semana: la operación conoce su demanda',
      'Adopción ALTA en Voz VyC y Callpicker Chat activo',
      'Contacto principal completo y de alto nivel: el Director General',
    ],
    oportunidades: [
      'Más de 100 sucursales sin una sola vista por tienda, habiendo comprado Visibilidad y Control',
      'No tiene IA de Voz ni IA de Chat ni integración API',
      'Upsell orgánico demostrado: $2,046 facturados en octubre sin campaña',
      'Nunca ha habido una reunión: la primera es, por definición, la de mayor margen',
    ],
    debilidades: [
      'Cero contactos por canal real y cero reuniones en 9.6 años',
      'Cinco tiendas pierden entre el 38.7% y el 64.2% y nadie las ha mirado',
      '0 de 12 del Radar · consumo no medible · Health Score medido al 15%',
      'El 43.3% de las llamadas perdidas no se puede atribuir a una tienda: falta la columna de destino',
      '22.6% de los tickets son fallas, y 5 de las 7 son de los dos últimos meses',
    ],
    amenazas: [
      'Una cuenta de 9.6 años sin una sola conversación no tiene quien la defienda frente a un competidor',
      'El importe de la ficha está un 33% por debajo del real: la cuenta se prioriza como si fuera más pequeña',
      'Las fallas de servicio se concentran en agosto y septiembre — puede ser el inicio de una tendencia',
      'Su operación está dentro de tiendas iShop Mixup: una decisión de ese tercero puede arrastrar la cuenta',
    ],
  },

  conclusion: 'Tech People es el caso contrario a una cuenta en crisis, y por eso es peligrosa. Todo lo que el tablero mide bien, sale bien: paga, usa, no se queja y contesta el 93.8% de sus llamadas. Durante 115 meses eso bastó para que nunca llegara a la cola de trabajo de nadie.\n\nPero debajo del promedio hay cinco tiendas donde entre el 38% y el 64% de quien llama no encuentra a nadie, y encima de todo hay un hecho que ninguna métrica captura: en nueve años y medio no ha habido una sola conversación. No hay una reunión, ni una llamada registrada, ni doce preguntas contestadas. Callpicker no sabe qué piensa este cliente.\n\nLa cuenta no está en riesgo por lo que hace mal, sino por lo que nadie sabe de ella. Y la corrección es barata: una llamada al Director General, su propio desglose por tienda en la mano, y la ficha con el importe correcto.',

  pierde: [
    'Callpicker pierde $88,783 al mes —la segunda cuenta de la cartera— si esta relación se enfría del todo.',
    'Tech People pierde a los clientes de cinco tiendas donde la mitad de las llamadas no se contesta, sin saber que ocurre.',
    'Se pierde el caso de uso de red más grande de la cartera: más de cien puntos de servicio.',
    'Se pierde una referencia de 9.6 años y $7.8M acumulados.',
  ],

  gana: [
    'La primera reunión en 9.6 años: cualquier cosa que salga de ahí es información que hoy no existe.',
    'Un panel por sucursal convierte lo que ya compró en una herramienta de gestión de su red.',
    'IA de Voz sobre 116,054 entrantes de consulta repetitiva es el caso de uso más limpio de la cartera.',
    'Corregir el importe coloca la cuenta donde le toca en la prioridad de todo el equipo.',
  ],

  recomendacion_central: 'Llamar a Camilo Eckardt esta semana y decirle la verdad de entrada: llevamos nueve años y medio trabajando juntos y es la primera vez que le llamamos. Abrir con lo que hace bien —contesta el 93.8% de sus llamadas y los fines de semana mejor que entre semana— y después enseñarle las cinco tiendas donde entre el 38% y el 64% de quien marca no encuentra a nadie: Tulum Hunab, Oceania, Monterrey Esfera, Santa Anita y San Nicolás. Es su dato, es de su red, y nunca lo ha visto.\n\nAntes de esa llamada, corregir el importe en la ficha. Hablar de una cuenta de $59,423 con quien paga $88,783 descalifica todo lo que venga después.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 31 tickets de «Tech People» (CID 2094) en lib/tickets-data.json',
    periodo: 'Febrero 2026 – Octubre 2026 · la fuente trae SÓLO tickets CERRADOS',
    diagnostico: 'Volumen bajo y proporción de fallas alta: 31 tickets en nueve meses, pero 7 de ellos (22.6%) son fallas del servicio — casi el triple de la proporción de Torres Corzo. Y la concentración importa: cero fallas entre febrero y abril, cinco en agosto y septiembre. Además, la subcategoría más frecuente es «Venta Equipo (voz)» con 9 de 31: una mesa de ayuda atendiendo operaciones comerciales.',
    metricas: [
      { metrica: 'Tickets totales',        valor: '31 (feb–oct 2026)', lectura: 'Volumen bajo para una red de +100 puntos: la operación se sostiene sola' },
      { metrica: 'Fallas del servicio',    valor: '7 · 22.6%',         lectura: 'Alta. Torres Corzo, con 203 tickets, está en 8.4%' },
      { metrica: 'Concentración temporal', valor: '5 de 7 en ago–sep', lectura: 'Cero fallas de febrero a abril. Puede ser el inicio de una tendencia' },
      { metrica: 'Mediana de resolución',  valor: '50.0 horas',        lectura: 'Dos días. Aceptable para el tipo de petición' },
      { metrica: 'Tickets de más de 7 días', valor: '3 · 9.7%',        lectura: 'Bajo. El peor tardó 473 horas (20 días)' },
      { metrica: 'Subcategoría dominante', valor: 'Venta Equipo (voz) · 9 · 29%', lectura: 'Ventas entrando por soporte: un canal comercial sin dueño comercial' },
    ],
    reincidencias: [
      { patron: 'Venta Equipo (voz)',  veces: '9 · 29.0%', causa: 'El cliente pide equipo por la mesa de ayuda. No es una falla, es un canal de venta que nadie ha formalizado.' },
      { patron: 'Ajuste en Flujo (voz)', veces: '5 · 16.1%', causa: 'Mismo patrón que en Torres Corzo, a menor escala: configuración que requiere intervención repetida.' },
      { patron: 'Teléfono IP (voz)',   veces: '4 · 12.9%', causa: 'Hardware en mostradores. Con +100 puntos, una tasa de incidencia esperable.' },
      { patron: 'Falla SIP (voz)',     veces: '3 · 9.7%',  causa: 'Las tres son fallas reales del servicio. Conviene mirar si coinciden con las tiendas que peor contestan.' },
    ],
    hallazgos: [
      'La proporción de fallas sube con el tiempo: 0 de 10 tickets entre febrero y abril, 5 de 12 entre agosto y septiembre.',
      'Las 3 «Falla SIP (voz)» merecen cruzarse contra las cinco tiendas que peor contestan: si coinciden, el problema de atención puede ser técnico y no de personal.',
      'Con 31 tickets en nueve meses sobre más de cien sucursales, la mesa casi no ve a esta cuenta. Eso explica que nunca haya entrado a la cola de trabajo por la vía del servicio.',
    ],
  },
}
