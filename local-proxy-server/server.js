const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library");
const axios = require("axios");
const path = require("path"); // Import path module
const fs = require("fs"); // Import file system module for checking file existence

const app = express();
const PORT = 3001; // Port for your local proxy server

// Configure CORS for your local React app
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3002",
      "http://localhost:3000",
    ],
  })
);

// Add comprehensive logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n=== INCOMING REQUEST ${timestamp} ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
  console.log("===========================================\n");
  next();
});

app.use(express.json()); // To parse JSON request bodies

// ===== Appointment Webhook (Dialogflow CX) =====
// ONE webhook for all your routes/tags.
// In Dialogflow CX: Manage → Webhooks → Create
//   Name: AppointmentWebhook
//   URL:  https://YOUR_DOMAIN/appointment-webhook
// Then, on each intent route, toggle "Call webhook" and set Tag:
//   DESCRIBE_SYMPTOM, ASK_ADVICE, CHOOSE_SPECIALIST, PROVIDE_LOCATION,
//   CHOOSE_MODALITY, PROVIDE_DATE_TIME, CHOOSE_DOCTOR, CHOOSE_TIMESLOT,
//   PROVIDE_CONTACT, CONFIRM_YES, CONFIRM_NO, FALLBACK

// (Optional) simple header secret for basic protection:
const WEBHOOK_SECRET =
  process.env.WEBHOOK_SECRET || "b1c7e0f8-7b6a-4b9c-9f2e-1a3f4c6d8e9f";
// ---- Helpers (CX response, trigger, formatting) ---------------------------
function dfReply({ text, params = {}, targetPage = null }) {
  const out = {
    fulfillmentResponse: { messages: [{ text: { text: [text] } }] },
    sessionInfo: { parameters: params },
  };
  if (targetPage) out.targetPage = targetPage;
  return out;
}

function getTrigger(body) {
  const tag = body?.fulfillmentInfo?.tag;
  if (tag) return tag.toUpperCase();
  const intent = body?.intentInfo?.displayName;
  return (intent || "UNKNOWN").toUpperCase();
}

function fmtLondon(dtIso) {
  try {
    const d = new Date(dtIso);
    return d.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dtIso;
  }
}

// Extract a best-effort user text from CX request.
// Tip: In your Describe_Symptom intent, add a parameter called "user_input"
// (entity: @sys.any) so we can read it reliably here.
function extractUserText(body) {
  const p = (body && body.sessionInfo && body.sessionInfo.parameters) || {};
  return p.user_input || p.symptoms || p.last_user_text || "";
}

// ---- Demo "DB" for London doctors (replace with your real DB) -------------
const LONDON_DOCTORS = {
  dentist: [
    {
      doctor_id: "den-001",
      name: "Dr Emily Carter, BDS",
      clinic: "London Dental Clinic – Soho",
      specialty: "dentist",
      modalities: ["in_person"],
      next_available_iso: "2025-08-19T13:30:00+01:00",
    },
    {
      doctor_id: "den-017",
      name: "Dr James Walker, BDS",
      clinic: "Kensington Smile Centre",
      specialty: "dentist",
      modalities: ["in_person"],
      next_available_iso: "2025-08-19T16:00:00+01:00",
    },
    {
      doctor_id: "den-024",
      name: "Dr Olivia Bennett, BDS",
      clinic: "Shoreditch Dental",
      specialty: "dentist",
      modalities: ["in_person", "telemedicine"],
      next_available_iso: "2025-08-20T09:00:00+01:00",
    },
  ],
  dermatologist: [
    {
      doctor_id: "der-003",
      name: "Dr Sarah Patel, MD",
      clinic: "Harley Street Dermatology (Marylebone)",
      specialty: "dermatologist",
      modalities: ["in_person", "telemedicine"],
      next_available_iso: "2025-08-19T11:00:00+01:00",
    },
    {
      doctor_id: "der-010",
      name: "Dr David Green, MD",
      clinic: "Kensington Medical",
      specialty: "dermatologist",
      modalities: ["in_person"],
      next_available_iso: "2025-08-20T15:30:00+01:00",
    },
  ],
  ent: [
    {
      doctor_id: "ent-002",
      name: "Dr Olivia Hughes, FRCS (ORL-HNS)",
      clinic: "London ENT Clinic – Fitzrovia",
      specialty: "ent",
      modalities: ["in_person"],
      next_available_iso: "2025-08-19T10:30:00+01:00",
    },
  ],
  ophthalmologist: [
    {
      doctor_id: "oph-001",
      name: "Mr Daniel Wright, FRCOphth",
      clinic: "City Eye Centre – Liverpool Street",
      specialty: "ophthalmologist",
      modalities: ["in_person"],
      next_available_iso: "2025-08-20T08:45:00+01:00",
    },
  ],
  gp: [
    {
      doctor_id: "gp-005",
      name: "Dr Lucy Morgan, MRCGP",
      clinic: "Soho Health Centre",
      specialty: "gp",
      modalities: ["in_person", "telemedicine"],
      next_available_iso: "2025-08-19T14:15:00+01:00",
    },
    {
      doctor_id: "gp-012",
      name: "Dr Adam Collins, MRCGP",
      clinic: "Camden Care Practice",
      specialty: "gp",
      modalities: ["in_person"],
      next_available_iso: "2025-08-20T10:00:00+01:00",
    },
  ],
};

