#!/bin/sh
set -eu

if [ -n "${DATABASE_SSL_CA_FILE:-}" ] && [ ! -f "$DATABASE_SSL_CA_FILE" ]; then
  ca_dir="$(dirname "$DATABASE_SSL_CA_FILE")"
  ca_tmp="${DATABASE_SSL_CA_FILE}.tmp"
  ca_url="${DATABASE_SSL_CA_URL:-https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem}"

  mkdir -p "$ca_dir"

  if command -v wget >/dev/null 2>&1; then
    wget -q -O "$ca_tmp" "$ca_url"
  elif command -v curl >/dev/null 2>&1; then
    curl -fsSL "$ca_url" -o "$ca_tmp"
  else
    echo "Neither wget nor curl is available to download $ca_url" >&2
    exit 1
  fi

  mv "$ca_tmp" "$DATABASE_SSL_CA_FILE"
fi

exec "$@"
