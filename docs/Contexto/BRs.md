## Reglas de Negocio (BRs)
Las siguientes reglas rigen el comportamiento del sistema **Auto Record** y deben cumplirse para garantizar la integridad de los datos y la eficiencia del servicio:
* **BR-01:** Una unidad no puede iniciar una ruta si el chofer asignado no ha completado el registro de asistencia.
* **BR-02:** Solo los administradores pueden modificar los horarios preestablecidos de las rutas.
* **BR-03:** Una unidad de transporte no puede estar asignada a dos rutas diferentes simultáneamente.
* **BR-04:** Solo las unidades marcadas con el estado "Disponible" o "En Servicio" pueden aparecer en el mapa del Pasajero.
* **BR-05:** La aplicación del Chofer debe enviar coordenadas de ubicación al servidor cada 5 segundos para mantener la precisión del tiempo real.
* **BR-06:** Se considera un "retraso" cuando la unidad llega al punto del Checador con más de 5 minutos de diferencia respecto al horario programado.
* **BR-07:** Una vez que el Checador registra el paso de una unidad, el registro queda bloqueado para edición (solo lectura) para evitar manipulaciones de tiempos.
* **BR-08:** Los Choferes y Checadores no tienen permisos para crear nuevas rutas o modificar las existentes; esta función es exclusiva del Administrador.
* **BR-09:** Si una unidad permanece inmóvil por más de 30 minutos sin un reporte de incidencia, el sistema notificará al Administrador para verificar el estado de la unidad.