const functions = require("@google-cloud/functions-framework");
const { VertexAI } = require("@google-cloud/vertexai");
const { Firestore } = require("@google-cloud/firestore");

// Initialize Firestore
const db = new Firestore({
  projectId: "healthcare-patient-portal", // Unified project
});

// Initialize Vertex AI once
const vertexAI = new VertexAI({
  project: "healthcare-patient-portal", // Updated to match agent project
  location: "global",
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

// ---- Cloud Database Integration (Firestore) ---------------------------
const doctorsDb = {
  async listDoctors({ specialty, location, modality, limit = 5 }) {
    try {
      const doctorsRef = db.collection("doctors");
      let query = doctorsRef;

      // Filter by specialty if provided
      if (specialty) {
        query = query.where("specialty", "==", specialty);
      }

      // Filter by location/city if provided
      if (location) {
        query = query.where("city", "==", location);
      }

      // Filter by modality if provided
      if (modality) {
        query = query.where("modalities", "array-contains", modality);
      }

      // Apply limit
      query = query.limit(limit);

      const snapshot = await query.get();
      const doctors = [];

      snapshot.forEach((doc) => {
        doctors.push({ id: doc.id, ...doc.data() });
      });

      return doctors;
    } catch (error) {
      console.error("Error fetching doctors from Firestore:", error);
      throw error;
    }
  },

  async getDoctorById(doctorId) {
    try {
      const docRef = db.collection("doctors").doc(doctorId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error("Error fetching doctor by ID:", error);
      throw error;
    }
  },

  async getAvailability(doctorId, fromDate = null, toDate = null) {
    try {
      const doctor = await this.getDoctorById(doctorId);
      if (!doctor || !doctor.availability) return {};

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
    } catch (error) {
      console.error("Error fetching doctor availability:", error);
      throw error;
    }
  },

  async getAvailableSlots(doctorId, date) {
    try {
      const doctor = await this.getDoctorById(doctorId);
      if (!doctor || !doctor.availability || !doctor.availability[date])
        return [];

      return doctor.availability[date].map((time) => ({
        slot_id: `${doctorId}-${date}-${time}`,
        date: date,
        time: time,
        datetime_iso: `${date}T${time}:00+00:00`,
        available: true,
      }));
    } catch (error) {
      console.error("Error fetching available slots:", error);
      throw error;
    }
  },

  async bookSlot(slotId, patientInfo) {
    try {
      // Extract doctor_id, date, and time from slot_id
      const [doctorId, date, time] = slotId.split("-");
      const bookingId = `BK-${Date.now()}`;

      // Create booking record in Firestore
      const bookingData = {
        booking_id: bookingId,
        doctor_id: doctorId,
        date: date,
        time: time,
        patient: patientInfo,
        status: "confirmed",
        created_at: new Date(),
      };

      // Save booking to Firestore
      await db.collection("appointments").doc(bookingId).set(bookingData);

      // TODO: Remove the slot from doctor's availability
      // TODO: Send confirmation emails

      return {
        success: true,
        booking_id: bookingId,
        doctor_id: doctorId,
        date: date,
        time: time,
        patient: patientInfo,
      };
    } catch (error) {
      console.error("Error booking appointment:", error);
      throw error;
    }
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

// ---- New webhook handlers for the new agent structure ----------------------

async function handleSymptomsAnalyzer(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  console.log("Handling symptoms analyzer with params:", params);

  const symptomsList = params.symptoms_list || "";
  const symptomDuration = params.symptom_duration_days || "";

  if (!symptomsList) {
    return dfReply({
      text: "I'd like to help analyze your symptoms. Could you please describe what you're experiencing?",
      params: {},
    });
  }

  console.log("Processing symptoms:", symptomsList);

  // Simple emergency screen
  if (
    /(chest pain|can't breathe|difficulty breathing|uncontrolled bleeding|suicid)/i.test(
      symptomsList
    )
  ) {
    return dfReply({
      text: "This could be an emergency. Please call your local emergency number now or go to the nearest emergency department.",
      params: {
        symptom_result: "emergency",
        final_status: "emergency_referral",
      },
    });
  }

  // Use AI to classify specialty based on symptoms
  let specialty, specialtyDisplayName, advice;

  try {
    const aiClassification = await classifySymptomWithAI(symptomsList);
    specialty = aiClassification.specialty;
    specialtyDisplayName = aiClassification.displayName;
    advice = aiClassification.advice;
  } catch (error) {
    console.error(
      "AI classification failed, falling back to basic patterns:",
      error
    );

    // Basic symptom classification fallback
    if (/(headache|migraine|head pain)/i.test(symptomsList)) {
      specialty = "neurology";
      specialtyDisplayName = "Neurologist";
      advice =
        "For persistent headaches, it's best to consult a neurologist who can properly evaluate your symptoms.";
    } else if (/(heart|chest|cardiac)/i.test(symptomsList)) {
      specialty = "cardiology";
      specialtyDisplayName = "Cardiologist";
      advice =
        "Heart-related symptoms should be evaluated by a cardiologist for proper diagnosis and treatment.";
    } else if (/(skin|rash|acne|mole)/i.test(symptomsList)) {
      specialty = "dermatology";
      specialtyDisplayName = "Dermatologist";
      advice =
        "Skin conditions are best treated by a dermatologist who specializes in these issues.";
    } else {
      specialty = "gp";
      specialtyDisplayName = "General Practitioner";
      advice =
        "A general practitioner can help evaluate your symptoms and provide appropriate care or referrals.";
    }
  }

  let durationText = "";
  if (symptomDuration) {
    const days = parseInt(symptomDuration);
    if (days > 0) {
      durationText = ` You mentioned these symptoms have been present for ${days} day${
        days > 1 ? "s" : ""
      }.`;
    }
  }

  const responseText = `Based on your symptoms: "${symptomsList}".${durationText}\n\n${advice}\n\nWould you like me to show you available ${specialtyDisplayName.toLowerCase()}s for an appointment?`;

  return dfReply({
    text: responseText,
    params: {
      symptoms_list: symptomsList,
      symptom_duration_days: symptomDuration,
      symptom_result: specialty,
      specialty: specialty,
      specialtyDisplayName: specialtyDisplayName,
      advice_given: advice,
    },
  });
}

async function handleCheckDoctorAvailability(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  console.log("Handling doctor availability check with params:", params);

  const selectedDoctor = params.selected_doctor_name || "";
  const insuranceProvider = params.insurance_provider || "";
  const userName = params.user_name || "";
  const dob = params.dob || "";
  const specialty = params.specialty || params.symptom_result || "gp";

  if (selectedDoctor) {
    // User has selected a specific doctor
    try {
      // Get doctor details from Firestore
      const doctorsRef = db.collection("doctors");
      const snapshot = await doctorsRef
        .where("name", "==", selectedDoctor)
        .get();

      if (snapshot.empty) {
        return dfReply({
          text: `I couldn't find Dr. ${selectedDoctor}. Let me show you available doctors instead.`,
          params: { ...params },
        });
      }

      const doctorDoc = snapshot.docs[0];
      const doctor = doctorDoc.data();

      // Check insurance compatibility if provided
      let insuranceMessage = "";
      if (insuranceProvider) {
        const acceptedInsurance = doctor.insurance_accepted || [];
        const isInsuranceAccepted = acceptedInsurance.some((ins) =>
          ins.toLowerCase().includes(insuranceProvider.toLowerCase())
        );

        if (isInsuranceAccepted) {
          insuranceMessage = `\n✅ Dr. ${doctor.name} accepts ${insuranceProvider} insurance.`;
        } else {
          insuranceMessage = `\n⚠️ Please note: Dr. ${doctor.name} may not accept ${insuranceProvider} insurance. You may want to verify this or consider other options.`;
        }
      }

      // Get available appointments
      const availabilityRef = db.collection("doctor_availability");
      const availabilitySnapshot = await availabilityRef
        .where("doctor_id", "==", doctorDoc.id)
        .where("is_available", "==", true)
        .orderBy("date")
        .limit(5)
        .get();

      if (availabilitySnapshot.empty) {
        return dfReply({
          text: `Dr. ${doctor.name} doesn't have any available appointments in the near future.${insuranceMessage}\n\nWould you like to see other available doctors?`,
          params: {
            ...params,
            final_status: "no_availability",
          },
        });
      }

      let appointmentOptions =
        "Here are the available appointment slots with Dr. " +
        doctor.name +
        ":\n\n";
      availabilitySnapshot.docs.forEach((doc, index) => {
        const slot = doc.data();
        const date = new Date(slot.date.seconds * 1000);
        appointmentOptions += `${index + 1}. ${date.toLocaleDateString()} at ${
          slot.time_slot
        }\n`;
      });

      appointmentOptions += insuranceMessage;
      appointmentOptions +=
        "\n\nPlease select a time slot by saying the number (e.g., '1' for the first option).";

      return dfReply({
        text: appointmentOptions,
        params: {
          ...params,
          selected_doctor_name: doctor.name,
          doctor_id: doctorDoc.id,
          available_slots: availabilitySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        },
      });
    } catch (error) {
      console.error("Error checking doctor availability:", error);
      return dfReply({
        text: "I encountered an error while checking availability. Please try again.",
        params: { ...params },
      });
    }
  } else {
    // Show available doctors for the specialty
    try {
      const doctorsRef = db.collection("doctors");
      let query = doctorsRef;

      if (specialty && specialty !== "gp") {
        query = query.where("specialty", "==", specialty);
      }

      const snapshot = await query.limit(5).get();

      if (snapshot.empty) {
        return dfReply({
          text: "I couldn't find any available doctors at the moment. Please try again later.",
          params: { ...params },
        });
      }

      let doctorsList = "Here are available doctors:\n\n";
      snapshot.docs.forEach((doc, index) => {
        const doctor = doc.data();
        doctorsList += `${index + 1}. **Dr. ${doctor.name}** - ${
          doctor.specialty
        }\n`;
        doctorsList += `   📍 ${doctor.location}\n`;
        doctorsList += `   ⭐ Rating: ${doctor.rating}/5\n\n`;
      });

      doctorsList +=
        "Please tell me which doctor you'd like to book with (e.g., 'Dr. Smith' or '1' for the first option).";

      return dfReply({
        text: doctorsList,
        params: {
          ...params,
          available_doctors: snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching doctors:", error);
      return dfReply({
        text: "I encountered an error while fetching available doctors. Please try again.",
        params: { ...params },
      });
    }
  }
}

async function handleFallback(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  const userText = extractUserText(body);

  return dfReply({
    text: "I can help you with healthcare services. You can describe your symptoms or ask to see available doctors. How can I assist you today?",
    params: { ...params },
  });
}

// ---- Doctor Availability Webhook -------------------------------------------
functions.http("doctorAvailabilityWebhook", async (req, res) => {
  console.log("=== DOCTOR AVAILABILITY WEBHOOK ===");
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const tag = req.body?.fulfillmentInfo?.tag;
    const params =
      (req.body.sessionInfo && req.body.sessionInfo.parameters) || {};

    console.log("Tag:", tag);
    console.log("Parameters:", params);

    let result;

    switch (tag) {
      case "get-doctor-availability-params":
        result = await handleGetDoctorAvailabilityParams(req.body);
        break;
      case "search-doctors-by-criteria":
        result = await handleSearchDoctorsByCriteria(req.body);
        break;
      default:
        // Try to parse any user input that might contain doctor search criteria
        const userText = extractUserText(req.body);
        if (userText && userText.length > 3) {
          console.log("Attempting to parse user input:", userText);
          const parsedParams = parseSearchCriteria(userText);

          // If we found at least two of the three required parameters, try to search
          const foundParams = [
            parsedParams.specialty,
            parsedParams.location,
            parsedParams.date,
          ].filter((p) => p).length;

          if (foundParams >= 2) {
            console.log("Found sufficient parameters, triggering search");
            result = await handleSearchDoctorsByCriteria(req.body);
            break;
          }
        }

        result = dfReply({
          text: "I can help you find available doctors. Please provide the doctor specialty, preferred date, and location.",
          params: { ...params },
        });
        break;
    }

    console.log("Response:", JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error("Error in doctor availability webhook:", error);
    res.status(500).json({
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [
                "Sorry, I'm having trouble searching for doctors right now. Please try again later.",
              ],
            },
          },
        ],
      },
    });
  }
});

// Handle initial doctor availability request
async function handleGetDoctorAvailabilityParams(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};
  
  // Check if we have enough parameters to start searching
  let specialty = params.specialty || params.doctor_specialty;
  let location = params.location || params.city;
  let dateParam = params.date || params.preferred_date;
  
  // Handle location object format from Dialogflow CX
  if (location && typeof location === 'object' && location.city) {
    location = location.city;
  }
  
  // If we have enough parameters, try to parse the user text for any missing ones
  if (!dateParam) {
    const userText = extractUserText(body);
    console.log("Checking user text for date:", userText);
    
    const parsedParams = parseSearchCriteria(userText);
    dateParam = dateParam || parsedParams.date;
    
    // Also check for other missing parameters
    if (!specialty) specialty = parsedParams.specialty;
    if (!location) location = parsedParams.location;
  }
  
  console.log("Available parameters:", { specialty, location, dateParam });
  
  // If we have all required parameters, trigger the search
  if (specialty && location && dateParam) {
    console.log("All parameters available, triggering search");
    return await handleSearchDoctorsByCriteria(body);
  }

  return dfReply({
    text: "Please provide the following information to find available doctors:\n\n1. **Doctor specialty** (e.g., Cardiologist, Dermatologist, General Practitioner)\n2. **Preferred date** (e.g., today, tomorrow, or specific date)\n3. **Location/City** (e.g., London, Manchester)\n\nYou can say something like: 'I need a cardiologist in London for tomorrow'",
    params: {
      ...params,
      availability_flow_started: true,
    },
  });
}

// Handle doctor search with criteria
async function handleSearchDoctorsByCriteria(body) {
  const params = (body.sessionInfo && body.sessionInfo.parameters) || {};

  let specialty = params.specialty || params.doctor_specialty;
  let location = params.location || params.city;
  let dateParam = params.date || params.preferred_date;

  // Handle location object format from Dialogflow CX
  if (location && typeof location === 'object' && location.city) {
    location = location.city;
  }

  // If parameters are not extracted, try to parse from user text
  if (!specialty || !location || !dateParam) {
    const userText = extractUserText(body);
    console.log("Trying to parse user text:", userText);

    const parsedParams = parseSearchCriteria(userText);

    specialty = specialty || parsedParams.specialty;
    location = location || parsedParams.location;
    dateParam = dateParam || parsedParams.date;
  }

  console.log("Search parameters:", { specialty, location, dateParam });

  if (!specialty || !location || !dateParam) {
    let missingParams = [];
    if (!specialty) missingParams.push("specialty");
    if (!location) missingParams.push("location");
    if (!dateParam) missingParams.push("date");

    return dfReply({
      text: `I need more information. Please provide: ${missingParams.join(
        ", "
      )}\n\nExample: "I need a cardiologist in London for tomorrow" or "Dermatologist, September 6th, Manchester"`,
      params: params,
    });
  }

  try {
    const searchResults = await searchAvailableDoctors(
      specialty,
      location,
      dateParam
    );

    if (searchResults.success && searchResults.doctors.length > 0) {
      let responseText = `I found ${searchResults.doctors.length} ${specialty} doctor(s) available in ${location} on ${searchResults.formattedDate}:\n\n`;

      searchResults.doctors.forEach((doctor, index) => {
        responseText += `**${index + 1}. Dr. ${doctor.name}**\n`;
        responseText += `   📍 ${doctor.location}\n`;
        responseText += `   ⭐ Rating: ${doctor.rating}/5\n`;
        responseText += `   🕒 Available times: ${doctor.availableTimes.join(
          ", "
        )}\n\n`;
      });

      responseText +=
        "Which doctor would you like to book an appointment with? You can say the doctor's name or number.";

      return dfReply({
        text: responseText,
        params: {
          ...params,
          search_results: searchResults.doctors,
          search_specialty: specialty,
          search_location: location,
          search_date: searchResults.formattedDate,
          next_action: "select_doctor",
        },
      });
    } else {
      return dfReply({
        text: `Sorry, I couldn't find any ${specialty} doctors available in ${location} on the requested date. Would you like to try a different date or location?`,
        params: {
          ...params,
          search_failed: true,
        },
      });
    }
  } catch (error) {
    console.error("Error searching for doctors:", error);
    return dfReply({
      text: "I'm having trouble searching for doctors right now. Please try again later.",
      params: params,
    });
  }
}

// Parse search criteria from free-form text
function parseSearchCriteria(text) {
  const result = {
    specialty: null,
    location: null,
    date: null,
  };

  if (!text) return result;

  const lowerText = text.toLowerCase();

  // Common medical specialties
  const specialties = [
    "cardiologist",
    "dermatologist",
    "neurologist",
    "psychiatrist",
    "oncologist",
    "orthopedist",
    "pediatrician",
    "gynecologist",
    "urologist",
    "ophthalmologist",
    "ent",
    "radiologist",
    "anesthesiologist",
    "pathologist",
    "endocrinologist",
    "rheumatologist",
    "pulmonologist",
    "gastroenterologist",
    "nephrologist",
    "general practitioner",
    "gp",
    "family doctor",
    "general doctor",
  ];

  // Find specialty
  for (const specialty of specialties) {
    if (lowerText.includes(specialty)) {
      result.specialty =
        specialty === "gp" ? "general practitioner" : specialty;
      break;
    }
  }

  // Common UK cities and locations
  const locations = [
    "london",
    "manchester",
    "birmingham",
    "liverpool",
    "leeds",
    "sheffield",
    "bristol",
    "glasgow",
    "edinburgh",
    "cardiff",
    "belfast",
    "newcastle",
    "nottingham",
    "bradford",
    "coventry",
    "leicester",
    "wolverhampton",
    "plymouth",
    "stoke",
    "derby",
    "southampton",
    "portsmouth",
    "york",
    "peterborough",
    "dundee",
    "lancaster",
    "preston",
    "blackpool",
  ];

  // Find location
  for (const location of locations) {
    if (lowerText.includes(location)) {
      result.location = location.charAt(0).toUpperCase() + location.slice(1);
      break;
    }
  }

  // Parse date
  // Handle formats like: 06.09.2025, 6/9/2025, September 6th, tomorrow, today
  if (lowerText.includes("today")) {
    result.date = "today";
  } else if (lowerText.includes("tomorrow")) {
    result.date = "tomorrow";
  } else {
    // Look for date patterns
    const datePatterns = [
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/, // 06.09.2025
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // 6/9/2025
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // 2025-09-06
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.date = match[0];
        break;
      }
    }
  }

  console.log("Parsed criteria:", result);
  return result;
}

// Search for available doctors based on specialty, location, and date
async function searchAvailableDoctors(specialty, location, dateParam) {
  try {
    console.log(`Searching for ${specialty} in ${location} on ${dateParam}`);

    // Process date parameter
    const searchDate = processDateParameter(dateParam);

    // Query Firestore for doctors
    let doctorsQuery = db.collection("doctors");

    // Filter by specialty (case-insensitive)
    if (
      specialty.toLowerCase() !== "any" &&
      specialty.toLowerCase() !== "general practitioner"
    ) {
      doctorsQuery = doctorsQuery.where(
        "specialty",
        "==",
        specialty.toLowerCase()
      );
    }

    const doctorsSnapshot = await doctorsQuery.limit(10).get();

    if (doctorsSnapshot.empty) {
      return { success: false, doctors: [], message: "No doctors found" };
    }

    const availableDoctors = [];

    for (const docSnapshot of doctorsSnapshot.docs) {
      const doctorData = docSnapshot.data();

      // Filter by location (check city field)
      if (
        !doctorData.city ||
        !doctorData.city.toLowerCase().includes(location.toLowerCase())
      ) {
        continue;
      }

      // Check availability for the specific date
      const availability = await checkDoctorAvailability(
        docSnapshot.id,
        searchDate
      );

      if (availability.isAvailable && availability.timeSlots.length > 0) {
        availableDoctors.push({
          id: docSnapshot.id,
          name: doctorData.name,
          specialty: doctorData.specialty,
          location: doctorData.city,
          rating: doctorData.rating || 4.5,
          availableTimes: availability.timeSlots,
          ...doctorData,
        });
      }
    }

    return {
      success: true,
      doctors: availableDoctors,
      formattedDate: formatDate(searchDate),
    };
  } catch (error) {
    console.error("Error searching doctors:", error);
    return { success: false, doctors: [], message: error.message };
  }
}

// Check if a specific doctor is available on a given date
async function checkDoctorAvailability(doctorId, date) {
  try {
    const availabilityRef = db.collection("doctor_availability");
    const availabilitySnapshot = await availabilityRef
      .where("doctor_id", "==", doctorId)
      .where("date", ">=", date)
      .where("date", "<", new Date(date.getTime() + 24 * 60 * 60 * 1000)) // Same day
      .where("is_available", "==", true)
      .get();

    const timeSlots = [];

    availabilitySnapshot.forEach((doc) => {
      const slotData = doc.data();
      if (slotData.time_slot) {
        timeSlots.push(slotData.time_slot);
      }
    });

    // If no specific availability records, generate default time slots
    if (timeSlots.length === 0) {
      const defaultSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"];
      return {
        isAvailable: true,
        timeSlots: defaultSlots,
      };
    }

    return {
      isAvailable: timeSlots.length > 0,
      timeSlots: timeSlots.sort(),
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return {
      isAvailable: false,
      timeSlots: [],
    };
  }
}

// Process date parameter from user input
function processDateParameter(dateParam) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateParam.toLowerCase().includes("today")) {
    return today;
  } else if (dateParam.toLowerCase().includes("tomorrow")) {
    return tomorrow;
  } else {
    // Try to parse the date string
    try {
      return new Date(dateParam);
    } catch (error) {
      console.log("Could not parse date, using today as default");
      return today;
    }
  }
}

// Format date for display
function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---- Main webhook handler --------------------------------------------------
functions.http("appointmentWebhook", async (req, res) => {
  console.log("=== INCOMING REQUEST ===");
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const trigger = getTrigger(req.body);
    const params =
      (req.body.sessionInfo && req.body.sessionInfo.parameters) || {};
    console.log("Trigger:", trigger);
    console.log("Parameters:", params);

    let result;

    // Handle new agent webhook structure
    if (req.body.webhookInfo && req.body.webhookInfo.tag) {
      const webhookTag = req.body.webhookInfo.tag;
      console.log("Webhook Tag:", webhookTag);

      switch (webhookTag) {
        case "symptoms-analyzer":
          result = await handleSymptomsAnalyzer(req.body);
          break;
        case "check-doctor-availability":
          result = await handleCheckDoctorAvailability(req.body);
          break;
        default:
          console.log("Unknown webhook tag:", webhookTag);
          result = await handleFallback(req.body);
          break;
      }
    } else {
      // Legacy trigger-based handling for backward compatibility
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
