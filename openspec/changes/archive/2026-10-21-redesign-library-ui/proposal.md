# Proposal: rediseño profesional de la interfaz y portadas de libros

## Why
El catálogo ya funciona (RF-13 a RF-16), pero la interfaz es funcional y plana: no hay jerarquía visual, cada vista
improvisa sus estilos y los libros no tienen portada. El alta y la edición (RF-10, RF-11) tampoco dan contexto visual
del libro que se está registrando. Esto resta valor a la demo y no cubre RNF-07 (respuesta < 1 s con 1 000 libros)
si las portadas se resuelven de forma ingenua.

Las portadas y la API externa no están en `docs/PRODUCT.md` (la línea 211 excluye "subida de portadas"). El usuario
aprobó en esta sesión usar **Open Library** sin persistencia: la portada se resuelve en el navegador a partir del
ISBN, sin columna nueva, sin migración y sin lógica de negocio adicional (BR-9 a BR-12 no cambian).

**Máquina dueña:** dev-b (frontend y gestión de libros). Archivos compartidos: `frontend/src/styles.css`,
`frontend/src/index.html` y `frontend/src/app/app.component.ts`.

## What Changes
- **Sistema de diseño**: tokens (color, tipografía, espaciado, radios, sombras), tipografía con escala clara y
  componentes base (botones, campos, tarjetas, tablas, alertas, insignias de rol) usados por las ocho vistas.
- **Portada por ISBN**: nuevo componente compartido `BookCover` que pide la imagen a Open Library
  (`covers.openlibrary.org/b/isbn/<isbn>-L.jpg`), con carga diferida y un placeholder local cuando no hay portada.
  Se usa en catálogo, detalle y formulario (vista previa).
- **Inicio renovado**: ilustración SVG local del sistema de biblioteca, accesos rápidos según el rol y el estado
  de la API en una tarjeta destacada.
- **Vistas de autenticación y administración**: login, registro, perfil y usuarios con el mismo lenguaje visual y
  estados de carga, vacío y error consistentes.
- **Responsive y accesible**: usable de 360 px a 1280 px sin scroll horizontal; contraste AA, foco visible,
  etiquetas asociadas y avisos anunciados con `aria-live`.

### Fuera de alcance
- Subir portadas propias, guardar `cover_url` en la base de datos o cualquier migración de Alembic.
- Endpoints nuevos o cambios en el contrato de la API (`docs/PRODUCT.md` secciones 5 y 6).
- Autocompletar metadatos del libro desde Open Library (sería lógica nueva).
- Reglas de negocio, roles, permisos o cambios de infraestructura.
- Dependencias nuevas de frontend o frameworks de UI.
