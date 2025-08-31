const functions = require("@google-cloud/functions-framework");
const { VertexAI } = require("@google-cloud/vertexai");

// Initialize Vertex AI once
const vertexAI = new VertexAI({
  project: "healthcare-patient-portal",
  location: "us-central1",
});

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
  if (tag) {
    // Remove quotes, trim whitespace, and convert to uppercase
    const cleanTag = tag.replace(/['"]/g, "").trim().toUpperCase();

    // Special handling for PROVIDE_DATE_TIME - check if user actually typed "1" or "2"
    if (cleanTag === "PROVIDE_DATE_TIME") {
      const userText = body.text || "";
      if (userText === "1") {
        return "1";
      } else if (userText === "2") {
        return "2";
      }
    }

    return cleanTag;
  }
  const intent = body?.intentInfo?.displayName;
  return (intent || "UNKNOWN").toUpperCase();
}

function extractUserText(body) {
  // Try multiple places where user text might be stored
  const sessionParams =
    (body && body.sessionInfo && body.sessionInfo.parameters) || {};
  const intentParams =
    (body && body.intentInfo && body.intentInfo.parameters) || {};

  // Check intent parameters first (where Dialogflow puts resolved values)
  if (intentParams.user_input && intentParams.user_input.resolvedValue) {
    return intentParams.user_input.resolvedValue;
  }

  // Fallback to session parameters and other locations
  return (
    sessionParams.user_input ||
    sessionParams.symptoms ||
    sessionParams.last_user_text ||
    body.text ||
    ""
  );
}

// ---- Demo "DB" for UK doctors across multiple cities -------------
const UK_DOCTORS = {
  dentist: [
    {
      doctor_id: "den-001",
      name: "Dr Emily Carter, BDS",
      clinic: "London Dental Clinic – Soho",
      city: "London",
      specialty: "dentist",
      modalities: ["in_person"],
      availability: {
        "2025-09-02": ["09:00", "10:30", "14:00", "15:30"],
        "2025-09-03": ["09:00", "11:00", "13:30", "16:00"],
        "2025-09-04": ["08:30", "10:00", "14:30"],
        "2025-09-05": ["09:30", "11:30", "15:00", "16:30"],
        "2025-09-06": ["09:00", "13:00", "14:30"],
      },
    },
    {
      doctor_id: "den-002",
      name: "Dr James Wilson, BDS",
      clinic: "Manchester Smile Centre",
      city: "Manchester",
      specialty: "dentist",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-02": ["10:00", "11:30", "15:00"],
        "2025-09-03": ["09:30", "14:00", "16:30"],
        "2025-09-04": ["08:00", "10:30", "13:00", "15:30"],
        "2025-09-05": ["09:00", "11:00", "14:30"],
        "2025-09-09": ["10:00", "13:30", "15:00", "16:00"],
      },
    },
    {
      doctor_id: "den-003",
      name: "Dr Sophie Bennett, BDS, MSc",
      clinic: "Birmingham Dental Practice",
      city: "Birmingham",
      specialty: "dentist",
      modalities: ["in_person"],
      availability: {
        "2025-09-03": ["09:00", "10:30", "15:45"],
        "2025-09-04": ["08:30", "11:00", "14:00", "16:30"],
        "2025-09-05": ["09:30", "13:00", "15:30"],
        "2025-09-06": ["10:00", "11:30", "14:30", "16:00"],
        "2025-09-10": ["09:00", "10:30", "13:30"],
      },
    },
  ],
  dermatologist: [
    {
      doctor_id: "der-001",
      name: "Dr Sarah Patel, MD",
      clinic: "Harley Street Dermatology",
      city: "London",
      specialty: "dermatologist",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-02": ["11:00", "14:30", "16:00"],
        "2025-09-03": ["09:30", "11:30", "15:00"],
        "2025-09-04": ["10:00", "13:00", "14:30", "16:30"],
        "2025-09-05": ["09:00", "11:00", "15:30"],
        "2025-09-06": ["10:30", "13:30", "15:00"],
      },
    },
    {
      doctor_id: "der-002",
      name: "Dr Michael Thompson, FRCP",
      clinic: "Edinburgh Skin Clinic",
      city: "Edinburgh",
      specialty: "dermatologist",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-02": ["10:30", "14:00", "15:30"],
        "2025-09-04": ["09:00", "11:30", "13:30", "16:00"],
        "2025-09-05": ["10:00", "14:30", "16:30"],
        "2025-09-06": ["09:30", "11:00", "15:00"],
        "2025-09-09": ["10:30", "13:00", "14:30"],
      },
    },
  ],
  gp: [
    {
      doctor_id: "gp-001",
      name: "Dr Lucy Morgan, MRCGP",
      clinic: "Soho Health Centre",
      city: "London",
      specialty: "gp",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-02": ["08:30", "10:00", "14:15", "16:30"],
        "2025-09-03": ["09:00", "11:30", "13:00", "15:30"],
        "2025-09-04": ["08:00", "10:30", "14:00", "16:00"],
        "2025-09-05": ["09:30", "11:00", "13:30", "15:00"],
        "2025-09-06": ["08:30", "10:00", "14:30", "16:30"],
      },
    },
    {
      doctor_id: "gp-002",
      name: "Dr Adam Collins, MRCGP",
      clinic: "Camden Care Practice",
      city: "London",
      specialty: "gp",
      modalities: ["in_person"],
      availability: {
        "2025-09-02": ["09:00", "11:00", "15:00"],
        "2025-09-03": ["10:00", "13:30", "16:00"],
        "2025-09-04": ["08:30", "10:30", "14:30"],
        "2025-09-05": ["09:30", "11:30", "15:30"],
        "2025-09-09": ["09:00", "13:00", "14:00"],
      },
    },
    {
      doctor_id: "gp-003",
      name: "Dr Rebecca Hayes, MBBS",
      clinic: "Bristol Family Medicine",
      city: "Bristol",
      specialty: "gp",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-02": ["09:30", "11:30", "16:30"],
        "2025-09-03": ["08:00", "10:00", "14:00", "15:30"],
        "2025-09-04": ["09:00", "11:00", "13:30", "16:00"],
        "2025-09-05": ["10:30", "14:30", "16:30"],
        "2025-09-06": ["08:30", "11:30", "15:00"],
      },
    },
    {
      doctor_id: "gp-004",
      name: "Dr David Kumar, MRCGP",
      clinic: "Leeds Medical Centre",
      city: "Leeds",
      specialty: "gp",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-03": ["08:45", "10:15", "13:45", "15:15"],
        "2025-09-04": ["09:00", "11:30", "14:00", "16:30"],
        "2025-09-05": ["08:30", "10:00", "13:00", "15:30"],
        "2025-09-06": ["09:30", "11:00", "14:30", "16:00"],
        "2025-09-09": ["08:45", "10:30", "13:30"],
      },
    },
  ],
  ent: [
    {
      doctor_id: "ent-001",
      name: "Dr Helen Foster, FRCS",
      clinic: "London ENT Specialists",
      city: "London",
      specialty: "ent",
      modalities: ["in_person"],
      availability: {
        "2025-09-02": ["10:00", "13:15", "15:45"],
        "2025-09-03": ["09:30", "11:30", "14:30", "16:30"],
        "2025-09-04": ["08:30", "10:30", "13:00", "15:00"],
        "2025-09-05": ["09:00", "11:00", "14:00", "16:00"],
        "2025-09-06": ["10:30", "13:30", "15:30"],
      },
    },
    {
      doctor_id: "ent-002",
      name: "Dr Robert Clarke, MS",
      clinic: "Glasgow Ear, Nose & Throat",
      city: "Glasgow",
      specialty: "ent",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-03": ["09:00", "11:30", "14:00"],
        "2025-09-04": ["10:00", "13:30", "15:30", "17:00"],
        "2025-09-05": ["08:30", "10:30", "14:30"],
        "2025-09-06": ["09:30", "11:00", "15:00", "16:30"],
        "2025-09-09": ["10:00", "13:00", "14:30"],
      },
    },
  ],
  ophthalmologist: [
    {
      doctor_id: "oph-001",
      name: "Dr Amanda Price, FRCOphth",
      clinic: "Manchester Eye Hospital",
      city: "Manchester",
      specialty: "ophthalmologist",
      modalities: ["in_person"],
      availability: {
        "2025-09-02": ["09:00", "12:00", "15:00"],
        "2025-09-03": ["10:30", "13:30", "16:00"],
        "2025-09-04": ["08:30", "11:00", "14:30"],
        "2025-09-05": ["09:30", "12:30", "15:30"],
        "2025-09-06": ["10:00", "13:00", "16:30"],
      },
    },
    {
      doctor_id: "oph-002",
      name: "Dr Christopher Lee, MBBS",
      clinic: "Birmingham Vision Centre",
      city: "Birmingham",
      specialty: "ophthalmologist",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-03": ["09:00", "11:00", "14:45"],
        "2025-09-04": ["10:30", "13:00", "15:30", "17:00"],
        "2025-09-05": ["08:30", "10:00", "14:00", "16:30"],
        "2025-09-06": ["09:30", "12:00", "15:00"],
        "2025-09-10": ["10:00", "13:30", "16:00"],
      },
    },
  ],
  cardiologist: [
    {
      doctor_id: "car-001",
      name: "Dr Elizabeth Turner, FRCP",
      clinic: "Heart & Vascular Institute London",
      city: "London",
      specialty: "cardiologist",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-02": ["09:30", "11:30", "14:30"],
        "2025-09-03": ["10:00", "13:00", "15:30", "17:00"],
        "2025-09-04": ["08:30", "10:30", "14:00", "16:00"],
        "2025-09-05": ["09:00", "11:00", "15:00"],
        "2025-09-06": ["10:30", "13:30", "16:30"],
      },
    },
    {
      doctor_id: "car-002",
      name: "Dr Andrew Morrison, MD",
      clinic: "Edinburgh Cardiac Centre",
      city: "Edinburgh",
      specialty: "cardiologist",
      modalities: ["in_person"],
      availability: {
        "2025-09-03": ["09:00", "10:15", "14:30"],
        "2025-09-04": ["11:00", "13:30", "16:00"],
        "2025-09-05": ["08:30", "10:30", "15:30"],
        "2025-09-06": ["09:30", "11:30", "14:00", "16:30"],
        "2025-09-09": ["10:15", "13:00", "15:00"],
      },
    },
  ],
  neurologist: [
    {
      doctor_id: "neu-001",
      name: "Dr Victoria Singh, FRCP",
      clinic: "Bristol Neurology Clinic",
      city: "Bristol",
      specialty: "neurologist",
      modalities: ["in_person", "telemedicine"],
      availability: {
        "2025-09-02": ["10:00", "13:00", "15:30"],
        "2025-09-03": ["09:30", "11:30", "14:30", "16:30"],
        "2025-09-04": ["08:30", "10:30", "13:30", "15:00"],
        "2025-09-05": ["09:00", "11:00", "14:00", "16:00"],
        "2025-09-06": ["10:30", "13:00", "15:30"],
      },
    },
    {
      doctor_id: "neu-002",
      name: "Dr Thomas Evans, MBBS",
      clinic: "Leeds Brain & Spine Centre",
      city: "Leeds",
      specialty: "neurologist",
      modalities: ["in_person"],
      availability: {
        "2025-09-04": ["09:00", "11:30", "15:30"],
        "2025-09-05": ["10:00", "13:00", "16:00"],
        "2025-09-06": ["08:30", "10:30", "14:30"],
        "2025-09-09": ["09:30", "11:00", "15:00", "17:00"],
        "2025-09-10": ["10:30", "13:30", "16:30"],
      },
    },
  ],
};

