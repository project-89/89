# 🚀 Project89 Server - Production Deployment Checklist

## ✅ **COMPLETED**
- [x] Local development environment setup
- [x] Docker Compose configuration  
- [x] Development server running
- [x] Database connection working
- [x] Schema imports resolved
- [x] Production Dockerfile created
- [x] **Smart GitHub Actions CI/CD pipeline configured**
  - [x] **Intelligent change detection (infrastructure vs application)**
  - [x] **Conditional Terraform execution**
  - [x] **Automated application deployment**
- [x] Terraform infrastructure code written
- [x] Environment-specific configurations created
- [x] Deployment scripts created

## 🔧 **PRE-DEPLOYMENT REQUIREMENTS**

### **1. GCP Project Setup**
- [ ] Verify GCP project ID: `argos-434718`
- [ ] Enable billing on the GCP project
- [ ] Create service account for deployment
- [ ] Download service account key JSON
- [ ] Assign necessary IAM roles:
  - [ ] Cloud Run Admin
  - [ ] Artifact Registry Admin
  - [ ] Redis Admin
  - [ ] Secret Manager Admin
  - [ ] Storage Admin
  - [ ] VPC Admin

### **2. GitHub Secrets Configuration**
Add these secrets to your GitHub repository settings:

```bash
GCP_PROJECT_ID=argos-434718
GCP_SA_KEY=<service-account-json-content>

# No longer needed - handled by Secret Manager
# DATABASE_URL_DEV, JWT_SECRET_DEV, etc. are now in GCP Secret Manager
```

### **3. MongoDB Atlas Setup** (Recommended)
- [ ] Create MongoDB Atlas cluster for production
- [ ] Create MongoDB Atlas cluster for development
- [ ] Configure network access (whitelist Cloud Run IPs)
- [ ] Create database users
- [ ] Note connection strings for Secret Manager

### **4. Domain & DNS** (Optional)
- [ ] Purchase/configure domain name
- [ ] Set up DNS records to point to Cloud Run services
- [ ] Configure SSL certificates (handled automatically by Cloud Run)

## 🚀 **SMART DEPLOYMENT WORKFLOW**

### **🧠 Intelligent Change Detection**
The GitHub Actions now automatically detects:

**Infrastructure Changes** (triggers Terraform):
- `terraform/**` - Infrastructure code changes
- `apps/server/Dockerfile` - Container configuration changes  
- `docker-compose.yml` - Development environment changes
- `apps/server/package.json` - Dependency changes
- `apps/server/prisma/**` - Database schema changes

**Application Changes** (triggers build/test/deploy):
- `apps/server/src/**` - Source code changes
- `packages/**` - Shared package changes

### **🔄 Automated Workflow**
```bash
# Development workflow
git checkout develop
git add .
git commit -m "feat: add new API endpoint"
git push origin develop
# ✅ GitHub Actions automatically:
# 1. Detects "application" change
# 2. Runs tests
# 3. Skips Terraform (no infrastructure changes)
# 4. Builds & deploys to dev environment

# Infrastructure + Application workflow  
git checkout develop
git add terraform/ apps/server/src/
git commit -m "feat: add Redis caching + new endpoint"
git push origin develop
# ✅ GitHub Actions automatically:
# 1. Detects "infrastructure" + "application" changes
# 2. Runs Terraform to update infrastructure
# 3. Runs tests
# 4. Builds & deploys application to dev environment
```

## 🏗️ **INITIAL INFRASTRUCTURE SETUP** (One-time)

### **Phase 1: First-time Infrastructure Deployment**
Since GitHub Actions now handles Terraform, you can either:

**Option A: Use GitHub Actions (Recommended)**
```bash
# Just push changes to trigger infrastructure setup
git checkout develop
touch terraform/FORCE_DEPLOY  # Trigger infrastructure detection
git add .
git commit -m "chore: initial infrastructure setup"
git push origin develop
```

**Option B: Manual Setup (Alternative)**
```bash
# If you prefer manual control for initial setup
./scripts/deploy.sh --environment dev --skip-build --skip-deploy
```

