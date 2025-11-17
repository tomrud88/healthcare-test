// Dialogflow Proxy Cloud Function for healthcare-poc-477108
// Provides healthcare chatbot functionality with fallback responses
const functions = require("@google-cloud/functions-framework");
const { GoogleAuth } = require("google-auth-library");
const axios = require("axios");

// Dialogflow CX configuration
const PROJECT_ID = "demo-healthcare";
const LOCATION = "global";
const AGENT_ID = "03c1c934-c637-4b3c-95da-0ad5354ff93e";

// Initialize Google Auth
const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

// Simple chatbot responses for healthcare
function getHealthcareResponse(userMessage) {
  const message = userMessage.toLowerCase();

  // Greeting responses
  if (
    message.includes("hello") ||
    message.includes("hi") ||
    message.includes("hey")
  ) {
    return {
      text: "👋 Hello! I'm your AI Health Assistant. I can help you with:\n\n• Finding doctors and specialists\n• Booking appointments\n• Answering general health questions\n• Navigating our healthcare platform\n\nHow can I assist you today?",
      richContent: {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Find Doctors" },
                { text: "Book Appointment" },
                { text: "Health Questions" },
                { text: "Contact Support" },
              ],
            },
          ],
        ],
      },
    };
  }

  // Doctor-related queries
  if (
    message.includes("doctor") ||
    message.includes("specialist") ||
    message.includes("find")
  ) {
    return {
      text: "🩺 I can help you find the right doctor! We have specialists in:\n\n• Cardiology\n• Dermatology\n• General Practice\n• Neurology\n• Ophthalmology\n• ENT\n• Dentistry\n• Physiotherapy\n\nYou can browse doctors on our Doctors page or tell me what type of specialist you're looking for.",
      richContent: {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Cardiologist" },
                { text: "Dermatologist" },
                { text: "General Practitioner" },
                { text: "View All Doctors" },
              ],
            },
          ],
        ],
      },
    };
  }

  // Appointment booking
  if (
    message.includes("appointment") ||
    message.includes("book") ||
    message.includes("schedule")
  ) {
    return {
      text: "📅 To book an appointment:\n\n1. Browse our doctors on the Doctors page\n2. Select a doctor that suits your needs\n3. Click 'Book Appointment' on their profile\n4. Choose your preferred time slot\n5. Confirm your booking\n\nWould you like me to help you find a specific type of doctor?",
      richContent: {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Browse Doctors" },
                { text: "Emergency Booking" },
                { text: "My Appointments" },
              ],
            },
          ],
        ],
      },
    };
  }

  // Health questions
  if (
    message.includes("health") ||
    message.includes("symptom") ||
    message.includes("pain") ||
    message.includes("sick")
  ) {
    return {
      text: "🏥 For health concerns and symptoms, I recommend:\n\n• Consulting with one of our qualified doctors\n• Booking an appointment for proper diagnosis\n• For emergencies, please call 999 or visit A&E\n\nI can help you find the right specialist for your specific concern. What type of symptoms are you experiencing?",
      richContent: {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Find GP" },
                { text: "Emergency Info" },
                { text: "Book Consultation" },
              ],
            },
          ],
        ],
      },
    };
  }

  // Specific specialties
  if (message.includes("heart") || message.includes("cardiac")) {
    return {
      text: "❤️ For heart-related concerns, I recommend consulting with our cardiologists:\n\n• Dr. Elizabeth Turner (London) - Rating: 4.9/5\n• Dr. Andrew Morrison (Edinburgh) - Rating: 4.8/5\n\nBoth specialists offer in-person and telemedicine consultations.",
      richContent: {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "View Cardiologists" },
                { text: "Book Heart Checkup" },
                { text: "Telemedicine Options" },
              ],
            },
          ],
        ],
      },
    };
  }

  if (message.includes("skin") || message.includes("dermat")) {
    return {
      text: "🧴 For skin conditions, our dermatologists can help:\n\n• Dr. Sarah Patel (London) - Rating: 4.9/5\n• Dr. Michael Thompson (Edinburgh) - Rating: 4.8/5\n\nThey specialize in skin cancer detection, eczema, and cosmetic dermatology.",
      richContent: {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "View Dermatologists" },
                { text: "Skin Consultation" },
                { text: "Cosmetic Services" },
              ],
            },
          ],
        ],
      },
    };
  }

  // Default response
  return {
    text: "I'm here to help with your healthcare needs! I can assist you with:\n\n• Finding and booking doctors\n• General health information\n• Navigating our platform\n• Appointment management\n\nCould you please tell me more about what you're looking for?",
    richContent: {
      richContent: [
        [
          {
            type: "chips",
            options: [
              { text: "Find Doctors" },
              { text: "Book Appointment" },
              { text: "Health Questions" },
              { text: "Platform Help" },
            ],
          },
        ],
      ],
    },
  };
}

functions.http("dialogflowProxy", async (req, res) => {
  // CORS Preflight handling
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*"); // Replace with your frontend domain in production
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  // Set CORS headers for the actual response
  res.set("Access-Control-Allow-Origin", "*"); // Replace with your frontend domain in production

  console.log("=== DIALOGFLOW PROXY REQUEST ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  try {
    // Extract user message from the request
    const userMessage = req.body?.queryInput?.text?.text || "hello";
    const sessionId = req.body?.sessionId || "default-session";

    console.log("User message:", userMessage);
    console.log("Session ID:", sessionId);

    // Get access token for Dialogflow API
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    // Construct Dialogflow CX API URL
    const apiUrl = `https://${LOCATION}-dialogflow.googleapis.com/v3/projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}/sessions/${sessionId}:detectIntent`;

    console.log("Calling Dialogflow API:", apiUrl);

    // Prepare request for Dialogflow CX
    const dialogflowRequest = {
      queryInput: {
        text: {
          text: userMessage,
        },
        languageCode: "en",
      },
    };

    // Make API call to Dialogflow CX
    const response = await axios.post(apiUrl, dialogflowRequest, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("=== DIALOGFLOW CX RESPONSE ===");
    console.log(JSON.stringify(response.data, null, 2));

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Dialogflow API error:", error.message);
    console.error("Error details:", error.response?.data || error);

    // Fallback to hardcoded response if Dialogflow fails
    const fallbackResponse = getHealthcareResponse(
      req.body?.queryInput?.text?.text || "hello"
    );

    const dialogflowResponse = {
      queryResult: {
        responseMessages: [
          {
            text: {
              text: [fallbackResponse.text],
            },
          },
        ],
      },
    };

    console.log("Using fallback response");
    return res.status(200).json(dialogflowResponse);
  }
});
