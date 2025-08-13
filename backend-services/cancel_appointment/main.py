import os
import functions_framework
import json
import psycopg2
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
def cancel_appointment(request):
    """
    HTTP Cloud Function to cancel a patient appointment in Cloud SQL PostgreSQL.
    Requires Firebase authentication. Publishes a message to Pub/Sub upon successful cancellation.
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
            authenticated_patient_email = decoded_token.get('email') # Get email for notification
            print(f"Request from authenticated user: {authenticated_patient_id}")
        except ValueError as e:
            return (json.dumps({"error": str(e)}), 401, headers) # 401 Unauthorized

        request_json = request.get_json(silent=True)
        if not request_json:
            raise ValueError("No valid JSON data provided in the request body.")

        # Expecting 'appointmentId' and 'patientId' from the frontend
        appointment_id = request_json.get('appointmentId')
        patient_id_from_request = request_json.get('patientId') # Frontend still sends this
        patient_phone = request_json.get('patientPhone') # Assuming phone is also sent for notifications

        # IMPORTANT: Ensure the patientId from the request matches the authenticated UID
        if patient_id_from_request != authenticated_patient_id:
            return (json.dumps({"error": "Unauthorized: You can only cancel your own appointments."}), 403, headers) # 403 Forbidden

        # Basic validation
        if not all([appointment_id, patient_id_from_request]):
            return (json.dumps({"error": "Missing required fields: appointmentId and patientId."}), 400, headers)

        # --- Database Connection and Update ---
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
            cur = conn.cursor()

            # First, retrieve appointment details for the notification before updating status
            select_query = """
            SELECT patient_email, appointment_date, appointment_time, service_type, notes
            FROM appointments
            WHERE id = %s AND patient_id = %s AND status != 'cancelled';
            """
            cur.execute(select_query, (appointment_id, authenticated_patient_id))
            appointment_details = cur.fetchone()

            if not appointment_details:
                return (json.dumps({"message": "Appointment not found, or you do not have permission to cancel it, or it's already cancelled."}), 404, headers)

            # Unpack details for notification
            (
                notification_patient_email,
                notification_appointment_date,
                notification_appointment_time,
                notification_service_type,
                notification_notes
            ) = appointment_details

            # Convert date/time objects to string for JSON serialization
            notification_appointment_date = notification_appointment_date.isoformat()
            notification_appointment_time = notification_appointment_time.isoformat()

            # Now, update the appointment status to 'cancelled'
            update_query = """
            UPDATE appointments
            SET status = 'cancelled'
            WHERE id = %s AND patient_id = %s AND status != 'cancelled';
            """
            cur.execute(update_query, (appointment_id, authenticated_patient_id)) # Use authenticated UID
            conn.commit()

            # Check if any row was actually updated (should be 1 if appointment_details was found)
            if cur.rowcount == 0:
                # This case should ideally not be hit if appointment_details was found,
                # but it's a safeguard.
                return (json.dumps({"message": "Appointment not found, or you do not have permission to cancel it, or it's already cancelled."}), 404, headers)

            print(f"Appointment ID {appointment_id} cancelled successfully by authenticated patient {authenticated_patient_id}.")

            # --- Publish message to Pub/Sub for notification ---
            try:
                message_data = {
                    "eventType": "appointmentCancelled",
                    "appointmentId": appointment_id,
                    "patientId": authenticated_patient_id,
                    "patientEmail": notification_patient_email, # Use email from DB
                    "patientPhone": patient_phone, # Include phone for FCM conceptual
                    "appointmentDate": notification_appointment_date,
                    "appointmentTime": notification_appointment_time,
                    "serviceType": notification_service_type,
                    "notes": notification_notes
                }
                data = json.dumps(message_data).encode("utf-8")
                future = publisher.publish(topic_path, data)
                message_id = future.result()
                print(f"Published 'appointmentCancelled' message to Pub/Sub with ID: {message_id}")
            except Exception as pubsub_err:
                print(f"Error publishing to Pub/Sub: {pubsub_err}")
                # Log the error but don't fail the cancellation, as cancellation is primary

            return (json.dumps({"message": "Appointment cancelled successfully."}), 200, headers)

        except psycopg2.Error as db_err:
            print(f"Database error during appointment cancellation: {db_err}")
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
        return (json.dumps({"error": "An unexpected server error occurred."}), 500, headers)
    except Exception as e:
        print(f"Unhandled function error: {e}")
        import traceback
        traceback.print_exc()
        return (json.dumps({"error": "An unexpected server error occurred."}), 500, headers)
