// src/components/DoctorCard.js

import React from 'react';

const DoctorCard = ({ doctor }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg text-center transition-all duration-300 hover:scale-105 border border-gray-200">
      <img
        src={doctor.image}
        alt={doctor.name}
        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-600 shadow-sm"
        onError={(e) => {
          e.currentTarget.src = "https://placehold.co/150x150/CCCCCC/000000?text=Doctor";
        }}
      />
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {doctor.name}
      </h3>
      <p className="text-blue-600 text-md font-semibold mb-2">
        {doctor.specialty}
      </p>
      <div className="flex items-center justify-center gap-1 mb-4">
        <span className="text-yellow-500 text-lg">⭐</span>
        <span className="text-gray-600 text-sm font-medium">
          {doctor.rating} ({doctor.reviews} reviews)
        </span>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        {doctor.bio}
      </p>
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-md"
      >
        View Profile
      </button>
    </div>
  );
};

export default DoctorCard;
