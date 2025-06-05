output "cloud_run_url" {
  description = "URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.app.status[0].url
}

output "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_service.app.name
}

output "artifact_registry_url" {
  description = "URL of the Artifact Registry repository"
  value       = "https://${var.region}-docker.pkg.dev/${var.project_id}/project89-registry"
}

output "redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.cache.host
  sensitive   = true
}

output "redis_port" {
  description = "Redis instance port"
  value       = google_redis_instance.cache.port
}

output "storage_bucket_name" {
  description = "Name of the storage bucket"
  value       = google_storage_bucket.file_storage.name
}

output "storage_bucket_url" {
  description = "URL of the storage bucket"
  value       = google_storage_bucket.file_storage.url
}

output "vpc_connector_name" {
  description = "VPC connector name for Cloud Run"
  value       = google_vpc_access_connector.connector.name
}

output "secret_names" {
  description = "Names of created secrets in Secret Manager"
  value = {
    database_url = google_secret_manager_secret.database_url.secret_id
    jwt_secret   = google_secret_manager_secret.jwt_secret.secret_id
    openai_key   = google_secret_manager_secret.openai_key.secret_id
    google_ai_key = google_secret_manager_secret.google_ai_key.secret_id
    helius_key   = google_secret_manager_secret.helius_key.secret_id
  }
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
} 