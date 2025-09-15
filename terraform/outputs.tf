# Output values for the Cloud Run deployment

output "service_url" {
  description = "URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.app.status[0].url
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_service.app.name
}

output "service_location" {
  description = "Location/region of the Cloud Run service"
  value       = google_cloud_run_service.app.location
}

output "service_id" {
  description = "Unique identifier of the Cloud Run service"
  value       = google_cloud_run_service.app.id
}

output "latest_revision" {
  description = "Name of the latest revision"
  value       = google_cloud_run_service.app.status[0].latest_ready_revision_name
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository URL for Docker images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
}

output "docker_image_url" {
  description = "Full Docker image URL for deployment"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.app_name}:latest"
}

output "custom_domain_url" {
  description = "Custom domain URL (if configured)"
  value       = var.custom_domain != "" ? "https://${var.custom_domain}" : "Not configured"
}

output "deployment_instructions" {
  description = "Instructions for deploying the Docker image"
  value = <<-EOT
    To deploy your application:
    
    1. Build the Docker image:
       docker build -t ${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.app_name}:latest .
    
    2. Configure Docker authentication:
       gcloud auth configure-docker ${var.region}-docker.pkg.dev
    
    3. Push the image to Artifact Registry:
       docker push ${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.app_name}:latest
    
    4. Update the Cloud Run service (if not using CI/CD):
       gcloud run deploy ${var.app_name} \
         --image ${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.app_name}:latest \
         --region ${var.region}
  EOT
}