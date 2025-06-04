# Argos Server Deployment Infrastructure Analysis

## Current Infrastructure Overview

### 🏗️ **GCP Infrastructure (Production)**

**Project ID:** `argos-434718`  
**Region:** `us-central1`  
**Provider:** Google Cloud Platform

### 📊 **Database Architecture**

#### **Production Database (GCP Compute Instance)**
- **Type:** MongoDB running on Google Compute Engine
- **Instance:** `mongodb-dev` (e2-medium machine type)
- **Network:** Custom VPC (`mongodb-network-dev`)
- **Storage:** 50GB disk
- **Zone:** `us-central1-a`
- **Access:** External IP with firewall rules (ports 22, 27017)
- **Authentication:** Custom user `argosUser` with password stored in `/root/mongodb_credentials.txt`

#### **Local Development Database**
- **Type:** MongoDB via Docker Compose
- **Container:** `argos-mongodb` (mongo:5.0 image)
- **Port:** 27017 (mapped to localhost)
- **Storage:** Docker volume `mongodb_data`
- **Authentication:** None (for easier testing)

### 🚀 **Application Deployment**

#### **Production (Cloud Functions v2)**
1. **Main API Function**
   - **Name:** `argos-api`
   - **Runtime:** Node.js 18
   - **Memory:** 256MB
   - **Timeout:** 60 seconds
   - **Max Instances:** 100
   - **URL:** `https://us-central1-argos-434718.cloudfunctions.net/argos-api`

2. **Scheduled Cleanup Function**
   - **Name:** `argos-scheduled-cleanup` 
   - **Runtime:** Node.js 18
   - **Memory:** 256MB
   - **Schedule:** Daily at midnight UTC (via Cloud Scheduler)

#### **Development/Local**
- **Type:** Express server running directly
- **Port:** 3000 (configurable via PORT env var)
- **Database:** Local MongoDB (Docker) or remote MongoDB

### 🔐 **Security & Configuration**

#### **Environment Variables (Production)**
```bash
FIRESTORE_PROJECT_ID=argos-434718
NODE_ENV=production
API_KEY_ENCRYPTION_KEY=a0PJ2Y5qjvkL7LVmer6f1OACff+0kMjMPOJ5YkGS+JM=
API_KEY_ENCRYPTION_IV=G3z5x+kLY3xFOrfaQUuhnA==
```

#### **Key Service Account**
- **File:** `terraform-key.json`
- **Purpose:** Terraform authentication with GCP
- **Location:** `/terraform/terraform-key.json`

#### **CORS Configuration**
```json
{
  "allowed_origins": "https://test.com,https://example.com,https://newsite.com",
  "dev_origins": [
    "http://localhost:5173", // Vite dev server
    "http://localhost:3000", // React dev server  
    "http://localhost:5000"  // Firebase dev server
  ]
}
```

### 📋 **Database Collections (MongoDB)**

Your MongoDB database (`argosDB`) contains these collections:
- `accounts` - User account data
- `profiles` - User profiles with wallet addresses
- `agents` - AI agent configurations
- `agent_invites` - Agent invitation system
- `capabilities` - User skills/capabilities
- `fingerprints` - Browser fingerprinting data
- `impressions` - User interaction tracking
- `knowledge` - Knowledge base entries
- `knowledge_shares` - Knowledge sharing permissions
- `onboarding` - User onboarding progress
- `presences` - User presence/activity
- `prices` - Cryptocurrency price data
- `stats` - Analytics and statistics
- `tags` - Content tagging system
- `visits` - Visit tracking
- `skills` - Available skills registry

### 🔧 **Deployment Process**

#### **Current Deployment Pipeline**
1. **Build:** TypeScript compilation (`tsc`) + copy public assets
2. **Package:** Zip functions for Cloud Functions deployment
3. **Upload:** Source code to Cloud Storage bucket
4. **Deploy:** Cloud Functions v2 via Terraform
5. **Monitor:** Cloud Logging + error alerting to `tech@magickml.com`

#### **Scripts Available**
- `npm run deploy` - Development deployment
- `npm run deploy:prod` - Production deployment  
- `npm run mongodb` - MongoDB utilities (connection test, setup, etc.)

### 🌍 **Network & Monitoring**

#### **Firewall & Access**
- Cloud Functions: Public HTTPS endpoints
- MongoDB: Custom firewall allowing ports 22, 27017
- CORS: Configured for specific domains + localhost for development

#### **Logging & Monitoring**
- **Log Bucket:** `argos_logs` (30-day retention)
- **Error Alerts:** Email notifications for >10 errors/5min
- **Metrics:** Custom metrics for ownership checks and error tracking

## Detailed Infrastructure Components

### **Terraform Resources Currently Deployed**

#### **Compute Resources**
```hcl
# MongoDB Server
resource "google_compute_instance" "mongodb" {
  name         = "mongodb-dev"
  machine_type = "e2-medium"
  zone         = "us-central1-a"
  
  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
      size  = 50
    }
  }
  
  network_interface {
    network    = "mongodb-network-dev"
    subnetwork = "mongodb-subnetwork-dev"
    access_config {
      // Ephemeral public IP
    }
  }
}
```

