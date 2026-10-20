# Guía del examen (≈2 horas, dos máquinas)

## Línea de tiempo
| Minuto | dev-a | dev-b |
|---|---|---|
| 0-10 | Revisar juntos `docs/PRODUCT.md`; crear el repo y dar acceso a dev-b | Revisar `PRODUCT.md`; clonar, `.harness-owner`, `./init.sh` |
| 10-45 | Oleada 1: feat-006 Terraform. Oleada 2: feat-002 contrato → PR a `develop` | Oleada 1: feat-001 esqueleto. Oleada 2: feat-009 CI/CD y revisar el PR del contrato |
| 45-95 | Oleada 3: feat-003 login/JWT → feat-004 roles → feat-005 admin de usuarios | Oleada 3: feat-007 CRUD de libros → feat-008 búsqueda |
| 95-110 | Oleada 4 juntos: `release/1.0.0` → PR a `main` → despliegue → smoke test | Oleada 4 juntos |
| 110-120 | `/handoff` y demo | `/handoff` y demo |

Regla de oro: los módulos (fase 1) empiezan solo cuando el contrato (feat-002) está en `develop`.
Segunda regla: dev-a crea la EC2 (feat-006) en la fase 0, porque el despliegue de dev-b (feat-009) depende de ella.

## Flujo por feature (los proposal y specs ya están escritos)
```text
/opsx-ff <cambio>        # genera design.md y tasks.md a partir del proposal y los specs existentes
```
Revisa `tasks.md` (5 minutos) y luego:
```text
/opsx-apply <cambio>     # implementa tarea por tarea con los sensores en verde
/opsx-verify <cambio>    # compara el código con los escenarios del spec
/ship                    # commit, push y Pull Request
/opsx-archive <cambio>   # después del merge: el spec pasa a openspec/specs/
```

## Infraestructura (dev-a)
`/opsx-ff provision-aws-infrastructure` → revisa → `/opsx-apply provision-aws-infrastructure` (usa la skill terraform-aws).
Luego TÚ ejecutas `terraform plan -out tfplan` y `terraform apply tfplan`
(ver `docs/DEPLOYMENT.md`); carga los secrets de la EC2, avisa a dev-b y registra los outputs como evidencia de feat-006.

## Prompts de rescate
- Los sensores no pasan: `/check` (se detiene a los 5 intentos y explica la causa raíz).
- Conflicto al integrar: `/sync` (resuelve solo en tus archivos y te consulta en los compartidos).
- Falló el deploy: pega las últimas 40 líneas del job de GitHub Actions y pide la causa raíz y el arreglo mínimo (ver `docs/DEPLOYMENT.md`).
- 502 en producción: `ssh -i llave.pem ubuntu@<IP> 'cd ~/app && docker compose -f docker-compose.prod.yml logs --tail=80 backend'` y pega la salida.
- El agente se desvía del plan: "Detente. Relee openspec/changes/<cambio>/tasks.md y continúa SOLO con la siguiente tarea sin marcar."
- El agente toca archivos de la otra máquina: "Revierte los cambios fuera de mis archivos según docs/PRODUCT.md sección 9."
- Mismo error dos veces: "Agrega una regla de una línea en Lecciones aprendidas de AGENTS.md."

## Qué mostrar al profesor
1. `docs/PRODUCT.md`: alcance, contrato y reparto por máquina (el documento que guía a ambos agentes).
2. `AGENTS.md` y `openspec/config.yaml`: las guías comunes que siguen los dos agentes.
3. `feature_list.json` con `owner`, `progress/dev-a.md` y `progress/dev-b.md`: estado compartido sin conflictos.
4. `init.sh`, `scripts/check.sh`, `/check` y el CI de cada Pull Request: sensores y bucle de autocorrección.
5. Los Pull Requests en GitHub: cómo se integra el trabajo de dos máquinas con el CI como filtro.
6. `opencode.json` y `adr/`: restricciones y decisiones de arquitectura.
7. `openspec/specs/` y `openspec/changes/archive/`: trazabilidad desde el requisito hasta el código.
8. GitHub Actions en verde y la app en `http://<IP>` y `http://<IP>/api/docs`.
