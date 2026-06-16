module "public_site_ecr" {
  source = "../../modules/ecr"

  repository_name = "${var.project_name}-${var.environment}-public-site"
}

module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

module "alb" {
  source = "../../modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.acm_certificate_arn
  https_ssl_policy  = var.alb_https_ssl_policy
}

module "secrets" {
  source = "../../modules/secrets"

  project_name = var.project_name
  environment  = var.environment
}

module "ecs" {
  source = "../../modules/ecs"

  project_name          = var.project_name
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.alb.alb_security_group_id
  target_group_arn      = module.alb.target_group_arn

  image_uri = "${module.public_site_ecr.repository_url}:latest"

  container_environment = local.ecs_container_environment

  # The `secrets` module creates secret metadata only (values populated later in
  # AWS Secrets Manager). The Turnstile secret is value-managed here, so its ARN
  # is merged in. The ECS module injects every entry as a runtime-only secret and
  # scopes the task execution role's secretsmanager:GetSecretValue to exactly
  # these ARNs (no wildcard), so TURNSTILE_SECRET_KEY readability comes for free.
  container_secrets = merge(
    module.secrets.secret_arns,
    {
      TURNSTILE_SECRET_KEY = aws_secretsmanager_secret.turnstile.arn
    }
  )
}

module "rds" {
  source = "../../modules/rds"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.public_subnet_ids

  allowed_security_group_ids = [module.ecs.ecs_security_group_id]

  backup_retention_period = 1
  deletion_protection     = false
  skip_final_snapshot     = true
}
