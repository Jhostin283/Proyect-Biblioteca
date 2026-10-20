# Guía de arranque — Grupo 2 (dev-a y dev-b)

Pasos para empezar a trabajar **hoy**, en orden. Cada bloque dice **quién** lo hace.
Documentos de referencia: `docs/PRODUCT.md` (qué se construye), `AGENTS.md` (reglas del agente),
`docs/EXAM-PLAYBOOK.md` (tiempos y prompts de rescate).

---

## 0. Quién es quién

| Rol | Persona | Módulo | Infraestructura |
|---|---|---|---|
| **dev-a** | `<nombre>` (quien tiene AWS configurado) | Autenticación y Autorización | Terraform |
| **dev-b** | `<nombre>` | Gestión de Libros | GitHub Actions |

- `feature_list.json` (en el repo, igual para los dos) dice **qué features son de cada rol** (campo `owner`).
- `.harness-owner` (solo en cada máquina, **no se sube**) dice **quién eres tú** en esa máquina.

---

## 1. Preparar el repositorio — dev-a (una sola vez)

El repo ya está en GitHub con la rama `main`. Desde la raíz del proyecto:

```bash
# 1.1 Aplicar la última versión del harness (si todavía no la tienes)
unzip -o <ruta-del-zip>/library-g2-harness.zip -d .

# 1.2 Identidad de esta máquina
echo dev-a > .harness-owner
./init.sh                                   # debe decir: esta máquina: dev-a

# 1.3 Crear develop (Git Flow) y subir el harness ahí
git checkout -b develop
git add .
git commit -m "chore: agrega harness, specs de OpenSpec y guía de arranque"
git push -u origin develop
gh repo edit --default-branch develop       # los Pull Requests apuntarán a develop

# 1.4 Dar acceso a dev-b
gh api -X PUT repos/<usuario>/<repo>/collaborators/<usuario-de-dev-b>
```
(Si el último comando falla, agrégalo en GitHub: *Settings → Collaborators*.)

---

## 2. Preparar la máquina — dev-b (una sola vez)

```bash
gh auth login
gh repo clone <usuario-de-dev-a>/<repo> && cd <repo>
git switch develop
echo dev-b > .harness-owner
bash scripts/setup-wsl.sh                   # herramientas: Docker, uv, Node 24, Terraform, gh...
openspec --version && opencode --version    # deben existir (las 12 skills ya vienen en el repo)
./init.sh                                   # debe decir: esta máquina: dev-b
```
En opencode, ejecuta `/connect` una vez para configurar el modelo.

---

## 3. Ramas (Git Flow)

| Rama | Para qué | Sale de | Vuelve a |
|---|---|---|---|
| `main` | Producción: **cada merge despliega en la EC2** | — | — |
| `develop` | Integración del trabajo de los dos | `main` | — |
| `feature/<cambio>` | Un cambio de OpenSpec | `develop` | `develop` (Pull Request) |
| `release/1.0.0` | Entrega final | `develop` | `main` y `develop` |
| `hotfix/<descripción>` | Arreglo urgente en producción | `main` | `main` y `develop` |

Reglas:
- Nunca hagas commit directo a `main` ni a `develop`.
- Las ramas `feature/*` se crean **cuando empieza cada cambio**, no todas al inicio.
- El nombre de la rama es el nombre del cambio de OpenSpec: `feature/add-book-management`.

---

## 4. Orden de trabajo (oleadas)

| Oleada | dev-a | dev-b | Espera a |
|---|---|---|---|
| **1** · en paralelo | `provision-aws-infrastructure` | `bootstrap-project` | nada |
| **2** · en paralelo | `define-domain-contract` | `setup-continuous-deployment` + revisar el PR del contrato | 1 integrada en `develop` |
| **3** · en paralelo | `add-user-authentication` → `add-role-authorization` → `add-user-administration` | `add-book-management` → `add-book-search` | el contrato integrado en `develop` |
| **4** · juntos | `release/1.0.0` → `main` → despliegue → demo | igual | todo en `develop` |

