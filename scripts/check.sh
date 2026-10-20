#!/usr/bin/env bash
# Sensores del harness (feedback computacional).
#   ./scripts/check.sh          -> lint, formato, tests, build y terraform fmt/validate (rápido)
#   ./scripts/check.sh --full   -> lo anterior + docker compose + smoke test con PostgreSQL real
# Termina con "CHECK OK" (exit 0), "CHECK SKIPPED" (exit 0, aún no hay código) o "CHECK FAILED: <paso>" (exit 1).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

FULL=0
[[ "${1:-}" == "--full" ]] && FULL=1

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }
fail() {
  printf '\n\033[1;31m✖ CHECK FAILED: %s\033[0m\n' "$1"
  [[ -n "${2:-}" ]] && printf '  Pista: %s\n' "$2"
  exit 1
}
# Ejecuta un paso y falla con una pista si el comando no termina bien
run() {
  local name="$1" hint="$2"
  shift 2
  step "$name"
  "$@" || fail "$name" "$hint"
}

checked=0

# ---------------------------------------------------------------- backend
if [[ -f backend/pyproject.toml ]]; then
  checked=1
  command -v uv >/dev/null 2>&1 || fail "uv no está instalado" "Ejecuta scripts/setup-wsl.sh"
  pushd backend >/dev/null || exit 1

  [[ -f uv.lock ]] || fail "backend: falta uv.lock" "Ejecuta: cd backend && uv lock"
  run "backend: dependencias (uv sync)" "Si cambió pyproject.toml, ejecuta: cd backend && uv lock" \
    uv sync --frozen --quiet
  run "backend: lint (ruff check)" "Muchos errores se corrigen con: cd backend && uv run ruff check --fix ." \
    uv run ruff check .
  run "backend: formato (ruff format)" "Ejecuta: cd backend && uv run ruff format ." \
    uv run ruff format --check .

  step "backend: tests (pytest)"
  uv run pytest -q
  rc=$?
  # pytest devuelve 5 cuando no encuentra tests
  if [[ $rc -eq 5 ]]; then
    fail "backend: no hay tests" "Agrega tests en backend/tests/ (plantilla en docs/TESTING.md)"
  elif [[ $rc -ne 0 ]]; then
    fail "backend: pytest" "Corrige el PRIMER test que falla; los demás suelen ser consecuencia"
  fi

  popd >/dev/null || exit 1
else
  echo "· no existe backend/pyproject.toml: se omite el backend (ejecuta /scaffold primero)"
fi

# ---------------------------------------------------------------- frontend
if [[ -f frontend/package.json ]]; then
  checked=1
  command -v node >/dev/null 2>&1 || fail "node no está instalado" "Ejecuta scripts/setup-wsl.sh"
  pushd frontend >/dev/null || exit 1
  export NG_CLI_ANALYTICS=false

  # Reinstala dependencias solo si faltan o si cambió package-lock.json
  if [[ ! -d node_modules || package-lock.json -nt node_modules ]]; then
    run "frontend: dependencias (npm ci)" "¿package-lock.json desactualizado? Ejecuta: cd frontend && npm install" \
      npm ci --no-audit --no-fund
  fi

  if grep -q '"lint"' angular.json 2>/dev/null; then
    run "frontend: lint (ng lint)" "Corrige los errores de ESLint de arriba" npx ng lint
  fi

  if node -e "process.exit(require('./package.json').scripts?.['test:ci'] ? 0 : 1)"; then
    run "frontend: tests (npm run test:ci)" "Corrige el primer test que falla" npm run test:ci
  fi

  run "frontend: build (ng build)" "Lee el primer error TS/NG: suele ser un import o un tipo" \
    npx ng build --configuration production

  popd >/dev/null || exit 1
else
  echo "· no existe frontend/package.json: se omite el frontend (ejecuta /scaffold primero)"
fi

# ---------------------------------------------------------------- infraestructura (Terraform)
TF_DIR="infra/terraform"
if compgen -G "${TF_DIR}/*.tf" >/dev/null; then
  checked=1
  command -v terraform >/dev/null 2>&1 || fail "terraform no está instalado" "Ejecuta scripts/setup-wsl.sh"
  run "infra: formato (terraform fmt)" "Ejecuta: terraform -chdir=${TF_DIR} fmt -recursive" \
    terraform -chdir="${TF_DIR}" fmt -check -recursive
  # init sin backend: valida sin tocar el estado ni necesitar credenciales de AWS
  run "infra: init sin backend (terraform init)" "Revisa versions.tf (source/version del provider) y tu red" \
    terraform -chdir="${TF_DIR}" init -backend=false -input=false -no-color
  run "infra: validación (terraform validate)" "Lee el primer error: suele ser un argumento mal escrito o una variable faltante" \
    terraform -chdir="${TF_DIR}" validate -no-color
  if command -v tflint >/dev/null 2>&1; then
    run "infra: lint (tflint)" "Corrige los hallazgos de tflint de arriba" tflint --chdir="${TF_DIR}"
  fi
else
  echo "· no hay ${TF_DIR}/*.tf: se omite la infraestructura (se planifica en su propio cambio de OpenSpec)"
fi

if [[ $checked -eq 0 ]]; then
  printf '\n\033[1;33m● CHECK SKIPPED: todavía no hay código de la aplicación (ejecuta /scaffold)\033[0m\n'
  exit 0
fi

# ---------------------------------------------------------------- integración
if [[ $FULL -eq 1 ]]; then
  command -v docker >/dev/null 2>&1 || fail "docker no está disponible" "Inicia Docker (integración WSL de Docker Desktop o 'sudo service docker start')"
  docker compose version >/dev/null 2>&1 || fail "docker compose v2 no está disponible" "Instala el plugin docker compose"

  [[ -f .env ]] || cp .env.example .env
  APP_PORT="$(grep -E '^APP_PORT=' .env | cut -d= -f2 | tr -d '[:space:]')"
  APP_PORT="${APP_PORT:-8080}"

  run "docker: build y arranque (compose up)" "Revisa el Dockerfile del servicio que falló y 'docker compose logs'" \
    docker compose up -d --build --wait --wait-timeout 180

  step "smoke test (http://localhost:${APP_PORT})"
  if ! ./scripts/smoke.sh "http://localhost:${APP_PORT}"; then
    echo "---- últimos logs del backend ----"
    docker compose logs --tail=40 backend
    fail "smoke test" "Revisa los logs de arriba (DATABASE_URL, migraciones, rutas bajo /api)"
  fi

  # En el CI se limpian los contenedores y volúmenes al terminar
  if [[ "${CI:-}" == "true" ]]; then
    docker compose down -v >/dev/null 2>&1
  fi
fi

printf '\n\033[1;32m✔ CHECK OK\033[0m\n'
