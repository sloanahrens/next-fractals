# Input variables for Cloud Run deployment

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run deployment"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "next-fractals"
}

variable "docker_image" {
  description = "Docker image URL (leave empty for initial deployment)"
  type        = string
  default     = ""
}

# Service configuration
variable "cpu_limit" {
  description = "CPU limit for the container (e.g., '1', '2', '1000m')"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit for the container (e.g., '512Mi', '1Gi', '2Gi')"
  type        = string
  default     = "512Mi"
}

variable "min_instances" {
  description = "Minimum number of container instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of container instances"
  type        = number
  default     = 100
}

variable "max_concurrency" {
  description = "Maximum number of requests per container instance"
  type        = number
  default     = 80
}

# Security and access
variable "allow_unauthenticated" {
  description = "Allow unauthenticated access to the service"
  type        = bool
  default     = true
}

variable "ingress_type" {
  description = "Ingress settings: 'all' (internet + internal), 'internal' (VPC only), 'internal-and-cloud-load-balancing'"
  type        = string
  default     = "all"
}

variable "service_account_email" {
  description = "Service account email for the Cloud Run service (optional)"
  type        = string
  default     = ""
}

# Performance optimization
variable "cpu_throttling" {
  description = "Enable CPU throttling (allocate CPU only during request processing)"
  type        = bool
  default     = true
}

variable "startup_cpu_boost" {
  description = "Enable startup CPU boost for faster cold starts"
  type        = bool
  default     = true
}

# Environment variables
variable "env_vars" {
  description = "Environment variables for the container"
  type        = map(string)
  default     = {}
}

# Custom domain
variable "custom_domain" {
  description = "Custom domain for the Cloud Run service (optional)"
  type        = string
  default     = ""
}

# CI/CD Configuration
variable "enable_cicd" {
  description = "Enable Cloud Build trigger for automatic deployments"
  type        = bool
  default     = false
}

variable "github_owner" {
  description = "GitHub repository owner (username or organization)"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "next-fractals"
}