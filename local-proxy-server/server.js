// --- OPENAI HEALTH SEARCH ENDPOINT ---
app.post("/openai-health-search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful medical assistant. Provide concise, accurate health and medical information for user queries. If asked about a condition, explain what it is, symptoms, and general advice.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );
    const answer =
      response.data.choices?.[0]?.message?.content || "No info found.";
    res.json({ result: answer });
  } catch (err) {
    console.error(
      "OpenAI health search error:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch info from OpenAI" });
  }
});
/**
 * Conversational Agent: demo-healthcare-agent (project: healthcare-patient-portal, region: global)
 * Purpose: Triage symptoms and book appointments.
 * Webhooks exposed:
 *   - POST /webhook/symptoms-analyzer        (tag: "symptoms-analyzer")
 *   - POST /webhook/check-doctor-availability
 *   - POST /webhook/doctor-availability-search (tag: "get-doctor-availability-params" | "search-doctors-by-criteria")
 *   - POST /dialogflow-proxy                 (legacy proxy support)
 * Contract:
 *   Reads/writes sessionInfo.parameters:
 *     - symptoms_list (@sys.any)
 *     - symptom_duration_days (@sys.number)
 *     - symptom_result: "gp"|"specialist"|"self_care"|"emergency"
 *     - selected_doctor_name (@doctor_name)
 *     - insurance_provider (@sys.any)
 *     - final_status: "covered"|"not_covered"
 *     - user_name (@given_name), dob (@sys.date)
 *     - specialty, location, date (for doctor availability search)
 *     - search_results, search_specialty, search_location, search_date
 * Navigation:
 *   Return session params to trigger page routes, or set targetPage/targetFlow explicitly.
 */

const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library");
const { Firestore } = require("@google-cloud/firestore");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Configure CORS for your local React app
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3002",
      "http://localhost:3000",
    ],
  })
);

app.use(express.json());

// Initialize Firestore
const db = new Firestore({
  projectId: "healthcare-patient-portal",
});

