# Spec Delta

## Purpose
Dar a todas las vistas de la aplicación un lenguaje visual común, profesional, responsive y accesible, sin cambiar
el comportamiento funcional ni la lógica existente.

## ADDED Requirements

### Requirement: Sistema de diseño compartido
La aplicación SHALL definir en un único lugar los tokens visuales (color, tipografía, espaciado, radios y sombras)
y los componentes base (botón, campo, tarjeta, tabla, alerta e insignia de rol) que usan todas las vistas (RNF-09).

#### Scenario: Tokens en un solo lugar
- **WHEN** se revisa `frontend/src/styles.css`
- **THEN** los colores, la tipografía y los espaciados están declarados como variables en `:root` y las vistas los consumen

#### Scenario: Estilo fuera de los tokens
- **GIVEN** una vista que usa un color hexadecimal distinto de los tokens
- **WHEN** se ejecuta la revisión de estilos del cambio
- **THEN** la revisión lo señala y la vista se corrige antes de integrar

#### Scenario: Componente base reutilizado
- **WHEN** se comparan los botones de login, catálogo y usuarios
- **THEN** comparten la misma clase base y solo cambian sus variantes (primario, secundario, peligro)

### Requirement: Diseño responsive
Todas las vistas SHALL ser usables entre 360 px y 1280 px de ancho, sin scroll horizontal ni contenido cortado (RNF-09).

#### Scenario: Vista en móvil
- **WHEN** se abre `/books` en una ventana de 360 px
- **THEN** las tarjetas se apilan en una columna y el buscador y los filtros siguen siendo utilizables

#### Scenario: Vista en escritorio
- **WHEN** se abre `/books` en una ventana de 1280 px
- **THEN** el catálogo usa una rejilla de varias columnas y la barra de navegación no se solapa con el contenido

#### Scenario: Contenido desbordado
- **GIVEN** un título o un nombre de usuario muy largo
- **WHEN** se renderiza su tarjeta o fila de tabla
- **THEN** el texto se recorta o se parte en varias líneas sin provocar scroll horizontal

### Requirement: Accesibilidad de la interfaz
La interfaz SHALL cumplir contraste AA, foco visible en todos los controles, etiquetas asociadas a sus campos y
avisos anunciados con `aria-live` (RNF-09).

#### Scenario: Navegación con teclado
- **WHEN** se recorre el formulario de login solo con la tecla Tab
- **THEN** cada campo, botón y enlace muestra un anillo de foco visible en orden lógico

#### Scenario: Aviso de sesión
- **WHEN** el sistema muestra un aviso o un error de formulario
- **THEN** el mensaje se anuncia por `aria-live` y no depende solo del color

#### Scenario: Imagen sin texto alternativo
- **GIVEN** una portada o la ilustración de inicio
- **WHEN** se revisa el marcado
- **THEN** toda imagen informativa tiene `alt` descriptivo y las decorativas tienen `alt=""`

### Requirement: Página de inicio renovada
La página de inicio SHALL presentar una ilustración SVG local del sistema de biblioteca, el estado de la API y
accesos rápidos según el rol de la sesión (RNF-08).

#### Scenario: Visitante sin sesión
- **WHEN** un visitante abre `/`
- **THEN** ve la ilustración, el estado "API: ok" y los accesos para iniciar sesión o registrarse

#### Scenario: Usuario autenticado
- **GIVEN** un usuario `librarian` con sesión iniciada
- **WHEN** abre `/`
- **THEN** además ve accesos a "Ver catálogo" y "Registrar libro", que no aparecen para un `reader`

#### Scenario: API caída
- **WHEN** `GET /api/health` falla
- **THEN** la tarjeta de estado muestra "API: sin conexión" con el estilo de error y la ilustración sigue visible

### Requirement: Estados de carga, vacío y error consistentes
Las vistas SHALL mostrar los estados de carga, lista vacía y error con el mismo patrón visual y los mismos textos
en español (RNF-09).

#### Scenario: Catálogo vacío
- **GIVEN** un catálogo sin libros
- **WHEN** se abre `/books`
- **THEN** se muestra un estado vacío con un mensaje y una acción para registrar el primer libro si el rol lo permite

#### Scenario: Error al cargar
- **WHEN** `GET /api/books` responde con un error
- **THEN** se muestra el mensaje del backend en una alerta con acción de reintento

#### Scenario: Carga en curso
- **WHEN** una vista está esperando datos
- **THEN** muestra un esqueleto o indicador de carga con la misma altura que el contenido final, sin saltos de diseño
