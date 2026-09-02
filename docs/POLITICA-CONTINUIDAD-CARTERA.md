# Política de continuidad de cartera, downgrade y cancelación

**Origen:** dirección, 1 Sep 2026. Documento normativo — implementación a partir del 2 Sep 2026.
**Objetivo:** alinear el trabajo de los tres KAM en gestión preventiva, retención y recuperación de facturación.

> Este archivo conserva la especificación **tal como fue entregada**. El análisis técnico, los
> conflictos detectados contra el sistema actual y las propuestas de mejora viven en
> [`ANALISIS-CONTINUIDAD.md`](./ANALISIS-CONTINUIDAD.md), para no mezclar la norma con la lectura
> de implementación.

---

## RESPONSABILIDAD DE CARTERA, DOWNGRADE Y CANCELACIÓN

El KAM/asesor asignado es responsable de la gestión preventiva, la continuidad, la retención, la adopción, el crecimiento y la documentación de las cuentas de su cartera.

Esta responsabilidad no significa que el KAM/asesor sea automáticamente culpable de toda cancelación, downgrade o pérdida de facturación. Existen causas no controlables por el equipo, como cierre real del negocio del cliente, cambios regulatorios, fuerza mayor, desaparición de una unidad operativa, decisiones corporativas externas o reducción comprobada de operación del cliente.

Sin embargo, toda reducción de facturación, pérdida de categoría, downgrade o cancelación debe ser gestionada y documentada como un evento de cartera. La ausencia de acciones preventivas, el seguimiento fuera de cadencia, la falta de datos críticos, la ausencia de una relación con decisores o la falta de documentación sí representan una omisión de gestión que debe ser visible para el responsable y para la dirección.

**Principio central:**

> "El trabajo del KAM/SAC no termina al registrar una baja. Su responsabilidad es anticipar riesgos, ejecutar acciones preventivas, documentar evidencia, contener la pérdida cuando sea posible y trabajar un plan de recuperación de facturación."

---

## DEFINICIONES DE EVENTOS

1. **Riesgo de cancelación:** existe evidencia de posible baja, solicitud de cancelación, inconformidad grave, falta de pago, pérdida de valor, baja de adopción, cambio de proveedor o reducción relevante de operación.
2. **Proceso de cancelación:** el cliente ha expresado o iniciado formalmente una solicitud de baja, suspensión, no continuidad o cierre de servicios, pero la cancelación aún no se ha ejecutado definitivamente.
3. **Cancelación confirmada:** la baja está confirmada conforme al proceso operativo/financiero de Callpicker y existe una fecha efectiva de cancelación.
4. **Riesgo de downgrade:** existen señales de intención o probabilidad de reducir licencias, líneas, canales, consumo, servicios, sedes, usuarios o facturación.
5. **Downgrade en proceso:** el cliente ha solicitado o se está evaluando formalmente una reducción de servicios, consumo, usuarios, líneas o facturación.
6. **Downgrade confirmado:** la reducción ha sido aprobada y/o aplicada. Debe registrar importe, servicio afectado, fecha efectiva y razón.
7. **Cambio de categoría:** una cuenta puede cambiar de AAA a Enterprise, Mid-market o SMB por disminución real y confirmada de facturación, tamaño, potencial, uso o relevancia estratégica.

Un KAM/asesor **no puede reclasificar unilateralmente** una cuenta como "ya no AAA" para ocultar, normalizar o disminuir la atención sobre una caída de facturación, riesgo de churn, downgrade o deterioro de relación.

Toda reclasificación por disminución debe:
- Estar respaldada por datos verificables.
- Mostrar valor anterior y valor posterior.
- Indicar motivo de cambio.
- Conservar historial de categoría.
- Registrar si existe downgrade, cancelación, reducción de consumo o cambio estructural del cliente.
- Incluir revisión y aprobación del líder asignado o Dirección, según la política interna.
- Generar automáticamente una tarea de análisis de pérdida y plan de recuperación.

---

## ESTADOS DE CONTINUIDAD DE CUENTA

El Dashboard debe tener un campo de estado **independiente** del semáforo de salud y de la completitud del expediente:

- Activa
- Activa con riesgo de cancelación
- En proceso de cancelación
- Cancelada
- Activa con riesgo de downgrade
- En proceso de downgrade
- Downgrade confirmado
- Suspendida por facturación o proceso operativo
- Inactiva / sin consumo por validar
- Reactivada
- Migrada o consolidada con otra cuenta
- Cerrada por causa externa comprobada

