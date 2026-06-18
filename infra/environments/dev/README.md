# Dev Infrastructure Notes

This environment serves `huseyinbozkurt.dev` through Cloudflare, an AWS
Application Load Balancer, and an ACM certificate in `ca-central-1`.

## Cloudflare

- Main site DNS: CNAME `huseyinbozkurt.dev` to the ALB DNS name and keep it
  Proxied.
- ACM validation CNAME records: keep these DNS Only so ACM can validate and
  renew the certificate.
- Cloudflare SSL mode: use Full (strict), because TLS terminates at the ALB with
  the issued ACM certificate.

## Cloudflare Turnstile (contact form)

Terraform manages a Cloudflare Turnstile widget (`Portfolio Contact Form`,
domain `huseyinbozkurt.dev`, mode `managed`, region `world`) in
`turnstile.tf` and wires both keys into the public-site ECS task:

- **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** — the widget's public site key. It is read
  from the Terraform-managed widget (`cloudflare_turnstile_widget.portfolio_contact.sitekey`),
  never hardcoded, and exposed as the non-sensitive `turnstile_site_key` output.
  Because it is a `NEXT_PUBLIC_*` value used by a client component, it is inlined
  into the browser bundle by `next build`, so the deploy workflow reads that output
  after `apply` and passes it to the image as the `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  Docker build arg (see `apps/public-site/Dockerfile` and `terraform-deploy.yml`).
  It is **not** set as a runtime ECS env var, which would never reach the browser.
- **`TURNSTILE_SECRET_KEY`** — the server-side secret. Its value comes from the
  sensitive `turnstile_secret_key` variable, is stored in AWS Secrets Manager
  (`portfolio/dev/TURNSTILE_SECRET_KEY`), and is injected into the container as an
  ECS *secret* (runtime only) — never as a plain environment variable, never
  output or logged. The task execution role's `secretsmanager:GetSecretValue` is
  scoped to exactly this secret's ARN (plus the existing app secrets), with no
  wildcard.

> Note: the Docker build arg defaults to empty, so local image builds and Next.js
> previews work without a key — the contact form simply runs without Turnstile
> until `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is provided (locally via `.env`, or in CI
> via the build arg the deploy workflow injects).

### Required Terraform variables

| Variable                | Sensitive | Source                                                        |
| ----------------------- | --------- | ------------------------------------------------------------- |
| `cloudflare_account_id` | no        | `terraform.tfvars` (local) or `TF_VAR_cloudflare_account_id`  |
| `turnstile_secret_key`  | **yes**   | `TF_VAR_turnstile_secret_key` only — never `terraform.tfvars` |

Provider authentication uses a scoped **`CLOUDFLARE_API_TOKEN`** environment
variable (Turnstile write permission). It is never committed or placed in state.

Local example:

```bash
export CLOUDFLARE_API_TOKEN="<scoped-cloudflare-api-token>"
export TF_VAR_turnstile_secret_key="<turnstile-secret-key>"
# cloudflare_account_id can live in the gitignored terraform.tfvars
terraform plan
```

### Required CI/CD secrets (GitHub Actions)

The `terraform-deploy.yml` workflow expects these to be configured before deploy:

- `secrets.TF_VAR_TURNSTILE_SECRET_KEY` — the Turnstile secret key.
- `secrets.CLOUDFLARE_API_TOKEN` — scoped Cloudflare API token for the provider.
- `vars.TF_VAR_CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID (non-sensitive).

The Turnstile secret value is never echoed, output, or committed.

## Current Live Values

- ALB DNS name: `portfolio-dev-alb-2138299774.ca-central-1.elb.amazonaws.com`
- HTTPS listener ARN:
  `arn:aws:elasticloadbalancing:ca-central-1:019769366795:listener/app/portfolio-dev-alb/fb2673c88a4ace8f/0687c7ee5fa5e7dc`
- ACM certificate ARN and HTTPS listener SSL policy: stored in the gitignored
  local `terraform.tfvars`.

## Required Import

The HTTPS listener was created manually and is not in the current Terraform
state. Import it before running `terraform plan` or `terraform apply`, otherwise
Terraform will try to create another port 443 listener.

```bash
cd /Users/huseyin/Documents/engineering-portfolio/infra/environments/dev

terraform import \
  'module.alb.aws_lb_listener.https' \
  'arn:aws:elasticloadbalancing:ca-central-1:019769366795:listener/app/portfolio-dev-alb/fb2673c88a4ace8f/0687c7ee5fa5e7dc'
```

No separate import is required for the ALB security group 443 ingress rule. The
rule belongs to the existing Terraform-managed `module.alb.aws_security_group.alb`
resource and is now represented in configuration.

## Validation

After the import, run:

```bash
terraform plan
```

The plan should keep the HTTPS listener and 443 security group rule, update the
port 80 listener to redirect to HTTPS, and avoid destroying the working ALB
listener setup.

## Remote State

This environment uses an S3 backend configured by `backend.dev.hcl`. Bootstrap
the state bucket and lock table from `../../bootstrap`, then migrate local state:

```bash
cd /Users/huseyin/Documents/engineering-portfolio/infra/environments/dev
terraform init -backend-config=backend.dev.hcl -migrate-state
```

GitHub Actions uses the same backend config when deploying from `main`.
