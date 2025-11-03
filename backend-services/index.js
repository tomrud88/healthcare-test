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

console.log("Backend services initialized");
