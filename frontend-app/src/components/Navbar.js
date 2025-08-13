// src/components/Navbar.js

import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from '../AuthContext'; // Import AuthContext to access user info and logout

export default function Navbar() {
  const { pathname } = useLocation();
  const { currentUser, signOutUser } = useContext(AuthContext); // Get currentUser and signOutUser from AuthContext
  const navigate = useNavigate();

  // Helper function to apply dynamic classes for active links
  const linkClasses = (path) =>
    `relative px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
      pathname === path
        ? "bg-ds-bg-highlight shadow-inner-glow" // Active link styling
        : "text-ds-text-body hover:bg-ds-bg-highlight/50" // Inactive link styling
    }` + (pathname === path ? " active-link" : ""); // Additional class for potential custom CSS

  // Handle user logout
  const handleLogout = async () => {
    console.log("Attempting to log out...");
    if (signOutUser) {
      try {
        await signOutUser(); // Call the signOut function from AuthContext
        navigate('/'); // Redirect to landing page after logout
      } catch (error) {
        console.error("Logout failed:", error);
        // You might want to display a user-friendly error message here
      }
    } else {
      console.warn("signOutUser function not available in AuthContext.");
      navigate('/'); // Fallback redirect even if signOutUser isn't defined
    }
  };

  return (
    <nav className="sticky top-0 bg-ds-white/90 backdrop-blur-md shadow-modern z-50 border-b border-ds-gray/20">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo and Site Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300"
            style={{
              background: "linear-gradient(135deg, #5B73FF 0%, #445CE0 100%)",
            }}
          >
            N
          </div>
          <span
            className="text-2xl font-bold nextgen-doctor-text-gradient" // Custom class for text gradient
          >
            NextGen Doctor
          </span>
        </Link>

        {/* Main Navigation Links */}
        <div className="hidden md:flex items-center gap-2 bg-ds-light-gray/50 p-2 rounded-3xl">
          <Link
            to="/"
            className={linkClasses("/")}
            style={{ color: pathname === "/" ? "#5B73FF" : "#6B7280" }}
          >
            Home
          </Link>

          {/* Always visible Doctors and Services tabs */}
          <Link
            to="/doctors"
            className={linkClasses("/doctors")}
            style={{ color: pathname === "/doctors" ? "#5B73FF" : "#6B7280" }}
          >
            Doctors
          </Link>
          <Link
            to="/services"
            className={linkClasses("/services")}
            style={{ color: pathname === "/services" ? "#5B73FF" : "#6B7280" }}
          >
            Services
          </Link>

          {currentUser ? (
            // Links for logged-in users
            <>
              <Link
                to="/book-appointment"
                className={linkClasses("/book-appointment")}
                style={{ color: pathname === "/book-appointment" ? "#5B73FF" : "#6B7280" }}
              >
                Book Appointment
              </Link>
              <Link
                to="/my-appointments"
                className={linkClasses("/my-appointments")}
                style={{ color: pathname === "/my-appointments" ? "#5B73FF" : "#6B7280" }}
              >
                My Appointments
              </Link>
            </>
          ) : (
            // Links for logged-out users
            <>
              <Link
                to="/login"
                className={linkClasses("/login")}
                style={{ color: pathname === "/login" ? "#5B73FF" : "#6B7280" }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={linkClasses("/register")}
                style={{ color: pathname === "/register" ? "#5B73FF" : "#6B7280" }}
              >
                Register
              </Link>
            </>
          )}

          {/* Removed placeholder comments for future expansion as Doctors/Services are now active */}
        </div>

        {/* Authentication and Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {currentUser ? (
            // If user is logged in, show Logout button
            <button
              onClick={handleLogout}
              className="group relative px-6 py-3 rounded-2xl transition-all duration-300 shadow-modern hover:shadow-modern-hover font-semibold text-white bg-ds-primary-blue"
              style={{ textDecoration: "none" }}
            >
              <span className="relative z-10">Logout ({currentUser.email.split('@')[0]})</span> {/* Show part of email */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "linear-gradient(90deg, #445CE0 0%, #3346B3 100%)",
                }}
              ></div>
            </button>
          ) : (
            // If user is not logged in, these links are now handled in the main nav block
            null
          )}
        </div>

        {/* Mobile menu button (for future implementation) */}
        <div className="md:hidden">
          {/* You'd add a hamburger icon and mobile menu logic here */}
          <button className="text-ds-dark-gray text-2xl">☰</button>
        </div>
      </div>
    </nav>
  );
}
