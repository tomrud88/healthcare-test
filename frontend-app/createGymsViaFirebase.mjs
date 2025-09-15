// createGymsViaFirebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "<YOUR_FIREBASE_API_KEY>",
  authDomain: "<YOUR_FIREBASE_AUTH_DOMAIN>",
  projectId: "<YOUR_FIREBASE_PROJECT_ID>",
  storageBucket: "<YOUR_FIREBASE_STORAGE_BUCKET>",
  messagingSenderId: "1012936583298",
  appId: "1:1012936583298:web:07c1e3b1f32c6b86be3b0a",
  measurementId: "G-B2YS5G29BD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const gymData = {
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
  console.log("Creating gyms collection...");

  try {
    // Create the gym document
    const gymRef = doc(db, "gyms", "covent-garden-fitness-wellbeing-gym");
    await setDoc(gymRef, gymData);

    console.log("✅ Successfully created Covent Garden gym in Firestore!");
    console.log("🎉 Gyms collection is now ready!");
  } catch (error) {
    console.error("❌ Error creating gym:", error);
  }
}

createGymsCollection();
