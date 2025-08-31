const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3001;

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

app.use(express.json());

// ===== SIMPLE PROXY - NO BUSINESS LOGIC =====
// Just forwards requests to Dialogflow CX

// Initialize Google Auth
const serviceAccountPath = path.join(__dirname, "service-account-key.json");
const auth = new GoogleAuth({
  keyFilename: serviceAccountPath,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

// Dialogflow CX configuration
const PROJECT_ID = "healthcare-patient-portal";
const LOCATION = "us-central1";
const AGENT_ID = "c9962196-4009-4be2-b632-d268fc1b96b5";

// Proxy endpoint that just forwards to Dialogflow
app.post("/dialogflow-proxy", async (req, res) => {
  console.log("=== PROXY REQUEST ===");
  console.log("Forwarding to Dialogflow CX...");

  try {
    // Get access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Forward request to Dialogflow CX
    const response = await axios.post(
      `https://${LOCATION}-dialogflow.googleapis.com/v3/projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}/sessions/${req.body.sessionId}:detectIntent`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("=== DIALOGFLOW RESPONSE ===");
    console.log(JSON.stringify(response.data, null, 2));

    res.json(response.data);
  } catch (error) {
    console.error("Proxy error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to communicate with Dialogflow",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local proxy server running on http://localhost:${PORT}`);
  console.log("📡 Forwarding requests to Dialogflow CX");
  console.log("🧠 All business logic handled by Cloud Function webhook");
});
