#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
PROJECT_ID="argos-434718"
REGION="us-central1"
SKIP_TERRAFORM=false
SKIP_BUILD=false
SKIP_DEPLOY=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV     Environment to deploy (dev, prod) [default: dev]"
    echo "  -p, --project-id ID       GCP Project ID [default: argos-434718]"
    echo "  -r, --region REGION       GCP Region [default: us-central1]"
    echo "  --skip-terraform          Skip Terraform infrastructure deployment"
    echo "  --skip-build              Skip Docker build"
    echo "  --skip-deploy             Skip Cloud Run deployment"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment prod"
    echo "  $0 --skip-terraform --environment dev"
    echo "  $0 --skip-build --skip-deploy"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        --skip-terraform)
            SKIP_TERRAFORM=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-deploy)
            SKIP_DEPLOY=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    print_error "Environment must be 'dev' or 'prod'"
    exit 1
fi

print_status "Starting deployment for environment: $ENVIRONMENT"
print_status "Project ID: $PROJECT_ID"
print_status "Region: $REGION"

# Check prerequisites
print_status "Checking prerequisites..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

# Set gcloud project
gcloud config set project $PROJECT_ID

# Configure Docker for Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

print_success "Prerequisites check completed"

# Deploy infrastructure with Terraform
if [[ "$SKIP_TERRAFORM" == false ]]; then
    print_status "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -var-file="environments/${ENVIRONMENT}/terraform.tfvars" -out=tfplan
    
    # Apply deployment
    terraform apply tfplan
    
    # Clean up plan file
    rm tfplan
    
    cd ..
    
    print_success "Infrastructure deployment completed"
else
    print_warning "Skipping Terraform deployment"
fi

# Build and push Docker image
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building and pushing Docker image..."
    
    # Determine image tag
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        IMAGE_TAG="latest"
    else
        IMAGE_TAG="dev-latest"
    fi
    
    IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/project89-registry/project89-server:${IMAGE_TAG}"
    
    # Build image
    docker build -t $IMAGE_NAME -f apps/server/Dockerfile .
    
    # Push image
    docker push $IMAGE_NAME
    
    print_success "Docker image built and pushed: $IMAGE_NAME"
else
    print_warning "Skipping Docker build"
fi

# Deploy to Cloud Run
if [[ "$SKIP_DEPLOY" == false ]]; then
    print_status "Deploying to Cloud Run..."
    
    # Determine service name and image tag
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        SERVICE_NAME="project89-server-prod"
        IMAGE_TAG="latest"
    else
        SERVICE_NAME="project89-server-dev"
        IMAGE_TAG="dev-latest"
    fi
    
    IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/project89-registry/project89-server:${IMAGE_TAG}"
    
    # Deploy to Cloud Run
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --set-env-vars NODE_ENV=$ENVIRONMENT \
        --memory 4Gi \
        --cpu 2 \
        --max-instances 100 \
        --min-instances 0 \
        --port 8080 \
        --timeout 300
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    
    print_success "Cloud Run deployment completed"
    print_success "Service URL: $SERVICE_URL"
else
    print_warning "Skipping Cloud Run deployment"
fi

print_success "Deployment completed successfully!"

# Show next steps
print_status "Next steps:"
echo "1. Update your secrets in Google Secret Manager:"
echo "   - project89-database-url-${ENVIRONMENT}"
echo "   - project89-jwt-secret-${ENVIRONMENT}"
echo "   - project89-openai-key-${ENVIRONMENT}"
echo "   - project89-google-ai-key-${ENVIRONMENT}"
echo "   - project89-helius-key-${ENVIRONMENT}"
echo ""
echo "2. Test your deployment:"
if [[ "$SKIP_DEPLOY" == false ]]; then
    echo "   curl ${SERVICE_URL}/api/health"
else
    echo "   Deploy the service first, then test the health endpoint" 