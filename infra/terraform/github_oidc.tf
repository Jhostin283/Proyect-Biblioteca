# Acceso de GitHub Actions a AWS sin claves de larga duración (OIDC).
#
# El workflow de despliegue asume este rol solo para abrir el puerto 22 del
# security group a la IP del runner, desplegar y volver a cerrarlo. Así el 22
# sigue cerrado al mundo y no hay que guardar ACCESS_KEY/SECRET en GitHub.
#
# Requiere que el repositorio tenga el secreto/variable:
#   AWS_DEPLOY_ROLE_ARN = output deploy_role_arn
#   AWS_SECURITY_GROUP_ID = output security_group_id

data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = {
    Project   = "library-g2"
    ManagedBy = "terraform"
  }
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    sid     = "GitHubActionsOIDC"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Solo los flujos del repositorio: main y los tags de versión v*.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repository}:ref:refs/heads/main",
        "repo:${var.github_repository}:ref:refs/tags/v*",
      ]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "library-g2-github-deploy"
  description        = "Rol que asume GitHub Actions para abrir y cerrar el 22 del security group durante el despliegue"
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json

  tags = {
    Project   = "library-g2"
    ManagedBy = "terraform"
  }
}

data "aws_iam_policy_document" "github_deploy" {
  # Solo puede tocar las reglas de entrada del SG de la app.
  statement {
    sid     = "AbrirYCerrarSSHDelRunner"
    effect  = "Allow"
    actions = ["ec2:AuthorizeSecurityGroupIngress", "ec2:RevokeSecurityGroupIngress"]

    resources = [aws_security_group.app.arn]
  }

  # DescribeSecurityGroups no admite permisos por recurso.
  statement {
    sid       = "LeerSecurityGroups"
    effect    = "Allow"
    actions   = ["ec2:DescribeSecurityGroups"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "library-g2-github-deploy-sg"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
