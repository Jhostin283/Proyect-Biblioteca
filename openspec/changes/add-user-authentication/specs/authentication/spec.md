# Spec Delta

## Purpose
Permitir que las personas creen una cuenta, inicien sesión con un token JWT y consulten su perfil, de forma segura.

## ADDED Requirements

### Requirement: Registro de usuario
El sistema SHALL permitir registrar una cuenta con email, nombre completo y contraseña, y la cuenta SHALL nacer con rol `reader` (RF-01, BR-1, BR-2, BR-5).

#### Scenario: Registro exitoso
- **WHEN** un visitante envía `POST /api/auth/register` con un email nuevo, un nombre y la contraseña "Lectura2026"
- **THEN** el sistema responde 201 con `id`, `email`, `full_name` y `role` igual a `reader`
- **AND** la respuesta no incluye la contraseña ni su hash

#### Scenario: Email ya registrado
- **GIVEN** un usuario existente con el email "ana@correo.com"
- **WHEN** alguien intenta registrarse con "ana@correo.com"
- **THEN** el sistema responde 409 con el mensaje "El email ya está registrado"

#### Scenario: Contraseña débil
- **WHEN** un visitante se registra con la contraseña "12345678" (sin letras)
- **THEN** el sistema responde 422 indicando que la contraseña necesita al menos 8 caracteres, una letra y un número

#### Scenario: Intento de elegir el rol
- **WHEN** un visitante envía `role` igual a `admin` en el registro
- **THEN** el sistema ignora ese campo y la cuenta se crea con rol `reader`

### Requirement: Almacenamiento seguro de contraseñas
El sistema MUST guardar las contraseñas solo como hash argon2 y nunca devolverlas en ninguna respuesta de la API (BR-3, RNF-01).

#### Scenario: Hash en la base de datos
- **WHEN** se registra un usuario con la contraseña "Lectura2026"
- **THEN** la columna `hashed_password` no contiene "Lectura2026" y empieza con el prefijo de argon2

#### Scenario: Respuestas sin hash
- **WHEN** se consulta cualquier endpoint que devuelve usuarios
- **THEN** ninguna respuesta contiene los campos `password` ni `hashed_password`

### Requirement: Inicio de sesión con JWT
El sistema SHALL autenticar con email y contraseña y devolver un token JWT HS256 firmado con `JWT_SECRET` que vence a los 60 minutos (RF-02, BR-4).

#### Scenario: Credenciales correctas
- **GIVEN** un usuario activo registrado
- **WHEN** envía `POST /api/auth/login` con su email y contraseña
- **THEN** el sistema responde 200 con `access_token`, `token_type` igual a "bearer" y `expires_in` igual a 3600

#### Scenario: Credenciales incorrectas
- **WHEN** alguien inicia sesión con una contraseña incorrecta o un email inexistente
- **THEN** el sistema responde 401 con el mensaje "Email o contraseña incorrectos" (el mismo en ambos casos)

#### Scenario: Usuario inactivo
- **GIVEN** un usuario con `is_active` en falso
- **WHEN** inicia sesión con sus credenciales correctas
- **THEN** el sistema responde 403 con el mensaje "La cuenta está desactivada" (BR-6)

### Requirement: Perfil del usuario actual
El sistema SHALL devolver el perfil del usuario dueño del token en `GET /api/auth/me` (RF-03).

#### Scenario: Token válido
- **GIVEN** un usuario con sesión iniciada
- **WHEN** consulta `GET /api/auth/me` con `Authorization: Bearer <token>`
- **THEN** el sistema responde 200 con su `email`, `full_name`, `role` e `is_active`

#### Scenario: Sin token o token vencido
- **WHEN** se consulta `GET /api/auth/me` sin token o con un token vencido
- **THEN** el sistema responde 401 con el mensaje "No autenticado"

### Requirement: Administrador inicial
El sistema SHALL crear al arrancar un usuario `admin` con `ADMIN_EMAIL` y `ADMIN_PASSWORD` cuando no exista ningún admin, sin duplicarlo en arranques posteriores (RF-04, BR-8).

#### Scenario: Primer arranque
- **GIVEN** una base de datos sin usuarios admin y las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` definidas
- **WHEN** la API arranca
- **THEN** existe un usuario con ese email, rol `admin` y estado activo

#### Scenario: Arranques siguientes
- **GIVEN** que ya existe un admin
- **WHEN** la API se reinicia
- **THEN** no se crea ningún usuario nuevo

### Requirement: Pantallas de registro, inicio de sesión y perfil
El sistema SHALL ofrecer las páginas `/register`, `/login` y `/profile`, con textos y errores en español (RF-01 a RF-03, RNF-09).

#### Scenario: Inicio de sesión desde la interfaz
- **WHEN** el usuario completa el formulario de `/login` con credenciales correctas
- **THEN** el token se guarda en el navegador y la aplicación lo lleva a `/books`

#### Scenario: Error visible
- **WHEN** el usuario envía credenciales incorrectas en `/login`
- **THEN** la página muestra "Email o contraseña incorrectos" sin recargar
