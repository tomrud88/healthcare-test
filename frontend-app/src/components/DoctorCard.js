// src/components/DoctorCard.js

import React, { useState } from "react";
import BookingCalendar from "./BookingCalendar";

const DoctorCard = ({ doctor }) => {
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Get next available slot
  const getNextAvailable = () => {
    if (!doctor.availability) return "No availability";

    const availableDates = Object.keys(doctor.availability).sort();
    if (availableDates.length === 0) return "No availability";

    const firstDate = availableDates[0];
    const firstTime = doctor.availability[firstDate][0];

    if (firstDate && firstTime) {
      const dateTime = new Date(`${firstDate}T${firstTime}:00+00:00`);
      return dateTime.toLocaleString("en-GB", {
        timeZone: "Europe/London",
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return "No availability";
  };

  const handleBookingComplete = (booking) => {
    setBookingComplete(true);
    console.log("DoctorCard: Booking completed:", booking);

    // Send confirmation message to chat and auto-open it
    const confirmationMessage = `✅ Appointment successfully booked with ${doctor.name} on ${booking.date} at ${booking.time}. Booking ID: ${booking.id}`;
    console.log(
      "DoctorCard: Sending confirmation to chat:",
      confirmationMessage
    );

    // Dispatch custom event for booking confirmation (same as AppointmentBookingPage)
    const confirmationEvent = new CustomEvent("bookingConfirmation", {
      detail: {
        text: confirmationMessage,
        timestamp: new Date().toISOString(),
        id: `doctor-booking-${booking.id}`,
      },
    });
    console.log(
      "DoctorCard: Dispatching booking confirmation event:",
      confirmationEvent.detail
    );
    window.dispatchEvent(confirmationEvent);
    console.log("DoctorCard: Event dispatched successfully");

    // Here you could also update the UI or sync with backend
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg text-center transition-all duration-300 hover:scale-105 border border-gray-200">
        <img
          src={doctor.image}
          alt={doctor.name}
          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-600 shadow-sm"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/150x150/CCCCCC/000000?text=Doctor";
          }}
        />
        <h3 className="text-xl font-bold text-gray-800 mb-2">{doctor.name}</h3>
        <p className="text-blue-600 text-md font-semibold mb-1">
          {doctor.specialty}
        </p>
        <p className="text-gray-500 text-sm mb-3 flex items-center justify-center gap-1">
          <span>📍</span>
          {doctor.city}
          {doctor.clinic && ` • ${doctor.clinic}`}
        </p>
        <div className="flex items-center justify-center gap-1 mb-3">
          <span className="text-yellow-500 text-lg">⭐</span>
          <span className="text-gray-600 text-sm font-medium">
            {doctor.rating} ({doctor.reviews} reviews)
          </span>
        </div>

        <div className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full mb-3 inline-block">
          📅 Next: {getNextAvailable()}
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {doctor.bio}
        </p>
        {doctor.modalities && (
          <div className="flex justify-center gap-2 mb-4">
            {doctor.modalities.includes("in_person") && (
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                In-Person
              </span>
            )}
            {doctor.modalities.includes("telemedicine") && (
              <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                Online
              </span>
            )}
          </div>
        )}

        {bookingComplete ? (
          <div className="bg-green-100 text-green-700 px-6 py-2 rounded-xl font-semibold w-full mb-2">
            ✅ Appointment Booked
          </div>
        ) : null}

        <button
          onClick={() => setShowBookingCalendar(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-md w-full"
        >
          📅 Book Appointment
        </button>
      </div>

      {showBookingCalendar && (
        <BookingCalendar
          doctor={doctor}
          onClose={() => setShowBookingCalendar(false)}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </>
  );
};

export default DoctorCard;
