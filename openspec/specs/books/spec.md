# books Specification

## Purpose
Mantener el catálogo de libros: registrar, editar y eliminar libros, solo por usuarios con permiso.

## Requirements

### Requirement: Registro de libros
El sistema SHALL permitir a usuarios `librarian` o `admin` registrar un libro con ISBN, título, autor, género, año de publicación y descripción opcional (RF-10).

#### Scenario: Registro exitoso
- **GIVEN** un usuario autenticado con rol `librarian`
- **WHEN** envía `POST /api/books` con ISBN "9786073112878", título "Cien años de soledad", autor "Gabriel García Márquez", género "Novela" y año 1967
- **THEN** el sistema responde 201 con el libro creado, su `id` y `created_by` igual al id del bibliotecario

#### Scenario: Lector sin permiso
- **GIVEN** un usuario autenticado con rol `reader`
- **WHEN** envía `POST /api/books`
- **THEN** el sistema responde 403 con el mensaje "No tienes permiso para esta acción"

#### Scenario: Sin sesión
- **WHEN** se envía `POST /api/books` sin token
- **THEN** el sistema responde 401

#### Scenario: Datos obligatorios faltantes
- **WHEN** un bibliotecario envía un libro sin título o sin autor
- **THEN** el sistema responde 422 indicando el campo faltante

### Requirement: ISBN único y válido
El sistema MUST aceptar solo ISBN de 10 o 13 dígitos y MUST rechazar un ISBN ya registrado (BR-9).

#### Scenario: ISBN repetido
- **GIVEN** un libro con ISBN "9786073112878"
- **WHEN** un bibliotecario registra otro libro con el mismo ISBN
- **THEN** el sistema responde 409 con el mensaje "El ISBN ya está registrado"

#### Scenario: ISBN con formato inválido
- **WHEN** un bibliotecario envía el ISBN "12345"
- **THEN** el sistema responde 422 indicando que el ISBN debe tener 10 o 13 dígitos

### Requirement: Año de publicación válido
El sistema MUST aceptar solo años de publicación entre 1450 y el año actual (BR-10).

#### Scenario: Año en el futuro
- **WHEN** un bibliotecario registra un libro con un año mayor al actual
- **THEN** el sistema responde 422 con el mensaje "El año de publicación no es válido"

#### Scenario: Año límite válido
- **WHEN** un bibliotecario registra un libro del año 1450
- **THEN** el sistema responde 201

### Requirement: Autor del registro tomado del token
El sistema MUST asignar `created_by` con el id del usuario autenticado e ignorar cualquier `created_by` enviado en la petición (BR-11).

#### Scenario: Intento de suplantar al creador
- **GIVEN** un bibliotecario con id 5
- **WHEN** envía `POST /api/books` con `created_by` igual a 1
- **THEN** el libro se guarda con `created_by` igual a 5

### Requirement: Consulta de un libro
El sistema SHALL devolver un libro por su id a cualquier usuario autenticado (RF-10, apoyo de RF-16).

#### Scenario: Libro existente
- **GIVEN** un usuario autenticado con rol `reader`
- **WHEN** consulta `GET /api/books/{id}` de un libro existente
- **THEN** el sistema responde 200 con todos sus campos

#### Scenario: Libro inexistente
- **WHEN** se consulta `GET /api/books/9999`
- **THEN** el sistema responde 404 con el mensaje "Libro no encontrado"

### Requirement: Edición de libros
El sistema SHALL permitir a usuarios `librarian` o `admin` actualizar los datos de un libro, con las mismas validaciones del registro (RF-11, BR-9, BR-10).

#### Scenario: Edición exitosa
- **GIVEN** un libro existente y un usuario `admin`
- **WHEN** envía `PUT /api/books/{id}` con un nuevo género "Realismo mágico"
- **THEN** el sistema responde 200 con el libro actualizado y `updated_at` cambia

#### Scenario: Editar con un ISBN de otro libro
- **WHEN** un bibliotecario cambia el ISBN de un libro por uno que ya tiene otro libro
- **THEN** el sistema responde 409 con el mensaje "El ISBN ya está registrado"

#### Scenario: Libro inexistente
- **WHEN** un bibliotecario envía `PUT /api/books/9999`
- **THEN** el sistema responde 404

### Requirement: Eliminación de libros
El sistema SHALL permitir a usuarios `librarian` o `admin` eliminar un libro; la interfaz MUST pedir confirmación antes (RF-12).

#### Scenario: Eliminación exitosa
- **GIVEN** un libro existente y un usuario `librarian`
- **WHEN** envía `DELETE /api/books/{id}`
- **THEN** el sistema responde 204 y una consulta posterior del libro responde 404

#### Scenario: Lector intenta eliminar
- **GIVEN** un usuario con rol `reader`
- **WHEN** envía `DELETE /api/books/{id}`
- **THEN** el sistema responde 403 y el libro sigue existiendo

#### Scenario: Confirmación en la interfaz
- **WHEN** un bibliotecario pulsa "Eliminar" en un libro
- **THEN** la aplicación pregunta "¿Seguro que quieres eliminar este libro?" y solo lo elimina si confirma

### Requirement: Formulario de libro
El sistema SHALL ofrecer las páginas `/books/new` y `/books/:id/edit`, accesibles solo para `librarian` y `admin`, con las mismas validaciones del backend y mensajes en español (RF-10, RF-11, RNF-09).

#### Scenario: Validación en el formulario
- **WHEN** un bibliotecario intenta guardar el formulario con el ISBN "12345"
- **THEN** el formulario muestra "El ISBN debe tener 10 o 13 dígitos" y no envía la petición

#### Scenario: Error del servidor visible
- **WHEN** la API responde 409 al guardar
- **THEN** el formulario muestra el mensaje "El ISBN ya está registrado"
