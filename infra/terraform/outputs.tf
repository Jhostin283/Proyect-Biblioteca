# Salidas del despliegue. public_ip es el valor del secreto EC2_HOST del
# pipeline de GitHub Actions (feat-009); app_url y ssh_command evitan
# reconstruir los comandos a mano.

output "public_ip" {
  description = "IP pública elástica de la instancia. Es el valor del secret EC2_HOST."
  value       = aws_eip.app.public_ip
}

output "app_url" {
  description = "URL base de la aplicación (HTTP en el puerto 80)."
  value       = "http://${aws_eip.app.public_ip}"
}

output "ssh_command" {
  description = "Comando SSH listo para pegar. Ajusta la ruta del .pem a la de tu máquina (por ejemplo ~/keys/<llave>.pem)."
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_eip.app.public_ip}"
}
