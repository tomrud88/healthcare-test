import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSzlaZnBjNnp3l2ggAr3gJWtjuFFfWTq4",
  authDomain: "healthcare-test-48a56.firebaseapp.com",
  projectId: "healthcare-test-48a56",
  storageBucket: "healthcare-test-48a56.firebasestorage.app",
  messagingSenderId: "869934807023",
  appId: "1:869934807023:web:85a509d3ae1aef0b5b3b20",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkGymStructure() {
  try {
    console.log("Fetching gym document: covent-garden-fitness-wellbeing-gym");

    const gymRef = doc(db, "gyms", "covent-garden-fitness-wellbeing-gym");
    const gymDoc = await getDoc(gymRef);

    if (gymDoc.exists()) {
      const gymData = gymDoc.data();
      console.log("\n=== GYM DOCUMENT STRUCTURE ===");
      console.log(JSON.stringify(gymData, null, 2));
    } else {
      console.log("Gym document not found!");
    }
  } catch (error) {
    console.error("Error fetching gym:", error);
  }
}

checkGymStructure();