// Initialize Google Auth for legacy proxy
const serviceAccountPath = path.join(__dirname, "service-account-key.json");
const auth = new GoogleAuth({
  keyFilename: serviceAccountPath,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

// Dialogflow CX configuration
const PROJECT_ID = "healthcare-patient-portal";
const LOCATION = "global";
const AGENT_ID = "acd7126a-09af-4757-a144-6499da454f47";

// Helper function to respond to Dialogflow
function say(text) {
  return { messages: [{ text: { text: [text] } }] };
}

// --- Database Helper Functions (converted from Python) ---

function getDateStringFromDobParam(dobParam) {
  if (typeof dobParam === "string") {
    try {
      // Handle MM/DD/YYYY format
      const date = new Date(dobParam);
      return date.toISOString().split("T")[0]; // Return YYYY-MM-DD
    } catch (error) {
      return null;
    }
  } else if (
    typeof dobParam === "object" &&
    dobParam.year &&
    dobParam.month &&
    dobParam.day
  ) {
    try {
      const year = parseInt(dobParam.year);
      const month = parseInt(dobParam.month);
      const day = parseInt(dobParam.day);
      return `${year.toString().padStart(4, "0")}-${month
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    } catch (error) {
      return null;
    }
  }
  return null;
}

async function getAvailableDoctors(specialty, maxResults = 5) {
  try {
    const availableDoctors = [];
    const foundDoctorIds = new Set();

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    // Query for unbooked appointments within the next 30 days
    const availabilityRef = db.collection("doctor_availability");
    const availabilityQuery = availabilityRef
      .where("is_booked", "==", false)
      .where("time_slot", ">", now)
      .where("time_slot", "<", thirtyDaysFromNow)
      .orderBy("time_slot")
      .limit(50);

    const appointmentSnapshot = await availabilityQuery.get();

    for (const appointmentDoc of appointmentSnapshot.docs) {
      if (availableDoctors.length >= maxResults) break;

      const appointmentData = appointmentDoc.data();
      const doctorId = appointmentData.doctor_id;

      if (!foundDoctorIds.has(doctorId)) {
        const doctorDoc = await db.collection("doctors").doc(doctorId).get();

        if (doctorDoc.exists) {
          const doctorData = doctorDoc.data();
          const docSpecialty = doctorData.specialty;

          if (docSpecialty === specialty) {
            foundDoctorIds.add(doctorId);

            availableDoctors.push({
              id: appointmentDoc.id,
              doctor_id: doctorId,
              name: doctorData.name,
              clinic_address: doctorData.clinic_address,
              time_slot: appointmentData.time_slot.toDate(),
              ...appointmentData,
            });
          }
        }
      }
    }

    return availableDoctors;
  } catch (error) {
    console.error("Error querying Firestore for doctors:", error);
    return [];
  }
}

async function checkInsuranceAndCost(doctorName, insuranceProvider) {
  try {
    const doctorsRef = db.collection("doctors");
    const doctorQuery = doctorsRef.where("name", "==", doctorName).limit(1);
    const doctorSnapshot = await doctorQuery.get();

    if (doctorSnapshot.empty) {
      return ["Sorry, I can't find information for that doctor.", null, null];
    }

    const doctorData = doctorSnapshot.docs[0].data();
    const acceptedInsurances = doctorData.accepted_insurances || [];

    const visitCost = "$50";
    const copay = "$25";

    if (acceptedInsurances.includes(insuranceProvider)) {
      return ["Your visit is covered by your insurance.", visitCost, copay];
    } else {
      return ["This doctor does not accept your insurance.", visitCost, null];
    }
  } catch (error) {
    console.error("Error checking insurance:", error);
    return ["An error occurred while checking insurance.", null, null];
  }
}

async function findUserEmail(firstName, lastName, dob) {
  try {
    const patientsRef = db.collection("patients");
    const userQuery = patientsRef
      .where("firstName", "==", firstName)
      .where("lastName", "==", lastName)
      .where("dob", "==", dob)
      .limit(1);

    const userSnapshot = await userQuery.get();

    if (!userSnapshot.empty) {
      return userSnapshot.docs[0].data().email;
    }

    return null;
  } catch (error) {
    console.error("Error finding user email:", error);
    return null;
  }
}

async function bookAppointment(appointmentDocId, userName, userEmail) {
  try {
    console.log(`Attempting to book appointment with ID: ${appointmentDocId}`);

    const appointmentDocRef = db
      .collection("doctor_availability")
      .doc(appointmentDocId);
    const docSnapshot = await appointmentDocRef.get();

    if (!docSnapshot.exists || docSnapshot.data().is_booked) {
      console.log("Appointment is either non-existent or already booked.");
      return false;
    }

    await appointmentDocRef.update({ is_booked: true });
    console.log("Appointment document updated successfully.");

    const appointmentsRef = db.collection("appointments");
    await appointmentsRef.add({
      user_name: userName,
      user_email: userEmail,
      time_slot_ref: appointmentDocRef,
      booking_date: new Date(),
    });

    console.log(`Appointment record created for user ${userName}.`);
    return true;
  } catch (error) {
    console.error("Error booking appointment:", error);
    return false;
  }
}

function getDoctorFromChoice(doctorInfoList, choiceString) {
  const choiceLower = choiceString.toLowerCase();

  const numberWords = ["first", "second", "third", "fourth", "fifth"];
  for (let i = 0; i < numberWords.length; i++) {
    if (choiceLower.includes(numberWords[i])) {
      try {
        return doctorInfoList[i];
      } catch (error) {
        return null;
      }
    }
  }

  // Try to extract doctor name
  const match = choiceString.match(/dr\.?\s+([a-zA-Z\s]+)/i);
  if (match) {
    const name = match[1].trim();
    return doctorInfoList.find((d) => d.name && d.name.includes(name)) || null;
  }

  return null;
}

// --- NEW WEBHOOK ENDPOINTS ---

/**
 * POST /webhook/symptoms-analyzer
 * Main webhook for symptom analysis, doctor selection, and booking
 */
app.post("/webhook/symptoms-analyzer", async (req, res) => {
  try {
    console.log("=== SYMPTOMS ANALYZER WEBHOOK ===");
    console.log(JSON.stringify(req.body, null, 2));

    const body = req.body;
    const tag = body.fulfillmentInfo?.tag;
    const sessionParams = body.sessionInfo?.parameters || {};

    const response = { sessionInfo: { parameters: {} } };

    console.log(`Webhook received parameters:`, sessionParams);
    console.log("-".repeat(50));

    // Extract parameters
    const symptomsList = sessionParams.symptoms_list || [];
    const symptomDurationDays = sessionParams.symptom_duration_days || 0;
    const selectedDoctorChoice = sessionParams.selected_doctor_name;
    const insuranceProvider = sessionParams.insurance_provider;
    const doctorInfoList = sessionParams.doctor_info_list || [];
    const userName = sessionParams.user_name;
    const dob = sessionParams.dob;
    const bookingConfirmed = sessionParams.booking_confirmed;

    // --- Appointment Confirmation Logic ---
    if (bookingConfirmed) {
      console.log("Entering appointment confirmation logic block...");
      const selectedDoctorObject = sessionParams.selected_doctor_object || {};

      console.log(
        `Attempting to book: selectedDoctorObject=${JSON.stringify(
          selectedDoctorObject
        )}, userName=${userName}, dob=${dob}`
      );

      if (selectedDoctorObject && userName && dob) {
        const nameParts = userName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");

        const formattedDob = getDateStringFromDobParam(dob);

        if (!formattedDob) {
          response.fulfillmentResponse = say(
            "I'm sorry, the date of birth format is incorrect. Please use MM/DD/YYYY."
          );
          return res.json(response);
        }

        const userEmail = await findUserEmail(
          firstName,
          lastName,
          formattedDob
        );

        if (userEmail) {
          const appointmentDocId = selectedDoctorObject.id;

          if (appointmentDocId) {
            const appointmentBooked = await bookAppointment(
              appointmentDocId,
              userName,
              userEmail
            );

            if (appointmentBooked) {
              const timeSlotStr =
                sessionParams.appointment_time ||
                selectedDoctorObject.time_slot;

              // TODO: Send confirmation email (implement email service)

              response.sessionInfo.parameters = {
                booking_confirmed: null,
                selected_doctor_object: null,
                user_name: null,
                dob: null,
                doctor_name: selectedDoctorObject.name,
                appointment_time: timeSlotStr,
              };

              response.fulfillmentResponse = say(
                `Your appointment with Dr. ${selectedDoctorObject.name} has been successfully booked! A confirmation email has been sent to ${userEmail}.`
              );
            } else {
              response.fulfillmentResponse = say(
                "I'm sorry, that appointment time is no longer available. Please try again."
              );
            }
          } else {
            response.fulfillmentResponse = say(
              "I'm sorry, I could not find the appointment details. Please try again."
            );
          }
        } else {
          response.fulfillmentResponse = say(
            "I'm sorry, I could not find your information in the database. Please ensure your name and date of birth are correct."
          );
        }
      } else {
        response.fulfillmentResponse = say(
          "I'm sorry, I could not find the necessary details to book your appointment. Please restart the process."
        );
      }

      return res.json(response);
    }

    // --- Insurance Check Logic ---
    if (
      selectedDoctorChoice &&
      insuranceProvider &&
      doctorInfoList.length > 0
    ) {
      console.log("Entering insurance check logic block...");
      console.log(
        `Doctor Choice: ${selectedDoctorChoice}, Insurance: ${insuranceProvider}`
      );

      const selectedDoctorObject = getDoctorFromChoice(
        doctorInfoList,
        selectedDoctorChoice
      );

      if (selectedDoctorObject) {
        const selectedDoctorName = selectedDoctorObject.name;
        const [status, cost, copay] = await checkInsuranceAndCost(
          selectedDoctorName,
          insuranceProvider
        );

        response.sessionInfo.parameters = {
          selected_doctor_object: selectedDoctorObject,
          final_status: status.includes("covered") ? "covered" : "not_covered",
          doctor_info_list: doctorInfoList,
        };

        let responseText;
        if (status.includes("covered")) {
          responseText = `Your visit is covered by your insurance. Your estimated copay is: ${copay}. Do you want to book this appointment with Dr. ${selectedDoctorName}?`;
        } else {
          responseText = `This doctor does not accept your insurance. Estimated total cost: ${cost}. Would you like to book this appointment anyway?`;
        }

        response.fulfillmentResponse = say(responseText);
        return res.json(response);
      } else {
        response.fulfillmentResponse = say(
          "I'm sorry, I couldn't find that doctor in my records. Can you please select one by number (e.g., 'first one') or type the full name exactly as it appears?"
        );
        return res.json(response);
      }
    }

    // --- Initial Symptom Analysis Logic ---
    const symptomText = Array.isArray(symptomsList)
      ? symptomsList.join(" ").toLowerCase()
      : symptomsList.toLowerCase();

    let symptomResult;
    let responseText;

    if (
      symptomText.includes("emergency") ||
      symptomText.includes("severe breathing") ||
      symptomText.includes("unconscious")
    ) {
      symptomResult = "emergency";
      responseText =
        "Your symptoms may be a medical emergency. Please seek immediate medical attention by calling 999 or going to your nearest A&E.";
    } else if (symptomDurationDays >= 14) {
      symptomResult = "specialist";
      responseText =
        "Based on the persistence of your symptoms for more than 14 days, we recommend you book an appointment with a specialist.";
    } else if (symptomDurationDays >= 3) {
      symptomResult = "gp";
      responseText =
        "Given your symptoms have lasted for more than 3 days, we recommend you book an appointment to see a GP.";
    } else {
      symptomResult = "self_care";
      responseText =
        "Your symptoms appear to be mild. We recommend self-care measures such as rest, hydration, and over-the-counter remedies.";
    }

    let availableDoctors = [];
    if (symptomResult === "gp" || symptomResult === "specialist") {
      availableDoctors = await getAvailableDoctors(symptomResult);

      if (availableDoctors.length > 0) {
        let doctorListText = "\n\nAvailable doctors and their specialties:\n";
        availableDoctors.forEach((doctor, i) => {
          const appointmentTime = doctor.time_slot;
          const formattedDate = appointmentTime.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const formattedTime = appointmentTime.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          doctorListText += `${i + 1}. Dr. ${doctor.name}\n`;
          doctorListText += `    - Date & Time: ${formattedDate} at ${formattedTime}\n`;
          doctorListText += `    - Clinic: ${doctor.clinic_address}\n`;
        });

        responseText +=
          doctorListText +
          "\nWould you like to check if your insurance covers your visit with any of these doctors?";
      } else {
        responseText +=
          " There are no available doctors at this time. Please try again later.";
      }
    }

    response.sessionInfo.parameters = {
      symptom_result: symptomResult,
      doctor_available: availableDoctors.length > 0,
      doctor_info_list: availableDoctors,
    };

    response.fulfillmentResponse = say(responseText);

    return res.json(response);
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [
                "An error occurred while processing your request. Please try again later.",
              ],
            },
          },
        ],
      },
    });
  }
});

/**
 * POST /webhook/check-doctor-availability
 * Separate endpoint for doctor availability checks
 */
app.post("/webhook/check-doctor-availability", async (req, res) => {
  const sessionParams = req.body.sessionInfo?.parameters || {};
  const response = { sessionInfo: { parameters: {} } };

  const selectedDoctorName = sessionParams.selected_doctor_name;

  if (selectedDoctorName) {
    response.fulfillmentResponse = say(
      `Doctor ${selectedDoctorName} has available slots tomorrow.`
    );
  } else {
    response.fulfillmentResponse = say(
      "Please tell me which doctor you prefer."
    );
  }

  res.json(response);
});

/**
 * POST /webhook/doctor-availability-search
 * Handles doctor availability searches with specialty, date, and location
 */
app.post("/webhook/doctor-availability-search", async (req, res) => {
  console.log("=== DOCTOR AVAILABILITY SEARCH WEBHOOK ===");
  console.log("Request:", JSON.stringify(req.body, null, 2));

  const sessionParams = req.body.sessionInfo?.parameters || {};
  const tag = req.body.fulfillmentInfo?.tag;

  try {
    let response = {};

    if (tag === "get-doctor-availability-params") {
      // Initial request for doctor availability - ask for parameters
      response = {
        fulfillmentResponse: {
          messages: [
            {
              text: {
                text: [
                  "Please provide the following information to find available doctors:",
                ],
              },
            },
            {
              text: {
                text: [
                  "1. **Doctor specialty** (e.g., Cardiologist, Dermatologist, General Practitioner)\n2. **Preferred date** (e.g., today, tomorrow, or specific date)\n3. **Location/City** (e.g., London, Manchester)",
                ],
              },
            },
            {
              text: {
                text: [
                  "You can say something like: 'I need a cardiologist in London for tomorrow'",
                ],
              },
            },
          ],
        },
        sessionInfo: {
          parameters: {
            ...sessionParams,
            availability_flow_started: true,
          },
        },
      };
    } else if (tag === "search-doctors-by-criteria") {
      // Process the search with provided parameters
      const specialty =
        sessionParams.specialty || sessionParams.doctor_specialty;
      const location = sessionParams.location || sessionParams.city;
      const dateParam = sessionParams.date || sessionParams.preferred_date;

      console.log("Search parameters:", { specialty, location, dateParam });

      if (!specialty || !location || !dateParam) {
        // Missing parameters - ask for them specifically
        let missingParams = [];
        if (!specialty) missingParams.push("specialty");
        if (!location) missingParams.push("location");
        if (!dateParam) missingParams.push("date");

        response = {
          fulfillmentResponse: {
            messages: [
              {
                text: {
                  text: [
                    `I need more information. Please provide: ${missingParams.join(
                      ", "
                    )}`,
                  ],
                },
              },
            ],
          },
          sessionInfo: {
            parameters: sessionParams,
          },
        };
      } else {
        // All parameters available - search for doctors
        const searchResults = await searchAvailableDoctors(
          specialty,
          location,
          dateParam
        );

        if (searchResults.success && searchResults.doctors.length > 0) {
          let responseText = `I found ${searchResults.doctors.length} ${specialty} doctor(s) available in ${location} on ${searchResults.formattedDate}:\n\n`;

          searchResults.doctors.forEach((doctor, index) => {
            responseText += `**${index + 1}. Dr. ${doctor.name}**\n`;
            responseText += `   📍 ${doctor.location}\n`;
            responseText += `   ⭐ Rating: ${doctor.rating}/5\n`;
            responseText += `   🕒 Available times: ${doctor.availableTimes.join(
              ", "
            )}\n\n`;
          });

          responseText +=
            "Which doctor would you like to book an appointment with? You can say the doctor's name or number.";

          response = {
            fulfillmentResponse: {
              messages: [
                {
                  text: {
                    text: [responseText],
                  },
                },
              ],
            },
            sessionInfo: {
              parameters: {
                ...sessionParams,
                search_results: searchResults.doctors,
                search_specialty: specialty,
                search_location: location,
                search_date: searchResults.formattedDate,
                next_action: "select_doctor",
              },
            },
          };
        } else {
          response = {
            fulfillmentResponse: {
              messages: [
                {
                  text: {
                    text: [
                      `Sorry, I couldn't find any ${specialty} doctors available in ${location} on the requested date. Would you like to try a different date or location?`,
                    ],
                  },
                },
              ],
            },
            sessionInfo: {
              parameters: {
                ...sessionParams,
                search_failed: true,
              },
            },
          };
        }
      }
    }

    console.log("=== RESPONSE ===");
    console.log(JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error("Error in doctor availability search:", error);
    res.status(500).json({
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [
                "Sorry, I'm having trouble searching for doctors right now. Please try again later.",
              ],
            },
          },
        ],
      },
    });
  }
});

