// Script to list existing patients and their IDs
const { Firestore } = require("@google-cloud/firestore");

const db = new Firestore();

async function listPatients() {
  try {
    console.log("Fetching all patients from Firestore...");

    const patientsRef = db.collection("patients");
    const snapshot = await patientsRef.get();

    if (snapshot.empty) {
      console.log("No patients found.");
      return;
    }

    console.log("\n📋 Existing Patients:");
    console.log("=" * 50);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\nPatient ID: ${doc.id}`);
      console.log(`Name: ${data.name} ${data.surname}`);
      console.log(`Email: ${data.email}`);
      if (data.medicalHistory) {
        console.log(`Medical History Records: ${data.medicalHistory.length}`);
      } else {
        console.log(`Medical History Records: 0`);
      }
    });
  } catch (error) {
    console.error("❌ Error fetching patients:", error);
  }
}

// Run the function
listPatients();
