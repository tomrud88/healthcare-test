// Script to convert doctor times from 12-hour to 24-hour format and update Firestore
const https = require("https");
const { URL } = require("url");

const API_URL =
  "https://us-central1-healthcare-patient-portal.cloudfunctions.net/doctorsService";

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

    const req = https.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
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
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Convert 12-hour time to 24-hour format
function convertTo24Hour(time12h) {
  if (!time12h.includes("AM") && !time12h.includes("PM")) {
    return time12h; // Already in 24-hour format
  }

  const [time, period] = time12h.split(" ");
  const [hours, minutes] = time.split(":");
  let hour24 = parseInt(hours);

  if (period === "AM" && hour24 === 12) {
    hour24 = 0;
  } else if (period === "PM" && hour24 !== 12) {
    hour24 += 12;
  }

  return `${hour24.toString().padStart(2, "0")}:${minutes}`;
}

// Convert availability object to 24-hour format
function convertAvailability(availability) {
  const converted = {};

  for (const [date, times] of Object.entries(availability)) {
    converted[date] = times.map((time) => convertTo24Hour(time));
  }

  return converted;
}

// Update a single doctor's availability
async function updateDoctorAvailability(doctorName, availability) {
  try {
    // Convert doctor name to the ID format used by Firestore
    const doctorId = doctorName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const url = `${API_URL}?action=updateAvailability&doctorId=${doctorId}`;
    const body = JSON.stringify({
      availability: availability,
    });

    const result = await makeRequest(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      body: body,
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to update ${doctorName}: ${error.message}`);
  }
}

async function convertAllDoctorTimes() {
  console.log("🔄 Starting to convert and update doctor times in Firestore...");

  try {
    // Load the downloaded doctors data
    const fs = require("fs");
    const doctorsData = JSON.parse(
      fs.readFileSync("doctors-data.json", "utf8")
    );

    // Test conversion with one doctor first
    const testDoctor = doctorsData.doctors[0];
    console.log("\n📋 Testing conversion with first doctor:");
    console.log("Original times:", Object.values(testDoctor.availability)[0]);

    const convertedAvailability = convertAvailability(testDoctor.availability);
    console.log("Converted times:", Object.values(convertedAvailability)[0]);

    let successCount = 0;
    let failCount = 0;

    for (const doctor of doctorsData.doctors) {
      try {
        console.log(`\nUpdating ${doctor.name}...`);

        // Convert availability to 24-hour format
        const converted24HourAvailability = convertAvailability(
          doctor.availability
        );

        // Update the doctor in Firestore using doctor name
        await updateDoctorAvailability(
          doctor.name,
          converted24HourAvailability
        );

        console.log(`✅ Successfully updated ${doctor.name}`);
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`❌ Failed to update ${doctor.name}: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n🎉 Conversion complete!`);
    console.log(`✅ Successfully updated: ${successCount} doctors`);
    console.log(`❌ Failed to update: ${failCount} doctors`);
  } catch (error) {
    console.error("❌ Error during conversion process:", error);
  }
}

convertAllDoctorTimes();
