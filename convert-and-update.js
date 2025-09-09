// Script to convert all doctor times from 12-hour to 24-hour format
const fs = require("fs");

// Read the doctors data
const data = JSON.parse(fs.readFileSync("./doctors-data.json", "utf8"));

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

// Process each doctor and convert their availability times
const updatedDoctors = data.doctors.map((doctor) => {
  if (doctor.availability) {
    console.log(`Processing ${doctor.name}...`);

    const updatedAvailability = {};

    // Convert each date's time slots
    Object.keys(doctor.availability).forEach((date) => {
      const timeSlots = doctor.availability[date];
      const convertedTimeSlots = timeSlots.map((time) => {
        const converted = convertTo24Hour(time);
        if (converted !== time) {
          console.log(`  ${date}: ${time} -> ${converted}`);
        }
        return converted;
      });

      updatedAvailability[date] = convertedTimeSlots;
    });

    return {
      ...doctor,
      availability: updatedAvailability,
    };
  }
  return doctor;
});

// Save the converted data
const outputData = {
  success: true,
  doctors: updatedDoctors,
  count: updatedDoctors.length,
};

fs.writeFileSync(
  "./doctors-data-24h.json",
  JSON.stringify(outputData, null, 2)
);
console.log("\n✅ Conversion complete! Saved to doctors-data-24h.json");

// Now make API calls to update each doctor in Firestore
async function updateDoctorsInFirestore() {
  console.log("\n🔄 Starting to update doctors in Firestore...");

  const fetch = (await import("node-fetch")).default;

  for (const doctor of updatedDoctors) {
    try {
      console.log(`Updating ${doctor.name}...`);

      const response = await fetch(
        "https://us-central1-healthcare-patient-portal.cloudfunctions.net/doctorsService",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "updateDoctor",
            doctorId: doctor.id,
            data: {
              availability: doctor.availability,
            },
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Successfully updated ${doctor.name}`);
      } else {
        console.log(
          `❌ Failed to update ${doctor.name}: ${
            result.error || "Unknown error"
          }`
        );
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error updating ${doctor.name}:`, error.message);
    }
  }

  console.log("\n🎉 Firestore update process complete!");
}

// Run the Firestore update
updateDoctorsInFirestore();