const doctorsDb = {
  async listDoctors({ specialty, location, modality, limit = 5 }) {
    return (UK_DOCTORS[specialty] || []).slice(0, limit);
  },

  async getDoctorById(doctorId) {
    // Find doctor across all specialties
    for (const specialty in UK_DOCTORS) {
      const doctor = UK_DOCTORS[specialty].find(
        (d) => d.doctor_id === doctorId
      );
      if (doctor) return doctor;
    }
    return null;
  },

  async getAvailability(doctorId, fromDate = null, toDate = null) {
    const doctor = await this.getDoctorById(doctorId);
    if (!doctor) return {};

    let availability = doctor.availability;

    // Filter by date range if provided
    if (fromDate || toDate) {
      const filtered = {};
      Object.keys(availability).forEach((date) => {
        const dateObj = new Date(date);
        const from = fromDate ? new Date(fromDate) : new Date("1900-01-01");
        const to = toDate ? new Date(toDate) : new Date("2100-12-31");

        if (dateObj >= from && dateObj <= to) {
          filtered[date] = availability[date];
        }
      });
      availability = filtered;
    }

    return availability;
  },

  async getAvailableSlots(doctorId, date) {
    const doctor = await this.getDoctorById(doctorId);
    if (!doctor || !doctor.availability[date]) return [];

    return doctor.availability[date].map((time) => ({
      slot_id: `${doctorId}-${date}-${time}`,
      date: date,
      time: time,
      datetime_iso: `${date}T${time}:00+00:00`,
      available: true,
    }));
  },

  async bookSlot(slotId, patientInfo) {
    // Extract doctor_id, date, and time from slot_id
    const [doctorId, date, time] = slotId.split("-");

    // In a real system, you would:
    // 1. Remove the slot from availability
    // 2. Create a booking record
    // 3. Send confirmation emails

    return {
      success: true,
      booking_id: `BK-${Date.now()}`,
      doctor_id: doctorId,
      date: date,
      time: time,
      patient: patientInfo,
    };
  },
};

