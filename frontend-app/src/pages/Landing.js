// src/pages/Landing.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Use Link for internal navigation
import { DoctorsService } from "../services/doctorsService"; // Use dynamic service instead of static data
import DoctorCard from "../components/DoctorCard"; // Re-using your DoctorCard component
import PersonalizedContentDemo from "../components/PersonalizedContentDemo"; // Re-using your PersonalizedContentDemo component

export default function Landing() {
  // State for managing doctors data and loading
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch doctors data on component mount
  useEffect(() => {
    const fetchTopDoctors = async () => {
      try {
        setLoading(true);
        const allDoctors = await DoctorsService.getAllDoctors();
        // Get the first 4 doctors for the "Our Top Rated Doctors" section
        setTopDoctors(allDoctors.slice(0, 4));
        setError(null);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctors. Please try again later.");
        setTopDoctors([]); // Set empty array as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchTopDoctors();
  }, []);

  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* Hero Section */}
      <section className="text-center py-16 bg-blue-50 relative overflow-hidden">
        <div className="relative container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Hero Content */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-sm text-blue-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Now Available - Next Generation Healthcare
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
                Complete Healthcare
                <span className="block text-blue-600">Management</span>
                at Your Fingertips
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl lg:max-w-none mx-auto lg:mx-0 mb-8 leading-relaxed">
                Experience the future of healthcare with NextGen HealthCare. Connect
                with 16+ specialists across 7 UK cities, from real-time
                scheduling and digital check-ins to personalized health
                education and AI-powered medical insights.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-12">
                <Link
                  to="/book-appointment"
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 transition-colors duration-300 shadow-md hover:shadow-lg font-semibold no-underline"
                >
                  Get Started
                </Link>
                <button className="border border-blue-600 text-blue-600 px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors duration-300 shadow-md hover:shadow-lg font-semibold">
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-md mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold mb-1 text-blue-600">
                    2k+
                  </div>
                  <div className="text-gray-600 text-sm">Happy Patients</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold mb-1 text-blue-600">
                    16+
                  </div>
                  <div className="text-gray-600 text-sm">Expert Doctors</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold mb-1 text-blue-600">7</div>
                  <div className="text-gray-600 text-sm">UK Cities</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div
              className="relative flex justify-center lg:justify-end animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="relative">
                {/* Background decorative elements */}
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-blue-200/50 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-green-200/50 rounded-full blur-2xl"></div>

                {/* Main image container */}
                <div className="relative bg-white p-6 rounded-3xl shadow-lg border border-gray-200 backdrop-blur-sm">
                  <img
                    src="/images/ai-doctor-hero.webp"
                    alt="NextGen Doctor - AI-Enhanced Healthcare Professional"
                    className="w-80 h-auto rounded-2xl shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />
                  {/* Fallback placeholder */}
                  <div
                    className="hidden w-80 h-96 rounded-2xl items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(91, 115, 255, 0.2) 0%, rgba(68, 92, 224, 0.3) 100%)",
                      color: "#5B73FF",
                    }}
                  >
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">👩‍⚕️</div>
                      <div className="text-xl font-semibold">
                        NextGen Doctor
                      </div>
                      <div className="text-sm opacity-75 mt-2">
                        AI-Enhanced Healthcare
                      </div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <div
                    className="absolute -top-4 -right-4 text-white px-4 py-2 rounded-2xl text-sm font-semibold shadow-md animate-float"
                    style={{ backgroundColor: "#00B074" }}
                  >
                    ✓ AI-Powered
                  </div>
                  <div
                    className="absolute -bottom-4 -left-4 text-white px-4 py-2 rounded-2xl text-sm font-semibold shadow-md animate-float"
                    style={{ animationDelay: "1s", backgroundColor: "#5B73FF" }}
                  >
                    🔬 Advanced Care
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Revolutionary Healthcare Features
            </h2>
            <p className="text-lg text-gray-600">
              Discover how our advanced technology transforms your healthcare
              experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card 1 */}
            <div
              className="group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 border border-gray-200 animate-fade-in"
              style={{ animationDelay: "0ms" }}
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner-glow group-hover:scale-110 transition-transform duration-300">
                  📅
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-600 transition-colors">
                  Real-time Scheduling
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Book appointments based on your preferred location and
                  specific medical services with instant availability updates.
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                }}
              ></div>
            </div>

            {/* Feature Card 2 */}
            <div
              className="group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 border border-gray-200 animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner-glow group-hover:scale-110 transition-transform duration-300">
                  🔔
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-600 transition-colors">
                  Pre-Visit Reminders
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Receive personalized appointment reminders with preparation
                  instructions tailored to your visit type.
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                }}
              ></div>
            </div>

            {/* Feature Card 3 */}
            <div
              className="group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 border border-gray-200 animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner-glow group-hover:scale-110 transition-transform duration-300">
                  💬
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-600 transition-colors">
                  Real-time Communication
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect instantly with healthcare providers through secure
                  messaging and video consultations.
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                }}
              ></div>
            </div>

            {/* Feature Card 4 */}
            <div
              className="group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 border border-gray-200 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner-glow group-hover:scale-110 transition-transform duration-300">
                  📱
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-600 transition-colors">
                  Digital Check-in
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Skip the waiting room lines - scan QR codes or enter details
                  through our dedicated web application.
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                }}
              ></div>
            </div>

            {/* Feature Card 5 */}
            <div
              className="group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 border border-gray-200 animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner-glow group-hover:scale-110 transition-transform duration-300">
                  📚
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-600 transition-colors">
                  Personalized Health Education
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Access customized health materials and follow-up content based
                  on your specific medical conditions.
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                }}
              ></div>
            </div>

            {/* Feature Card 6 */}
            <div
              className="group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 border border-gray-200 animate-fade-in"
              style={{ animationDelay: "500ms" }}
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-cyan-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner-glow group-hover:scale-110 transition-transform duration-300">
                  💊
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-600 transition-colors">
                  E-Prescribing
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Receive digital prescriptions sent directly to your preferred
                  pharmacy with automatic refill reminders.
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                }}
              ></div>
            </div>

            {/* Feature Card 7 */}
            <div
              className="group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 border border-gray-200 animate-fade-in"
              style={{ animationDelay: "600ms" }}
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-violet-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner-glow group-hover:scale-110 transition-transform duration-300">
                  🔬
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-600 transition-colors">
                  Test Results & Images
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  View your lab results and medical images with AI-powered
                  summaries that explain complex terminology clearly.
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                }}
              ></div>
            </div>

            {/* Feature Card 8 */}
            <div
              className="group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 border border-gray-200 animate-fade-in"
              style={{ animationDelay: "700ms" }}
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner-glow group-hover:scale-110 transition-transform duration-300">
                  🏥
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-blue-600 transition-colors">
                  Find Nearby Doctors
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Locate trusted healthcare providers in your area with detailed
                  profiles and patient reviews.
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Health Education Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6 animate-fade-in">
          <PersonalizedContentDemo /> {/* Re-using the existing component */}
        </div>
      </section>

      {/* AI-Powered Test Results Demo Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">
            AI-Powered Test Results Summary
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Complex medical data made simple with artificial intelligence
          </p>
          <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-200 p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-blue-600">
                    📋
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Medical Report
                  </h3>
                </div>
                <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200">
                  <div className="space-y-4 text-gray-600">
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                      <span className="font-medium">Hemoglobin A1C:</span>
                      <span className="font-bold text-yellow-500">7.2%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                      <span className="font-medium">Fasting Glucose:</span>
                      <span className="font-bold text-yellow-500">
                        145 mg/dL
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                      <span className="font-medium">Total Cholesterol:</span>
                      <span className="font-bold text-yellow-500">
                        210 mg/dL
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                      <span className="font-medium">Blood Pressure:</span>
                      <span className="font-bold text-yellow-500">
                        135/85 mmHg
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-blue-600">
                    🤖
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    AI Summary
                  </h3>
                </div>
                <div className="bg-blue-100 p-6 rounded-2xl border border-blue-200">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-white/70 rounded-xl">
                      <div className="text-2xl">📊</div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          What this means:
                        </p>
                        <p className="text-gray-600">
                          Your blood sugar levels are slightly elevated,
                          indicating pre-diabetes.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-white/70 rounded-xl">
                      <div className="text-2xl">💡</div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Next steps:
                        </p>
                        <p className="text-gray-600">
                          Consider dietary changes and regular exercise to
                          manage glucose levels.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-white/70 rounded-xl">
                      <div className="text-2xl">👨‍⚕️</div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Follow-up:
                        </p>
                        <p className="text-gray-600">
                          Schedule a consultation with your doctor to discuss a
                          management plan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6 animate-fade-in">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Our Top Rated Doctors Across the UK
            </h2>
            <p className="text-lg text-gray-600">
              Meet our exceptional healthcare professionals spanning 7 cities
              with expertise in 6 specialties
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              // Loading state
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`loading-${index}`} className="animate-pulse">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="col-span-full text-center py-8">
                <div className="text-red-600 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
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
                <p className="text-gray-600">{error}</p>
              </div>
            ) : topDoctors.length === 0 ? (
              // No doctors found
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600">
                  No doctors available at the moment.
                </p>
              </div>
            ) : (
              // Success state - show doctors
              topDoctors.map((doctor, index) => (
                <div
                  key={doctor.id}
                  className="animate-fade-in" // Keeping animation for now
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <DoctorCard doctor={doctor} />
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/doctors"
              className="inline-block px-8 py-4 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 no-underline"
            >
              View All Doctors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
