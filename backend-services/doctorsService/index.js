// backend-services/doctorsService/index.js

const functions = require("@google-cloud/functions-framework");
const { Firestore } = require("@google-cloud/firestore");

const db = new Firestore();
const DOCTORS_COLLECTION = "doctors";

functions.http("doctorsService", async (req, res) => {
  // CORS Preflight handling
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*"); // Replace with your frontend domain in production
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  // Set CORS headers for the actual response
  res.set("Access-Control-Allow-Origin", "*"); // Replace with your frontend domain in production

  try {
    const { action } = req.query; // Action parameter to determine operation
    const method = req.method;

    switch (action) {
      case "getAllDoctors":
        return await getAllDoctors(req, res);

      case "getDoctorById":
        return await getDoctorById(req, res);

      case "getDoctorsBySpecialty":
        return await getDoctorsBySpecialty(req, res);

      case "getDoctorsByCity":
        return await getDoctorsByCity(req, res);

      case "getDoctorsByFilters":
        return await getDoctorsByFilters(req, res);

      case "getSpecialties":
        return await getSpecialties(req, res);

      case "getCities":
        return await getCities(req, res);

      case "searchDoctors":
        return await searchDoctors(req, res);

      case "addDoctor":
        if (method !== "POST") {
          return res.status(405).json({
            error: "Method not allowed. Use POST for adding doctors.",
          });
        }
        return await addDoctor(req, res);

      case "updateDoctor":
        if (method !== "PUT") {
          return res.status(405).json({
            error: "Method not allowed. Use PUT for updating doctors.",
          });
        }
        return await updateDoctor(req, res);

      case "deleteDoctor":
        if (method !== "DELETE") {
          return res.status(405).json({
            error: "Method not allowed. Use DELETE for deleting doctors.",
          });
        }
        return await deleteDoctor(req, res);

      case "updateAvailability":
        if (method !== "PUT") {
          return res.status(405).json({
            error: "Method not allowed. Use PUT for updating availability.",
          });
        }
        return await updateAvailability(req, res);

      case "migrateLocalData":
        if (method !== "POST") {
          return res
            .status(405)
            .json({ error: "Method not allowed. Use POST for migration." });
        }
        return await migrateLocalData(req, res);

      case "convertTimesTo24Hour":
        if (method !== "POST") {
          return res
            .status(405)
            .json({
              error: "Method not allowed. Use POST for time conversion.",
            });
        }
        return await convertTimesTo24Hour(req, res);

      default:
        return res.status(400).json({ error: "Invalid action parameter." });
    }
  } catch (error) {
    console.error("Doctors Service Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Get all doctors
async function getAllDoctors(req, res) {
  try {
    const doctorsSnapshot = await db.collection(DOCTORS_COLLECTION).get();
    const doctors = [];

    doctorsSnapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      doctors: doctors,
      count: doctors.length,
    });
  } catch (error) {
    console.error("Error fetching all doctors:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch doctors", details: error.message });
  }
}

// Get doctor by ID
async function getDoctorById(req, res) {
  try {
    const { doctorId } = req.query;

    if (!doctorId) {
      return res.status(400).json({ error: "doctorId parameter is required" });
    }

    const doctorDoc = await db
      .collection(DOCTORS_COLLECTION)
      .doc(doctorId)
      .get();

    if (!doctorDoc.exists) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    return res.status(200).json({
      success: true,
      doctor: {
        id: doctorDoc.id,
        ...doctorDoc.data(),
      },
    });
  } catch (error) {
    console.error("Error fetching doctor by ID:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch doctor", details: error.message });
  }
}

// Get doctors by specialty
async function getDoctorsBySpecialty(req, res) {
  try {
    const { specialty } = req.query;

    if (!specialty) {
      return res.status(400).json({ error: "specialty parameter is required" });
    }

    const doctorsSnapshot = await db
      .collection(DOCTORS_COLLECTION)
      .where("specialty", "==", specialty)
      .get();

    const doctors = [];
    doctorsSnapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      doctors: doctors,
      specialty: specialty,
      count: doctors.length,
    });
  } catch (error) {
    console.error("Error fetching doctors by specialty:", error);
    return res.status(500).json({
      error: "Failed to fetch doctors by specialty",
      details: error.message,
    });
  }
}

// Get doctors by city
async function getDoctorsByCity(req, res) {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: "city parameter is required" });
    }

    const doctorsSnapshot = await db
      .collection(DOCTORS_COLLECTION)
      .where("city", "==", city)
      .get();

    const doctors = [];
    doctorsSnapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      doctors: doctors,
      city: city,
      count: doctors.length,
    });
  } catch (error) {
    console.error("Error fetching doctors by city:", error);
    return res.status(500).json({
      error: "Failed to fetch doctors by city",
      details: error.message,
    });
  }
}

// Get doctors by multiple filters
async function getDoctorsByFilters(req, res) {
  try {
    const { specialty, city } = req.query;

    let query = db.collection(DOCTORS_COLLECTION);

    if (specialty && specialty !== "All") {
      query = query.where("specialty", "==", specialty);
    }

    if (city && city !== "All") {
      query = query.where("city", "==", city);
    }

    const doctorsSnapshot = await query.get();
    const doctors = [];

    doctorsSnapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      doctors: doctors,
      filters: { specialty, city },
      count: doctors.length,
    });
  } catch (error) {
    console.error("Error fetching doctors by filters:", error);
    return res.status(500).json({
      error: "Failed to fetch doctors by filters",
      details: error.message,
    });
  }
}

