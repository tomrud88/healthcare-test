// src/components/PersonalizedContentDemo.js

import React from 'react';

const PersonalizedContentDemo = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-200 p-8 lg:p-12 text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">
        Personalized Health Education
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        Receive health insights and educational materials tailored just for you.
      </p>
      <div className="flex justify-center items-center gap-4">
        <div className="text-6xl">💡</div>
        <p className="text-xl text-gray-600">
          "Based on your recent check-up, here's an article about maintaining healthy blood pressure!"
        </p>
      </div>
      <button
        className="mt-8 bg-green-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-md"
      >
        Explore Your Health Insights
      </button>
    </div>
  );
};

export default PersonalizedContentDemo;