**Reglas:**
1. El estado de continuidad nunca debe sobrescribir el historial de salud, expedientes, acciones o facturación.
2. Un cambio de estado debe registrar fecha, usuario responsable, motivo, evidencia y comentario de auditoría.
3. Las cuentas "En proceso de cancelación" y "En proceso de downgrade" deben conservarse en las vistas de riesgo y de actividades SAC hasta que exista resolución final.
4. Las cuentas canceladas no deben desaparecer del Dashboard. Deben quedar en una vista histórica de cancelaciones, análisis de churn y recuperación de ingresos.
5. Las cuentas canceladas o downgraded deben permanecer asociadas al KAM/asesor responsable durante el periodo de análisis definido por la empresa, aunque posteriormente cambien de estatus.
6. Si la cuenta es reactivada, se debe crear un evento de recuperación, conservar el evento previo y abrir un nuevo plan de adopción/retención.
7. Ningún usuario puede cambiar el estado a "Cancelada", "Downgrade confirmado" o "Cerrada por causa externa comprobada" sin proporcionar la información obligatoria.

---

## BOTÓN DE CAMBIO DE ESTATUS

El Dashboard debe incluir un botón visible, con permisos controlados, llamado **"Solicitar cambio de estatus"**.

No usar un botón directo que permita borrar o cerrar una cuenta sin trazabilidad.

Al presionar el botón, el sistema debe mostrar un formulario obligatorio y crear una solicitud auditable. Los cambios sensibles —Cancelada, Downgrade confirmado, Reclasificación AAA, Cerrada por causa externa— deben requerir revisión o aprobación del líder/administrador designado, salvo que la política interna autorice un flujo distinto.

**Estados disponibles en el botón:** Activa con riesgo de cancelación · En proceso de cancelación · Cancelada · Activa con riesgo de downgrade · En proceso de downgrade · Downgrade confirmado · Suspendida · Reactivada · Migrada/consolidada · Cerrada por causa externa comprobada · Solicitud de reclasificación de segmento.

---

## FORMULARIO OBLIGATORIO PARA CAMBIO DE ESTATUS

### A. Datos del evento
Cuenta · KAM/asesor responsable · Fecha de solicitud · Estado actual · Nuevo estado solicitado · Fecha efectiva o estimada · MRR/ARR o rango anterior · MRR/ARR o rango posterior esperado · Monto de MRR/ARR afectado · Servicios, líneas, licencias, sedes o canales afectados · Segmento anterior · Segmento propuesto, si aplica.

### B. Motivo y evidencia
Motivo principal con catálogo obligatorio · Motivos secundarios, si aplica · Descripción concreta del cliente o situación · Fuente de la información (correo, llamada, WhatsApp, ticket, reunión, factura, reporte de uso, confirmación interna u otra) · Evidencia o referencia interna · Estado de certeza (confirmado, probable o pendiente de validar) · Competidor mencionado, si aplica · Fecha en la que se detectó el riesgo · Fecha en la que el cliente comunicó la decisión, si aplica.

### C. Gestión preventiva ejecutada
- ¿Existió señal de riesgo previa? Sí / No / Desconocido.
- Si sí: fecha de primera señal de riesgo.
- Tipo de señal: baja adopción, reducción de uso, tickets, deuda, queja, falta de contacto, cambio de decisor, competidor, solicitud explícita, reducción operativa u otra.
- ¿El Dashboard generó actividad preventiva? Sí / No / No aplica / Desconocido.
- Actividades preventivas realizadas (seleccionar y describir): contacto proactivo · reunión de diagnóstico · revisión de uso/adopción · capacitación · revisión de configuración · gestión de ticket/incidencia · escalamiento a soporte · escalamiento a producto/desarrollo · escalamiento a finanzas · escalamiento a Dirección General · revisión ejecutiva/QBR · plan de recuperación · estrategia de continuidad · ninguna.
- Fecha de cada acción · Resultado de cada acción · Evidencia de ejecución · Compromisos acordados con cliente o áreas internas · Acciones pendientes y responsables · Razón documentada si no se ejecutó acción preventiva.

### D. Clasificación de causa
Catálogo estandarizado:

1. Falta de adopción o valor percibido
2. Incidencia técnica o calidad de servicio
3. Integración o funcionalidad no disponible
4. Precio, presupuesto o restricción financiera
5. Deuda, facturación o proceso de cobro
6. Cambio a competidor
7. Cambio de decisor, patrocinador o administración
8. Cierre/reducción real del negocio del cliente
9. Consolidación de proveedores o cambio corporativo
10. Reducción de sedes, agentes, líneas o demanda
11. Cambio de estrategia del cliente
12. Servicio contratado no alineado a la necesidad
13. Falta de seguimiento o relación insuficiente
14. Implementación, configuración o capacitación insuficiente
15. Causa externa comprobada
16. Otro, con descripción obligatoria

