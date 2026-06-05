output "db_instance_id" {
  value = aws_db_instance.this.id
}

output "db_instance_arn" {
  value = aws_db_instance.this.arn
}

output "db_security_group_id" {
  value = aws_security_group.rds.id
}

output "db_subnet_group_name" {
  value = aws_db_subnet_group.this.name
}

output "database_name" {
  value = aws_db_instance.this.db_name
}

output "database_username" {
  value = aws_db_instance.this.username
}

output "database_address" {
  value = aws_db_instance.this.address
}

output "database_endpoint" {
  value = aws_db_instance.this.endpoint
}

output "database_port" {
  value = aws_db_instance.this.port
}

output "master_user_secret_arn" {
  value = try(aws_db_instance.this.master_user_secret[0].secret_arn, null)
}
