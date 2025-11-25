// src/components/Navbar.js

import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext"; // Import AuthContext to access user info and logout

export default function Navbar() {
  const { pathname } = useLocation();
  const { currentUser, signOutUser } = useContext(AuthContext); // Get currentUser and signOutUser from AuthContext
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is on a dropdown link or button (let them handle their own actions)
      if (event.target.closest("a[href]") || event.target.closest("button")) {
        return; // Don't close dropdown if clicking on a link or button
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper function to apply dynamic classes for active links
  const linkClasses = (path) =>
    `relative px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
      pathname === path
        ? "bg-ds-bg-highlight shadow-inner-glow" // Active link styling
        : "text-ds-text-body hover:bg-ds-bg-highlight/50" // Inactive link styling
    }` + (pathname === path ? " active-link" : ""); // Additional class for potential custom CSS

  // Handle navigation and close dropdown
  const handleNavigation = (path, event) => {
    event.preventDefault(); // Prevent default link behavior
    console.log(`Navigating to: ${path}`);
    setIsProfileDropdownOpen(false); // Close dropdown
    navigate(path); // Navigate programmatically
  };
  // Handle user logout
  const handleLogout = async () => {
    console.log("Attempting to log out...");
    console.log("signOutUser function available:", !!signOutUser);
    console.log("currentUser:", currentUser);

    if (signOutUser) {
      try {
        console.log("Calling signOutUser...");
        await signOutUser(); // Call the signOut function from AuthContext
        console.log("signOutUser completed successfully");
        navigate("/"); // Redirect to landing page after logout
      } catch (error) {
        console.error("Logout failed:", error);
        // Try direct Firebase signOut as fallback
        try {
          console.log("Trying direct Firebase signOut...");
          const { signOut } = await import("firebase/auth");
          const { auth } = await import("../firebaseConfig");
          await signOut(auth);
          console.log("Direct Firebase signOut successful");
          navigate("/");
        } catch (fallbackError) {
          console.error("Fallback logout also failed:", fallbackError);
        }
      }
    } else {
      console.warn("signOutUser function not available in AuthContext.");
      // Try direct Firebase signOut
      try {
        console.log("Using direct Firebase signOut as primary method...");
        const { signOut } = await import("firebase/auth");
        const { auth } = await import("../firebaseConfig");
        await signOut(auth);
        console.log("Direct Firebase signOut successful");
        navigate("/");
      } catch (directError) {
        console.error("Direct Firebase signOut failed:", directError);
        navigate("/"); // Fallback redirect even if signOut fails
      }
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
            NextGen HealthCare
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

          {/* Navigation tabs */}
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
                style={{
                  color:
                    pathname === "/book-appointment" ? "#5B73FF" : "#6B7280",
                }}
              >
                Book Appointment
              </Link>
              <Link
                to="/my-appointments"
                className={linkClasses("/my-appointments")}
                style={{
                  color:
                    pathname === "/my-appointments" ? "#5B73FF" : "#6B7280",
                }}
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
                style={{
                  color: pathname === "/register" ? "#5B73FF" : "#6B7280",
                }}
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
            // If user is logged in, show Profile dropdown
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="group relative px-6 py-3 rounded-2xl transition-all duration-300 shadow-modern hover:shadow-modern-hover font-semibold text-white bg-ds-primary-blue flex items-center gap-2"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white"
                  style={{ backgroundColor: "#5B73FF" }}
                >
                  👤
                </div>
                <span className="relative z-10">
                  {currentUser.email.split("@")[0]}
                </span>
                <span
                  className={`transition-transform duration-200 ${
                    isProfileDropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(90deg, #445CE0 0%, #3346B3 100%)",
                  }}
                ></div>
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <a
                    href="/profile"
                    onClick={(e) => handleNavigation("/profile", e)}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span className="mr-3">👤</span>
                    View Profile
                  </a>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Logout button clicked!");
                      setIsProfileDropdownOpen(false);
                      try {
                        await handleLogout();
                        console.log("Logout process completed successfully");
                      } catch (error) {
                        console.error("Error during logout process:", error);
                      }
                    }}
                    className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="mr-3">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : // If user is not logged in, these links are now handled in the main nav block
          null}
        </div>

        {/* Mobile menu - simplified profile button */}
        <div className="md:hidden">
          {currentUser ? (
            <div className="relative" ref={mobileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ds-primary-blue text-white text-sm font-medium"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ backgroundColor: "#445CE0" }}
                >
                  👤
                </div>
                <span>{currentUser.email.split("@")[0]}</span>
                <span
                  className={`text-xs transition-transform duration-200 ${
                    isProfileDropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* Mobile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <a
                    href="/profile"
                    onClick={(e) => handleNavigation("/profile", e)}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span className="mr-3">👤</span>
                    View Profile
                  </a>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={() => {
                      console.log("Mobile: Logging out");
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="mr-3">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Mobile menu button for non-logged in users
            <button className="text-ds-dark-gray text-2xl">☰</button>
          )}
        </div>
      </div>
    </nav>
  );
}
