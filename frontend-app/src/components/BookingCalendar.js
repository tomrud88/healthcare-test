// src/components/BookingCalendar.js

import React, { useState, useContext } from "react";
import { createPortal } from "react-dom";
import { AuthContext } from "../AuthContext";
import { PatientService } from "../services/patientService";

const BookingCalendar = ({ doctor, onClose, onBookingComplete }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [step, setStep] = useState(1); // 1: Select Date, 2: Select Time, 3: Enter Details, 4: Confirmation
  const [isLoading, setIsLoading] = useState(false);

  // Get current user from AuthContext
  const { currentUser } = useContext(AuthContext);

  // Get available dates from doctor's availability
  const availableDates = Object.keys(doctor.availability || {}).sort();

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep(2);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleBooking = async () => {
    if (!patientInfo.name || (!patientInfo.email && !patientInfo.phone)) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Create booking data
      const bookingData = PatientService.formatBookingData(
        doctor.id,
        doctor.name,
        selectedDate,
        selectedTime,
        doctor.specialty
      );

      // If user is authenticated, save booking to their profile
      if (currentUser) {
        try {
          console.log("Attempting to save booking for user:", currentUser.uid);
          console.log("Booking data:", bookingData);

          const result = await PatientService.addBooking(
            currentUser.uid,
            bookingData
          );
          console.log("Booking saved successfully. Result:", result);
        } catch (error) {
          console.error("Error saving booking to patient profile:", error);
          alert(`Error saving booking: ${error.message}`);
          // Continue with booking even if saving to profile fails
        }
      } else {
        console.log("No current user found, skipping booking save");
      }

      // Create booking object for UI
      const booking = {
        id: bookingData.bookingId || `BK-${Date.now()}`,
        doctor: doctor,
        date: selectedDate,
        time: selectedTime,
        patient: patientInfo,
        status: "confirmed",
      };

      setStep(4);

      // Dispatch custom event for chat confirmation
      window.dispatchEvent(
        new CustomEvent("bookingConfirmation", {
          detail: {
            booking,
            message: `Appointment booked with ${doctor.name} on ${selectedDate} at ${selectedTime}`,
          },
        })
      );

      if (onBookingComplete) {
        onBookingComplete(booking);
      }
    } catch (error) {
      console.error("Error during booking:", error);
      alert("There was an error processing your booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}:00`).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[99999]"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-white rounded-2xl max-w-7xl w-full max-h-[98vh] overflow-y-auto shadow-2xl"
        style={{ maxWidth: "90vw", width: "90vw" }}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Book Appointment
              </h2>
              <div className="flex items-center gap-6 text-gray-600">
                <span className="flex items-center gap-2 text-lg">
                  👨‍⚕️ {doctor.name}
                </span>
                <span className="flex items-center gap-2 text-lg">
                  🏥 {doctor.clinic}
                </span>
                <span className="flex items-center gap-2 text-lg">
                  📍 {doctor.city}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl font-light hover:bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-8 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center space-x-6">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                    step >= stepNum
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`w-12 h-1 ${
                      step > stepNum ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-12 mt-4 text-sm text-gray-600 font-medium">
            <span>Select Date</span>
            <span>Select Time</span>
            <span>Your Details</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Dates</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {availableDates.map((date) => {
                  const slotsCount = doctor.availability[date].length;
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="font-semibold text-gray-800">
                        {formatDate(date)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {slotsCount} slots available
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 2 && selectedDate && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Available Times</h3>
              <p className="text-gray-600 mb-4">{formatDate(selectedDate)}</p>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {doctor.availability[selectedDate].map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className="p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-center font-semibold"
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                ← Back to dates
              </button>
            </div>
          )}

          {/* Step 3: Enter Patient Details */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Information</h3>
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <div className="text-sm text-blue-800">
                  <strong>Selected Appointment:</strong>
                  <br />
                  📅 {formatDate(selectedDate)} at {formatTime(selectedTime)}
                  <br />
                  👨‍⚕️ {doctor.name} - {doctor.clinic}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={patientInfo.name}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, name: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={patientInfo.email}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, email: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={patientInfo.phone}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, phone: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="07123 456789"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  * Please provide either an email address or phone number
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-green-600 mb-4">
                Appointment Confirmed!
              </h3>
              <div className="bg-green-50 p-6 rounded-xl mb-6 text-left">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Booking Details:
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>
                    📋 <strong>Reference:</strong> BK-{Date.now()}
                  </div>
                  <div>
                    👨‍⚕️ <strong>Doctor:</strong> {doctor.name}
                  </div>
                  <div>
                    🏥 <strong>Clinic:</strong> {doctor.clinic}
                  </div>
                  <div>
                    📅 <strong>Date:</strong> {formatDate(selectedDate)}
                  </div>
                  <div>
                    🕐 <strong>Time:</strong> {formatTime(selectedTime)}
                  </div>
                  <div>
                    👤 <strong>Patient:</strong> {patientInfo.name}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                You'll receive a confirmation{" "}
                {patientInfo.email ? "email" : "SMS"} shortly. Please arrive 10
                minutes early for your appointment.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BookingCalendar;
