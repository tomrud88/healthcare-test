// Script to convert doctor availability times from 12-hour to 24-hour format in Firestore

const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./local-proxy-server/service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "healthcare-patient-portal",
});

const db = admin.firestore();

// Function to convert 12-hour time to 24-hour format
function convertTo24Hour(time12h) {
  if (!time12h.includes("AM") && !time12h.includes("PM")) {
    // Already in 24-hour format
    return time12h;
  }

  const [timePart, period] = time12h.split(" ");
  const [hours, minutes] = timePart.split(":");
  let hour24 = parseInt(hours);

  if (period === "PM" && hour24 !== 12) {
    hour24 += 12;
  } else if (period === "AM" && hour24 === 12) {
    hour24 = 0;
  }

  return `${hour24.toString().padStart(2, "0")}:${minutes}`;
}

async function convertAllDoctorTimes() {
  try {
    console.log("Fetching all doctors from Firestore...");

    // Get all doctors
    const snapshot = await db.collection("doctors").get();
    console.log(`Found ${snapshot.size} doctors to update`);

    const batch = db.batch();
    let updatedCount = 0;

    snapshot.forEach((doc) => {
      const doctorData = doc.data();
      const doctorId = doc.id;

      if (doctorData.availability) {
        console.log(`Processing ${doctorData.name}...`);

        const updatedAvailability = {};
        let hasChanges = false;

        // Convert each date's time slots
        Object.keys(doctorData.availability).forEach((date) => {
          const timeSlots = doctorData.availability[date];
          const convertedTimeSlots = timeSlots.map((time) => {
            const converted = convertTo24Hour(time);
            if (converted !== time) {
              hasChanges = true;
              console.log(`  ${date}: ${time} -> ${converted}`);
            }
            return converted;
          });

          updatedAvailability[date] = convertedTimeSlots;
        });

        if (hasChanges) {
          // Update the document with converted times
          const docRef = db.collection("doctors").doc(doctorId);
          batch.update(docRef, { availability: updatedAvailability });
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      console.log(`\nCommitting updates for ${updatedCount} doctors...`);
      await batch.commit();
      console.log(
        "✅ Successfully updated all doctor times to 24-hour format!"
      );
    } else {
      console.log(
        "ℹ️  No updates needed - all times are already in 24-hour format"
      );
    }
  } catch (error) {
    console.error("❌ Error updating doctor times:", error);
  } finally {
    admin.app().delete();
  }
}

// Run the conversion
convertAllDoctorTimes();
