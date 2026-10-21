---
name: c4-diagrams
description: Genera diagramas C4 (Contexto, Contenedores, Componentes) en Mermaid dentro de design.md, alineados con la arquitectura de config.yaml y los ADR. Úsala cuando un cambio cruza contenedores o módulos, o es el primer cambio del proyecto.
---

# Diagramas C4

## Qué nivel dibujar
| Situación del cambio | Nivel |
|---|---|
| Primer cambio del proyecto o un sistema externo nuevo | **Contexto** |
| Cruza contenedores (SPA ↔ API ↔ BD) | **Contenedores** |
| Cambia la estructura interna de un contenedor (capas, módulos) | **Componentes** |
| Cambio dentro de un solo componente | Ninguno: basta una nota en Decisions |

Como máximo 2 niveles por design.md.

## Reglas
1. **Formato por defecto: Mermaid `flowchart`** con `subgraph` como límites del sistema. No preguntes el formato.
2. Cada nodo muestra **nombre, tecnología y responsabilidad** (en español): `api[API REST<br/><i>FastAPI</i><br/>Reglas de negocio]`.
3. Cada flecha dice **qué y cómo**: `-->|JSON /api| `.
4. Como máximo unos 12 nodos por diagrama; si hay más, divide.
5. Respeta las capas y la dirección de dependencias de la arquitectura vigente. Si el diseño necesita romperlas,
   no lo dibujes como si nada: detente y sugiere `/adr-supersede`.
6. Marca lo nuevo, lo modificado y lo que no cambia con `classDef` (identificadores en inglés, etiquetas en español).

## Plantilla: Contenedores
```mermaid
flowchart LR
  user([Usuario<br/>Navegador web])
  subgraph sys[Sistema: Gestión de Libros]
    spa[Frontend SPA<br/><i>Angular + Nginx</i><br/>Login, catálogo y administración]
    api[API REST<br/><i>FastAPI</i><br/>JWT, roles y reglas BR-1 a BR-12]
    db[(Base de datos<br/><i>PostgreSQL 16</i><br/>Usuarios y libros)]
  end
  user -->|HTTP| spa
  spa -->|JSON /api| api
  api -->|SQL vía SQLAlchemy| db
  classDef new fill:#dcfce7,stroke:#16a34a
  classDef modified fill:#fef9c3,stroke:#ca8a04
  class api modified
```

## Plantilla: Componentes (capas)
```mermaid
flowchart TB
  subgraph api[API FastAPI]
    router[books router<br/><i>capa de rutas</i>]
    service[book_service<br/><i>reglas BR-9 a BR-12</i>]
    avail[deps.require_roles<br/><i>autorización de dev-a</i>]
    repo[book_repository<br/><i>consultas SQL</i>]
  end
  router --> avail
  router --> service
  service --> repo
```
