# Cloudflare Turnstile for the public portfolio contact form.
#
# - The widget's site key (sitekey) is PUBLIC and is injected into the ECS
#   container as the normal environment variable NEXT_PUBLIC_TURNSTILE_SITE_KEY
#   (see locals.tf). It is read from the Terraform-managed widget output, never
#   hardcoded.
# - The secret key is supplied through the sensitive `turnstile_secret_key`
#   variable (TF_VAR_turnstile_secret_key / CI secret) and stored in AWS Secrets
#   Manager, then injected into ECS at runtime as TURNSTILE_SECRET_KEY
#   (see main.tf). It is never output, logged, or exposed as a plain env var.

resource "cloudflare_turnstile_widget" "portfolio_contact" {
  account_id = var.cloudflare_account_id
  name       = "Portfolio Contact Form"
  domains    = ["huseyinbozkurt.dev"]
  mode       = "managed"
  region     = "world"
}

# Unlike the shared `secrets` module (which manages secret metadata only), this
# secret's VALUE is managed by Terraform from the sensitive variable so CI/CD can
# rotate it through TF_VAR_turnstile_secret_key. The value lives only in the
# encrypted S3 state backend. The name uses the project's path-style convention
# (portfolio/dev/NAME) so it sits alongside the other application secrets.
resource "aws_secretsmanager_secret" "turnstile" {
  name        = "${var.project_name}/${var.environment}/TURNSTILE_SECRET_KEY"
  description = "Cloudflare Turnstile secret key for the ${var.project_name} ${var.environment} contact form. Injected into ECS at runtime as TURNSTILE_SECRET_KEY."

  tags = {
    Name        = "${var.project_name}-${var.environment}-turnstile-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "turnstile" {
  secret_id     = aws_secretsmanager_secret.turnstile.id
  secret_string = var.turnstile_secret_key
}
