// Test single doctor update
const https = require("https");
const { URL } = require("url");

// Make HTTP request using built-in https module
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    console.log("Making request to:", requestOptions);

    const req = https.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log("Response status:", res.statusCode);
        console.log("Response body:", data);
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(result.error || `HTTP ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    if (options.body) {
      console.log("Request body:", options.body);
      req.write(options.body);
    }

    req.end();
  });
}

async function testUpdate() {
  try {
    const API_URL =
      "https://us-central1-healthcare-patient-portal.cloudfunctions.net/doctorsService";

    // Convert doctor name to the ID format used by migrateLocalData
    const doctorName = "Dr. Adam Collins, MRCGP";
    const doctorId = doctorName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    console.log("Generated doctor ID from name:", doctorId);

    const availability = {
      "2025-09-10": ["14:00", "15:00", "16:00"],
    };

    const url = `${API_URL}?action=updateAvailability&doctorId=${doctorId}`;
    const body = JSON.stringify({
      availability: availability,
    });

    console.log("Testing availability update for doctor:", doctorId);

    const result = await makeRequest(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      body: body,
    });

    console.log("✅ Success:", result);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testUpdate();
