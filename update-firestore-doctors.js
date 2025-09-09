// update-firestore-doctors.js
const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin
const serviceAccount = require("./local-proxy-server/service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Import the updated doctors data
const { doctors } = require("./frontend-app/src/data/doctors.js");

async function updateDoctorsInFirestore() {
  console.log("Starting to update doctors in Firestore...");

  try {
    const batch = db.batch();

    for (const doctor of doctors) {
      const docRef = db.collection("doctors").doc(doctor.id);
      batch.set(docRef, doctor, { merge: true });
      console.log(`Queued update for doctor: ${doctor.name}`);
    }

    await batch.commit();
    console.log("Successfully updated all doctors in Firestore!");

    // Verify the updates
    const snapshot = await db.collection("doctors").get();
    console.log(`Total doctors in Firestore: ${snapshot.size}`);

    // Show sample of updated availability
    const firstDoc = snapshot.docs[0];
    if (firstDoc) {
      const data = firstDoc.data();
      console.log("Sample doctor availability:", {
        name: data.name,
        availability: data.availability,
      });
    }
  } catch (error) {
    console.error("Error updating doctors:", error);
  } finally {
    admin.app().delete();
  }
}

updateDoctorsInFirestore();
