# Upload Medical Documents Webhook

This Cloud Run service handles medical document uploads and analysis.

## Deploy to Cloud Run

```bash
gcloud run deploy upload-medical-documents \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-api-key-here
```

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key for AI analysis
