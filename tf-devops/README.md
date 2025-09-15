# TF-DevOps: Terraform Deployment Container

A lightweight Alpine-based Docker container that includes all tools needed to deploy the [Next Fractals](../README.md) application to GCP Cloud Run. This container is independent of the application and runs with your code mounted as a volume.

## 📚 Related Documentation

- **[⬅️ Back to Main Project](../README.md)** - Next Fractals overview and quick deployment
- **[📋 Terraform Configuration](../terraform/README.md)** - Infrastructure as Code details
- **[🛠️ Developer Guide](../CLAUDE.md)** - Development setup and architecture

> **💡 Quick Start**: From the project root, run `./deploy.sh build && ./deploy.sh deploy`

## Features

- **Terraform** (v1.7.0) - Infrastructure as Code
- **Google Cloud SDK** - GCP CLI and authentication
- **Docker CLI** - For building and pushing images
- **Helper utilities** - bash, git, jq, curl
- **Non-root user** - Security best practice
- **Auto-initialization** - Automatic Terraform init and gcloud auth

## Quick Start

### 1. Build the Container

```bash
# Using the helper script
./terraform/tf-devops.sh build

# Or manually with Docker
docker build -f terraform/Dockerfile.tf-devops -t tf-devops terraform/
```

### 2. Set Environment Variables

```bash
export GCP_PROJECT="your-project-id"
export GCP_REGION="us-central1"
```

### 3. Authenticate with GCP

```bash
# Interactive authentication
./terraform/tf-devops.sh auth

# Or with service account
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 4. Deploy Infrastructure

```bash
# Show deployment plan
./terraform/tf-devops.sh plan

# Apply infrastructure
./terraform/tf-devops.sh apply

# Full deployment (infrastructure + Docker image)
./terraform/tf-devops.sh deploy
```

## Usage Examples

### Using the Helper Script (`tf-devops.sh`)

```bash
# Build the container
./tf-devops/tf-devops.sh build

# Interactive shell
./tf-devops/tf-devops.sh shell

# Terraform commands
./tf-devops/tf-devops.sh init
./tf-devops/tf-devops.sh plan
./tf-devops/tf-devops.sh apply
./tf-devops/tf-devops.sh destroy
./tf-devops/tf-devops.sh output

# Build and push application Docker image
./tf-devops/tf-devops.sh docker-build

# Full deployment (Terraform + Docker build/push)
./tf-devops/tf-devops.sh deploy

# Run custom commands
./tf-devops/tf-devops.sh run terraform state list
./tf-devops/tf-devops.sh run gcloud projects list
```

### Direct Docker Usage

```bash
# Build the image
docker build -f tf-devops/Dockerfile -t tf-devops tf-devops/

# Run with mounted volumes
docker run -it --rm \
  -v $(pwd):/workspace \
  -v ~/.config/gcloud:/home/tfuser/.config/gcloud \
  -e GCP_PROJECT="your-project-id" \
  -e GCP_REGION="us-central1" \
  tf-devops terraform plan

# Interactive shell
docker run -it --rm \
  -v $(pwd):/workspace \
  -v ~/.config/gcloud:/home/tfuser/.config/gcloud \
  tf-devops bash

# With service account
docker run -it --rm \
  -v $(pwd):/workspace \
  -v /path/to/key.json:/tmp/gcp-key.json \
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcp-key.json \
  -e GCP_PROJECT="your-project-id" \
  tf-devops terraform apply
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GCP_PROJECT` | Your GCP project ID | Yes |
| `GCP_REGION` | GCP region for deployment | No (default: us-central1) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key file | No* |
| `GOOGLE_CREDENTIALS` | Service account key JSON content | No* |
| `TF_VAR_*` | Any Terraform variables | No |

*One authentication method is required (interactive login or service account)

## Authentication Methods

### 1. Interactive Login (Development)

```bash
./terraform/tf-devops.sh auth
# Follow the prompts to authenticate
```

### 2. Service Account (CI/CD)

```bash
# Option A: Mount key file
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

