# Infrastructure

Terraform currently has one deployable environment:

- `infra/environments/dev`: AWS infrastructure for `huseyinbozkurt.dev` in `ca-central-1`.
- `infra/bootstrap`: one-time local bootstrap for Terraform remote state and GitHub Actions OIDC.

## Remote State Bootstrap

Run bootstrap locally once with AWS credentials that can create S3, DynamoDB, and
IAM resources:

```bash
cd /Users/huseyin/Documents/engineering-portfolio/infra/bootstrap
terraform init
terraform apply
```

By default this creates:

- S3 state bucket: `huseyinbozkurt-portfolio-dev-tfstate-ca-central-1`
- DynamoDB lock table: `portfolio-dev-terraform-locks`
- GitHub Actions IAM role restricted to
  `repo:huseyinbozkurt/engineering-portfolio:ref:refs/heads/main`

If the AWS account already has a GitHub Actions OIDC provider, reuse it:

```bash
terraform apply -var='create_github_oidc_provider=false'
```

If the default S3 bucket name is unavailable, choose a unique bucket name and
then update `infra/environments/dev/backend.dev.hcl` to match:

```bash
terraform apply -var='state_bucket_name=<unique-state-bucket-name>'
```

## State Migration

Do not run these commands until after bootstrap has succeeded. From the existing
main Terraform environment, migrate the current local state to S3:

```bash
cd /Users/huseyin/Documents/engineering-portfolio/infra/environments/dev
terraform init -backend-config=backend.dev.hcl -migrate-state
```

The dev environment has an existing manually created HTTPS listener that must be
imported into state before normal plan/apply runs. Keep that import completed in
the local state before migrating, or import it into the remote state after
migration.

## GitHub Actions Deployment

`.github/workflows/terraform-deploy.yml` runs on pushes to `main` and uses
GitHub OIDC with `id-token: write`. It does not use long-lived AWS access keys.

Set these GitHub repository variables:

- `AWS_REGION`: `ca-central-1`
- `AWS_GITHUB_ACTIONS_ROLE_ARN`: value of the bootstrap
  `github_actions_role_arn` output
- `TF_VAR_ALB_HTTPS_SSL_POLICY`: the current live ALB HTTPS listener SSL policy

Set this GitHub repository secret:

- `TF_VAR_ACM_CERTIFICATE_ARN`: issued ACM certificate ARN for
  `huseyinbozkurt.dev` in `ca-central-1`

The workflow also accepts `AWS_GITHUB_ACTIONS_ROLE_ARN` as a secret instead of a
variable, but a repository variable is preferred because the role ARN is not a
credential.

## Recovery

If Terraform reports a stuck lock, first confirm no local or GitHub Actions
Terraform run is still active. Then unlock with Terraform:

```bash
cd /Users/huseyin/Documents/engineering-portfolio/infra/environments/dev
terraform force-unlock <LOCK_ID>
```

If manual inspection is needed, the lock table is
`portfolio-dev-terraform-locks`. State object versions can be inspected in the
S3 bucket:

```bash
aws s3api list-object-versions \
  --bucket huseyinbozkurt-portfolio-dev-tfstate-ca-central-1 \
  --prefix dev/terraform.tfstate
```

Do not commit `.terraform/`, `terraform.tfstate`, `*.tfplan`, or private
`terraform.tfvars` files.
