// frontend-app/src/pages/AppointmentBookingPage.js
import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { doctors } from "../data/doctors";
import CustomCalendar from "../components/CustomCalendar";

function AppointmentBookingPage() {
  // Get location state for pre-selected doctor
  const location = useLocation();
  const preSelectedDoctor = location.state?.selectedDoctor;

  // Destructure from AuthContext
  // Destructure from AuthContext
  const { currentUser, loading: authLoading } = useContext(AuthContext);

  // State for form inputs
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [notes, setNotes] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Ref for date input container
  const dateInputRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dateInputRef.current &&
        !dateInputRef.current.contains(event.target)
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle pre-selected doctor from navigation
  useEffect(() => {
    if (preSelectedDoctor) {
      setSelectedSpecialty(preSelectedDoctor.specialty);
      setSelectedDoctor(preSelectedDoctor);
    }
  }, [preSelectedDoctor]);

  // Handle pre-selected specialty from Services page
  useEffect(() => {
    const preSelectedSpecialty = location.state?.selectedSpecialty;
    if (preSelectedSpecialty && !preSelectedDoctor) {
      setSelectedSpecialty(preSelectedSpecialty);
    }
  }, [location.state?.selectedSpecialty, preSelectedDoctor]);

  // Get unique specialties from doctors data
  const specialties = [...new Set(doctors.map((doctor) => doctor.specialty))];

  // Filter doctors based on selected specialty and date availability
  const getAvailableDoctors = () => {
    if (!selectedSpecialty || !selectedDate) return [];

    return doctors.filter((doctor) => {
      const matchesSpecialty = doctor.specialty === selectedSpecialty;
      const hasAvailability =
        doctor.availability && doctor.availability[selectedDate];
      return matchesSpecialty && hasAvailability;
    });
  };

  const availableDoctors = getAvailableDoctors();

  // State for UI feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // No longer need to fetch slots from backend - using doctor availability data directly

  // Function to handle appointment booking submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!currentUser) {
      setError("You must be logged in to book an appointment.");
      setLoading(false);
      return;
    }

    if (
      !selectedDate ||
      !selectedTime ||
      !selectedSpecialty ||
      !selectedDoctor
    ) {
      setError("Please select a date, time, specialty, and doctor.");
      setLoading(false);
      return;
    }

    try {
      // Simulate booking process - in a real app this would call your booking API
      const appointmentData = {
        patientId: currentUser.uid,
        patientEmail: currentUser.email,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        clinic: selectedDoctor.clinic,
        city: selectedDoctor.city,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        specialty: selectedSpecialty,
        notes: notes,
      };

      // For now, we'll just show success - in production you'd call your booking API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      // Store booking in localStorage for demo purposes
      const bookings = JSON.parse(localStorage.getItem("userBookings") || "[]");
      const newBooking = {
        id: `BK-${Date.now()}`,
        ...appointmentData,
        bookedAt: new Date().toISOString(),
      };
      bookings.push(newBooking);
      localStorage.setItem("userBookings", JSON.stringify(bookings));

      setSuccessMessage(
        `🎉 Appointment confirmed! You'll receive a confirmation email shortly. Booking ID: ${newBooking.id}`
      );

      // Send confirmation message to chat and auto-open it
      const confirmationMessage = `✅ Appointment successfully booked with ${selectedDoctor.name} on ${selectedDate} at ${selectedTime}. Booking ID: ${newBooking.id}`;
      console.log("Sending confirmation to chat:", confirmationMessage); // Debug log

      // Dispatch custom event for booking confirmation
      const confirmationEvent = new CustomEvent("bookingConfirmation", {
        detail: {
          text: confirmationMessage,
          timestamp: new Date().toISOString(),
          id: `booking-${newBooking.id}`,
        },
      });
      console.log(
        "Dispatching booking confirmation event:",
        confirmationEvent.detail
      );
      window.dispatchEvent(confirmationEvent);
      console.log("Event dispatched successfully");

      // Clear the form after successful booking
      setSelectedDate("");
      setSelectedTime("");
      setSelectedSpecialty("");
      setSelectedDoctor(null);
      setNotes("");
      // setAvailableSlots([]); // No longer needed
      console.log("Appointment booking successful:", appointmentData);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">Book Your Appointment</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Select a specialty, choose your preferred date, and pick from
            available doctors
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">16</div>
              <div className="text-blue-100">Expert Doctors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">7</div>
              <div className="text-blue-100">Specialties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">7</div>
              <div className="text-blue-100">UK Cities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">24/7</div>
              <div className="text-blue-100">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Schedule Your Consultation
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose your specialty and preferred appointment time with our
              healthcare experts
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Processing your appointment...
              </span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <p className="font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Login Required */}
          {!currentUser && !authLoading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-xl mb-6 text-center shadow-sm">
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-3">🔒</span>
                <p className="font-medium">
                  Please{" "}
                  <Link
                    to="/login"
                    className="font-bold underline hover:text-blue-800"
                  >
                    log in
                  </Link>{" "}
                  to book an appointment.
                </p>
              </div>
            </div>
          )}

          {/* Auth Loading */}
          {authLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Checking login status...
              </span>
            </div>
          )}

          {currentUser && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-8">
              <div>
                <label
                  htmlFor="specialty-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Specialty
                </label>
                <select
                  id="specialty-select"
                  value={selectedSpecialty}
                  onChange={(e) => {
                    setSelectedSpecialty(e.target.value);
                    setSelectedDoctor(null);
                    setSelectedTime("");
                  }}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a specialty</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="appointmentDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Date
                </label>
                <div className="relative" ref={dateInputRef}>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    disabled={loading}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium shadow-sm hover:border-blue-300 transition-all duration-200 cursor-pointer text-left"
                  >
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Select a date"}
                  </button>
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isCalendarOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Custom Calendar */}
                  {isCalendarOpen && (
                    <CustomCalendar
                      selectedDate={selectedDate}
                      onDateSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime("");
                        setSelectedDoctor(null);
                      }}
                      minDate={new Date().toISOString().split("T")[0]}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  )}
                </div>
              </div>

              {/* Available Doctors Section */}
              {selectedSpecialty &&
                selectedDate &&
                availableDoctors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Available Doctors for {selectedSpecialty} on{" "}
                      {new Date(selectedDate).toLocaleDateString()}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {availableDoctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setSelectedTime("");
                          }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedDoctor?.id === doctor.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300"
                          }`}
                        >
                          <h4 className="text-lg font-semibold text-blue-600 mb-2">
                            {doctor.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {doctor.clinic}, {doctor.city}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            ⭐ {doctor.rating} ({doctor.reviews} reviews)
                          </p>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Available times:{" "}
                            {doctor.availability[selectedDate].join(", ")}
                          </p>
                          <p className="text-xs text-gray-500">{doctor.bio}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedSpecialty &&
                selectedDate &&
                availableDoctors.length === 0 && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-xl mb-6 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl mr-3">ℹ️</span>
                      <p>
                        No doctors available for {selectedSpecialty} on{" "}
                        {new Date(selectedDate).toLocaleDateString()}. Please
                        try a different date or specialty.
                      </p>
                    </div>
                  </div>
                )}

              {selectedDoctor && selectedDate && (
                <div className="mb-6">
                  <label
                    htmlFor="appointment-time"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Time
                  </label>
                  <select
                    id="appointment-time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a time</option>
                    {selectedDoctor.availability[selectedDate].map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-6">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  placeholder="Any specific notes or concerns?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !currentUser ||
                  !selectedDate ||
                  !selectedTime ||
                  !selectedSpecialty ||
                  !selectedDoctor
                }
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-medium transition-all duration-200 mt-6 shadow-lg hover:shadow-xl"
              >
                {loading ? "Booking..." : "Book Appointment"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default AppointmentBookingPage;
