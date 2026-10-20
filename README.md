# library-g2 · Sistema de Gestión de Libros (Grupo 2)

Aplicación full-stack (FastAPI + Angular + PostgreSQL) con dos módulos, **Autenticación y Autorización (dev-a)** y
**Gestión de Libros (dev-b)**, construida por dos desarrolladores, cada uno con un agente de IA (opencode) en su propia máquina, dentro de un harness común, con desarrollo guiado por specs (OpenSpec),
infraestructura como código (Terraform) y despliegue en AWS EC2.

## Harness (agente = modelo + harness)

| Subsistema | Para qué sirve | Archivos |
|---|---|---|
| Instrucciones | Cómo trabaja el agente en este repo | `AGENTS.md`, `docs/PRODUCT.md`, `openspec/config.yaml`, `.opencode/skills/` |
| Estado | Qué está hecho, en curso y qué sigue, por máquina | `feature_list.json` (`owner`), `progress/<owner>.md`, `openspec/` |
| Verificación | Evidencia antes de dar algo por terminado | `init.sh`, `scripts/check.sh` (incluye terraform fmt/validate), `scripts/smoke.sh`, `.github/workflows/` |
| Alcance | Una feature a la vez por máquina, criterios de terminado | `feature_list.json` (dependencias, estado, dueño), `tasks.md` de OpenSpec |
| Ciclo de sesión | Inicio y cierre limpios | `init.sh`, `/start`, `/handoff`, `session-handoff.md` |
| Coordinación | Dos máquinas sin pisarse | `.harness-owner`, Git Flow (`develop`, `feature/*`, `release/*`), Pull Requests, `/sync`, dueños de archivos en `PRODUCT.md` |
| Restricciones | Qué puede ejecutar o editar el agente | `opencode.json` (sin terraform apply/destroy ni push sin el usuario), `adr/` |

## Inicio rápido (cada máquina)
Guía completa paso a paso: `docs/GETTING-STARTED.md`.

```bash
echo dev-a > .harness-owner     # o dev-b (no se sube a git)
./init.sh                           # herramientas + estado + verificación base
opencode                            # luego: /start
```

## Comandos del agente
| Comando | Propósito |
|---|---|
| `/start` | Inicio de sesión: init.sh, estado y siguiente paso de esta máquina |
| `/scaffold` | Esqueleto backend + frontend según el contrato (feat-001) |
| `/opsx-propose`, `/opsx-apply`, `/opsx-verify`, `/opsx-archive` | Ciclo de vida de un cambio guiado por specs |
| `/check` | Corre los sensores y se autocorrige hasta `CHECK OK` |
| `/sync` | Se actualiza con `main` y resuelve conflictos en sus archivos |
| `/ship` | Check completo, estado, commit, push y Pull Request (con confirmación) |
| `/adr`, `/adr-supersede`, `/adr-review` | Registros de decisiones de arquitectura |
| `/handoff` | Rutina de fin de sesión |

## Infraestructura y despliegue
Terraform en `infra/terraform/` crea la EC2 (lo ejecuta dev-a). GitHub Actions (de dev-b) despliega cada merge a `main` (las releases de Git Flow).
Merge de `release/*` a `main` → CI (`scripts/check.sh --full`) → imágenes en GHCR → `docker compose pull && up -d` en la EC2 → smoke test.
Ver `docs/DEPLOYMENT.md`.
