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
