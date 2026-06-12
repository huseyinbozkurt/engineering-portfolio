variable "aws_region" {
  description = "AWS region for the Terraform state resources and GitHub Actions role."
  type        = string
  default     = "ca-central-1"
}

variable "project_name" {
  description = "Project name used in resource names and tags."
  type        = string
  default     = "portfolio"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*$", var.project_name))
    error_message = "project_name must use lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name used in resource names and tags."
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*$", var.environment))
    error_message = "environment must use lowercase letters, numbers, and hyphens."
  }
}

variable "state_bucket_name" {
  description = "Optional explicit S3 bucket name for Terraform state. Leave null to use the deterministic project default."
  type        = string
  default     = "engineering-portfolio-terraform-s3"

  validation {
    condition     = var.state_bucket_name == null || can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.state_bucket_name))
    error_message = "state_bucket_name must be a valid S3 bucket name."
  }
}

variable "lock_table_name" {
  description = "Optional explicit DynamoDB table name for Terraform state locking. Leave null to use the deterministic project default."
  type        = string
  default     = null
}

variable "github_owner" {
  description = "GitHub repository owner allowed to assume the deployment role."
  type        = string
  default     = "huseyinbozkurt"
}

variable "github_repo" {
  description = "GitHub repository name allowed to assume the deployment role."
  type        = string
  default     = "engineering-portfolio"
}

variable "github_branch" {
  description = "GitHub branch allowed to assume the deployment role."
  type        = string
  default     = "main"
}

variable "create_github_oidc_provider" {
  description = "Create the AWS IAM OIDC provider for GitHub Actions. Set false if this AWS account already has one."
  type        = bool
  default     = true
}

variable "create_github_actions_role" {
  description = "Create the GitHub Actions deployment role and policy."
  type        = bool
  default     = true
}
