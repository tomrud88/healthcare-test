// src/services/patientService.js

const PATIENT_API_URL =
  "https://us-central1-healthcare-patient-portal.cloudfunctions.net/submitRegistrationForm";

export class PatientService {
  // Create or update patient profile
  static async createPatientProfile(patientId, formData) {
    try {
      const response = await fetch(PATIENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Error creating patient profile:", error);
      throw error;
    }
  }

  // Update patient information
  static async updatePatientProfile(patientId, updates) {
    try {
      const response = await fetch(PATIENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          formData: updates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Error updating patient profile:", error);
      throw error;
    }
  }

  // Add booking to patient's record
  static async addBooking(patientId, bookingData) {
    try {
      // Format the booking data
      const bookingInfo = {
        ...bookingData,
        bookingId: `booking_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      const requestBody = {
        patientId,
        formData: {
          // Send booking data with newBooking field to backend
          newBooking: bookingInfo,
        },
      };

      console.log("PatientService.addBooking - Sending request:", requestBody);

      const response = await fetch(PATIENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        "PatientService.addBooking - Response status:",
        response.status
      );
      console.log("PatientService.addBooking - Response headers:", [
        ...response.headers.entries(),
      ]);

      const data = await response.json();
      console.log("PatientService.addBooking - Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Error adding booking:", error);
      throw error;
    }
  }

  // Helper method to format booking data for appointments
  static formatBookingData(
    doctorId,
    doctorName,
    appointmentDate,
    appointmentTime,
    specialty
  ) {
    return {
      // Doctor information
      doctorId,
      doctorName,
      doctor: doctorName,
      specialty,

      // Appointment timing
      date: appointmentDate,
      time: appointmentTime,
      appointmentDate,
      appointmentTime,

      // Location (you can customize this)
      place: "Healthcare Center", // Default location
      location: "Healthcare Center",

      // Booking details
      status: "confirmed",
      bookingType: "appointment",

      // System fields
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Get patient profile data from Firestore
  static async getPatientProfile(patientId) {
    try {
      const response = await fetch(
        `${PATIENT_API_URL}?patientId=${patientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Patient not found, return null
          return null;
        }
        throw new Error(`Failed to fetch patient data: ${response.status}`);
      }

      const data = await response.json();
      console.log("Retrieved patient profile data:", data);

      return data;
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      // Return null instead of throwing to allow page to load
      return null;
    }
  }

  // Get patient appointments from Firestore
  static async getPatientAppointments(patientId) {
    try {
      const response = await fetch(
        `${PATIENT_API_URL}?patientId=${patientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Patient not found, return empty appointments
          return [];
        }
        throw new Error(`Failed to fetch patient data: ${response.status}`);
      }

      const data = await response.json();
      console.log("Retrieved patient data:", data);

      // Return the bookings array or empty array if none exist
      return data.bookings || [];
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
      // Return empty array instead of throwing to allow page to load
      return [];
    }
  }
}

export default PatientService;
