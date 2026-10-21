# Entradas del módulo. Sin default en key_name y admin_cidr: un default para el
# origen de SSH sería un rango elegido por el código que nadie revisa.

variable "region" {
  description = "Región de AWS donde se crea la infraestructura."
  type        = string
  default     = "us-east-1"
}

variable "key_name" {
  description = "Par de claves SSH ya existente en la región que usa la instancia. Ej.: library-g2"
  type        = string

  validation {
    condition     = length(trimspace(var.key_name)) > 0
    error_message = "key_name no puede estar vacío: crea un par de claves en la región (aws ec2 create-key-pair o la consola) y pon aquí su nombre."
  }
}

variable "admin_cidr" {
  description = "Prefijo CIDR /32 de la IP pública desde la que se accede por SSH. Ej.: 203.0.113.10/32"
  type        = string

  validation {
    condition     = can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/32$", var.admin_cidr))
    error_message = "admin_cidr debe ser una IPv4 con prefijo /32, por ejemplo 203.0.113.10/32. Consulta tu IP pública con `curl -s https://checkip.amazonaws.com` y añade el /32."
  }

  validation {
    condition     = can(cidrhost(var.admin_cidr, 0)) && cidrhost(var.admin_cidr, 0) == split("/", var.admin_cidr)[0]
    error_message = "admin_cidr no es una dirección IPv4 válida."
  }
}

variable "github_repository" {
  description = "Repositorio de GitHub (owner/nombre) autorizado a asumir el rol de despliegue por OIDC. Ej.: Jhostin283/Proyect-Biblioteca"
  type        = string
  default     = "Jhostin283/Proyect-Biblioteca"

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository debe tener el formato owner/nombre, por ejemplo Jhostin283/Proyect-Biblioteca."
  }
}
