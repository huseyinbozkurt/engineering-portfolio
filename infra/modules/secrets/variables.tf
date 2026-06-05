variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "secret_names" {
  description = "Application secret names to create in AWS Secrets Manager. Values are intentionally not managed by Terraform."
  type        = list(string)
  default = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SITE_URL"
  ]

  validation {
    condition = alltrue([
      for secret_name in [
        "DATABASE_URL",
        "NEXT_PUBLIC_SITE_URL"
      ] : contains(var.secret_names, secret_name)
    ])
    error_message = "secret_names must include DATABASE_URL, and NEXT_PUBLIC_SITE_URL."
  }

  validation {
    condition     = length(distinct(var.secret_names)) == length(var.secret_names)
    error_message = "secret_names must not contain duplicate values."
  }
}

variable "recovery_window_in_days" {
  description = "Number of days Secrets Manager waits before permanently deleting a secret."
  type        = number
  default     = 30
}
