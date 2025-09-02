// frontend-app/src/pages/AppointmentListPage.js

import React, { useState, useEffect, useContext, useCallback } from "react";
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
import { AuthContext } from "../AuthContext"; // To get the logged-in user's UID
import { PatientService } from "../services/patientService"; // Use PatientService to fetch appointments

const AppointmentListPage = () => {
  // Destructure from AuthContext
  const { currentUser, loading: authLoading } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Function to fetch appointments (re-usable)
  const fetchAppointments = useCallback(async () => {
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
      console.log("Fetching appointments for patient:", currentUser.uid);

      // Use PatientService to get appointments from Firestore
      const appointmentsData = await PatientService.getPatientAppointments(
        currentUser.uid
      );

      console.log("Retrieved appointments:", appointmentsData);
      setAppointments(appointmentsData || []);

      if (!appointmentsData || appointmentsData.length === 0) {
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
  }, [authLoading, currentUser]);

  // Effect to fetch appointments on component mount and when currentUser/authLoading changes
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]); // Now fetchAppointments is stable due to useCallback

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
      // For now, just show a message that cancellation is not implemented yet
      // TODO: Implement proper cancellation with backend support
      setError(
        "Appointment cancellation feature is coming soon. Please contact the clinic directly."
      );

      // Refresh the list of appointments
      await fetchAppointments();
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
              <React.Fragment
                key={
                  appointment.bookingId ||
                  appointment.id ||
                  `booking-${Date.now()}`
                }
              >
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    // Only show cancel button if appointment is not already cancelled
                    appointment.status !== "cancelled" && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() =>
                          handleCancelAppointment(
                            appointment.bookingId || appointment.id
                          )
                        }
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
                        {appointment.doctorName ||
                          appointment.doctor ||
                          "Doctor Appointment"}
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
                          Date:{" "}
                          {appointment.date || appointment.appointmentDate} at{" "}
                          {appointment.time || appointment.appointmentTime}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          Specialty: {appointment.specialty || "General"}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          Location:{" "}
                          {appointment.place ||
                            appointment.location ||
                            "Healthcare Center"}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          Status: {appointment.status}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          Booked on:{" "}
                          {new Date(
                            appointment.createdAt ||
                              appointment.created_at ||
                              Date.now()
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
};

export default AppointmentListPage;
