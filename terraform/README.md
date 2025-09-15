# Terraform Deployment for Next Fractals on GCP Cloud Run

This directory contains Terraform configuration for deploying the [Next Fractals](../README.md) application to Google Cloud Run.

## 📚 Related Documentation

- **[⬅️ Back to Main Project](../README.md)** - Next Fractals overview and features
- **[🆕 GCP Account Setup](../docs/GCP_SETUP.md)** - New to Google Cloud? Start here!
- **[🐳 TF-DevOps Container](../tf-devops/README.md)** - Containerized deployment toolkit (recommended)
- **[🛠️ Developer Guide](../CLAUDE.md)** - Development setup and architecture

## Prerequisites

> **🆕 New to Google Cloud?** Follow our [GCP Account Setup Guide](../docs/GCP_SETUP.md) for complete instructions.

**Required:**
1. **Google Cloud Project** with billing enabled
2. **Project ID** (note this down!)
3. **Authentication** set up (interactive login or service account)

**Automatically handled by TF-DevOps:**
- Google Cloud CLI 
- Terraform (version 1.7+)
- Docker CLI
- Required API enablement:
  - Cloud Run API
  - Artifact Registry API  
  - Cloud Build API (if using CI/CD)

## Quick Start

> **💡 Recommended**: Use the [TF-DevOps container](../tf-devops/README.md) for simplified deployment with all tools pre-installed.

### Option 1: Using TF-DevOps Container (Recommended)

```bash
# From project root
export GCP_PROJECT="your-project-id"
./deploy.sh build
./deploy.sh auth
./deploy.sh deploy
```

See the [TF-DevOps documentation](../tf-devops/README.md) for detailed instructions.

### Option 2: Manual Terraform Deployment

If you prefer to run Terraform directly:

#### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

#### 2. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your project ID and preferences
```

#### 3. Build and Push Docker Image

```bash
# From the project root
cd ..

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and push image
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/next-fractals-docker/next-fractals:latest .
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/next-fractals-docker/next-fractals:latest
```

#### 4. Deploy Infrastructure

```bash
cd terraform
terraform plan
terraform apply

# Update with Docker image
terraform apply -var="docker_image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/next-fractals-docker/next-fractals:latest"
```

## Deployment Workflow

### Option 1: Manual Deployment

1. Run `terraform apply` to create infrastructure
2. Build and push Docker image using commands from Terraform output
3. Update Cloud Run service with the new image

### Option 2: CI/CD with Cloud Build

1. Set `enable_cicd = true` in terraform.tfvars
2. Configure GitHub repository details
3. Connect your GitHub repository to Cloud Build
4. Push to main branch triggers automatic deployment

## Configuration Options

### Performance Tuning

- **min_instances**: Set to 0 for cost savings (scale to zero)
- **max_instances**: Limit maximum scaling
- **cpu_limit**: Adjust CPU allocation (1, 2, 4, etc.)
- **memory_limit**: Adjust memory (512Mi, 1Gi, 2Gi, etc.)

### Cost Optimization

- **cpu_throttling**: Enable to allocate CPU only during requests
- **min_instances = 0**: Allow scale to zero when not in use
- **startup_cpu_boost**: Balance between cold start speed and cost

### Security

- **allow_unauthenticated**: Set to false to require authentication
- **ingress_type**: Control traffic sources (all, internal, internal-and-cloud-load-balancing)
- **service_account_email**: Use custom service account for least privilege

## Custom Domain Setup

1. Verify domain ownership in Google Search Console
2. Set `custom_domain` in terraform.tfvars
3. Run `terraform apply`
4. Update DNS records as instructed by GCP

## Monitoring and Logs

View logs and metrics:

```bash
# View service logs
gcloud run services logs read next-fractals --region=us-central1

# Stream logs
gcloud run services logs tail next-fractals --region=us-central1

# View service details
gcloud run services describe next-fractals --region=us-central1
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

## Troubleshooting

### Common Issues

1. **"API not enabled" error**: Ensure required APIs are enabled in your GCP project
2. **"Permission denied" error**: Check that your gcloud account has necessary IAM roles
3. **Docker push fails**: Ensure you've authenticated Docker with `gcloud auth configure-docker`
4. **Cold starts are slow**: Enable `startup_cpu_boost` and consider setting `min_instances = 1`

### Required IAM Roles

Your Google Cloud account needs these roles:
- Cloud Run Admin
- Artifact Registry Admin
- Service Account User
- Cloud Build Editor (if using CI/CD)

## Cost Estimation

With default settings (scale to zero, 512Mi RAM, 1 vCPU):
- **No traffic**: ~$0/month
- **Light traffic** (1000 requests/day): ~$1-5/month
- **Moderate traffic** (10,000 requests/day): ~$10-30/month

Actual costs depend on request duration, data transfer, and resource configuration.

## Support

For issues or questions:
1. Check Cloud Run logs for application errors
2. Review Terraform output for deployment issues
3. Consult [Cloud Run documentation](https://cloud.google.com/run/docs)
4. Review [Terraform Google Provider docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs)