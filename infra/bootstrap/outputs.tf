output "state_bucket_name" {
  description = "S3 bucket used by the main Terraform backend."
  value       = aws_s3_bucket.terraform_state.bucket
}

output "dynamodb_lock_table_name" {
  description = "DynamoDB table used by the main Terraform backend for state locking."
  value       = aws_dynamodb_table.terraform_locks.name
}

output "aws_region" {
  description = "AWS region for the remote state backend."
  value       = var.aws_region
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC deployments."
  value       = var.create_github_actions_role ? aws_iam_role.github_actions_terraform[0].arn : null
}
