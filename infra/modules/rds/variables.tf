variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the RDS subnet group. Provide at least two subnets across different availability zones."
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security groups allowed to connect to PostgreSQL."
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect to PostgreSQL. Prefer security groups for application access."
  type        = list(string)
  default     = []
}

variable "engine_version" {
  type    = string
  default = "17"
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "max_allocated_storage" {
  type    = number
  default = 100
}

variable "storage_type" {
  type    = string
  default = "gp3"
}

variable "database_name" {
  type    = string
  default = "engineering_portfolio"
}

variable "master_username" {
  type    = string
  default = "portfolio"
}

variable "port" {
  type    = number
  default = 5432
}

variable "backup_retention_period" {
  type    = number
  default = 7
}

variable "backup_window" {
  type    = string
  default = "07:00-09:00"
}

variable "maintenance_window" {
  type    = string
  default = "sun:09:00-sun:10:00"
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "apply_immediately" {
  type    = bool
  default = false
}

variable "deletion_protection" {
  type    = bool
  default = true
}

variable "skip_final_snapshot" {
  type    = bool
  default = false
}
