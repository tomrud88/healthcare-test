import os
import functions_framework
import json
import psycopg2
from datetime import datetime, date, time
import firebase_admin
from firebase_admin import credentials, auth

# Database connection details from environment variables
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_HOST = os.environ.get("DB_HOST")
DB_NAME = os.environ.get("DB_NAME")

# Firebase Admin SDK key from Secret Manager
FIREBASE_ADMIN_SDK_KEY = os.environ.get("FIREBASE_ADMIN_SDK_KEY")

# Initialize Firebase Admin SDK only once
if not firebase_admin._apps:
    try:
        cred_json = json.loads(FIREBASE_ADMIN_SDK_KEY)
        cred = credentials.Certificate(cred_json)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        # Log this error severely as the function won't work without Firebase auth.

def verify_firebase_token(request):
    """
    Verifies the Firebase ID token from the Authorization header.
    Returns the decoded token (containing uid) if valid, None otherwise.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise ValueError("Authorization header missing.")

    id_token = auth_header.split(' ').pop()
    if not id_token:
        raise ValueError("Firebase ID token missing from Authorization header.")

    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"Error verifying Firebase ID token: {e}")
        raise ValueError("Invalid or expired Firebase ID token.")

@functions_framework.http
def get_appointments(request):
    """
    HTTP Cloud Function to retrieve patient appointments from Cloud SQL PostgreSQL.
    Requires Firebase authentication. Filters appointments by authenticated patient ID.
    Now retrieves ALL appointments, including 'cancelled' ones.
    """
    # Handle CORS Preflight requests.
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    conn = None
    cur = None

    try:
        # 1. Verify Firebase ID Token
        try:
            decoded_token = verify_firebase_token(request)
            authenticated_patient_id = decoded_token['uid']
            print(f"Request from authenticated user: {authenticated_patient_id}")
        except ValueError as e:
            return (json.dumps({"error": str(e)}), 401, headers) # 401 Unauthorized

        request_json = request.get_json(silent=True)
        patient_id_from_request = request_json.get('patientId') if request_json else None

        if patient_id_from_request and patient_id_from_request != authenticated_patient_id:
            print(f"Warning: Request patientId ({patient_id_from_request}) does not match authenticated UID ({authenticated_patient_id}). Proceeding with authenticated UID.")


        # --- Database Connection and Retrieval ---
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
            cur = conn.cursor()

            appointments = []
            # Always filter by the authenticated_patient_id, but now include all statuses
            select_query = """
            SELECT id, patient_id, patient_email, appointment_date, appointment_time, service_type, notes, status, created_at
            FROM appointments
            WHERE patient_id = %s
            ORDER BY appointment_date DESC, appointment_time DESC;
            """
            cur.execute(select_query, (authenticated_patient_id,))

            # Fetch all rows and convert to a list of dictionaries
            column_names = [desc[0] for desc in cur.description]
            for row in cur.fetchall():
                appointment = dict(zip(column_names, row))
                if 'appointment_date' in appointment and isinstance(appointment['appointment_date'], date):
                    appointment['appointment_date'] = appointment['appointment_date'].isoformat()
                if 'appointment_time' in appointment and isinstance(appointment['appointment_time'], time):
                    appointment['appointment_time'] = appointment['appointment_time'].isoformat()
                if 'created_at' in appointment and isinstance(appointment['created_at'], datetime):
                    appointment['created_at'] = appointment['created_at'].isoformat()
                appointments.append(appointment)

            print(f"Retrieved {len(appointments)} appointments for user {authenticated_patient_id} (including cancelled).")

            return (json.dumps({"appointments": appointments}), 200, headers)

        except psycopg2.Error as db_err:
            print(f"Database error during appointment retrieval: {db_err}")
            if conn:
                conn.rollback()
            raise RuntimeError(f"Database operation failed: {db_err}")
        except Exception as e:
            print(f"An unexpected error occurred during DB operation: {e}")
            if conn:
                conn.rollback()
            raise RuntimeError(f"Internal database server error: {e}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

    except ValueError as e:
        print(f"Bad Request Error: {e}")
        return (json.dumps({"error": str(e)}), 400, headers)
    except RuntimeError as e:
        print(f"Server-side Runtime Error: {e}")
        return (json.dumps({"error": str(e)}), 500, headers)
    except Exception as e:
        print(f"Unhandled function error: {e}")
        import traceback
        traceback.print_exc()
        return (json.dumps({"error": "An unexpected server error occurred."}), 500, headers)