// ---- Intent/tag handlers ---------------------------------------------------
async function handleDescribeSymptom(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const userText = extractUserText(body);

  console.log("Processing symptom:", userText);

  // Check if user is directly asking for doctors instead of describing symptoms
  if (
    /find.*doctor|show.*doctor|book.*appointment|see.*doctor|doctor.*list|available.*doctor|list.*doctor/i.test(
      userText
    )
  ) {
    // User wants to find doctors directly - redirect to show doctors with GP as default
    return await handleShowDoctors({
      ...body,
      sessionInfo: {
        ...body.sessionInfo,
        parameters: {
          ...params,
          specialty: "gp",
          specialtyDisplayName: "General Practitioners",
          symptoms: userText,
        },
      },
    });
  }

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

  // Use AI to classify specialty based on symptoms - much smarter than regex!
  let specialty, specialtyDisplayName;

  try {
    const aiClassification = await classifySymptomWithAI(userText);
    specialty = aiClassification.specialty;
    specialtyDisplayName = aiClassification.displayName;
  } catch (error) {
    console.error(
      "AI classification failed, falling back to basic patterns:",
      error
    );
    // Fallback to basic classification if AI fails
    ({ specialty, specialtyDisplayName } = classifySymptomBasic(userText));
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

  // Use enhanced pattern-based advice until AI models are accessible
  const advice = getEnhancedAdvice(symptoms, specialty);

  return dfReply({
    text: `${advice}\n\nWould you still like to see available doctors for an appointment?`,
    params: {
      ...params,
      advice_given: true,
      next_action: "ADVICE_GIVEN",
    },
  });
}

// AI-powered symptom classification using Vertex AI
async function classifySymptomWithAI(symptoms) {
  try {
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: "healthcare-patient-portal",
      location: "us-central1",
    });

    // Get the Gemini model
    const model = vertexAI.preview.getGenerativeModel({
      model: "gemini-pro",
      generation_config: {
        max_output_tokens: 100,
        temperature: 0.1, // Low temperature for consistent classification
        top_p: 0.8,
      },
    });

    const prompt = `You are a medical triage assistant. Classify the following symptom or health concern into the most appropriate medical specialty.

Available specialties:
- dentist (for teeth, gums, dental issues, toothache, dental pain, etc.)
- dermatologist (for skin, rash, acne, moles, etc.)
- ophthalmologist (for eyes, vision, sight issues, etc.)
- ent (for ear, nose, throat, sinus, hearing issues, etc.)
- cardiologist (for heart, chest pain, cardiovascular issues, etc.)
- neurologist (for brain, headache, neurological issues, etc.)
- gp (for general health concerns, unknown symptoms, or multiple systems)

User input: "${symptoms}"

Respond with ONLY a JSON object in this exact format:
{"specialty": "dentist", "displayName": "Dentists"}

Be very accurate with spelling detection - "totache", "toothach", "tootache" should all map to "dentist".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse the JSON response
    const classification = JSON.parse(text);

    // Validate the response
    if (classification.specialty && classification.displayName) {
      console.log(`AI classified "${symptoms}" as ${classification.specialty}`);
      return classification;
    } else {
      throw new Error("Invalid AI response format");
    }
  } catch (error) {
    console.error("AI classification error:", error);
    throw error;
  }
}

// Fallback basic classification function
function classifySymptomBasic(userText) {
  if (
    /tooth|teeth|gum|dent|totache|toothach|toothake|tootache|dental|cavity|cavities|molar|wisdom.*tooth|root.*canal/i.test(
      userText
    )
  ) {
    return { specialty: "dentist", specialtyDisplayName: "Dentists" };
  } else if (
    /skin|rash|acne|derma|mole|eczema|psoriasis|spot|bump|itch|hive|blister|wart/i.test(
      userText
    )
  ) {
    return {
      specialty: "dermatologist",
      specialtyDisplayName: "Dermatologists",
    };
  } else if (
    /eye|vision|ophthal|sight|blind|cataract|glaucoma|blurry|blur|see|optical/i.test(
      userText
    )
  ) {
    return {
      specialty: "ophthalmologist",
      specialtyDisplayName: "Ophthalmologists",
    };
  } else if (
    /ear|nose|throat|sinus|\bent\b|runny nose|hearing problems|tinnitus|vertigo|stuffy|congestion|sore throat|earache|earach/i.test(
      userText
    )
  ) {
    return { specialty: "ent", specialtyDisplayName: "ENT Specialists" };
  } else if (
    /heart|chest pain|palpitation|cardiac|cardiovascular|blood pressure|hypertension|shortness.*breath|breath.*short/i.test(
      userText
    )
  ) {
    return { specialty: "cardiologist", specialtyDisplayName: "Cardiologists" };
  } else if (
    /brain|headache|migraine|seizure|neurological|memory|confusion|stroke|epilepsy|headach|migrain|dizzy|dizziness/i.test(
      userText
    )
  ) {
    return { specialty: "neurologist", specialtyDisplayName: "Neurologists" };
  } else {
    return { specialty: "gp", specialtyDisplayName: "General Practitioners" };
  }
}

// AI-powered advice function using Vertex AI (Gemini)
async function getAIAdvice(symptoms, specialty) {
  try {
    // Get the Gemini model
    const model = vertexAI.preview.getGenerativeModel({
      model: "gemini-pro",
      generation_config: {
        max_output_tokens: 400,
        temperature: 0.3,
        top_p: 0.8,
      },
    });

    const prompt = `You are a helpful medical assistant providing targeted first-aid advice. 

User symptoms: "${symptoms}"
Recommended specialist: ${specialty}

Based on the specialist type (${specialty}), provide personalized advice that's specifically relevant to their condition:

For Dental issues: Focus on oral pain management, dental hygiene, what to avoid
For Respiratory issues: Focus on breathing, throat care, humidity, rest
For Skin issues: Focus on skin protection, avoiding irritants, gentle care
For General/GP issues: Provide comprehensive general wellness advice for the specific symptoms
For Heart issues: Focus on rest, monitoring symptoms, avoiding strain
For Mental Health: Focus on coping strategies, stress management, support

Please provide a complete response with:
- A caring introduction: "Here's some advice for your [specific condition/symptoms]:"
- 4-6 practical, safe home care suggestions specifically for their symptoms (e.g., for leg pain: RICE method, elevation, gentle movement, etc.)
- Clear guidance on when to seek immediate medical attention
- A professional disclaimer: "**Important:** This is general guidance only. Please consult with a healthcare professional for proper evaluation and treatment specific to your condition."
- Keep advice general and non-diagnostic
- Format suggestions as bullet points starting with •
- Be empathetic but professional
- Handle misspellings naturally

Provide helpful, actionable advice that directly addresses their specific symptoms in a caring tone.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text && text.trim()) {
      console.log(`AI generated advice for "${symptoms}":`, text.trim());
      return text.trim();
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Vertex AI error:", error);
    // Simple fallback without calling hardcoded function
    return `For your symptoms related to ${symptoms}:

• Rest and monitor your symptoms carefully
• Stay hydrated and maintain a healthy diet
• Apply basic first aid if appropriate (cold/warm compress, gentle care)
• Take over-the-counter medications as directed if suitable
• Keep track of when symptoms started and any changes
• Seek medical attention if symptoms worsen or persist

**Important:** This is general guidance only. Please consult with a healthcare professional for proper evaluation and treatment specific to your condition.`;
  }
}

