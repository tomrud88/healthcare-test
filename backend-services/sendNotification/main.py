import os
import functions_framework
import json
import base64
import smtplib
import ssl
from email.message import EmailMessage # Recommended for creating proper email messages

# --- Environment variables (loaded from Secret Manager) ---
# For SMTP email sending
# These variables will be populated from secrets you've created
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587)) # Default to 587 for TLS
SMTP_USERNAME = os.environ.get("SMTP_USERNAME") # For Gmail App Password, this will be your email: thmina2809@gmail.com
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD") # Your 16-digit App Password (without spaces)
SENDER_EMAIL = os.environ.get("SENDER_EMAIL")   # This will be your desired sender email: thmina2809@gmail.com

# For Firebase Admin SDK (FCM) - keep if you intend to implement FCM fully
# The secret value is the JSON content of your service account key file
# If you don't use FCM, this can be removed or left for future use.
FIREBASE_ADMIN_SDK_KEY = os.environ.get("FIREBASE_ADMIN_SDK_KEY")

# --- Helper functions for sending notifications ---

def send_email(recipient_email, subject, message_body_html): # Changed to accept HTML body
    """Sends an email using an SMTP server."""
    # Ensure all necessary SMTP credentials and sender email are configured
    if not all([SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL]):
        print("SMTP server details or sender email not fully configured (check environment variables). Skipping email.")
        # Print which variables are missing for easier debugging
        if not SMTP_HOST: print("  SMTP_HOST is missing.")
        if not SMTP_USERNAME: print("  SMTP_USERNAME is missing.")
        if not SMTP_PASSWORD: print("  SMTP_PASSWORD is missing.")
        if not SENDER_EMAIL: print("  SENDER_EMAIL is missing.")
        return False

    # Create the email message using EmailMessage for better email structure
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email
    msg.set_content(message_body_html, subtype='html') # Set content as HTML

    try:
        # Create a secure SSL context for the connection
        context = ssl.create_default_context()

        # Connect to the SMTP server. For port 587, we start a TLS session.
        # For port 465 (SMTPS), you would use smtplib.SMTP_SSL(host, port, context=context) directly.
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context) # Secure the connection with TLS encryption
            server.login(SMTP_USERNAME, SMTP_PASSWORD) # Authenticate with the SMTP server
            server.send_message(msg) # Send the constructed email message
            print(f"Email sent successfully to {recipient_email} from {SENDER_EMAIL}.")
            return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: Check SMTP_USERNAME and SMTP_PASSWORD. Details: {e}")
        # This typically means the username/password (App Password) is incorrect or not allowed.
        return False
    except smtplib.SMTPConnectError as e:
        print(f"SMTP Connection Error: Could not connect to {SMTP_HOST}:{SMTP_PORT}. Details: {e}")
        # This could mean incorrect host/port, network issues, or server not running.
        return False
    except smtplib.SMTPRecipientsRefused as e:
        print(f"SMTP Recipient Refused Error: One or more recipients were refused by the server. Details: {e.recipients}")
        # This usually means the recipient email address is invalid or blocked by the server.
        return False
    except Exception as e:
        print(f"An unexpected error occurred while sending email via SMTP: {e}")
        return False

def send_fcm_push_notification(recipient_token_or_topic, title, body, notification_type):
    """
    Sends a push notification via Firebase Cloud Messaging (FCM).
    NOTE: This is still a conceptual placeholder. To make this functional,
    you would need to initialize the Firebase Admin SDK and use its messaging module.
    """
    # To implement actual FCM, you'd integrate the firebase_admin SDK here.
    # The FIREBASE_ADMIN_SDK_KEY would be used to initialize the SDK.
    # Example (uncomment and properly implement if you add firebase-admin):
    # import firebase_admin
    # from firebase_admin import credentials, messaging
    #
    # if FIREBASE_ADMIN_SDK_KEY and not firebase_admin._apps: # Check if app is not already initialized
    #     try:
    #         cred = credentials.Certificate(json.loads(FIREBASE_ADMIN_SDK_KEY))
    #         firebase_admin.initialize_app(cred)
    #         print("Firebase Admin SDK initialized for FCM.")
    #     except Exception as e:
    #         print(f"Error initializing Firebase Admin SDK: {e}")
    #         return False
    #
    # try:
    #     message = messaging.Message(
    #         notification=messaging.Notification(title=title, body=body),
    #         token=recipient_token_or_topic, # Or use topic= if sending to a topic
    #         data={"type": notification_type} # Optional data payload
    #     )
    #     response = Messaging(message)
    #     print(f"FCM message sent successfully. Response: {response}")
    #     return True
    # except Exception as e:
    #     print(f"Error sending FCM notification: {e}")
    #     return False

    print(f"--- FCM Push Notification (Conceptual) ---")
    print(f"Attempting to send FCM push notification:")
    print(f"   Target: {recipient_token_or_topic}")
    print(f"   Title: {title}")
    print(f"   Body: {body}")
    print(f"   Type: {notification_type}")
    print("   To implement this, you would use firebase_admin.Messaging() or similar.")
    print("   Remember: This requires a client-side app (mobile or web) with FCM integration.")
    print("   For actual SMS/WhatsApp to a phone number, you still need a service like Twilio or Vonage.")
    print(f"------------------------------------------")
    return True # Return True for conceptual success