**Reglas:**
- Se puede seleccionar más de una causa; debe existir una causa principal.
- "Causa externa comprobada" requiere evidencia documental.
- "Falta de seguimiento o relación insuficiente", "Implementación/configuración/capacitación insuficiente" o "Falta de adopción" generan automáticamente revisión de proceso y plan correctivo.
- Si la causa se desconoce, el estatus máximo permitido es "En proceso de cancelación" o "En proceso de downgrade"; **no** autorizar cancelación definitiva con causa "desconocida".

### E. Plan de recuperación de facturación
Obligatorio para todo downgrade o cancelación que afecte facturación.

Campos: monto de MRR/ARR perdido o en riesgo · objetivo de recuperación · plazo objetivo · estrategia primaria (recuperar la misma cuenta / reactivar servicio o cuenta / recuperar mediante expansión de otra cuenta asignada / recuperar mediante oportunidad nueva asignada / recuperación parcial planificada / no recuperable con justificación y aprobación) · cuentas u oportunidades candidatas · servicios o necesidades a explorar · evidencia de necesidad verificable · actividades concretas de recuperación · responsable · fecha de primer avance · indicadores de avance · dependencias y VoBo requerido · riesgos del plan.

**Reglas:**
1. El plan no debe presentar al cliente promociones, descuentos, créditos, precios o condiciones no aprobadas.
2. Un plan no puede consistir únicamente en "buscar nuevos clientes" o "dar seguimiento". Debe incluir cuentas, oportunidades, necesidades, fechas y acciones.
3. Si no existen oportunidades elegibles, registrar "Pipeline de recuperación por construir" y generar una actividad P1/P2 para identificar oportunidades dentro de la cartera asignada.
4. Si la pérdida es por causa externa comprobada y no es recuperable dentro de la cuenta, registrar una alternativa de compensación de cartera o solicitar excepción documentada.
5. Dirección General aprueba cualquier clasificación de "no recuperable" cuando el monto o segmento supere el umbral definido.
6. La cancelación no se considera operativamente cerrada hasta contar con el análisis de pérdida y el plan de recuperación, salvo corrección administrativa autorizada.

---

## REGLAS DE RESPONSABILIDAD Y EVALUACIÓN

El Dashboard debe evaluar la **calidad de gestión** del KAM/asesor, no solo el resultado final de facturación.

**Indicadores de responsabilidad preventiva:** % de cuentas con seguimiento dentro de cadencia · % con expediente SAC completo · % con adopción revisada dentro de vigencia · % de riesgos detectados antes de la solicitud explícita de baja · tiempo entre primera señal de riesgo y primera acción SAC · % de compromisos cumplidos en fecha · % de cancelaciones/downgrades con acciones preventivas documentadas · % de eventos con causa raíz clasificada y evidencia · % de pérdidas con plan de recuperación activo · MRR/ARR en riesgo, perdido, recuperado y pendiente · tiempo de recuperación del monto perdido · evolución de salud antes y después de intervención SAC · % de cuentas AAA/Enterprise con mapa de decisores completo · % de cancelaciones por causa externa comprobada versus prevenibles.

**El Dashboard debe diferenciar claramente:**

**A. Baja inevitable o no controlable documentada** — evidencia de cierre de negocio, consolidación corporativa o causa externa; existen actividades preventivas o justificación válida de por qué no aplicaban; hay análisis de pérdida y plan de compensación/recuperación si procede.

**B. Baja potencialmente prevenible** — había señales previas y no se actuó; actividades SAC vencidas o no ejecutadas; sin contacto con decisor o administrador; sin revisión de adopción, tickets, facturación o relación; expediente incompleto sin acciones de actualización; compromisos incumplidos o falta de escalamiento; causa relacionada con adopción, capacitación, relación, configuración, seguimiento o experiencia sin evidencia de intervención oportuna.

**C. Baja en evaluación** — aún no hay evidencia suficiente; queda en análisis hasta documentar causa, señales, acciones y evidencia.

**Nunca usar "culpa" como etiqueta automática.** Usar: gestión preventiva documentada · gestión preventiva parcial · gestión preventiva insuficiente · causa externa comprobada · en evaluación.

---

## REGLAS ESPECIALES PARA CUENTAS AAA

Las cuentas AAA mantienen prioridad estratégica mientras estén asignadas y activas, **incluso si existe una solicitud de downgrade, cancelación o una disminución inicial de facturación**.

