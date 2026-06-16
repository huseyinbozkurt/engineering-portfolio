terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Authenticates from the CLOUDFLARE_API_TOKEN environment variable (a scoped
# token with Turnstile write permission). The token is never placed in
# Terraform configuration, tfvars, or state.
provider "cloudflare" {}