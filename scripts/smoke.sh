#!/usr/bin/env bash
# Smoke test contra un despliegue en ejecución (local o EC2).
#   ./scripts/smoke.sh http://localhost:8080
#   ./scripts/smoke.sh http://<IP-de-la-EC2>
set -uo pipefail

BASE="${1:-http://localhost:8080}"
BASE="${BASE%/}"
RETRIES="${SMOKE_RETRIES:-30}"
DELAY="${SMOKE_DELAY:-3}"
TMP_INDEX="$(mktemp)"
trap 'rm -f "$TMP_INDEX"' EXIT

ok()  { printf '  \033[32m✔\033[0m %s\n' "$1"; }
bad() { printf '  \033[31m✖\033[0m %s\n' "$1"; exit 1; }

echo "Smoke test contra ${BASE}"

# Espera a que la API responda (el backend puede tardar en aplicar migraciones)
body=""
for ((i = 1; i <= RETRIES; i++)); do
  if body="$(curl -fsS --max-time 5 "${BASE}/api/health" 2>/dev/null)"; then
    break
  fi
  body=""
  sleep "$DELAY"
done

[[ -n "$body" ]] || bad "GET /api/health no respondió después de $((RETRIES * DELAY))s"
grep -q '"ok"' <<<"$body" || bad "GET /api/health respondió algo inesperado: ${body}"
ok "GET /api/health -> ${body}"

code="$(curl -s -o "$TMP_INDEX" -w '%{http_code}' --max-time 10 "${BASE}/")"
[[ "$code" == "200" ]] || bad "GET / devolvió ${code}"
grep -qi '<app-root\|<html' "$TMP_INDEX" || bad "GET / no parece la SPA de Angular"
ok "GET / -> 200 (SPA)"

# Una ruta de Angular inexistente en el servidor debe devolver la SPA (fallback de Nginx)
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE}/books")"
[[ "$code" == "200" ]] || bad "El fallback de la SPA no funciona (GET /books -> ${code})"
ok "Fallback de rutas de Angular -> 200"

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE}/api/openapi.json")"
if [[ "$code" == "200" ]]; then ok "GET /api/openapi.json -> 200"; else echo "  · /api/openapi.json -> ${code} (opcional)"; fi

echo "SMOKE OK"
