#!/usr/bin/env bash
# Prepara WSL2 (Ubuntu 24.04) para este harness: git, Node (nvm), Angular CLI, uv,
# opencode, OpenSpec, Docker, GitHub CLI, AWS CLI y Terraform. Idempotente: se puede ejecutar varias veces.
#   bash scripts/setup-wsl.sh
set -euo pipefail

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
have() { command -v "$1" >/dev/null 2>&1; }

if [[ "$(pwd)" == /mnt/* ]]; then
  echo "AVISO: estás en $(pwd). Trabaja dentro de ~/ (sistema de archivos de Linux): /mnt/c es muy lento para npm y git."
fi

say "Paquetes base"
sudo apt-get update -y
sudo apt-get install -y git curl wget unzip zip jq build-essential ca-certificates gnupg tree openssh-client

say "Node.js LTS con nvm"
export NVM_DIR="$HOME/.nvm"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"
nvm install 24
nvm alias default 24

say "Angular CLI y OpenSpec (npm global)"
npm install -g @angular/cli@latest @fission-ai/openspec@latest
ng config -g cli.analytics false >/dev/null 2>&1 || true

say "uv (Python)"
have uv || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv python install 3.12

say "opencode"
have opencode || curl -fsSL https://opencode.ai/install | bash

say "GitHub CLI"
if ! have gh; then
  sudo mkdir -p -m 755 /etc/apt/keyrings
  wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
  sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  sudo apt-get update -y && sudo apt-get install -y gh
fi

say "AWS CLI v2"
if ! have aws; then
  tmp="$(mktemp -d)"
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o "$tmp/awscliv2.zip"
  unzip -q "$tmp/awscliv2.zip" -d "$tmp"
  sudo "$tmp/aws/install"
  rm -rf "$tmp"
fi

say "Terraform (repositorio apt de HashiCorp)"
if ! have terraform; then
  wget -qO- https://apt.releases.hashicorp.com/gpg \
    | sudo gpg --dearmor --yes -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
  # shellcheck disable=SC1091
  codename="$(. /etc/os-release && echo "$VERSION_CODENAME")"
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com ${codename} main" \
    | sudo tee /etc/apt/sources.list.d/hashicorp.list >/dev/null
  sudo apt-get update -y && sudo apt-get install -y terraform
fi

say "Docker"
if have docker && docker compose version >/dev/null 2>&1; then
  echo "Docker ya está disponible (Docker Desktop o Engine)."
else
  echo "Instalando Docker Engine dentro de WSL (alternativa: Docker Desktop con integración WSL)."
  sudo apt-get install -y docker.io docker-compose-v2
  sudo usermod -aG docker "$USER"
  if pidof systemd >/dev/null 2>&1; then sudo systemctl enable --now docker; else sudo service docker start; fi
  echo "IMPORTANTE: abre una terminal nueva (o ejecuta 'newgrp docker') para usar docker sin sudo."
fi

grep -q 'HOME/.local/bin' "$HOME/.bashrc" || echo 'export PATH="$HOME/.local/bin:$HOME/.opencode/bin:$PATH"' >> "$HOME/.bashrc"

say "Resumen"
for c in git node npm ng openspec uv opencode gh aws terraform docker; do
  if have "$c"; then printf '  ok     %-9s %s\n' "$c" "$("$c" --version 2>/dev/null | head -n1)"; else printf '  FALTA  %-9s (abre una terminal nueva y vuelve a revisar)\n' "$c"; fi
done
