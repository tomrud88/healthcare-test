// addGymToFirestore.js
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./local-proxy-server/service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Function to add a new gym to Firestore
async function addGymToFirestore(gymData) {
  try {
    console.log("Adding gym to Firestore:", gymData.name);

    // Add the gym to the 'gyms' collection using the gym's ID as the document ID
    await db.collection("gyms").doc(gymData.id).set(gymData);

    console.log(`✅ Successfully added gym: ${gymData.name}`);
    console.log(`   Document ID: ${gymData.id}`);
    console.log(`   Location: ${gymData.address.city}`);

    return true;
  } catch (error) {
    console.error("❌ Error adding gym to Firestore:", error);
    return false;
  }
}

// Function to verify the gym was added
async function verifyGym(gymId) {
  try {
    const doc = await db.collection("gyms").doc(gymId).get();
    if (doc.exists) {
      console.log("✅ Verification successful - Gym found in Firestore");
      const data = doc.data();
      console.log(`   Name: ${data.name}`);
      console.log(`   Address: ${data.address.fullAddress}`);
      return true;
    } else {
      console.log("❌ Verification failed - Gym not found in Firestore");
      return false;
    }
  } catch (error) {
    console.error("❌ Error verifying gym:", error);
    return false;
  }
}

// Example gym data structure (replace with your actual data)
const newGymData = {
  id: "bloomsbury-fitness-wellbeing-gym",
  name: "Bloomsbury Fitness & Wellbeing Gym",
  address: {
    street: "Mecklenburgh Place, Goodenough College",
    city: "London",
    postcode: "WC1N 2AY",
    fullAddress: "Mecklenburgh Place, Goodenough College, London, WC1N 2AY",
  },
  contact: {
    phone: "020 7713 8810",
    email: "bloomsbury@nuffieldhealth.com",
  },
  openingHours: {
    monday: { open: "06:30", close: "22:00" },
    tuesday: { open: "06:30", close: "22:00" },
    wednesday: { open: "06:30", close: "22:00" },
    thursday: { open: "06:30", close: "22:00" },
    friday: { open: "06:30", close: "21:00" },
    saturday: { open: "09:00", close: "19:00" },
    sunday: { open: "09:00", close: "19:00" },
    bankHolidays: { open: "09:00", close: "19:00" },
  },
  offPeakHours: {
    weekdays: { start: "09:00", end: "12:00", afternoon: "14:00-17:00" },
    weekends: "Anytime",
  },
  membership: {
    promotion: {
      active: true,
      description: "50% off for rest of the year",
      condition: "When purchasing a 12 month commitment membership",
    },
    anytime: {
      "12MonthCommitment": {
        originalPrice: 90.0,
        discountPrice: 45.0,
        currency: "GBP",
        period: "month",
        commitment: "12 months",
        description:
          "Our best value monthly membership rewards you for making a commitment to your long-term health.",
      },
      "1MonthRolling": {
        price: 106.0,
        currency: "GBP",
        period: "month",
        commitment: "No commitment",
      },
    },
  },
  amenities: [
    "Technogym Equipment",
    "Technogym My Wellbeing app",
    "Swimming Pool",
    "Sauna/Steam Room",
    "Squash Courts",
    "NuCycle Studio",
    "Nuffield Health 24/7",
  ],
  experts: ["Personal Trainers", "Physiotherapists", "Swimming Instructors"],
  images: [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544966503-7cc36a04e6c8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80",
  ],
  rating: 4.6,
  reviews: 203,
  description:
    "Our modern club is more than just a gym. With state-of-the-art Technogym equipment, we offer dedicated training areas, exciting boutique classes and versatile equipment for all fitness levels. Adult-only club (except for young people attending our cystic fibrosis programme sessions). Just a 7-minute walk from Russell Square Station.",
  features: {
    parking: false,
    accessibleFacilities: true,
    childcare: false,
    cafe: false,
    personalTraining: true,
    groupClasses: true,
    swimming: true,
    sauna: true,
    app: true,
    twentyFourSeven: true,
    squashCourts: true,
    adultOnly: true,
    multiClubAccess: true,
  },
  coordinates: {
    lat: 51.5244, // Russell Square area coordinates
    lng: -0.1208,
  },
  specialFeatures: {
    technogym: true,
    nearRussellSquare: true,
    adultOnlyPolicy: true,
    freeDayPass: true,
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

// Main function to run the script
async function main() {
  console.log("🏋️‍♂️ Adding Bloomsbury Fitness & Wellbeing Gym to Firestore...\n");

  // Add the gym
  const success = await addGymToFirestore(newGymData);

  if (success) {
    console.log("\n🔍 Verifying the gym was added...");
    await verifyGym(newGymData.id);
  }

  console.log("\n✨ Script completed!");
  process.exit(0);
}

// Export functions for use in other scripts
module.exports = {
  addGymToFirestore,
  verifyGym,
};

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}
