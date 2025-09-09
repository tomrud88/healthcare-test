// Cloud Function to add medical history to existing patients
const functions = require("@google-cloud/functions-framework");
const { Firestore } = require("@google-cloud/firestore");

const db = new Firestore();

functions.http("addMedicalHistoryRecords", async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    console.log("Adding medical history records...");

    // Medical history data
    const medicalHistoryData = {
      Tahmina: [
        {
          id: Date.now() + 1,
          date: "2024-12-15",
          condition: "Annual Health Checkup",
          treatment:
            "Complete blood work, blood pressure monitoring, cholesterol screening",
          doctor: "Dr. Sarah Johnson - Family Medicine",
          location: "City General Hospital - Family Medicine Department",
          prescription:
            "Vitamin D3 supplements (2000 IU daily), Omega-3 fish oil",
          summary:
            "Overall excellent health. All vital signs normal. Slight vitamin D deficiency detected.",
          advice:
            "Continue healthy diet and exercise routine. Increase sun exposure or take vitamin D supplements. Schedule next checkup in 12 months.",
          notes:
            "Patient reports good energy levels and no concerning symptoms. BMI within normal range.",
        },
        {
          id: Date.now() + 2,
          date: "2024-08-22",
          condition: "Migraine Headaches",
          treatment:
            "Neurological evaluation, CT scan (normal), lifestyle counseling",
          doctor: "Dr. Michael Chen - Neurology",
          location: "Metropolitan Medical Center - Neurology Department",
          prescription:
            "Sumatriptan 50mg (as needed for acute episodes), Magnesium 400mg daily",
          summary:
            "Diagnosed with tension-type migraines likely triggered by stress and irregular sleep patterns.",
          advice:
            "Maintain regular sleep schedule (7-8 hours), practice stress management techniques, avoid known triggers (bright lights, certain foods). Keep headache diary.",
          notes:
            "Patient experiences 2-3 migraines per month. No underlying neurological abnormalities found.",
        },
        {
          id: Date.now() + 3,
          date: "2024-05-10",
          condition: "Minor Ankle Sprain",
          treatment:
            "Physical examination, X-ray imaging, RICE protocol, physical therapy",
          doctor: "Dr. Lisa Rodriguez - Orthopedics",
          location: "Sports Medicine Clinic - Orthopedic Department",
          prescription:
            "Ibuprofen 400mg (3 times daily for 5 days), topical anti-inflammatory gel",
          summary:
            "Grade 1 ankle sprain from jogging accident. No fractures detected on X-ray.",
          advice:
            "Rest for 48-72 hours, ice application 15-20 minutes every 2-3 hours, gradual return to activities. Wear supportive footwear.",
          notes:
            "Full recovery expected in 2-3 weeks. Patient cleared for normal activities after pain subsides.",
        },
      ],

      Adam: [
        {
          id: Date.now() + 4,
          date: "2024-11-28",
          condition: "Hypertension Follow-up",
          treatment:
            "Blood pressure monitoring, medication adjustment, dietary counseling",
          doctor: "Dr. Robert Kim - Cardiology",
          location: "Heart & Vascular Institute - Cardiology Department",
          prescription:
            "Lisinopril 10mg daily (increased from 5mg), Amlodipine 5mg daily",
          summary:
            "Blood pressure still elevated despite lifestyle modifications. Medication dosage adjusted.",
          advice:
            "Continue low-sodium diet (less than 2300mg daily), regular exercise 30 min/day, weight management. Monitor BP at home twice weekly.",
          notes:
            "Patient has been compliant with medications. BMI slightly elevated. Family history of cardiovascular disease.",
        },
        {
          id: Date.now() + 5,
          date: "2024-09-14",
          condition: "Type 2 Diabetes Management",
          treatment:
            "HbA1c testing, glucose monitoring review, diabetic education",
          doctor: "Dr. Emily Thompson - Endocrinology",
          location: "Diabetes Care Center - Endocrinology Department",
          prescription: "Metformin 1000mg twice daily, Glimepiride 2mg daily",
          summary:
            "HbA1c improved to 7.2% (down from 8.1%). Good progress with blood sugar control.",
          advice:
            "Continue current medication regimen, maintain carbohydrate counting, test blood glucose 3x daily. Schedule eye exam and foot check.",
          notes:
            "Patient shows excellent compliance with diet and medication. Weight loss of 8 lbs since last visit.",
        },
        {
          id: Date.now() + 6,
          date: "2024-06-03",
          condition: "Sleep Apnea Evaluation",
          treatment:
            "Sleep study (polysomnography), CPAP machine fitting, sleep hygiene counseling",
          doctor: "Dr. Jennifer Park - Sleep Medicine",
          location: "Sleep Disorders Center - Pulmonology Department",
          prescription: "CPAP machine with nasal mask, saline nasal spray",
          summary:
            "Moderate obstructive sleep apnea confirmed (AHI: 22 events/hour). CPAP therapy initiated.",
          advice:
            "Use CPAP machine nightly for minimum 6 hours, maintain consistent sleep schedule, lose weight if possible, avoid alcohol before bedtime.",
          notes:
            "Patient reports feeling more rested after 2 weeks of CPAP use. Machine compliance good (averaging 7.2 hours/night).",
        },
      ],
    };

    // Get all patients
    const patientsRef = db.collection("patients");
    const snapshot = await patientsRef.get();

    let updatedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const patientName = data.name;

      if (medicalHistoryData[patientName]) {
        console.log(`Adding medical history for ${patientName}...`);

        // Get existing medical history or initialize empty array
        const existingHistory = data.medicalHistory || [];
        const newHistory = medicalHistoryData[patientName];

        // Merge with existing history
        const combinedHistory = [...existingHistory, ...newHistory];

        // Update the patient document
        await doc.ref.update({
          medicalHistory: combinedHistory,
          updatedAt: Firestore.FieldValue.serverTimestamp(),
        });

        console.log(
          `✅ Added ${newHistory.length} medical history records for ${patientName}`
        );
        updatedCount++;
      }
    }

    res.status(200).json({
      message: "Medical history records added successfully",
      updatedPatients: updatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding medical history:", error);
    res.status(500).json({
      error: "Failed to add medical history records",
      details: error.message,
    });
  }
});
