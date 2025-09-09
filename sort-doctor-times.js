// Script to sort doctor availability times in chronological order in Firestore
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

// Sort availability times for a doctor
function sortAvailabilityTimes(availability) {
  const sorted = {};

  for (const [date, times] of Object.entries(availability)) {
    // Sort times in chronological order
    sorted[date] = [...times].sort();
  }

  return sorted;
}

// Update a single doctor's availability with sorted times
async function updateDoctorWithSortedTimes(doctorName, availability) {
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

async function sortAllDoctorTimes() {
  console.log("🔄 Starting to sort doctor availability times in Firestore...");

  try {
    // Get all doctors from API
    const doctorsResponse = await makeRequest(
      `${API_URL}?action=getAllDoctors`
    );
    const doctors = doctorsResponse.doctors;

    console.log(`Found ${doctors.length} doctors to process\n`);

    let successCount = 0;
    let failCount = 0;

    for (const doctor of doctors) {
      try {
        console.log(`Sorting times for ${doctor.name}...`);

        // Show before and after for first date
        const firstDate = Object.keys(doctor.availability)[0];
        const originalTimes = doctor.availability[firstDate];

        // Sort availability times
        const sortedAvailability = sortAvailabilityTimes(doctor.availability);
        const sortedTimes = sortedAvailability[firstDate];

        console.log(`  Before: ${originalTimes.join(", ")}`);
        console.log(`  After:  ${sortedTimes.join(", ")}`);

        // Update the doctor in Firestore
        await updateDoctorWithSortedTimes(doctor.name, sortedAvailability);

        console.log(`✅ Successfully sorted ${doctor.name}\n`);
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`❌ Failed to sort ${doctor.name}: ${error.message}\n`);
        failCount++;
      }
    }

    console.log(`🎉 Sorting complete!`);
    console.log(`✅ Successfully sorted: ${successCount} doctors`);
    console.log(`❌ Failed to sort: ${failCount} doctors`);
  } catch (error) {
    console.error("❌ Error during sorting process:", error);
  }
}

sortAllDoctorTimes();
