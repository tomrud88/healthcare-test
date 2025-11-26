import os
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from google.cloud import storage
import google.generativeai as genai
import requests
import pdfplumber

app = Flask(__name__)

CORS(app, origins=["https://healthcare-poc-477108.web.app"])

BUCKET_NAME = "upload-documents-report1"
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx', 'png', 'jpg', 'jpeg'}

GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)
else:
    raise Exception("GEMINI_API_KEY environment variable not set.")

CANDIDATE_MODELS = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-flash-preview-05-20',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro'
]
AVAILABLE_MODELS = [m.name for m in genai.list_models()]
DEFAULT_MODEL = next((m for m in CANDIDATE_MODELS if m in AVAILABLE_MODELS), "models/gemini-2.5-flash")
print(f"Using Gemini model: {DEFAULT_MODEL}")


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_to_gcs(file_obj, filename):
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(filename)
    blob.upload_from_file(file_obj, content_type=file_obj.content_type)
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{filename}"


def extract_text_from_pdf_bytes(pdf_bytes):
    print("Starting PDF extraction...")
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = "\n".join([page.extract_text() for page in pdf.pages[:5] if page.extract_text()])
    print(f"Extracted text from PDF ({len(text)} chars)")
    return text


def summarize_with_gemini(prompt: str, model_name=DEFAULT_MODEL):
    print("Sending prompt to Gemini:", prompt[:200])
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content([prompt])

        if hasattr(response, "candidates") and response.candidates:
            summary = response.candidates[0].content.parts[0].text.strip()
        else:
            summary = ""
        return summary
    except Exception as e:
        print("Gemini error:", str(e))
        return f"Error processing the report: {str(e)}"


def ai_summarize(report_content):
    prompt_doctor = (
        "Summarize the following medical report for a doctor, highlighting key findings, "
        "clinical concerns, and important points before the patient's visit:\n\n"
        f"{report_content}"
    )
    return summarize_with_gemini(prompt_doctor)


def analyze_consultation_need(doctor_summary: str):
    """
    AI decides if the patient should book a consultation.
    Returns dict: { recommend, urgency, short_message }
    """

    prompt = (
        "You are an AI triage assistant. Based on the doctor's summary below, determine whether "
        "the patient should book a consultation.\n\n"
        "Return ONLY JSON:\n"
        "{\n"
        '  "recommend": true/false,\n'
        '  "urgency": "emergency" | "urgent" | "soon" | "routine" | "none",\n'
        '  "short_message": "Short (1–2 sentences) advice for the patient"\n'
        "}\n\n"
        f"Doctor summary:\n{doctor_summary}"
    )

    raw = summarize_with_gemini(prompt)

    try:
        data = json.loads(raw)
    except Exception as e:
        print("JSON parse error:", e)
        data = {
            "recommend": True,
            "urgency": "soon",
            "short_message": "These findings should be reviewed by a doctor. A consultation is recommended."
        }

    return {
        "recommend": bool(data.get("recommend", False)),
        "urgency": data.get("urgency", "routine"),
        "short_message": data.get("short_message", "")
    }


@app.route('/upload', methods=['POST'])
def upload_file():
    print("Upload route hit")
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{int(round(os.times()[4]*1000))}_{filename}"
        public_url = upload_to_gcs(file, unique_filename)
        return jsonify({'fileUrl': public_url})

    return jsonify({'error': 'Invalid file type'}), 400


@app.route('/webhook', methods=['POST'])
def webhook():
    print("Webhook hit")

    body = request.json
    params = body.get('sessionInfo', {}).get('parameters', {})
    file_url = params.get('file_url')

    doctor_summary = "No file URL provided."
    should_book_consultation = False
    consultation_urgency = "none"
    consultation_message = ""

    if file_url:
        try:
            response = requests.get(file_url)
            if response.status_code == 200:

                if file_url.lower().endswith('.pdf'):
                    report_content = extract_text_from_pdf_bytes(response.content)
                else:
                    report_content = response.content.decode('utf-8', errors='ignore')

                if report_content.strip():
                    doctor_summary = ai_summarize(report_content)

                    consult = analyze_consultation_need(doctor_summary)
                    should_book_consultation = consult["recommend"]
                    consultation_urgency = consult["urgency"]
                    consultation_message = consult["short_message"]
                else:
                    doctor_summary = "The report file appears empty."
            else:
                doctor_summary = f"Could not fetch file (HTTP {response.status_code})."

        except Exception as e:
            doctor_summary = f"Error processing file: {str(e)}"

    # Message displayed to user
    text = f"👨‍⚕️ Doctor Summary:\n{doctor_summary}"
    if consultation_message:
        text += f"\n\n📅 Recommendation: {consultation_message}"

    # Prepare messages for Dialogflow response
    messages = [
        {
            "text": {
                "text": [text]
            }
        }
    ]
    
    # Add follow-up message if consultation is recommended
    if should_book_consultation:
        messages.append({
            "text": {
                "text": ["Based on your report, a consultation is recommended.\nLet's schedule it now. 📆\n\nWhat specialty, treatment, or scan are you looking for?"]
            }
        })

    return jsonify({
        "fulfillmentResponse": {
            "messages": messages
        },
        "sessionInfo": {
            "parameters": {
                "doctor_summary": doctor_summary,
                "should_book_consultation": should_book_consultation,
                "consultation_urgency": consultation_urgency,
                "consultation_message": consultation_message
            }
        }
    })


if __name__ == '__main__':
    app.run(debug=True)
