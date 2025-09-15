#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're in the terraform directory
if [ ! -f "main.tf" ] && [ -d "terraform" ]; then
    log_info "Switching to terraform directory..."
    cd terraform
elif [ ! -f "main.tf" ]; then
    log_error "No Terraform configuration found. Please mount your project directory."
    log_info "Usage: docker run -v /path/to/project:/workspace tf-devops"
    exit 1
fi

# Initialize gcloud if credentials are provided
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    log_info "Authenticating with service account..."
    gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
elif [ -n "$GOOGLE_CREDENTIALS" ]; then
    log_info "Authenticating with provided credentials..."
    echo "$GOOGLE_CREDENTIALS" > /tmp/gcp-key.json
    gcloud auth activate-service-account --key-file=/tmp/gcp-key.json
    rm /tmp/gcp-key.json
fi

# Set default project if provided
if [ -n "$GCP_PROJECT" ]; then
    log_info "Setting default project to: $GCP_PROJECT"
    gcloud config set project "$GCP_PROJECT"
fi

# Configure Docker for Artifact Registry if region is provided
if [ -n "$GCP_REGION" ]; then
    log_info "Configuring Docker authentication for $GCP_REGION..."
    gcloud auth configure-docker "$GCP_REGION-docker.pkg.dev" --quiet || true
fi

# Initialize Terraform if not already initialized
if [ ! -d ".terraform" ]; then
    log_info "Initializing Terraform..."
    terraform init
else
    log_info "Terraform already initialized. Run 'terraform init -upgrade' to update providers."
fi

# If no command provided, show help
if [ $# -eq 0 ]; then
    echo ""
    log_info "Terraform DevOps Container for GCP Cloud Run Deployment"
    echo ""
    echo "Available commands:"
    echo "  plan                 - Show deployment plan"
    echo "  apply                - Apply infrastructure changes"
    echo "  destroy              - Destroy all resources"
    echo "  output               - Show deployment outputs"
    echo "  validate             - Validate configuration"
    echo "  fmt                  - Format configuration files"
    echo "  init                 - Initialize Terraform"
    echo "  bash                 - Start bash shell"
    echo "  <terraform command>  - Run any terraform command"
    echo "  <gcloud command>     - Run any gcloud command"
    echo ""
    echo "Environment variables:"
    echo "  GCP_PROJECT                    - GCP project ID"
    echo "  GCP_REGION                     - GCP region (e.g., us-central1)"
    echo "  GOOGLE_APPLICATION_CREDENTIALS - Path to service account key file"
    echo "  GOOGLE_CREDENTIALS             - Service account key JSON content"
    echo ""
    exit 0
fi

# Execute the provided command
exec "$@"