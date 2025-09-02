// your-healthcare-platform/backend-services/submitRegistrationForm/index.js

const functions = require("@google-cloud/functions-framework");
const { Firestore } = require("@google-cloud/firestore");

const db = new Firestore();

functions.http("submitRegistrationForm", async (req, res) => {
  // CORS Preflight handling
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*"); // Replace with your frontend domain in production
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  // Set CORS headers for the actual response
  res.set("Access-Control-Allow-Origin", "*"); // Replace with your frontend domain in production

  // Handle GET requests for fetching patient data
  if (req.method === "GET") {
    try {
      const patientId = req.query.patientId;

      if (!patientId) {
        return res.status(400).json({ error: "Missing patientId parameter." });
      }

      const patientRef = db.collection("patients").doc(patientId);
      const doc = await patientRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Patient not found." });
      }

      const patientData = doc.data();
      console.log(`Patient data retrieved for: ${patientId}`);

      return res.status(200).json({
        message: "Patient data retrieved successfully.",
        patientId: patientId,
        ...patientData,
      });
    } catch (error) {
      console.error("Error fetching patient data:", error);
      res
        .status(500)
        .json({ error: "Internal server error.", details: error.message });
    }
    return;
  }

  // Add logging for all POST requests
  console.log("POST request received");
  console.log("Request method:", req.method);
  console.log("Request body:", req.body);

  try {
    const { patientId, formData } = req.body; // Expecting patientId (Firebase UID) and formData object

    console.log("Extracted patientId:", patientId);
    console.log("Extracted formData:", formData);

    if (!patientId || !formData) {
      console.log("Missing patientId or formData");
      return res.status(400).json({ error: "Missing patientId or formData." });
    }

    // Reference to the patient's document in Firestore (using Firebase Auth UID)
    const patientRef = db.collection("patients").doc(patientId);

    // Check if this is a booking addition (has newBooking field)
    if (formData.newBooking) {
      console.log("Processing booking addition for patient:", patientId);
      console.log("New booking data:", formData.newBooking);

      // Handle adding a new booking to existing patient
      const existingDoc = await patientRef.get();
      if (!existingDoc.exists) {
        console.log("Patient not found:", patientId);
        return res
          .status(404)
          .json({ error: "Patient not found. Please register first." });
      }

      const existingData = existingDoc.data();
      const currentBookings = existingData.bookings || [];

      console.log("Current bookings count:", currentBookings.length);

      // Use Firestore's arrayUnion to add the booking (recommended approach)
      await patientRef.update({
        bookings: Firestore.FieldValue.arrayUnion(formData.newBooking),
        updatedAt: Firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Booking added successfully for patient: ${patientId}`);
      return res.status(200).json({
        message: "Booking added successfully.",
        patientId: patientId,
        booking: formData.newBooking,
        totalBookings: currentBookings.length + 1,
      });
    }

    // Original registration/update logic for full patient data
    // Validate required fields
    const requiredFields = [
      "name",
      "surname",
      "email",
      "phoneNumber",
      "address",
      "city",
      "postcode",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields: missingFields,
      });
    }

    // Structure the patient data with all required fields
    const patientData = {
      // Personal Information
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      phoneNumber: formData.phoneNumber,

      // Address Information
      address: formData.address,
      city: formData.city,
      postcode: formData.postcode,

      // Bookings Information
      bookings: formData.bookings || [],

      // System fields
      createdAt: Firestore.FieldValue.serverTimestamp(),
      updatedAt: Firestore.FieldValue.serverTimestamp(),
    };

    // Add optional fields only if they have values
    if (formData.dateOfBirth) {
      patientData.dateOfBirth = formData.dateOfBirth;
    }
    if (formData.gender) {
      patientData.gender = formData.gender;
    }
    if (formData.bloodType) {
      patientData.bloodType = formData.bloodType;
    }
    if (formData.emergencyContactName) {
      patientData.emergencyContactName = formData.emergencyContactName;
    }
    if (formData.emergencyContactPhone) {
      patientData.emergencyContactPhone = formData.emergencyContactPhone;
    }
    if (formData.emergencyContactRelation) {
      patientData.emergencyContactRelation = formData.emergencyContactRelation;
    }
    if (formData.insuranceProvider) {
      patientData.insuranceProvider = formData.insuranceProvider;
    }
    if (formData.insurancePolicyNumber) {
      patientData.insurancePolicyNumber = formData.insurancePolicyNumber;
    }
    if (formData.medicalConditions) {
      patientData.medicalConditions = formData.medicalConditions;
    }
    if (formData.currentMedications) {
      patientData.currentMedications = formData.currentMedications;
    }
    if (formData.emergencyContact) {
      patientData.emergencyContact = formData.emergencyContact;
    }
    if (formData.medicalHistory) {
      patientData.medicalHistory = formData.medicalHistory;
    }
    if (formData.allergies) {
      patientData.allergies = formData.allergies;
    }

    console.log("Final patient data being saved to Firestore:");
    console.log(JSON.stringify(patientData, null, 2));
    console.log("Gender value from formData:", formData.gender);
    console.log("Gender value in patientData:", patientData.gender);

    // Update the document with new registration data.
    // Using `merge: true` will add/update fields without overwriting the entire document.
    await patientRef.set(patientData, { merge: true });

    console.log("Data successfully written to Firestore");
    console.log(
      `Patient profile created/updated for: ${formData.name} ${formData.surname} (${patientId})`
    );
    res.status(200).json({
      message: "Patient profile created successfully.",
      patientId: patientId,
      data: patientData,
    });
  } catch (error) {
    console.error("Error submitting registration form:", error);
    res
      .status(500)
      .json({ error: "Internal server error.", details: error.message });
  }
});
