## API del Sistema

<div align="justify">
Auto-Record integra una **API propia desarrollada con Node.js y Express**, la cual permite gestionar la información operativa del sistema mediante una arquitectura REST. Esta API facilita la comunicación entre el backend y la interfaz web, permitiendo consultar, registrar, actualizar y eliminar incidencias de manera eficiente.

La API está conectada a una base de datos MySQL, lo que garantiza la persistencia de la información y la integridad de los datos registrados. Además, fue diseñada pensando en la escalabilidad, permitiendo su uso futuro en aplicaciones móviles u otros sistemas externos.

Un aspecto importante de esta API es que automatiza ciertos procesos, como la obtención de la ruta y el chofer a partir del ID de la unidad, reduciendo errores humanos y simplificando el registro de información.

---

## Características de la API

- Arquitectura REST
- Métodos HTTP (GET, POST, PATCH, DELETE)
- Respuestas en formato JSON
- Conexión a base de datos MySQL
- Automatización de datos (ruta y chofer a partir de unidad)
- Integración con el sistema Auto-Record
- Panel visual para pruebas en tiempo real

---

## Endpoints Disponibles

| Método  | Endpoint                      | Descripción                                      |
|--------|------------------------------|--------------------------------------------------|
| GET    | /api/incidencias             | Obtiene todas las incidencias                    |
| GET    | /api/incidencias/:id         | Obtiene una incidencia específica por ID         |
| POST   | /api/incidencias             | Crea una nueva incidencia                        |
| PATCH  | /api/incidencias/:id         | Actualiza el tipo de incidencia                  |
| DELETE | /api/incidencias/:id         | Elimina una incidencia                           |

---

## Ejemplo de Petición

### Crear incidencia

```json
{
  "id_unidad": 5,
  "tipo_incidencia": "Falla mecánica",
  "descripcion": "Llanta ponchada",
  "ubicacion": "Terminal Norte"
}

```
---

## Panel Visual de la Api

<div align="justify"> Para facilitar la interacción con la API, se desarrolló un panel visual accesible desde el sistema, el cual permite probar los endpoints sin necesidad de herramientas externas como Postman.

Este panel incluye un formulario dinámico donde el usuario puede seleccionar la acción que desea realizar (crear, actualizar o eliminar incidencias), adaptando automáticamente los campos necesarios para cada operación.

Además, muestra la respuesta del servidor en tiempo real en formato JSON, permitiendo una mejor comprensión del funcionamiento interno de la API.

---

## Beneficios

- Facilita la comunicación entre frontend y backend     
- Permite pruebas rápidas sin herramientas externas
- Reduce errores en el registro de datos
- Mejora la eficiencia del sistema
- Escalable para futuras integraciones