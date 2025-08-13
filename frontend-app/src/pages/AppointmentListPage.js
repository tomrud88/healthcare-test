// frontend-app/src/pages/AppointmentListPage.js

import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import { AuthContext } from "../AuthContext"; // To get the logged-in user's UID and getIdToken

// --- Cloud Function URLs from environment variables ---
const GET_APPOINTMENTS_API_URL = process.env.REACT_APP_GET_APPOINTMENTS_API_URL;
const CANCEL_APPOINTMENT_API_URL =
  process.env.REACT_APP_CANCEL_APPOINTMENT_API_URL;

// Validate that environment variables are set
if (!GET_APPOINTMENTS_API_URL || !CANCEL_APPOINTMENT_API_URL) {
  console.error("Missing required environment variables for API URLs");
}

const AppointmentListPage = () => {
  // Destructure getIdToken from AuthContext
  const {
    currentUser,
    loading: authLoading,
    getIdToken,
  } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Function to fetch appointments (re-usable)
  const fetchAppointments = async () => {
    // Wait until auth status is known and currentUser is loaded
    if (authLoading) return;

    setLoading(true);
    setError("");
    setSuccessMessage(""); // Clear messages on new fetch

    if (!currentUser) {
      setError("Please log in to view your appointments.");
      setLoading(false);
      return;
    }

    try {
      // Get the Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error(
          "Could not get authentication token. Please log in again."
        );
      }

      const response = await fetch(GET_APPOINTMENTS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`, // Include the ID token
        },
        body: JSON.stringify({ patientId: currentUser.uid }), // Still send patientId for backend filtering
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to fetch appointments: ${response.statusText}`
        );
      }

      const data = await response.json();
      setAppointments(data.appointments || []);

      if (data.appointments && data.appointments.length === 0) {
        setError("You have no booked appointments.");
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(
        err.message ||
          "An unexpected error occurred while fetching appointments."
      );
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch appointments on component mount and when currentUser/authLoading changes
  useEffect(() => {
    fetchAppointments();
  }, [currentUser, authLoading]); // Dependency array

  // New function to handle appointment cancellation
  const handleCancelAppointment = async (appointmentId) => {
    setLoading(true); // Show loading feedback
    setError("");
    setSuccessMessage("");

    if (!currentUser) {
      setError("You must be logged in to cancel an appointment.");
      setLoading(false);
      return;
    }

    try {
      // Get the Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error(
          "Could not get authentication token. Please log in again."
        );
      }

      const response = await fetch(CANCEL_APPOINTMENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`, // Include the ID token
        },
        body: JSON.stringify({
          appointmentId: appointmentId,
          patientId: currentUser.uid, // Send patientId for authorization on backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Failed to cancel appointment: ${response.statusText}`
        );
      }

      const result = await response.json();
      setSuccessMessage(
        result.message || "Appointment cancelled successfully!"
      );

      // Refresh the list of appointments after successful cancellation
      fetchAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      setError(
        err.message ||
          "An unexpected error occurred while cancelling the appointment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          p: 3,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Your Appointments
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {authLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Checking login status...</Typography>
          </Box>
        ) : !currentUser ? (
          <Alert severity="info" sx={{ mt: 2, textAlign: "center" }}>
            Please log in to view your appointments.
          </Alert>
        ) : loading && appointments.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading appointments...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : appointments.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            You have no booked appointments.
          </Alert>
        ) : (
          <List>
            {appointments.map((appointment) => (
              <React.Fragment key={appointment.id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    // Only show cancel button if appointment is not already cancelled
                    appointment.status !== "cancelled" && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleCancelAppointment(appointment.id)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" component="span">
                        {appointment.service_type}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: "block", mt: 0.5 }}>
                        <Typography
                          sx={{ display: "inline" }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Date: {appointment.appointment_date} at{" "}
                          {appointment.appointment_time}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          Status: {appointment.status}
                        </Typography>
                        {appointment.notes && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            Notes: {appointment.notes}
                          </Typography>
                        )}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          Booked on:{" "}
                          {new Date(appointment.created_at).toLocaleString()}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          Patient ID: {appointment.patient_id}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          Patient Email: {appointment.patient_email}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
};

export default AppointmentListPage;
