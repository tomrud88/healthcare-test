// frontend-app/src/firebaseConfig.js

// Import the functions you need from the SDKs you need
// These imports are for the Firebase JavaScript SDK installed via npm,
// which is what you use in a React project.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // For Firebase Authentication
import { getFirestore } from "firebase/firestore"; // For Firestore Database
import { getAnalytics } from "firebase/analytics"; // For Firebase Analytics (optional, but included in your config)

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required Firebase config values are present
const requiredConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];
const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  console.error("Missing required Firebase configuration:", missingConfig);
  throw new Error(
    `Missing Firebase environment variables: ${missingConfig
      .map((key) => `REACT_APP_FIREBASE_${key.toUpperCase()}`)
      .join(", ")}`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services you intend to use
export const auth = getAuth(app); // Exported for use in AuthContext and page components
export const db = getFirestore(app); // Exported for Firestore interactions

// Only initialize analytics if measurementId is provided
export const analytics = firebaseConfig.measurementId
  ? getAnalytics(app)
  : null; // Exported for analytics if you plan to use it
