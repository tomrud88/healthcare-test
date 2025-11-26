const functions = require("firebase-functions");
const axios = require("axios");

// OpenAI Health Search Proxy
exports.openaiHealthSearch = functions.https.onRequest(async (req, res) => {
  // CORS Preflight handling
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }
  try {
    // Gemini API key (Google AI) from Firebase environment config
    const geminiApiKey =
      functions.config().gemini && functions.config().gemini.key;
    if (!geminiApiKey) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta1/models/gemini-pro:generateContent?key=" +
        geminiApiKey,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: query }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const answer =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No info found.";
    res.json({ result: answer });
  } catch (err) {
    console.error(
      "Gemini health search error:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch info from Gemini" });
  }
});
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const GYMS_COLLECTION = "gyms";

// Gyms Service
exports.gymsService = functions.https.onRequest(async (req, res) => {
  // CORS Preflight handling
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  // Set CORS headers for the actual response
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  console.log(`${req.method} request to gymsService`);
  console.log("Request body:", req.body);
  console.log("Query params:", req.query);

  try {
    switch (req.method) {
      case "GET":
        if (req.query.action === "getAllGyms") {
          return await getAllGyms(req, res);
        } else if (req.query.action === "getGymById") {
          return await getGymById(req, res);
        } else if (req.query.action === "searchGyms") {
          return await searchGyms(req, res);
        } else if (req.query.action === "getCities") {
          return await getGymCities(req, res);
        } else {
          return await getAllGyms(req, res);
        }

      case "POST":
        if (req.body.action === "createGym") {
          return await createGym(req, res);
        } else if (req.body.action === "migrateLocalData") {
          return await migrateLocalData(req, res);
        } else {
          return await createGym(req, res);
        }

      case "PUT":
        return await updateGym(req, res);

      case "DELETE":
        return await deleteGym(req, res);

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in gymsService:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get all gyms
async function getAllGyms(req, res) {
  try {
    console.log("Fetching all gyms from Firestore...");

    const snapshot = await db.collection(GYMS_COLLECTION).get();
    const gyms = [];

    snapshot.forEach((doc) => {
      gyms.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Found ${gyms.length} gyms`);
    return res.status(200).json(gyms);
  } catch (error) {
    console.error("Error fetching all gyms:", error);
    return res.status(500).json({
      error: "Failed to fetch gyms",
      message: error.message,
    });
  }
}

// Get gym by ID
async function getGymById(req, res) {
  try {
    const { gymId } = req.query;

    if (!gymId) {
      return res.status(400).json({ error: "gymId is required" });
    }

    console.log(`Fetching gym with ID: ${gymId}`);

    const doc = await db.collection(GYMS_COLLECTION).doc(gymId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Gym not found" });
    }

    const gym = { id: doc.id, ...doc.data() };
    return res.status(200).json(gym);
  } catch (error) {
    console.error("Error fetching gym by ID:", error);
    return res.status(500).json({
      error: "Failed to fetch gym",
      message: error.message,
    });
  }
}

// Search gyms by city, amenities, etc.
async function searchGyms(req, res) {
  try {
    const { city, amenity, priceRange } = req.query;

    console.log(`Searching gyms with filters:`, { city, amenity, priceRange });

    let query = db.collection(GYMS_COLLECTION);

    // Filter by city
    if (city && city !== "All") {
      query = query.where("address.city", "==", city);
    }

    // Filter by amenity
    if (amenity && amenity !== "All") {
      query = query.where("amenities", "array-contains", amenity);
    }

    const snapshot = await query.get();
    let gyms = [];

    snapshot.forEach((doc) => {
      gyms.push({ id: doc.id, ...doc.data() });
    });

    // Filter by price range (client-side for now)
    if (priceRange && priceRange !== "All") {
      const [min, max] = priceRange.split("-").map(Number);
      gyms = gyms.filter((gym) => {
        const monthlyPrice =
          gym.membership?.anytime?.discountPrice ||
          gym.membership?.anytime?.price ||
          0;
        return monthlyPrice >= min && monthlyPrice <= max;
      });
    }

    console.log(`Found ${gyms.length} gyms matching criteria`);
    return res.status(200).json(gyms);
  } catch (error) {
    console.error("Error searching gyms:", error);
    return res.status(500).json({
      error: "Failed to search gyms",
      message: error.message,
    });
  }
}

// Get unique cities from gyms
async function getGymCities(req, res) {
  try {
    console.log("Fetching gym cities...");

    const snapshot = await db.collection(GYMS_COLLECTION).get();
    const cities = new Set();

    snapshot.forEach((doc) => {
      const gym = doc.data();
      if (gym.address && gym.address.city) {
        cities.add(gym.address.city);
      }
    });

    const sortedCities = Array.from(cities).sort();
    console.log(`Found cities: ${sortedCities.join(", ")}`);

    return res.status(200).json(sortedCities);
  } catch (error) {
    console.error("Error fetching gym cities:", error);
    return res.status(500).json({
      error: "Failed to fetch cities",
      message: error.message,
    });
  }
}

// Create a new gym
async function createGym(req, res) {
  try {
    const gymData = req.body.data || req.body;

    // Remove action field if present
    delete gymData.action;

    if (!gymData.name) {
      return res.status(400).json({ error: "Gym name is required" });
    }

    // Create a clean gym ID from the name
    const gymId = gymData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    console.log(`Creating gym with ID: ${gymId}`);

    const gymRef = db.collection(GYMS_COLLECTION).doc(gymId);

    // Add timestamps
    const gymWithTimestamps = {
      ...gymData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await gymRef.set(gymWithTimestamps);

    console.log(`Successfully created gym: ${gymData.name}`);
    return res.status(201).json({
      success: true,
      message: "Gym created successfully",
      gym: { id: gymId, ...gymWithTimestamps },
    });
  } catch (error) {
    console.error("Error creating gym:", error);
    return res.status(500).json({
      error: "Failed to create gym",
      message: error.message,
    });
  }
}

// Dialogflow Proxy Function
const { GoogleAuth } = require("google-auth-library");

// Dialogflow CX configuration
const PROJECT_ID = "healthcare-poc-477108";
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

exports.dialogflowProxy = functions.https.onRequest(async (req, res) => {
  // CORS Preflight handling
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  // Set CORS headers for the actual response
  res.set("Access-Control-Allow-Origin", "*");

  console.log("=== DIALOGFLOW PROXY REQUEST ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  try {
    // Extract user message from the request
    const userMessage = req.body?.queryInput?.text?.text || "hello";
    const sessionId = req.body?.sessionId || "default-session";
    const sessionParams = req.body?.sessionParams || {};

    console.log("User message:", userMessage);
    console.log("Session ID:", sessionId);
    console.log("Session params:", JSON.stringify(sessionParams, null, 2));

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

    // Add session parameters if provided
    if (Object.keys(sessionParams).length > 0) {
      dialogflowRequest.queryParams = {
        parameters: sessionParams,
      };
    }

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

console.log("Backend services initialized");
