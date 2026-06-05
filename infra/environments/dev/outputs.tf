output "public_site_ecr_url" {
  value = module.public_site_ecr.repository_url
}

output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "alb_http_listener_arn" {
  value = module.alb.http_listener_arn
}

output "alb_https_listener_arn" {
  value = module.alb.https_listener_arn
}

output "rds_database_endpoint" {
  value = module.rds.database_endpoint
}

output "rds_database_name" {
  value = module.rds.database_name
}

output "rds_database_username" {
  value = module.rds.database_username
}

output "rds_master_user_secret_arn" {
  value = module.rds.master_user_secret_arn
}

output "secret_arns" {
  value = module.secrets.secret_arns
}

output "database_url_secret_arn" {
  value = module.secrets.database_url_secret_arn
}

output "next_public_site_url_secret_arn" {
  value = module.secrets.next_public_site_url_secret_arn
}
