// frontend-app/src/pages/AppointmentListPage.js

import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../AuthContext"; // To get the logged-in user's UID
import { PatientService } from "../services/patientService"; // Use PatientService to fetch appointments

const AppointmentListPage = () => {
  // Destructure from AuthContext
  const { currentUser, loading: authLoading } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Function to fetch appointments (re-usable)
  const fetchAppointments = useCallback(async () => {
    // Wait until auth status is known and currentUser is loaded
    if (authLoading) return;

    setLoading(true);
    setError("");
    setSuccessMessage(""); // Clear messages on new fetch

    if (!currentUser) {
      setError("Please log in to view your appointments.");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching appointments for patient:", currentUser.uid);

      // Use PatientService to get appointments from Firestore
      const appointmentsData = await PatientService.getPatientAppointments(
        currentUser.uid
      );

      console.log("Retrieved appointments:", appointmentsData);
      setAppointments(appointmentsData || []);

      if (!appointmentsData || appointmentsData.length === 0) {
        setError("You have no booked appointments.");
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(
        err.message ||
          "An unexpected error occurred while fetching appointments."
      );
    } finally {
      setLoading(false);
    }
  }, [authLoading, currentUser]);

  // Effect to fetch appointments on component mount and when currentUser/authLoading changes
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]); // Now fetchAppointments is stable due to useCallback

  // New function to handle appointment cancellation
  const handleCancelAppointment = async (appointmentId) => {
    setLoading(true); // Show loading feedback
    setError("");
    setSuccessMessage("");

    if (!currentUser) {
      setError("You must be logged in to cancel an appointment.");
      setLoading(false);
      return;
    }

    try {
      // For now, just show a message that cancellation is not implemented yet
      // TODO: Implement proper cancellation with backend support
      setError(
        "Appointment cancellation feature is coming soon. Please contact the clinic directly."
      );

      // Refresh the list of appointments
      await fetchAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      setError(
        err.message ||
          "An unexpected error occurred while cancelling the appointment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">My Appointments</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            View and manage your upcoming medical appointments
          </p>
          <div className="flex justify-center items-center mt-8 space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">
                {appointments.length}
              </div>
              <div className="text-blue-100">Appointments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Success Alert */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <p className="font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Loading States */}
          {authLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Checking login status...
              </span>
            </div>
          ) : !currentUser ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-8 rounded-xl text-center shadow-sm">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-2">Login Required</h3>
              <p>Please log in to view your appointments.</p>
            </div>
          ) : loading && appointments.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">
                Loading your appointments...
              </span>
            </div>
          ) : error && appointments.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-8 rounded-xl text-center shadow-sm">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">
                No Appointments Yet
              </h3>
              <p>{error}</p>
              <button
                onClick={() => (window.location.href = "/book-appointment")}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Your First Appointment
              </button>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-700 px-6 py-8 rounded-xl text-center shadow-sm">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">No Appointments</h3>
              <p>You have no booked appointments.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {appointments.map((appointment, index) => (
                <div
                  key={
                    appointment.bookingId ||
                    appointment.id ||
                    `booking-${index}`
                  }
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Appointment Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">
                          {appointment.doctorName ||
                            appointment.doctor ||
                            "Doctor Appointment"}
                        </h3>
                        <p className="text-blue-100 text-lg">
                          {appointment.specialty || "General Consultation"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            appointment.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {appointment.status || "Confirmed"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Date & Time */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-lg">📅</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">
                              Date
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {appointment.date || appointment.appointmentDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 text-lg">⏰</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">
                              Time
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {appointment.time || appointment.appointmentTime}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Location & Details */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-lg">📍</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">
                              Location
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {appointment.place ||
                                appointment.location ||
                                "Healthcare Center"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-lg">📋</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">
                              Booked
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              {new Date(
                                appointment.createdAt ||
                                  appointment.created_at ||
                                  Date.now()
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() =>
                          handleCancelAppointment(
                            appointment.bookingId || appointment.id
                          )
                        }
                        disabled={loading || appointment.status === "cancelled"}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          appointment.status === "cancelled"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        }`}
                      >
                        {appointment.status === "cancelled"
                          ? "Cancelled"
                          : "Cancel Appointment"}
                      </button>
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Reschedule
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AppointmentListPage;
