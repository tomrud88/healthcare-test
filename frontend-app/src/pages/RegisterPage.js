// frontend-app/src/pages/RegisterPage.js

import React, { useState, useEffect } from "react"; // Import useEffect
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import your Firebase auth instance
import { PatientService } from "../services/patientService";

export default function RegisterPage() {
  // State variables for form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState(""); // Optional
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(""); // State for displaying error messages
  const [loading, setLoading] = useState(false); // State for handling loading/submission state
  const [passwordShown, setPasswordShown] = useState(false);
  const [confirmPasswordShown, setConfirmPasswordShown] = useState(false);

  const navigate = useNavigate(); // Hook for programmatic navigation

  // UseEffect to clear the email, password, and confirm password fields on component mount
  useEffect(() => {
    setEmail(""); // Set email state to empty string when component mounts
    setPassword(""); // Clear password field
    setConfirmPassword(""); // Clear confirm password field
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setPasswordShown(!passwordShown);
    } else if (field === "confirmPassword") {
      setConfirmPasswordShown(!confirmPasswordShown);
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setError(""); // Clear any previous errors
    setLoading(true); // Set loading to true while processing

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // 1. Register user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("Registered user with Firebase Auth:", user);

      // 2. Create patient profile using PatientService
      const patientData = {
        name: firstName,
        surname: lastName,
        email: user.email,
        phoneNumber: phone,
        address: `${address1}${address2 ? ", " + address2 : ""}`,
        city: city,
        postcode: postcode,
        bookings: [],
      };

      const result = await PatientService.createPatientProfile(
        user.uid,
        patientData
      );
      console.log("Patient profile created:", result.message);

      // 3. Navigate to the login page after successful registration and profile creation
      navigate("/login");
    } catch (err) {
      // Catch any errors during Firebase registration or backend call
      let errorMessage = "Registration failed. Please try again.";
      if (err.code) {
        // Firebase Auth specific errors
        if (err.code === "auth/email-already-in-use") {
          errorMessage =
            "This email is already in use. Please try logging in or use a different email.";
        } else if (err.code === "auth/invalid-email") {
          errorMessage = "Please enter a valid email address.";
        } else if (err.code === "auth/weak-password") {
          errorMessage =
            "Password is too weak. It should be at least 6 characters.";
        } else {
          errorMessage = err.message; // Fallback for other Firebase errors
        }
      } else {
        // Backend or network errors
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error("Registration error:", err);
    } finally {
      setLoading(false); // Set loading back to false
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-blue-600">
          Welcome to New Patient's Registration
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Please create your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first-name"
                className="block text-blue-600 font-semibold mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="first-name"
                name="first-name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="last-name"
                className="block text-blue-600 font-semibold mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="last-name"
                name="last-name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-blue-600 font-semibold mb-2"
            >
              Email ID
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-blue-600 font-semibold mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+44 7123 456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="address-1"
              className="block text-blue-600 font-semibold mb-2"
            >
              Address
            </label>
            <input
              type="text"
              id="address-1"
              name="address-1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              placeholder="Street address"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              required
            />
            <input
              type="text"
              id="address-2"
              name="address-2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Apartment, suite, etc. (optional)"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="city"
                className="block text-blue-600 font-semibold mb-2"
              >
                City / Town
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hounslow"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="postcode"
                className="block text-blue-600 font-semibold mb-2"
              >
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="TW3 1ES"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="password"
              className="block text-blue-600 font-semibold mb-2"
            >
              Password
            </label>
            <input
              type={passwordShown ? "text" : "password"}
              id="password"
              name="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="absolute inset-y-0 right-0 top-7 flex items-center pr-3 cursor-pointer"
              onClick={() => togglePasswordVisibility("password")}
            >
              {passwordShown ? (
                // Eye-slash icon (hide password)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.367zM10 17a7 7 0 100-14 7 7 0 000 14z"
                    clipRule="evenodd"
                  />
                  <path d="M1.293 1.293a1 1 0 011.414 0l16 16a1 1 0 01-1.414 1.414l-16-16a1 1 0 010-1.414z" />
                </svg>
              ) : (
                // Eye icon (show password)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </div>

          <div className="relative">
            <label
              htmlFor="confirm-password"
              className="block text-blue-600 font-semibold mb-2"
            >
              Confirm Password
            </label>
            <input
              type={confirmPasswordShown ? "text" : "password"}
              id="confirm-password"
              name="confirm-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span
              className="absolute inset-y-0 right-0 top-7 flex items-center pr-3 cursor-pointer"
              onClick={() => togglePasswordVisibility("confirmPassword")}
            >
              {confirmPasswordShown ? (
                // Eye-slash icon (hide password)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.367zM10 17a7 7 0 100-14 7 7 0 000 14z"
                    clipRule="evenodd"
                  />
                  <path d="M1.293 1.293a1 1 0 011.414 0l16 16a1 1 0 01-1.414 1.414l-16-16a1 1 0 010-1.414z" />
                </svg>
              ) : (
                // Eye icon (show password)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
            disabled={loading} // Disable button while loading
          >
            {loading ? "Registering..." : "Register"}
          </button>
          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-semibold no-underline"
            >
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
