#!/bin/bash

# tf-devops.sh - Helper script for using the Terraform DevOps container
# This script simplifies building and running the tf-devops container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="tf-devops"
IMAGE_TAG="latest"
CONTAINER_NAME="tf-devops-runner"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"
TF_DEVOPS_DIR="$(cd "$(dirname "$0")" && pwd)"

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $1"; }

print_usage() {
    echo "Usage: $0 [COMMAND] [ARGS...]"
    echo ""
    echo "Commands:"
    echo "  build              - Build the tf-devops Docker image"
    echo "  shell              - Start an interactive shell in the container"
    echo "  plan               - Run terraform plan"
    echo "  apply              - Run terraform apply"
    echo "  destroy            - Run terraform destroy"
    echo "  init               - Initialize Terraform"
    echo "  validate           - Validate Terraform configuration"
    echo "  fmt                - Format Terraform files"
    echo "  output             - Show Terraform outputs"
    echo "  run [cmd]          - Run a custom command in the container"
    echo "  auth               - Authenticate with GCP interactively"
    echo "  docker-build       - Build and push the application Docker image"
    echo "  deploy             - Full deployment (terraform apply + docker build/push)"
    echo ""
    echo "Environment Variables:"
    echo "  GCP_PROJECT        - Your GCP project ID"
    echo "  GCP_REGION         - GCP region (default: us-central1)"
    echo "  TF_VAR_project_id  - Terraform variable for project ID"
    echo ""
    echo "Examples:"
    echo "  $0 build                    # Build the container"
    echo "  $0 plan                     # Show deployment plan"
    echo "  $0 apply                    # Deploy infrastructure"
    echo "  $0 shell                    # Interactive shell"
    echo "  $0 run gcloud auth list     # Run gcloud command"
}

# Build the tf-devops Docker image
build_image() {
    log_info "Building tf-devops Docker image..."
    docker build -f "$TF_DEVOPS_DIR/Dockerfile" -t "$IMAGE_NAME:$IMAGE_TAG" "$TF_DEVOPS_DIR"
    log_info "Successfully built $IMAGE_NAME:$IMAGE_TAG"
}

# Check if image exists
check_image() {
    if ! docker image inspect "$IMAGE_NAME:$IMAGE_TAG" &> /dev/null; then
        log_warn "Image $IMAGE_NAME:$IMAGE_TAG not found. Building it now..."
        build_image
    fi
}

# Prepare Docker run arguments
prepare_docker_args() {
    local docker_args="-it --rm"
    docker_args="$docker_args --name $CONTAINER_NAME"
    docker_args="$docker_args -v $PROJECT_ROOT:/workspace"
    docker_args="$docker_args -v $HOME/.config/gcloud:/home/tfuser/.config/gcloud"
    
    # Mount Docker socket if available (for docker commands)
    if [ -S /var/run/docker.sock ]; then
        docker_args="$docker_args -v /var/run/docker.sock:/var/run/docker.sock"
    fi
    
    # Pass through environment variables
    [ -n "$GCP_PROJECT" ] && docker_args="$docker_args -e GCP_PROJECT=$GCP_PROJECT"
    [ -n "$GCP_REGION" ] && docker_args="$docker_args -e GCP_REGION=$GCP_REGION"
    [ -n "$TF_VAR_project_id" ] && docker_args="$docker_args -e TF_VAR_project_id=$TF_VAR_project_id"
    
    # Pass through all TF_VAR_ environment variables
    while IFS= read -r var; do
        docker_args="$docker_args -e $var"
    done < <(env | grep ^TF_VAR_ || true)
    
    # Handle service account credentials
    if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        docker_args="$docker_args -v $GOOGLE_APPLICATION_CREDENTIALS:/tmp/gcp-key.json"
        docker_args="$docker_args -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcp-key.json"
    elif [ -n "$GOOGLE_CREDENTIALS" ]; then
        docker_args="$docker_args -e GOOGLE_CREDENTIALS=$GOOGLE_CREDENTIALS"
    fi
    
    echo "$docker_args"
}

# Run command in container
run_in_container() {
    check_image
    local docker_args=$(prepare_docker_args)
    log_debug "Running: docker run $docker_args $IMAGE_NAME:$IMAGE_TAG $*"
    eval "docker run $docker_args $IMAGE_NAME:$IMAGE_TAG $*"
}

# Authenticate with GCP interactively
auth_gcp() {
    log_info "Starting GCP authentication..."
    run_in_container bash -c "gcloud auth login --no-launch-browser && gcloud auth application-default login --no-launch-browser"
}

# Build and push application Docker image
docker_build_app() {
    log_info "Building and pushing application Docker image..."
    
    if [ -z "$GCP_PROJECT" ]; then
        log_error "GCP_PROJECT environment variable is required"
        exit 1
    fi
    
    if [ -z "$GCP_REGION" ]; then
        GCP_REGION="us-central1"
        log_warn "GCP_REGION not set, using default: $GCP_REGION"
    fi
    
    local image_url="$GCP_REGION-docker.pkg.dev/$GCP_PROJECT/next-fractals-docker/next-fractals:latest"
    
    log_info "Building Docker image: $image_url"
    docker build -t "$image_url" "$PROJECT_ROOT"
    
    log_info "Pushing image to Artifact Registry..."
    docker push "$image_url"
    
    log_info "Image successfully pushed: $image_url"
    echo ""
    echo "To deploy this image, run:"
    echo "  $0 apply -var=\"docker_image=$image_url\""
}

# Full deployment process
full_deploy() {
    log_info "Starting full deployment process..."
    
    # First apply Terraform to create infrastructure
    log_info "Step 1: Creating infrastructure with Terraform..."
    run_in_container terraform apply -auto-approve
    
    # Build and push Docker image
    log_info "Step 2: Building and pushing Docker image..."
    docker_build_app
    
    # Update Cloud Run with new image
    log_info "Step 3: Updating Cloud Run service with new image..."
    local image_url="$GCP_REGION-docker.pkg.dev/$GCP_PROJECT/next-fractals-docker/next-fractals:latest"
    run_in_container terraform apply -auto-approve -var="docker_image=$image_url"
    
    log_info "Deployment complete!"
    run_in_container terraform output
}

# Main script logic
main() {
    case "${1:-}" in
        build)
            build_image
            ;;
        shell|bash)
            run_in_container bash
            ;;
        plan)
            shift
            run_in_container terraform plan "$@"
            ;;
        apply)
            shift
            run_in_container terraform apply "$@"
            ;;
        destroy)
            shift
            run_in_container terraform destroy "$@"
            ;;
        init)
            shift
            run_in_container terraform init "$@"
            ;;
        validate)
            run_in_container terraform validate
            ;;
        fmt)
            run_in_container terraform fmt
            ;;
        output)
            shift
            run_in_container terraform output "$@"
            ;;
        auth)
            auth_gcp
            ;;
        docker-build)
            docker_build_app
            ;;
        deploy)
            full_deploy
            ;;
        run)
            shift
            run_in_container "$@"
            ;;
        help|--help|-h)
            print_usage
            ;;
        "")
            run_in_container
            ;;
        *)
            log_error "Unknown command: $1"
            print_usage
            exit 1
            ;;
    esac
}

main "$@"