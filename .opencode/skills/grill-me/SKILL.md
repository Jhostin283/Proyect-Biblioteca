---
name: grill-me
description: Entrevista breve al usuario para eliminar ambigüedades de alcance, comportamiento, casos borde y restricciones antes de redactar proposal.md o specs. Úsala cuando un pedido es ambiguo o cuando una regla de config.yaml lo indique.
---

# Grill-Me: clarificación de requisitos

Complementa la clarificación que ya hace `/opsx-propose`: el objetivo es **cerrar huecos de forma explícita y rápida**,
no interrogar.

## Antes de preguntar
1. Lee el pedido, `docs/PRODUCT.md`, `openspec/config.yaml` (context), `openspec list --specs` y el código relevante.
2. **Nunca preguntes lo que puedes verificar** en el código, las specs, los ADR o `docs/PRODUCT.md`.
   Pregunta solo lo que únicamente el usuario sabe.

## Cómo preguntar
- Entre 2 y 4 preguntas, ordenadas por impacto: alcance → comportamiento observable → casos borde → restricciones no funcionales.
- Cada pregunta lleva **una recomendación por defecto** y su porqué, en una línea.
- Formato:

  ```text
  1. ¿Un reader puede ver el detalle de un libro sin iniciar sesión?
     Recomendado: no — PRODUCT.md pide autenticación para leer libros (sección 3).
  2. ...
  Responde por número o escribe "defaults" para aceptar todas las recomendaciones.
  ```

## Después de las respuestas
- Si el usuario responde "defaults", acepta todas las recomendaciones sin volver a preguntar.
- Registra los acuerdos en `proposal.md`, dentro de "What Changes", en una subsección **"Supuestos y decisiones acordadas"**.
- Si una respuesta cambia el contrato de `docs/PRODUCT.md`, avisa: lo deben acordar los dos desarrolladores.
- Si una respuesta implica una decisión estructural (BD, autenticación, patrón), sugiere `/adr <título>`.

## Límites
- Como máximo **una ronda** de preguntas, salvo que una respuesta abra una ambigüedad crítica nueva.
- Pregunta solo por el cambio actual: nada de sobreingeniería ni requisitos futuros.