// Enhanced advice based on specific symptoms
function getEnhancedAdvice(symptoms, specialty) {
  const lowerSymptoms = symptoms.toLowerCase();

  if (specialty === "dentist" || /tooth|teeth|gum|dental/i.test(symptoms)) {
    if (/severe|unbearable|swelling|fever/i.test(symptoms)) {
      return "**For severe dental pain:**\n• Seek immediate dental care - this could be a serious infection\n• Take over-the-counter pain relief as directed\n• Rinse gently with warm salt water\n• Apply cold compress to outside of cheek (not directly on tooth)\n• Avoid very hot or cold foods and drinks\n• **Go to emergency room if you have fever, facial swelling, or difficulty swallowing**";
    } else {
      return "**For dental discomfort:**\n• Rinse with warm salt water (1/2 tsp salt in warm water)\n• Take over-the-counter pain relief (ibuprofen or acetaminophen) as directed\n• Avoid very hot, cold, or sweet foods\n• Use a cold compress on the outside of your cheek for 15-20 minutes\n• Schedule a dental appointment as soon as possible\n• **Seek immediate care if pain becomes severe or you develop swelling**";
    }
  } else if (
    specialty === "ent" ||
    /ear|nose|throat|sinus|runny|hearing/i.test(symptoms)
  ) {
    if (/runny nose|nasal/i.test(symptoms)) {
      return "**For runny nose and nasal symptoms:**\n• Stay well hydrated with water, herbal teas, or warm broths\n• Use a humidifier or breathe steam from a hot shower\n• Try saline nasal spray or rinse to clear nasal passages\n• Rest and avoid irritants like smoke or strong perfumes\n• Consider over-the-counter decongestants if appropriate for your age/health\n• **See a doctor if symptoms persist over 10 days or worsen**";
    } else if (/hearing|ear/i.test(symptoms)) {
      return "**For hearing or ear problems:**\n• Avoid inserting anything into your ear canal\n• Try gentle jaw movements or yawning to help equalize pressure\n• Use over-the-counter pain relief if there's discomfort\n• Apply a warm compress to the outside of the ear\n• Keep ears dry and avoid swimming until evaluated\n• **Seek immediate care for severe pain, discharge, or sudden hearing loss**";
    } else {
      return "**For ear, nose, or throat symptoms:**\n• Stay hydrated with warm liquids like tea with honey\n• Use a humidifier or breathe steam to ease congestion\n• Gargle with warm salt water for throat discomfort\n• Rest your voice and avoid whispering or shouting\n• Consider over-the-counter pain relief if needed\n• **Contact a healthcare provider if symptoms worsen or persist**";
    }
  } else if (/headache|head pain|migraine/i.test(symptoms)) {
    if (/severe|worst ever|sudden/i.test(symptoms)) {
      return "**For severe or sudden headache:**\n• **Seek immediate medical attention** - severe sudden headaches need urgent evaluation\n• Do not drive yourself - have someone take you or call emergency services\n• Note when it started and any associated symptoms\n• Avoid bright lights and loud noises\n• Do not take multiple pain medications without medical guidance";
    } else {
      return "**For headache relief:**\n• Rest in a quiet, dark room\n• Apply a cold or warm compress to your head or neck\n• Stay hydrated - drink water steadily\n• Take over-the-counter pain relief (acetaminophen or ibuprofen) as directed\n• Try gentle neck and shoulder stretches\n• **Seek medical care if headaches are frequent, severe, or come with fever, vision changes, or neck stiffness**";
    }
  } else if (
    /leg pain|leg ache|leg hurt|muscle pain|shin|calf|thigh/i.test(symptoms)
  ) {
    return "**For leg pain:**\n• Rest and elevate your leg above heart level when possible\n• Apply ice for 15-20 minutes if there's swelling or acute injury\n• Use heat therapy for muscle stiffness (warm bath or heating pad)\n• Take over-the-counter pain relief (ibuprofen or acetaminophen) as directed\n• Gently stretch and move the leg to prevent stiffness\n• Wear compression stockings if you have circulation issues\n• **Seek immediate care for severe pain, numbness, tingling, or if leg is cold/blue**";
  } else if (/back pain|spine|lower back|upper back/i.test(symptoms)) {
    return "**For back pain:**\n• Apply ice for the first 24-48 hours, then switch to heat\n• Take over-the-counter anti-inflammatory medication as directed\n• Keep moving with gentle activities like walking\n• Sleep on your side with a pillow between your knees\n• Practice good posture when sitting and standing\n• Avoid bed rest for more than 1-2 days\n• **Seek immediate care for severe pain with numbness, weakness, or bowel/bladder issues**";
  } else {
    return "**General symptom management:**\n• Rest and give your body time to recover\n• Stay well hydrated with water or clear fluids\n• Monitor your symptoms and note any changes\n• Take your temperature if you feel unwell\n• Consider over-the-counter medications appropriate for your symptoms\n• **Contact a healthcare provider if symptoms worsen, persist, or you develop new concerning symptoms**";
  }
}