/**
 * Search for available doctors based on specialty, location, and date
 */
async function searchAvailableDoctors(specialty, location, dateParam) {
  try {
    console.log(`Searching for ${specialty} in ${location} on ${dateParam}`);

    // Process date parameter (could be "today", "tomorrow", or specific date)
    const searchDate = processDateParameter(dateParam);

    // Query Firestore for doctors
    let doctorsQuery = db.collection("doctors");

    // Filter by specialty (case-insensitive)
    if (
      specialty.toLowerCase() !== "any" &&
      specialty.toLowerCase() !== "general practitioner"
    ) {
      doctorsQuery = doctorsQuery.where(
        "specialty",
        "==",
        specialty.toLowerCase()
      );
    }

    const doctorsSnapshot = await doctorsQuery.limit(10).get();

    if (doctorsSnapshot.empty) {
      return { success: false, doctors: [], message: "No doctors found" };
    }

    const availableDoctors = [];

    for (const docSnapshot of doctorsSnapshot.docs) {
      const doctorData = docSnapshot.data();

      // Filter by location (check city field)
      if (
        !doctorData.city ||
        !doctorData.city.toLowerCase().includes(location.toLowerCase())
      ) {
        continue;
      }

      // Check availability for the specific date
      const availability = await checkDoctorAvailability(
        docSnapshot.id,
        searchDate
      );

      if (availability.isAvailable && availability.timeSlots.length > 0) {
        availableDoctors.push({
          id: docSnapshot.id,
          name: doctorData.name,
          specialty: doctorData.specialty,
          location: doctorData.city,
          rating: doctorData.rating || 4.5,
          availableTimes: availability.timeSlots,
          ...doctorData,
        });
      }
    }

    return {
      success: true,
      doctors: availableDoctors,
      formattedDate: formatDate(searchDate),
    };
  } catch (error) {
    console.error("Error searching doctors:", error);
    return { success: false, doctors: [], message: error.message };
  }
}

