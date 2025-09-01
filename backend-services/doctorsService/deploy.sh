#!/bin/bash

# Healthcare Test - Doctors Service Deployment Script
# This script deploys the doctorsService Cloud Function to Google Cloud

echo "🏥 Healthcare Test - Deploying Doctors Service to Google Cloud Functions"
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
read -p "🚀 Deploy doctorsService to Google Cloud Functions? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo "🔄 Deploying doctorsService..."

# Deploy the function
gcloud functions deploy doctorsService \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --source . \
    --entry-point doctorsService \
    --memory 256MB \
    --timeout 60s \
    --region us-central1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Function URL:"
    gcloud functions describe doctorsService --region=us-central1 --format="value(httpsTrigger.url)"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the Function URL above"
    echo "2. Update your frontend .env file:"
    echo "   REACT_APP_DOCTORS_API_URL=<YOUR_FUNCTION_URL>"
    echo "3. Test the endpoints using the examples in README.md"
    echo ""
    echo "🔧 To view logs: gcloud functions logs read doctorsService --region=us-central1"
    echo "🗑️  To delete: gcloud functions delete doctorsService --region=us-central1"
else
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