# Option B: Pass key content
export GOOGLE_CREDENTIALS='{"type":"service_account",...}'
```

### 3. Existing gcloud Config

The container automatically mounts `~/.config/gcloud` to use existing authentication.

## Complete Deployment Workflow

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/sloanahrens/next-fractals.git
cd next-fractals

# 2. Build the tf-devops container
./deploy.sh build
# OR: ./tf-devops/tf-devops.sh build

# 3. Configure variables
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings

# 4. Set environment
export GCP_PROJECT="your-project-id"
export GCP_REGION="us-central1"

# 5. Authenticate
../deploy.sh auth
# OR: ../tf-devops/tf-devops.sh auth
```

### Deploy Application

```bash
# Option 1: Automated full deployment
../deploy.sh deploy
# OR: ../tf-devops/tf-devops.sh deploy

# Option 2: Step-by-step deployment
# a. Create infrastructure
../deploy.sh apply

# b. Build and push Docker image
../deploy.sh docker-build

# c. Update Cloud Run with new image
../deploy.sh apply -var="docker_image=$GCP_REGION-docker.pkg.dev/$GCP_PROJECT/next-fractals-docker/next-fractals:latest"
```

### Update Application

```bash
# After making code changes
../deploy.sh docker-build
../deploy.sh apply -auto-approve
```

### Destroy Infrastructure

```bash
../deploy.sh destroy
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build tf-devops container
        run: docker build -f tf-devops/Dockerfile -t tf-devops tf-devops/
      
      - name: Deploy to Cloud Run
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
          GCP_PROJECT: ${{ secrets.GCP_PROJECT }}
          GCP_REGION: us-central1
        run: |
          docker run --rm \
            -v $(pwd):/workspace \
            -e GOOGLE_CREDENTIALS \
            -e GCP_PROJECT \
            -e GCP_REGION \
            tf-devops bash -c "
              terraform apply -auto-approve && \
              docker build -t \$GCP_REGION-docker.pkg.dev/\$GCP_PROJECT/next-fractals-docker/next-fractals:latest /workspace && \
              docker push \$GCP_REGION-docker.pkg.dev/\$GCP_PROJECT/next-fractals-docker/next-fractals:latest && \
              terraform apply -auto-approve -var=\"docker_image=\$GCP_REGION-docker.pkg.dev/\$GCP_PROJECT/next-fractals-docker/next-fractals:latest\"
            "
```

### GitLab CI Example

```yaml
deploy:
  image: docker:latest
  services:
    - docker:dind
  variables:
    GCP_PROJECT: $CI_PROJECT_NAME
    GCP_REGION: us-central1
  script:
    - docker build -f tf-devops/Dockerfile -t tf-devops tf-devops/
    - |
      docker run --rm \
        -v $(pwd):/workspace \
        -e GOOGLE_CREDENTIALS="$GCP_SA_KEY" \
        -e GCP_PROJECT \
        -e GCP_REGION \
        tf-devops terraform apply -auto-approve
```

## Troubleshooting

### Container can't find Terraform files

Ensure you're running from the project root:
```bash
cd /path/to/next-fractals
./terraform/tf-devops.sh plan
```

### Authentication errors

```bash
# Check current authentication
./tf-devops/tf-devops.sh run gcloud auth list

# Re-authenticate
./tf-devops/tf-devops.sh auth
```

### Docker socket permission denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### Terraform state issues

```bash
# Reinitialize Terraform
./tf-devops/tf-devops.sh init -upgrade

# Check state
./tf-devops/tf-devops.sh run terraform state list
```

## Container Details

- **Base Image**: Alpine Linux 3.19 (minimal size)
- **Size**: ~500MB (includes Terraform, gcloud SDK, Docker CLI)
- **User**: Runs as non-root user `tfuser` (UID 1000)
- **Working Directory**: `/workspace` (your code is mounted here)
- **gcloud Config**: Persisted at `~/.config/gcloud`

## Security Considerations

1. **Non-root execution**: Container runs as unprivileged user
2. **Minimal base image**: Alpine Linux reduces attack surface
3. **No embedded credentials**: Authentication via environment or mounted files
4. **Volume isolation**: Only specified directories are accessible

## License

This container and associated scripts are part of the Next Fractals project.