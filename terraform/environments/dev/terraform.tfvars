project_id  = "argos-434718"
region      = "us-central1"
environment = "dev"
image_tag   = "dev-latest"

# Cloud Run Configuration
cloud_run_cpu    = "1"
cloud_run_memory = "2Gi"
min_instances    = 0
max_instances    = 10

# Redis Configuration
redis_tier      = "BASIC"
redis_memory_gb = 1

# Storage Configuration
storage_lifecycle_days = 30

# CORS Configuration
cors_origins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
  "http://localhost:3001",
  "https://dev-project89.oneirocom.ai"
] 