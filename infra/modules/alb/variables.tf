variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "certificate_arn" {
  description = "Issued ACM certificate ARN to attach to the HTTPS listener."
  type        = string

  validation {
    condition     = startswith(var.certificate_arn, "arn:aws:acm:")
    error_message = "certificate_arn must be an issued ACM certificate ARN in the same region as the ALB."
  }
}

variable "https_ssl_policy" {
  description = "ALB TLS security policy for the HTTPS listener."
  type        = string

  validation {
    condition     = startswith(var.https_ssl_policy, "ELBSecurityPolicy-")
    error_message = "https_ssl_policy must be a valid ALB SSL policy name."
  }
}

variable "health_check_path" {
  description = "HTTP path used by the ALB target group health check."
  type        = string
  default     = "/api/health"
}
