// frontend-app/src/AppRoutes.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Import useAuth hook

// Import your page components (we'll create these next)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AppointmentBookingPage from './pages/AppointmentBookingPage';
import DigitalRegistrationPage from './pages/DigitalRegistrationPage';

// A simple PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // You can render a loading spinner or a placeholder here
    return <div>Loading authentication...</div>;
  }

  // If user is logged in, render the children (protected component)
  // Otherwise, redirect to login page
  return currentUser ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <PrivateRoute>
              <AppointmentBookingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/digital-registration"
          element={
            <PrivateRoute>
              <DigitalRegistrationPage />
            </PrivateRoute>
          }
        />

        {/* Default redirect to dashboard if logged in, or login if not */}
        <Route
          path="*"
          element={
            <PrivateRoute>
              <Navigate to="/dashboard" />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default AppRoutes;