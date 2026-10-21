---
name: git-discipline
description: Protocolo de control de versiones (Git Flow) para el flujo OpenSpec en dos máquinas - árbol limpio, rama feature por cambio, commits atómicos con Conventional Commits, Pull Requests y protección de secretos. Úsala al iniciar, planificar, implementar o archivar un cambio.
---

# Git Discipline (dos máquinas)

## 1. Antes de crear un cambio (`/opsx-new`, `/opsx-propose`)
- Ejecuta `git status --porcelain`. Si hay cambios sin commitear **ajenos** al trabajo que empieza, detente y ofrece:
  (a) commit, (b) `git stash`, (c) seguir bajo responsabilidad del usuario.
- Actualízate con `develop` (`git fetch origin` y `git switch develop && git pull --rebase origin develop`).
- Crea la rama del cambio desde `develop`: `git switch -c feature/<feat-id>-<change-name>` (ej.: `feature/feat-007-add-book-management`, para trazabilidad con `feature_list.json`). Nunca trabajes directo en `main` ni en `develop`.

## 2. Puntos de commit sugeridos (tipo en inglés, descripción en español)
| Momento | Mensaje sugerido |
|---|---|
| Artefacto aprobado en `/opsx-continue` | `docs(openspec): agrega <artefacto> de <cambio>` |
| Plan completo (antes de `/opsx-apply`) | `docs(openspec): planifica <cambio>` |
| Grupo de tareas terminado con tests en verde | `feat(<capacidad>): <qué hace>` / `fix(...)` / `test(...)` |
| ADR creado o reemplazado | `docs(adr): NNNN <título>` |
| Cambio archivado | `chore(openspec): archiva <cambio>` |

## 3. Integración
- Antes de abrir el PR: `/sync` y `./scripts/check.sh` en verde.
- El PR de una `feature/*` va contra `develop` y lo aprueba el otro desarrollador cuando toca archivos compartidos o de su dueño.
- Después del merge: `git switch develop && git pull --rebase origin develop` y borra la rama local.
- Release (juntos): `release/<versión>` desde `develop` → PR a `main` (despliega) → tag `v<versión>` → merge de `main` a `develop`.
- Hotfix: `hotfix/<descripción>` desde `main` → PR a `main` → merge de `main` a `develop`.

## 4. Reglas duras
- **Nunca** ejecutes `git commit`, `git push` ni `gh pr create` sin confirmación explícita del usuario: propone y espera.
- **Nunca** agregues `.env`, `*.pem`, `.harness-owner`, `terraform.tfvars`, `*.tfstate`, llaves ni credenciales.
- **Nunca** uses `git push --force` ni `git reset --hard`. Tras un rebase, propone `git push --force-with-lease`.
- Al pasar de un artefacto a otro en `/opsx-continue`, recuerda que una sesión nueva (`/new`) no pierde nada:
  el estado vive en los archivos.
