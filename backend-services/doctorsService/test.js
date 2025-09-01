// Healthcare Test - Doctors Service Test Script
// This script tests the deployed doctorsService Cloud Function

const BASE_URL = process.env.FUNCTION_URL || "http://localhost:8080";

// Helper function to make API calls
async function testEndpoint(action, options = {}) {
  const { method = "GET", body, queryParams = {} } = options;

  const url = new URL(BASE_URL);
  url.searchParams.append("action", action);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const requestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    console.log(`\n🔍 Testing: ${action}`);
    console.log(`📡 URL: ${url.toString()}`);

    const response = await fetch(url.toString(), requestOptions);
    const data = await response.json();

    if (!response.ok) {
      console.log(`❌ Failed: ${data.error || `HTTP ${response.status}`}`);
      return null;
    }

    console.log(`✅ Success:`, data);
    return data;
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return null;
  }
}

// Test functions
async function runTests() {
  console.log("🏥 Healthcare Test - Doctors Service API Testing");
  console.log("================================================");
  console.log(`🌐 Base URL: ${BASE_URL}`);

  // Test 1: Get all specialties
  await testEndpoint("getSpecialties");

  // Test 2: Get all cities
  await testEndpoint("getCities");

  // Test 3: Get all doctors
  const allDoctors = await testEndpoint("getAllDoctors");

  // Test 4: Get doctors by specialty (if we have data)
  if (allDoctors && allDoctors.doctors && allDoctors.doctors.length > 0) {
    const firstSpecialty = allDoctors.doctors[0].specialty;
    await testEndpoint("getDoctorsBySpecialty", {
      queryParams: { specialty: firstSpecialty },
    });
  }

  // Test 5: Search doctors
  await testEndpoint("searchDoctors", {
    queryParams: { searchTerm: "Dr" },
  });

  // Test 6: Try to add a test doctor
  const testDoctor = {
    name: "Dr. Test Doctor",
    specialty: "General Practice",
    city: "Test City",
    rating: 4.5,
    image: "https://example.com/test-doctor.jpg",
    availability: {
      "2024-01-15": ["09:00", "10:00", "11:00"],
      "2024-01-16": ["14:00", "15:00", "16:00"],
    },
  };

  const addResult = await testEndpoint("addDoctor", {
    method: "POST",
    body: testDoctor,
  });

  // Test 7: If doctor was added, try to get it
  if (addResult && addResult.doctorId) {
    await testEndpoint("getDoctorById", {
      queryParams: { doctorId: addResult.doctorId },
    });

    // Test 8: Update the test doctor
    await testEndpoint("updateDoctor", {
      method: "PUT",
      queryParams: { doctorId: addResult.doctorId },
      body: { rating: 5.0 },
    });

    // Test 9: Delete the test doctor
    await testEndpoint("deleteDoctor", {
      method: "DELETE",
      queryParams: { doctorId: addResult.doctorId },
    });
  }

  console.log("\n🎉 Testing completed!");
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
