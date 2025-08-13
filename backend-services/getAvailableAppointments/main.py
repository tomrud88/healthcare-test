import os
import functions_framework
import json
import psycopg2
from datetime import datetime, date, time, timedelta
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
def get_available_appointments(request):
    """
    HTTP Cloud Function to retrieve available appointment slots for a given date.
    Requires Firebase authentication.
    It calculates availability by comparing predefined slots with existing bookings.
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
        # 1. Verify Firebase ID Token (even for getting available slots, for security)
        try:
            decoded_token = verify_firebase_token(request)
            authenticated_patient_id = decoded_token['uid'] # We don't use this UID for filtering slots, but for security
            print(f"Request for available slots from authenticated user: {authenticated_patient_id}")
        except ValueError as e:
            return (json.dumps({"error": str(e)}), 401, headers) # 401 Unauthorized

        request_json = request.get_json(silent=True)
        if not request_json:
            raise ValueError("No valid JSON data provided in the request body.")

        requested_date_str = request_json.get('date')

        if not requested_date_str:
            return (json.dumps({"error": "Missing required field: date (YYYY-MM-DD)."}), 400, headers)

        try:
            requested_date = datetime.strptime(requested_date_str, '%Y-%m-%d').date()
        except ValueError:
            return (json.dumps({"error": "Invalid date format. Expected YYYY-MM-DD."}), 400, headers)

        # Define standard available time slots for a day
        start_time = time(9, 0)
        end_time = time(17, 0)
        slot_duration_minutes = 30

        possible_slots = []
        current_slot_time = datetime.combine(requested_date, start_time)
        while current_slot_time.time() < end_time:
            possible_slots.append(current_slot_time.strftime('%H:%M'))
            current_slot_time += timedelta(minutes=slot_duration_minutes)

        # --- Database Connection and Retrieval of Booked Slots ---
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
            cur = conn.cursor()

            # Query for booked appointments on the requested date that are not cancelled
            select_booked_query = """
            SELECT appointment_time
            FROM appointments
            WHERE appointment_date = %s AND status != 'cancelled';
            """
            cur.execute(select_booked_query, (requested_date,))
            
            booked_times = {row[0].strftime('%H:%M') for row in cur.fetchall()}

            # Calculate available slots
            available_slots = [
                slot for slot in possible_slots
                if slot not in booked_times
            ]

            print(f"Available slots for {requested_date_str}: {available_slots}")

            return (json.dumps({"date": requested_date_str, "slots": available_slots}), 200, headers)

        except psycopg2.Error as db_err:
            print(f"Database error during available slots retrieval: {db_err}")
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
