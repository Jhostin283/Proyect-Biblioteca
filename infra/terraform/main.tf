# Infraestructura AWS de library-g2: security group mínimo, una EC2 t3.micro
# Ubuntu 24.04 que se prepara sola con user-data.sh y una Elastic IP estable.
# `terraform apply` crea todo y `terraform destroy` lo elimina; no hay pasos manuales.
# El estado vive solo en la máquina de dev-a y nunca se sube al repositorio.

terraform {
  required_version = ">= 1.3.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# AMI de Ubuntu 24.04 LTS (noble, amd64) publicada por Canonical.
# El glob es estricto a propósito: exige la variante gp3 y la versión 24.04
# para no capturar imágenes mínimas o de otras arquitecturas.
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# ---------------------------------------------------------------------------
# Acceso (VPC por defecto; el plan suma solo este SG, la instancia y la EIP)
# ---------------------------------------------------------------------------

resource "aws_security_group" "app" {
  # Sin vpc_id: usa la VPC por defecto de la región.

  # HTTP para cualquiera: la aplicación se sirve en el puerto 80.
  ingress {
    description = "HTTP desde Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH solo desde la IP declarada en admin_cidr. Nunca 0.0.0.0/0.
  # PostgreSQL (5432) queda sin regla de entrada: no se expone (RNF-02).
  ingress {
    description = "SSH desde la IP del administrador"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    description = "Salida a Internet (apt, Docker Hub, GHCR)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name      = "library-g2-sg-app"
    Project   = "library-g2"
    ManagedBy = "terraform"
  }
}

# ---------------------------------------------------------------------------
# Instancia
# ---------------------------------------------------------------------------

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.app.id]

  # Archivo de contrato: swap de 2 GB, Docker y ~/app/.env con secretos
  # aleatorios generados en el servidor; no pasan por el estado de Terraform.
  user_data = file("${path.module}/user-data.sh")

  root_block_device {
    volume_size = 16
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name      = "library-g2-ec2-app"
    Project   = "library-g2"
    ManagedBy = "terraform"
  }
}

# ---------------------------------------------------------------------------
# IP estable para EC2_HOST y el smoke test
# ---------------------------------------------------------------------------

# La EIP sobrevive al stop/start de la instancia; una IP efímera no.
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name      = "library-g2-eip-app"
    Project   = "library-g2"
    ManagedBy = "terraform"
  }
}