@functions_framework.cloud_event
def send_appointment_notification(cloud_event):
    """
    Cloud Function that processes Pub/Sub messages to send various appointment notifications.
    Triggered by messages on the 'appointment-events' topic.
    Uses SMTP for emails and conceptually handles FCM for push notifications.
    """
    try:
        if cloud_event.data and 'message' in cloud_event.data:
            pubsub_message = cloud_event.data['message']
            data_bytes = base64.b64decode(pubsub_message['data'])
            message_data = json.loads(data_bytes.decode('utf-8'))

            event_type = message_data.get('eventType')
            appointment_id = message_data.get('appointmentId')
            patient_id = message_data.get('patientId')
            patient_email = message_data.get('patientEmail')
            patient_phone = message_data.get('patientPhone')
            appointment_date = message_data.get('appointmentDate')
            appointment_time = message_data.get('appointmentTime')
            service_type = message_data.get('serviceType')
            notes = message_data.get('notes', '')

            print(f"Received event: {event_type} for Appointment ID: {appointment_id}")
            print(f"Patient Email: {patient_email}, Patient Phone (for FCM concept): {patient_phone}")

            subject = ""
            email_body_html = "" # Changed variable name and content for HTML
            fcm_title = ""
            fcm_body = ""

            # --- Construct messages based on event type ---
            if event_type == "appointmentBooked":
                subject = f"Appointment Confirmed: {service_type} on {appointment_date} at {appointment_time}"
                email_body_html = (
                    f"Dear Patient,<br><br>" # Use <br> for line breaks in HTML email
                    f"Your appointment for <b>{service_type}</b> is confirmed.<br>"
                    f"<b>Date:</b> {appointment_date}<br>"
                    f"<b>Time:</b> {appointment_time}<br>"
                    f"<b>Appointment ID:</b> {appointment_id}<br>"
                    f"<b>Notes:</b> {notes}<br><br>"
                    f"Thank you for choosing our clinic!"
                )
                fcm_title = "Appointment Confirmed!"
                fcm_body = f"Your {service_type} appt is confirmed for {appointment_date} at {appointment_time}. ID: {appointment_id}."
            elif event_type == "appointmentCancelled":
                subject = f"Appointment Cancelled: {service_type} on {appointment_date} at {appointment_time}"
                email_body_html = (
                    f"Dear Patient,<br><br>"
                    f"Your appointment for <b>{service_type}</b> on {appointment_date} at {appointment_time} "
                    f"has been successfully cancelled.<br>"
                    f"<b>Appointment ID:</b> {appointment_id}<br><br>"
                    f"If you wish to reschedule, please visit our booking page."
                )
                fcm_title = "Appointment Cancelled"
                fcm_body = f"Your {service_type} appt on {appointment_date} at {appointment_time} has been cancelled. ID: {appointment_id}."
            elif event_type == "appointmentReminder":
                subject = f"Reminder: Your Upcoming Appointment for {service_type}"
                email_body_html = (
                    f"Dear Patient,<br><br>"
                    f"This is a friendly reminder for your upcoming appointment:<br>"
                    f"<b>Service:</b> {service_type}<br>"
                    f"<b>Date:</b> {appointment_date}<br>"
                    f"<b>Time:</b> {appointment_time}<br>"
                    f"<b>Appointment ID:</b> {appointment_id}<br><br>"
                    f"Please arrive on time. If you need to reschedule, please do so via the portal."
                )
                fcm_title = "Appointment Reminder!"
                fcm_body = f"Reminder: Your {service_type} appt is on {appointment_date} at {appointment_time}. ID: {appointment_id}."
            else:
                print(f"Unhandled event type: {event_type}. No notification sent.")
                return # Exit if event type is not handled

            # --- Send Email Notification (via SMTP) ---
            if patient_email and subject and email_body_html:
                send_email(patient_email, subject, email_body_html)
            else:
                print("Skipping email: Missing recipient email or message content.")

            # --- Send FCM Push Notification (conceptual) ---
            if patient_phone and fcm_title and fcm_body:
                fcm_target = f"user_{patient_id}" if patient_id else "general_topic"
                send_fcm_push_notification(fcm_target, fcm_title, fcm_body, event_type)
            else:
                print("Skipping FCM push notification: Missing patient phone (for conceptual target) or message content.")

        else:
            print("No message data found in Pub/Sub event.")

    except Exception as e:
        print(f"Error processing Pub/Sub message: {e}")
        # Re-raise the exception to indicate failure, so Pub/Sub can retry
        raise