// Get unique specialties
async function getSpecialties(req, res) {
  try {
    const doctorsSnapshot = await db.collection(DOCTORS_COLLECTION).get();
    const specialties = new Set();

    doctorsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.specialty) {
        specialties.add(data.specialty);
      }
    });

    const specialtiesArray = Array.from(specialties).sort();

    return res.status(200).json({
      success: true,
      specialties: specialtiesArray,
      count: specialtiesArray.length,
    });
  } catch (error) {
    console.error("Error fetching specialties:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch specialties", details: error.message });
  }
}

// Get unique cities
async function getCities(req, res) {
  try {
    const doctorsSnapshot = await db.collection(DOCTORS_COLLECTION).get();
    const cities = new Set();

    doctorsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.city) {
        cities.add(data.city);
      }
    });

    const citiesArray = Array.from(cities).sort();

    return res.status(200).json({
      success: true,
      cities: citiesArray,
      count: citiesArray.length,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch cities", details: error.message });
  }
}

// Search doctors by name
async function searchDoctors(req, res) {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm) {
      return res
        .status(400)
        .json({ error: "searchTerm parameter is required" });
    }

    // Firestore doesn't support case-insensitive search natively
    // So we'll get all doctors and filter in JavaScript
    const doctorsSnapshot = await db.collection(DOCTORS_COLLECTION).get();
    const doctors = [];

    doctorsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        data.name &&
        data.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        doctors.push({
          id: doc.id,
          ...data,
        });
      }
    });

    return res.status(200).json({
      success: true,
      doctors: doctors,
      searchTerm: searchTerm,
      count: doctors.length,
    });
  } catch (error) {
    console.error("Error searching doctors:", error);
    return res
      .status(500)
      .json({ error: "Failed to search doctors", details: error.message });
  }
}

// Add a new doctor
async function addDoctor(req, res) {
  try {
    const doctorData = req.body;

    if (!doctorData.name || !doctorData.specialty) {
      return res
        .status(400)
        .json({ error: "name and specialty are required fields" });
    }

    // Add timestamps
    doctorData.createdAt = new Date();
    doctorData.updatedAt = new Date();

    const docRef = await db.collection(DOCTORS_COLLECTION).add(doctorData);

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      doctorId: docRef.id,
      doctor: {
        id: docRef.id,
        ...doctorData,
      },
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    return res
      .status(500)
      .json({ error: "Failed to add doctor", details: error.message });
  }
}

// Update a doctor
async function updateDoctor(req, res) {
  try {
    const { doctorId } = req.query;
    const updates = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: "doctorId parameter is required" });
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    const doctorRef = db.collection(DOCTORS_COLLECTION).doc(doctorId);
    await doctorRef.update(updates);

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctorId: doctorId,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return res
      .status(500)
      .json({ error: "Failed to update doctor", details: error.message });
  }
}

// Delete a doctor
async function deleteDoctor(req, res) {
  try {
    const { doctorId } = req.query;

    if (!doctorId) {
      return res.status(400).json({ error: "doctorId parameter is required" });
    }

    await db.collection(DOCTORS_COLLECTION).doc(doctorId).delete();

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
      doctorId: doctorId,
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return res
      .status(500)
      .json({ error: "Failed to delete doctor", details: error.message });
  }
}

// Update doctor availability
async function updateAvailability(req, res) {
  try {
    const { doctorId } = req.query;
    const { availability } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: "doctorId parameter is required" });
    }

    if (!availability) {
      return res.status(400).json({ error: "availability data is required" });
    }

    const doctorRef = db.collection(DOCTORS_COLLECTION).doc(doctorId);
    await doctorRef.update({
      availability: availability,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Doctor availability updated successfully",
      doctorId: doctorId,
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    return res.status(500).json({
      error: "Failed to update doctor availability",
      details: error.message,
    });
  }
}

// Migrate local data to Firestore
async function migrateLocalData(req, res) {
  try {
    const { doctors } = req.body;

    if (!doctors || !Array.isArray(doctors)) {
      return res
        .status(400)
        .json({ error: "doctors array is required in request body" });
    }

    const batch = db.batch();
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const doctor of doctors) {
      try {
        // Create a clean doctor ID from their name
        const doctorId = doctor.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        const doctorRef = db.collection(DOCTORS_COLLECTION).doc(doctorId);
        batch.set(doctorRef, {
          ...doctor,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          doctor: doctor.name || "Unknown",
          error: error.message,
        });
      }
    }

    // Commit the batch
    await batch.commit();

    return res.status(200).json({
      success: true,
      message: "Migration completed",
      summary: {
        total: doctors.length,
        successful: successCount,
        errors: errorCount,
        errorDetails: errors,
      },
    });
  } catch (error) {
    console.error("Error during migration:", error);
    return res
      .status(500)
      .json({ error: "Migration failed", details: error.message });
  }
}