const doctorsDb = {
  async listDoctors({ specialty, location, modality, limit = 5 }) {
    // TODO: query your real database, filter by location/modality
    return (LONDON_DOCTORS[specialty] || []).slice(0, limit);
  },
  async listSlots({ doctor_id, fromIso, toIso, limit = 3 }) {
    // TODO: replace with live availability
    const now = new Date("2025-08-19T08:00:00+01:00");
    const mk = (h) => {
      const start = new Date(now.getTime() + h * 3600000);
      const end = new Date(start.getTime() + 30 * 60000);
      return {
        slot_id: `${doctor_id}-${start.toISOString()}`,
        start_iso: start.toISOString(),
        end_iso: end.toISOString(),
      };
    };
    return [mk(8), mk(9), mk(10)].slice(0, limit);
  },
  async book({ slot_id, patient }) {
    // TODO: call your booking system
    return { ok: true, booking_id: "BK-LDN-7X2F9" };
  },
};

// ---- Intent/tag handlers ---------------------------------------------------
async function handleDescribeSymptom(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const userText = extractUserText(body);

  console.log("Processing symptom:", userText);

  // Simple emergency screen
  if (
    /(chest pain|can't breathe|difficulty breathing|uncontrolled bleeding|suicid)/i.test(
      userText
    )
  ) {
    return dfReply({
      text: "This could be an emergency. Please call your local emergency number now or go to the nearest emergency department.",
      params: { next_action: "EMERGENCY" },
    });
  }

  // Classify specialty based on symptoms
  let specialty, specialtyDisplayName;

  if (/tooth|teeth|gum|dent/i.test(userText)) {
    specialty = "dentist";
    specialtyDisplayName = "Dentists";
  } else if (/skin|rash|acne|derma/i.test(userText)) {
    specialty = "dermatologist";
    specialtyDisplayName = "Dermatologists";
  } else if (/eye|vision|ophthal/i.test(userText)) {
    specialty = "ophthalmologist";
    specialtyDisplayName = "Ophthalmologists";
  } else if (
    /ear|nose|throat|sinus|\bent\b|runny nose|hearing problems/i.test(userText)
  ) {
    specialty = "ent";
    specialtyDisplayName = "ENT Specialists";
  } else {
    specialty = "gp";
    specialtyDisplayName = "General Practitioners";
  }

  // Ask user what they want to do
  return dfReply({
    text: `I understand you have symptoms related to ${userText.toLowerCase()}. Based on this, ${specialtyDisplayName} would be appropriate.\n\nWhat would you like me to help you with?\n\n1. **Get medical advice** for your symptoms\n2. **Show available ${specialtyDisplayName}** for an appointment\n\nPlease choose 1 or 2, or tell me "advice" or "doctors".`,
    params: {
      symptoms: userText,
      specialty,
      specialtyDisplayName,
      next_action: "CHOOSE_OPTION",
    },
  });
}

