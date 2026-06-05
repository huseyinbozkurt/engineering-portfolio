# This module creates Secrets Manager metadata and ARNs only. Add each secret's
# actual value manually in AWS Secrets Manager after Terraform apply, so secret
# material never enters Terraform configuration or state.
resource "aws_secretsmanager_secret" "this" {
  for_each = toset(var.secret_names)

  name        = "${var.project_name}/${var.environment}/${each.value}"
  description = "Secret metadata for ${each.value}. Populate the value manually in AWS Secrets Manager after Terraform creates this secret."

  recovery_window_in_days = var.recovery_window_in_days

  tags = {
    Name        = "${var.project_name}-${var.environment}-${each.value}"
    Environment = var.environment
  }
}