#### **Cloud Functions**
```hcl
# Main API Function
resource "google_cloudfunctions2_function" "main_api" {
  name        = "argos-api"
  location    = "us-central1"
  
  build_config {
    runtime     = "nodejs18"
    entry_point = "api"
  }
  
  service_config {
    max_instance_count = 100
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

# Scheduled Cleanup Function  
resource "google_cloudfunctions2_function" "scheduledCleanup" {
  name        = "argos-scheduled-cleanup"
  location    = "us-central1"
  
  build_config {
    runtime     = "nodejs18"
    entry_point = "scheduledCleanup"
  }
}
```

#### **Networking**
```hcl
# Custom VPC for MongoDB
resource "google_compute_network" "mongodb_network" {
  name                    = "mongodb-network-dev"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "mongodb_subnetwork" {
  name          = "mongodb-subnetwork-dev"
  ip_cidr_range = "10.0.0.0/24"
  region        = "us-central1"
}

# Firewall Rules
resource "google_compute_firewall" "mongodb_firewall" {
  name    = "mongodb-firewall-dev"
  network = google_compute_network.mongodb_network.name
  
  allow {
    protocol = "tcp"
    ports    = ["22", "27017"]
  }
  
  source_ranges = ["0.0.0.0/0"]
}
```

#### **Storage & Scheduling**
```hcl
# Cloud Storage for Function Source
resource "google_storage_bucket" "functions_bucket" {
  name     = "argos-434718-functions"
  location = "US"
}

# Daily Cleanup Scheduler
resource "google_cloud_scheduler_job" "cleanup" {
  name        = "argos-cleanup"
  schedule    = "0 0 * * *"  # Midnight UTC daily
  time_zone   = "UTC"
  region      = "us-central1"
}
```

#### **Monitoring & Logging**
```hcl
# Log Bucket for Long-term Storage
resource "google_logging_project_bucket_config" "argos_logs" {
  retention_days = 30
  bucket_id      = "argos_logs"
}

# Error Alert Policy
resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "High Error Rate Alert"
  
  conditions {
    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/argos_error_count\""
      threshold_value = 10
      duration        = "300s"
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Email Notification Channel
resource "google_monitoring_notification_channel" "email" {
  display_name = "Argos Error Notifications"
  type         = "email"
  labels = {
    email_address = "tech@magickml.com"
  }
}
```

### **Current Terraform State**
- **Version:** 4
- **Terraform Version:** 1.9.8
- **Serial:** 368 (368 operations performed)
- **Lineage:** `44e56b91-9440-92f2-c380-766b4424d820`

## Migration Requirements

### 🔄 **What You Need to Migrate**

#### **1. GCP Resources to Recreate**
```bash
# Terraform state shows these active resources:
- google_compute_instance.mongodb (MongoDB server)
- google_cloudfunctions2_function.main_api
- google_cloudfunctions2_function.scheduledCleanup  
- google_cloud_scheduler_job.cleanup
- google_storage_bucket.functions_bucket
- google_storage_bucket_object.functions_source
- google_firestore_database.argos_firestore_main
- google_logging_project_bucket_config.argos_logs
- google_monitoring_alert_policy.error_rate
- google_monitoring_notification_channel.email
- google_compute_network.mongodb_network
- google_compute_subnetwork.mongodb_subnetwork
- google_compute_firewall.mongodb_firewall
```

#### **2. Environment Variables to Migrate**

##### **Production Environment Variables**
```bash
# Core Configuration
FIRESTORE_PROJECT_ID=argos-434718
NODE_ENV=production
LOG_EXECUTION_ID=true

# Encryption Keys (CRITICAL - MUST MIGRATE)
API_KEY_ENCRYPTION_KEY=a0PJ2Y5qjvkL7LVmer6f1OACff+0kMjMPOJ5YkGS+JM=
API_KEY_ENCRYPTION_IV=G3z5x+kLY3xFOrfaQUuhnA==

# Database Connection
MONGODB_URI=mongodb://argosUser:<password>@<EXTERNAL_IP>:27017/argosDB
MONGODB_DATABASE=argosDB
```

##### **Development/Local Environment Variables**
```bash
# Development Setup
NODE_ENV=development
FUNCTIONS_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:9090

# Database (Local Docker)
MONGODB_URI=mongodb://localhost:27017/argosDB
MONGODB_DATABASE=argosDB

# Rate Limiting (Disabled for Dev)
RATE_LIMIT_DISABLED=true
IP_RATE_LIMIT_DISABLED=true
FINGERPRINT_RATE_LIMIT_DISABLED=true

# CORS Origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5000

# Optional Development Bypasses
BYPASS_ROLE_CHECK=true
```

##### **Test Environment Variables**
```bash
NODE_ENV=test
FUNCTIONS_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:9090
FIREBASE_CONFIG={"projectId":"test-project","authDomain":"test-project.firebaseapp.com"}
GCLOUD_PROJECT=test-project
```

#### **3. Database Migration**