`./init.sh` y `/start` le dicen a cada uno cuál es su siguiente cambio, según `feature_list.json`.
dev-b **no espera** el login real de dev-a: sus tests usan la fixture `auth_as(role)` del contrato.

---

## 5. Ciclo de cada cambio (los dos, siempre igual)

Los `proposal.md` y `specs/` ya están escritos en `openspec/changes/<cambio>/`. El agente genera el diseño,
las tareas y el código.

```bash
# 5.1 Rama desde develop actualizado
git switch develop && git pull
git switch -c feature/<cambio>
```

```text
# 5.2 En opencode
/start                    → confirma tu siguiente cambio
/opsx-ff <cambio>         → genera design.md y tasks.md a partir de los specs (revísalos 5 min)
/opsx-apply <cambio>      → implementa tarea por tarea con los sensores en verde
/opsx-verify <cambio>     → compara el código con los escenarios del spec (corrige los CRITICAL)
/ship                     → check completo, commit, push y Pull Request hacia develop (pide confirmación)
```

```text
# 5.3 Integración
El otro desarrollador revisa el PR → CI "Sensores" en verde → merge a develop.
```

```text
# 5.4 Cierre (después del merge)
git switch develop && git pull
/opsx-archive <cambio>    → el spec pasa a openspec/specs/ y la feature queda en done
/ship                     → (o un commit y PR pequeños con el archivo del cambio)
```

Antes de abrir cada PR: `/sync` (rebase sobre `develop` y sensores).

---

## 6. Pasos especiales

### 6.1 Infraestructura — dev-a, oleada 1
Después de `/opsx-apply provision-aws-infrastructure`, **tú** ejecutas (el agente no puede):
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars    # key_name = tu key pair, admin_cidr = "<tu-ip>/32"
terraform init && terraform plan -out tfplan && terraform apply tfplan
gh secret set EC2_HOST --body "$(terraform output -raw public_ip)"
gh secret set EC2_USER --body "ubuntu"
gh secret set EC2_SSH_KEY < ~/keys/<llave>.pem
```
Tu IP: `curl -s ifconfig.me`. Avisa a dev-b cuando los secrets estén cargados.

### 6.2 Contrato — dev-a, oleada 2
`define-domain-contract` ya trae `design.md`: `/opsx-ff define-domain-contract` solo genera el `tasks.md` que falta.
Abre el PR lo antes posible: la oleada 3 de los dos empieza cuando se integre.

### 6.3 CI/CD — dev-b, oleada 2
Además del cambio, protege las ramas en GitHub (*Settings → Branches*): en `main` y `develop`, exige
Pull Request y el check "Sensores".

### 6.4 Release — juntos, oleada 4
```bash
git switch develop && git pull
git switch -c release/1.0.0
git push -u origin release/1.0.0
gh pr create --base main --title "release: v1.0.0"      # el merge despliega en la EC2
# después del merge:
git switch main && git pull && git tag v1.0.0 && git push origin v1.0.0
git switch develop && git merge main && git push         # develop recibe lo que entró en main
```
Contraseña del admin en producción: `ssh -i ~/keys/<llave>.pem ubuntu@<IP> 'cat ~/app/.env'`.

---

## 7. Al terminar cada sesión
```text
/handoff     → actualiza progress/<tu-rol>.md, feature_list.json y session-handoff.md
```

## 8. Si algo falla
| Problema | Qué hacer |
|---|---|
| `init.sh` dice "Esta máquina no tiene dueño" | `echo dev-a > .harness-owner` (o `dev-b`) |
| Los sensores no pasan | `/check` |
| Conflicto al integrar | `/sync` |
| El agente toca archivos del otro | "Revierte los cambios fuera de mis archivos según docs/PRODUCT.md sección 9" |
| El deploy falla | Pega al agente las últimas 40 líneas del job y lee `docs/DEPLOYMENT.md` |
| El mismo error se repite | Agrega una línea en "Lecciones aprendidas" de `AGENTS.md` |
