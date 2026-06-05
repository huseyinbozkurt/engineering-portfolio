output "secret_arns" {
  description = "Map of secret names to Secrets Manager ARNs."
  value = {
    for name, secret in aws_secretsmanager_secret.this :
    name => secret.arn
  }
}

output "database_url_secret_arn" {
  value = aws_secretsmanager_secret.this["DATABASE_URL"].arn
}

output "next_public_site_url_secret_arn" {
  value = aws_secretsmanager_secret.this["NEXT_PUBLIC_SITE_URL"].arn
}
