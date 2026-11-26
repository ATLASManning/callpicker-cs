import type { AuditoriaCase } from './types'

/**
 * SAN-SON (Grupo San-Son · marcas Sanson y Coffee Depot) · D10 · CID 17297 · Dan
 *
 * Alta del 26 nov 2026, a partir del reporte entregado
 * «Auditoría de atención telefónica · SAN-SON / COCITEC · CID 17297».
 *
 * CONCILIADO contra nuestras fuentes antes de publicar:
 *   · `cuentas` D10: empresa «SAN-SON», asesor Dan, estado activo, cliente
 *     desde el 18 feb 2019, 10 oficinas, giro comercializadora de equipos de
 *     cocina. Contactos: Paulina (encargada Callpicker) y Ruben Kreplak
 *     (titular). El reporte nombra a los dos y coincide.
 *   · Las SEIS series del `const D` cierran contra las 9,095 llamadas del
 *     periodo cerrado (mes, día de la semana, hora, sucursal, horario /
 *     fuera de horario y evaluaciones). Los cuatro desenlaces suman el
 *     total: 6,067 + 1,929 + 664 + 435 = 9,095.
 *   · El DID 229 456 0121 que el reporte señala como contratado y sin tráfico
 *     SÍ está en `servicios_json` («Renta de número 2294560121, $99»), y el
 *     Agente CP Chat también ($898) con `tiene_chat_activo = false`. Las dos
 *     afirmaciones del documento quedan verificadas contra la ficha.
 *
 * DOS HUECOS DE MEDICIÓN, nombrados y no fingidos:
 *   1. **MRR institucional NO MEDIBLE.** El GRC (`data/grc-zoho.json`, corte
 *      GRF.xlsx, mes vivo Noviembre) NO trae fila para el CID 17297 ni por
 *      nombre «SAN-SON». `cuentas.facturacion` guarda $12,554 y eso NO es el
 *      MRR institucional ([[grc-fuente-zoho]]). El documento no publica
 *      ninguna cifra de MRR, y por eso no hubo que corregirlo — pero tampoco
 *      se puede citar una. Con 3,451 de 3,675 filas del GRC SIN CID, un hueco
 *      aquí no prueba que no facture: prueba que no se pudo cruzar.
 *   2. **«COCITEC» no existe en ninguna de nuestras fuentes.** El documento
 *      la usa como segunda razón social en el título. En `cuentas`, DIDs,
 *      GRC, activaciones y contratos la cuenta es SAN-SON, con las marcas
 *      Sanson y Coffee Depot. Se declara en el documento publicado.
 *
 * CORRECCIONES aplicadas al documento publicado, visibles dentro de él
 * (ver `scripts/publica-auditorias-2026-11-26.py`):
 *   · La tabla por sucursal declara excluir «3 números con comportamiento
 *     atípico (207 llamadas)», pero sus 12 filas suman EXACTAMENTE las 9,095
 *     del total: la exclusión no se puede reconstruir desde la tabla. Se
 *     declara por clave, no se resuelve.
 *   · «Sábado después de las 14 h: 129 llamadas, todas sin atender» — el mapa
 *     de calor publicado, cuya ventana es 7–20 h, sólo enseña 125. Las otras 4
 *     caen después de las 20 h. Un recorte que no se declara se lee como
 *     cobertura completa ([[feedback-auditorias-verificar]]).
 */