/**
 * Check if a specific doctor is available on a given date
 */
async function checkDoctorAvailability(doctorId, date) {
  try {
    const availabilityRef = db.collection("doctor_availability");
    const availabilitySnapshot = await availabilityRef
      .where("doctor_id", "==", doctorId)
      .where("date", ">=", date)
      .where("date", "<", new Date(date.getTime() + 24 * 60 * 60 * 1000)) // Same day
      .where("is_available", "==", true)
      .get();

    const timeSlots = [];

    availabilitySnapshot.forEach((doc) => {
      const slotData = doc.data();
      if (slotData.time_slot) {
        timeSlots.push(slotData.time_slot);
      }
    });

    // If no specific availability records, generate default time slots
    if (timeSlots.length === 0) {
      const defaultSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"];
      return {
        isAvailable: true,
        timeSlots: defaultSlots,
      };
    }

    return {
      isAvailable: timeSlots.length > 0,
      timeSlots: timeSlots.sort(),
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return {
      isAvailable: false,
      timeSlots: [],
    };
  }
}

/**
 * Process date parameter from user input
 */
function processDateParameter(dateParam) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateParam.toLowerCase().includes("today")) {
    return today;
  } else if (dateParam.toLowerCase().includes("tomorrow")) {
    return tomorrow;
  } else {
    // Try to parse the date string
    try {
      return new Date(dateParam);
    } catch (error) {
      console.log("Could not parse date, using today as default");
      return today;
    }
  }
}

