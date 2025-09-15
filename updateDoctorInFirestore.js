// updateDoctorInFirestore.js
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./local-proxy-server/service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Updated Dr. Emily Carter data
const updatedDoctorData = {
  id: "den-001",
  name: "Dr. Emily Carter, BDS",
  specialty: "Physiotherapist",
  city: "London",
  clinic: "Covent Garden Physiotherapist",
  address: "9, Endell Street, London, WC2H 9SA",
  rating: 4.9,
  reviews: 180,
  image: "https://placehold.co/150x150/5B73FF/FFFFFF?text=Dr.E",
  bio: "Dr. Carter specializes in comprehensive physiotherapy with a focus on musculoskeletal rehabilitation and movement therapy.",
  modalities: ["in_person"],
  pricing: {
    nonMember: {
      initialAssessment: {
        price: 79,
        currency: "GBP",
        duration: "45 minutes",
        description: "Initial Assessment - 45 minutes",
      },
      followUp: {
        price: 52,
        currency: "GBP",
        duration: "30 minutes",
        description: "Follow Up - 30 minutes",
      },
    },
    member: {
      initialAssessment: {
        price: 63.2,
        currency: "GBP",
        duration: "45 minutes",
        description: "Initial Assessment - 45 minutes",
      },
      followUp: {
        price: 41.6,
        currency: "GBP",
        duration: "30 minutes",
        description: "Follow Up - 30 minutes",
      },
    },
  },
  availability: {
    "2025-09-10": ["09:00", "10:30", "14:00", "15:30"],
    "2025-09-11": ["09:00", "11:00", "13:30", "16:00"],
    "2025-09-12": ["08:30", "10:00", "14:30"],
    "2025-09-13": ["09:30", "11:30", "15:00", "16:30"],
    "2025-09-16": ["09:00", "13:00", "14:30"],
  },
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

// Function to update doctor in Firestore
async function updateDoctorInFirestore() {
  try {
    console.log("🏥 Updating Dr. Emily Carter in Firestore...");

    // Update the doctor document in the 'doctors' collection
    await db
      .collection("doctors")
      .doc(updatedDoctorData.id)
      .update(updatedDoctorData);

    console.log("✅ Successfully updated Dr. Emily Carter in Firestore!");
    console.log(`   Document ID: ${updatedDoctorData.id}`);
    console.log(`   Name: ${updatedDoctorData.name}`);
    console.log(`   New Specialty: ${updatedDoctorData.specialty}`);
    console.log(`   New Clinic: ${updatedDoctorData.clinic}`);
    console.log(`   Address: ${updatedDoctorData.address}`);

    return true;
  } catch (error) {
    console.error("❌ Error updating doctor in Firestore:", error);
    return false;
  }
}

// Function to verify the update
async function verifyDoctorUpdate(doctorId) {
  try {
    console.log("\n🔍 Verifying the update...");
    const doc = await db.collection("doctors").doc(doctorId).get();

    if (doc.exists) {
      const data = doc.data();
      console.log("✅ Verification successful - Doctor found with updates:");
      console.log(`   Name: ${data.name}`);
      console.log(`   Specialty: ${data.specialty}`);
      console.log(`   Clinic: ${data.clinic}`);
      console.log(`   Address: ${data.address || "Not set"}`);

      if (data.pricing) {
        console.log("   Pricing structure: ✅ Added");
        console.log(
          `   Non-member initial: £${data.pricing.nonMember?.initialAssessment?.price}`
        );
        console.log(
          `   Member initial: £${data.pricing.member?.initialAssessment?.price}`
        );
      } else {
        console.log("   Pricing structure: ❌ Not found");
      }

      return true;
    } else {
      console.log("❌ Verification failed - Doctor not found in Firestore");
      return false;
    }
  } catch (error) {
    console.error("❌ Error verifying doctor update:", error);
    return false;
  }
}

// Main function
async function main() {
  console.log("🩺 Updating Dr. Emily Carter's information in Firestore...\n");

  const success = await updateDoctorInFirestore();

  if (success) {
    await verifyDoctorUpdate(updatedDoctorData.id);
  }

  console.log("\n✨ Script completed!");
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
