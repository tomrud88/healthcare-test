// src/services/gymsService.js
const GYMS_API_URL =
  "https://us-central1-healthcare-patient-portal.cloudfunctions.net/gymsService";

export class GymsService {
  // Get all gyms
  static async getAllGyms() {
    try {
      console.log("Fetching all gyms from API...");

      const response = await fetch(`${GYMS_API_URL}?action=getAllGyms`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch gyms: ${response.status}`);
      }

      const gyms = await response.json();
      console.log(`Retrieved ${gyms.length} gyms from API`);
      return gyms;
    } catch (error) {
      console.error("Error fetching gyms:", error);
      throw error;
    }
  }

  // Get gym by ID
  static async getGymById(gymId) {
    try {
      console.log(`Fetching gym with ID: ${gymId}`);

      const response = await fetch(
        `${GYMS_API_URL}?action=getGymById&gymId=${gymId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch gym: ${response.status}`);
      }

      const gym = await response.json();
      console.log(`Retrieved gym: ${gym.name}`);
      return gym;
    } catch (error) {
      console.error("Error fetching gym by ID:", error);
      throw error;
    }
  }

  // Search gyms with filters
  static async searchGyms({
    city = "All",
    amenity = "All",
    priceRange = "All",
  } = {}) {
    try {
      console.log(`Searching gyms with filters:`, {
        city,
        amenity,
        priceRange,
      });

      const params = new URLSearchParams({
        action: "searchGyms",
        ...(city !== "All" && { city }),
        ...(amenity !== "All" && { amenity }),
        ...(priceRange !== "All" && { priceRange }),
      });

      const response = await fetch(`${GYMS_API_URL}?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search gyms: ${response.status}`);
      }

      const gyms = await response.json();
      console.log(`Found ${gyms.length} gyms matching criteria`);
      return gyms;
    } catch (error) {
      console.error("Error searching gyms:", error);
      throw error;
    }
  }

  // Get unique cities from gyms
  static async getCities() {
    try {
      console.log("Fetching gym cities...");

      const response = await fetch(`${GYMS_API_URL}?action=getCities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cities: ${response.status}`);
      }

      const cities = await response.json();
      console.log(`Retrieved cities: ${cities.join(", ")}`);
      return cities;
    } catch (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }
  }

  // Create a new gym
  static async createGym(gymData) {
    try {
      console.log("Creating new gym:", gymData.name);

      const response = await fetch(GYMS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "createGym",
          data: gymData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create gym: ${response.status}`);
      }

      const result = await response.json();
      console.log("Gym created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating gym:", error);
      throw error;
    }
  }

  // Update a gym
  static async updateGym(gymId, updateData) {
    try {
      console.log(`Updating gym: ${gymId}`);

      const response = await fetch(`${GYMS_API_URL}?gymId=${gymId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update gym: ${response.status}`);
      }

      const result = await response.json();
      console.log("Gym updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating gym:", error);
      throw error;
    }
  }

  // Delete a gym
  static async deleteGym(gymId) {
    try {
      console.log(`Deleting gym: ${gymId}`);

      const response = await fetch(`${GYMS_API_URL}?gymId=${gymId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete gym: ${response.status}`);
      }

      const result = await response.json();
      console.log("Gym deleted successfully:", result);
      return result;
    } catch (error) {
      console.error("Error deleting gym:", error);
      throw error;
    }
  }

  // Migrate local gym data to Firestore
  static async migrateLocalData(gyms) {
    try {
      console.log(`Migrating ${gyms.length} gyms to Firestore...`);

      const response = await fetch(GYMS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "migrateLocalData",
          gyms: gyms,
        }),
      });

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("Migration completed:", result);
      return result.summary;
    } catch (error) {
      console.error("Error during migration:", error);
      throw error;
    }
  }

  // Get available amenities (for filtering)
  static async getAmenities() {
    try {
      const gyms = await this.getAllGyms();
      const amenitiesSet = new Set();

      gyms.forEach((gym) => {
        if (gym.amenities && Array.isArray(gym.amenities)) {
          gym.amenities.forEach((amenity) => amenitiesSet.add(amenity));
        }
      });

      return Array.from(amenitiesSet).sort();
    } catch (error) {
      console.error("Error fetching amenities:", error);
      throw error;
    }
  }

  // Get price ranges (for filtering)
  static getPriceRanges() {
    return [
      { label: "Under £50", value: "0-50" },
      { label: "£50 - £75", value: "50-75" },
      { label: "£75 - £100", value: "75-100" },
      { label: "Over £100", value: "100-999" },
    ];
  }
}

export default GymsService;