1. La clasificación AAA no se elimina automáticamente cuando la cuenta entra en riesgo.
2. Toda cuenta AAA con riesgo de cancelación o downgrade queda automáticamente en prioridad **P0 o P1**, según impacto y urgencia.
3. La propuesta de reclasificación de AAA requiere: valor histórico y actual · evidencia de reducción estructural, no percepción del asesor · explicación de si es temporal, reversible o definitiva · historial de señales y acciones preventivas · plan de recuperación de monto · aprobación de líder o Dirección.
4. Si una cuenta AAA cancela o hace downgrade, se mantiene en la vista "AAA histórico / pérdida de cartera" durante el periodo de análisis definido.
5. La reclasificación no cancela las actividades de recuperación ni elimina la obligación de documentar preventivas.
6. Si una cuenta AAA reduce facturación, el sistema crea automáticamente: actividad P1 de análisis de causa raíz · P1 de plan de recuperación · P1 de revisión de relación con decisores · P1 de revisión de adopción y valor si sigue activa · solicitud de revisión con líder/Dirección si supera umbral.
7. Ningún asesor puede usar una reclasificación para cerrar el caso sin evidencia, aprobación y plan de recuperación.

---

## ACTIVIDADES AUTOMÁTICAS POR EVENTO

**Activa con riesgo de cancelación:**
- P1: validar causa, decisor, uso, tickets, facturación y acción inmediata.
- P1: contacto con decisor/equipo IT dentro de 1 a 3 días hábiles.
- P1: actualizar expediente SAC completo.
- P1: identificar alternativa de contención sin comprometer condiciones comerciales no aprobadas.

**En proceso de cancelación:**
- P0/P1: reunión de recuperación o confirmación de causa según urgencia.
- P1: análisis de causa raíz y evidencias.
- P1: validación de todas las acciones preventivas ejecutadas.
- P1: escalamiento a Dirección General si el segmento o monto lo amerita.
- P1: plan de recuperación de facturación.
- P1: registrar posible oportunidad de reactivación, si procede.

**Cancelada:**
- No cerrar automáticamente las actividades de riesgo.
- P1: cierre de análisis de churn.
- P1: validar acciones preventivas, compromisos y causa final.
- P1: activar plan de recuperación de monto.
- P2: capturar aprendizaje y acción correctiva de proceso.
- P2: definir fecha de recontacto para posible reactivación, si existe razón válida.
- Actualizar indicadores de MRR/ARR perdido, recuperable, recuperado y no recuperable.

**Activa con riesgo de downgrade:**
- P1: identificar servicio, monto, motivador y decisor.
- P1: revisar adopción, consumo, tickets y objetivos.
- P1: generar plan de contención.
- P1: solicitar VoBo de Dirección antes de cualquier condición especial.

**Downgrade confirmado:**
- P1: análisis del monto reducido, servicio afectado y causa final.
- P1: validar oportunidades de recuperación dentro de la misma cuenta.
- P1: crear plan de recuperación de facturación.
- P2: evaluar reclasificación de segmento con aprobación, si aplica.
- P2: seguimiento post-downgrade para evitar una cancelación posterior.

**Solicitud de reclasificación AAA:**
- P1: validar reducción real y comparativo histórico.
- P1: comprobar acciones preventivas efectuadas.
- P1: registrar plan de recuperación.
- Crear solicitud de aprobación a líder/Dirección.
- Mantener estatus AAA histórico hasta resolución.

---

## TABLEROS DE RETENCIÓN Y RESPONSABILIDAD

**1. Cancelaciones y downgrades en proceso**
Cuenta · segmento actual e histórico · KAM responsable · estado de continuidad · semáforo de salud · monto en riesgo/perdido · servicios afectados · causa principal · fecha de primera señal · fecha de solicitud del cliente · acciones preventivas ejecutadas · última actividad · próxima actividad · plan de recuperación · revisión/aprobación requerida.

**2. Recuperación de facturación**
KAM · MRR/ARR perdido · en riesgo · recuperable · recuperado · pendiente de recuperar · cuentas fuente de pérdida · oportunidades/cuentas objetivo · fecha objetivo · avance · bloqueadores · aprobaciones pendientes.

**3. Evaluación de prevención por KAM**
KAM · cuentas asignadas · con expediente completo · sin seguimiento en cadencia · riesgos identificados antes de una solicitud de baja · actividades preventivas vencidas · cancelaciones/downgrades con prevención documentada · con prevención insuficiente · MRR/ARR perdido · recuperado · pendiente · tiempo promedio de primera acción ante riesgo · cumplimiento de planes de recuperación.

**4. AAA histórico y cambios de segmento**
Cuenta · segmento anterior · segmento actual/propuesto · valor anterior · valor actual · diferencia · motivo · estado de continuidad · acciones preventivas · plan de recuperación · responsable · aprobador · fecha de cambio.
