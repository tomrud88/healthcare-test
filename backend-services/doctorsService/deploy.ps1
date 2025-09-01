# Healthcare Test - Doctors Service Deployment Script (PowerShell)
# This script deploys the doctorsService Cloud Function to Google Cloud

Write-Host "🏥 Healthcare Test - Deploying Doctors Service to Google Cloud Functions" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Google Cloud SDK (gcloud) is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
$authList = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authList) {
    Write-Host "❌ You are not authenticated with Google Cloud." -ForegroundColor Red
    Write-Host "Please run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

# Get current project
$projectId = gcloud config get-value project 2>$null
if (-not $projectId) {
    Write-Host "❌ No Google Cloud project is set." -ForegroundColor Red
    Write-Host "Please run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Current project: $projectId" -ForegroundColor Green
Write-Host "📁 Deploying from: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Confirm deployment
$confirm = Read-Host "🚀 Deploy doctorsService to Google Cloud Functions? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Deploying doctorsService..." -ForegroundColor Yellow

# Deploy the function
$deployResult = gcloud functions deploy doctorsService `
    --runtime nodejs20 `
    --trigger-http `
    --allow-unauthenticated `
    --source . `
    --entry-point doctorsService `
    --memory 256MB `
    --timeout 60s `
    --region us-central1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Function URL:" -ForegroundColor Cyan
    $functionUrl = gcloud functions describe doctorsService --region=us-central1 --format="value(httpsTrigger.url)"
    Write-Host $functionUrl -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the Function URL above" -ForegroundColor White
    Write-Host "2. Update your frontend .env file:" -ForegroundColor White
    Write-Host "   REACT_APP_DOCTORS_API_URL=$functionUrl" -ForegroundColor Yellow
    Write-Host "3. Test the endpoints using the examples in README.md" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 To view logs: gcloud functions logs read doctorsService --region=us-central1" -ForegroundColor Cyan
    Write-Host "🗑️  To delete: gcloud functions delete doctorsService --region=us-central1" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
    exit 1
}
