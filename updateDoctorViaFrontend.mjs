// updateDoctorViaFrontend.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

// Firebase config (same as in your frontend)
const firebaseConfig = {
  apiKey: "AIzaSyBUYGvUUEzxJqXJHEIHHlSuL0I7xT-p1t0",
  authDomain: "healthcare-patient-portal.firebaseapp.com",
  projectId: "healthcare-patient-portal",
  storageBucket: "healthcare-patient-portal.appspot.com",
  messagingSenderId: "896031233234",
  appId: "1:896031233234:web:8e29f66b88b6f1b0f1b9ac",
  measurementId: "G-V4YC8XHFQR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Updated Dr. Emily Carter data
const updatedDoctorData = {
  specialty: "Physiotherapist",
  clinic: "Covent Garden Physiotherapist",
  address: "9, Endell Street, London, WC2H 9SA",
  bio: "Dr. Carter specializes in comprehensive physiotherapy with a focus on musculoskeletal rehabilitation and movement therapy.",
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
  updatedAt: new Date(),
};

async function updateDoctorInFirestore() {
  try {
    console.log("🏥 Updating Dr. Emily Carter in Firestore...");

    // Update doctor document in Firestore using correct document ID
    const doctorRef = doc(db, "doctors", "dr-emily-carter-bds");
    await updateDoc(doctorRef, updatedDoctorData);

    console.log("✅ Successfully updated Dr. Emily Carter in Firestore!");
    console.log(`   Document ID: dr-emily-carter-bds`);
    console.log(`   New Specialty: ${updatedDoctorData.specialty}`);
    console.log(`   New Clinic: ${updatedDoctorData.clinic}`);
    console.log(`   Address: ${updatedDoctorData.address}`);
    console.log(
      `   Pricing added: Non-member initial £${updatedDoctorData.pricing.nonMember.initialAssessment.price}`
    );

    return true;
  } catch (error) {
    console.error("❌ Error updating doctor in Firestore:", error);
    return false;
  }
}

// Run the script
updateDoctorInFirestore()
  .then((success) => {
    if (success) {
      console.log(
        "\n🎉 Dr. Emily Carter has been successfully updated in Firestore!"
      );
      console.log("   ✅ Specialty changed to Physiotherapist");
      console.log("   ✅ Clinic updated to Covent Garden");
      console.log("   ✅ Pricing structure added");
    } else {
      console.log("\n❌ Failed to update Dr. Emily Carter in Firestore.");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
