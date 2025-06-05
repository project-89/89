terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "storage-api.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = false
  disable_on_destroy        = false
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "docker_registry" {
  project       = var.project_id
  location      = var.region
  repository_id = "project89-registry"
  description   = "Docker images for Project89 server"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# Redis instance for caching
resource "google_redis_instance" "cache" {
  project        = var.project_id
  name           = "project89-cache-${var.environment}"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_gb
  location_id    = "${var.region}-a"
  region         = var.region

  auth_enabled               = true
  transit_encryption_mode    = "SERVER_AUTH"
  authorized_network         = google_compute_network.vpc.id
  connect_mode              = "PRIVATE_SERVICE_ACCESS"

  depends_on = [
    google_project_service.apis,
    google_service_networking_connection.private_vpc_connection
  ]
}

# VPC for Redis private connection
resource "google_compute_network" "vpc" {
  project                 = var.project_id
  name                    = "project89-vpc-${var.environment}"
  auto_create_subnetworks = false
}

# Subnet for the VPC
resource "google_compute_subnetwork" "subnet" {
  project       = var.project_id
  name          = "project89-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Private service access for Redis
resource "google_compute_global_address" "private_ip_address" {
  project       = var.project_id
  name          = "project89-private-ip-${var.environment}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# VPC Access Connector for Cloud Run
resource "google_vpc_access_connector" "connector" {
  project       = var.project_id
  name          = "project89-connector-${var.environment}"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
  
  depends_on = [google_project_service.apis]
}

# Storage bucket for file uploads
resource "google_storage_bucket" "file_storage" {
  project  = var.project_id
  name     = "project89-storage-${var.environment}-${random_id.bucket_suffix.hex}"
  location = var.region

  uniform_bucket_level_access = true
  
  cors {
    origin          = var.cors_origins
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = var.storage_lifecycle_days
    }
    action {
      type = "Delete"
    }
  }
}

# Random suffix for bucket name to ensure uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# Cloud Run service
resource "google_cloud_run_service" "app" {
  project  = var.project_id
  name     = "project89-server-${var.environment}"
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.name
        "run.googleapis.com/vpc-access-egress" = "private-ranges-only"
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }

    spec {
      container_concurrency = 1000
      timeout_seconds      = 300

      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/project89-registry/project89-server:${var.image_tag}"

        resources {
          limits = {
            cpu    = var.cloud_run_cpu
            memory = var.cloud_run_memory
          }
        }

        ports {
          container_port = 8080
        }

        env {
          name  = "NODE_ENV"
          value = var.environment
        }

        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "REDIS_URL"
          value = "redis://:${google_redis_instance.cache.auth_string}@${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
        }

        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.jwt_secret.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "OPENAI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.openai_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "GOOGLE_AI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.google_ai_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "HELIUS_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.helius_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name  = "GCS_BUCKET_NAME"
          value = google_storage_bucket.file_storage.name
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.docker_registry
  ]
}

# Allow unauthenticated invocations
resource "google_cloud_run_service_iam_binding" "public" {
  project  = var.project_id
  location = google_cloud_run_service.app.location
  service  = google_cloud_run_service.app.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

# Secret Manager secrets
resource "google_secret_manager_secret" "database_url" {
  project   = var.project_id
  secret_id = "project89-database-url-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "jwt_secret" {
  project   = var.project_id
  secret_id = "project89-jwt-secret-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "openai_key" {
  project   = var.project_id
  secret_id = "project89-openai-key-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "google_ai_key" {
  project   = var.project_id
  secret_id = "project89-google-ai-key-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "helius_key" {
  project   = var.project_id
  secret_id = "project89-helius-key-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
} 