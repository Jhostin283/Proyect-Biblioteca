#!/usr/bin/env bash
# Prepara una EC2 t3.micro (Ubuntu 24.04) para recibir despliegues del pipeline.
# Plan B si no se usa Terraform. Ejecutar UNA vez en la instancia:
#   scp -i key.pem scripts/setup-ec2.sh ubuntu@<IP>:~ && ssh -i key.pem ubuntu@<IP> 'bash setup-ec2.sh'
set -euo pipefail

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

say "Swap de 2 GB (una t3.micro solo tiene 1 GB de RAM)"
if ! sudo swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf >/dev/null
sudo sysctl -p /etc/sysctl.d/99-swappiness.conf >/dev/null
free -h

say "Docker y Docker Compose v2"
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose-v2 curl openssl
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

say "Rotación de logs de Docker"
sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
JSON
sudo systemctl restart docker

say "Directorio de la app y .env de producción"
mkdir -p "$HOME/app"
if [[ ! -f "$HOME/app/.env" ]]; then
  PASS="$(openssl rand -hex 16)"
  JWT="$(openssl rand -hex 32)"
  # Contraseña del admin inicial: letras y números (cumple BR-2)
  ADMIN_PASS="Admin$(openssl rand -hex 6)"
  cat > "$HOME/app/.env" <<EOF
POSTGRES_USER=app
POSTGRES_PASSWORD=${PASS}
POSTGRES_DB=app
APP_PORT=80
JWT_SECRET=${JWT}
JWT_EXPIRE_MINUTES=60
ADMIN_EMAIL=admin@library.local
ADMIN_PASSWORD=${ADMIN_PASS}
EOF
  chmod 600 "$HOME/app/.env"
  echo "Se creó $HOME/app/.env con secretos aleatorios (BD, JWT y admin). Ver con: cat ~/app/.env"
else
  echo "$HOME/app/.env ya existe: no se modifica."
fi

say "Listo"
docker --version
docker compose version
echo "Cierra la sesión SSH y vuelve a entrar para usar docker sin sudo."
echo "Security group: puerto 22 (solo tu IP) y puerto 80 (0.0.0.0/0)."
