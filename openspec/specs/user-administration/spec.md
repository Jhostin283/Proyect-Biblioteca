# user-administration Specification

## Purpose
Permitir que el administrador gestione los roles y el estado de las cuentas de usuario.

## Requirements

### Requirement: Listado de usuarios
El sistema SHALL permitir a un `admin` listar usuarios paginados y buscarlos por email o nombre (RF-07).

#### Scenario: Admin busca usuarios
- **GIVEN** usuarios "Ana Pérez" y "Luis Soto" registrados
- **WHEN** un admin consulta `GET /api/users?q=ana`
- **THEN** el sistema responde 200 con `items` que contiene solo a "Ana Pérez", `total` igual a 1, `page` y `size`

#### Scenario: Usuario sin rol admin
- **GIVEN** un usuario con rol `librarian`
- **WHEN** consulta `GET /api/users`
- **THEN** el sistema responde 403

### Requirement: Cambio de rol
El sistema SHALL permitir a un `admin` cambiar el rol de otro usuario a `reader`, `librarian` o `admin` (RF-08).

#### Scenario: Promover a bibliotecario
- **GIVEN** un usuario con rol `reader`
- **WHEN** un admin envía `PATCH /api/users/{id}` con `role` igual a `librarian`
- **THEN** el sistema responde 200 y el usuario puede crear libros en su siguiente petición

#### Scenario: Rol inexistente
- **WHEN** un admin envía `role` igual a `superuser`
- **THEN** el sistema responde 422

#### Scenario: Usuario inexistente
- **WHEN** un admin envía `PATCH /api/users/9999`
- **THEN** el sistema responde 404 con el mensaje "Usuario no encontrado"

### Requirement: Activación y desactivación de cuentas
El sistema SHALL permitir a un `admin` activar o desactivar una cuenta; una cuenta desactivada no puede iniciar sesión ni usar sus tokens (RF-09, BR-6).

#### Scenario: Desactivar una cuenta
- **GIVEN** un usuario activo con sesión iniciada
- **WHEN** un admin envía `PATCH /api/users/{id}` con `is_active` igual a falso
- **THEN** el sistema responde 200 y la siguiente petición de ese usuario recibe 403 "La cuenta está desactivada"

#### Scenario: Reactivar una cuenta
- **GIVEN** un usuario desactivado
- **WHEN** un admin lo reactiva
- **THEN** el usuario puede volver a iniciar sesión

### Requirement: Protección del propio administrador
El sistema MUST impedir que un `admin` se quite su propio rol o se desactive a sí mismo (BR-7).

#### Scenario: Admin intenta degradarse
- **WHEN** un admin envía `PATCH /api/users/{su_propio_id}` con `role` igual a `reader`
- **THEN** el sistema responde 409 con el mensaje "No puedes quitarte tu propio rol de administrador"

#### Scenario: Admin intenta desactivarse
- **WHEN** un admin envía `is_active` igual a falso sobre su propia cuenta
- **THEN** el sistema responde 409 con el mensaje "No puedes desactivar tu propia cuenta"

### Requirement: Página de administración de usuarios
El sistema SHALL ofrecer la página `/users`, visible solo para `admin`, con tabla, buscador, selector de rol e interruptor de estado (RF-07 a RF-09, RNF-09).

#### Scenario: Cambiar rol desde la interfaz
- **GIVEN** un admin en `/users`
- **WHEN** cambia el rol de un usuario en el selector
- **THEN** la tabla muestra el nuevo rol y el mensaje "Rol actualizado"

#### Scenario: Error de la regla BR-7 en la interfaz
- **WHEN** el admin intenta desactivar su propia cuenta desde `/users`
- **THEN** la página muestra "No puedes desactivar tu propia cuenta" y el interruptor vuelve a su estado anterior
