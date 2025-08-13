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
app.use(express.json()); // To parse JSON request bodies

// Dialogflow CX Configuration (same as in your Chat.jsx)
// IMPORTANT: Replace these placeholders with your actual Google Cloud Project and Dialogflow CX Agent details
const DIALOGFLOW_PROJECT_ID = "healthcare-patient-portal";
const DIALOGFLOW_AGENT_ID = "9a0f6ec9-9c59-49bb-862b-48d81b85daf3";
const DIALOGFLOW_LOCATION = "europe-west2"; // Use your agent's location, e.g., 'us-central1' or 'europe-west2'

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
