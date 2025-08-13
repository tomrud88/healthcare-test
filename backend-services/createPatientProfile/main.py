# your-healthcare-platform/backend-services/createPatientProfile/main.py

import functions_framework
from google.cloud import firestore
import json
import os

# Initialize Firestore client
# The project ID is usually picked up automatically from the environment
db = firestore.Client()

@functions_framework.http
def create_patient_profile(request):
    """
    HTTP Cloud Function that creates or updates a patient profile in Firestore.
    Expected to be called by the frontend (e.g., RegisterPage) after a Firebase Auth user registers.
    Now includes address fields.
    """
    # Handle CORS Preflight requests.
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*', # In production, replace '*' with your frontend's exact domain
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for the actual response (POST/GET)
    headers = {
        'Access-Control-Allow-Origin': '*' # In production, replace '*' with your frontend's exact domain
    }

    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            raise ValueError("No valid JSON data provided in the request body.")

        # Extract data expected from the frontend's RegisterPage.js
        user_id = request_json.get('uid')
        email = request_json.get('email')
        first_name = request_json.get('firstName')
        last_name = request_json.get('lastName')
        phone_number = request_json.get('phoneNumber')
        # --- NEW FIELDS ---
        address1 = request_json.get('address1')
        address2 = request_json.get('address2', '') # Optional, default to empty string
        city = request_json.get('city')
        postcode = request_json.get('postcode')
        # --- END NEW FIELDS ---

        # Basic validation
        if not all([user_id, email, first_name, last_name, phone_number, address1, city, postcode]):
            # Return a 400 Bad Request if essential fields are missing
            return (json.dumps({"error": "Missing required fields for patient profile."}), 400, headers)

        # Reference to the patient's document in the 'patients' collection.
        patient_ref = db.collection('patients').document(user_id)

        # Prepare the data to be stored in Firestore
        patient_data = {
            'email': email,
            'firstName': first_name,
            'lastName': last_name,
            'phoneNumber': phone_number,
            'address1': address1,      # Store address line 1
            'address2': address2,      # Store address line 2 (optional)
            'city': city,              # Store city
            'postcode': postcode,      # Store postcode
            'createdAt': firestore.SERVER_TIMESTAMP,
            'lastUpdated': firestore.SERVER_TIMESTAMP
        }

        # Set the document in Firestore.
        patient_ref.set(patient_data, merge=True)

        print(f"Patient profile created/updated for user: {user_id} with email: {email}")

        return (json.dumps({"message": "Patient profile created successfully", "patientId": user_id}), 200, headers)

    except ValueError as e:
        print(f"Validation Error: {e}")
        return (json.dumps({"error": str(e)}), 400, headers)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()
        return (json.dumps({"error": "Internal server error"}), 500, headers)

