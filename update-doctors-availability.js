// Script to update doctors availability in Firestore
// Run this with: node update-doctors-availability.js

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { credential } = require("firebase-admin");

// Initialize Firebase Admin
initializeApp({
  credential: credential.applicationDefault(),
  projectId: "healthcare-patient-portal",
});

const db = getFirestore();

// Generate availability dates from September 8th to 25th, 2025
function generateAvailabilityDates() {
  const availability = {};
  const startDate = new Date("2025-09-08");
  const endDate = new Date("2025-09-25");

  // Common time slots for doctors
  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];

  // Generate availability for each date
  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dateKey = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // Skip Sundays (day 0) - doctors typically don't work on Sundays
    if (date.getDay() !== 0) {
      // Randomly assign 3-5 time slots per day for variety
      const numSlots = Math.floor(Math.random() * 3) + 3; // 3-5 slots
      const shuffledSlots = [...timeSlots].sort(() => Math.random() - 0.5);
      availability[dateKey] = shuffledSlots.slice(0, numSlots).sort();
    }
  }

  return availability;
}

async function updateDoctorsAvailability() {
  try {
    console.log("🔄 Starting to update doctors availability...");

    // Get all doctors from the collection
    const doctorsSnapshot = await db.collection("doctors").get();

    if (doctorsSnapshot.empty) {
      console.log("❌ No doctors found in the database.");
      return;
    }

    console.log(`📋 Found ${doctorsSnapshot.size} doctors to update.`);

    // Update each doctor with new availability
    const batch = db.batch();
    let updateCount = 0;

    doctorsSnapshot.forEach((docSnapshot) => {
      const doctorRef = docSnapshot.ref;
      const doctorData = docSnapshot.data();
      const availability = generateAvailabilityDates();

      console.log(
        `📅 Updating availability for Dr. ${doctorData.name || docSnapshot.id}`
      );

      batch.update(doctorRef, {
        availability: availability,
        lastUpdated: new Date(),
      });

      updateCount++;
    });

    // Commit all updates
    await batch.commit();

    console.log("✅ Successfully updated availability for all doctors!");
    console.log(
      `📊 Updated ${updateCount} doctors with availability from Sep 8-25, 2025`
    );
    console.log(
      "🕒 Available time slots: 09:00 AM, 10:00 AM, 11:00 AM, 02:00 PM, 03:00 PM, 04:00 PM, 05:00 PM"
    );
    console.log("📝 Note: Sundays are excluded from availability");
  } catch (error) {
    console.error("❌ Error updating doctors availability:", error);
  }
}

// Run the update
updateDoctorsAvailability().then(() => {
  console.log("🏁 Script completed.");
  process.exit(0);
});
