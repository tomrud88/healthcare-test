// addGymViaFrontend.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

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

// Bloomsbury gym data
const bloomsburyGym = {
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
    weekdays: "09:00-12:00, 14:00-17:00",
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
    lat: 51.5244,
    lng: -0.1208,
  },
  specialFeatures: {
    technogym: true,
    nearRussellSquare: true,
    adultOnlyPolicy: true,
    freeDayPass: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function addGymToFirestore() {
  try {
    console.log("🏋️‍♂️ Adding Bloomsbury gym to Firestore...");

    // Add gym to Firestore
    const gymRef = doc(db, "gyms", bloomsburyGym.id);
    await setDoc(gymRef, bloomsburyGym);

    console.log("✅ Successfully added Bloomsbury gym to Firestore!");
    console.log(`   Document ID: ${bloomsburyGym.id}`);
    console.log(`   Name: ${bloomsburyGym.name}`);
    console.log(`   Location: ${bloomsburyGym.address.city}`);

    return true;
  } catch (error) {
    console.error("❌ Error adding gym to Firestore:", error);
    return false;
  }
}

// Run the script
addGymToFirestore()
  .then((success) => {
    if (success) {
      console.log(
        "\n🎉 Bloomsbury gym has been successfully added to Firestore!"
      );
    } else {
      console.log("\n❌ Failed to add Bloomsbury gym to Firestore.");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
