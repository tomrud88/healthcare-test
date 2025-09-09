const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Function to convert 12-hour format to 24-hour format
function convertTo24Hour(time12h) {
  if (!time12h.includes("AM") && !time12h.includes("PM")) {
    // Already in 24-hour format
    return time12h;
  }

  const [timePart, period] = time12h.split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);

  let hour24;
  if (period === "PM" && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === "AM" && hours === 12) {
    hour24 = 0;
  } else {
    hour24 = hours;
  }

  // Format with leading zero if needed
  const formattedHour = hour24.toString().padStart(2, "0");
  const formattedMinute = minutes.toString().padStart(2, "0");

  return `${formattedHour}:${formattedMinute}`;
}

exports.convertTimesTo24Hour = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    console.log("Starting to convert doctor times to 24-hour format...");

    // Get all doctors from Firestore
    const doctorsSnapshot = await db.collection("doctors").get();

    if (doctorsSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No doctors found in Firestore",
      });
    }

    const batch = db.batch();
    let updatedCount = 0;
    const conversionLog = [];

    doctorsSnapshot.forEach((doc) => {
      const doctorData = doc.data();
      const availability = doctorData.availability;

      if (!availability) {
        console.log(`No availability data for doctor: ${doctorData.name}`);
        return;
      }

      const updatedAvailability = {};
      let hasChanges = false;

      // Convert times for each date
      Object.keys(availability).forEach((date) => {
        const times = availability[date];
        if (Array.isArray(times)) {
          const convertedTimes = times.map((time) => {
            const converted = convertTo24Hour(time);
            if (converted !== time) {
              hasChanges = true;
            }
            return converted;
          });
          updatedAvailability[date] = convertedTimes;
        }
      });

      if (hasChanges) {
        const beforeSample = availability[Object.keys(availability)[0]];
        const afterSample =
          updatedAvailability[Object.keys(updatedAvailability)[0]];

        conversionLog.push({
          doctor: doctorData.name,
          before: beforeSample,
          after: afterSample,
        });

        console.log(`Converting times for doctor: ${doctorData.name}`);
        console.log("Before:", beforeSample);
        console.log("After:", afterSample);

        const docRef = db.collection("doctors").doc(doc.id);
        batch.update(docRef, { availability: updatedAvailability });
        updatedCount++;
      } else {
        console.log(`No changes needed for doctor: ${doctorData.name}`);
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(
        `Successfully converted times for ${updatedCount} doctors to 24-hour format!`
      );
    }

    // Verify the updates
    const verifySnapshot = await db.collection("doctors").limit(1).get();
    let sampleVerification = null;
    if (!verifySnapshot.empty) {
      const sampleDoc = verifySnapshot.docs[0];
      const sampleData = sampleDoc.data();
      sampleVerification = {
        doctor: sampleData.name,
        sampleAvailability: sampleData.availability,
      };
    }

    res.status(200).json({
      success: true,
      message: `Successfully converted times for ${updatedCount} doctors to 24-hour format`,
      updatedCount,
      totalDoctors: doctorsSnapshot.size,
      conversionLog,
      sampleVerification,
    });
  } catch (error) {
    console.error("Error converting doctor times:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