async function handleProvideAdvice(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const symptoms = params.symptoms || "your symptoms";
  const specialty = params.specialty || "gp";

  // Provide basic advice based on specialty/symptoms
  let advice = "";

  if (specialty === "dentist") {
    advice =
      "For dental issues:\n• Rinse with warm salt water\n• Take over-the-counter pain relief if needed\n• Avoid very hot or cold foods\n• See a dentist as soon as possible for proper treatment";
  } else if (specialty === "ent") {
    advice =
      "For ear, nose, and throat symptoms:\n• Stay hydrated\n• Use a humidifier or steam inhalation\n• Rest your voice if you have throat issues\n• Consider over-the-counter decongestants if appropriate\n• See a doctor if symptoms persist or worsen";
  } else if (specialty === "dermatologist") {
    advice =
      "For skin issues:\n• Keep the area clean and dry\n• Avoid scratching\n• Use gentle, fragrance-free products\n• Consider cool compresses for irritation\n• See a dermatologist for persistent or concerning skin changes";
  } else if (specialty === "ophthalmologist") {
    advice =
      "For eye problems:\n• Avoid rubbing your eyes\n• Use clean hands when touching your eye area\n• Consider artificial tears for dryness\n• Protect your eyes from bright light\n• Seek immediate care for sudden vision changes";
  } else {
    advice =
      "General health advice:\n• Rest and stay hydrated\n• Monitor your symptoms\n• Take your temperature if you feel unwell\n• Consider over-the-counter medications if appropriate\n• Contact a healthcare provider if symptoms worsen or persist";
  }

  return dfReply({
    text: `Here's some general advice for ${symptoms}:\n\n${advice}\n\n**Important:** This is general information only. Please consult with a healthcare professional for proper medical advice.\n\nWould you still like to see available doctors for an appointment?`,
    params: {
      ...params,
      advice_given: true,
      next_action: "ADVICE_GIVEN",
    },
  });
}

async function handleShowDoctors(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const specialty = params.specialty || "gp";
  const specialtyDisplayName =
    params.specialtyDisplayName || "General Practitioners";

  const doctors = await doctorsDb.listDoctors({
    specialty,
    location: params.location || "London",
    modality: params.modality,
  });

  if (!doctors.length) {
    return dfReply({
      text: `I couldn't find any ${specialtyDisplayName} available right now. Would you like me to search for a different specialty?`,
      params: { ...params, next_action: "NO_DOCTORS" },
    });
  }

  const list = doctors
    .map(
      (d, i) =>
        `${i + 1}. ${d.name} — ${d.clinic}. Next available: ${fmtLondon(
          d.next_available_iso
        )}`
    )
    .join("\n");

  return dfReply({
    text: `Here are available ${specialtyDisplayName} in London:\n\n${list}\n\nWhich doctor would you like to book with? (You can say the number or the name.)`,
    params: {
      ...params,
      offer_doctors: doctors,
      next_action: "OFFER_DOCTORS",
    },
  });
}

async function handleChooseSpecialist(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const text = extractUserText(body).toLowerCase();

  let specialty = params.specialty || "gp";
  if (/derma|skin/.test(text)) specialty = "dermatologist";
  else if (/dent|tooth|teeth|gum/.test(text)) specialty = "dentist";
  else if (/ophthal|eye/.test(text)) specialty = "ophthalmologist";
  else if (/\bent\b|ear|nose|throat|sinus/.test(text)) specialty = "ent";
  else if (/\bgp\b|family|general practitioner/.test(text)) specialty = "gp";

  const doctors = await doctorsDb.listDoctors({
    specialty,
    location: "London",
    modality: params.modality,
  });
  const list = doctors.length
    ? doctors
        .map(
          (d, i) =>
            `${i + 1}. ${d.name} — ${d.clinic}. Next: ${fmtLondon(
              d.next_available_iso
            )}`
        )
        .join("\n")
    : "No London doctors found. Try a different area or telemedicine.";

  return dfReply({
    text: `Specialty: **${specialty}**.\n${list}\nWhich doctor would you like?`,
    params: { specialty, offer_doctors: doctors, next_action: "OFFER_DOCTORS" },
  });
}

async function handleChooseDoctor(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const doctors = params.offer_doctors || [];
  const text = extractUserText(body).toLowerCase();

  let chosen = null;
  const num = parseInt((text.match(/\d+/) || [])[0] || "", 10);
  if (num && doctors[num - 1]) chosen = doctors[num - 1];
  if (!chosen) {
    chosen = doctors.find((d) =>
      d.name
        .toLowerCase()
        .split(/\s+/)
        .some((part) => text.includes(part))
    );
  }
  if (!chosen) {
    return dfReply({
      text: "I couldn't match that doctor. Please say the number from the list or the doctor's name.",
      params: { next_action: "OFFER_DOCTORS" },
    });
  }

  const slots = await doctorsDb.listSlots({ doctor_id: chosen.doctor_id });
  if (!slots.length) {
    return dfReply({
      text: `No open times for ${chosen.name} right now. Would you like to see another London doctor or a different day?`,
      params: {
        doctor_id: chosen.doctor_id,
        doctor_name: chosen.name,
        next_action: "OFFER_SLOTS",
      },
    });
  }

  const list = slots
    .map((s, i) => `${i + 1}. ${fmtLondon(s.start_iso)}`)
    .join("\n");
  return dfReply({
    text: `Selected: ${chosen.name}. Here are the next available times:\n${list}\nWhich time works for you?`,
    params: {
      doctor_id: chosen.doctor_id,
      doctor_name: chosen.name,
      offer_slots: slots,
      next_action: "OFFER_SLOTS",
    },
  });
}

