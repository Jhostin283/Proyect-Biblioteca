#!/usr/bin/env bash
# Punto de arranque del harness: revisa herramientas, muestra el estado del proyecto
# y ejecuta la verificación base.
#   ./init.sh          -> herramientas + estado + sensores rápidos (scripts/check.sh)
#   ./init.sh --full   -> lo mismo, más docker compose y smoke test
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "=== Inicialización del harness ==="
echo "Directorio de trabajo: $(pwd)"

echo ""
echo "=== Herramientas ==="
missing=0
for tool in git node npm uv openspec docker terraform; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf '  ok     %-9s %s\n' "$tool" "$("$tool" --version 2>/dev/null | head -n1)"
  else
    printf '  FALTA  %-9s (instálala con scripts/setup-wsl.sh)\n' "$tool"
    missing=1
  fi
done
# Opcional: solo el usuario necesita la CLI de AWS (credenciales para terraform plan/apply).
if command -v aws >/dev/null 2>&1; then
  printf '  ok     %-9s %s\n' "aws" "$(aws --version 2>&1 | head -n1)"
else
  printf '  aviso  %-9s (opcional: el usuario la necesita para terraform plan/apply)\n' "aws"
fi
if [[ $missing -eq 1 ]]; then
  echo "Faltan herramientas. Arregla el entorno antes de escribir código."
  exit 1
fi

echo ""
echo "=== Estado ==="
# Identidad de esta máquina: variable HARNESS_OWNER o archivo .harness-owner (ignorado por git)
OWNER="${HARNESS_OWNER:-$(cat .harness-owner 2>/dev/null || true)}"
OWNER="$(echo "$OWNER" | tr -d '[:space:]')"
if [[ "$OWNER" != "dev-a" && "$OWNER" != "dev-b" ]]; then
  echo "  Esta máquina no tiene dueño. Ejecuta una vez: echo dev-a > .harness-owner  (o dev-b)"
  exit 1
fi
echo "  esta máquina: $OWNER"
HARNESS_OWNER="$OWNER" python3 - <<'PY'
import json
import os
import sys

# Valida feature_list.json y calcula qué le toca a esta máquina
try:
    data = json.load(open("feature_list.json"))
except Exception as exc:  # noqa: BLE001
    sys.exit(f"feature_list.json no es un JSON válido: {exc}")

features = data.get("features")
if not isinstance(features, list):
    sys.exit('feature_list.json debe tener un arreglo "features"')

allowed = {"not-started", "in-progress", "blocked", "done"}
owners = {"shared", "dev-a", "dev-b"}
for feature in features:
    for key in ("id", "name", "description", "owner", "status"):
        if key not in feature:
            sys.exit(f"a la feature {feature.get('id', '?')} le falta '{key}'")
    if feature["status"] not in allowed:
        sys.exit(f"la feature {feature['id']} tiene un status inválido: '{feature['status']}'")
    if feature["owner"] not in owners:
        sys.exit(f"la feature {feature['id']} necesita un owner válido: shared, dev-a o dev-b")

owner = os.environ["HARNESS_OWNER"]
done = {f["id"] for f in features if f["status"] == "done"}
active = [f for f in features if f["status"] == "in-progress"]
pending = len(features) - len(done) - len(active)
print(f"  features: {len(done)} terminadas, {len(active)} en curso, {pending} pendientes")

# Regla del harness: una sola feature en curso por máquina
for who in ("dev-a", "dev-b"):
    mine = [f for f in active if f["owner"] == who]
    if len(mine) > 1:
        sys.exit(f"  {who} tiene más de una feature en curso: termina una antes de empezar otra")
for feature in active:
    change = feature.get("openspec_change") or "(todavía sin cambio de OpenSpec)"
    print(f"  en curso [{feature['owner']}]: {feature['id']} - {feature['name']} -> {change}")

own_active = [f for f in active if f["owner"] == owner]
if own_active:
    cur = own_active[0]
    print(f"  continúa en {owner}: {cur['id']} - {cur['name']} -> /opsx-apply {cur.get('openspec_change', '')}")
    sys.exit(0)

ready = [
    f for f in features
    if f["status"] in ("not-started", "blocked")
    and f["owner"] in (owner, "shared")
    and all(dep in done for dep in f.get("dependencies", []))
]
if ready:
    nxt = ready[0]
    change = nxt.get("openspec_change", "")
    # Si el proposal y los specs ya existen, el agente solo completa design y tasks
    cmd = "/opsx-ff" if change and os.path.isdir(f"openspec/changes/{change}") else "/opsx-propose"
    print(f"  siguiente para {owner}: {nxt['id']} - {nxt['name']} -> {cmd} {change}")
else:
    print(f"  siguiente para {owner}: nada listo (¿esperando dependencias de la otra máquina?)")
PY

echo "  git: rama $(git branch --show-current 2>/dev/null), atrasada respecto de develop en $(git rev-list --count HEAD..origin/develop 2>/dev/null || echo '?') commits (ejecuta: git fetch)"
echo "  commits recientes:"
git log --oneline -5 2>/dev/null | sed 's/^/    /' || echo "    (todavía no hay commits)"
echo "  cambios de OpenSpec activos:"
openspec list 2>/dev/null | sed 's/^/    /' || true

echo ""
echo "=== Verificación base ==="
./scripts/check.sh "${1:-}"

echo ""
echo "=== Verificación completa ==="
echo ""
echo "Next steps (siguientes pasos):"
echo "1. Lee feature_list.json y progress/<owner>.md para ver el estado actual"
echo "2. Elige UNA feature sin terminar de esta máquina (o compartida) con sus dependencias listas"
echo "3. Complétala con /opsx-ff <cambio> (design y tasks) e impleméntala con /opsx-apply <cambio>"
echo "4. Vuelve a ejecutar ./scripts/check.sh antes de darla por terminada y deja el repo limpio"
