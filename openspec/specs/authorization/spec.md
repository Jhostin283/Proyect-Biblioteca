# authorization Specification

## Purpose
Garantizar que cada operación del sistema solo la realicen usuarios autenticados con el rol permitido, en la API y en la interfaz.

## Requirements

### Requirement: Autenticación obligatoria en rutas protegidas
El sistema SHALL rechazar con 401 "No autenticado" cualquier ruta protegida que reciba una petición sin token, con un token mal firmado o con un token vencido (RF-05, BR-4).

#### Scenario: Petición sin token
- **WHEN** se llama a `GET /api/books` sin cabecera `Authorization`
- **THEN** el sistema responde 401 con el mensaje "No autenticado"

#### Scenario: Token alterado
- **WHEN** se llama a una ruta protegida con un token firmado con otro secreto
- **THEN** el sistema responde 401

#### Scenario: Token válido
- **GIVEN** un usuario activo con sesión iniciada
- **WHEN** llama a `GET /api/books` con su token
- **THEN** la petición se procesa normalmente

### Requirement: Autorización por rol
El sistema SHALL permitir cada operación solo a los roles de la tabla de permisos de docs/PRODUCT.md sección 3 y MUST responder 403 "No tienes permiso para esta acción" al resto (RF-05).

#### Scenario: Lector intenta crear un libro
- **GIVEN** un usuario con rol `reader`
- **WHEN** envía `POST /api/books`
- **THEN** el sistema responde 403 con el mensaje "No tienes permiso para esta acción"

#### Scenario: Bibliotecario crea un libro
- **GIVEN** un usuario con rol `librarian`
- **WHEN** envía `POST /api/books` con datos válidos
- **THEN** la autorización lo deja pasar

#### Scenario: Bibliotecario intenta administrar usuarios
- **GIVEN** un usuario con rol `librarian`
- **WHEN** consulta `GET /api/users`
- **THEN** el sistema responde 403

### Requirement: Tokens de usuarios desactivados
El sistema MUST rechazar con 403 "La cuenta está desactivada" los tokens de un usuario que fue desactivado después de iniciar sesión (BR-6).

#### Scenario: Usuario desactivado con token vigente
- **GIVEN** un usuario que inició sesión y luego fue desactivado por un admin
- **WHEN** usa su token todavía vigente
- **THEN** el sistema responde 403 con el mensaje "La cuenta está desactivada"

### Requirement: Control de acceso en la interfaz
El sistema SHALL proteger las rutas de Angular según la sesión y el rol, y mostrar solo las acciones permitidas (RF-06).

#### Scenario: Página protegida sin sesión
- **WHEN** un visitante sin sesión abre `/books`
- **THEN** la aplicación lo redirige a `/login`

#### Scenario: Página de rol sin permiso
- **GIVEN** un usuario con rol `reader`
- **WHEN** abre `/books/new` o `/users`
- **THEN** la aplicación lo redirige a `/books` y muestra "No tienes permiso para esta acción"

#### Scenario: Token vencido durante el uso
- **WHEN** la API responde 401 a cualquier petición de la aplicación
- **THEN** la aplicación borra la sesión y lleva al usuario a `/login` con el mensaje "Tu sesión expiró"

### Requirement: Cierre de sesión
El sistema SHALL permitir cerrar sesión desde la barra de navegación, eliminando el token guardado (RF-06).

#### Scenario: Cerrar sesión
- **GIVEN** un usuario con sesión iniciada
- **WHEN** pulsa "Cerrar sesión"
- **THEN** el token se elimina del navegador y la aplicación muestra `/login`

#### Scenario: Volver atrás después de cerrar sesión
- **GIVEN** un usuario que cerró sesión
- **WHEN** usa el botón "atrás" del navegador para volver a `/books`
- **THEN** la aplicación lo redirige a `/login`
