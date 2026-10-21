# Tasks

## 1. Fundamentos del sistema de diseño

- [x] 1.1 Ampliar `frontend/src/styles.css` con los tokens en `:root` (color, tipografía, espaciado, radios, sombras) y la tipografía base — verify: `npx ng build` compila y no queda ningún hexadecimal fuera de `:root`
- [x] 1.2 Añadir en `frontend/src/styles.css` las clases base `.btn`, `.field`, `.card`, `.table`, `.alert`, `.badge` con sus modificadores — verify: `grep -E '^\.(btn|field|card|table|alert|badge)' frontend/src/styles.css` lista las seis clases
- [x] 1.3 Actualizar `frontend/src/index.html` con `lang`, `theme-color`, título y descripción coherentes — verify: el HTML valida y `npx ng build` no reporta advertencias

## 2. Componentes compartidos

- [x] 2.1 Crear `frontend/src/app/shared/book-cover/book-cover.component.ts` (inputs `isbn`, `title`, `author`, `size`, `lazy`; portada de Open Library con `loading="lazy"` y `decoding="async"`) — verify: `npx ng build` compila el componente
- [x] 2.2 Implementar en el mismo componente la detección de portada ausente (`naturalWidth <= 1`, `error` y tiempo límite de 8 s) y el marcador local con iniciales — verify: el spec cubre portada disponible, ausente y error de red
- [x] 2.3 Crear `frontend/src/app/shared/book-cover/book-cover.component.spec.ts` con los tres escenarios — verify: `npm run test:ci` pasa y el componente queda por encima del 80 %
- [x] 2.4 Crear `frontend/src/app/shared/state/state.component.ts` con las variantes carga, vacío y error y su spec — verify: `npm run test:ci` pasa

## 3. Portadas en el módulo de libros

- [x] 3.1 Integrar `app-book-cover` en `frontend/src/app/features/books/book-list/book-list.component.ts` dentro de cada tarjeta — verify: `npm run test:ci` pasa y el listado conserva sus tests
- [x] 3.2 Actualizar `frontend/src/app/features/books/book-list/book-list.component.spec.ts` para comprobar que cada tarjeta renderiza `app-book-cover` con el ISBN del libro — verify: `npm run test:ci` pasa
- [x] 3.3 Integrar `app-book-cover` en `frontend/src/app/features/books/book-detail/book-detail.component.ts` con tamaño `lg` — verify: `npm run test:ci` pasa
- [x] 3.4 Añadir la vista previa de la portada en `frontend/src/app/features/books/book-form/book-form.component.ts`, solo con ISBN de 10 o 13 dígitos — verify: `npm run test:ci` pasa y el campo inválido no pide imagen
- [x] 3.5 Actualizar `frontend/src/app/features/books/book-form/book-form.component.spec.ts` con los escenarios de vista previa (ISBN completo e incompleto) — verify: `npm run test:ci` pasa

## 4. Rediseño de las vistas

- [x] 4.1 Rediseñar `frontend/src/app/features/home/home.component.ts` con la ilustración SVG local, la tarjeta de estado y los accesos rápidos por rol — verify: `npm run test:ci` pasa y `/` muestra los accesos correctos para visitante, reader y librarian
- [x] 4.2 Crear `frontend/public/library-hero.svg` con la ilustración del sistema de biblioteca — verify: el archivo se sirve en `http://localhost:4200/library-hero.svg`
- [x] 4.3 Rediseñar `frontend/src/app/features/books/book-list/book-list.component.ts` con rejilla de tarjetas, buscador y filtros con las clases base — verify: `npm run test:ci` pasa
- [x] 4.4 Rediseñar `frontend/src/app/features/books/book-detail/book-detail.component.ts` y la confirmación de borrado con el nuevo patrón de alerta — verify: `npm run test:ci` pasa
- [x] 4.5 Rediseñar `frontend/src/app/features/books/book-form/book-form.component.ts` con el nuevo formulario y mensajes de error — verify: `npm run test:ci` pasa
- [x] 4.6 Rediseñar `frontend/src/app/app.component.ts` (barra de navegación, aviso de sesión con `aria-live` y menú en móvil) — verify: `npm run test:ci` pasa
- [x] 4.7 Rediseñar `frontend/src/app/features/auth/login/login.component.ts` y `frontend/src/app/features/auth/register/register.component.ts` con el nuevo formulario — verify: `npm run test:ci` pasa (coordinado con dev-a)
- [x] 4.8 Rediseñar `frontend/src/app/features/auth/profile/profile.component.ts` y `frontend/src/app/features/users/user-list/user-list.component.ts` con la tabla y las insignias de rol — verify: `npm run test:ci` pasa (coordinado con dev-a)

## 5. Responsive y accesibilidad

- [x] 5.1 Ajustar las rejillas y la navegación con `@media` para 360 px, 768 px y 1280 px — verify: sin scroll horizontal en 360 px y 1280 px con las devtools
- [x] 5.2 Revisar contraste, foco visible, `label`/`for`, `aria-live` y `alt` en las ocho vistas — verify: recorrido completo con Tab y sin avisos en la comprobación de accesibilidad del navegador

## 6. Verificación de integración

- [x] 6.1 Ejecutar `./scripts/check.sh` — verify: termina en `CHECK OK` con los 109 tests del frontend y la cobertura por encima del 80 %
- [x] 6.2 Revisar las ocho vistas con el stack levantado (login, registro, perfil, inicio, catálogo, detalle, formulario y usuarios) en 360 px y 1280 px — verify: los resultados observables quedan anotados en `progress/dev-b.md`
- [x] 6.3 Ejecutar `./scripts/check.sh --full` y registrar el resultado en `feature_list.json` (feat-011 con su `evidence`) — verify: `CHECK OK` + `SMOKE OK` y la evidencia escrita en `feature_list.json`
