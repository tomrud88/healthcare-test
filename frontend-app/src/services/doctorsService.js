// src/services/doctorsService.js

// Configuration - set your Cloud Function URL here
const DOCTORS_API_URL =
  process.env.REACT_APP_DOCTORS_API_URL || "http://localhost:8080";

export class DoctorsService {
  // Helper method to make API calls
  static async makeRequest(action, options = {}) {
    const { method = "GET", body, queryParams = {} } = options;

    // Build URL with action and query parameters
    const url = new URL(DOCTORS_API_URL);
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
      const response = await fetch(url.toString(), requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for action: ${action}`, error);
      throw error;
    }
  }

  // Get all doctors
  static async getAllDoctors() {
    try {
      const response = await this.makeRequest("getAllDoctors");
      return response.doctors || [];
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw error;
    }
  }

  // Get doctors by specialty
  static async getDoctorsBySpecialty(specialty) {
    try {
      const response = await this.makeRequest("getDoctorsBySpecialty", {
        queryParams: { specialty },
      });
      return response.doctors || [];
    } catch (error) {
      console.error("Error fetching doctors by specialty:", error);
      throw error;
    }
  }

  // Get doctors by city
  static async getDoctorsByCity(city) {
    try {
      const response = await this.makeRequest("getDoctorsByCity", {
        queryParams: { city },
      });
      return response.doctors || [];
    } catch (error) {
      console.error("Error fetching doctors by city:", error);
      throw error;
    }
  }

  // Get doctors by specialty and city
  static async getDoctorsBySpecialtyAndCity(specialty, city) {
    try {
      const response = await this.makeRequest("getDoctorsByFilters", {
        queryParams: { specialty, city },
      });
      return response.doctors || [];
    } catch (error) {
      console.error("Error fetching doctors by specialty and city:", error);
      throw error;
    }
  }

  // Get a single doctor by ID
  static async getDoctorById(doctorId) {
    try {
      const response = await this.makeRequest("getDoctorById", {
        queryParams: { doctorId },
      });
      return response.doctor;
    } catch (error) {
      console.error("Error fetching doctor by ID:", error);
      throw error;
    }
  }

  // Add a new doctor
  static async addDoctor(doctorData) {
    try {
      const response = await this.makeRequest("addDoctor", {
        method: "POST",
        body: doctorData,
      });
      return response.doctorId;
    } catch (error) {
      console.error("Error adding doctor:", error);
      throw error;
    }
  }

  // Update a doctor
  static async updateDoctor(doctorId, updates) {
    try {
      await this.makeRequest("updateDoctor", {
        method: "PUT",
        queryParams: { doctorId },
        body: updates,
      });
      return true;
    } catch (error) {
      console.error("Error updating doctor:", error);
      throw error;
    }
  }

  // Delete a doctor
  static async deleteDoctor(doctorId) {
    try {
      await this.makeRequest("deleteDoctor", {
        method: "DELETE",
        queryParams: { doctorId },
      });
      return true;
    } catch (error) {
      console.error("Error deleting doctor:", error);
      throw error;
    }
  }

  // Get unique specialties
  static async getSpecialties() {
    try {
      const response = await this.makeRequest("getSpecialties");
      return response.specialties || [];
    } catch (error) {
      console.error("Error fetching specialties:", error);
      throw error;
    }
  }

  // Get unique cities
  static async getCities() {
    try {
      const response = await this.makeRequest("getCities");
      return response.cities || [];
    } catch (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }
  }

  // Search doctors by name
  static async searchDoctorsByName(searchTerm) {
    try {
      const response = await this.makeRequest("searchDoctors", {
        queryParams: { searchTerm },
      });
      return response.doctors || [];
    } catch (error) {
      console.error("Error searching doctors by name:", error);
      throw error;
    }
  }

  // Update doctor availability
  static async updateDoctorAvailability(doctorId, availability) {
    try {
      await this.makeRequest("updateAvailability", {
        method: "PUT",
        queryParams: { doctorId },
        body: { availability },
      });
      return true;
    } catch (error) {
      console.error("Error updating doctor availability:", error);
      throw error;
    }
  }

  // Migrate local data to cloud
  static async migrateLocalData(doctors) {
    try {
      const response = await this.makeRequest("migrateLocalData", {
        method: "POST",
        body: { doctors },
      });
      return response.summary;
    } catch (error) {
      console.error("Error migrating local data:", error);
      throw error;
    }
  }
}

export default DoctorsService;
