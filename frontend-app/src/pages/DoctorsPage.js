// src/pages/DoctorsPage.js
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DoctorsService } from "../services/doctorsService"; // Use dynamic service instead of static data
import DoctorCard from "../components/DoctorCard";

export default function DoctorsPage() {
  const location = useLocation();
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");

  // State for doctors data
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch doctors data on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const allDoctors = await DoctorsService.getAllDoctors();
        setDoctors(allDoctors);
        setError(null);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctors. Please try again later.");
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Handle pre-selected specialty from Services page
  useEffect(() => {
    const preSelectedSpecialty = location.state?.selectedSpecialty;
    if (preSelectedSpecialty) {
      setSelectedSpecialty(preSelectedSpecialty);
    }
  }, [location.state?.selectedSpecialty]);

  // Get unique specialties and cities
  const specialties = [
    "All",
    ...new Set(doctors.map((doctor) => doctor.specialty)),
  ];
  const cities = ["All", ...new Set(doctors.map((doctor) => doctor.city))];

  // Filter doctors based on selected specialty and city
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSpecialty =
      selectedSpecialty === "All" || doctor.specialty === selectedSpecialty;
    const matchesCity = selectedCity === "All" || doctor.city === selectedCity;
    return matchesSpecialty && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Our Healthcare Specialists
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect with 16 expert doctors across 7 UK cities, specializing in
            comprehensive healthcare from general practice to specialized
            treatments including cardiology and neurology.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">16</div>
              <div className="text-blue-100">Expert Doctors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">7</div>
              <div className="text-blue-100">UK Cities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">6</div>
              <div className="text-blue-100">Specialties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">4.8★</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-12 bg-white shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Filter by Specialty
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-48"
              >
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Filter by City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-48"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={() => {
                  setSelectedSpecialty("All");
                  setSelectedCity("All");
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Count */}
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-600">
            Showing {filteredDoctors.length} of {doctors.length} doctors
            {selectedSpecialty !== "All" && ` in ${selectedSpecialty}`}
            {selectedCity !== "All" && ` in ${selectedCity}`}
          </div>
        </div>
      </section>

      {/* Doctors Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          {loading ? (
            // Loading state
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`loading-${index}`} className="animate-pulse">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-16">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 19c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Unable to load doctors
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredDoctors.map((doctor, index) => (
                <div
                  key={doctor.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <DoctorCard doctor={doctor} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No doctors found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters to see more results.
              </p>
              <button
                onClick={() => {
                  setSelectedSpecialty("All");
                  setSelectedCity("All");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* City Coverage Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              UK-Wide Coverage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our healthcare network spans major cities across the United
              Kingdom
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {cities
              .filter((city) => city !== "All")
              .map((city) => {
                const cityDoctors = doctors.filter(
                  (doctor) => doctor.city === city
                );
                return (
                  <div
                    key={city}
                    className="text-center p-6 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {cityDoctors.length}
                    </div>
                    <div className="text-gray-800 font-medium mb-1">{city}</div>
                    <div className="text-sm text-gray-600">doctors</div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>
    </div>
  );
}
