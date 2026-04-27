# Nottario — Infrastructure & Deployment

## Repository structure

```
nottario/
├── frontend/                        # Nuxt 3 + Vuetify app
│   ├── nuxt.config.ts
│   └── .output/public/              # nuxt generate output → GitHub Pages
├── lambdas/                         # TypeScript Lambda handlers
│   ├── createCheckout.ts
│   ├── stripeWebhook.ts
│   ├── notarise.ts
│   ├── generateReceipt.ts
│   └── verify.ts
├── dist/                            # esbuild output (gitignored)
│   └── *.zip
├── terraform/                       # This directory
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── environments/prod/
│   │   └── terraform.tfvars
│   └── modules/
│       ├── api/                     # Lambda functions + Function URLs
│       └── data/                    # DynamoDB + Secrets Manager
└── .github/workflows/
    └── deploy.yml                   # CI/CD pipeline
```

## Architecture summary

| Concern        | Solution                          |
|----------------|-----------------------------------|
| Frontend       | Nuxt 3 static · GitHub Pages      |
| CDN / HTTPS    | GitHub Pages (built-in)           |
| API            | Lambda Function URLs (no Gateway) |
| Database       | DynamoDB on-demand · eu-west-1    |
| Secrets        | AWS Secrets Manager               |
| IaC            | Terraform                         |
| CI/CD          | GitHub Actions                    |
| Timestamps     | DigiCert TSA · RFC 3161           |
| Payments       | Stripe Checkout + webhooks        |

## GitHub repository settings

Enable GitHub Pages before the first deploy:
- Settings → Pages → Source: **GitHub Actions**

Add these repository secrets (Settings → Secrets → Actions):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Bootstrap (first time only)

### 1. Create Terraform remote state backend

```bash
aws s3api create-bucket \
  --bucket nottario-terraform-state \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

aws s3api put-bucket-versioning \
  --bucket nottario-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name nottario-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-west-1
```

### 2. Run Terraform locally once to create resources

```bash
npm run build:lambdas
cd terraform
terraform init
terraform apply -var-file=environments/prod/terraform.tfvars
```

### 3. Set secrets in AWS Secrets Manager

```bash
aws secretsmanager put-secret-value \
  --secret-id nottario/prod/stripe \
  --secret-string '{"secretKey":"sk_live_...","webhookSecret":"whsec_..."}' \
  --region eu-west-1

aws secretsmanager put-secret-value \
  --secret-id nottario/prod/tsa \
  --secret-string '{"url":"https://timestamp.digicert.com","username":"...","password":"..."}' \
  --region eu-west-1
```

### 4. Register Stripe webhook

In your Stripe dashboard, add a webhook endpoint pointing to:
```
<url_stripe_webhook output from terraform>
```
Events to listen for: `checkout.session.completed`

### 5. Custom domain (optional)

In your DNS provider, add:
```
CNAME  nottario.com  →  <your-org>.github.io
```
Then in GitHub: Settings → Pages → Custom domain → `nottario.com`

## Deploying

Every push to `main` triggers:
1. **Test** — Vitest unit tests + TypeScript type check
2. **Deploy frontend** — `nuxt generate` → GitHub Pages
3. **Deploy backend** — esbuild Lambda ZIPs → `terraform apply`

Lambda Function URLs are stored in SSM Parameter Store after each
Terraform apply, and read back by the frontend build step so Nuxt
can embed them as public runtime config.

## Lambda Function URLs

| Function         | Purpose                            |
|------------------|------------------------------------|
| createCheckout   | Create Stripe Checkout session     |
| stripeWebhook    | Confirm payment · trigger notarise |
| notarise         | Call TSA · write hash to DynamoDB  |
| generateReceipt  | Build and return PDF receipt       |
| verify           | Look up hash · confirm match       |
