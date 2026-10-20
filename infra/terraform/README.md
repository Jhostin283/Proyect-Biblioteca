# infra/terraform

Infraestructura AWS de library-g2. El código lo escribe el agente de dev-a con un cambio de OpenSpec
(ver la skill `terraform-aws`). Al inicio solo existe `user-data.sh`, que es un archivo de contrato.

```bash
aws configure                                   # una vez, con tus propias credenciales
cp terraform.tfvars.example terraform.tfvars    # pon key_name y admin_cidr (tu IP/32)
terraform init
terraform plan -out tfplan                      # revísalo
terraform apply tfplan                          # lo ejecutas tú, no el agente
gh secret set EC2_HOST --body "$(terraform output -raw public_ip)"
```

Cuando ya no necesites el servidor: `terraform destroy` (ejecútalo tú; es irreversible).
El estado (`terraform.tfstate`) vive solo en dev-a y nunca se sube al repositorio.
