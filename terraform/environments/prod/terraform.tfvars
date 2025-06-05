project_id  = "argos-434718"
region      = "us-central1"
environment = "prod"
image_tag   = "latest"

# Cloud Run Configuration
cloud_run_cpu    = "4"
cloud_run_memory = "8Gi"
min_instances    = 1
max_instances    = 100

# Redis Configuration
redis_tier      = "STANDARD_HA"
redis_memory_gb = 4

# Storage Configuration
storage_lifecycle_days = 90

# CORS Configuration
cors_origins = [
  "https://project89.oneirocom.ai",
  "https://app.project89.oneirocom.ai",
  "https://oneirocom.ai"
] 