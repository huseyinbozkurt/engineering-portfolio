locals {
  # Path only: do not read this file with file() or templatefile(), or secrets can land in Terraform state.
  env_file_path = abspath(var.env_file_path)

  ecs_container_environment = merge(
    {
      DATABASE_CONNECT_TIMEOUT_SECONDS = tostring(var.database_connect_timeout_seconds)
      DATABASE_SSL_CA_FILE             = var.database_ssl_ca_file
      DATABASE_SSL_CA_URL              = var.database_ssl_ca_url

      # Public Turnstile site key — safe to expose to the browser. Sourced from
      # the Terraform-managed Cloudflare widget, not hardcoded.
      NEXT_PUBLIC_TURNSTILE_SITE_KEY = cloudflare_turnstile_widget.portfolio_contact.sitekey
    },
    var.database_ssl_mode == null ? {} : {
      DATABASE_SSL_MODE = var.database_ssl_mode
    }
  )
}
