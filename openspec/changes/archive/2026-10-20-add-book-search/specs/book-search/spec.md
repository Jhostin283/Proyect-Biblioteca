# Spec Delta

## Purpose
Permitir que cualquier usuario autenticado consulte el catálogo de libros de forma rápida: listado paginado, búsqueda, filtro y detalle.

## ADDED Requirements

### Requirement: Listado paginado del catálogo
El sistema SHALL devolver los libros ordenados por título en páginas, con `page` desde 1 y `size` entre 1 y 50 (por defecto 10), en el formato `{items, total, page, size}` (RF-13, BR-12).

#### Scenario: Primera página por defecto
- **GIVEN** 25 libros registrados y un usuario autenticado
- **WHEN** consulta `GET /api/books`
- **THEN** el sistema responde 200 con 10 `items`, `total` igual a 25, `page` igual a 1 y `size` igual a 10

#### Scenario: Última página
- **GIVEN** 25 libros registrados
- **WHEN** se consulta `GET /api/books?page=3&size=10`
- **THEN** la respuesta tiene 5 `items`

#### Scenario: Tamaño de página fuera de rango
- **WHEN** se consulta `GET /api/books?size=100`
- **THEN** el sistema responde 422

#### Scenario: Sin sesión
- **WHEN** se consulta `GET /api/books` sin token
- **THEN** el sistema responde 401

### Requirement: Búsqueda por título o autor
El sistema SHALL filtrar los libros cuyo título o autor contenga el texto `q`, sin distinguir mayúsculas de minúsculas (RF-14).

#### Scenario: Búsqueda por autor
- **GIVEN** libros de "Gabriel García Márquez" y de "Isabel Allende"
- **WHEN** se consulta `GET /api/books?q=garcía`
- **THEN** solo aparecen los libros de "Gabriel García Márquez"

#### Scenario: Sin resultados
- **WHEN** se busca un texto que no coincide con ningún libro
- **THEN** el sistema responde 200 con `items` vacío y `total` igual a 0

### Requirement: Filtro por género
El sistema SHALL filtrar por género exacto y ofrecer la lista de géneros existentes en `GET /api/books/genres` (RF-15).

#### Scenario: Filtrar y buscar a la vez
- **GIVEN** libros de los géneros "Novela" y "Poesía"
- **WHEN** se consulta `GET /api/books?genre=Poesía&q=neruda`
- **THEN** solo aparecen libros de poesía cuyo título o autor contiene "neruda"

#### Scenario: Lista de géneros
- **WHEN** un usuario autenticado consulta `GET /api/books/genres`
- **THEN** recibe los géneros existentes, sin repetir y en orden alfabético

### Requirement: Rendimiento del catálogo
El sistema SHALL responder el listado y la búsqueda en menos de 1 segundo con 1000 libros registrados (RNF-07).

#### Scenario: Catálogo con 1000 libros
- **GIVEN** 1000 libros registrados en PostgreSQL
- **WHEN** se consulta `GET /api/books?q=a&page=1&size=50`
- **THEN** la respuesta llega en menos de 1 segundo

### Requirement: Páginas de catálogo y detalle
El sistema SHALL ofrecer `/books` con buscador, filtro por género y paginación, y `/books/:id` con el detalle; las acciones de escritura MUST mostrarse solo a `librarian` y `admin` (RF-13 a RF-16, RNF-09).

#### Scenario: Lector navega el catálogo
- **GIVEN** un usuario con rol `reader` en `/books`
- **WHEN** escribe en el buscador y elige un género
- **THEN** la tabla se actualiza con los resultados y no se muestran los botones "Nuevo libro", "Editar" ni "Eliminar"

#### Scenario: Bibliotecario ve las acciones
- **GIVEN** un usuario con rol `librarian` en `/books`
- **THEN** ve los botones "Nuevo libro", "Editar" y "Eliminar"

#### Scenario: Catálogo vacío
- **WHEN** la búsqueda no devuelve libros
- **THEN** la página muestra "No se encontraron libros"

#### Scenario: Detalle inexistente
- **WHEN** un usuario abre `/books/9999`
- **THEN** la página muestra "Libro no encontrado" y un enlace para volver al catálogo
