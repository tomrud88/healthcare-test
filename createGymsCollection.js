// createGymsCollection.js
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./local-proxy-server/service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Gym data based on your example
const coventGardenGym = {
  id: "covent-garden-fitness-wellbeing-gym",
  name: "Covent Garden Fitness & Wellbeing Gym",
  address: {
    street: "9, Endell Street",
    city: "London",
    postcode: "WC2H 9SA",
    fullAddress: "9, Endell Street, London, WC2H 9SA",
  },
  contact: {
    phone: "020 724 02446",
    email: "coventgarden@nuffieldhealth.com",
  },
  openingHours: {
    monday: { open: "07:00", close: "22:00" },
    tuesday: { open: "07:00", close: "22:00" },
    wednesday: { open: "07:00", close: "22:00" },
    thursday: { open: "07:00", close: "22:00" },
    friday: { open: "07:00", close: "21:00" },
    saturday: { open: "10:00", close: "18:00" },
    sunday: { open: "10:00", close: "18:00" },
    bankHolidays: { open: "10:00", close: "18:00" },
  },
  offPeakHours: {
    weekdays: { start: "09:00", end: "17:00" },
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
        originalPrice: 88.0,
        discountPrice: 44.0,
        currency: "GBP",
        period: "month",
        commitment: "12 months",
      },
      "1MonthRolling": {
        price: 104.0,
        currency: "GBP",
        period: "month",
        commitment: "No commitment",
      },
    },
  },
  amenities: [
    "Swimming Pool",
    "Sauna/Steam Room",
    "NuCycle Studio",
    "Nuffield Health app",
    "Nuffield Health 24/7",
  ],
  experts: ["Personal Trainers", "Physiotherapists", "Swimming Instructors"],
  images: [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544966503-7cc36a04e6c8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80",
  ],
  rating: 4.5,
  reviews: 156,
  description:
    "Modern fitness and wellbeing center in the heart of Covent Garden, offering comprehensive facilities including swimming pool, cycling studio, and expert personal training services.",
  features: {
    parking: false,
    accessibleFacilities: true,
    childcare: false,
    cafe: true,
    personalTraining: true,
    groupClasses: true,
    swimming: true,
    sauna: true,
    app: true,
    twentyFourSeven: true,
  },
  coordinates: {
    lat: 51.5154,
    lng: -0.1265,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function createGymsCollection() {
  console.log("Creating gyms collection in Firestore...");

  try {
    // Create the gym document
    const gymRef = db.collection("gyms").doc(coventGardenGym.id);
    await gymRef.set(coventGardenGym);

    console.log(`✅ Successfully created gym: ${coventGardenGym.name}`);

    // Verify the creation
    const snapshot = await db.collection("gyms").get();
    console.log(`📊 Total gyms in collection: ${snapshot.size}`);

    // Show the created gym
    const createdGym = await gymRef.get();
    if (createdGym.exists) {
      console.log("🎉 Gym created successfully with data:");
      console.log(JSON.stringify(createdGym.data(), null, 2));
    }
  } catch (error) {
    console.error("❌ Error creating gyms collection:", error);
  } finally {
    admin.app().delete();
  }
}

// Run the function
createGymsCollection();
