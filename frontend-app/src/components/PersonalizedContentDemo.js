// src/components/PersonalizedContentDemo.js

import React, { useState } from "react";

const PersonalizedContentDemo = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleButtonClick = () => {
    setShowSearch((prev) => !prev);
    setResult("");
    setSearchTerm("");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    setResult("");
    try {
      // Call backend proxy for OpenAI health search
      const response = await fetch(
        "https://us-central1-healthcare-patient-portal.cloudfunctions.net/openaiHealthSearch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchTerm }),
        }
      );
      if (!response.ok) throw new Error("Failed to fetch info");
      const data = await response.json();
      setResult(data.result || "No info found.");
    } catch (err) {
      setResult("Sorry, could not retrieve info. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
          "Based on your recent check-up, here's an article about maintaining
          healthy blood pressure!"
        </p>
      </div>
      <button
        className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-md"
        onClick={handleButtonClick}
      >
        {showSearch ? "Close Health Search" : "Search Health Info (LLM)"}
      </button>

      {showSearch && (
        <form
          className="mt-8 flex flex-col items-center"
          onSubmit={handleSearch}
        >
          <input
            type="text"
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Search any health/medical info (e.g. diabetes, cancer)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-md"
            disabled={loading || !searchTerm.trim()}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      )}

      {result && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-left text-gray-800">
          <h3 className="font-semibold text-blue-700 mb-2">LLM Health Info:</h3>
          <div>{result}</div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedContentDemo;
