# Doctors Database Service

A Google Cloud Function for managing doctors data in Firestore.

## Overview

This service provides a comprehensive API for managing doctors in your healthcare platform using Google Cloud Firestore as the database.

## Features

- ✅ **CRUD Operations**: Create, Read, Update, Delete doctors
- ✅ **Advanced Filtering**: By specialty, city, or combined filters
- ✅ **Search Functionality**: Search doctors by name
- ✅ **Data Migration**: Migrate existing doctor data to Firestore
- ✅ **Availability Management**: Update doctor availability schedules
- ✅ **Analytics**: Get unique specialties and cities

## Deployment

### Prerequisites

- Google Cloud Project with Firestore enabled
- Google Cloud Functions enabled
- Proper IAM permissions for Firestore

### Deploy to Google Cloud

```bash
# Navigate to the service directory
cd backend-services/doctorsService

# Install dependencies
npm install

# Deploy the function
gcloud functions deploy doctorsService \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --source . \
  --entry-point doctorsService
```

### Local Testing

```bash
# Install dependencies
npm install

# Start local server
npm start

# The function will be available at:
# http://localhost:8080
```

## API Endpoints

All endpoints use the base URL: `https://your-region-your-project.cloudfunctions.net/doctorsService`

### Get All Doctors

```
GET /doctorsService?action=getAllDoctors
```

### Get Doctor by ID

```
GET /doctorsService?action=getDoctorById&doctorId=DOCTOR_ID
```

### Get Doctors by Specialty

```
GET /doctorsService?action=getDoctorsBySpecialty&specialty=SPECIALTY_NAME
```

### Get Doctors by City

```
GET /doctorsService?action=getDoctorsByCity&city=CITY_NAME
```

### Get Doctors with Filters

```
GET /doctorsService?action=getDoctorsByFilters&specialty=SPECIALTY&city=CITY
```

### Get All Specialties

```
GET /doctorsService?action=getSpecialties
```

### Get All Cities

```
GET /doctorsService?action=getCities
```

### Search Doctors by Name

```
GET /doctorsService?action=searchDoctors&searchTerm=SEARCH_TERM
```

### Add New Doctor

```
POST /doctorsService?action=addDoctor
Content-Type: application/json

{
  "name": "Dr. John Smith",
  "specialty": "General Practitioner",
  "city": "London",
  "image": "doctor-image-url",
  "bio": "Experienced GP with 15 years of practice",
  "availability": {
    "2024-01-15": ["09:00", "10:00", "11:00"],
    "2024-01-16": ["14:00", "15:00", "16:00"]
  }
}
```

### Update Doctor

```
PUT /doctorsService?action=updateDoctor&doctorId=DOCTOR_ID
Content-Type: application/json

{
  "bio": "Updated bio",
  "city": "Manchester"
}
```

### Update Doctor Availability

```
PUT /doctorsService?action=updateAvailability&doctorId=DOCTOR_ID
Content-Type: application/json

{
  "availability": {
    "2024-01-20": ["09:00", "10:00", "11:00"],
    "2024-01-21": ["14:00", "15:00", "16:00"]
  }
}
```

### Delete Doctor

```
DELETE /doctorsService?action=deleteDoctor&doctorId=DOCTOR_ID
```

### Migrate Local Data

```
POST /doctorsService?action=migrateLocalData
Content-Type: application/json

{
  "doctors": [
    {
      "name": "Dr. Jane Doe",
      "specialty": "Dentist",
      "city": "London",
      // ... other doctor fields
    }
  ]
}
```

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "doctors": [...],  // For endpoints returning doctor data
  "count": 5,        // Number of doctors returned
  "message": "...",  // For operations like add/update/delete
  // Additional endpoint-specific fields
}
```

Error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Usage in Frontend

You can use this service from your React frontend:

```javascript
// Get all doctors
const response = await fetch(
  "https://your-region-your-project.cloudfunctions.net/doctorsService?action=getAllDoctors"
);
const data = await response.json();

// Get doctors by specialty
const response = await fetch(
  "https://your-region-your-project.cloudfunctions.net/doctorsService?action=getDoctorsBySpecialty&specialty=Dentist"
);
const data = await response.json();

// Add a new doctor
const response = await fetch(
  "https://your-region-your-project.cloudfunctions.net/doctorsService?action=addDoctor",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Dr. John Smith",
      specialty: "General Practitioner",
      city: "London",
    }),
  }
);
const data = await response.json();
```

## Database Schema

Doctors are stored in Firestore with the following structure:

```javascript
{
  id: "auto-generated-or-custom-id",
  name: "Dr. John Smith",
  specialty: "General Practitioner",
  city: "London",
  image: "https://example.com/doctor-image.jpg",
  bio: "Experienced doctor with 15 years of practice",
  availability: {
    "2024-01-15": ["09:00", "10:00", "11:00"],
    "2024-01-16": ["14:00", "15:00", "16:00"]
  },
  createdAt: "2024-01-10T10:00:00Z",
  updatedAt: "2024-01-10T10:00:00Z"
}
```

## Security

- CORS is configured to allow all origins (`*`) for development
- For production, update CORS settings to only allow your frontend domain
- Consider adding authentication for write operations (POST, PUT, DELETE)
- Implement Firestore security rules for additional protection

## Monitoring

Monitor your function in the Google Cloud Console:

- Function logs: Cloud Functions > doctorsService > Logs
- Performance metrics: Cloud Functions > doctorsService > Metrics
- Error reporting: Error Reporting service

## Environment Variables

No environment variables are required for basic operation. The function uses default Firestore settings.

For advanced configurations, you can set:

- `FIRESTORE_DATABASE_ID`: Custom Firestore database ID
- `GCP_PROJECT`: Project ID (usually auto-detected)
