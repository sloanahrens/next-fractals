# Terraform configuration for deploying Next Fractals to GCP Cloud Run

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  # Optional: Configure backend for remote state storage
  # Uncomment and configure if you want to store state in GCS
  # backend "gcs" {
  #   bucket = "your-terraform-state-bucket"
  #   prefix = "next-fractals/terraform/state"
  # }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "cloud_run_api" {
  service = "run.googleapis.com"
  
  disable_on_destroy = false
}

resource "google_project_service" "container_registry_api" {
  service = "containerregistry.googleapis.com"
  
  disable_on_destroy = false
}

resource "google_project_service" "cloud_build_api" {
  service = "cloudbuild.googleapis.com"
  
  disable_on_destroy = false
}

# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "${var.app_name}-docker"
  description   = "Docker repository for ${var.app_name}"
  format        = "DOCKER"
  
  cleanup_policy_dry_run = false
  
  depends_on = [google_project_service.container_registry_api]
}

# Cloud Build trigger for automatic deployment on push to main branch
resource "google_cloudbuild_trigger" "deploy_trigger" {
  count = var.enable_cicd ? 1 : 0
  
  name        = "${var.app_name}-deploy"
  description = "Deploy ${var.app_name} to Cloud Run on push to main"
  
  # GitHub configuration (update with your repo details)
  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = "^main$|^master$"
    }
  }
  
  # Build configuration
  build {
    # Build Docker image
    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "build",
        "-t", "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.app_name}:$COMMIT_SHA",
        "-t", "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.app_name}:latest",
        "."
      ]
    }
    
    # Push Docker image to Artifact Registry
    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "push",
        "--all-tags",
        "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.app_name}"
      ]
    }
    
    # Deploy to Cloud Run
    step {
      name = "gcr.io/cloud-builders/gcloud"
      args = [
        "run", "deploy", var.app_name,
        "--image", "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.app_name}:$COMMIT_SHA",
        "--region", var.region,
        "--platform", "managed",
        "--allow-unauthenticated"
      ]
    }
  }
  
  depends_on = [
    google_project_service.cloud_build_api,
    google_artifact_registry_repository.docker_repo
  ]
}

# Cloud Run service
resource "google_cloud_run_service" "app" {
  name     = var.app_name
  location = var.region
  
  metadata {
    annotations = {
      "run.googleapis.com/ingress" = var.ingress_type
    }
  }
  
  template {
    spec {
      containers {
        # Initial image - will be updated by Cloud Build or manual deployment
        image = var.docker_image != "" ? var.docker_image : "gcr.io/cloudrun/hello"
        
        # Container resources
        resources {
          limits = {
            cpu    = var.cpu_limit
            memory = var.memory_limit
          }
        }
        
        # Environment variables
        dynamic "env" {
          for_each = var.env_vars
          content {
            name  = env.key
            value = env.value
          }
        }
        
        # Port configuration
        ports {
          container_port = 8080
        }
      }
      
      # Service account (optional)
      service_account_name = var.service_account_email
      
      # Concurrency and scaling
      container_concurrency = var.max_concurrency
    }
    
    metadata {
      annotations = {
        # Autoscaling configuration
        "autoscaling.knative.dev/minScale" = tostring(var.min_instances)
        "autoscaling.knative.dev/maxScale" = tostring(var.max_instances)
        
        # CPU allocation during request processing only (for cost optimization)
        "run.googleapis.com/cpu-throttling" = var.cpu_throttling ? "true" : "false"
        
        # Startup CPU boost for faster cold starts
        "run.googleapis.com/startup-cpu-boost" = var.startup_cpu_boost ? "true" : "false"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [google_project_service.cloud_run_api]
}

# IAM policy to allow public access (if enabled)
resource "google_cloud_run_service_iam_binding" "public_access" {
  count = var.allow_unauthenticated ? 1 : 0
  
  location = google_cloud_run_service.app.location
  project  = google_cloud_run_service.app.project
  service  = google_cloud_run_service.app.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

# Optional: Custom domain mapping
resource "google_cloud_run_domain_mapping" "custom_domain" {
  count = var.custom_domain != "" ? 1 : 0
  
  location = var.region
  name     = var.custom_domain
  
  metadata {
    namespace = var.project_id
  }
  
  spec {
    route_name = google_cloud_run_service.app.name
  }
  
  depends_on = [google_cloud_run_service.app]
}