async function handleChooseTimeslot(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const slots = params.offer_slots || [];
  const text = extractUserText(body).toLowerCase();

  let pick = null;
  const num = parseInt((text.match(/\d+/) || [])[0] || "", 10);
  if (num && slots[num - 1]) pick = slots[num - 1];

  if (!pick) {
    pick = slots.find((s) => {
      const hour = new Date(s.start_iso).getHours().toString().padStart(2, "0");
      return text.includes(hour);
    });
  }
  if (!pick) {
    return dfReply({
      text: "I couldn't match that time. Please say the number from the list or the exact hour.",
      params: { next_action: "OFFER_SLOTS" },
    });
  }

  return dfReply({
    text: `Great. I just need your full name and a phone number or email to confirm the booking.`,
    params: { timeslot_choice: pick.slot_id, next_action: "COLLECT_CONTACT" },
  });
}

async function handleProvideContact(body) {
  const p = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const hasName = !!p.patient_name;
  const hasContact = !!(p.patient_phone || p.patient_email);

  if (!hasName || !hasContact) {
    return dfReply({
      text: "Please provide your full name and a phone number or email.",
      params: { next_action: "COLLECT_CONTACT" },
    });
  }
  if (!p.timeslot_choice) {
    return dfReply({
      text: "I lost the selected time. Would you like me to show the available times again?",
      params: { next_action: "OFFER_SLOTS" },
    });
  }

  const booking = await doctorsDb.book({
    slot_id: p.timeslot_choice,
    patient: {
      name: p.patient_name,
      phone: p.patient_phone,
      email: p.patient_email,
    },
  });

  if (booking.ok) {
    return dfReply({
      text: `All set! Your appointment is confirmed. Reference: ${booking.booking_id}. You'll receive a confirmation shortly.`,
      params: {
        booking_id: booking.booking_id,
        next_action: "CONFIRM_BOOKING",
      },
    });
  } else {
    return dfReply({
      text: "That time was just taken. Would you like to see the next available times?",
      params: { next_action: "OFFER_SLOTS" },
    });
  }
}

// ---- Webhook endpoint ------------------------------------------------------
app.post(
  "/appointment-webhook",
  (req, res, next) => {
    if (req.get("x-api-key") !== WEBHOOK_SECRET) {
      return res.status(401).send("Unauthorized");
    }
    next();
  },
  async (req, res) => {
    try {
      const trigger = getTrigger(req.body);

      switch (trigger) {
        case "DESCRIBE_SYMPTOM":
        case "DESCRIBE_SYMPTOM_IR":
        case "DESCRIBE_SYMTOM": // accept typo
        case "DESCRIBE_SYMTOM_IR":
          return res.json(await handleDescribeSymptom(req.body));

        case "PROVIDE_ADVICE":
        case "ASK_ADVICE":
        case "ASK_ADVICE_IR":
        case "GIVE_ADVICE":
          return res.json(await handleProvideAdvice(req.body));

        case "SHOW_DOCTORS":
        case "CHOOSE_DOCTORS":
        case "FIND_DOCTORS":
          return res.json(await handleShowDoctors(req.body));

        case "CHOOSE_SPECIALIST":
        case "CHOOSE_SPECIALIST_IR":
          return res.json(await handleChooseSpecialist(req.body));

        case "CHOOSE_DOCTOR":
        case "CHOOSE_DOCTOR_IR":
          return res.json(await handleChooseDoctor(req.body));

        case "CHOOSE_TIMESLOT":
        case "CHOOSE_TIMESLOT_IR":
          return res.json(await handleChooseTimeslot(req.body));

        case "PROVIDE_CONTACT":
        case "PROVIDE_CONTACT_IR":
          return res.json(await handleProvideContact(req.body));

        // Generic handlers (you can specialize later)
        case "PROVIDE_LOCATION":
        case "CHOOSE_MODALITY":
        case "PROVIDE_DATE_TIME":
        case "CONFIRM_YES":
        case "CONFIRM_NO":
        case "FALLBACK":
        default:
          // Check if user text contains advice or doctor keywords
          const userText = extractUserText(req.body).toLowerCase();
          if (/advice|help|what.*do|recommend/i.test(userText)) {
            return res.json(await handleProvideAdvice(req.body));
          } else if (
            /doctor|appointment|book|show.*doctor|find.*doctor/i.test(userText)
          ) {
            return res.json(await handleShowDoctors(req.body));
          } else {
            return res.json(
              dfReply({
                text: "Got it. You can tell me the specialty, your London area/clinic, preferred visit type (in-person/telemedicine), or a preferred date/time.",
                params: { next_action: "OFFER_DOCTORS" },
              })
            );
          }
      }
    } catch (e) {
      console.error("Webhook error:", e);
      return res.json(
        dfReply({
          text: "Sorry—something went wrong on the server. Please try again.",
          params: {},
        })
      );
    }
  }
);

