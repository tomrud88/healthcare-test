// convert-times-to-24hour.js
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./local-proxy-server/service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

async function convertDoctorTimesTo24Hour() {
  console.log("Starting to convert doctor times to 24-hour format...");

  try {
    // Get all doctors from Firestore
    const doctorsSnapshot = await db.collection("doctors").get();

    if (doctorsSnapshot.empty) {
      console.log("No doctors found in Firestore");
      return;
    }

    const batch = db.batch();
    let updatedCount = 0;

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
        console.log(`Converting times for doctor: ${doctorData.name}`);
        console.log("Before:", availability[Object.keys(availability)[0]]);
        console.log(
          "After:",
          updatedAvailability[Object.keys(updatedAvailability)[0]]
        );

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
    } else {
      console.log("No doctors needed time format conversion");
    }

    // Verify the updates
    const verifySnapshot = await db.collection("doctors").limit(1).get();
    if (!verifySnapshot.empty) {
      const sampleDoc = verifySnapshot.docs[0];
      const sampleData = sampleDoc.data();
      console.log("\nSample verification:");
      console.log("Doctor:", sampleData.name);
      console.log("Sample availability:", sampleData.availability);
    }
  } catch (error) {
    console.error("Error converting doctor times:", error);
  } finally {
    admin.app().delete();
  }
}

convertDoctorTimesTo24Hour();