##### **Current Production Database Access**
```bash
# SSH into MongoDB instance to get credentials
gcloud compute ssh mongodb-dev --zone=us-central1-a --project=argos-434718

# On the instance, get password
sudo cat /root/mongodb_credentials.txt

# Connection string format
mongodb://argosUser:<password>@<EXTERNAL_IP>:27017/argosDB
```

##### **Database Export Commands**
```bash
# Export entire database
mongodump --uri="mongodb://argosUser:<password>@<EXTERNAL_IP>:27017/argosDB" --out=./argos_backup

# Export specific collection (example)
mongoexport --uri="mongodb://argosUser:<password>@<EXTERNAL_IP>:27017/argosDB" --collection=profiles --out=profiles.json

# Compressed backup
mongodump --uri="mongodb://argosUser:<password>@<EXTERNAL_IP>:27017/argosDB" --gzip --archive=argos_backup.gz
```

##### **Database Import Commands (New Infrastructure)**
```bash
# Import entire database
mongorestore --uri="mongodb://newUser:<newPassword>@<NEW_IP>:27017/argosDB" ./argos_backup

# Import from compressed archive
mongorestore --uri="mongodb://newUser:<newPassword>@<NEW_IP>:27017/argosDB" --gzip --archive=argos_backup.gz

# Import specific collection
mongoimport --uri="mongodb://newUser:<newPassword>@<NEW_IP>:27017/argosDB" --collection=profiles --file=profiles.json
```

#### **4. Service Account & Terraform State**

##### **Service Account Key**
- **Current:** `terraform-key.json` in `/terraform/` directory
- **Action:** Copy to new repository or create new service account
- **Permissions:** Editor or custom role with Compute/Functions/Storage/Logging permissions

##### **Terraform State Options**
1. **Option A: Migrate State**
   ```bash
   # Copy terraform.tfstate to new repo
   # Update provider configuration with new project ID
   # Run terraform plan to see differences
   ```

2. **Option B: Fresh Start (Recommended)**
   ```bash
   # Export/backup current data
   # Destroy current infrastructure: terraform destroy
   # Create new infrastructure in new project
   # Import data to new infrastructure
   ```

#### **5. DNS & Domain Configuration**

##### **Current Endpoints**
- **Production API:** `https://us-central1-argos-434718.cloudfunctions.net/argos-api`
- **Cleanup Function:** `https://us-central1-argos-434718.cloudfunctions.net/argos-scheduled-cleanup`

##### **Update Required**
- Client applications using these endpoints
- Any hardcoded URLs in frontend code
- API documentation
- Third-party integrations

### 📝 **Migration Checklist**

#### **Pre-Migration (Data Safety)**
- [ ] Export MongoDB database using `mongodump`
- [ ] Backup Terraform state file (`terraform.tfstate`)
- [ ] Document all environment variables
- [ ] Save service account key (`terraform-key.json`)
- [ ] List all current GCP resources (`gcloud compute instances list`)
- [ ] Note current function URLs and endpoints

#### **Infrastructure Setup (New Repository)**
- [ ] Create new GCP project or use existing
- [ ] Create/configure service account with required permissions
- [ ] Update Terraform variables with new project ID
- [ ] Update all hardcoded project references
- [ ] Configure new domain/DNS if needed

#### **Database Migration**
- [ ] Set up new MongoDB infrastructure
- [ ] Configure authentication and firewall rules
- [ ] Import database backup to new instance
- [ ] Verify data integrity and collection indexes
- [ ] Update connection strings in application

#### **Application Deployment**
- [ ] Update environment variables for new infrastructure
- [ ] Deploy functions to new GCP project
- [ ] Configure monitoring and alerting
- [ ] Update CORS origins for new domains
- [ ] Test all endpoints and functionality

#### **Testing & Validation**
- [ ] Run full test suite against new infrastructure
- [ ] Verify database connections and queries
- [ ] Test authentication and authorization flows
- [ ] Check scheduled tasks and cleanup functions
- [ ] Validate monitoring and alerting

#### **Cutover & Cleanup**
- [ ] Update DNS/load balancers to point to new infrastructure
- [ ] Monitor for errors and performance issues
- [ ] Gradually decommission old infrastructure
- [ ] Update documentation and deployment guides
- [ ] Notify team of new endpoints and procedures

## Important Security Notes

### **Critical Secrets to Migrate**
1. **API Encryption Keys** - Used for sensitive data encryption
2. **Service Account Keys** - Required for GCP authentication  
3. **MongoDB Credentials** - Database access authentication
4. **SSL/TLS Certificates** - If using custom domains

### **Security Best Practices for Migration**
1. **Rotate Keys:** Generate new encryption keys for production
2. **Least Privilege:** Service accounts should have minimal required permissions
3. **Network Security:** Restrict MongoDB access to application IPs only
4. **Audit Logs:** Enable audit logging for all GCP resources
5. **Backup Strategy:** Implement automated backups for new infrastructure

This comprehensive analysis provides everything needed to successfully migrate your Argos server infrastructure while maintaining security, functionality, and data integrity. 