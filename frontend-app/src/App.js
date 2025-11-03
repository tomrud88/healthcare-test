import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { ChatProvider } from "./ChatContext";
import Navbar from "./components/Navbar"; // Correctly import the Navbar component
import Footer from "./components/Footer"; // Import the Footer component
import FloatingChatButton from "./components/FloatingChatButton"; // Import AI Chat Agent
import AppointmentBookingPage from "./pages/AppointmentBookingPage";
import AppointmentListPage from "./pages/AppointmentListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Landing from "./pages/Landing";
import DoctorsPage from "./pages/DoctorsPage"; // Import DoctorsPage for home
import ProfilePage from "./pages/ProfilePage"; // Import ProfilePage
import GymsPage from "./pages/GymsPage"; // Import new Gyms Page

// Placeholder page components for other routes
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/PagesComingSoon";
import DatabaseMigration from "./components/DatabaseMigration";

function AppContent() {
  return (
    <>
      {/* Always show navbar now that we removed Nuffield home page */}
      <Navbar />
      {/* Added padding to prevent content from being hidden under the fixed Navbar */}
      <div className="App" style={{ paddingTop: "20px" }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* Add gyms page route */}
          <Route
            path="/book-appointment"
            element={<AppointmentBookingPage />}
          />
          <Route path="/appointments" element={<AppointmentListPage />} />
          <Route path="/my-appointments" element={<AppointmentListPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Route for ProfilePage */}
          {/* Updated routes for Navbar links */}
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/hospitals" element={<Landing />} />
          <Route path="/gyms" element={<GymsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          {/* Database migration route - for admin use */}
          <Route path="/migration" element={<DatabaseMigration />} />
        </Routes>
      </div>
      <Footer /> {/* Render the Footer component here */}
      {/* AI Chat Agent - Available on all pages */}
      <FloatingChatButton />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <AppContent />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
