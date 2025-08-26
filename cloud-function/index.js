const functions = require("@google-cloud/functions-framework");
const { VertexAI } = require("@google-cloud/vertexai");

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
    return tag.replace(/['"]/g, "").trim().toUpperCase();
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

// ---- Demo "DB" for London doctors -------------
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
    return (LONDON_DOCTORS[specialty] || []).slice(0, limit);
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

  // Get AI-powered advice
  let advice = "";
  try {
    advice = await getAIAdvice(symptoms, specialty);
  } catch (error) {
    console.error("Error getting AI advice:", error);
    // Fallback to basic advice if AI fails
    advice = getBasicAdvice(specialty);
  }

  return dfReply({
    text: `Here's some advice for ${symptoms}:\n\n${advice}\n\n**Important:** This is general information only. Please consult with a healthcare professional for proper medical advice.\n\nWould you still like to see available doctors for an appointment?`,
    params: {
      ...params,
      advice_given: true,
      next_action: "ADVICE_GIVEN",
    },
  });
}

// AI-powered advice function using Vertex AI (Gemini)
async function getAIAdvice(symptoms, specialty) {
  try {
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: "healthcare-patient-portal",
      location: "us-central1",
    });

    // Get the Gemini model
    const model = vertexAI.preview.getGenerativeModel({
      model: "gemini-1.5-flash",
      generation_config: {
        max_output_tokens: 300,
        temperature: 0.3,
        top_p: 0.8,
      },
    });

    const prompt = `You are a helpful medical assistant providing general first-aid advice. 

User symptoms: "${symptoms}"
Recommended specialist: ${specialty}

Please provide:
- 4-5 practical, safe home care suggestions
- When to seek immediate medical attention
- Keep advice general and non-diagnostic
- Format as bullet points starting with •
- Be empathetic but professional

Important: Always emphasize this is not a substitute for professional medical advice and they should consult with a healthcare professional.

Provide helpful, actionable advice in a caring tone.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text && text.trim()) {
      return text.trim();
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Vertex AI error:", error);
    // Fallback to enhanced static advice
    return getEnhancedAdvice(symptoms, specialty);
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
    const when = new Date(d.next_available_iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${i + 1}. ${d.name} — ${d.clinic}. Next available: ${when}`;
  });

  return dfReply({
    text: `Here are available ${specialtyDisplayName} in London:\n\n${lines.join(
      "\n"
    )}\n\nWhich doctor would you like to book with? (You can say the number or the name.)`,
    params: {
      ...params,
      offer_doctors: doctors,
      next_action: "OFFER_DOCTORS",
    },
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
        result = await handleProvideAdvice(req.body);
        break;
      case "SHOW_DOCTORS":
      case "CHOOSE_DOCTORS":
      case "CHOOSE_SPECIALIST":
      case "CHOOSE_SPECIALIST_IR":
      case "FIND_DOCTORS":
        result = await handleShowDoctors(req.body);
        break;
      default:
        // Check if user text contains advice or doctor keywords
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