/**
 * Format date for display
 */
function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// --- LEGACY PROXY ENDPOINT (for backward compatibility) ---
app.post("/dialogflow-proxy", async (req, res) => {
  console.log("=== PROXY REQUEST ===");
  console.log("Forwarding to Dialogflow CX...");

  try {
    // Get access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Forward request to Dialogflow CX
    const dialogflowUrl =
      LOCATION === "global"
        ? `https://dialogflow.googleapis.com/v3/projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}/sessions/${req.body.sessionId}:detectIntent`
        : `https://${LOCATION}-dialogflow.googleapis.com/v3/projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}/sessions/${req.body.sessionId}:detectIntent`;

    const response = await axios.post(dialogflowUrl, req.body, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("=== DIALOGFLOW RESPONSE ===");
    console.log(JSON.stringify(response.data, null, 2));

    res.json(response.data);
  } catch (error) {
    console.error("Proxy error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to communicate with Dialogflow",
      details: error.response?.data || error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /webhook/symptoms-analyzer",
      "POST /webhook/check-doctor-availability",
      "POST /webhook/doctor-availability-search",
      "POST /dialogflow-proxy (legacy)",
    ],
  });
});

app.listen(PORT, () => {
  console.log(
    `🚀 Healthcare Webhook Server running on http://localhost:${PORT}`
  );
  console.log("📡 Available endpoints:");
  console.log("  - POST /webhook/symptoms-analyzer (new webhook)");
  console.log("  - POST /webhook/check-doctor-availability (new webhook)");
  console.log("  - POST /webhook/doctor-availability-search (new webhook)");
  console.log("  - POST /dialogflow-proxy (legacy proxy)");
  console.log("🧠 Integrated with Firestore database and appointment booking");
  console.log(`🔗 Agent: ${PROJECT_ID}/${LOCATION}/${AGENT_ID}`);
});
