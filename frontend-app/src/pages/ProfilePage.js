// frontend-app/src/pages/ProfilePage.js
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { PatientService } from "../services/patientService";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch patient profile data on component mount
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const profileData = await PatientService.getPatientProfile(
          currentUser.uid
        );
        console.log("Fetched patient profile:", profileData);

        setPatientData(profileData);
      } catch (err) {
        console.error("Error fetching patient profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Helper function to get display value with fallback
  const getDisplayValue = (value, fallback = "Not provided") => {
    return value && value !== "" ? value : fallback;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {patientData?.name && patientData?.surname
                        ? `${patientData.name} ${patientData.surname}`
                        : currentUser
                        ? currentUser.email.split("@")[0]
                        : "Patient"}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                      <span>
                        📧 {currentUser ? currentUser.email : "No email"}
                      </span>
                      <span>
                        📱{" "}
                        {getDisplayValue(
                          patientData?.phoneNumber,
                          "+1 (555) 123-4567"
                        )}
                      </span>
                      <span>
                        🎂{" "}
                        {getDisplayValue(
                          patientData?.dateOfBirth,
                          "Not provided"
                        )}
                      </span>
                      <span>
                        👤{" "}
                        {getDisplayValue(patientData?.gender, "Not specified")}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/appointments"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md"
              >
                📅 View Appointments
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md"
              >
                🚪 Logout
              </button>
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
              <h3 className="font-bold text-gray-900">Emergency Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <strong>Allergies:</strong>{" "}
                {getDisplayValue(patientData?.allergies, "None reported")}
              </div>
              <div>
                <strong>Medical Conditions:</strong>{" "}
                {getDisplayValue(
                  patientData?.medicalConditions,
                  "None reported"
                )}
              </div>
              <div>
                <strong>Emergency Contact:</strong>{" "}
                {getDisplayValue(
                  patientData?.emergencyContactName &&
                    patientData?.emergencyContactPhone
                    ? `${patientData.emergencyContactName} - ${patientData.emergencyContactPhone}`
                    : null,
                  "Not provided"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Profile Overview", icon: "👤" },
              { id: "medical", label: "Medical Info", icon: "🏥" },
              { id: "appointments", label: "Appointments", icon: "📅" },
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Profile Overview
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
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
                          {patientData?.name && patientData?.surname
                            ? `${patientData.name} ${patientData.surname}`
                            : getDisplayValue(null, "Not provided")}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(patientData?.dateOfBirth)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(patientData?.gender)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">
                          {currentUser ? currentUser.email : "No email"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(patientData?.phoneNumber)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium text-gray-900">
                          {patientData?.address && patientData?.city
                            ? `${patientData.address}, ${patientData.city}${
                                patientData.postcode
                                  ? ` ${patientData.postcode}`
                                  : ""
                              }`
                            : getDisplayValue(null, "Not provided")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Medical Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Blood Type:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(patientData?.bloodType)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Allergies:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(
                            patientData?.allergies,
                            "None reported"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">
                          Medical Conditions:
                        </span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(
                            patientData?.medicalConditions,
                            "None reported"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Medications:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(
                            patientData?.currentMedications,
                            "None reported"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">
                          Insurance Provider:
                        </span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(patientData?.insuranceProvider)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Insurance Policy:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(patientData?.insurancePolicyNumber)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Emergency Contact
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Contact Name:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(patientData?.emergencyContactName)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Relationship:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(
                            patientData?.emergencyContactRelationship
                          )}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Phone Number:</span>
                        <span className="font-medium text-gray-900">
                          {getDisplayValue(patientData?.emergencyContactPhone)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <Link
                  to="/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  ✏️ Edit Profile
                </Link>
                <Link
                  to="/book-appointment"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  📅 Book Appointment
                </Link>
              </div>
            </div>
          )}

          {activeTab === "medical" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Medical Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    Current Medications
                  </h3>
                  <p className="text-blue-800">
                    {getDisplayValue(
                      patientData?.currentMedications,
                      "No medications reported"
                    )}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">
                    Allergies
                  </h3>
                  <p className="text-red-800">
                    {getDisplayValue(
                      patientData?.allergies,
                      "No allergies reported"
                    )}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                    Medical Conditions
                  </h3>
                  <p className="text-yellow-800">
                    {getDisplayValue(
                      patientData?.medicalConditions,
                      "No conditions reported"
                    )}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">
                    Blood Type
                  </h3>
                  <p className="text-green-800 text-2xl font-bold">
                    {getDisplayValue(patientData?.bloodType, "Unknown")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appointments" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Appointments
              </h2>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  View Your Appointments
                </h3>
                <p className="text-gray-600 mb-6">
                  Check your upcoming and past appointments
                </p>
                <Link
                  to="/appointments"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Go to Appointments
                </Link>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Account Settings
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Profile Settings
                  </h3>
                  <div className="space-y-3">
                    <Link
                      to="/register"
                      className="block w-full text-left bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      ✏️ Edit Personal Information
                    </Link>
                    <button className="block w-full text-left bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                      🔔 Notification Preferences
                    </button>
                    <button className="block w-full text-left bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                      🔒 Privacy Settings
                    </button>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">
                    Account Actions
                  </h3>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