### **Phase 2: Secrets Management**
```bash
# Set up secrets in Google Secret Manager
gcloud secrets create project89-database-url-dev --data-file=- <<< "your-mongodb-connection-string"
gcloud secrets create project89-jwt-secret-dev --data-file=- <<< "your-jwt-secret"
gcloud secrets create project89-openai-key-dev --data-file=- <<< "your-openai-key"
gcloud secrets create project89-google-ai-key-dev --data-file=- <<< "your-google-ai-key"
gcloud secrets create project89-helius-key-dev --data-file=- <<< "your-helius-key"

# Repeat for production
gcloud secrets create project89-database-url-prod --data-file=- <<< "your-mongodb-connection-string"
gcloud secrets create project89-jwt-secret-prod --data-file=- <<< "your-jwt-secret"
gcloud secrets create project89-openai-key-prod --data-file=- <<< "your-openai-key"  
gcloud secrets create project89-google-ai-key-prod --data-file=- <<< "your-google-ai-key"
gcloud secrets create project89-helius-key-prod --data-file=- <<< "your-helius-key"
```

## 🧪 **TESTING & VALIDATION**

### **Automated Testing**
- [ ] **Development**: Push to `develop` branch triggers auto-deployment
- [ ] **Production**: Push to `main` branch triggers auto-deployment  
- [ ] GitHub Actions provides deployment summary with:
  - [ ] Environment deployed to
  - [ ] Service URL
  - [ ] Infrastructure status (Updated/Skipped)
  - [ ] Application status (Deployed/Skipped)
  - [ ] Automatic health check

### **Manual Validation**
- [ ] Check GitHub Actions logs for successful deployment
- [ ] Health endpoint responds: `curl https://your-service-url/api/health`
- [ ] Monitor Cloud Run logs for errors
- [ ] Verify database connectivity
- [ ] Test key API endpoints

## 📊 **MONITORING & OBSERVABILITY**

### **GitHub Actions Monitoring**
- [ ] Check Actions tab for deployment status
- [ ] Review Terraform plan comments on PRs
- [ ] Monitor deployment summaries
- [ ] Set up Slack/email notifications for failed deployments

### **Google Cloud Monitoring**
- [ ] Set up alerting for high error rates
- [ ] Set up alerting for high response times  
- [ ] Set up alerting for high memory/CPU usage
- [ ] Set up uptime monitoring

## 🔒 **SECURITY CHECKLIST**

### **CI/CD Security**
- [ ] GitHub service account has minimal required permissions
- [ ] Secrets stored in GitHub Secrets (GCP SA key only)
- [ ] Application secrets stored in GCP Secret Manager
- [ ] Terraform state managed securely

### **Application Security**
- [ ] All application secrets retrieved from Secret Manager
- [ ] JWT tokens use secure secrets from Secret Manager
- [ ] API rate limiting enabled
- [ ] Input validation implemented
- [ ] CORS properly configured

## 🚀 **GO-LIVE PROCESS**

### **Development Deployment**
```bash
git checkout develop
# Make your changes
git add .
git commit -m "your change description"
git push origin develop
# ✅ Automatic deployment triggered
```

### **Production Deployment**
```bash
git checkout main
git merge develop
git push origin main  
# ✅ Automatic production deployment triggered
```

### **Monitoring Post-Deployment**
- [ ] Check GitHub Actions for successful completion
- [ ] Review deployment summary in Actions logs
- [ ] Monitor Cloud Run metrics for 30 minutes
- [ ] Verify no critical errors in application logs

## 🆘 **ROLLBACK PLAN**

### **Application Rollback**
```bash
# GitHub Actions keeps previous revisions
gcloud run services update-traffic project89-server-prod \
  --to-revisions=PREVIOUS=100 --region=us-central1
```

### **Infrastructure Rollback**
```bash
# If infrastructure changes cause issues
git revert <terraform-commit-hash>
git push origin main  # Triggers Terraform rollback
```

## 🎯 **DEPLOYMENT COMMANDS SUMMARY**

### **🤖 Automated (Recommended)**
```bash
# Development
git push origin develop

# Production  
git push origin main
```

### **🛠️ Manual (Backup)**
```bash
# Full deployment
./scripts/deploy.sh --environment dev

# Infrastructure only
./scripts/deploy.sh --skip-build --skip-deploy --environment dev

# Application only
./scripts/deploy.sh --skip-terraform --environment dev
```

---

## 📈 **WORKFLOW BENEFITS**

✅ **Intelligent**: Only runs Terraform when infrastructure changes  
✅ **Fast**: Skips unnecessary steps based on change detection  
✅ **Safe**: Terraform plan shown in PR comments  
✅ **Automated**: Full CI/CD with minimal manual intervention  
✅ **Flexible**: Manual deployment scripts available as backup  
✅ **Transparent**: Clear deployment summaries and health checks  

---

**Last Updated**: December 2024  
**Version**: 2.0.0 (Smart Detection)  
**Environment**: Production Ready with Intelligent CI/CD 