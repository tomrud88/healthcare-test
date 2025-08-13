import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Navbar from "./components/Navbar"; // Correctly import the Navbar component
import Footer from "./components/Footer"; // Import the Footer component
import FloatingChatButton from "./components/FloatingChatButton"; // Import AI Chat Agent
import AppointmentBookingPage from "./pages/AppointmentBookingPage";
import AppointmentListPage from "./pages/AppointmentListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Landing from "./pages/Landing";
import DashboardPage from "./pages/DashboardPage"; // Import DashboardPage

// Placeholder page components for other routes
import DoctorsPage from "./pages/PagesComingSoon";
import ServicesPage from "./pages/PagesComingSoon";
import AboutPage from "./pages/PagesComingSoon";

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Using the Navbar component here */}
        <Navbar />
        {/* Added padding to prevent content from being hidden under the fixed Navbar */}
        <div className="App" style={{ paddingTop: "20px" }}>
          <Routes>
            {/* Set Landing as the default home page */}
            <Route path="/" element={<Landing />} />
            <Route
              path="/book-appointment"
              element={<AppointmentBookingPage />}
            />
            <Route path="/my-appointments" element={<AppointmentListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />{" "}
            {/* Route for DashboardPage */}
            {/* Placeholder routes for Navbar links */}
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
        <Footer /> {/* Render the Footer component here */}
        {/* AI Chat Agent - Available on all pages */}
        <FloatingChatButton />
      </Router>
    </AuthProvider>
  );
}

export default App;
