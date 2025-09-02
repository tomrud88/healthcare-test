#!/bin/bash

# Healthcare Test - Submit Registration Form Service Deployment Script
# This script deploys the submitRegistrationForm Cloud Function to Google Cloud

echo "🏥 Healthcare Test - Deploying Submit Registration Form Service to Google Cloud Functions"
echo "================================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK (gcloud) is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ You are not authenticated with Google Cloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Google Cloud project is set."
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Current project: $PROJECT_ID"
echo "📁 Deploying from: $(pwd)"
echo ""

# Confirm deployment
read -p "🚀 Deploy submitRegistrationForm to Google Cloud Functions? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo "🔄 Deploying submitRegistrationForm..."

# Deploy the function
gcloud functions deploy submitRegistrationForm \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --source . \
    --entry-point submitRegistrationForm \
    --memory 256MB \
    --timeout 60s \
    --region us-central1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Function URL:"
    gcloud functions describe submitRegistrationForm --region=us-central1 --format="value(httpsTrigger.url)"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the Function URL above"
    echo "2. Update your frontend PatientService.js file:"
    echo "   const PATIENT_API_URL = \"<YOUR_FUNCTION_URL>\";"
    echo "3. Test patient registration with gender field"
    echo ""
    echo "🔧 To view logs: gcloud functions logs read submitRegistrationForm --region=us-central1"
    echo "🗑️  To delete: gcloud functions delete submitRegistrationForm --region=us-central1"
else
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
