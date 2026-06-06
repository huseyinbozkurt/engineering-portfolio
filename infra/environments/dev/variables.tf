variable "aws_region" {
  type    = string
  default = "ca-central-1"
}

variable "project_name" {
  type    = string
  default = "portfolio"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "env_file_path" {
  description = "Local path to the environment file used outside Terraform. Terraform keeps this path only and must not read the file contents into state."
  type        = string
  default     = "../../../.env.local"

  validation {
    condition     = length(trimspace(var.env_file_path)) > 0
    error_message = "env_file_path must point to a local environment file path."
  }
}

variable "acm_certificate_arn" {
  description = "Issued ACM certificate ARN for huseyinbozkurt.dev in ca-central-1. Store the real value in tfvars or pass it with -var."
  type        = string

  validation {
    condition     = startswith(var.acm_certificate_arn, "arn:aws:acm:")
    error_message = "acm_certificate_arn must be an issued ACM certificate ARN."
  }
}

variable "alb_https_ssl_policy" {
  description = "ALB TLS security policy for the HTTPS listener. Use the policy currently attached to the live listener unless intentionally changing it."
  type        = string

  validation {
    condition     = startswith(var.alb_https_ssl_policy, "ELBSecurityPolicy-")
    error_message = "alb_https_ssl_policy must be a valid ALB SSL policy name."
  }
}

variable "database_ssl_mode" {
  description = "Optional DATABASE_SSL_MODE passed to ECS when the remote database needs SSL and DATABASE_URL does not include sslmode."
  type        = string
  default     = null

  validation {
    condition = (
      var.database_ssl_mode == null ||
      contains(["disable", "require", "allow", "prefer", "verify-full"], var.database_ssl_mode)
    )
    error_message = "database_ssl_mode must be one of: disable, require, allow, prefer, verify-full."
  }
}

variable "database_connect_timeout_seconds" {
  description = "DATABASE_CONNECT_TIMEOUT_SECONDS passed to ECS so public-site reads fall back quickly when the remote database is unavailable."
  type        = number
  default     = 10

  validation {
    condition     = var.database_connect_timeout_seconds >= 1 && floor(var.database_connect_timeout_seconds) == var.database_connect_timeout_seconds
    error_message = "database_connect_timeout_seconds must be a positive integer."
  }
}

variable "database_ssl_ca_file" {
  description = "DATABASE_SSL_CA_FILE passed to ECS. The public-site Docker image copies root global-bundle.pem to this path."
  type        = string
  default     = "/app/global-bundle.pem"

  validation {
    condition     = length(trimspace(var.database_ssl_ca_file)) > 0
    error_message = "database_ssl_ca_file must not be empty."
  }
}

variable "database_ssl_ca_url" {
  description = "DATABASE_SSL_CA_URL passed to ECS. The public-site container downloads this CA bundle if DATABASE_SSL_CA_FILE is missing."
  type        = string
  default     = "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"

  validation {
    condition     = startswith(var.database_ssl_ca_url, "https://")
    error_message = "database_ssl_ca_url must be an HTTPS URL."
  }
}
