import os
import functions_framework
import json
import psycopg2
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, auth
from google.cloud import pubsub_v1 # Import Pub/Sub client

# Database connection details from environment variables
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_HOST = os.environ.get("DB_HOST")
DB_NAME = os.environ.get("DB_NAME")

# Firebase Admin SDK key from Secret Manager
FIREBASE_ADMIN_SDK_KEY = os.environ.get("FIREBASE_ADMIN_SDK_KEY")

# Pub/Sub Topic ID for notifications
NOTIFICATION_TOPIC_ID = os.environ.get("NOTIFICATION_TOPIC_ID", "appointment-events") # Default fallback value
PROJECT_ID = os.environ.get("GCP_PROJECT") # Get project ID from environment

# Initialize Firebase Admin SDK only once
if not firebase_admin._apps:
    try:
        cred_json = json.loads(FIREBASE_ADMIN_SDK_KEY)
        cred = credentials.Certificate(cred_json)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")

# Initialize Pub/Sub publisher client globally
publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, NOTIFICATION_TOPIC_ID)
print(f"Pub/Sub topic path: {topic_path}")

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
def book_appointment(request):
    """
    HTTP Cloud Function to book a patient appointment in Cloud SQL PostgreSQL.
    Requires Firebase authentication. Publishes a message to Pub/Sub upon successful booking.
    """
    # Handle CORS Preflight requests.
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
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
            authenticated_patient_email = decoded_token.get('email')
            print(f"Request from authenticated user: {authenticated_patient_id}")
        except ValueError as e:
            return (json.dumps({"error": str(e)}), 401, headers)

        request_json = request.get_json(silent=True)
        if not request_json:
            raise ValueError("No valid JSON data provided in the request body.")

        patient_id_from_request = request_json.get('patientId')
        appointment_date = request_json.get('appointmentDate')
        appointment_time = request_json.get('appointmentTime')
        service_type = request_json.get('serviceType')
        notes = request_json.get('notes', '')
        # Assuming patient_phone is also sent from frontend for notifications
        patient_phone = request_json.get('patientPhone') 

        if patient_id_from_request != authenticated_patient_id:
            return (json.dumps({"error": "Unauthorized: Mismatched patient ID."}), 403, headers)

        patient_email = authenticated_patient_email or request_json.get('patientEmail')

        if not all([appointment_date, appointment_time, service_type, patient_email]):
            return (json.dumps({"error": "Missing required appointment fields (appointmentDate, appointmentTime, serviceType, patientEmail)."}), 400, headers)

        # --- Database Connection and Insertion ---
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
            cur = conn.cursor()

            insert_query = """
            INSERT INTO appointments (patient_id, patient_email, appointment_date, appointment_time, service_type, notes, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """
            cur.execute(insert_query, (
                authenticated_patient_id,
                patient_email,
                appointment_date,
                appointment_time,
                service_type,
                notes,
                'booked'
            ))
            appointment_id = cur.fetchone()[0]
            conn.commit()

            print(f"Appointment booked successfully for patient {authenticated_patient_id}. Appointment ID: {appointment_id}")

            # --- Publish message to Pub/Sub for notification ---
            try:
                message_data = {
                    "eventType": "appointmentBooked",
                    "appointmentId": appointment_id,
                    "patientId": authenticated_patient_id,
                    "patientEmail": patient_email,
                    "patientPhone": patient_phone, # Include phone for FCM conceptual
                    "appointmentDate": appointment_date,
                    "appointmentTime": appointment_time,
                    "serviceType": service_type,
                    "notes": notes
                }
                data = json.dumps(message_data).encode("utf-8")
                future = publisher.publish(topic_path, data)
                message_id = future.result()
                print(f"Published 'appointmentBooked' message to Pub/Sub with ID: {message_id}")
            except Exception as pubsub_err:
                print(f"Error publishing to Pub/Sub: {pubsub_err}")
                # Log the error but don't fail the booking, as booking is primary
                # In a real app, you might have a retry mechanism or dead-letter queue.

            return (json.dumps({
                "message": "Appointment booked successfully",
                "appointmentId": appointment_id
            }), 200, headers)

        except psycopg2.Error as db_err:
            print(f"Database error during appointment booking: {db_err}")
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
