# Spec Delta

## Purpose
Mostrar la portada de cada libro en el catálogo, el detalle y el formulario, resolviéndola en el navegador a partir
del ISBN con la API pública de Open Library, sin tocar la API ni la base de datos.

## ADDED Requirements

### Requirement: Portada del libro por ISBN
La interfaz SHALL mostrar la portada de cada libro en el catálogo y en su detalle, resolviéndola en el navegador
desde `https://covers.openlibrary.org/b/isbn/<isbn>-L.jpg` con el ISBN que ya devuelve la API (RF-16, RNF-07).

#### Scenario: Portada disponible
- **GIVEN** un libro con ISBN "9780306406157" que tiene portada en Open Library
- **WHEN** un usuario autenticado abre `/books` o `/books/{id}`
- **THEN** se muestra la portada del libro con un texto alternativo que incluye su título

#### Scenario: Libro sin portada
- **GIVEN** un libro cuyo ISBN no tiene imagen en Open Library
- **WHEN** el navegador recibe la imagen de relleno o un error de la API externa
- **THEN** se muestra un marcador local con las iniciales del título y el nombre del autor, sin iconos de imagen rota

#### Scenario: Open Library no responde
- **WHEN** la petición de la portada falla por red o por tiempo de espera
- **THEN** la tarjeta del libro se sigue viendo completa con el marcador local y el catálogo no muestra errores

#### Scenario: Catálogo con mil libros
- **GIVEN** un catálogo de 1 000 libros
- **WHEN** el usuario abre `/books`
- **THEN** las portadas se cargan de forma diferida y el listado aparece en menos de 1 segundo (RNF-07)

### Requirement: Vista previa de la portada en el formulario
El formulario de alta y edición SHALL mostrar la vista previa de la portada a partir del ISBN escrito, sin enviar
peticiones al backend ni bloquear el guardado (RF-10, RF-11).

#### Scenario: ISBN completo en el formulario
- **GIVEN** un bibliotecario en `/books/new`
- **WHEN** escribe un ISBN de 10 o 13 dígitos
- **THEN** el formulario muestra la vista previa de la portada de ese ISBN

#### Scenario: ISBN incompleto
- **WHEN** el campo de ISBN tiene menos de 10 dígitos o un formato inválido
- **THEN** el formulario no pide ninguna imagen y muestra el marcador local en lugar de una imagen rota

#### Scenario: Error del servidor visible
- **WHEN** la API responde 409 al guardar un libro
- **THEN** el formulario sigue mostrando "El ISBN ya está registrado" con el nuevo estilo de alerta