// Fallback basic advice function
function getBasicAdvice(specialty) {
  if (specialty === "dentist") {
    return "For dental issues:\n• Rinse with warm salt water\n• Take over-the-counter pain relief if needed\n• Avoid very hot or cold foods\n• See a dentist as soon as possible for proper treatment";
  } else if (specialty === "ent") {
    return "For ear, nose, and throat symptoms:\n• Stay hydrated\n• Use a humidifier or steam inhalation\n• Rest your voice if you have throat issues\n• Consider over-the-counter decongestants if appropriate\n• See a doctor if symptoms persist or worsen";
  } else if (specialty === "dermatologist") {
    return "For skin issues:\n• Keep the area clean and dry\n• Avoid scratching\n• Use gentle, fragrance-free products\n• Consider cool compresses for irritation\n• See a dermatologist for persistent or concerning skin changes";
  } else if (specialty === "ophthalmologist") {
    return "For eye problems:\n• Avoid rubbing your eyes\n• Use clean hands when touching your eye area\n• Consider artificial tears for dryness\n• Protect your eyes from bright light\n• Seek immediate care for sudden vision changes";
  } else {
    return "General health advice:\n• Rest and stay hydrated\n• Monitor your symptoms\n• Take your temperature if you feel unwell\n• Consider over-the-counter medications if appropriate\n• Contact a healthcare provider if symptoms worsen or persist";
  }
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

  const lines = doctors.map((d, i) => {
    // Get first available date and time from availability
    const availableDates = Object.keys(d.availability).sort();
    const firstDate = availableDates[0];
    const firstTime = firstDate ? d.availability[firstDate][0] : null;

    let nextAvailable = "No availability";
    if (firstDate && firstTime) {
      const dateTime = new Date(`${firstDate}T${firstTime}:00+00:00`);
      nextAvailable = dateTime.toLocaleString("en-GB", {
        timeZone: "Europe/London",
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return `${i + 1}. ${d.name} — ${d.clinic}, ${
      d.city
    }. Next available: ${nextAvailable}`;
  });

  return dfReply({
    text: `Here are available ${specialtyDisplayName} across the UK:\n\n${lines.join(
      "\n"
    )}\n\nWhich doctor would you like to book with? (You can say the number or the name.)`,
    params: {
      ...params,
      offer_doctors: doctors,
      next_action: "OFFER_DOCTORS",
    },
  });
}

async function handleChooseDoctor(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const doctors = params.offer_doctors || [];
  const userText = extractUserText(body).toLowerCase();

  let chosenDoctor = null;

  // Try to match by number
  const num = parseInt((userText.match(/\d+/) || [])[0] || "", 10);
  if (num && doctors[num - 1]) {
    chosenDoctor = doctors[num - 1];
  }

  // Try to match by name
  if (!chosenDoctor) {
    chosenDoctor = doctors.find((d) =>
      d.name
        .toLowerCase()
        .split(/\s+/)
        .some((part) => userText.includes(part))
    );
  }

  if (!chosenDoctor) {
    return dfReply({
      text: "I couldn't match that doctor. Please say the number from the list or the doctor's name.",
      params: { ...params, next_action: "OFFER_DOCTORS" },
    });
  }

  // Get availability for the next 2 weeks
  const availability = await doctorsDb.getAvailability(chosenDoctor.doctor_id);
  const availableDates = Object.keys(availability).sort();

  if (availableDates.length === 0) {
    return dfReply({
      text: `${chosenDoctor.name} has no available appointments currently. Would you like to see another doctor?`,
      params: { ...params, next_action: "OFFER_DOCTORS" },
    });
  }

  // Show available dates
  const dateOptions = availableDates.slice(0, 7).map((date, i) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const slotsCount = availability[date].length;
    return `${i + 1}. ${formattedDate} (${slotsCount} slots available)`;
  });

  return dfReply({
    text: `Great! You've selected ${chosenDoctor.name} at ${
      chosenDoctor.clinic
    }.\n\nHere are available dates:\n\n${dateOptions.join(
      "\n"
    )}\n\nWhich date would you prefer? (You can say the number or the date)`,
    params: {
      ...params,
      selected_doctor: chosenDoctor,
      available_dates: availableDates.slice(0, 7),
      availability: availability,
      next_action: "CHOOSE_DATE",
    },
  });
}

async function handleChooseDate(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const availableDates = params.available_dates || [];
  const availability = params.availability || {};
  const selectedDoctor = params.selected_doctor;
  const userText = extractUserText(body).toLowerCase();

  let chosenDate = null;

  // Try to match by number
  const num = parseInt((userText.match(/\d+/) || [])[0] || "", 10);
  if (num && availableDates[num - 1]) {
    chosenDate = availableDates[num - 1];
  }

  // Try to match by date words
  if (!chosenDate) {
    chosenDate = availableDates.find((date) => {
      const dateObj = new Date(date);
      const dayName = dateObj
        .toLocaleDateString("en-GB", { weekday: "long" })
        .toLowerCase();
      const shortDay = dateObj
        .toLocaleDateString("en-GB", { weekday: "short" })
        .toLowerCase();
      return userText.includes(dayName) || userText.includes(shortDay);
    });
  }

  if (!chosenDate) {
    return dfReply({
      text: "I couldn't match that date. Please say the number from the list or the day name.",
      params: { ...params, next_action: "CHOOSE_DATE" },
    });
  }

  // Get time slots for chosen date
  const timeSlots = await doctorsDb.getAvailableSlots(
    selectedDoctor.doctor_id,
    chosenDate
  );

  if (timeSlots.length === 0) {
    return dfReply({
      text: `Sorry, that date is no longer available. Please choose another date.`,
      params: { ...params, next_action: "CHOOSE_DATE" },
    });
  }

  const timeOptions = timeSlots.map((slot, i) => {
    const timeFormatted = new Date(
      `2000-01-01T${slot.time}:00`
    ).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${i + 1}. ${timeFormatted}`;
  });

  const dateFormatted = new Date(chosenDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return dfReply({
    text: `Perfect! You've chosen ${dateFormatted}.\n\nAvailable times:\n\n${timeOptions.join(
      "\n"
    )}\n\nWhich time works best for you?`,
    params: {
      ...params,
      selected_date: chosenDate,
      available_slots: timeSlots,
      next_action: "CHOOSE_TIME",
    },
  });
}

async function handleChooseTime(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const availableSlots = params.available_slots || [];
  const selectedDoctor = params.selected_doctor;
  const selectedDate = params.selected_date;
  const userText = extractUserText(body).toLowerCase();

  let chosenSlot = null;

  // Try to match by number
  const num = parseInt((userText.match(/\d+/) || [])[0] || "", 10);
  if (num && availableSlots[num - 1]) {
    chosenSlot = availableSlots[num - 1];
  }

  // Try to match by time
  if (!chosenSlot) {
    chosenSlot = availableSlots.find((slot) => {
      const timeStr = slot.time.replace(":", "");
      return userText.includes(slot.time) || userText.includes(timeStr);
    });
  }

  if (!chosenSlot) {
    return dfReply({
      text: "I couldn't match that time. Please say the number from the list or the exact time.",
      params: { ...params, next_action: "CHOOSE_TIME" },
    });
  }

  const dateFormatted = new Date(selectedDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const timeFormatted = new Date(
    `2000-01-01T${chosenSlot.time}:00`
  ).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return dfReply({
    text: `Excellent! You've selected:\n\n📅 **${selectedDoctor.name}**\n🏥 ${selectedDoctor.clinic}\n📍 ${selectedDate} at ${timeFormatted}\n\nTo confirm your appointment, I'll need:\n• Your full name\n• Phone number or email address\n\nPlease provide this information to complete your booking.`,
    params: {
      ...params,
      selected_slot: chosenSlot,
      next_action: "COLLECT_CONTACT_INFO",
    },
  });
}

async function handleCollectContactInfo(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const selectedDoctor = params.selected_doctor;
  const selectedSlot = params.selected_slot;
  const userText = extractUserText(body);

  // Extract name and contact info from user text
  // In a real implementation, you'd use better NLP or ask for specific fields
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex =
    /(?:\+44|0)[\s-]?(?:\d{4}[\s-]?\d{6}|\d{3}[\s-]?\d{3}[\s-]?\d{4})/;

  const email = userText.match(emailRegex)?.[0];
  const phone = userText.match(phoneRegex)?.[0];

  // Simple name extraction (everything before email/phone or first few words)
  let name = userText.replace(emailRegex, "").replace(phoneRegex, "").trim();
  if (name.length > 50) {
    name = name.split(" ").slice(0, 3).join(" ");
  }

  if (!name || (!email && !phone)) {
    return dfReply({
      text: "Please provide your full name and either a phone number or email address. For example: 'John Smith, john@email.com' or 'Jane Doe, 07123 456789'",
      params: { ...params, next_action: "COLLECT_CONTACT_INFO" },
    });
  }

  // Book the appointment
  const booking = await doctorsDb.bookSlot(selectedSlot.slot_id, {
    name,
    email,
    phone,
  });

  if (booking.success) {
    const dateFormatted = new Date(selectedSlot.date).toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }
    );

    const timeFormatted = new Date(
      `2000-01-01T${selectedSlot.time}:00`
    ).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return dfReply({
      text: `🎉 **Appointment Confirmed!**\n\n📋 **Booking Reference:** ${
        booking.booking_id
      }\n👨‍⚕️ **Doctor:** ${selectedDoctor.name}\n🏥 **Clinic:** ${
        selectedDoctor.clinic
      }\n📅 **Date:** ${dateFormatted}\n🕐 **Time:** ${timeFormatted}\n👤 **Patient:** ${name}\n\nYou'll receive a confirmation ${
        email ? "email" : "SMS"
      } shortly. Please arrive 10 minutes early for your appointment.\n\nIs there anything else I can help you with?`,
      params: {
        ...params,
        booking_confirmed: true,
        booking_id: booking.booking_id,
        next_action: "BOOKING_COMPLETE",
      },
    });
  } else {
    return dfReply({
      text: "Sorry, that time slot was just taken by another patient. Would you like to choose a different time?",
      params: { ...params, next_action: "CHOOSE_TIME" },
    });
  }
}

// ---- Main webhook handler --------------------------------------------------
functions.http("appointmentWebhook", async (req, res) => {
  console.log("=== INCOMING REQUEST ===");
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const trigger = getTrigger(req.body);
    console.log("Trigger:", trigger);

    let result;
    switch (trigger) {
      case "DESCRIBE_SYMPTOM":
      case "DESCRIBE_SYMPTOM_IR":
      case "DESCRIBE_SYMTOM": // accept typo
      case "DESCRIBE_SYMTOM_IR":
      case "DESCRIBE-SYMTOM_IR": // accept hyphen
        result = await handleDescribeSymptom(req.body);
        break;
      case "PROVIDE_ADVICE":
      case "ASK_ADVICE":
      case "ASK_ADVICE_IR":
      case "GIVE_ADVICE":
      case "1": // Handle when user types "1" for advice
        result = await handleProvideAdvice(req.body);
        break;
      case "SHOW_DOCTORS":
      case "CHOOSE_DOCTORS":
      case "CHOOSE_SPECIALIST":
      case "CHOOSE_SPECIALIST_IR":
      case "FIND_DOCTORS":
      case "2": // Handle when user types "2" for doctors
        result = await handleShowDoctors(req.body);
        break;
      case "CHOOSE_DOCTOR":
      case "SELECT_DOCTOR":
        result = await handleChooseDoctor(req.body);
        break;
      case "CHOOSE_DATE":
      case "SELECT_DATE":
        result = await handleChooseDate(req.body);
        break;
      case "CHOOSE_TIME":
      case "SELECT_TIME":
        result = await handleChooseTime(req.body);
        break;
      case "PROVIDE_CONTACT":
      case "COLLECT_CONTACT_INFO":
        result = await handleCollectContactInfo(req.body);
        break;
      case "CONFIRM_YES":
        // Handle when user says "yes" after getting advice
        const params =
          (req.body.sessionInfo && req.body.sessionInfo.parameters) || {};
        if (params.next_action === "ADVICE_GIVEN" && params.advice_given) {
          // User wants to see doctors after getting advice
          result = await handleShowDoctors(req.body);
        } else {
          // Other "yes" contexts - fall through to default logic
          result = null;
        }
        break;
      case "PROVIDE_DATE_TIME":
        // Handle when Dialogflow misinterprets "1" or "2" as time
        // Fall through to default case logic
        result = null;
        break;
      default:
        // For unknown triggers, set result to null to trigger default logic
        result = null;
        break;
    }

    // Handle cases where result is null (from PROVIDE_DATE_TIME or default)
    if (!result) {
      const userText = extractUserText(req.body).toLowerCase();
      const params =
        (req.body.sessionInfo && req.body.sessionInfo.parameters) || {};

      // Handle numeric choices (1 = advice, 2 = doctors)
      if (/^1$|^advice$|get.*advice|medical.*advice/i.test(userText)) {
        result = await handleProvideAdvice(req.body);
      } else if (
        /^2$|^doctors?$|show.*doctor|available.*doctor|find.*doctor/i.test(
          userText
        )
      ) {
        result = await handleShowDoctors(req.body);
      } else if (params.next_action === "CHOOSE_OPTION") {
        // User is in the choice context but didn't choose a valid option
        result = dfReply({
          text: "Please choose either:\n\n1. **Get medical advice** for your symptoms\n2. **Show available doctors** for an appointment\n\nYou can type '1', '2', 'advice', or 'doctors'.",
          params: { ...params },
        });
      } else if (params.next_action === "OFFER_DOCTORS") {
        // User is choosing a doctor from the list
        result = await handleChooseDoctor(req.body);
      } else if (params.next_action === "CHOOSE_DATE") {
        // User is choosing a date from the calendar
        result = await handleChooseDate(req.body);
      } else if (params.next_action === "CHOOSE_TIME") {
        // User is choosing a time slot
        result = await handleChooseTime(req.body);
      } else if (params.next_action === "COLLECT_CONTACT_INFO") {
        // User is providing contact information
        result = await handleCollectContactInfo(req.body);
      } else {
        result = dfReply({
          text: "I can help you find healthcare services. Try describing your symptoms.",
          params: { next_action: "UNKNOWN_TRIGGER" },
        });
      }
    }

    console.log("Response:", JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: ["Sorry, there was an error processing your request."],
            },
          },
        ],
      },
    });
  }
});
