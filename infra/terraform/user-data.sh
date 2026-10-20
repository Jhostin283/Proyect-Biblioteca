#!/usr/bin/env bash
# user_data de la EC2 (se ejecuta una vez, como root, en el primer arranque). Archivo de contrato:
# se referencia desde main.tf con  user_data = file("${path.module}/user-data.sh")
# Mismo resultado que scripts/setup-ec2.sh: swap de 2 GB, Docker + Compose v2 y ~/app/.env para el usuario "ubuntu".
set -euo pipefail
exec > >(tee -a /var/log/user-data.log) 2>&1

APP_USER="ubuntu"
APP_DIR="/home/${APP_USER}/app"

# Swap de 2 GB (una t3.micro solo tiene 1 GB de RAM)
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
sysctl -p /etc/sysctl.d/99-swappiness.conf

# Docker y Docker Compose v2 con rotación de logs
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y docker.io docker-compose-v2 curl openssl
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
JSON
systemctl enable docker
systemctl restart docker
usermod -aG docker "${APP_USER}"

# Directorio de la app y .env de producción (secretos aleatorios de BD, JWT y admin; nunca pasan por el estado de Terraform)
mkdir -p "${APP_DIR}"
if [[ ! -f "${APP_DIR}/.env" ]]; then
  PASS="$(openssl rand -hex 16)"
  JWT="$(openssl rand -hex 32)"
  # Contraseña del admin inicial: letras y números (cumple BR-2)
  ADMIN_PASS="Admin$(openssl rand -hex 6)"
  cat > "${APP_DIR}/.env" <<EOF
POSTGRES_USER=app
POSTGRES_PASSWORD=${PASS}
POSTGRES_DB=app
APP_PORT=80
JWT_SECRET=${JWT}
JWT_EXPIRE_MINUTES=60
ADMIN_EMAIL=admin@library.local
ADMIN_PASSWORD=${ADMIN_PASS}
EOF
  chmod 600 "${APP_DIR}/.env"
fi
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

echo "user-data terminado: $(date -Is)" > /var/log/user-data.done
