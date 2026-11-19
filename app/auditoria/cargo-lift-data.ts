import type { AuditoriaCase } from './types'

/**
 * VERSIÓN 2.0 · 19 nov 2026 · sustituye la 1.0 de agosto de 2026.
 *
 * Fuente: «auditoria-cargo-lift-2026.html» — Auditoría de llamadas,
 * 2 ene – 17 nov 2026, Satisfacción al Cliente (SAC) · Callpicker.
 * Publicada en `public/auditorias/Auditoria-Cargo-Lift-2026.html`.
 *
 * LO QUE CAMBIÓ RESPECTO A LA 1.0, y por qué importa
 * ──────────────────────────────────────────────────
 * La 1.0 venía de un `.docx` de agosto que CLASIFICABA entrante/saliente por
 * supuesto metodológico y daba 43.4% de pérdida saliente. La 2.0 mide con el
 * registro real, separa internas de externas y cambia el diagnóstico entero:
 * la pérdida entrante NO es el problema (bajó de 10.4% a 6.5%), el problema es
 * que la demanda cayó 53% y que casi nadie devuelve lo que se pierde.
 *
 * Y se corrigieron tres cifras del expediente 1.0 contra nuestras fuentes:
 *   · MRR  $10,655 → $18,264 (GRC; $18,953 el CID con Cargo Lift USA).
 *     Los $10,655 son `cuentas.facturacion`, que NO es el MRR institucional.
 *   · Health Score 64 → 65 (`cuentas.health_score`).
 *   · «22 números de entrada» → 7 en `dids.json`, que es justo lo que el
 *     reporte 2026 sostiene: el principal más seis que dejaron de recibir.
 *
 * Y UNA CORRECCIÓN AL DOCUMENTO ENTREGADO, anotada visible dentro de él: el
 * borrador llamaba a la semana del 9 de febrero «la semana de más volumen del
 * año» y es la cuarta (la de más volumen fue la del 23 de febrero, con 217).
 * Sí es la semana con más llamadas sin contestar y la de peor tasa.
 *
 * Lo recalcula `python -I scripts/concilia-auditoria-cargo-lift.py`, que además
 * contrasta MRR, Health Score, alertas y DIDs contra nuestras fuentes y exige
 * que las notas y las claves de conciliación sigan DENTRO del documento.
 */
