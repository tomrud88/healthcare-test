// retry-failed-doctor.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

// Firebase config for your new project
const firebaseConfig = {
  apiKey: "AIzaSyBLdLNx-VtLfljLar8BKkk1ev6pEEQnAsg",
  authDomain: "healthcare-poc-477108.firebaseapp.com",
  projectId: "healthcare-poc-477108",
  storageBucket: "healthcare-poc-477108.firebasestorage.app",
  messagingSenderId: "750964638675",
  appId: "1:750964638675:web:b938cd4640572730ef6526",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const missingDoctor = {
  id: "car-002",
  name: "Dr. Andrew Morrison, MD",
  specialty: "Cardiologist",
  city: "Edinburgh",
  clinic: "Edinburgh Cardiac Centre",
  rating: 4.8,
  reviews: 234,
  image: "https://placehold.co/150x150/F39C12/FFFFFF?text=Dr.A",
  bio: "Dr. Morrison focuses on preventive cardiology and cardiac rehabilitation with a holistic treatment approach.",
  modalities: ["in_person"],
  availability: {
    "2025-11-06": ["09:00", "10:15", "14:30"],
    "2025-11-07": ["11:00", "13:30", "16:00"],
    "2025-11-08": ["08:30", "10:30", "15:30"],
    "2025-11-11": ["09:30", "11:30", "14:00", "16:30"],
    "2025-11-12": ["10:15", "13:00", "15:00"],
  },
};

async function retryFailedDoctor() {
  console.log("🔄 Retrying to add Dr. Andrew Morrison...");

  try {
    const docRef = doc(db, "doctors", missingDoctor.id);
    await setDoc(docRef, missingDoctor);
    console.log(
      `✅ Successfully added: ${missingDoctor.name} (${missingDoctor.id})`
    );
  } catch (error) {
    console.error(`❌ Still failed to add ${missingDoctor.name}:`, error);
  }
}

retryFailedDoctor();
