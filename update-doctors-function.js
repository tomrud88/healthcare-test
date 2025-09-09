const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Updated doctors data with correct dates
const updatedDoctors = [
  // Dentists
  {
    id: "den-001",
    name: "Dr. Emily Carter, BDS",
    specialty: "Dentist",
    city: "London",
    clinic: "London Dental Clinic – Soho",
    rating: 4.9,
    reviews: 180,
    image: "https://placehold.co/150x150/5B73FF/FFFFFF?text=Dr.E",
    bio: "Dr. Carter specializes in comprehensive dental care with a focus on preventive dentistry and cosmetic treatments.",
    modalities: ["in_person"],
    availability: {
      "2025-09-10": ["09:00", "10:30", "14:00", "15:30"],
      "2025-09-11": ["09:00", "11:00", "13:30", "16:00"],
      "2025-09-12": ["08:30", "10:00", "14:30"],
      "2025-09-13": ["09:30", "11:30", "15:00", "16:30"],
      "2025-09-16": ["09:00", "13:00", "14:30"],
    },
  },
  {
    id: "den-002",
    name: "Dr. James Wilson, BDS",
    specialty: "Dentist",
    city: "Manchester",
    clinic: "Manchester Smile Centre",
    rating: 4.8,
    reviews: 165,
    image: "https://placehold.co/150x150/00B074/FFFFFF?text=Dr.J",
    bio: "Dr. Wilson provides advanced dental treatments including orthodontics and oral surgery.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-09-10": ["10:00", "11:30", "15:00"],
      "2025-09-11": ["09:30", "14:00", "16:30"],
      "2025-09-12": ["08:00", "10:30", "13:00", "15:30"],
      "2025-09-13": ["09:00", "11:00", "14:30"],
      "2025-09-17": ["10:00", "13:30", "15:00", "16:00"],
    },
  },
  {
    id: "den-003",
    name: "Dr. Sophie Bennett, BDS, MSc",
    specialty: "Dentist",
    city: "Birmingham",
    clinic: "Birmingham Dental Practice",
    rating: 4.7,
    reviews: 142,
    image: "https://placehold.co/150x150/FFC107/FFFFFF?text=Dr.S",
    bio: "Dr. Bennett specializes in restorative dentistry and pediatric dental care with over 10 years experience.",
    modalities: ["in_person"],
    availability: {
      "2025-09-11": ["09:00", "10:30", "15:45"],
      "2025-09-12": ["08:30", "11:00", "14:00", "16:30"],
      "2025-09-13": ["09:30", "13:00", "15:30"],
      "2025-09-16": ["10:00", "11:30", "14:30", "16:00"],
      "2025-09-18": ["09:00", "10:30", "13:30"],
    },
  },
  // Add all other doctors with updated dates...
];

exports.updateDoctorsAvailability = functions.https.onRequest(
  async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      console.log("Starting to update doctors availability in Firestore...");

      const batch = db.batch();

      for (const doctor of updatedDoctors) {
        const docRef = db.collection("doctors").doc(doctor.id);
        batch.set(docRef, doctor, { merge: true });
        console.log(`Queued update for doctor: ${doctor.name}`);
      }

      await batch.commit();
      console.log("Successfully updated all doctors in Firestore!");

      // Verify the updates
      const snapshot = await db.collection("doctors").get();

      res.status(200).json({
        success: true,
        message: "Successfully updated all doctors availability",
        totalDoctors: snapshot.size,
        updatedDoctors: updatedDoctors.length,
      });
    } catch (error) {
      console.error("Error updating doctors:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
