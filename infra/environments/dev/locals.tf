locals {
  # Path only: do not read this file with file() or templatefile(), or secrets can land in Terraform state.
  env_file_path = abspath(var.env_file_path)

  ecs_container_environment = merge(
    {
      DATABASE_CONNECT_TIMEOUT_SECONDS = tostring(var.database_connect_timeout_seconds)
      DATABASE_SSL_CA_FILE             = var.database_ssl_ca_file
      DATABASE_SSL_CA_URL              = var.database_ssl_ca_url
    },
    var.database_ssl_mode == null ? {} : {
      DATABASE_SSL_MODE = var.database_ssl_mode
    }
  )
}
