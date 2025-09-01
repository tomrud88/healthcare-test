// src/hooks/useDoctors.js
import { useState, useEffect } from "react";
import { DoctorsService } from "../services/doctorsService";
import { doctors as localDoctors } from "../data/doctors";

// Configuration to switch between local data and Firestore
const USE_FIRESTORE = process.env.REACT_APP_USE_FIRESTORE === "true";

export const useDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_FIRESTORE) {
        // Fetch from Firestore
        const firestoreDoctors = await DoctorsService.getAllDoctors();
        setDoctors(firestoreDoctors);
      } else {
        // Use local data
        setDoctors(localDoctors);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setError(error.message);
      // Fallback to local data if Firestore fails
      if (USE_FIRESTORE) {
        console.log("Falling back to local data...");
        setDoctors(localDoctors);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return { doctors, loading, error, refetch: fetchDoctors };
};

export const useDoctorsBySpecialty = (specialty) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!specialty || specialty === "All") {
        setDoctors([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (USE_FIRESTORE) {
          // Fetch from Firestore
          const firestoreDoctors = await DoctorsService.getDoctorsBySpecialty(
            specialty
          );
          setDoctors(firestoreDoctors);
        } else {
          // Filter local data
          const filteredDoctors = localDoctors.filter(
            (doctor) => doctor.specialty === specialty
          );
          setDoctors(filteredDoctors);
        }
      } catch (error) {
        console.error("Error fetching doctors by specialty:", error);
        setError(error.message);
        // Fallback to local data if Firestore fails
        if (USE_FIRESTORE) {
          console.log("Falling back to local data...");
          const filteredDoctors = localDoctors.filter(
            (doctor) => doctor.specialty === specialty
          );
          setDoctors(filteredDoctors);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [specialty]);

  return { doctors, loading, error };
};

export const useDoctorsByFilters = (specialty, city) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_FIRESTORE) {
          // Fetch from Firestore with filters
          const firestoreDoctors =
            await DoctorsService.getDoctorsBySpecialtyAndCity(specialty, city);
          setDoctors(firestoreDoctors);
        } else {
          // Filter local data
          const filteredDoctors = localDoctors.filter((doctor) => {
            const matchesSpecialty =
              specialty === "All" || doctor.specialty === specialty;
            const matchesCity = city === "All" || doctor.city === city;
            return matchesSpecialty && matchesCity;
          });
          setDoctors(filteredDoctors);
        }
      } catch (error) {
        console.error("Error fetching doctors with filters:", error);
        setError(error.message);
        // Fallback to local data if Firestore fails
        if (USE_FIRESTORE) {
          console.log("Falling back to local data...");
          const filteredDoctors = localDoctors.filter((doctor) => {
            const matchesSpecialty =
              specialty === "All" || doctor.specialty === specialty;
            const matchesCity = city === "All" || doctor.city === city;
            return matchesSpecialty && matchesCity;
          });
          setDoctors(filteredDoctors);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [specialty, city]);

  return { doctors, loading, error };
};

export const useSpecialties = () => {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpecialties = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_FIRESTORE) {
          // Fetch from Firestore
          const firestoreSpecialties = await DoctorsService.getSpecialties();
          setSpecialties(["All", ...firestoreSpecialties]);
        } else {
          // Use local data
          const localSpecialties = [
            ...new Set(localDoctors.map((doctor) => doctor.specialty)),
          ];
          setSpecialties(["All", ...localSpecialties.sort()]);
        }
      } catch (error) {
        console.error("Error fetching specialties:", error);
        setError(error.message);
        // Fallback to local data if Firestore fails
        if (USE_FIRESTORE) {
          console.log("Falling back to local data...");
          const localSpecialties = [
            ...new Set(localDoctors.map((doctor) => doctor.specialty)),
          ];
          setSpecialties(["All", ...localSpecialties.sort()]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  return { specialties, loading, error };
};

export const useCities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_FIRESTORE) {
          // Fetch from Firestore
          const firestoreCities = await DoctorsService.getCities();
          setCities(["All", ...firestoreCities]);
        } else {
          // Use local data
          const localCities = [
            ...new Set(localDoctors.map((doctor) => doctor.city)),
          ];
          setCities(["All", ...localCities.sort()]);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setError(error.message);
        // Fallback to local data if Firestore fails
        if (USE_FIRESTORE) {
          console.log("Falling back to local data...");
          const localCities = [
            ...new Set(localDoctors.map((doctor) => doctor.city)),
          ];
          setCities(["All", ...localCities.sort()]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  return { cities, loading, error };
};

export default useDoctors;
