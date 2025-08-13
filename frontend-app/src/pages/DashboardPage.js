// frontend-app/src/pages/DashboardPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useAuth } from '../AuthContext'; // Import useAuth to get user data and logout function
import { signOut } from 'firebase/auth'; // Import signOut from firebase/auth
import { auth } from '../firebaseConfig'; // Import your Firebase auth instance

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { currentUser } = useAuth(); // Get currentUser from AuthContext
  const navigate = useNavigate(); // Use useNavigate hook

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      navigate('/'); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout error:", error);
      // Optionally, set an error state to display to the user
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200"> {/* Using Tailwind colors */}
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl text-white shadow-md"
                style={{ backgroundColor: "#5B73FF" }}
              >
                👤
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentUser ? `${currentUser.email.split('@')[0]}` : 'Patient Name'} {/* Display user email part */}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm"> {/* Added text-sm */}
                  <span>📧 {currentUser ? currentUser.email : 'patient.email@example.com'}</span>
                  <span>📱 +1 (555) 123-4567</span> {/* Placeholder */}
                  <span>🎂 March 15, 1985</span> {/* Placeholder */}
                </div>
              </div>
            </div>
            
          </div>

          {/* Emergency Info Card */}
          <div
            className="mt-6 p-4 rounded-2xl border-2 border-dashed"
            style={{
              borderColor: "#FF4D4F",
              backgroundColor: "rgba(255, 77, 79, 0.05)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚨</span>
              <h3 className="font-bold text-gray-900">
                Emergency Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700"> {/* Added text-sm */}
              <div>
                <strong>Allergies:</strong> Penicillin, Shellfish, Pollen
              </div>
              <div>
                <strong>Conditions:</strong> Type 2 Diabetes, Hypertension
              </div>
              <div>
                <strong>Emergency Contact:</strong> Michael Johnson - +1 (555)
                987-6543
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Overview", icon: "👤" },
              { id: "medical", label: "Medical Info", icon: "🏥" },
              { id: "appointments", label: "Appointments", icon: "📅" },
              { id: "tests", label: "Test Results", icon: "🔬" },
              { id: "metrics", label: "Health Metrics", icon: "📊" },
              { id: "insurance", label: "Insurance", icon: "💳" },
              { id: "documents", label: "Documents", icon: "📄" },
              { id: "settings", label: "Settings", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? "text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={{
                  backgroundColor:
                    activeTab === tab.id ? "#5B73FF" : "transparent",
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Profile Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Full Name:</span>
                      <span className="font-medium text-gray-900">
                        Emily Johnson
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="font-medium text-gray-900">
                        March 15, 1985
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium text-gray-900">
                        Female
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">
                        {currentUser ? currentUser.email : 'emily.johnson@email.com'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">
                        +1 (555) 123-4567
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Health Summary */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Health Summary
                  </h3>
                  <div className="space-y-4">
                    <div
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: "rgba(91, 115, 255, 0.1)" }}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Current Conditions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: "rgba(255, 159, 67, 0.2)",
                            color: "#FF9F43",
                          }}
                        >
                          Type 2 Diabetes
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: "rgba(255, 159, 67, 0.2)",
                            color: "#FF9F43",
                          }}
                        >
                          Hypertension
                        </span>
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: "rgba(0, 176, 116, 0.1)" }}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Next Appointment
                      </h4>
                      <p className="text-gray-600">
                        August 15, 2025 at 10:00 AM
                        <br />
                        <span className="font-medium">Dr. Sarah Smith</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "medical" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Medical Information
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    🏥 Chronic Conditions
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-gray-100 border border-gray-200">
                      <span className="font-medium text-gray-900">
                        Type 2 Diabetes
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-100 border border-gray-200">
                      <span className="font-medium text-gray-900">
                        Hypertension
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    ⚠️ Allergies
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-gray-100 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Penicillin
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                          Severe
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Medication Allergy
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-100 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Shellfish
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
                          Moderate
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Food Allergy
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-100 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Pollen
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                          Mild
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Environmental Allergy
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  💊 Current Medications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">
                        Metformin
                      </span>
                      <span className="text-sm text-gray-600">500mg</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Twice daily, with meals
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      For Type 2 Diabetes
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">
                        Lisinopril
                      </span>
                      <span className="text-sm text-gray-600">10mg</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Once daily, morning
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      For Hypertension
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appointments" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Appointments
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Appointments */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    📅 Upcoming
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Regular Check-up
                          </h4>
                          <p className="text-sm text-gray-600">
                            Dr. Sarah Smith
                          </p>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          Aug 15, 2025
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        10:00 AM - 11:00 AM
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Blood Work Follow-up
                          </h4>
                          <p className="text-sm text-gray-600">
                            Dr. Michael Chen
                          </p>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          Aug 22, 2025
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        2:00 PM - 2:30 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Appointments */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    📋 Recent
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Annual Physical
                          </h4>
                          <p className="text-sm text-gray-600">
                            Dr. Sarah Smith
                          </p>
                        </div>
                        <span className="text-sm text-gray-600">
                          July 10, 2025
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Completed ✓</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tests" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Test Results & Reports
              </h2>

              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Blood Panel - Comprehensive
                      </h3>
                      <p className="text-sm text-gray-600">July 10, 2025</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Normal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">HbA1c</p>
                      <p className="font-medium text-gray-900">6.8%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cholesterol</p>
                      <p className="font-medium text-gray-900">180 mg/dL</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Blood Pressure
                      </p>
                      <p className="font-medium text-gray-900">
                        130/85 mmHg
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-gray-200 bg-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Chest X-Ray
                      </h3>
                      <p className="text-sm text-gray-600">June 15, 2025</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Clear
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    No abnormalities detected. Lungs appear clear and healthy.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "metrics" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Health Metrics
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vital Signs */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    📊 Current Vitals
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Blood Pressure
                        </span>
                        <span className="text-lg font-bold text-red-600">
                          130/85
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        mmHg - Last measured: Today
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Heart Rate
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          72
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        bpm - Last measured: Today
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Weight
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          165
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        lbs - Last measured: July 10
                      </p>
                    </div>
                  </div>
                </div>

                {/* Health Goals */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    🎯 Health Goals
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">
                          Daily Steps
                        </span>
                        <span className="text-sm text-gray-600">
                          7,500 / 10,000
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: "75%" }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">
                          Target Weight
                        </span>
                        <span className="text-sm text-gray-600">
                          165 / 160 lbs
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: "90%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "insurance" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Insurance & Billing
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Insurance Information */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    💳 Insurance Details
                  </h3>
                  <div className="p-6 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Provider:</span>
                        <span className="font-medium text-gray-900">
                          Blue Cross Blue Shield
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Policy Number:
                        </span>
                        <span className="font-medium text-gray-900">
                          BCBS-123456789
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Group Number:</span>
                        <span className="font-medium text-gray-900">
                          GRP-987654
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Effective Date:
                        </span>
                        <span className="font-medium text-gray-900">
                          January 1, 2025
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Bills */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    🧾 Recent Bills
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            Annual Physical
                          </p>
                          <p className="text-sm text-gray-600">
                            July 10, 2025
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">$0.00</p>
                          <p className="text-xs text-gray-600">Covered</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            Blood Work
                          </p>
                          <p className="text-sm text-gray-600">
                            July 10, 2025
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-orange-600">$25.00</p>
                          <p className="text-xs text-gray-600">Copay</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Documents & Files
              </h2>

              <div className="space-y-6">
                {/* Document Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Medical Records
                    </h3>
                    <p className="text-sm text-gray-600">3 files</p>
                  </div>

                  <div className="p-6 rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 text-center">
                    <div className="text-4xl mb-3">🔬</div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Lab Results
                    </h3>
                    <p className="text-sm text-gray-600">5 files</p>
                  </div>

                  <div className="p-6 rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-violet-50 text-center">
                    <div className="text-4xl mb-3">💳</div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Insurance
                    </h3>
                    <p className="text-sm text-gray-600">2 files</p>
                  </div>
                </div>

                {/* Recent Documents */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    📄 Recent Documents
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            Annual Physical Report
                          </p>
                          <p className="text-sm text-gray-600">
                            Uploaded July 10, 2025
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                        View
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔬</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            Blood Panel Results
                          </p>
                          <p className="text-sm text-gray-600">
                            Uploaded July 10, 2025
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Account Settings
              </h2>
              <div className="space-y-6">
                {/* Profile Settings */}
                <div className="p-6 rounded-xl border border-gray-200 bg-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Profile Settings
                  </h3>
                  <form className="space-y-4">
                    <div>
                      <label
                        htmlFor="profile-email"
                        className="block text-gray-700 text-sm font-bold mb-2"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="profile-email"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={currentUser ? currentUser.email : 'emily.johnson@email.com'}
                        readOnly
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-phone"
                        className="block text-gray-700 text-sm font-bold mb-2"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="profile-phone"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value="+1 (555) 123-4567" // Placeholder
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                    >
                      Save Profile
                    </button>
                  </form>
                </div>

                {/* Password Settings */}
                <div className="p-6 rounded-xl border border-gray-200 bg-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Change Password
                  </h3>
                  <form className="space-y-4">
                    <div>
                      <label
                        htmlFor="current-password"
                        className="block text-gray-700 text-sm font-bold mb-2"
                      >
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="current-password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-gray-700 text-sm font-bold mb-2"
                      >
                        New Password
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirm-new-password"
                        className="block text-gray-700 text-sm font-bold mb-2"
                      >
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirm-new-password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                    >
                      Change Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for unhandled tabs */}
          {activeTab !== "overview" &&
            activeTab !== "medical" &&
            activeTab !== "appointments" &&
            activeTab !== "tests" &&
            activeTab !== "metrics" &&
            activeTab !== "insurance" &&
            activeTab !== "documents" &&
            activeTab !== "settings" && (
              <div className="text-center text-gray-600 py-10">
                <p>Content for "{activeTab}" tab is coming soon!</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
