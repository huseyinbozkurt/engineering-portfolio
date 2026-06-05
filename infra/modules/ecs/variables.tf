variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "target_group_arn" {
  type = string
}

variable "image_uri" {
  type = string
}

variable "container_environment" {
  description = "Non-secret container environment variables. Secrets must use container_secrets instead."
  type        = map(string)
  default     = {}
}

variable "container_secrets" {
  description = "Map of container environment variable names to Secrets Manager secret ARNs."
  type        = map(string)
  default     = {}
}