export const SAN_SON: AuditoriaCase = {
  id: 'san-son',
  asesor: 'Dan',
  nombre: 'SAN-SON (Grupo San-Son · Sanson y Coffee Depot)',
  sector: 'Comercializadora de equipos para cocina industrial · 10 sedes',
  fecha_periodo: '2 ene – 31 oct 2026 (cerrado) · nov 1–26 en tránsito',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'Mediana · 201–500 empleados · CID 17297 · D10 · MRR NO MEDIBLE en GRC',
  descripcion_contexto:
    '9,095 llamadas entrantes del periodo cerrado · 14 números y 10 sedes · D10 · CID 17297 · ' +
    'Asesor: Dan · Cliente desde feb 2019 · Contactos: Paulina (encargada) y Ruben Kreplak (titular)',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'No llega a una persona',   value: '33.3% · 3,028 de 9,095',  color: '#ef4444' },
    { label: 'Nunca atendidos en 7 d',   value: '1,668 de 2,144 números',  color: '#dc2626' },
    { label: 'Pérdida con línea libre',  value: '95% de las perdidas',     color: '#f59e0b' },
    { label: 'Brecha entre sucursales',  value: '2.3% vs 23.1% · 10 a 1',  color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'SAN-SON opera 14 números Callpicker sobre 10 sedes de dos marcas, Sanson y Coffee Depot, con ~38 ' +
    'llamadas por día hábil. En el periodo cerrado (ene–oct) entraron 9,095 llamadas y 6,067 (66.7%) las ' +
    'atendió una persona. El problema no es la plataforma ni la capacidad de líneas: es cobertura humana ' +
    'y recuperación.\n\n' +
    'Al cruzar cada pérdida en horario contra las llamadas en curso del mismo destino, sólo el 5.1% ' +
    'coincidió con la extensión ocupada. El 95% restante timbró en un destino libre y nadie contestó. ' +
    'Eso descarta saturación y descarta la conversación de «necesitan más líneas».\n\n' +
    'La prueba de que es corregible está dentro de la propia red: Sanson Chapultepec 68 atiende el 94.7% ' +
    'en su horario y Coffee Depot Guadalajara pierde el 23.1%. Misma plataforma, misma marca, diez veces ' +
    'de diferencia. Guadalajara, entre sus dos marcas, concentra el 47% de todas las pérdidas en horario ' +
    'de la red.\n\n' +
    'Y la métrica que conecta la telefonía con la venta: de 2,144 números con una llamada no atendida, ' +
    '1,668 (77.9%) no fueron atendidos en los 7 días siguientes en ninguna sede. La cuenta no registra ' +
    'una sola llamada saliente ni una devolución en Callpicker: si la red devuelve desde celulares, ese ' +
    'esfuerzo es invisible, no se mide, no se asigna y no se puede auditar.',

  resultado_positivo:
    'Chapultepec 68 es la respuesta que el cliente ya tiene en casa: 1,330 llamadas en horario con 94.7% ' +
    'de atención y la duración media más alta de la red (3.7 min). No hay que inventar un modelo — hay ' +
    'que replicar el suyo.\n\n' +
    'La infraestructura está montada y funciona: IVR, desvíos por sucursal y buzones fuera de horario ' +
    'configurados; líneas sin saturación; demanda estable y alta (6,033 números distintos en diez meses, ' +
    'sin caída de volumen). Casi 8 años de relación, al corriente en pagos. El margen de mejora es ' +
    'operativo, y eso significa que se puede corregir sin comprar nada.',

  hallazgos: [
    'La pérdida no es de capacidad: solo 5.1% de las perdidas en horario cae con la extensión ocupada. El 95% timbró en un destino libre y nadie contestó. No se resuelve con más líneas.',
    'De 2,144 números con una llamada no atendida, 1,668 (77.9%) no volvieron a ser atendidos en 7 días. La cuenta no registra NI UNA saliente ni una devolución en Callpicker.',
    'La brecha entre sucursales es de 10 a 1: Chapultepec 68 atiende 94.7% en horario y Coffee Depot Guadalajara pierde 23.1%. Guadalajara concentra el 47% de las pérdidas de la red.',
    'MRR institucional NO MEDIBLE: el GRC no trae fila para el CID 17297 ni por nombre. La ficha guarda $12,554 y ése NO es el institucional. No se puede citar una cifra de MRR.',
    'Dos huecos estructurales de cobertura, no de desempeño: la primera hora (8–10 h de L–V, ~900 llamadas en el periodo, casi ninguna atendida a las 8 h y la mitad perdida a las 9 h) y el fin de semana (sábado después de las 14 h: 129 llamadas, todas sin atender; domingo: 148 llamadas, ninguna contestada).',
    '1,368 llamadas entraron fuera del horario en que cada sucursal efectivamente contesta y 1,238 no las tomó nadie. Coffee Depot Chapultepec sola concentra 463 de ellas: 171 antes de abrir entre semana y 83 en domingo.',
    'Un menú que expulsa clientes en dos sedes: Sanson Tlalnepantla con 32.6% de abandono en el IVR y Coffee Depot Chapultepec con 16.2%, contra 3%–7% en el resto de la red. Se corrige con rediseño de menú, sin costo de licencia.',
    'Tres extensiones personales aparecen como destino ÚNICAMENTE en llamadas que acabaron en buzón: Franklin Sambrano (Guadalajara, 59), Teresa Vital (Cancún, 34) y Eduardo Villar (Outlet, 16). Ninguna fue contestada en el periodo: o no están registradas en un dispositivo, o se usan como buzón.',
    'Activos contratados sin uso visible, verificados contra la ficha: el DID 229 456 0121 está en `servicios_json` por $99 y NO aparece en el detalle de llamadas; el Agente CP Chat se factura a $898 con `tiene_chat_activo = false`. Hay además dos números con tráfico marginal en once meses (Chapultepec Outlet 55 4000 1908 con 4 llamadas, Coffee Depot Chapultepec 55 4438 0131 con 7).',
    'La voz del cliente casi no se escucha: 187 evaluaciones sobre 6,067 llamadas contestadas (~3%), de las cuales 133 positivas. Cancún (9 negativas de 19) y Coffee Depot Guadalajara (10 de 27) concentran la proporción más alta de negativas. El 68% de las contestadas termina con el ejecutivo colgando antes de la encuesta.',
    'Ruido que distorsiona la lectura: tres números concentran 207 llamadas repetitivas que casi nunca se atienden, y un número que coincide casi con la línea de Chapultepec (55 2700 5600 contra el DID 55 2700 5609 de Chapultepec 68) sugiere pruebas internas.',
    'HUECO DECLARADO · «COCITEC» no existe en ninguna de nuestras fuentes. El documento la usa como segunda razón social; en `cuentas`, DIDs, GRC, activaciones y contratos la cuenta es SAN-SON, con las marcas Sanson y Coffee Depot. Hay que preguntárselo al cliente antes de usar ese nombre con él.',
    'MARCADO en el documento · la tabla por sucursal dice excluir «3 números atípicos (207 llamadas)», pero sus doce filas suman exactamente las 9,095 del total: la exclusión no se puede reconstruir desde la tabla publicada. Se declara por clave; no se resuelve inventando.',
    'MARCADO en el documento · «sábado después de las 14 h: 129 llamadas» — el mapa de calor, cuya ventana es 7–20 h, sólo enseña 125. Las otras 4 caen después de las 20 h. El recorte queda declarado.',
    'CUIDADO al leer la tabla de sucursales: trae dos filas con nombres casi idénticos, «Sanson Chapultepec Outlet» (528 llamadas) y «Chapultepec Outlet» (3 llamadas, 50% de pérdida). Una tasa calculada sobre 3 llamadas no es una señal, y el nombre invita a confundirla con la de 528.',
    'El horario de atención NO fue proporcionado por el cliente: se infirió por sucursal a partir de sus llamadas contestadas (percentil 1 a 99, L–V y sábado por separado, domingo sin atención). Toda la lectura de «en horario» depende de ese supuesto y hay que validarlo antes de llevarle a alguien una cifra de pérdida por sede.',
    'Relación concentrada y con fricción declarada por el propio KAM: dos contactos, y Paulina —la encargada de Callpicker— responde de forma intermitente y con tiempos prolongados. Último contacto registrado: 1 de octubre de 2026.',
  ],

  cronologia: [
    { fecha: '18 feb 2019',  responsable: 'Operación',          evento: 'SAN-SON inicia como cliente. Hoy: paquete Visibilidad y Control 1,100 min + 800 de autorización, dos DIDs nacionales y Agente CP Chat.', tipo: 'neutral' },
    { fecha: 'Ene 2026',     responsable: 'Operación cliente',  evento: 'Mejor mes del año: 74.0% de atención y 8.3% de pérdida dentro de horario. Es el punto de comparación de todo lo que sigue.', tipo: 'ok' },
    { fecha: 'Feb–oct 2026', responsable: 'Operación cliente',  evento: 'La pérdida en horario se estaciona entre 10.2% y 15.8% todos los meses. El volumen NO cae (819 a 1,089 llamadas al mes): lo que se mueve es la disciplina de atención.', tipo: 'problema' },
    { fecha: 'Ago 2026',     responsable: 'Operación cliente',  evento: 'Peor mes del periodo cerrado: 15.2% de pérdida en horario y 63.2% de atención total.', tipo: 'problema' },
    { fecha: '01 oct 2026',  responsable: 'Dan (KAM)',          evento: 'Último contacto registrado. El KAM documenta operación estable, SLAs adecuados y el reto real: la comunicación con Paulina es intermitente y los tiempos de respuesta prolongados. Se la invita a una sesión de seguimiento.', tipo: 'pivote' },
    { fecha: '31 oct 2026',  responsable: 'SAC',                evento: 'Cierre del periodo analizado: 9,095 entrantes, 6,067 atendidas, 16,268 minutos, 0 salientes y 0 devoluciones registradas en Callpicker.', tipo: 'neutral' },
    { fecha: '26 nov 2026',  responsable: 'SAC',                evento: 'Expediente dado de alta. Seis series conciliadas contra el total; MRR declarado NO MEDIBLE por ausencia de fila en el GRC; dos marcados visibles en el documento.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'SAN-SON (Grupo San-Son). «COCITEC», que usa el documento, no aparece en ninguna de nuestras fuentes.' },
    { label: 'Consecutivo · CID',   value: 'D10 · 17297' },
    { label: 'Asesor',              value: 'Dan' },
    { label: 'Sector',              value: 'Fabricación y comercialización de equipo para cocina industrial y comercial' },
    { label: 'Marcas',              value: 'Sanson y Coffee Depot · 10 sedes · 14 números Callpicker' },
    { label: 'Tamaño',              value: 'Mediana · estimado 201–500 empleados' },
    { label: 'Contactos',           value: 'Paulina — encargada Callpicker (asistentedireccion@san-son.com) · Ruben Kreplak — titular' },
    { label: 'Cliente desde',       value: '18 de febrero de 2019 (casi 8 años)' },
    { label: 'MRR institucional',   value: 'NO MEDIBLE — el GRC no trae fila para el CID 17297 ni por nombre. `cuentas.facturacion` guarda $12,554, que no es el institucional.' },
    { label: 'Plan contratado',     value: 'Visibilidad y Control 1,100 min + 800 autorización ($11,754) + DIDs 2294560121 y 5512042216 ($99 c/u) + Agente CP Chat ($898)' },
    { label: 'Consumo medido',      value: '16,268 minutos en el periodo cerrado sobre 6,067 llamadas contestadas' },
    { label: 'Adopción',            value: '0 de 6 módulos adicionales en 7 años. El Chat se factura y `tiene_chat_activo` es false.' },
    { label: 'Último contacto',     value: '1 de octubre de 2026' },
    { label: 'Estado en cartera',   value: 'activo (`cuentas.estado`), con 3 episodios de alerta colgados' },
  ],

  necesidad_negocio:
    'Una comercializadora de equipo de cocina vive de la cotización: quien llama quiere precio, ' +
    'disponibilidad o una refacción, y si no lo consigue llama al siguiente proveedor. Con ~38 llamadas ' +
    'por día hábil repartidas en 10 sedes, SAN-SON no necesita más minutos ni más líneas: necesita que la ' +
    'llamada que entra a cualquiera de sus catorce números termine con una persona, y que la que no ' +
    'termine se devuelva. Hoy no existe ni lo primero en un tercio de los casos, ni lo segundo en ninguno.',

  potencial_corto: [
    'Grupo de timbrado con desborde entre sucursales de la misma ciudad (Sanson ↔ Coffee Depot en Guadalajara, Outlet ↔ Chapultepec 68): el 95% de las pérdidas ocurre con extensión libre.',
    'Validar horarios oficiales por sucursal y las tres extensiones personales que sólo llevan a buzón.',
    'Rediseño del IVR en Tlalnepantla (32.6% de abandono) y Coffee Depot Chapultepec (16.2%), sin costo de licencia.',
    'Lista diaria de llamadas perdidas por sucursal para devolución medible desde Callpicker.',
    'Higiene de cuenta: DID 229 456 0121 sin tráfico, Agente CP Chat facturado e inactivo, dos números con tráfico marginal.',
  ],

  potencial_largo: [
    'Agente de voz con IA para fuera de horario y desborde: cubre las ~1,370 llamadas que en diez meses nadie tomó.',
    'Canal escrito (Chat / WhatsApp) para la demanda de fin de semana y fuera de horario — el Chat ya se factura.',
    'Tablero mensual de atención por sucursal: convierte la telefonía en indicador de gestión comercial del cliente.',
    'Replicar el modelo de Chapultepec 68 como estándar de red, con el panel administrador como instrumento.',
  ],

  tacticas: [
    {
      nombre: 'Entrar con la comparación interna, no con la tasa global',
      descripcion: '«Chapultepec 68 contesta el 95%. Coffee Depot Guadalajara pierde casi una de cada cuatro.» La misma plataforma y la misma marca con diez veces de diferencia quita de la mesa la discusión sobre la herramienta.',
      impacto: 'Convierte una conversación de proveedor en una conversación de gestión interna, donde el cliente tiene la palanca y nosotros el dato.',
    },
    {
      nombre: 'Cerrar el argumento de capacidad antes de que se abra',
      descripcion: 'El 5.1% de coincidencia con extensión ocupada se lleva a la sesión por delante. Si el cliente cree que le faltan líneas, la propuesta de desborde no se entiende.',
      impacto: 'Evita una conversación de upgrade que el dato no sostiene y protege la credibilidad del resto del reporte.',
    },
    {
      nombre: 'Llevar la cifra de recuperación a la mesa del titular, no de la encargada',
      descripcion: '«Casi ocho de cada diez de esos clientes no vuelven a ser atendidos en la semana» es una cifra de venta perdida, no de servicio. Paulina responde de forma intermitente; Ruben Kreplak decide.',
      impacto: 'Rompe el cuello de botella de interlocución declarado por el propio KAM el 1 de octubre.',
    },
    {
      nombre: 'Higiene antes de propuesta',
      descripcion: 'El DID sin tráfico y el Chat facturado e inactivo se resuelven ANTES de proponer IA de Voz. Lo que el cliente paga y no usa es el primer argumento de una baja, y si lo descubre solo la conversación será de recorte.',
      impacto: 'Compra credibilidad para la propuesta de valor y elimina el argumento de precio más barato que tiene el cliente.',
    },
  ],

  senal_alarma:
    'Cero módulos adicionales en siete años, cero salientes y cero devoluciones registradas, dos ' +
    'contactos y una encargada que responde de forma intermitente. El costo de salida es bajo y la ' +
    'relación se sostiene por inercia: casi 8 años de pagos puntuales sin una sola conversación de valor ' +
    'documentada. Con 1,668 números sin respuesta en el año, un competidor que llegue con una propuesta ' +
    'de cobertura tiene el argumento hecho.',

  problema_raiz:
    'La red opera con horarios y cobertura decididos sede por sede, sin un estándar de atención ni un ' +
    'segundo timbre, y nadie le ha mostrado al cliente que su propia Chapultepec 68 ya demuestra que la ' +
    'red puede operar por encima del 90%.',

  problema_raiz_detalle:
    'Las tres piezas del diagnóstico son del mismo tipo y ninguna es tecnológica. Primera: el 95% de las ' +
    'pérdidas en horario ocurre con el destino libre, así que falta un segundo timbre, no una línea. ' +
    'Segunda: los huecos de cobertura son estructurales y predecibles — la primera hora (las sedes de CDMX ' +
    'y Tlalnepantla empiezan a contestar a las 10 h mientras Guadalajara, Aguascalientes, Puebla y Cancún ' +
    'lo hacen desde las 9 h) y el fin de semana (sábado tarde y domingo completo sin nadie). Tercera: no ' +
    'hay recuperación — cero salientes y cero devoluciones en Callpicker, con 77.9% de los números sin ' +
    'atención en 7 días.\n\n' +
    'Lo que vuelve esto corregible y no fatal es que la dispersión entre sedes es enorme: 2.3% de pérdida ' +
    'en Chapultepec 68 contra 23.1% en Coffee Depot Guadalajara. Si fuera un problema de plataforma o de ' +
    'plan, todas las sedes perderían parecido. No lo hacen. Y el plan contratado es Visibilidad y Control: ' +
    'hoy el cliente paga por visibilidad que no está usando para actuar.\n\n' +
    'Un límite que hay que decir en voz alta: el horario de atención no lo dio el cliente, se infirió de ' +
    'sus propias llamadas contestadas. Toda la lectura de «pérdida en horario» —incluidas las cifras por ' +
    'sede— cuelga de ese supuesto, y por eso validarlo es la acción 2 del plan y no un detalle de método.',

  flujo_real: [
    { fase: '1. Entra la llamada',          area: '14 números · 10 sedes',       accion: 'IVR y desvío por sucursal ya configurados',                                                   resultado: 'Funciona: 7,727 de 9,095 llamadas entran dentro del horario en que esa sede sí contesta.' },
    { fase: '2. Timbra en un destino libre', area: 'Operación por sede',          accion: 'Sin grupo de timbrado ni desborde a otra sede de la misma ciudad',                             resultado: '95% de las perdidas en horario ocurre con la extensión LIBRE. 1,034 llamadas perdidas en horario en diez meses.' },
    { fase: '3. El menú expulsa en dos sedes', area: 'IVR del cliente',           accion: 'Tlalnepantla y Coffee Depot Chapultepec con árboles distintos al resto',                       resultado: '32.6% y 16.2% de abandono contra 3%–7% en la red.' },
    { fase: '4. Nadie cubre los bordes',     area: 'Operación cliente',           accion: 'Apertura escalonada (9 h en provincia, 10 h en CDMX) y sin turnos de fin de semana',           resultado: '1,368 llamadas fuera de horario, 1,238 sin atender. Domingo: 148 llamadas, ninguna contestada.' },
    { fase: '5. Tres extensiones son buzón', area: 'Operación cliente',           accion: 'Franklin Sambrano, Teresa Vital y Eduardo Villar como destino',                                resultado: '109 llamadas, todas a buzón, ninguna contestada en el periodo.' },
    { fase: '6. Nadie devuelve',             area: 'Operación cliente',           accion: 'Sin saliente ni devolución registrada en Callpicker',                                          resultado: '1,668 de 2,144 números con una pérdida no fueron atendidos en 7 días. Si devuelven desde celulares, es invisible.' },
    { fase: '7. Nadie mide la experiencia',  area: 'Operación cliente',           accion: 'Encuesta activa pero el ejecutivo cuelga antes en 68% de las contestadas',                      resultado: '187 evaluaciones sobre 6,067 contestadas (~3%). Muestra demasiado pequeña para concluir.' },
  ],

  comparativo: [
    { metrica: 'Atención por una persona',               real: '66.7% (6,067 de 9,095)',             ideal: '≥ 85% con desborde entre sedes y cobertura de bordes' },
    { metrica: 'Pérdida dentro del horario de atención', real: '13.2% en la red · 2.3% a 23.1% por sede', ideal: '≤ 8% en la red y ≤ 12% en cada sucursal (meta a 90 días)' },
    { metrica: 'Recuperación a 7 días',                  real: '22.1% (476 de 2,144 números)',        ideal: '≥ 60% con lista diaria de perdidas por sucursal' },
    { metrica: 'Abandono en el menú',                    real: '32.6% en Tlalnepantla · 16.2% en CD Chapultepec', ideal: '≤ 7% en toda la red, con máximo 3 opciones' },
    { metrica: 'Llamadas fuera de horario sin atender',  real: '1,238 de 1,368',                      ideal: 'Cubiertas por IA de Voz o buzón con devolución programada' },
    { metrica: 'Salientes y devoluciones en Callpicker', real: '0 y 0',                               ideal: 'El esfuerzo de devolución medido y asignable por sucursal' },
    { metrica: 'Cobertura de encuesta',                  real: '~3% (187 de 6,067)',                  ideal: '≥ 30% para tener voz del cliente defendible' },
  ],

  plan_inmediato: [
    { accion: 'Sesión de resultados con dirección (Ruben Kreplak) con el tablero por sucursal: 1 de cada 3 clientes no habla con nadie, casi 8 de cada 10 de ellos no vuelve a ser atendido en la semana, y Chapultepec 68 contesta el 95%.', responsable: 'Dan (KAM) + SAC',                 criterio: 'Llamada de 30 min agendada y el reporte enviado antes. Reunión registrada en la cuenta.' },
    { accion: 'Validar los horarios oficiales por sucursal y las tres extensiones personales (Franklin, Teresa, Eduardo) que sólo llevan a buzón. Toda la lectura de «en horario» depende de esto.',                                          responsable: 'Dan + Paulina (encargada)',       criterio: 'Lista de 12 destinos con horario inferido, confirmada o corregida por el cliente.' },
    { accion: 'Grupo de timbrado con desborde en Guadalajara (Sanson ↔ Coffee Depot) y Outlet ↔ Chapultepec 68, con regla de 20 s.',                                                                                                         responsable: 'Soporte Callpicker',              criterio: 'Configuración propuesta y piloto de 2 semanas medido con la pérdida en horario de esas sedes.' },
    { accion: 'Higiene de cuenta antes de cualquier propuesta: DID 229 456 0121 sin tráfico, Agente CP Chat facturado con `tiene_chat_activo = false`, y los dos números de tráfico marginal.',                                                responsable: 'Dan + Facturación',               criterio: 'Decisión por escrito para cada activo: activar, reasignar o dar de baja.' },
    { accion: 'Preguntar al cliente qué es «COCITEC» y si los tres números repetitivos (207 llamadas) son proveedores, robollamadas o pruebas internas.',                                                                                      responsable: 'Dan',                             criterio: 'Las dos respuestas registradas en la cuenta antes de volver a usar esos nombres o cifras con él.' },
  ],

  plan_mediano: [
    { accion: 'Rediseño del IVR en Sanson Tlalnepantla y Coffee Depot Chapultepec: revisar grabación y árbol, dejar máximo 3 opciones.',                     responsable: 'Soporte + cliente',             criterio: 'Abandono en menú por debajo del 7% en las dos sedes.' },
    { accion: 'Lista diaria de llamadas perdidas por sucursal y devolución desde Callpicker, para que el esfuerzo sea medible y asignable.',                   responsable: 'Cliente (gerentes de sucursal)', criterio: 'Meta inicial: devolver el 80% el mismo día. Recuperación a 7 días por encima del 60%.' },
    { accion: 'Replicar el protocolo de Chapultepec 68 como estándar de red, con sesión de transferencia a Guadalajara y Refacciones.',                        responsable: 'Dan + cliente',                  criterio: 'Pérdida en horario por debajo del 12% en cada sucursal.' },
    { accion: 'Levantar el MRR institucional de la cuenta: hoy no hay fila en el GRC para el CID 17297 ni por nombre.',                                        responsable: 'SAC + Facturación',              criterio: 'La cuenta aparece en el GRC con CID, o queda documentado por qué no.' },
  ],

  plan_estrategico: [
    { accion: 'Agente de voz con IA fuera de horario y en desborde, dimensionado con las ~1,370 llamadas que nadie tomó en diez meses. Piloto en Coffee Depot Chapultepec, que concentra 463 de ellas.', responsable: 'Dan + Comercial', criterio: 'Atención total de la red por encima del 85%.' },
    { accion: 'Activar de verdad el Agente CP Chat que ya se factura, como canal de fin de semana y fuera de horario.',                                                                                   responsable: 'Comercial + Soporte', criterio: '`tiene_chat_activo` en true con tráfico medible.' },
    { accion: 'Tablero mensual de atención por sucursal con cuatro métricas: atención en horario, perdidas, recuperación y abandono de menú.',                                                            responsable: 'SAC',             criterio: 'Envío mensual aceptado por el cliente y usado en su propia operación.' },
  ],

  areas_oportunidad: [
    { area: 'Desborde entre sedes de la misma ciudad',  impacto: '95% de las pérdidas en horario ocurre con la extensión libre; 47% de ellas en Guadalajara', responsable: 'Soporte' },
    { area: 'Cobertura de bordes y fin de semana',      impacto: '1,238 llamadas fuera de horario sin atender; domingo con 148 llamadas y cero contestadas', responsable: 'Dan + Comercial' },
    { area: 'Rediseño de IVR',                          impacto: '32.6% y 16.2% de abandono en dos sedes, contra 3%–7% en el resto; sin costo de licencia',  responsable: 'Soporte' },
    { area: 'Devolución medible desde Callpicker',       impacto: '1,668 números sin respuesta en 7 días y cero esfuerzo visible hoy',                         responsable: 'Cliente + SAC' },
    { area: 'Higiene de activos contratados',            impacto: 'Un DID sin tráfico, un Chat facturado e inactivo y dos números marginales',                 responsable: 'Dan + Facturación' },
    { area: 'Interlocución con el titular',              impacto: 'La encargada responde de forma intermitente; la cifra de recuperación es de dirección',     responsable: 'Dan' },
  ],

  perfiles: [
    {
      nombre: 'Ruben Kreplak',
      rol: 'Titular de la cuenta',
      color: '#6366f1',
      campos: [
        { label: 'Vía de contacto',  value: 'Registrada en la ficha sin teléfono útil (0000000000) ni correo completo («sanson.chapultepec»).' },
        { label: 'Por qué importa',  value: 'La cifra que mueve esta cuenta —casi 8 de cada 10 clientes no atendidos no vuelven a serlo en la semana— es una cifra de venta perdida, y eso se decide en dirección.' },
        { label: 'Riesgo',           value: 'Hoy no existe una vía directa al decisor en la ficha. Conseguirla es parte de la acción 1.' },
      ],
    },
    {
      nombre: 'Paulina',
      rol: 'Encargada de Callpicker',
      color: '#f59e0b',
      campos: [
        { label: 'Correo',             value: 'asistentedireccion@san-son.com' },
        { label: 'Lo que dice el KAM', value: 'Contacto intermitente y tiempos de respuesta prolongados; se la ha invitado a sesiones personalizadas sin respuesta. Programado un nuevo acercamiento por WhatsApp.' },
        { label: 'Rol real',           value: 'Puerta de entrada operativa: es quien puede confirmar los 12 horarios y las tres extensiones personales. No es la decisora.' },
      ],
    },
    {
      nombre: 'Sanson Chapultepec 68',
      rol: 'El modelo interno de la red',
      color: '#22c55e',
      campos: [
        { label: 'Volumen',          value: '1,488 llamadas · 1,330 dentro de su horario' },
        { label: 'Atención',         value: '94.7% en horario · 2.3% de pérdida' },
        { label: 'Duración media',   value: '3.7 min — la más alta de la red' },
        { label: 'Para qué sirve',   value: 'Demuestra, con la misma plataforma y la misma marca, que la red puede operar arriba del 90%. Es el estándar a replicar, no un caso aislado.' },
      ],
    },
    {
      nombre: 'Coffee Depot Guadalajara',
      rol: 'El extremo opuesto de la red',
      color: '#ef4444',
      campos: [
        { label: 'Volumen',          value: '1,076 llamadas · 950 dentro de su horario' },
        { label: 'Pérdida',          value: '23.1% en horario — la peor de la red con volumen significativo' },
        { label: 'Encuesta',         value: '10 negativas de 27 evaluaciones: la proporción más alta junto con Cancún' },
        { label: 'Peso',             value: 'Con Sanson Guadalajara (18.9%) concentra el 47% de todas las pérdidas en horario de la red.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Casi 8 años de relación, al corriente en pagos y con relación activa con su asesor.',
      'Demanda estable y alta: ~38 llamadas por día hábil en 14 números y 10 sedes, 6,033 números distintos.',
      'Prueba interna de excelencia: Chapultepec 68 atiende 94.7% en horario con 3.7 min de duración media.',
      'Líneas sin saturación: sólo 5.1% de las pérdidas coincide con extensión ocupada.',
      'Infraestructura montada: IVR, desvíos por sucursal y buzones fuera de horario ya configurados.',
      'Las seis series del reporte cierran contra el total: la base de la conversación es sólida.',
    ],
    oportunidades: [
      'Agente de voz con IA para fuera de horario y desborde: cubre las ~1,370 llamadas que nadie tomó.',
      'Grupos de timbrado y desborde entre sucursales de la misma ciudad (Guadalajara, CDMX).',
      'Lista diaria de perdidas para devolución medible desde Callpicker.',
      'Rediseño de IVR en Tlalnepantla y Coffee Depot Chapultepec sin costo de licencia.',
      'Activar de verdad el Agente CP Chat que ya se factura.',
      'Tablero mensual por sucursal: convierte la telefonía en indicador de gestión del cliente.',
    ],
    debilidades: [
      '33.3% de las llamadas no llega a una persona; 13.2% se pierde aun dentro de horario.',
      'Huecos de cobertura a las 8–10 h, después de las 18 h, sábado tarde y domingo completo.',
      'Cero salientes y cero devoluciones registradas: recuperación de 22.1% a 7 días.',
      'Guadalajara (dos marcas), Refacciones y Puebla con 19%–23% de pérdida en horario.',
      'Menús con abandono alto: Tlalnepantla 33%, Coffee Depot Chapultepec 16%.',
      'Tres extensiones personales que sólo llevan a buzón.',
      '0 de 6 módulos adicionales en 7 años; encuesta con ~3% de cobertura.',
      'MRR institucional no medible: la cuenta no tiene fila en el GRC.',
    ],
    amenazas: [
      'Venta perdida silenciosa: en una comercializadora, cada llamada no atendida es una cotización que puede irse a la competencia.',
      'Bajo costo de salida: sin módulos ni integraciones, Callpicker puede percibirse como «sólo conmutador».',
      'Relación concentrada en 2 contactos, con la encargada respondiendo de forma intermitente.',
      'El cliente puede atribuir a la plataforma una falla que es operativa si nadie le muestra el dato.',
      'Servicios contratados sin uso visible (DID y Chat): argumento natural para recortar o cancelar.',
      'Si descubre por su cuenta el DID sin tráfico y el Chat inactivo, la conversación será de recorte y no de valor.',
    ],
  },

  conclusion:
    'SAN-SON es una cuenta sana en todo lo que depende de nosotros y enferma en todo lo que depende de su ' +
    'operación. Las líneas no están saturadas, el IVR y los desvíos están montados, el volumen no cae y ' +
    'los pagos llevan casi ocho años puntuales. Pero un tercio de lo que entra no llega a una persona, ' +
    'ocho de cada diez clientes no atendidos no vuelven a serlo en la semana, y no existe una sola ' +
    'devolución registrada.\n\n' +
    'La buena noticia es que el cliente ya tiene la respuesta en casa. Chapultepec 68 atiende el 94.7% con ' +
    'la misma plataforma que Coffee Depot Guadalajara usa para perder el 23.1%. Eso convierte el reporte en ' +
    'una conversación de gestión, no de precio, y nos pone del lado útil de la mesa.\n\n' +
    'Dos cosas hay que decir sin adornos. La primera: no podemos citarle un MRR institucional, porque la ' +
    'cuenta no tiene fila en el GRC ni por CID ni por nombre, y los $12,554 de la ficha no son eso. La ' +
    'segunda: el horario de atención de cada sede lo inferimos nosotros, no lo dio el cliente, y toda la ' +
    'lectura de «pérdida en horario» cuelga de ese supuesto. Validarlo es la acción 2, no una nota de método.',

  pierde: [
    'Una cuenta de casi 8 años con 10 sedes y 14 números, cuyo MRR institucional hoy no podemos ni medir.',
    'La referencia en comercialización de equipo para cocina industrial, donde no tenemos otra cuenta auditada.',
    'La única red multisede de la cartera con un benchmark interno propio por encima del 90%.',
    'Un Agente CP Chat ya facturado que nunca se activó: un módulo vendido y perdido sin usarse.',
  ],

  gana: [
    'Un caso de desborde entre sedes replicable en toda la cartera multisucursal.',
    'La conversión de «sólo conmutador» a indicador de gestión comercial, vía tablero por sucursal.',
    'Un piloto de IA de Voz dimensionado con 1,368 llamadas reales fuera de horario, no con una estimación.',
    'Acceso a dirección (Ruben Kreplak), que hoy no existe en la ficha.',
  ],

  recomendacion_central:
    'Llevar a dirección la comparación interna —Chapultepec 68 al 94.7% contra Coffee Depot Guadalajara al ' +
    '23.1% de pérdida— y el 5.1% de coincidencia con extensión ocupada, para cerrar de entrada la discusión ' +
    'de capacidad. Pedir en esa misma sesión los horarios oficiales por sede, porque toda la lectura cuelga ' +
    'de un horario que inferimos nosotros. Proponer tres cosas que no cambian su operación: un segundo ' +
    'timbre entre sucursales, una lista diaria de perdidas para devolverlas y cobertura con IA en las horas ' +
    'en que hoy no hay nadie — piloto de dos semanas en Guadalajara, medido. Y resolver antes la higiene del ' +
    'DID sin tráfico y del Chat facturado e inactivo, que es el argumento de recorte más barato que tiene el ' +
    'cliente.',

  documentos: [
    {
      nombre: 'Auditoría de atención telefónica · SAN-SON / Coffee Depot · 2026',
      ruta: '/auditorias/Auditoria-SAN-SON-2026.html',
      descripcion:
        'Reporte interactivo del CID 17297, periodo cerrado 2 ene – 31 oct 2026 (9,095 llamadas) con ' +
        'noviembre 1–26 en tránsito: tendencia mensual y semanal, día y hora, mapa de calor, desempeño de ' +
        'las 12 sucursales, recuperación a 7 días, 10 hallazgos, FODA y ruta de acción. Publicado con dos ' +
        'marcados visibles (la exclusión de 207 llamadas que no se reconstruye desde la tabla por sucursal ' +
        'y el recorte de 7–20 h del mapa de calor) y con la ausencia de «COCITEC» y del MRR en el GRC ' +
        'declarada dentro del documento.',
    },
  ],
}