// Dialogflow CX Configuration (same as in your Chat.jsx)
// IMPORTANT: Replace these placeholders with your actual Google Cloud Project and Dialogflow CX Agent details
const DIALOGFLOW_PROJECT_ID = "healthcare-patient-portal";
const DIALOGFLOW_AGENT_ID = "c9962196-4009-4be2-b632-d268fc1b96b5";
const DIALOGFLOW_LOCATION = "us-central1"; // Use your agent's location, e.g., 'us-central1' or 'europe-west2'

// IMPORTANT: Path to your service account key file
// Make sure you place your downloaded JSON key file in the same directory as this server.js
// and name it 'service-account-key.json'
const SERVICE_ACCOUNT_KEY_FILE = path.join(
  __dirname,
  "service-account-key.json"
);

// Check if the service account key file exists
if (!fs.existsSync(SERVICE_ACCOUNT_KEY_FILE)) {
  console.error(
    `ERROR: Service account key file not found at: ${SERVICE_ACCOUNT_KEY_FILE}`
  );
  console.error(
    "Please ensure 'service-account-key.json' is in the same directory as server.js."
  );
  process.exit(1); // Exit if key file is missing
} else {
  console.log(`Service account key file found at: ${SERVICE_ACCOUNT_KEY_FILE}`);
}

// Endpoint to handle Dialogflow CX requests
app.post("/dialogflow-proxy", async (req, res) => {
  try {
    // 1. Generate Access Token using Service Account Key
    // Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // This is how GoogleAuth finds the key file when using a file path
    process.env.GOOGLE_APPLICATION_CREDENTIALS = SERVICE_ACCOUNT_KEY_FILE;
    console.log(
      `GOOGLE_APPLICATION_CREDENTIALS set to: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
    );

    const auth = new GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/dialogflow",
      ],
    });

    console.log("Attempting to get GoogleAuth client...");
    const client = await auth.getClient();
    console.log(
      "GoogleAuth client obtained. Attempting to get access token..."
    );
    const accessToken = await client.getAccessToken();
    console.log("Access token obtained.");

    if (!accessToken || !accessToken.token) {
      throw new Error("Failed to obtain access token from service account.");
    }

    // 2. Forward request to Dialogflow CX API
    const dialogflowEndpoint = `https://${DIALOGFLOW_LOCATION}-dialogflow.googleapis.com/v3/projects/${DIALOGFLOW_PROJECT_ID}/locations/${DIALOGFLOW_LOCATION}/agents/${DIALOGFLOW_AGENT_ID}/sessions/${req.body.sessionId}:detectIntent`;
    console.log(
      `Forwarding request to Dialogflow endpoint: ${dialogflowEndpoint}`
    );

    const dialogflowHeaders = {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    };

    const dialogflowPayload = {
      queryInput: {
        text: {
          text: req.body.queryInput.text.text,
        },
        languageCode: req.body.queryInput.languageCode,
      },
    };

    const dialogflowResponse = await axios.post(
      dialogflowEndpoint,
      dialogflowPayload,
      { headers: dialogflowHeaders }
    );

    // 3. Send Dialogflow's response back to the frontend
    res.json(dialogflowResponse.data);
  } catch (error) {
    console.error(
      "Error in local proxy server:",
      error.response ? error.response.data : error.message
    );
    if (error.response && error.response.data) {
      console.error(
        "Error response details from Google API:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    res.status(500).json({
      error: "Internal server error in proxy",
      details: error.response ? error.response.data : error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Local Dialogflow Proxy Server running on http://localhost:${PORT}`
  );
  console.log(
    "Using service account key for authentication. Ensure key file is present and service account has correct roles."
  );
});