export const CARGO_LIFT: AuditoriaCase = {
  id:                    'cargo-lift',
  asesor:                'Dan',
  nombre:                'Cargo Lift',
  sector:                'Comercializadora · productos de izaje y sujeción de carga + servicios',
  fecha_periodo:         '2 Enero – 17 Noviembre 2026',
  fecha_auditoria:       'Nov 2026',
  tipo_cliente:          'AAA · 133 meses de relación · plan AV Visibilidad y Control usado al 9.6%',
  descripcion_contexto:  'CID 439 · Consecutivo D5 · 5,319 entrantes externas · 9.1% sin contestar · Asesor: Dan Domínguez',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '2.0',

  kpis: [
    { label: 'Demanda por día hábil',        value: '31.6 → 14.9 (−53%)', color: '#ef4444' },
    { label: 'Perdidas nunca recuperadas',   value: '262 (53.9%)',        color: '#f59e0b' },
    { label: 'Devueltas por Cargo Lift',     value: '33 de 486 (6.8%)',   color: '#ef4444' },
    { label: 'Entrantes sin contestar',      value: '486 de 5,319 (9.1%)', color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'Cargo Lift contesta mejor que a principios de año y eso no la pone a salvo. La tasa de entrantes sin contestar bajó de 10.4% (enero–junio) a 6.5% (julio–noviembre) sobre 5,319 llamadas externas, con 486 perdidas en total (9.1%). Pero la demanda que entra cayó a menos de la mitad: 31.6 llamadas por día hábil en el primer trimestre contra 14.9 de agosto a noviembre, un −53%. La caída empezó en mayo, antes del cambio de agencia de agosto, así que no se explica solo por ese cambio.\n\n' +
    'El riesgo que decide la reunión es otro: de las 486 llamadas perdidas, 262 (53.9%) nunca se recuperaron, y 157 de ellas venían de números que llamaban por primera vez. Cargo Lift devolvió 33 llamadas en total (6.8%); casi toda la recuperación la hizo el cliente al volver a marcar, con una mediana de 9 minutos: ya se había frustrado una vez. En una comercializadora de izaje y sujeción, quien llama por primera vez está cotizando con dos o tres proveedores. La pérdida real no es la llamada, es el pedido.\n\n' +
    'Lo que el reporte de tráfico no mira, y el expediente sí tiene que llevar: la cuenta arrastra una alerta CRÍTICA ABIERTA de downgrade repetido desde el 16 de noviembre —bajó de plan en seis meses de 2026, dos de ellos consecutivos, $2,675 de MRR menos— y una alerta ALTA de uso bajo desde el 6 de octubre: nunca pasó del 10% de su plan en cinco meses. Paga $18,953 al mes (CID) por una plataforma que consume al 9.6%. El asesor no puede entrar a hablar solo de llamadas perdidas.',

  resultado_positivo:
    'La operación telefónica mejoró de verdad y hay que reconocerlo antes de recomendar nada. ' +
    'La pérdida se redujo casi a la mitad y desde junio ninguna semana pasa de 11%; la mejora coincide con la llegada de Verónica Pérez a recepción en mayo, y ella pierde solo 2.3% de 577 llamadas: es el mejor ejemplo de la cuenta. ' +
    'El agente virtual no pierde una sola llamada: «AV Atención a clientes» 2.7% de 296 y «Agente Virtual» 0% de 202. La cobertura fuera de horario funciona (98 llamadas, 5 perdidas) y el sábado también (228 llamadas, 3.1%). ' +
    'La semana de más volumen del año —217 llamadas, la del 23 de febrero— se atendió con 8.3% de pérdida, por debajo del promedio anual: con el equipo completo esta operación aguanta ese pico. ' +
    'La marcación saliente se cuadruplicó desde julio (42 llamadas al mes en enero–junio contra 173 en julio–octubre) sin perder tasa de conexión. ' +
    'Y la relación está en su mejor momento en años: Pablo Prieto y Adrián entraron como consultores con usuarios propios, el agente virtual ya quedó definido y liberado con integración a GoHighLevel, y el 17 de noviembre Pablo pidió él mismo una sesión de revisión.',

  /* EL ORDEN DE ESTA LISTA ES UNA DECISIÓN DE PRODUCTO, NO DE ESTILO.
     `lib/atlas-context.ts` mete en el dossier de Atlas SÓLO los cuatro
     primeros y recorta cada uno a 180 caracteres, y
     `lib/seguimiento-auditoria.ts` se lleva los TRES primeros ENTEROS a la
     actividad SAC que el asesor lee antes de llamar. Los cuatro primeros están
     escritos para decir lo suyo DENTRO del corte. Lo comprueba
     `node scripts/revisa-dossier-auditoria.mjs cargo-lift`.
     [[auditoria-modulo]] [[feedback-contexto-ia-sin-huecos]] */
  hallazgos: [
    'NO felicitar la mejora: contestan mejor porque entra menos. La pérdida bajó de 10.4% a 6.5% y a la vez entra la mitad (−53% por día hábil); solo el 6.8% de las perdidas se devuelve. Las dos cosas pasaron juntas y hay que decirlo así: la tasa mejoró en parte porque hay menos tráfico que atender, no solo porque se atienda mejor.',

    '262 perdidas nunca recuperadas (53.9%) y 157 eran primer contacto: cotizaban y no volvieron. Cargo Lift devolvió 33 de 486 (6.8%). Ése es el motivo de la reunión, no el porcentaje. Hay además 39 casos del mismo número perdido dos veces en menos de 10 minutos: un cliente con urgencia que nadie atendió. Cuando el cliente insiste, la mediana es de 9 minutos; cuando Cargo Lift devuelve, 27.',

    'Alerta CRÍTICA abierta que el reporte no toca: downgrade en 6 meses de 2026, dos seguidos, $2,675 de MRR menos, y el plan se usa al 9.6%. Es riesgo comercial, no telefónico. Los meses con downgrade son Enero, Febrero, Abril, Mayo, Agosto y Septiembre. La alerta de uso bajo está abierta desde el 6 de octubre: nunca pasó del 10% de su plan en cinco meses de cortes. Las dos siguen vivas al 19 de noviembre.',

    'MRR $18,264 del GRC ($18,953 el CID con Cargo Lift USA), no $10,655 como decía la versión 1.0: eso era `cuentas.facturacion`. Banda AAA, 133 meses, Health Score 65. La cuenta es casi el doble de grande de lo que decía el expediente anterior, y eso cambia a quién se le pide presupuesto para resolverlo.',

    'Dos personas sostienen la recepción: de septiembre a noviembre Verónica Pérez atendió 35.6% de lo contestado y María del Pilar Pérez 22.1% — el 58% entre las dos. Verónica pierde 2.3%; María del Pilar acumula 95 perdidas, la cifra más alta en número de toda la cuenta. No es un problema de desempeño, es un punto único de falla: si una falta, la recepción se cae.',

    'La pérdida tiene nombre y no es falta de gente: Antolín Morales no contestó NINGUNA de 29 llamadas (ene–feb) y 28 venían de un mismo número que marcó 81 veces en el año — hay que identificar a ese contacto. Andrea Salazar perdió 16 de 18 en sep–nov (89%): ése es el foco rojo vigente. Raúl Natera 41%, Jesús Dávila 39% y Óscar Godínez 37% recibían llamadas directas sin respaldo.',

    'Dos horas concentran la pérdida: las 15:00 pierden 13.6% en el año (66 de 484, con sábado incluido) y las 17:00 empeoraron — de agosto a noviembre pierden 12.3% mientras las demás horas bajaron a cerca de 5%. La peor celda del año es viernes a las 15:00: 22 de 93 (23.7%). Y el lunes de 9:00 a 12:59 acumula 65 perdidas, el 13% del total, en el arranque de semana.',

    'El gráfico de destinos del reporte deja fuera una quinta parte de la pérdida: sus 23 barras cubren 4,066 de las 5,319 llamadas y 385 de las 486 perdidas, así que 101 perdidas (20.8%) viven en los 42 destinos restantes, todos con menos de 40 llamadas, y en el menú. La propuesta de depurar destinos necesita la lista completa de los 65, no las 23 que se dibujaron.',

    'El agente virtual es el único resultado limpio de la cuenta: 0 perdidas de 202 llamadas en «Agente Virtual» y 8 de 296 (2.7%) en «AV Atención a clientes». Pero 850 llamadas (16%) terminaron en el menú o en el agente virtual sin pasar a una persona y el archivo no registra su duración: no se sabe cuántas se resolvieron y cuántas colgaron. Se mide o no se presume.',

    'La marcación saliente descansa en una sola persona y cuelga antes de tiempo: Alfredo Basurto hizo 516 de las 1,000 salientes (51.6%) desde el 8 de julio. De las 378 que no conectaron la mediana de timbrado fue de 14.5 segundos —255 se cortaron antes de 30 s y 95 antes de 10—, así que muchas no llegaron ni a buzón. Y 226 llamadas repiten el mismo número en menos de 10 minutos.',

    'Una de cada tres llamadas internas no se contesta: 215 de 537 en el registro de salientes (40%) y 175 de 520 en el de entrantes (34%). Cuando un vendedor no localiza a almacén o a un compañero, el cliente espera del otro lado. Vigilancia hizo 134 llamadas internas, la mayoría entre 11:00 y 14:00, con 14% sin contestar: conviene darle un destino de grupo.',

    'La configuración está sucia y parte los reportes: nombres duplicados o con errores en las extensiones («Martin Juarez Juarez» y «MARTIN JUAREZ», «Marco Contreras» y «Marco Antonio Contreras», «Gerardo Castillo Loppez», «Moserrat Cerecedo»), 65 destinos distintos recibiendo entrantes y seis números que dejaron de recibir llamadas entre marzo y mayo — si siguen publicados en el sitio o en facturas, son llamadas que hoy no llegan a nadie. `dids.json` trae 7 números para el CID, que es exactamente el principal más esos seis.',

    'La caída de demanda NO se explica solo por el cambio de agencia: empezó en mayo y el cambio fue en agosto. Los números que llamaban por primera vez siguieron la misma curva (444 en febrero, 237 en octubre). Sin números rastreables por campaña no se puede medir a la agencia nueva, y hoy no los hay: es la propuesta 7 del reporte y la única forma de saber si la demanda vuelve.',

    'Corrección hecha al documento entregado, anotada dentro de él: el borrador decía que la semana del 9 de febrero era «la semana de más volumen del año» y es la cuarta — la de más volumen fue la del 23 de febrero con 217 llamadas, que perdió solo 8.3%. La del 9 de febrero sí es la de más perdidas (37) y la de peor tasa (17.8%). El matiz importa: con el equipo completo la operación aguanta 217 llamadas a la semana, así que el argumento es «volumen sin cobertura», no «volumen».',

    'El silencio ya se había medido: la alerta de contacto (silencio_60) se abrió el 17 de octubre, escaló a crítica el 16 de noviembre y se cerró el 17 cuando Pablo contestó. Fueron 62 días sin que un contacto nuestro llegara al cliente, con el último el 16 de septiembre. Esta auditoría llega justo después de romper ese silencio, y eso condiciona el tono de la reunión.',
  ],

  cronologia: [
    { fecha: '23 Oct 2015',        responsable: 'Callpicker',                      evento: 'Alta de la cuenta Cargo Lift (CID 439, consecutivo D5). 133 meses de relación al corte de noviembre de 2026.', tipo: 'ok' },
    { fecha: 'Ene – Abr 2026',     responsable: 'Cargo Lift (operación)',          evento: 'Pérdida entrante alta y sostenida: 12.3%, 12.2%, 7.8% y 12.9%. La peor semana del año es la del 9 de febrero, con 37 de 208 sin contestar (17.8%).', tipo: 'problema' },
    { fecha: 'May 2026',           responsable: 'Cargo Lift (recepción)',          evento: 'Llega Verónica Pérez a recepción y la pérdida se corta a la mitad. En el mismo mes empieza a caer la demanda: de 28.1 llamadas por día hábil en abril a 21.9.', tipo: 'pivote' },
    { fecha: '25 Ago 2026',        responsable: 'Cargo Lift / Dan Domínguez',      evento: 'Reunión de transición: la empresa termina una relación de 17 años con su agencia de marketing. Se revisa el desempeño telefónico y la integración tecnológica necesaria.', tipo: 'pivote' },
    { fecha: '28 Ago 2026',        responsable: 'Cargo Lift / Dan Domínguez',      evento: 'Revisión de cuenta: incidencias de CRM, configuraciones y permisos. Se dan de alta usuarios de Callpicker para Pablo Prieto y Adrián como consultores.', tipo: 'ok' },
    { fecha: '15 Sep 2026',        responsable: 'Cargo Lift / Dan Domínguez',      evento: 'Sesión de APIs y Callpicker Chat con el consultor. Se contesta el Radar de la cuenta: score 58, nivel «prevent». Queda pendiente dar de alta dos números como bandejas de Chat.', tipo: 'neutral' },
    { fecha: '6 Oct 2026',         responsable: 'Motor de alertas',                evento: 'Se abre la alerta de CONSUMO (uso_bajo, severidad alta): nunca pasó del 10% de su plan en cinco meses de cortes. SIGUE ABIERTA.', tipo: 'problema' },
    { fecha: '17 Oct 2026',        responsable: 'Motor de alertas',                evento: 'Se abre la alerta de CONTACTO (silencio_60): el último contacto que llegó al cliente fue el 16 de septiembre. Escala a crítica el 16 de noviembre.', tipo: 'problema' },
    { fecha: '16 Nov 2026',        responsable: 'Motor de alertas',                evento: 'Se abre la alerta de FACTURACIÓN (downgrade_repetido, CRÍTICA): bajó de plan en seis meses de 2026 —Enero, Febrero, Abril, Mayo, Agosto y Septiembre—, dos de ellos seguidos, $2,675 de MRR menos. SIGUE ABIERTA.', tipo: 'problema' },
    { fecha: '17 Nov 2026',        responsable: 'Pablo Prieto / Dan Domínguez',    evento: 'Pablo contesta y pide una sesión de revisión del bot para adaptarlo al nuevo esquema. Se cierra la alerta de silencio tras 62 días. Último día del periodo auditado.', tipo: 'pivote' },
    { fecha: '19 Nov 2026',        responsable: 'SAC · Callpicker',                evento: 'Reunión de revisión del agente virtual con integración al CRM, y se emite esta auditoría de llamadas (2 ene – 17 nov) con 11 propuestas y seis indicadores a 90 días.', tipo: 'pivote' },
    { fecha: 'Pendiente',          responsable: 'Dan Domínguez / Pablo Prieto',    evento: 'Alerta de llamada perdida hacia GoHighLevel con devolución en menos de 30 minutos, desborde por grupo, y números rastreables por campaña para medir a la agencia nueva.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',            value: 'Cargo Lift' },
    { label: 'CID Zoho',                value: '439' },
    { label: 'Consecutivo',             value: 'D5' },
    { label: 'Sector',                  value: 'Comercializadora — productos para movimiento/izaje y sujeción de carga + servicios (inspecciones / pruebas / capacitación)' },
    { label: 'Cliente desde',           value: '23 Oct 2015 · 133 meses (11 años 1 mes) al corte de noviembre de 2026' },
    { label: 'MRR institucional',       value: '$18,264.40 MXN/mes (GRC, fila Cargo Lift) · banda AAA · 11 facturas' },
    { label: 'MRR del CID',             value: '$18,953.40 — suma la fila agrupada «Cargo lift USA» ($689, banda B, 95 meses). Es el importe que citan las alertas.' },
    { label: 'Ojo con `facturacion`',   value: '`cuentas.facturacion` dice $10,655 y NO es el MRR institucional. La versión 1.0 de este expediente lo copió: son $7,609 de diferencia.' },
    { label: 'Contacto principal',      value: 'Ricardo Barroso — Director · rbarroso@cargo-lift.com.mx · 55 5536 6542' },
    { label: 'Consultores del cliente', value: 'Pablo Prieto Arrechea (pprieto@factivo.com · 55 2955 3202) y Adrián — con usuarios propios de Callpicker desde agosto de 2026' },
    { label: 'Asesor de cuenta',        value: 'Dan Domínguez' },
    { label: 'Health Score',            value: '65 / 100 · estado En Riesgo (actividad 85 · adopción 29 · pago 90 · relacional 55)' },
    { label: 'Plan contratado',         value: 'AV Visibilidad y Control · consumo promedio 9.6% (959 min) en los cortes de jun, jul y ago de 2026' },
    { label: 'Alertas de cliente',      value: 'DOS ABIERTAS al 19 nov 2026: downgrade_repetido (CRÍTICA, desde el 16 nov) y uso_bajo (alta, desde el 6 oct). Cerrada el 17 nov: silencio_60, que había escalado a crítica.' },
    { label: 'Radar',                   value: 'Contestado el 15 sep 2026 · score 58 · nivel «prevent»' },
    { label: 'Números de entrada',      value: '7 en `dids.json` (CDMX, Bajío, Querétaro, Monclova, Monterrey, transferencia USA y un 800). El principal concentra 3,261 llamadas con 8.9% de pérdida; seis dejaron de recibir entre marzo y mayo.' },
    { label: 'Periodo analizado',       value: '2 Ene – 17 Nov 2026 · 5,319 entrantes externas y 1,000 salientes externas (más 520 y 537 internas, medidas aparte)' },
  ],

  necesidad_negocio:
    'Cargo Lift necesita dos cosas distintas que hoy se confunden en una sola conversación. ' +
    'La primera es operativa y urgente: que ninguna llamada perdida se quede sin devolver. El 53.9% de las perdidas nunca se recuperó y el 32% de ésas era un primer contacto; en una comercializadora de izaje, ese primer contacto está cotizando con la competencia mientras marca. ' +
    'La segunda es comercial y más grande: la cuenta paga $18,953 al mes por una plataforma que consume al 9.6% y lleva seis meses de 2026 bajando de plan. Mientras el consumo no suba, cada corte es una oportunidad de recorte, y el tráfico telefónico —que cayó 53%— es precisamente lo que determina ese consumo. ' +
    'Las dos se resuelven con lo que ya tiene contratado: desborde por grupo, alerta de llamada perdida hacia GoHighLevel, agente virtual tomando recado y números rastreables por campaña. Nada de eso exige comprar algo nuevo, y eso es lo que hace la conversación posible.',

  potencial_corto: [
    'Alerta de llamada perdida que crea una tarea en GoHighLevel y se devuelve en menos de 30 minutos: el 6.8% de devolución actual es el indicador con más distancia a su meta (80%).',
    'Desborde en cada grupo de ventas: si no contesta en 20 segundos pasa al siguiente, y si nadie contesta el agente virtual toma los datos. El 58% de lo atendido cae en dos personas.',
    'Sacar del ruteo o reasignar los destinos que no contestan: Antolín Morales (100% de 29), Andrea Salazar (89% en sep–nov) y Raúl Natera (41% de 73), pidiendo antes la lista completa de los 65 destinos.',
    'Cobertura escalonada a las 15:00 y a las 17:00, con el agente virtual tomando recado después de las 17:00.',
  ],

  potencial_largo: [
    'Números rastreables por campaña cruzados con GoHighLevel: sin ellos no hay forma de medir a la agencia nueva ni de saber si la demanda vuelve.',
    'Medir el menú y el agente virtual —motivo, resultado y si transfirió—: hoy 850 llamadas (16%) terminan ahí sin que se sepa cuántas se resolvieron.',
    'Grupos internos (almacén, ventas, vigilancia) en lugar de marcar persona por persona: una de cada tres llamadas internas no se contesta.',
    'Reglas de marcación saliente: timbrar al menos 25 segundos, reintentar a las 2 horas y al día siguiente, y concentrar el esfuerzo de 11:00 a 13:00, donde la conexión llega a 70.5%.',
    'Tablero semanal de perdidas por hora, día, destino y número, con su devolución, revisado cada lunes: es lo que convierte las once propuestas en seguimiento.',
  ],

  tacticas: [
    { nombre: 'Desborde y grupos de ventas',           descripcion: 'Candidatura MUY ALTA. Dos personas atienden el 58% de lo contestado y hay extensiones que pierden entre 41% y 100% de lo que reciben. El desborde no es una función nueva: es configuración.',                      impacto: 'Quita el punto único de falla sin contratar a nadie.' },
    { nombre: 'Webhook de llamada perdida → GoHighLevel', descripcion: 'Candidatura MUY ALTA. La integración con GoHighLevel ya está liberada para el agente virtual; falta el evento de llamada perdida. Es lo único que convierte 262 perdidas sin recuperar en tareas con dueño.',  impacto: 'Devolución medible en menos de 30 minutos.' },
    { nombre: 'Agente virtual en cierre y comida',     descripcion: 'Candidatura MUY ALTA. Es el único destino que no pierde llamadas (0 de 202) y las dos horas malas son la comida y el cierre. Ya está en producción perfilando y capturando prospectos.',                        impacto: 'Nadie escucha timbrar sin respuesta a las 15:00 ni a las 17:00.' },
    { nombre: 'Números rastreables por campaña',       descripcion: 'Candidatura ALTA. La demanda cayó 53% y la caída empezó antes del cambio de agencia: sin número por campaña no se puede atribuir ni medir a la agencia nueva.',                                               impacto: 'Convierte la discusión de agencia en una cifra.' },
    { nombre: 'Visibilidad y Control / tablero',       descripcion: 'Candidatura ALTA. Es el plan que ya paga y lo usa al 9.6%. El tablero semanal de perdidas por hora, día, destino y número es el uso que justifica el plan.',                                                   impacto: 'Sube el consumo del plan que ya factura y frena el downgrade.' },
    { nombre: 'Medición del menú y del agente virtual', descripcion: 'Candidatura ALTA. 850 llamadas (16%) terminan en el menú sin que se sepa el resultado. Activar el registro y revisar 50 grabaciones cierra el único hueco de medición del reporte.',                           impacto: 'Deja de presumirse lo que no está medido.' },
    { nombre: 'Depuración de extensiones y destinos',  descripcion: 'Candidatura MEDIA-ALTA. 65 destinos, nombres duplicados y seis números en desuso. Con el esquema nuevo sin división por zonas es el momento.',                                                                impacto: 'Reportes que no se parten en dos y transferencias que no fallan.' },
  ],

  senal_alarma:
    'La señal no es la tasa de pérdida: es que mejorar la tasa coincidió con perder la mitad de la demanda, y que lo que se pierde no se devuelve. ' +
    '262 llamadas perdidas nunca recuperadas y 157 de ellas primeros contactos que no volvieron a marcar. ' +
    'Y por debajo del tráfico hay una señal comercial que el reporte de llamadas no mira: seis meses de 2026 con downgrade —dos seguidos—, $2,675 de MRR menos, una alerta CRÍTICA abierta desde el 16 de noviembre, y un plan que nunca pasó del 10% de uso en cinco meses. ' +
    'A eso se suma que entre el 16 de septiembre y el 17 de noviembre ningún contacto nuestro llegó al cliente: 62 días de silencio que escalaron a crítica dos días antes de esta auditoría.',

  problema_raiz:
    'La operación mejoró mientras el negocio empeoró, y los dos movimientos se miden en la misma pantalla: se contesta mejor porque entra menos, y lo que entra y se pierde no se devuelve.',

  problema_raiz_detalle:
    'Cargo Lift no tiene un problema de atención telefónica. En horario normal y con el equipo completo esta operación atiende bien: la semana de más volumen del año —217 llamadas— se resolvió con 8.3% de pérdida, por debajo del promedio anual, y la recepcionista que concentra más tráfico pierde solo el 2.3%. ' +
    'Lo que falla es todo lo que ocurre cuando la llamada no se toma. No hay regla de devolución —el 6.8% de las perdidas se devuelve y la mediana es de 27 minutos—, así que la recuperación depende de que el cliente vuelva a marcar; no hay desborde, así que la experiencia depende de que dos personas estén en su lugar; y no hay cobertura escalonada, así que la comida y el cierre pierden el doble que el resto del día. ' +
    'Debajo de eso hay una causa que el reporte de tráfico no puede ver: la cuenta paga un plan de Visibilidad y Control que usa al 9.6% y lleva seis meses de 2026 bajando de nivel. El consumo lo determina el tráfico, y el tráfico cayó 53% desde mayo —antes del cambio de agencia—. Mientras no haya número rastreable por campaña, nadie puede decir si la demanda vuelve ni a quién atribuirlo, y cada corte de facturación es una oportunidad de recorte.',

  flujo_real: [
    { fase: 'Entrada',        area: '7 números (CDMX, Bajío, Qro, Monclova, Monterrey, 800)', accion: 'La demanda entra por el número principal y seis líneas de plaza, seis de ellas ya sin tráfico.', resultado: '5,319 entrantes externas; el principal concentra 3,261 con 8.9% de pérdida. El número de Querétaro pierde 25% (32 de 127).' },
    { fase: 'Menú / AV',      area: 'Agente virtual de voz',                                   accion: 'El agente virtual contesta, perfila y canaliza; sustituye al IVR en las líneas activas.',   resultado: '0 perdidas de 202 en «Agente Virtual» y 8 de 296 en «AV Atención a clientes». Pero 850 llamadas (16%) terminan ahí sin pasar a una persona y sin resultado registrado.' },
    { fase: 'Destinos',       area: '65 destinos, 23 con 40+ llamadas',                        accion: 'Se transfiere a grupos de ventas y a extensiones personales.',                                resultado: 'El 58% de lo contestado en sep–nov cae en dos personas; tres destinos pierden del 41% al 100%. 101 perdidas (20.8%) viven en destinos que el reporte no grafica.' },
    { fase: 'Pérdida',        area: 'Comida y cierre',                                          accion: 'Nadie cubre las 15:00 ni el cierre de las 17:00, y no hay desborde.',                         resultado: '486 perdidas (9.1%). Las 15:00 pierden 13.6% y las 17:00 12.3% en ago–nov, contra ~5% del resto del día.' },
    { fase: 'Recuperación',   area: 'Nadie, en la práctica',                                    accion: 'No hay regla de devolución: se espera a que el cliente vuelva a marcar.',                     resultado: '33 devoluciones de 486 (6.8%), mediana 27 min. 262 nunca recuperadas, 157 de ellas primeros contactos. 39 números se perdieron dos veces en menos de 10 minutos.' },
    { fase: 'Saliente',       area: 'Prospección',                                              accion: 'Se marca en frío, cuadruplicando el volumen desde julio.',                                    resultado: '1,000 salientes externas, 62.1% de conexión. Una persona hace el 51.6%; la mediana de timbrado de las no conectadas es de 14.5 s y 226 son reintentos en ráfaga.' },
    { fase: 'Interna',        area: 'Almacén, ventas, vigilancia',                              accion: 'Se marca extensión por extensión, sin grupos.',                                               resultado: '215 de 537 internas salientes (40%) y 175 de 520 entrantes (34%) sin contestar: el cliente espera mientras un vendedor busca a un compañero.' },
  ],

  comparativo: [
    { metrica: 'Devolución de llamadas perdidas', real: '33 de 486 (6.8%), mediana 27 min',           ideal: 'Tarea automática en GoHighLevel y devolución en menos de 30 min (meta 80%)' },
    { metrica: 'Perdidas nunca recuperadas',      real: '262 (53.9%), 157 de primer contacto',        ideal: 'Menos de 15%: ningún primer contacto se queda sin respuesta' },
    { metrica: 'Concentración de la recepción',   real: 'Dos personas atienden el 58% (sep–nov)',     ideal: 'Menos de 40%, con desborde por grupo y suplente nombrado' },
    { metrica: 'Horas de comida y cierre',        real: '15:00 al 13.6% anual · 17:00 al 12.3% en ago–nov', ideal: 'Menos de 6%: turnos escalonados y agente virtual tomando recado' },
    { metrica: 'Demanda entrante',                real: '14.9 por día hábil contra 31.6 del 1T (−53%)', ideal: 'Sin meta, pero atribuible: un número rastreable por campaña' },
    { metrica: 'Consumo del plan',                real: '9.6% del plan AV Visibilidad y Control',     ideal: 'Uso que justifique el MRR: tablero semanal, grupos y medición del AV' },
    { metrica: 'Conexión saliente',               real: '62.1% de 1,000, con una persona haciendo el 51.6%', ideal: '70%, con regla de timbrado de 25 s y una segunda persona marcando' },
    { metrica: 'Llamadas internas',               real: '34%–40% sin contestar',                      ideal: 'Menos de 15% con grupos internos en lugar de extensiones personales' },
    { metrica: 'Resultado del menú y del AV',     real: '850 llamadas (16%) sin resultado registrado', ideal: 'Motivo, resultado y transferencia registrados en cada llamada' },
    { metrica: 'Catálogo de destinos y números',  real: '65 destinos, nombres duplicados, 6 números en desuso', ideal: 'Grupos claros y catálogo depurado con el esquema sin zonas' },
  ],

  plan_inmediato: [
    { accion: 'Alerta de llamada perdida vía webhook hacia GoHighLevel, con tarea y dueño, devuelta en menos de 30 minutos.', responsable: 'Callpicker (Dan) + Pablo Prieto', criterio: 'Solo el 6.8% de las perdidas se devuelve y 157 primeros contactos se fueron sin respuesta.' },
    { accion: 'Desborde en cada grupo: 20 segundos sin contestar pasa al siguiente; si nadie contesta, el agente virtual toma los datos.', responsable: 'Callpicker (Dan) + Ricardo Barroso', criterio: 'El 58% de lo atendido en sep–nov cae en dos personas: hay que rediseñar el ruteo sin zonas.' },
    { accion: 'Confirmar quién sigue activo y sacar del ruteo o reasignar los destinos que no contestan, pidiendo antes la lista completa de los 65 destinos con sus perdidas.', responsable: 'Ricardo Barroso', criterio: 'Antolín Morales 100% de 29, Andrea Salazar 89% en sep–nov, Raúl Natera 41% de 73 — y el 20.8% de la pérdida está en destinos que el reporte no grafica.' },
    { accion: 'Enviar la lista de extensiones y destinos con nombres duplicados o en desuso para que Cargo Lift la valide.', responsable: 'Callpicker (Dan)', criterio: 'Los nombres partidos rompen los reportes y confunden a quien transfiere.' },
  ],

  plan_mediano: [
    { accion: 'Cobertura escalonada a las 15:00 y a las 17:00, con el agente virtual tomando recado después del cierre.', responsable: 'Cargo Lift (ventas)', criterio: '12.9% y 12.3% de pérdida en ago–nov contra cerca del 5% del resto del día.' },
    { accion: 'Respaldo nombrado y dado de alta para Verónica Pérez y María del Pilar Pérez.', responsable: 'Cargo Lift (ventas)', criterio: 'Dos personas sostienen la recepción; si una falta, se cae.' },
    { accion: 'Reglas de marcación: timbrar al menos 25 segundos, reintentar a las 2 horas y al día siguiente, bloque fuerte de 11:00 a 13:00, compartidas con Alfredo Basurto y una segunda persona.', responsable: 'Cargo Lift (ventas)', criterio: 'Mediana de timbrado de 14.5 s, 226 reintentos en ráfaga y una sola persona haciendo el 51.6% de las salientes.' },
    { accion: 'Grupos internos (almacén, ventas, vigilancia) en lugar de marcar persona por persona.', responsable: 'Callpicker (Dan)', criterio: 'Una de cada tres llamadas internas no se contesta y el cliente espera del otro lado.' },
  ],

  plan_estrategico: [
    { accion: 'Números rastreables por campaña, cruzados con GoHighLevel.', responsable: 'Callpicker (Dan) + Adrián', criterio: 'La demanda por día hábil cayó 53% y la caída empezó antes del cambio de agencia: sin atribución no se puede medir a la agencia nueva.' },
    { accion: 'Activar el registro de resultado del menú y del agente virtual y revisar 50 grabaciones.', responsable: 'Callpicker (Dan)', criterio: '850 llamadas (16%) terminan ahí y el archivo no registra ni su duración.' },
    { accion: 'Tablero semanal de perdidas por hora, día, destino y número, con su devolución, revisado cada lunes.', responsable: 'Callpicker (Dan)', criterio: 'Hoy nadie ve la pérdida a tiempo, y es el uso que justifica el plan de Visibilidad y Control que ya se factura.' },
    { accion: 'Responder las dos alertas abiertas de la cuenta —downgrade repetido y uso bajo— con un plan de consumo, no con un reporte de llamadas.', responsable: 'Dan Domínguez', criterio: 'Alerta CRÍTICA desde el 16 nov: seis meses de downgrade en 2026, $2,675 de MRR menos, y un plan usado al 9.6%.' },
  ],

  areas_oportunidad: [
    { area: 'Devolución automática de la llamada perdida',   impacto: 'Muy alto — 262 perdidas sin recuperar y 157 primeros contactos perdidos.',            responsable: 'Callpicker (Dan) + Pablo Prieto' },
    { area: 'Desborde y grupos de ventas',                   impacto: 'Muy alto — quita el punto único de falla sin contratar a nadie.',                     responsable: 'Callpicker (Dan)' },
    { area: 'Respuesta a las dos alertas abiertas',           impacto: 'Muy alto — es el riesgo de MRR, no el de tráfico: $2,675 ya perdidos en 2026.',       responsable: 'Dan Domínguez' },
    { area: 'Cobertura de comida y cierre',                  impacto: 'Alto — dos horas duplican la pérdida del resto del día.',                             responsable: 'Cargo Lift (ventas)' },
    { area: 'Atribución por campaña',                        impacto: 'Alto — sin ella la caída del 53% no se puede explicar ni corregir.',                   responsable: 'Callpicker (Dan) + Adrián' },
    { area: 'Medición del menú y del agente virtual',        impacto: 'Alto — 16% de las entrantes sin resultado registrado.',                               responsable: 'Callpicker (Dan)' },
    { area: 'Grupos internos',                               impacto: 'Medio-alto — una de cada tres internas sin contestar.',                               responsable: 'Callpicker (Dan)' },
    { area: 'Depuración de destinos y números',              impacto: 'Medio — reportes limpios y transferencias que no fallan.',                            responsable: 'Cargo Lift (Sistemas) / Callpicker' },
  ],

  perfiles: [
    {
      nombre: 'Ricardo Barroso',
      rol:    'Director — decisor y contacto principal',
      color:  '#6366f1',
      campos: [
        { label: 'Teléfono',    value: '55 5536 6542' },
        { label: 'Correo',      value: 'rbarroso@cargo-lift.com.mx' },
        { label: 'Suyas son',   value: 'Las decisiones de ruteo sin zonas, los turnos de comida y cierre, el respaldo de la recepción y qué destinos siguen activos.' },
        { label: 'Relevancia',  value: 'El mensaje para él: «su equipo contesta bien y la prueba es que la semana de más carga del año se atendió mejor que el promedio. El problema está en lo que pasa cuando nadie toma la llamada: 262 clientes llamaron, no les contestamos y nadie les devolvió — 157 de ellos llamaban por primera vez».' },
      ],
    },
    {
      nombre: 'Pablo Prieto Arrechea',
      rol:    'Consultor del cliente — el aliado técnico de la cuenta',
      color:  '#22c55e',
      campos: [
        { label: 'Contacto',    value: 'pprieto@factivo.com · 55 2955 3202' },
        { label: 'Por qué',     value: 'Entró en agosto de 2026 con usuario propio de Callpicker, revisó la plataforma, las APIs y Callpicker Chat, y el 17 de noviembre pidió él mismo la sesión de revisión del bot. Es quien puede hacer el webhook hacia GoHighLevel.' },
        { label: 'Pendiente',   value: 'Dar de alta dos números como bandejas de Callpicker Chat, coordinado con Soporte.' },
      ],
    },
    {
      nombre: 'Verónica Pérez y María del Pilar Pérez',
      rol:    'La recepción: 58% de lo contestado entre las dos (sep–nov)',
      color:  '#f59e0b',
      campos: [
        { label: 'Lo bueno',    value: 'Verónica atiende el 35.6% de lo contestado y pierde solo 2.3% de 577 llamadas: es el estándar de la cuenta, y su llegada en mayo es lo que cortó la pérdida a la mitad.' },
        { label: 'El riesgo',   value: 'María del Pilar atiende el 22.1% y acumula 95 perdidas, la cifra más alta en número de toda la cuenta (12.5% de 757). No es desempeño: es carga sin desborde.' },
        { label: 'Pendiente',   value: 'Designar suplente para cada una y darlo de alta en su grupo.' },
      ],
    },
    {
      nombre: 'Alfredo Basurto',
      rol:    'Prospección saliente — 516 de las 1,000 salientes (51.6%)',
      color:  '#6366f1',
      campos: [
        { label: 'Desde',       value: '8 de julio de 2026. Es quien cuadruplicó la marcación saliente.' },
        { label: 'El riesgo',   value: 'Si él falta, la prospección se detiene. Y cuelga pronto: la mediana de timbrado de las no conectadas es de 14.5 segundos, con 95 cortadas antes de 10.' },
        { label: 'Pendiente',   value: 'Compartir con él y con una segunda persona la regla de timbrado de 25 segundos y la cadencia de reintentos.' },
      ],
    },
    {
      nombre: 'Antolín Morales y Andrea Salazar',
      rol:    'Los dos destinos que no contestan',
      color:  '#ef4444',
      campos: [
        { label: 'Antolín',     value: '29 llamadas recibidas entre enero y febrero, 0 contestadas. 28 venían de un MISMO número que marcó 81 veces en el año: hay que identificar quién es ese contacto antes de cualquier otra cosa.' },
        { label: 'Andrea',      value: '20 perdidas de 41 en el año, y 16 de 18 entre septiembre y noviembre (89%). Es el foco rojo vigente, no histórico.' },
        { label: 'Pendiente',   value: 'Confirmar con Ricardo Barroso quién sigue activo y en qué grupo, y comprobar que los números de Raúl Natera y Óscar Godínez no sigan publicados.' },
      ],
    },
    {
      nombre: 'Dan Domínguez',
      rol:    'Asesor de cuenta — Callpicker',
      color:  '#22c55e',
      campos: [
        { label: 'Responsabilidad', value: 'Conducir la reunión con el marco correcto: reconocer la mejora de atención ANTES de recomendar, y llevar la conversación a la devolución de la llamada perdida, que es donde está el pedido.' },
        { label: 'Lo que no puede omitir', value: 'Las dos alertas abiertas. El reporte de tráfico no las menciona y son el riesgo de MRR: downgrade en seis meses de 2026 ($2,675) y un plan usado al 9.6%. Entrar a hablar solo de llamadas deja el riesgo comercial sin dueño.' },
        { label: 'Contexto del tono',      value: 'Entre el 16 de septiembre y el 17 de noviembre ningún contacto nuestro llegó al cliente: 62 días de silencio que escalaron a crítica. La relación se retomó el 17 por iniciativa de Pablo, dos días antes de esta auditoría.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'La atención mejoró de verdad: de 10.4% a 6.5% de pérdida, y desde junio ninguna semana pasa de 11%.',
      'Con el equipo completo la operación aguanta su pico: la semana de 217 llamadas perdió 8.3%, por debajo del promedio anual.',
      'El agente virtual no pierde llamadas (0 de 202) y ya está liberado con integración a GoHighLevel.',
      'Dos consultores del cliente —Pablo Prieto y Adrián— con usuarios propios y participación activa desde agosto de 2026.',
      '133 meses de relación, banda AAA, pagos al corriente y sin incidencias de pago ni tickets abiertos.',
    ],
    oportunidades: [
      'Devolución automática de la llamada perdida con lo que ya está contratado: webhook, GoHighLevel y agente virtual.',
      'Desborde y grupos: quita el punto único de falla sin contratar personal.',
      'Números rastreables por campaña para medir a la agencia nueva y explicar la caída del 53%.',
      'Subir el consumo del plan de Visibilidad y Control con el tablero semanal: es el uso que justifica el MRR que ya factura.',
    ],
    debilidades: [
      'El 6.8% de las perdidas se devuelve, con mediana de 27 minutos; el resto depende de que el cliente insista.',
      'Dos personas atienden el 58% de lo contestado y no hay suplente nombrado.',
      'Tres destinos pierden del 41% al 100% de lo que reciben, y el 20.8% de la pérdida vive en destinos que el reporte no grafica.',
      'El plan se usa al 9.6% y la cuenta lleva seis meses de 2026 bajando de nivel.',
      '850 llamadas (16%) terminan en el menú o el agente virtual sin resultado registrado: no se puede afirmar que se resolvieron.',
    ],
    amenazas: [
      '157 primeros contactos se perdieron sin devolución: en izaje y sujeción, ese prospecto compra con el siguiente proveedor que le contesta.',
      'Alerta CRÍTICA de downgrade abierta: si el consumo no sube, el próximo corte es otro recorte.',
      'Si la agencia nueva recupera la demanda y no hay desborde, la pérdida vuelve a los niveles de febrero.',
      'Seis números pueden seguir publicados en sitio, anuncios o facturas sin llegar a nadie.',
      'La prospección saliente depende de una sola persona.',
    ],
  },

  conclusion:
    'El reto de Cargo Lift no es contestar mejor: eso ya lo logró, y conviene decírselo antes de recomendar nada. El reto es que entra la mitad de la demanda y que casi nada de lo que se pierde se devuelve. ' +
    '262 llamadas perdidas nunca se recuperaron y 157 eran primeros contactos; esa cifra, no el 9.1% de pérdida, es lo que abre la conversación. ' +
    'La buena noticia es que las once propuestas del reporte se apoyan en lo que ya está contratado —webhook hacia GoHighLevel, desborde por grupo, agente virtual, números rastreables y el tablero de Visibilidad y Control—, así que la conversación es de configuración y disciplina, no de compra. ' +
    'Y hay una segunda conversación que el reporte de tráfico no cubre y que no puede quedarse sin dueño: la cuenta paga $18,953 al mes por un plan que usa al 9.6% y lleva seis meses de 2026 bajando de nivel, con una alerta crítica abierta desde el 16 de noviembre. ' +
    'Las dos se resuelven con lo mismo: que el teléfono vuelva a trabajar. Subir el consumo del plan y devolver las llamadas perdidas son el mismo proyecto visto desde dos lados.',

  pierde: [
    'Pedidos, no llamadas: 262 perdidas nunca recuperadas y 157 primeros contactos que no volvieron a marcar.',
    'La mitad de su demanda: de 31.6 a 14.9 llamadas por día hábil, con la caída empezando en mayo y sin atribución por campaña para explicarla.',
    'Dos horas al día: las 15:00 al 13.6% y las 17:00 al 12.3% en ago–nov, contra cerca del 5% del resto del día.',
    'Resiliencia: la recepción depende de dos personas y la prospección saliente de una.',
    'MRR propio: $2,675 menos en seis downgrades de 2026, sobre un plan que consume al 9.6%.',
    'Visibilidad: 850 llamadas (16%) terminan en el menú sin resultado registrado, y una quinta parte de la pérdida está en destinos que nadie grafica.',
  ],

  gana: [
    'Una regla de devolución automática que convierte 262 perdidas sin recuperar en tareas con dueño y plazo de 30 minutos.',
    'Desborde por grupo y suplente nombrado: ninguna llamada depende de que una persona esté en su lugar.',
    'Cobertura escalonada en comida y cierre, con el agente virtual —que no pierde una sola llamada— tomando recado.',
    'Atribución por campaña para medir a la agencia nueva con una cifra en lugar de una impresión.',
    'Un tablero semanal que hace visible la pérdida el lunes siguiente, y que es el uso que justifica el plan que ya paga.',
    'Resultado registrado del menú y del agente virtual: dejar de presumir lo que no está medido.',
  ],

  recomendacion_central:
    'Entrar reconociendo la mejora y cambiar la pregunta de la reunión: no «por qué se pierden llamadas» —ese número ya bajó a la mitad— sino «quién devuelve la que se perdió». ' +
    'El orden es el del reporte y va por impacto en ventas: primero recuperar lo que ya llega (alerta de perdida hacia GoHighLevel, desborde por grupo, sacar del ruteo lo que no contesta), después repartir la carga (suplentes, turnos de comida y cierre, reglas de marcación) y al final medir lo que hoy no se ve (números por campaña, resultado del menú y del AV, tablero semanal). ' +
    'Y llevar la segunda conversación en la misma sesión, sin esconderla: la cuenta paga $18,953 por un plan que usa al 9.6% y lleva seis meses bajando de nivel. No es una objeción a evitar, es el argumento: cada una de las once propuestas sube el uso de lo que ya factura. ' +
    'Guía hallazgo→solución: «perdimos 262 clientes y nadie los devolvió» → webhook de llamada perdida + GoHighLevel; «dos personas cargan la recepción» → desborde + suplente; «la comida y el cierre pierden el doble» → turnos escalonados + agente virtual; «no sabemos si la agencia nueva funciona» → número por campaña; «el plan se usa al 9.6%» → tablero semanal de Visibilidad y Control.',

  documentos: [
    {
      nombre:      'Auditoría de llamadas · Cargo Lift 2026',
      ruta:        '/auditorias/Auditoria-Cargo-Lift-2026.html',
      descripcion: 'Versión vigente. 2 ene – 17 nov 2026, SAC Callpicker. Tendencia mensual y semanal, mapa de calor por día y hora, pérdida por destino, recuperación de perdidas, marcación saliente, comunicación interna, 11 propuestas con dueño y plazo, y seis indicadores a 90 días. Lleva dentro, visibles, las correcciones y los límites de la conciliación del 19 nov 2026.',
    },
    {
      nombre:      'Reporte Ejecutivo · Cargo Lift — Análisis de Llamadas (ago 2026)',
      ruta:        '/docs/Reporte_Ejecutivo_Cargo_Lift_Analisis_Llamadas.docx',
      descripcion: 'SUPERSEDIDO por la auditoría de noviembre. 2 ene – 31 jul 2026. Clasificaba entrante/saliente por supuesto metodológico —los archivos no traían columna de dirección— y daba 43.4% de pérdida saliente, cifra que la medición de noviembre no sostiene. Se conserva como histórico; NO citarlo en la reunión.',
    },
  ],
}
