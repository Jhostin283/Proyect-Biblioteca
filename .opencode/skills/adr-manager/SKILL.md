---
name: adr-manager
description: Procedimiento para crear, numerar, indexar y reemplazar Architecture Decision Records en ./adr/ (formato MADR simplificado, en español). Úsala cuando se ejecute /adr o /adr-supersede, o cuando un design.md tome una decisión estructural que condicione cambios futuros.
---

# ADR Manager

Plantilla: `adr/0000-template.md` · Índice: `adr/README.md` · Idioma: español (nombre de archivo en kebab-case).
Los estados se escriben en inglés porque los comandos los buscan así: `Proposed`, `Accepted`, `Rejected`,
`Deprecated`, `Superseded by ADR-XXXX`.

## Procedimiento CREAR
1. Si no existe `adr/`, créala con `0000-template.md` y un `README.md` con la tabla vacía.
2. **Número:** toma el mayor `NNNN` existente y súmale 1 (4 dígitos). Nunca reutilices números.
   Usa la lista de archivos que el comando insertó en el prompt; si no está, ejecuta `ls -1 adr`.
3. **Título:** debe expresar una decisión ("Usar X para Y"), no un tema ("Base de datos"). Si no lo es,
   propone una redacción como decisión y confírmala con el usuario.
4. **Archivo:** `adr/NNNN-<titulo-en-kebab-case-sin-tildes>.md` a partir de la plantilla.
5. **Contenido:**
   - Llena Contexto, Impulsores, Opciones (mínimo 2) y Decisión con información **real** del proyecto:
     `docs/PRODUCT.md`, `config.yaml`, specs, el design.md activo y el código.
   - Si falta algo que solo el usuario sabe (por ejemplo, por qué se descartó una opción), pregunta una sola vez.
   - Redacta **Reglas para futuros cambios** verificables (rutas, imports, convenciones), no deseos genéricos.
6. **Estado:** déjalo en `Proposed` y pregunta: "¿Lo marco como Accepted?". Si el usuario pidió explícitamente
   registrar una decisión ya tomada, usa `Accepted`.
7. **Índice:** agrega la fila en `adr/README.md`, en orden numérico.
8. **Trazabilidad:** si hay un cambio de OpenSpec activo, agrega en su `design.md` (sección Decisions) la línea
   `Ver ADR-NNNN: <título>`. Solo se edita esa línea del design.md: nunca código.
9. Propone el commit `docs(adr): NNNN <título>` (ver la skill `git-discipline`). En dos máquinas, el ADR llega
   a la otra máquina por Pull Request: avisa al usuario que el otro desarrollador debe revisarlo.

## Procedimiento REEMPLAZAR (supersede)
1. Verifica que el ADR original exista y esté `Accepted`. Si no, detente y explica.
2. Crea el ADR nuevo con el procedimiento CREAR. En el encabezado pon `Reemplaza a: ADR-<original>`
   y en Contexto explica **qué cambió** desde la decisión original.
3. En el ADR original cambia **solo** la línea de estado: `Superseded by ADR-<nuevo>`. No toques el resto del texto.
4. Actualiza las dos filas en `adr/README.md`.
5. Si el `context` de `openspec/config.yaml` describe la decisión anterior, indica al usuario la línea exacta
   que debe actualizar. No edites config.yaml sin confirmación (es un archivo compartido).

## Prohibido
- Editar el cuerpo de un ADR `Accepted` (solo cambian su estado y sus enlaces).
- Borrar ADRs (incluidos los rechazados: documentan qué se descartó).
- Crear ADRs para decisiones locales de un solo cambio (esas van en design.md).
