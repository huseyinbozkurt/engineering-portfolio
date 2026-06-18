locals {
  # Path only: do not read this file with file() or templatefile(), or secrets can land in Terraform state.
  env_file_path = abspath(var.env_file_path)

  ecs_container_environment = merge(
    {
      DATABASE_CONNECT_TIMEOUT_SECONDS = tostring(var.database_connect_timeout_seconds)
      DATABASE_SSL_CA_FILE             = var.database_ssl_ca_file
      DATABASE_SSL_CA_URL              = var.database_ssl_ca_url

      # NEXT_PUBLIC_TURNSTILE_SITE_KEY is intentionally NOT set here. As a
      # NEXT_PUBLIC_* value consumed by a client component, it is inlined by
      # `next build` and must be supplied at Docker build time, not as a runtime
      # ECS env var (which never reaches the browser). The deploy workflow passes
      # it as a build arg from the `turnstile_site_key` output (see turnstile.tf,
      # outputs.tf, and apps/public-site/Dockerfile).
    },
    var.database_ssl_mode == null ? {} : {
      DATABASE_SSL_MODE = var.database_ssl_mode
    }
  )
}
